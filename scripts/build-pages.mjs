#!/usr/bin/env node
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist');

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await Promise.all([
    cp(resolve(rootDir, 'demo', 'index.html'), resolve(distDir, 'index.html')),
    cp(resolve(rootDir, 'demo', 'left'), resolve(distDir, 'left'), { recursive: true }),
    cp(resolve(rootDir, 'demo', 'right'), resolve(distDir, 'right'), { recursive: true }),
    cp(resolve(rootDir, 'demo', 'wav-left'), resolve(distDir, 'wav-left'), { recursive: true }),
    cp(resolve(rootDir, 'demo', 'wav-right'), resolve(distDir, 'wav-right'), { recursive: true }),
    cp(resolve(rootDir, 'src', 'cross-origin-hub.js'), resolve(distDir, 'cross-origin-hub.js')),
  ]);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
