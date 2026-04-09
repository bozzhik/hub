# Concepts Endpoint

`concepts` is a small agent-facing backlog.

Source data lives in Convex table `concepts` and is editable in:

- `/db/concepts`

API entrypoint:

- `GET /api/concepts`

## Goal

The endpoint should let an agent:

- understand the contract quickly
- inspect one or many concepts
- claim one concept for work
- move status after the iteration

## Root response

`GET /api/concepts` is intentionally compact.

It returns:

- endpoint url
- compact expert agent prompt
- enum values
- compact command signatures
- direct urls for quick manual opening

The important field is `agent.prompt`.

That prompt is the default working stance for the model and should tell it:

- behave like a senior engineer
- prefer ready-made libraries and existing project patterns
- avoid overengineering
- focus on the core requirement
- ship a complete pragmatic MVP, not a sketch
- check for errors and broken states while implementing
- run relevant project checks before finishing, such as lint, typecheck, tests, or build
- update concept status only after the result is actually in a valid final state

## Commands

### Random

```http
GET /api/concepts?cmd=random[&status][&priority][&tag][&excludeTokens][&limit]
```

- returns one random concept
- if more than one candidate exists, the endpoint tries not to repeat the same token twice in a row for the same filter set
- if no filters are passed, it picks from all concepts
- does not reserve the concept

### Item

```http
GET /api/concepts?cmd=item&token=<token>
```

- returns one concept by token

### List

```http
GET /api/concepts?cmd=list[&status][&priority][&tag][&excludeTokens][&limit]
```

- returns a bounded filtered list

### Claim

```http
POST /api/concepts
Content-Type: application/json

{
  "cmd": "claim",
  "status": "ready"
}
```

- intended for the moment the agent starts work
- default source status is `ready`
- moves the chosen concept to `in_progress`

### Set Status

```http
POST /api/concepts
Content-Type: application/json

{
  "cmd": "setStatus",
  "token": "test",
  "status": "done"
}
```

- updates concept status by token

## Current enums

- `status`: `draft | review | ready | in_progress | done | rejected`
- `priority`: `low | medium | high | urgent`

## Notes

- `claim` is strict by default and looks for `ready`
- `random` is discovery-oriented and does not require `ready`
- `limit` is optional everywhere and is only applied when passed explicitly
- `tag` filtering currently works on the bounded candidate pool, which is enough for this MVP
