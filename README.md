# cross-origin-hub

Phase 0 proof-of-concept for Cross-Origin Hub.

## Getting started

```bash
npm install
npx cross-origin-hub   # WebSocket hub on ws://127.0.0.1:8787
```

Keep the hub running locally, then open the GitHub Pages-hosted `/left/` and `/right/` pages; messages should appear on the opposite page via the hub.  
For local development of the demo servers, you can still use `npm run start` and `npm run demo` (or `npm run all`) in separate terminals.
