const DEFAULT_SERVER_URL = 'ws://127.0.0.1:8080';

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
