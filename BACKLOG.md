# BACKLOG.md

What is **open**, as of 17/08 (distilled — closed items live in `DECISIONS.md` and on
branch `taste-loop-v1`). A state file: re-derived when a verdict supersedes it.

## Gate — v3, the commission test · running 3 of 5, batch 6 open

| batch | commission | verdict | capability the miss specified | cost |
|---|---|---|---|---|
| 1 | astronaut, 8-way walk, moon | **miss** | a body that survives being turned (every positional field rotates) | 1 cycle, 1 reading |
| 2 | kitten platformer, cozy | **ships** | — (notes: difficulty ratio, presentation scale) | 1 cycle, 3 readings |
| 3 | skull runner, SOTN | **miss** | **subtraction** (`Part.cut`) | 1 cycle, 1 reading |
| 4 | skate + kickflip (roll + pixel-art experiment) | **ships** | — (spec carried: environments are basic) | 1 cycle, 1 reading |
| 5 | "o máximo do motor" → biplane barrel roll, `/aero` | **ships** | — (spec carried: obstacles must leave the screen before dying) | 1 cycle, 1 reading |
| 6 | snowboard, Yoshi's Island SNES aesthetic — "bem pixel art mesmo" | *open* | — | 1 cycle so far |
| 7 | **the real test C**: down-slope camera + carve-amplitude composition, `/descent` | **miss → 2nd cycle** | **perspective: scale over distance, spawn at the vanishing point, the treadmill** | 2 cycles, 1 reading so far |

**Batch 7, cycle 1: MISS, his words unsoftened.** *"os obstáculos estão surgindo de trás do
player… deveriam aparecer em escala, ao fundo, e crescerem conforme se aproximam… tudo parece
estar parado e os obstáculos parecem estar numa cascata invertida."* The carve he validated; the
view was inverted end to end. Prediction scored: called ships at 70/30 — wrong, and the 30 named
the right axis (does the view feel right) with the wrong outcome.

**Cycle 2, same day: the miss compiled.** Obstacles are born small at the horizon and grow down
a perspective curve (factor zNear/(A+zNear), rows and lanes converging on the vanishing point),
through **seven discrete scale bands, each its own crisp render** through the ordinary build
cache — never a stretched sprite. Far bands drop the drawn line (a 1 px ring around a 5 px
render is a black block — the look's catch); flowing piste dust carries the treadmill between
obstacles. **What survives from cycle 1:** the composition number — worst drift **0.337 px** at
carve amplitude against matrix truth, glide exactly zero — and the carve itself. 523 locks.

**Prediction (one line, before he looks again):** SHIPS at 60/40 — the 40 is whether the
band-snap growth reads as smooth approach, the pop-in axis only his eye rates.

**Batch 5 verdict, 17/08, unsoftened — it ships.** *"O barrel roll funcionou muito bem! A
estética do jogo respeitou o jogo anterior do skate, porém o parallax, as nuvens ao fundo e os
obstáculos do biplano trouxeram animações e novos elementos, ficou agradável."* He merged the PR
himself and validated the game on the deployed shelf.

**Prediction scored (one line):** called SHIPS at 60/40 — right, and the 40 (does the roll READ)
is the thing he praised first; the dark-valley note I expected never came, and what he named
instead — parallax, clouds, new elements — is the environment axis rewarded, not noted as absent.

**The spec batch 5 carries, his words:** *"o objeto de obstáculo é destruído antes de sair da
tela. O mais comum é que ele saia da tela e seja destruído fora dela"* — in every side-scroller.
Root found by arithmetic, not by the symptom's layer: the draw window's inverse map drops
`leadIn` and one `spacing`, so a stone is culled at screen x ≈ holdX + leadIn − 60 − spacing
(+jitter) — mid-screen in every runner. The collision map has the same slack and survives on a
±2-slot margin. Fixed 17/08 with a property lock over all three runner stages.

**Batch 6, 17/08, his sentence:** *"desenvolver a próxima proposta de microjogo (o do
snowboarding)… eu quero que a estética desse seja bem pixel art mesmo. Então nesse jogo pode
aplicar a mesma estética e referência visual do Yoshi Island, do snes."* One reference image
supplied (winter YI screen). Structural numbers extracted at intake per the 16/08 rule — see
the tunables' anchors.

