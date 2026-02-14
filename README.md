# cross-origin-hub

Phase 0 proof-of-concept for Cross-Origin Hub.

## Getting started

One-shot (no clone):

```bash
npx @cat2151/cross-origin-hub demo01   # Hub only on ws://127.0.0.1:8787 (demo01 profile)
npx @cat2151/cross-origin-hub demo02   # Hub only on ws://127.0.0.1:8787 (demo02 profile)
# Rust (install from git, since cargo run does not support --git):
cargo install --git https://github.com/cat2151/cross-origin-hub --locked cross-origin-hub-rs
cross-origin-hub-rs                  # WebSocket hub on ws://127.0.0.1:8787
```

From a clone:

```bash
npm install
npm run start          # WebSocket hub on ws://127.0.0.1:8787
# or bin: npx @cat2151/cross-origin-hub demo01|demo02
```

Rust CLI alternative (from a clone):

```bash
cargo run --release --manifest-path cross-origin-hub-rs/Cargo.toml
```

Keep the hub running locally, then open the GitHub Pages-hosted demo pages; no local demo server is required or supported.

## Install as a library

```
npm install @cat2151/cross-origin-hub --registry https://npm.pkg.github.com
# requires a GITHUB_TOKEN with read:packages
```

APIs:
- `CrossOriginHub` for generic pub/sub over the local hub
- `createWavHubSender({ serverUrl, maxBytes, defaultMime, WebSocket, onError })` → `{ toggleSend(on), sendWav(wavBlob|ArrayBuffer|TypedArray, metadata), hub }`

## WAV helper (plan-aligned)

`createWavHubSender` wraps `CrossOriginHub` to publish `wav:generated` payloads expected in `wav-hub-plan.md`. It converts a Blob/ArrayBuffer WAV into base64, adds `mime` (default `audio/wav`), and enforces a simple size cap before sending.

```js
import CrossOriginHub, { createWavHubSender } from '@cat2151/cross-origin-hub';

const { toggleSend, sendWav, hub } = createWavHubSender({ serverUrl: 'ws://127.0.0.1:8787', maxBytes: 5 * 1024 * 1024 });

hub.on('_connected', () => console.log('hub connected'));
toggleSend(true); // enable auto-send

// Later, when you have a generated WAV Blob/ArrayBuffer:
await sendWav(wavBlob, { id: 'take-1', name: 'Kick', sampleRate: 44100, source: 'tonejs' });
```

## Demos

- Demo01 (text echo): run `npx @cat2151/cross-origin-hub demo01`, then open GitHub Pages `https://cat2151.github.io/cross-origin-hub/demo/01_simple/left.html` and `.../right.html` in separate windows.
- Demo02 (WAV send/receive): run `npx @cat2151/cross-origin-hub demo02`, then open `https://cat2151.github.io/cross-origin-hub/demo/02_wav/left.html` and `.../right.html`. Left toggles `send to hub` and generates a sine-wave WAV; Right receives `wav:generated` and plays it.

### Workflow tip (demo vs library)

Two GitHub Actions are split to avoid circular refs: `publish-package` builds/publishes the library, and `deploy-pages` builds demo/01_simple and demo/02_wav to GitHub Pages using the built library artifact. Demos consume the published package—do not rely on locally served demo assets.
