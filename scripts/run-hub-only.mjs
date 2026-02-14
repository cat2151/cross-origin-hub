#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scenario = ['demo01', 'demo02'].includes(process.argv[2]) ? process.argv[2] : 'default';
const hub = spawn('node', ['src/hub-server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DEMO_SCENARIO: scenario,
  },
});

hub.on('exit', (code) => {
  if (code && code !== 0) {
    process.exitCode = code;
  }
});

function shutdown() {
  if (!hub.killed) {
    hub.kill();
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit();
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit();
});

console.log(`[cross-origin-hub] started hub for ${scenario}`);
if (scenario === 'demo01') {
  console.log(
    '[cross-origin-hub] open https://cat2151.github.io/cross-origin-hub/demo/01_simple/left.html and right.html (no local serving)'
  );
} else if (scenario === 'demo02') {
  console.log(
    '[cross-origin-hub] open https://cat2151.github.io/cross-origin-hub/demo/02_wav/left.html and right.html (no local serving)'
  );
} else {
  console.log('[cross-origin-hub] default hub mode. Try subcommands: demo01 | demo02 (GitHub Pages only)');
}
