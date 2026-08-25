# Agent Game Builder

An authoring workspace for a coding agent to build one game at a time. Procedural grammars
compile to an engine-neutral raster bundle; Phaser consumes that bundle and owns the game.
The root screen catalogs the prototypes that are currently available and opens each one in its
own Agent Game Builder workspace.

The catalog currently contains two active studies:

- **Pyramid Glyph Prototype** — a mixed 3D/2D adventure through an Egyptian chamber, living
  murals, a compact key puzzle and a platform boss encounter.
- **Ashfall Expanse** — a wide post-apocalyptic isometric environment with a compiled
  eight-direction low-poly traveler atlas
  through ruined districts, broken infrastructure and dry canals.

## Start

Requires Node 24 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5177`.

## Architecture

- `src/core/` — pure deterministic grammar renderer.
- `src/grammars/` — procedural grammar content for the current project.
- `src/authoring/` — the current project's compiled-asset catalog.
- `src/compiler/` — validation and portable bundle compiler.
- `src/phaser/` — the Phaser bundle adapter.
- `src/game/` — project-specific Phaser scenes and rules.
- `src/ui/` — React development workspace.
- `scripts/blender/` — reusable offline Blender rendering support.
- `public/assets/` — imported, generated and offline-rendered raster assets.

Phaser owns scenes, rendering, input, physics, cameras, audio and lifecycle. The repository does
not wrap those systems in a second engine. See [asset authoring](docs/asset-authoring.md) for the
three supported content paths.

## Preserved work

- `archive/apollo-11-prototype` — the complete Apollo 11 Phaser prototype.
- `archive/pre-phaser-refactor` — the historical custom-runtime microgame project.

## Commands

```sh
npm run dev
npm run test
npm run check
npm run build
```
