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

- сделать ai эндпоинт с бесплатными моделями
