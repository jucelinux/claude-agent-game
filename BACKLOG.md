# BACKLOG.md

What is **open**, as of 16/08 (distilled — closed items live in `DECISIONS.md` and on
branch `taste-loop-v1`). A state file: re-derived when a verdict supersedes it.

## Gate — v3, the commission test · running 2 of 4

| batch | commission | verdict | capability the miss specified | cost |
|---|---|---|---|---|
| 1 | astronaut, 8-way walk, moon | **miss** | a body that survives being turned (every positional field rotates) | 1 cycle, 1 reading |
| 2 | kitten platformer, cozy | **ships** | — (notes: difficulty ratio, presentation scale) | 1 cycle, 3 readings |
| 3 | skull runner, SOTN | **miss** | **subtraction** (`Part.cut`) | 1 cycle, 1 reading |
| 4 | skate + kickflip (roll + pixel-art experiment) | **ships** | — (spec carried: environments are basic) | 1 cycle, 1 reading |

## Held for the human

- [ ] 🟡 **30 seconds: is the skull a skull now?**
  · *Open:* `node bin/micro.ts` → `/crypt`. · *Do:* look at the runner's head, say yes or no.
  · *Why:* batch 3 missed on "isso não é uma caveira"; `Part.cut` was built and the skull
  re-authored (sockets are cavities, ember gone, cranium enlarged). "Nothing got worse"
  from your last play is a different question and does not close this.
  · *Changes:* **yes** → subtraction enters the mastery ledger with a verdict. **no** →
  the cut was the wrong capability or badly spent — worth more than a third primitive.

## Next round — the transfer tests, biplane first

Roll is proven on one subject, one clip. He approved continuing with the transfer tests.

1. **B — biplane barrel roll.** Clean transfer; silhouette is the proof (wing goes full
   width → line → back). Camera that exists. Also gives the unjudged weave a sky.
2. **C — snowboarder carve.** Attacks the declared risk: `Bone.roll` accumulates as a
   scalar and does not commute with a parent's angle. Needs a down-slope camera. Run
   second, so the approximation is tested where roll already works (one variable).

## Deferred, by him

- **Procedural filling of environments** — "em breve vamos tratar isso". Three readings
  agree (his batch-4 note, his forward note, the round-boundary look). The unjudged weave
  belongs to this round too: a dither needs a surface, and environments are the surface.
- **Pattern inside a part** — "discutiremos sobre isso depois".
- **The fresh-agent test** — deferred with a condition: when engine + harness are done.
  It remains the requirement that defines the product. _(External review recommends a
  minimal early version: a fresh agent modifies an existing game.)_
- **Pitch** (full 3D) — roll exists; pitch is still inexpressible. He named it as a
  candidate theme; the measurement so far says every yaw defect was implementation, not
  the 2.5D model's limit.

## Standing

- [ ] Mark portable/stack on every grammar rule the turn it is born.
- [ ] The look amendment is measured: per round, one line on what looking caught that
      counting did not. Round 1 of 3: caught 3 scene facts, verdict unchanged. Retires
      after 3 rounds of no effect on hit rate or his cost.
- [ ] Async checkpoints (adopted 16/08): announce feature slices on the shelf in one
      line as they stand. Watch whether his notes get shorter.

## Measured baselines

Every number carries the command that regenerates it and its date.

| what | value | command | date |
|---|---|---|---|
| one bench turn, wall | 170 ms | `node bin/bench.ts runs/tree.run.json` | 15/08 |
| one bench turn, kickflip (ray-marched) | 46 ms | `node bin/bench.ts --grammar skate-flip --tunables skate-flip` | 16/08 |
| full record→replay→compare | 1.0 s | `node bin/record.ts /tmp/c.run.json && node bin/run.ts /tmp/c.run.json && npm test` | 14/08 |
| fixture baseline hash | `a542197e4c49b27d` | `npm run baseline` | 15/08 |
| locks green | 414 | `npm test` | 16/08, after the eye |
| climb difficulty pair | no-aim 6.1 m · aims 67 m/min | `npx vitest run tests/climb.test.ts` | 16/08 |
| hero on-screen height | 132–141 px, 3 px pixel, all games | `node bin/micro.ts --static` | 16/08 |
| `/skate` on the wire | 9 layers, 50 colours, 102 KB, 10 calls/frame of 200 | `node bin/micro.ts --static` | 16/08 |
| weave surface share (4×4 single-owner) | rider 0.000 · kitten 0.068 · kerb 0.432 | `[weave]` line of `node bin/bench.ts --grammar skate-roll --tunables skate` | 16/08 |
| yaw collapse threshold | depth/width ≈ 0.45 | `npx vitest run tests/yaw.test.ts` | 16/08 |
| TS lines, source + locks | 12 700 / 4 600 | `find src bin -name '*.ts' \| xargs wc -l` | 16/08 |

## The harness — six commands

| command | what it is |
|---|---|
| `node bin/micro.ts` | **the product.** The shelf, one game per route, live on every request |
| `npm test` | the locks (414): determinism, baseline, tunables, findings null cases, contracts, game loops headless |
| `node bin/bench.ts [run] [--set …]` | **the counting eye**: contact sheet, silhouette, findings, counts, elapsed |
| `node bin/see.ts [run] [--set …]` | **the structured look** (16/08): contact-sheet PNG in `.eye/`, for the correspondence class. Fixes still enter via the grammar |
| `node bin/run.ts <run.json>` | headless: state hash + metrics |
| `node bin/record.ts <out.json> [--set …]` | capture into a replayable run file |

Every tunable lives in `tunables/`, anchored, the anchor locked.

**The lexicon is a catalog (16/08).** `src/grammars/` is organized by kind — `creatures/`,
`characters/`, `vegetation/`, `scenery/`, `probes/` — and `src/grammars/index.ts` is the
retrieval surface: every grammar carries `kind`, `status` (shipped/probe/retired), a
searchable description, and the games it appears in. `kind` and `tags` are open strings —
a new taxonomy (3D, style, per-game catalogs) is added by using it, never by editing a
type. An agent asks the catalog before authoring a new subject. Locked in
`tests/catalog.test.ts`; `fixture` is the harness's subject, not content.

**The shelf deploys to Netlify (16/08).** `netlify.toml` builds `node bin/micro.ts
--static` and publishes `dist/micro/` — every route frozen at the deployed commit. The
local shelf stays live-per-request; the deploy is a snapshot for remote sessions.
