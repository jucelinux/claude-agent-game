# Agent Game Maker

A game engine whose authoring interface is a coding agent. A request becomes one playable scene:
deterministic simulation, procedural indexed art, replayable input and a human verdict on the
finished game.

## Start

Requires Node 24 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5177`. The root is the shelf; each `/<id>` route is one game. The server
restarts when imported source changes and invalidates cached stages when tunables change.
`npm run build` writes the deployable shelf to `dist/micro/`.

Before changing the repository, coding agents read `AGENTS.md` and the session sequence it
points to. Humans can start with `CLAUDE.md` for the product contract, `TASTE.md` for proven
visual judgment, and `SCARS.md` for defects promoted into gates.

## Architecture

- `src/core/` — deterministic grammar renderer; no DOM, clock or ambient randomness.
- `src/grammars/` — the searchable lexicon of procedural subjects.
- `tunables/` — anchored parameters; no free-floating tuning numbers.
- `src/scene/` — authored scenes resolved into runtime stages.
- `src/runtime/` — typed browser simulation, one module per game shape.
- `src/micro/` — the shelf, route registry and game scenes.
- `bin/` — bench, visual eye, replay, inspection and exploration commands.
- `tests/` — locks over determinism, perception, runtime behaviour and shipped drawing traces.

## Product rules

Keep the deterministic core independent from presentation. Art enters through grammars, input is
a timeline, and a recorded play must replay identically. Metrics may reject absence or regression;
they do not replace human taste.

Dependencies are permitted when a measured product need justifies them. They require an explicit
proposal and must stay outside the deterministic core when they serve presentation.

Run `npm run check` before delivery. Do not regenerate a golden trace merely to make it pass: a
changed trace is a product change and must be explained.

For a running-game reading, use `node bin/inspect-play.ts <game> [play.json]`. For deterministic
alternate-input coverage, use `npm run explore` or target one route with
`node bin/explore-play.ts <game> --seeds 32 --seconds 8`.
