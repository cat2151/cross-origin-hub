const path = require('path');
const express = require('express');

const LEFT_PORT = 3000;
const RIGHT_PORT = 4000;
const clientLibPath = path.join(__dirname, '..', 'src', 'cross-origin-hub.js');

function createApp(staticPath) {
  const app = express();
  app.use(express.static(staticPath));
  app.get('/cross-origin-hub.js', (_req, res) => {
    res.sendFile(clientLibPath);
  });
  return app;
}

const leftApp = createApp(path.join(__dirname, '..', 'demo', 'left'));
const rightApp = createApp(path.join(__dirname, '..', 'demo', 'right'));

leftApp.listen(LEFT_PORT, () => {
  console.log(`Left demo running at http://localhost:${LEFT_PORT}`);
});

rightApp.listen(RIGHT_PORT, () => {
  console.log(`Right demo running at http://localhost:${RIGHT_PORT}`);
});
