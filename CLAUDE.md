# Project contract

## Product

This repository is an authoring workspace for building games with a coding agent. It is not a
game engine. Babylon.js owns the game loop, scenes, rendering, cameras, scene graph, animation,
audio and resource lifecycle. Engine facilities are added only when a prototype needs them.

The `main` branch publishes the user-approved studies in the Agent Game Builder catalog. New
game concepts enter that catalog only after explicit user approval.

The Ashfall Expanse and Sunlit Earth prototypes are preserved on
`archive/babylon-prototypes`. The Apollo 11 prototype is preserved on
`archive/apollo-11-prototype`. The older pre-Phaser project is preserved on
`archive/pre-phaser-refactor`. The LCD/PCB platformer and Einstein's subatomic field are
preserved together on `archive/pcb-einstein-prototypes`.

## What is unique here

- Grammar-first procedural art.
- A deterministic compiler from authored grammar to portable raster bundles.
- Stable animation, palette, origin, contact and attachment metadata.
- A workspace that lets a builder play, inspect and diagnose approved prototypes.
- Offline image-generation and Blender workflows that produce ordinary game assets.

The deterministic boundary ends at the compiled asset bundle. Babylon gameplay does not need
to reproduce a repository-owned simulation or replay timeline.

## Architecture

- `src/core/` is the pure grammar renderer. It imports no Babylon.js, React or browser APIs.
- `src/grammars/` contains only procedural content used by the current project.
- `src/authoring/` declares the current project asset catalog.
- `src/compiler/` validates and produces an engine-neutral bundle.
- `src/babylon/` is the only adapter between the Builder contract and Babylon.js.
- `src/game/` contains project-specific Babylon scenes and rules.
- `src/ui/` contains the React builder workspace.
- `scripts/blender/` contains offline render helpers, never runtime code.
- `public/assets/` receives generated, imported or Blender-rendered raster assets.

Do not recreate Babylon facilities behind repository-owned abstractions. Game-specific rules
and a thin Builder adapter are allowed; a generic scene, rendering, physics, camera, audio or
lifecycle system is not.

## Visual quality gate

Visual implementation and visual approval are separate product decisions. A concept approval
does not approve the first rendered interpretation of that concept.

Before materially implementing a visually led scene:

1. Create `docs/visual-direction/<prototype-id>.md` from the repository template.
2. Establish a reference packet with provenance, an explicit anti-reference list and a target
   frame. The user must approve the target before an art pass begins.
3. State the asset plan: what uses Babylon primitives, authored procedural geometry, Blender/GLB,
   generated offline input or licensed third-party material. Primitives are valid for blockout;
   convenience does not make them final art.
4. Mark the catalog maturity honestly. A scene remains `reference` or `blockout` until its
   approved target and asset plan have materially shaped the rendered result.
5. Capture the canonical review views and assess each one against the approved target and the
   rubric in `docs/visual-direction/README.md`. Automated canvas tests prove presentation
   correctness, not taste or visual quality.
6. Require explicit user visual approval before marking a prototype `approved` or describing it
   as a finished playable study.

If the reference packet is missing, pause visual production and request either user-supplied
references or permission to research them. The existing restriction on design skills, plugins,
MCPs and image generation still applies; this gate does not grant that permission by itself.

## Working agreement

Read this file, `AGENTS.md` and `SCARS.md` before edits. `SCARS.md` is the branch's persistent
learning memory: its gates must shape implementation planning, not merely be cited after the
same mistake happens again. Run `npm run check` and `npm run build` before delivery. Do not add
a dependency silently: state its role and boundary first.

Suggestions that change product direction, visual direction or the authoring workflow must be
explicit and require the user's approval. Do not use design skills, plugins or MCPs unless the
user asks for them. Image generation is available, but propose its material use before adding
generated assets to the project.

Do not commit unless asked.
