# Agent Game Builder

An authoring workspace for a coding agent to build playable studies. Procedural grammars
compile to an engine-neutral raster bundle; Babylon.js consumes runtime assets and owns the
game scenes.
The root screen catalogs the prototypes that are currently available and opens each one in its
own Agent Game Builder workspace.

The catalog currently contains one entry:

- **Tokyo Neon ’89** — a technical first-person blockout. Its concept is approved; its current
  visual interpretation is not. See the [visual direction brief](docs/visual-direction/tokyo-neon-89.md).

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

The active prototype keeps the accumulated Builder improvements: lifecycle-safe Babylon scene
mounting, keyboard input, live motion diagnostics, the deterministic raster compiler, official
glTF loader support, Playwright visual checks, a pinned Blender LTS launcher and deterministic
PNG atlas composition.

## Visual review

Visual maturity is tracked independently from technical completion. The required stages,
evidence and review rubric live in the [visual direction workflow](docs/visual-direction/README.md).
Generate the active prototypes' canonical views and labeled contact sheets with:

```sh
npm run capture:visual
```

Review output is written to `artifacts/visual-review/` and is intentionally ignored by Git. A
passing browser test or generated contact sheet never promotes a scene without explicit visual
approval.

## Preserved work

- `archive/pcb-einstein-prototypes` — the LCD/PCB platformer and Einstein's subatomic field,
  including their complete assets, authoring pipelines and tests.
- `archive/babylon-prototypes` — the Ashfall Expanse and Sunlit Earth Babylon studies.
- `archive/apollo-11-prototype` — the complete historical Apollo 11 Phaser prototype.
- `archive/pre-phaser-refactor` — the historical custom-runtime microgame project.

## Commands

```sh
npm run dev
npm run test
npm run test:visual
npm run capture:visual
npm run check
npm run build
npm run setup:blender
```
