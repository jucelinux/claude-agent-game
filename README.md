# Agent Game Builder

An authoring workspace for a coding agent to build playable studies. Procedural grammars
compile to an engine-neutral raster bundle; Babylon.js consumes runtime assets and owns the
game scenes.
The root screen catalogs the prototypes that are currently available and opens each one in its
own Agent Game Builder workspace.

The catalog currently contains two active studies:

- **Ashfall Expanse** — a wide post-apocalyptic isometric environment with a compiled
  eight-direction low-poly traveler atlas
  through ruined districts, broken infrastructure and dry canals.
- **Sunlit Earth** — a true-3D environment study with open sky, directional sunlight and a
  simple warm earthen terrain.

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
- `src/babylon/` — the thin Babylon.js/Builder lifecycle adapter.
- `src/game/` — project-specific Babylon scenes and rules.
- `src/ui/` — React development workspace.
- `scripts/blender/` — reusable offline Blender rendering support.
- `public/assets/` — imported, generated and offline-rendered raster assets.

Babylon.js owns scenes, rendering, cameras, animation, audio and lifecycle. The repository does
not wrap those systems in a second engine. See [asset authoring](docs/asset-authoring.md) for the
three supported content paths.

## Preserved work

- `archive/apollo-11-prototype` — the complete historical Apollo 11 Phaser prototype.
- `archive/pre-phaser-refactor` — the historical custom-runtime microgame project.

## Commands

```sh
npm run dev
npm run test
npm run check
npm run build
```
