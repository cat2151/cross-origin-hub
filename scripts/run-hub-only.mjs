#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hub = spawn('node', ['src/hub-server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
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

console.log('[cross-origin-hub] started hub (GitHub Pages clients assumed)');
