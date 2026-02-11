const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.HUB_PORT ? Number(process.env.HUB_PORT) : 8080;
const HOST = process.env.HUB_HOST || '127.0.0.1';

const app = express();
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin || 'unknown';
  ws.origin = origin;

  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const { eventType, data } = payload || {};
      const invalidEventType = typeof eventType !== 'string' || eventType.trim() === '';
      const invalidData = typeof data !== 'object' || data === null || Array.isArray(data);

      if (invalidEventType || invalidData) {
        ws.send(
          JSON.stringify({
            eventType: '_error',
            data: { message: 'Invalid message shape' },
            from: 'hub',
            timestamp: Date.now(),
          })
        );
        return;
      }

      const message = {
        ...payload,
        from: origin,
        timestamp: Date.now(),
      };

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      ws.send(
        JSON.stringify({
          eventType: '_error',
          data: { message: 'Invalid JSON message' },
          from: 'hub',
          timestamp: Date.now(),
        })
      );
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Cross-Origin Hub server listening on ws://${HOST}:${PORT}`);
});
