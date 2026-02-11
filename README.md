# cross-origin-hub

Phase 0 proof-of-concept for Cross-Origin Hub.

## Getting started

```bash
npm install
npm run start    # WebSocket hub on ws://localhost:8080
npm run demo     # Demo pages on http://localhost:3000 and http://localhost:4000
```

Run `npm run start` and `npm run demo` in separate terminals so both stay running, or simply run:

```bash
npm run all       # start hub + both demo servers
# or one-shot without cloning
npx github:cat2151/cross-origin-hub
```

Open both demo pages in the browser and send messages; they should appear on the opposite page via the hub.  
When GitHub Pages is deployed (via the included workflow), you can also open the hosted `/left/` and `/right/` pages while running the local hub to validate cross-origin messaging from GitHub Pages to your localhost hub.
