# Project contract

## Product

This repository is an authoring workspace for building games with a coding agent.
It is not a game engine. Phaser owns the game loop, scenes, rendering, input,
physics, audio, cameras and resource lifecycle.

The product surface is one builder workspace around one evolving game: a faithful procedural
campaign of the Apollo 11 expedition from launch to splashdown. `CAMPAIGN.md` is the binding
product and historical-fidelity contract. There is no microgame shelf.

## What is unique here

- Grammar-first procedural art.
- A deterministic compiler from authored grammar to portable raster bundles.
- Stable animation, palette, origin, contact and attachment metadata.
- A workspace that lets a builder play, inspect and diagnose the current game.
- Optional generated or imported images that enter through the same bundle contract.

The deterministic boundary ends at the compiled asset bundle. Phaser gameplay is not
required to reproduce a repository-owned simulation or replay timeline.

## Architecture

- `src/core/` is the pure grammar renderer. It imports no Phaser, React or browser APIs.
- `src/grammars/` contains only content used by the current project.
- `src/authoring/` declares the project asset catalog and parameters.
- `src/compiler/` produces an engine-neutral bundle.
- `src/phaser/` is the only adapter from that bundle to a game engine.
- `src/game/` contains game-specific Phaser scenes and rules.
- `src/ui/` contains the React builder workspace.

Do not recreate Phaser facilities behind repository-owned abstractions. Game-specific
rules are allowed; a generic scene, input, physics, camera, audio or lifecycle system is not.

## Working agreement

Read this file and `AGENTS.md` before edits. Run `npm run check` and `npm run build`
before delivery. Do not add a dependency silently: state its role and boundary first.

Suggestions that change product direction, visual direction or the authoring workflow
must be explicit and require Jucelinux's approval. Do not use design skills, plugins or
MCPs unless he asks for them. Image generation is available, but each material use must
be proposed before it enters the project.

Historical claims, assets and mechanics must follow the evidence hierarchy in `CAMPAIGN.md`.
Generated imagery is never a historical source. Record material simplifications and source
conflicts explicitly; do not silently turn planned procedure into as-flown history.

Do not commit unless asked.
