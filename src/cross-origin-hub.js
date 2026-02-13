const DEFAULT_SERVER_URL = 'ws://127.0.0.1:8787';
const DEFAULT_MAX_WAV_BYTES = 5 * 1024 * 1024;

export default class CrossOriginHub {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || DEFAULT_SERVER_URL;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.eventHandlers = new Map();
    this.connectionState = 'disconnected';
    this.WebSocketCtor = options.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null);
    this.ws = null;

    this.connect().catch((error) => this.emit('_error', error));
  }

  async resolveWebSocket() {
    if (this.WebSocketCtor) {
      return this.WebSocketCtor;
    }

    if (typeof window !== 'undefined') {
      throw new Error('WebSocket constructor is not available in this environment.');
    }

    try {
      const wsModule = await import('ws');
      const ctor = wsModule.WebSocket || wsModule.default || wsModule;
      if (!ctor) {
        throw new Error('No WebSocket export found in "ws" package.');
      }
      this.WebSocketCtor = ctor;
      return ctor;
    } catch (_error) {
      throw new Error(
        'WebSocket constructor is not available. Provide one via options.WebSocket or install the "ws" package in Node environments.'
      );
    }
  }

  async connect() {
    const WebSocketCtor = await this.resolveWebSocket();
    this.ws = new WebSocketCtor(this.serverUrl);

    this.ws.onopen = () => {
      this.connectionState = 'connected';
      this.emit('_connected');
    };

    this.ws.onclose = () => {
      this.connectionState = 'disconnected';
      this.emit('_disconnected');

      if (this.autoReconnect) {
        setTimeout(() => {
          this.connect().catch((error) => this.emit('_error', error));
        }, this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      this.emit('_error', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleMessage(message);
      } catch (error) {
        this.emit('_error', error);
      }
    };
  }

  handleMessage(message) {
    const { eventType, data, from, timestamp } = message;
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;
    handlers.forEach((handler) => handler(data, { from, timestamp }));
  }

  send(eventType, data = {}) {
    if (!this.ws || this.connectionState !== 'connected') {
      return;
    }

    const message = {
      eventType,
      data,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    };

    this.ws.send(JSON.stringify(message));
  }

  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType).add(handler);
    return () => this.eventHandlers.get(eventType).delete(handler);
  }

  emit(eventType, data) {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;
    handlers.forEach((handler) => handler(data));
  }

  disconnect() {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }

  getConnectionState() {
    return this.connectionState;
  }
}

function normalizeArrayBuffer(view) {
  if (view.byteLength === view.buffer.byteLength && view.byteOffset === 0) {
    return view.buffer;
  }
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

async function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    return normalizeArrayBuffer(input);
  }
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return input.arrayBuffer();
  }
  throw new Error('sendWav expects a Blob, ArrayBuffer, or TypedArray input');
}

function bufferToBase64(buffer) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }

  if (typeof btoa === 'function') {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  throw new Error('No base64 encoder available in this environment.');
}

export function createWavHubSender(options = {}) {
  const { serverUrl, WebSocket, maxBytes = DEFAULT_MAX_WAV_BYTES, defaultMime = 'audio/wav', onError } = options;
  const hub = new CrossOriginHub({ serverUrl, WebSocket });
  const notifyError = typeof onError === 'function' ? onError : (error) => console.warn(error);
  let sendEnabled = false;

  function toggleSend(on) {
    sendEnabled = !!on;
    return sendEnabled;
  }

  async function sendWav(wavInput, metadata = {}) {
    if (!sendEnabled) {
      return { sent: false, reason: 'send_disabled' };
    }

    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      const error = new Error('metadata must be a plain object');
      notifyError(error);
      return { sent: false, reason: 'invalid_metadata' };
    }

    try {
      const buffer = await toArrayBuffer(wavInput);
      const size = buffer.byteLength;

      if (maxBytes && size > maxBytes) {
        notifyError(new Error(`WAV payload too large (${size} bytes). Max is ${maxBytes} bytes.`));
        return { sent: false, reason: 'too_large', size, maxBytes };
      }

      const payload = {
        ...metadata,
        mime: metadata.mime || defaultMime,
      };

      payload.bytes = bufferToBase64(buffer);

      hub.send('wav:generated', payload);
      return { sent: true, size };
    } catch (error) {
      notifyError(error);
      return { sent: false, reason: 'error', error };
    }
  }

  return { toggleSend, sendWav, hub };
}