**Prediction (one line, before he looks):** SHIPS at 65/35 — the 35 is whether the palette and
checker-dither read as *Yoshi's Island* to someone who named it, which no instrument here
measures.

**Shipped 17/08 as `/snow` ("Rodeo"), one model cycle:** the trick composes a full roll with a
root that leans AND keeps changing its lean (the declared approximation, exercised at a
different value every frame, 491 locks green); the sky weaves on the **2×2 checker** — the
lattice is the aesthetic statement, locked as data; snowfall is the first field in a runner,
drawn in front of the world; the despawn fix rode along in the same push and covers the crypt
and the skate too.

## Held for the human

- [ ] 🟡 **30 seconds: is the skull a skull now?**
  · *Open:* `node bin/micro.ts` → `/crypt`. · *Do:* look at the runner's head, say yes or no.
  · *Why:* batch 3 missed on "isso não é uma caveira"; `Part.cut` was built and the skull
  re-authored (sockets are cavities, ember gone, cranium enlarged). "Nothing got worse"
  from your last play is a different question and does not close this.
  · *Changes:* **yes** → subtraction enters the mastery ledger with a verdict. **no** →
  the cut was the wrong capability or badly spent — worth more than a third primitive.

- [ ] 🟡 **Two minutes: the snowboarder — batch 6's reading.**
  · *Open:* `node bin/micro.ts` → `/snow` (or the deployed shelf).
  · *Do:* play until you clear a snowman with one press and the tall pine with two. Say one
  word — ships or misses — plus a word of why on a miss.
  · *What a pass looks like:* the screen says *Yoshi's Island winter* before you touch a key,
  and the trick reads as a snowboard trick.
  · *Changes:* **ships** → the composed roll (roll under a leaning parent) enters the ledger
  and the aesthetic vocabulary gains its first him-named reference target. **misses** → the
  word says whether the miss is the trick or the aesthetic, and that word is the next round.

## Batch 7 — the REAL test C, his correction recorded

Batch 6's reshaping was MY silent resolution of an ambiguity between two of his statements, and
his question caught it: *"Eu me recordo da sugestão desse microgame ter o objetivo de validar a
relação da câmera no jogo, certo?"* Correct. So batch 7 runs C as the record wrote it:

1. **The down-slope camera** — the first new view since the moon: the world scrolls down the
   fall line, the boarder is seen from high behind, obstacles rise from the bottom edge.
2. **The composition at carve amplitude** — batch 6 exercised roll under a 7–10° lean, which is
   weak evidence because the approximation's error grows with the parent angle. The carve banks
   the root to ~36° WHILE rolled children fold, sustained through the loop — and the drift is
   **measured against matrix ground truth**, not merely survived. The number enters the record
   whichever way it comes out: small is a validation, large is a specification (`a matrix per
   bone`), and both are results.

The Yoshi's Island aesthetic carries over — his ask stands; only the intent was clarified.

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
      counting did not. Round 1 of 3: caught 3 scene facts, verdict unchanged. Round 2 of 3
      (batch 5): caught 2 scene facts (dawn weave reads as pixel art; the valley too dark
      for its own weave), zero sprite facts, ship unchanged — **and his verdict then named
      neither: he praised the parallax and clouds and never mentioned the valley.** Two
      rounds, no verdict moved. One round left before the retirement question.
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
| locks green | 523 | `npm test` | 17/08, after run 20 cycle 2 |
| **the composition drift at carve amplitude** — the number test C exists for | worst **0.337 px** on a 34 px body (arms ±50° under 21° roll under 36° bank); glide exactly 0 | `npx vitest run tests/descent.test.ts` | 17/08 |
| `/descent` budget | 13 layers, 50 colours, 34 calls/frame of 200, 41k px to decode, 33 KB wire | `node bin/micro.ts --static` | 17/08 |
| the rodeo: board faces trading under a LEANING root | base 25→**119**→8 px · topsheet 32→0→**81**, half a turn apart, pale first | `node bin/bench.ts --grammar snow-rodeo --tunables snow-rodeo` | 17/08 |
| `/snow` budget | 12 layers, 50 colours, 44 calls/frame of 200, 83k px to decode | `node bin/micro.ts --static` | 17/08 |
| snowfall speed | 38 px/s (0.14 pass/cycle) — snow, not hail; bounded both ways in tests/snow.test.ts | `npx vitest run tests/snow.test.ts` | 17/08 |
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
