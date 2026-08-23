# Agent Game Builder

An authoring workspace for a coding agent to build a game. Procedural grammars compile
to an engine-neutral raster bundle; Phaser consumes that bundle and owns the game.

The repository contains one game: a historically grounded procedural campaign recreating the
Apollo 11 expedition from launch to splashdown. The current builder can switch directly between
the Chapter 1 launch-day skeleton, the playable P66 terminal descent and the lunar-surface
foundation. Selecting a compiled character or environment clip opens its pixel-perfect preview
and authoring metadata. See [`CAMPAIGN.md`](./CAMPAIGN.md).

## Start

Requires Node 24 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5177`.

## Architecture

- `src/core/` — pure deterministic grammar renderer.
- `src/grammars/` — astronaut and lunar environment grammar.
- `src/authoring/` — the current project's asset catalog.
- `src/compiler/` — portable bundle compiler.
- `src/phaser/` — Phaser adapter.
- `src/game/` — the lunar game.
- `src/ui/` — React development workspace.

Phaser owns scenes, rendering, input, physics, cameras and lifecycle. The repository does
not wrap those systems in a second engine.

## Commands

```sh
npm run dev
npm run test
npm run check
npm run build
```

The historical microgame shelf and its custom runtime are preserved on the local branch
`archive/pre-phaser-refactor`.
