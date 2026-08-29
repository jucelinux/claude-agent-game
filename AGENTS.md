# Agent entry point

Read `CLAUDE.md` before editing this repository.

## Product boundary

- Babylon.js is the runtime engine for every prototype. Do not build another engine in this
  repository or reproduce Babylon facilities behind repository-owned abstractions.
- Preserve the pure grammar renderer and deterministic asset compiler.
- Keep Babylon.js and React out of `src/core/`, `src/grammars/`, `src/authoring/` and
  `src/compiler/`.
- Keep `main` limited to explicitly user-approved prototypes.
- Keep user-approved prototypes available through the existing builder catalog.
- Keep only content used by those approved prototypes.
- Treat generated images and Blender renders as offline asset inputs, not runtime systems.
- Propose product, visual and authoring-workflow decisions before applying them.
- Do not use design skills, plugins or MCPs unless the user requests them.

## Commands

- `npm run dev` — Vite builder workspace at port 5177.
- `npm run test` — deterministic compiler and contract tests.
- `npm run test:visual` — Playwright browser checks for the active scaffold.
- `npm run check` — typecheck, deterministic tests and visual checks.
- `npm run build` — production workspace build.
