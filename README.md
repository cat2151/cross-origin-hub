# cross-origin-hub

Phase 0 proof-of-concept for Cross-Origin Hub.

## Getting started

One-shot (no clone):

```bash
npx github:cat2151/cross-origin-hub   # WebSocket hub on ws://127.0.0.1:8787
# Rust (install from git, since cargo run does not support --git):
cargo install --git https://github.com/cat2151/cross-origin-hub --locked cross-origin-hub-rs
cross-origin-hub-rs                  # WebSocket hub on ws://127.0.0.1:8787
```

From a clone:

```bash
npm install
npm run start          # WebSocket hub on ws://127.0.0.1:8787
```

Rust CLI alternative (from a clone):

```bash
cargo run --release --manifest-path cross-origin-hub-rs/Cargo.toml
```

Keep the hub running locally, then open the GitHub Pages-hosted `/left/` and `/right/` pages; messages should appear on the opposite page via the hub.  
For local development of the demo servers, run `npm run start` and `npm run demo` in separate terminals, or use `npm run all` to start both in a single process.

## WAV helper (plan-aligned)

`createWavHubSender` wraps `CrossOriginHub` to publish `wav:generated` payloads expected in `wav-hub-plan.md`. It converts a Blob/ArrayBuffer WAV into base64, adds `mime` (default `audio/wav`), and enforces a simple size cap before sending.

```js
import CrossOriginHub, { createWavHubSender } from 'cross-origin-hub';

const { toggleSend, sendWav, hub } = createWavHubSender({ serverUrl: 'ws://127.0.0.1:8787', maxBytes: 5 * 1024 * 1024 });

hub.on('_connected', () => console.log('hub connected'));
toggleSend(true); // enable auto-send

// Later, when you have a generated WAV Blob/ArrayBuffer:
await sendWav(wavBlob, { id: 'take-1', name: 'Kick', sampleRate: 44100, source: 'tonejs' });
```
