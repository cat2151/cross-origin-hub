#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [];

function start(name, args) {
  const child = spawn('node', args, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  children.push(child);
  console.log(`[cross-origin-hub] started ${name}`);
}

function shutdown() {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill();
    }
  });
}

process.on('SIGINT', () => {
  shutdown();
  process.exit();
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit();
});

start('hub', ['src/hub-server.js']);
start('demo', ['scripts/demo-servers.js']);
