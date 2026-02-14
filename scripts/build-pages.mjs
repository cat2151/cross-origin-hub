#!/usr/bin/env node
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist');
const distLibDir = resolve(rootDir, 'dist-lib');
const libFile = resolve(distLibDir, 'cross-origin-hub.js');

async function ensureLib() {
  try {
    await stat(libFile);
  } catch (_error) {
    const buildLib = await import('./build-lib.mjs');
    if (buildLib?.default) {
      await buildLib.default();
    }
  }
}

async function build() {
  await ensureLib();

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await Promise.all([
    cp(resolve(rootDir, 'index.html'), resolve(distDir, 'index.html')),
    cp(resolve(rootDir, 'demo'), resolve(distDir, 'demo'), { recursive: true }),
    cp(libFile, resolve(distDir, 'cross-origin-hub.js')),
  ]);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
