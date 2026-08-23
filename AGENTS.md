# Agent entry point

Read `CLAUDE.md` and `CAMPAIGN.md` before editing this repository.

## Product boundary

- Phaser is the game engine. Do not build another engine in this repository.
- Preserve the pure grammar renderer and deterministic asset compiler.
- Keep Phaser and React out of `src/core/`, `src/grammars/` and `src/compiler/`.
- Build the current game inside the builder workspace. Do not create a game shelf.
- Keep only content that the current project uses.
- Propose product and visual decisions before applying them.
- Do not use design skills, plugins or MCPs unless the user requests them.
- Treat official as-flown Apollo 11 evidence as authoritative over recollection or generated
  reference. Cite every material historical implementation.

## Commands

- `npm run dev` — Vite builder workspace at port 5177.
- `npm run test` — deterministic compiler and contract tests.
- `npm run check` — typecheck and tests.
- `npm run build` — production workspace build.
