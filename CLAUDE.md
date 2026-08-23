# Project contract

## Product

This repository is an authoring workspace for building one game with a coding agent. It is not
a game engine. Phaser owns the game loop, scenes, rendering, input, physics, audio, cameras and
resource lifecycle.

The `main` branch intentionally has no active game concept. Keep it neutral until the user
approves the next game direction; then build that game inside this workspace. Do not create a
game shelf.

The Apollo 11 prototype is preserved on `archive/apollo-11-prototype`. The older pre-Phaser
project is preserved on `archive/pre-phaser-refactor`.

## What is unique here

- Grammar-first procedural art.
- A deterministic compiler from authored grammar to portable raster bundles.
- Stable animation, palette, origin, contact and attachment metadata.
- A workspace that lets a builder play, inspect and diagnose the current game.
- Offline image-generation and Blender workflows that produce ordinary game assets.

The deterministic boundary ends at the compiled asset bundle. Phaser gameplay does not need to
reproduce a repository-owned simulation or replay timeline.

## Architecture

- `src/core/` is the pure grammar renderer. It imports no Phaser, React or browser APIs.
- `src/grammars/` contains only procedural content used by the current project.
- `src/authoring/` declares the current project asset catalog.
- `src/compiler/` validates and produces an engine-neutral bundle.
- `src/phaser/` is the only adapter from that bundle to Phaser.
- `src/game/` contains project-specific Phaser scenes and rules.
- `src/ui/` contains the React builder workspace.
- `scripts/blender/` contains offline render helpers, never runtime code.
- `public/assets/` receives generated, imported or Blender-rendered raster assets.

Do not recreate Phaser facilities behind repository-owned abstractions. Game-specific rules are
allowed; a generic scene, input, physics, camera, audio or lifecycle system is not.

## Working agreement

Read this file and `AGENTS.md` before edits. Run `npm run check` and `npm run build` before
delivery. Do not add a dependency silently: state its role and boundary first.

Suggestions that change product direction, visual direction or the authoring workflow must be
explicit and require the user's approval. Do not use design skills, plugins or MCPs unless the
user asks for them. Image generation is available, but propose its material use before adding
generated assets to the project.

Do not commit unless asked.
