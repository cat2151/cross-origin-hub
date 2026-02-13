import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.ALLOW_LOCAL_DEMO !== '1') {
  console.error('[cross-origin-hub] Local demo servers are disabled. Use GitHub Pages demos instead.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const LEFT_PORT = 3000;
const RIGHT_PORT = 4000;
const WAV_LEFT_PORT = 3100;
const WAV_RIGHT_PORT = 4100;
const HOST = '127.0.0.1';
const clientLibPath = join(__dirname, '..', 'src', 'cross-origin-hub.js');

function createApp(staticPath) {
  const app = express();
  app.use(express.static(staticPath));
  app.get('/cross-origin-hub.js', (_req, res) => {
    res.sendFile(clientLibPath);
  });
  return app;
}

const leftApp = createApp(join(__dirname, '..', 'demo01'));
const rightApp = createApp(join(__dirname, '..', 'demo01'));
const wavLeftApp = createApp(join(__dirname, '..', 'demo02'));
const wavRightApp = createApp(join(__dirname, '..', 'demo02'));

leftApp.listen(LEFT_PORT, HOST, () => {
  console.log(`Left demo running at http://${HOST}:${LEFT_PORT}`);
});

rightApp.listen(RIGHT_PORT, HOST, () => {
  console.log(`Right demo running at http://${HOST}:${RIGHT_PORT}`);
});

wavLeftApp.listen(WAV_LEFT_PORT, HOST, () => {
  console.log(`WAV Left demo running at http://${HOST}:${WAV_LEFT_PORT}`);
});

wavRightApp.listen(WAV_RIGHT_PORT, HOST, () => {
  console.log(`WAV Right demo running at http://${HOST}:${WAV_RIGHT_PORT}`);
});
