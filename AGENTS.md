# Agent entry point

Read `CLAUDE.md` before editing this repository.

## Product boundary

- Phaser is the game engine. Do not build another engine in this repository.
- Preserve the pure grammar renderer and deterministic asset compiler.
- Keep Phaser and React out of `src/core/`, `src/grammars/`, `src/authoring/` and `src/compiler/`.
- Keep `main` neutral until the user approves the next game concept.
- Build the approved game inside the builder workspace. Do not create a game shelf.
- Keep only content that the current project uses.
- Treat generated images and Blender renders as offline asset inputs, not runtime systems.
- Propose product, visual and authoring-workflow decisions before applying them.
- Do not use design skills, plugins or MCPs unless the user requests them.

## Commands

- `npm run dev` — Vite builder workspace at port 5177.
- `npm run test` — deterministic compiler and contract tests.
- `npm run check` — typecheck and tests.
- `npm run build` — production workspace build.
