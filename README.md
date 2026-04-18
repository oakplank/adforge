# adforge

Automated promotional content studio. One prompt in, styled render + editable canvas out.

## Structure

```
server/   Express API. Prompt, copy, layout, and image-generation engines.
client/   React + Vite + fabric.js studio UI.
```

## Getting started

```bash
npm run install:all    # installs both workspaces
npm run dev:client     # starts Vite (proxies /api to localhost:3001)
```

Run the server separately (`cd server && npm run build && node dist/index.js`). Copy [`server/.env.example`](server/.env.example) to `server/.env` and fill in `NANO_BANANA_API_KEY` (Google AI Studio) for real image generation.

## Quality gates

All commands run from the repo root:

```bash
npm test               # server + client test suites
npm run typecheck      # both workspaces
npm run build          # both workspaces
```

CI runs the same three on every PR (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).
