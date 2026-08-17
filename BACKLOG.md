# BACKLOG.md

What is **open**, as of 17/08 (distilled — closed items live in `DECISIONS.md` and on
branch `taste-loop-v1`). A state file: re-derived when a verdict supersedes it.

## Gate — v3, the commission test · running 2 of 4, batch 5 open

| batch | commission | verdict | capability the miss specified | cost |
|---|---|---|---|---|
| 1 | astronaut, 8-way walk, moon | **miss** | a body that survives being turned (every positional field rotates) | 1 cycle, 1 reading |
| 2 | kitten platformer, cozy | **ships** | — (notes: difficulty ratio, presentation scale) | 1 cycle, 3 readings |
| 3 | skull runner, SOTN | **miss** | **subtraction** (`Part.cut`) | 1 cycle, 1 reading |
| 4 | skate + kickflip (roll + pixel-art experiment) | **ships** | — (spec carried: environments are basic) | 1 cycle, 1 reading |
| 5 | "o máximo do motor", from the Claude app, model named as variable | *open* | — | 1 cycle so far |

**Batch 5, 17/08.** His sentence: *"um microgame que extraía o máximo do que temos nesse motor…
Tudo que fiz até aqui foi com o Opus e quero avaliar o que o Fable é capaz de entregar."* No
object and no animation in it, so it was resolved against this file's own named next round:
**transfer test B, the biplane's barrel roll**, as the round that composes the most engine at
once. Shipped as `/aero` in one model cycle, no back-and-forth.

**Prediction (one line, recorded before he looks):** SHIPS at 60/40 — the 40 is whether a 33 px
machine turning over *reads* as a barrel roll, the one axis with no instrument.

**Declared at delivery (the ledger's one-line rule):** roll was proven on one plank and is spent
here on the root of a 21-part machine; the cloud bands are hashed slots — a first small piece of
the environment work he deferred, arrived because a sky game has no scene without it; the pilot
has no face at 4 px, the skate's own answer.

## Held for the human

- [ ] 🟡 **30 seconds: is the skull a skull now?**
  · *Open:* `node bin/micro.ts` → `/crypt`. · *Do:* look at the runner's head, say yes or no.
  · *Why:* batch 3 missed on "isso não é uma caveira"; `Part.cut` was built and the skull
  re-authored (sockets are cavities, ember gone, cranium enlarged). "Nothing got worse"
  from your last play is a different question and does not close this.
  · *Changes:* **yes** → subtraction enters the mastery ledger with a verdict. **no** →
  the cut was the wrong capability or badly spent — worth more than a third primitive.

- [ ] 🟡 **Two minutes: the barrel roll — batch 5's reading.**
  · *Open:* `node bin/micro.ts` → `/aero`.
  · *Do:* play until you clear a balloon with one press and the tall moored balloon with two.
  Say one word — ships or misses — plus a word of why on a miss.
  · *What a pass looks like:* the plane turning over reads as a stunt, not a glitch; nothing
  collides where the picture shows empty sky.
  · *Changes:* **ships** → roll enters the ledger as transferred (two subjects, two verdicts)
  and the snowboarder becomes a pure approximation test. **misses on the roll** → the transfer
  claim dies. Missing on anything else specifies the next capability, as every miss has.

## Next round — transfer test C, the snowboarder's carve, after batch 5 is read

**B ran on 17/08 as batch 5** (`/aero`). C survives as written: it attacks the declared
approximation — `Bone.roll` accumulates as a scalar and does not commute with a parent's
screen-plane angle — and needs a down-slope camera that does not exist. Run it only after B's
reading: if B misses on the roll itself, C would test an approximation of a capability that did
not transfer.

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
      counting did not. Round 1 of 3: caught 3 scene facts, verdict unchanged. **Round 2
      of 3 (batch 5): caught 2 scene facts — the dawn weave reads as pixel art, and the
      valley's lower half is too dark for its own weave (the asphalt finding's second
      occurrence, seen before shipping this time); zero sprite facts. Ship unchanged.**
      Retires after 3 rounds of no effect on hit rate or his cost.
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
| locks green | 452 | `npm test` | 17/08, after run 18 |
| the barrel roll on a ROOT: wing faces trading | cream 8→**57**→0 px · crimson 12→**205**→10, half a turn apart, pale first | `node bin/bench.ts --grammar aero-roll --tunables aero-roll` | 17/08 |
| the span sweep: sprite height, quarter turn vs rest | **>1.5×**, back under 1.25× at the finish | `npx vitest run tests/aero.test.ts` | 17/08 |
| the far wheel through the roll (offsets rolled, 5 child bones) | 0 px at rest → 12 mid-turn → 0 | `part wheelF` row of the bench command above | 17/08 |
| one bench turn, the barrel roll (13 frames, whole machine marched) | 100 ms | `node bin/bench.ts --grammar aero-roll --tunables aero-roll` | 17/08 |
| `/aero` budget | 14 layers, 55 colours, 19 calls/frame of 200, 85k px to decode | `node bin/micro.ts --static` | 17/08 |
| air difficulty pair | worst gap 150 px = 0.72 s at the 208 px/s cap, vs climb hang 0.70 s | `npx vitest run tests/aero.test.ts` | 17/08 |

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
