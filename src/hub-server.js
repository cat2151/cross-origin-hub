const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = process.env.HUB_PORT ? Number(process.env.HUB_PORT) : 8080;

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
      const message = {
        ...payload,
        from: origin,
        timestamp: Date.now(),
      };

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === client.OPEN) {
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

server.listen(PORT, () => {
  console.log(`Cross-Origin Hub server listening on ws://localhost:${PORT}`);
});
