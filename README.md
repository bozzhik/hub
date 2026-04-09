# ⚡️hub

Personal multi-purpose hub and sandbox

## Stack

- Next.js
- Elysia.js

## Quick Start

```shell
git clone https://github.com/bozzhik/hub.git
```

## Convex Database View

Generated Convex table admin UI. For full details (markers, required exports), see `convex/tables/table-guide.md`.

After editing `convex/schema.ts`:

```shell
# one shot: regen DB base blocks + meta + Convex API/types
bun db:sync
```

## AI Endpoint (OpenRouter Free Models)

- `GET /api/ai` — compact guide + top recommended free models
- `GET /api/ai/models` — ranked free model list for model selection
- `GET /api/models` — full ranked model metadata for each free model
- `POST /api/ai` — prompt completion with optional model override and automatic fallback
- `POST /api/ai/stream` — SSE token streaming for realtime chat UI
- `GET /ai` — simple browser chat UI with model selection
