# cross-origin-hub

Phase 0 proof-of-concept for Cross-Origin Hub.

## Getting started

One-shot (no clone):

```bash
npx cross-origin-hub   # WebSocket hub on ws://127.0.0.1:8787
```

From a clone:

```bash
npm install
npm run start          # WebSocket hub on ws://127.0.0.1:8787
```

Keep the hub running locally, then open the GitHub Pages-hosted `/left/` and `/right/` pages; messages should appear on the opposite page via the hub.  
For local development of the demo servers, run `npm run start` and `npm run demo` in separate terminals, or use `npm run all` to start both in a single process.
