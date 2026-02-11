(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrossOriginHub = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  class CrossOriginHub {
    constructor(options = {}) {
      this.serverUrl = options.serverUrl || 'ws://localhost:8080';
      this.autoReconnect = options.autoReconnect !== false;
      this.reconnectInterval = options.reconnectInterval || 3000;
      this.eventHandlers = new Map();
      this.connectionState = 'disconnected';
      this.ws = null;
      this.connect();
    }

    connect() {
      this.ws = new WebSocket(this.serverUrl);
      this.ws.onopen = () => {
        this.connectionState = 'connected';
        this.emit('_connected');
      };

      this.ws.onclose = () => {
        this.connectionState = 'disconnected';
        this.emit('_disconnected');

        if (this.autoReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        this.emit('_error', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
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

  return CrossOriginHub;
});
