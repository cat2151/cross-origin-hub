use std::{
    collections::HashMap,
    env,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
    time::{SystemTime, UNIX_EPOCH},
};

use axum::{
    Json, Router,
    extract::{
        State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::HeaderMap,
    response::{IntoResponse, Response},
    routing::get,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde_json::{Value, json};
use tokio::{
    net::TcpListener,
    sync::{
        RwLock,
        mpsc::{UnboundedSender, unbounded_channel},
    },
};

type SharedState = Arc<AppState>;

const DEFAULT_PORT: u16 = 8787;

struct AppState {
    clients: RwLock<HashMap<usize, ClientHandle>>,
    next_id: AtomicUsize,
}

struct ClientHandle {
    sender: UnboundedSender<Message>,
}

#[tokio::main]
async fn main() {
    let env_port = env::var("HUB_PORT").ok();
    let port = resolve_port(env_port.as_deref());
    let host = env::var("HUB_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

    let state = Arc::new(AppState {
        clients: RwLock::new(HashMap::new()),
        next_id: AtomicUsize::new(1),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/", get(ws_handler))
        .with_state(state.clone());

    let listener = TcpListener::bind((host.as_str(), port))
        .await
        .unwrap_or_else(|error| {
            eprintln!("Failed to bind to ws://{host}:{port}: {error}");
            std::process::exit(1);
        });

    println!("Cross-Origin Hub server listening on ws://{host}:{port}");

    if let Err(error) = axum::serve(listener, app.into_make_service()).await {
        eprintln!("Server error: {error}");
    }
}

async fn health() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

async fn ws_handler(
    State(state): State<SharedState>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Response {
    let origin = headers
        .get("origin")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    ws.on_upgrade(move |socket| handle_socket(state, socket, origin))
}

async fn handle_socket(state: SharedState, socket: WebSocket, origin: String) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = unbounded_channel::<Message>();

    let client_id = state.next_id.fetch_add(1, Ordering::Relaxed);

    state
        .clients
        .write()
        .await
        .insert(client_id, ClientHandle { sender: tx.clone() });

    let send_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if ws_sender.send(message).await.is_err() {
                break;
            }
        }
    });

    while let Some(result) = ws_receiver.next().await {
        match result {
            Ok(Message::Text(text)) => process_incoming(&state, client_id, &origin, &text).await,
            Ok(Message::Binary(bytes)) => match String::from_utf8(bytes) {
                Ok(text) => process_incoming(&state, client_id, &origin, &text).await,
                Err(_) => send_error(&state, client_id, "Invalid JSON message").await,
            },
            Ok(Message::Close(_)) => break,
            Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => {}
            Err(_) => break,
        }
    }

    state.clients.write().await.remove(&client_id);
    drop(tx);
    let _ = send_task.await;
}

async fn process_incoming(state: &SharedState, client_id: usize, origin: &str, raw: &str) {
    match build_broadcast_payload(raw, origin) {
        Ok(outgoing) => broadcast(state, client_id, &outgoing).await,
        Err(error) => send_error(state, client_id, &error).await,
    }
}

fn build_broadcast_payload(raw: &str, origin: &str) -> Result<String, String> {
    let payload: Value =
        serde_json::from_str(raw).map_err(|_| "Invalid JSON message".to_string())?;

    let Some(event_type) = payload
        .get("eventType")
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Err("Invalid message shape".to_string());
    };

    let Some(data) = payload.get("data").and_then(|value| value.as_object()) else {
        return Err("Invalid message shape".to_string());
    };

    let response = json!({
        "eventType": event_type,
        "data": Value::Object(data.clone()),
        "from": origin,
        "timestamp": current_timestamp(),
    });

    Ok(response.to_string())
}

async fn broadcast(state: &SharedState, sender_id: usize, message: &str) {
    let recipients: Vec<UnboundedSender<Message>> = state
        .clients
        .read()
        .await
        .iter()
        .filter(|(id, _)| **id != sender_id)
        .map(|(_, client)| client.sender.clone())
        .collect();

    let payload = Message::Text(message.to_string());
    for recipient in recipients {
        let _ = recipient.send(payload.clone());
    }
}

async fn send_error(state: &SharedState, client_id: usize, message: &str) {
    let error_payload = Message::Text(error_message(message));

    if let Some(sender) = state.clients.read().await.get(&client_id) {
        let _ = sender.sender.send(error_payload);
    }
}

fn error_message(message: &str) -> String {
    json!({
        "eventType": "_error",
        "data": { "message": message },
        "from": "hub",
        "timestamp": current_timestamp(),
    })
    .to_string()
}

fn current_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn resolve_port(env_port: Option<&str>) -> u16 {
    if let Some(raw) = env_port {
        if let Ok(port) = raw.parse::<u16>() {
            if port > 0 {
                return port;
            }
        }

        eprintln!("Invalid HUB_PORT \"{raw}\", falling back to {DEFAULT_PORT}");
    }

    DEFAULT_PORT
}
