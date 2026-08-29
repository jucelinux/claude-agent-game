# Agent Game Builder

An authoring workspace for a coding agent to build playable studies. Procedural grammars
compile to an engine-neutral raster bundle; Babylon.js consumes runtime assets and owns the
game scenes.
The root screen catalogs the prototypes that are currently available and opens each one in its
own Agent Game Builder workspace.

The catalog currently contains two entries:

- **LCD Platformer** — a side-profile maintenance mecha whose CC0-based motion is rendered
  offline in Blender and played through native Babylon sprites inside a colossal PCB chamber
  assembled from processor packages, soldered terminals and exposed copper.
- **Einstein: Quantum Field** — a playable subatomic arena with a wild-haired physicist
  caricature, CC0-based humanoid locomotion, native Babylon field geometry and two photon
  forms: particle projectiles on right click and propagating waves on left click.

The Ashfall Expanse and Sunlit Earth studies are preserved on
  `archive/babylon-prototypes`.

## Start

Requires Node 24 or newer.

```sh
npm ci
npm run setup:authoring
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

`npm run setup:blender` installs the pinned Blender LTS authoring binary under the ignored
`.tools/` cache. Blender is an offline authoring dependency and never enters the browser bundle.
`npm run setup:motion-source` installs the checksum-pinned CC0 locomotion data in that same
cache. Regenerate the committed mecha atlas with `npm run author:mecha-motion`.
Regenerate the animated Einstein GLB, its 16 × 16 character textures and catalog preview with
`npm run author:einstein-diorama`. Blender authors ordinary offline content; the browser uses
Babylon's official glTF loader and never runs Blender code.

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
