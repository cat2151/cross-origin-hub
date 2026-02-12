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
