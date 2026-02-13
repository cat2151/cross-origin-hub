#!/usr/bin/env node
import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distLibDir = resolve(rootDir, 'dist-lib');

async function buildLib() {
  await mkdir(distLibDir, { recursive: true });
  await cp(resolve(rootDir, 'src', 'cross-origin-hub.js'), resolve(distLibDir, 'cross-origin-hub.js'));
  return distLibDir;
}

if (process.argv[1] && process.argv[1].includes('build-lib')) {
  buildLib().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default buildLib;
