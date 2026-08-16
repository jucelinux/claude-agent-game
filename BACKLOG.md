# BACKLOG.md

What is **open**. What is settled lives in `DECISIONS.md`.

A **state** file. Owner of the numbers that change, re-derived when a verdict supersedes
it. It is also where a cold session picks up the work — read against itself at every cycle
open (`TASTE-LOOP.md` §3b).

---

## Gate — **v3, the commission test.** Adopted 15/08 · no date

He names an object and an animation in one sentence. I deliver with no back-and-forth. He
answers in one word, plus one word of *why* on a miss. Full definition in `CLAUDE.md`.

**Batch 2 given 16/08**, and it is the first commission that is not about drawing. His
sentence, verbatim:

> *"Será um jogo de plataforma em que um gatinho pula de plataforma em plataforma. O mesmo
> conceito do doodle jump, só que com uma estética de Cozy Game."*
>
> *"Não vou atacar o 3d agora pois segundo sua própria recomendação precisamos atacar a
> consequência primeiro."*

The recommendation he is quoting is a line of mine from the same day: *the forest has a
mechanic and no consequence — the smallest work on the list with the largest return, and what
turns a reactive scene into a game.* He read it and chose it over the 3D work.

| batch | commissions | shipped | hit rate | cycles per shipped piece |
|---|---|---|---|---|
| 1 | 1 | **0 — miss** | 0/1 | 1 model cycle, 1 reading from him |
| 2 | 1 | **1 — ships** | **1/1** | 1 model cycle, 2 readings from him |

**Running: 1 of 2.**

### His verdict, 16/08, unsoftened

> *"Eu gostei dessa produção. Temos um gatinho implementado com muita animação (as caudas, as
> orelhas, sua projeção quando salta) e ficaram boas."*
>
> *"No geral achei que o minigame atendeu as expectativas."*

**That is a ship.** Two notes came with it, and both are specifications rather than complaints:

> *"embora eu sinta que tenham muitas plataformas disponíveis, o que torna o jogo pouco
> desafiador, pois é difícil errar um salto assim"*
>
> *"tornar o gatinho mais pixelado. Ver os contornos de suas formas dá ao gato um aspecto mais
> mecânico, o que você já resolveu com o gorila."*

### Scoring the prediction — **wrong, and wrong on the half I named**

| I predicted | what happened |
|---|---|
| a MISS at 55/45 | **ships** |
| the cat is the risk — 22 parts in 34 px, a face of four parts in a 12 px skull | **the cat is what he praised**, by name: the tail, the ears, the projection on the jump |
| the loop holds, because I measured every part of it a number can reach | **the loop is where the note landed** — too many platforms, too easy |

**Last batch's lesson was applied and it was applied too literally.** The rule I took from batch 1
was *name what you have not examined*. So I named the drawing, because I had counted it instead
of looking at it. **But "not examined" is not the same as "at risk", and I substituted one for
the other.** The counts on the cat were good and I discounted them for being counts; the counts
on the loop were good and I trusted them — and the loop is where the miss-shaped note came from.

**The sharper form, and it is the one worth carrying:** the loop was measured by an instrument
that could not perceive the quantity he judged it on. It reports whether progress happens, never
whether progress is *earned*. **A number that comes back green from an instrument blind to the
question is worth less than a count I have simply not looked at.** Confidence should have gone to
the axis with the weakest instrument, not to the axis with the least attention.

### What the two notes specified, and both are built

**"Muitas plataformas" — the difficulty knob had been tuned against a robot.** The tower was
thickened to break a locked orbit, and the thickening was tuned by a headless run holding one
key: a player who never aims. That instrument cannot feel "too easy". Pushed on, it drives every
knob to the generous end and reports success all the way.

The reading is a **pair** now, and it is a lock:

| | before his note | now |
|---|---|---|
| shelves on screen | 15.8 | **9.2** |
| landing window | 26% of the width | **22%** |
| a run that never aims | ~20 m | **6.1 m, then falls** |
| a run that steers at the nearest shelf | — | **67 m in a minute, still climbing** |

**One number is not a difficulty reading; the ratio between two is.** `tests/climb.test.ts`
asserts both ends and the ratio, so a tower that gets this easy again goes red.

**"Mais pixelado" — and it was never a drawing problem.** Measured before anything was touched:
the cat carries the same five tones, the same drawn line, the same inner outline as the gorilla,
and **28% of its painted pixels are outline against the gorilla's 27%**. Identical.

What differed was the scene. Every other hero on the shelf stands **132 px tall on screen with
3×3 pixels**; the kitten stood **72 px with 2×2** — the only game rendering at ×2. At half the
size and two thirds the pixel, the eye stops reading pixels and reads the smooth shaded round
masses, which is exactly *"os contornos de suas formas"*. The world is 200×240 at ×3 now:
600×720 on the page, kitten 132 px, 3 px pixel.

**Portable, and it is the finding of the round:** a subject can be drawn correctly and presented
wrongly. A complaint about how a thing is *drawn* gets checked against how it is *shown* before a
pixel is touched.

---

**Batch 1 given 16/08.** His sentence, verbatim:

> *"Eu quero que você crie para mim um astronauta. Quero ser capaz de pular e andar em todas
> as direções com ele. O ambiente: o solo lunar, similar a vista da lua com a terra ao fundo."*

| batch | commissions | shipped | hit rate | cycles per shipped piece |
|---|---|---|---|---|
| 1 | 1 | **0 — miss** | 0/1 | 1 model cycle, 1 reading from him |

### His verdict, 16/08, unsoftened

**Shipped:**

> *"O espaço profundo e a terra ficaram muito boas: aqui eu acho que você conseguiu superar
> minhas expectativas. A sombra na terra, as estrelas, embora simples, é o tipo de
> representação que traz uma memória nostálgica para quem joga."*

> *"O Astronauta (apenas a visão esquerda e direita): a representação ficou muito boa também.
> Eu senti falta daquela mochila quadrada... Se fosse um jogo 2d apenas com movimentos para
> esquerda e direita, não teria defeito algum."*

**Missed:**

> *"Na animação de movimento, não importa a direção, os braços estão fixos, sempre."*
>
> *"Quando ando para cima (W), deveria ver as costas do astronauta. Ao invés disso vejo o visor
> dele e o braço esquerdo apontado para minha direção... Os movimentos diagonais precisam
> corrigir os braços também."*
>
> *"O pulo enquanto me desloco com o A ou D está com uma animação muito boa. Para qualquer
> outra direção não."*
>
> *"A relação entre origem de luz e sombra não está bem resolvida... quando observo a terra
> tenho um indicador claro de onde está o sol. Porém quando olho para o terreno da lua e para
> o astronauta, o foco de luz não fica claro."*
>
> *"Esse solo lunar não está bem representado. Me parece apenas um chão preto com pedras."*

### Scoring the prediction

**The call was right and the reasoning was half right, and the half I got wrong is the more
useful half.**

| I predicted | what happened |
|---|---|
| a MISS at 60/40 | **miss** |
| the body works | **works** — he shipped the side view outright |
| the turned WALK fails | **it did**, but not for the reason I gave |

I predicted the failure would be the gait decomposition — that a stride turned to face the
camera would swing its legs sideways. **That part was fine.** The back view keeps 65% of the
side view's motion.

What actually broke was three things I never considered:

1. **`Part.z` was never yawed at all.** The visor sits on the front of the helmet at `z: -3.6`
   and stayed on the camera side in every facing. Rotating a part's `x` and leaving its `z` is
   not an approximation, it is half a rotation — and I wrote the transform believing it was
   complete enough to name its own weaknesses.
2. **The compass signs were inverted.** North turned the face toward the camera. A sign.
3. **The arms were animated at nine degrees**, which is not restraint, it is a still image. I
   had a true fact — Apollo crews loped with their arms out rather than swinging them — and
   applied it until the animation stopped.

**The lesson, and it is about the prediction rather than about the code:** I predicted the
failure of the part I had *thought hardest about*, and shipped three defects in the parts I
had not thought about at all. **A declared risk is a place I was already looking.** Next
prediction should name what I have not examined, not what I have.

**The capability the miss specifies:** not *"a gait that survives being turned"*, which is what
I guessed. It is **a body that survives being turned** — every field that carries a position
has to rotate, and I had only rotated some of them.

### My prediction, recorded before he looks

**I predict a MISS**, and the reason is one specific half of the sentence.

*"andar em todas as direções"* lands squarely on the gap named on 15/08 and never built:
**facing — one direction is rendered.** Everything else here is reachable with what exists.
A suited body is bulky primitives; lunar ground is a plane and a field; the Earth is a
sphere with a terminator; a jump is gravity in the runtime, which is twenty lines.

Eight directions is not. The plan is to **yaw the body** — rotate every bone offset and every
solid about the vertical axis, which the 2.5D vocabulary can express exactly for a capsule
and near enough for an ellipsoid. That produces a silhouette from any angle from one authored
body, and I believe that part works.

**What I expect to fail is the WALK, not the body.** A stride is authored as limb rotation in
the *screen plane*. Yawed to face the camera, that same rotation swings the legs sideways
instead of forward, and the fix — decomposing each swing into `angle × cos(yaw)` plus
`z × sin(yaw)` — is an approximation I have never tested. A front-facing walk that reads as a
side walk seen head-on is the specific way I expect this to come back.

**Confidence: 60/40 toward a miss.** The one thing running in its favour is the subject: a
pressure suit is close to rotationally symmetric, so front and side silhouettes differ less
than they would on any other body. That is luck rather than design, and it should be counted
as luck when the verdict arrives.

**If it misses, the capability it specifies is:** *a gait that survives being turned* — which
is a bigger and more useful thing than eight sprites of an astronaut.

**Neither column kills anything** — his correction, 15/08. They are evidence for a judgment
he holds himself and will not reduce to a metric. **A miss is a specification, not a
strike:** its output is the name of the capability that was missing, which is what every
miss in this project has actually produced (`CLAUDE.md`, gate block).

**Retired:** gate v1 (find-the-impostor, logic hole) and gate v2 (six loops
ranked against five shipped ones — the five files never arrived, and I asked three times
without once explaining what they were). `refs/` is no longer needed by anything. And v3's own first draft, which tried to make a
threshold do his deciding for him and lasted one turn. **The pattern is the finding: three
gates, three ways of moving the judgment away from the only person who has it.**

**Prior verdicts, kept because they are still evidence** — they were readings of *movement*,
not gate readings:

| date | subject | his words |
|---|---|---|
| 15/08 | run 3 vs run 2 | "não superou, mas aprecio a tentativa" |
| 15/08 | run 4 vs run 2 | "não vou dizer que superou... com mais algumas iterações, ficaria no mesmo patamar" |
| 15/08 | run 5, the gorilla walk | "dá pra sentir seu peso caindo e a fidelidade com movimento" |
| 15/08 | run 7, depth + jump + attack | "gostei muito... não sinto uma mudança visual, mas a movimentação e os detalhes estão melhores e mais fluídos" |
| 15/08 | run 8, the ink probe | Chrono first; Stardew and the incumbent tied last |
| 15/08 | run 9, the tree, first pass | "ficou horrível" |

---

## Next round — **his word on batch 2**, and nothing is chosen until it arrives

- **What ships:** `node bin/micro.ts --serve`, route `/cozy`. A kitten climbing an endless
  tower of garden shelves at dusk. Arrows steer; the bounce is automatic; a fall ends the run
  and names the height.
- **What closes it:** one word from him, plus one or two words of why on a miss.
- **My prediction is at the top of this file**, written before he looked, and it names the cat
  rather than the loop.
- **Nothing after this is chosen yet, and that is deliberate.** A miss is a specification, and
  a feature picked without one is a guess (`CLAUDE.md`, gate block).

---

## Dead — **the exporter**

_Killed 15/08 with the scope redefinition, and the section that described it as "a requirement
now" sat in this file for a day after. §3b.4 caught it at a cycle open on 16/08._

Exporting to somebody else's engine was building a bridge to a competitor, and it answered a
requirement that has been replaced. What replaced it: **can a fresh agent, given only this
repository, build a small game?** `src/export/contract.ts` and its locks stay — a declared
output contract costs nothing and is the thing that would be needed if this ever came back.

---

## Previous round — run 7, closed 15/08

Depth solver, jump and attack. **His verdict:** *"gostei muito... não sinto uma mudança
visual, mas a movimentação e os detalhes estão melhores e mais fluídos"*. The walk control
held, so the engine stays and nothing was rolled back — and the "no visual change" half
scored a prediction of mine at zero (`TASTE.md` §2a).

---

## Superseded — the silhouette/value pair

_(Rewritten 15/08 at a cycle open: this section still named the
silhouette/value pair as "next", three runs after it was settled by being built into every
sample since — `outline.rim` is on in every shipped tunables file. §3b.4, and it is the
"backlog describes a dead product" failure in §10 caught one step early.)_

- **Axis:** **weight and impact outside a walk cycle**, on the body that already landed.
- **The change underneath it:** depth is solved rather than authored (`DECISIONS.md`,
  15/08). 2.5D — a z-buffer, no projection divide, so nothing moves on screen and only
  occlusion changes. **Locked in `tests/depth.test.ts`, seven assertions, both null cases.**
- **The three samples, and the third one is the control:**
  - **JUMP** (`runs/gorilla-jump.run.json`, gallery #0018) — six phases on a 12-frame grid,
    three frames of crouch and one from contact to the bottom of the absorb.
  - **ATTACK** (`runs/gorilla-attack.run.json`, gallery #0019) — five phases; the near fist
    travels from behind the torso to clear in front of it inside one cycle, which is the
    thing no paint order could express.
  - **WALK** (`runs/gorilla.run.json`, gallery #0017) — **run 5's gait, unchanged**,
    re-rendered through the solver. One variable. Without it, a bad reading cannot be
    attributed to the engine rather than to the two new actions.
- **What closes it:** his verdict, below. All three clear rungs 1–3.
- **Open, named rather than fixed:** the light still lands from the upper left, so the
  gorilla's face is the darkest region on a body that faces right. Pre-existing, unchanged
  by this round, and it is a knob (`light.x`) rather than a defect — but it is the first
  thing to try if the head reads badly.

---

## Previous round — frontier probe, closed 15/08

- **Axis:** sprite idiom. First round on the axis → **frontier probe** (§3.0).
- **Bar:** `TASTE.md` §1b — Stardew as control, Chrono Trigger as target, Comix Zone as
  declared overshoot.
- **The question, and the cost:** which idiom the model sustains with the arthropod
  subject, in motion. Cost: 4 disposable samples. **Unblocked since 14/08** — round zero
  is closed, so the whole cost of this round is now the samples themselves.
- **The four samples, and the spread brackets:**
  - **A — Stardew idiom.** Small sprite, few tones, 4 frames, cohesion over virtuosity.
    **Control.** If A does not clear, the round answered everything.
  - **B — Chrono idiom.** Silhouette and value separation carrying the weight, contained
    frame count, real anticipation. **Target.**
  - **C — high-budget idiom.** Many tones, gradient, per-pixel noise. It is the direction
    my bias pulls toward, and it is here **to be knocked down by looking**, not by
    argument.
  - **D — Comix Zone idiom, on a humanoid.** **Declared overshoot.** Changes subject and
    idiom on purpose. The prediction is that it fails visibly; if it does not fail,
    `TASTE.md` §2b is wrong and that is the round's finding.
- **Probe needed?** Yes — it is the first round on this axis.
- **Status, 15/08: the four samples exist, render, and are kept.** `node bin/serve.ts` puts
  all four on the page as history, live run first. **The round is not closed** — it closes
  on the human's verdict, and the ink question below rides with it.
- **This round's knobs, and where they landed.** Tones per material opened at 3/4/8 across
  A/B/C — the 3–6 range was declared and C deliberately overshoots it. Walk frames landed
  at 4/8/12/8, forced to multiples of the gait's four named phases by a defect found while
  looking. Every sample shares a **600 ms cycle** so the sheet never compares walking speed.
  Two knobs were *born* this round and are now open: **`outline.inner`** and
  **`light.curve`**.

---

## Open

- [x] **Round zero.** Deterministic core `sprite(grammar, params, seed) → indexed
      buffer`, no DOM, no clock, no `Math.random`. Blocks everything. **Closed 14/08** —
      `HARNESS.md` §4 acceptance ticked item by item; `npm test`, 22 locks green.
- [x] **Perception channel.** `node bin/bench.ts` — contact sheet in luminance blocks,
      frames side by side, 25% silhouette strip, and the counts underneath.
- [x] **Null case for the channel, before believing it.** `tests/channel-null.test.ts`,
      four cases: subject off prints an empty sheet; the dump loses no ink (printed
      characters = painted pixels, so a dark outline can never collapse into background);
      the 25% reduction separates two frames I know differ; an authored part that never
      reaches the buffer is caught by the count while the sheet still reads as a body.
- [x] **Silhouette lock at 25%** — `tests/silhouette.test.ts`. Reduce, threshold, and what
      survives must still be **one body**: the share held by the largest connected blob,
      because coverage alone would pass a cloud of dust.
- [x] **Value lock** — edge contrast against the ground, in luminance, per frame. Calibrated
      on the sample that failed by eye: the high-budget idiom had a boundary pixel **0.058**
      from the ground, which is a pixel nobody can see. Floor is 0.10 min, 0.25 mean; both
      answers of the silhouette round clear it. The ground the lock measures against is
      pinned by test to the ground the eye sees.
- [x] **Animation family lock** — `tests/animation.test.ts`. Margin **0.02 of the canvas**
      (≈ one leg, 46 px of 2304), calibrated in both directions: a twitch of 0.0009 passes
      byte-inequality and fails the margin. Part rotation orients the part; moving the root
      translates every pixel exactly; the gait's four phases are named and ordered.
- [x] **Absence lock** — pixel ownership per part, reported by `measure()` and asserted per
      grammar. Against absence, count; looking does not catch it.
- [x] **Latency of one bench turn.** Re-measured 15/08 on the heaviest sample in the repo:
      120 ms wall, 32 ms of it render, for 12 frames of 64×64. That is 10 ms over the
      ~100 ms reference in absolute terms and roughly **three times faster per pixel** than
      the 14/08 figure, which was 4 frames of 48×48. No work owed; re-measure if a sample
      ever needs more than ~16 frames.
- [x] **The human's channel.** A self-contained HTML page, no dependency, no network.
      **bench** (labels, `t`, pause, step) is mine; **gate** (no control, no label, no
      tooltip, nothing that names a cell) is his, and both are compiled from the same
      emitter so a cell can never be compared as a renderer: one blit path,
      nearest-neighbour, integer scale, and **one clock for the whole page** — a cell may
      declare a rate and a scale off it, never a timer of its own.
- [x] **Null case for the viewer, both ways.** `/selftest` shows a human what each
      failure looks like — **confirmed by him, all four cases, 14/08**; `tests/viewer-runtime.test.ts` runs the same inlined runtime
      headless against a fake DOM. Five defects planted, five caught — smoothing on,
      label leaked into the gate, empty payload, dead tick, index 0 painted opaque. All
      five flatter the sprite. That is the direction instrument defects come in.
- [x] **The live bench** (`bin/serve.ts`, `node:http` only). The page is opened once and
      never rebuilt: a change re-executes in a fresh process — no module cache to lie —
      and the frames swap **under a loop that never stops**, with every kept generation
      behind it. Locked both ways: it fires when the output changes and stays
      quiet when a watched file is rewritten byte-for-byte. Its failure mode is stale
      frames I believe are fresh, which reads as "the defect is fixed".
- [x] **The export contract** (`src/export/contract.ts`), declared and locked before the
      exporter exists: fixed frame rect, pivot on the grid, named phases pointing at real
      frames, anchors, palette ≤ 256 with index 0 transparent, whole-millisecond timing.
      Compatibility with engines is an **output contract, not an architecture** — depending
      on one renderer would make the artifact less portable, not more.
- [x] ~~**The exporter**~~ → **dead 15/08**, with the scope redefinition. The output contract
      and its locks stay; nothing builds against them.
- [x] ~~**The forest still has a mechanic and no consequence.**~~ → **Closed by him, 16/08,
      without being built:** *"O microgame do gorila está fechado. Se no futuro eu decidir
      revisitá-lo eu te aviso."* The pattern exists in the climb if it is ever wanted. Same
      answer closes **the attack that lands looking like one that misses** — both defects live
      inside that one game.
- [x] ~~**A 4 px enclosed pocket between the gorilla's legs.**~~ → **Closed by him, 16/08:**
      *"Não percebo isso visualmente, nem precisamos revisitar isso."* A defect nobody can see
      is not a defect; it is a number I found. Kept in `DECISIONS.md` and off this list.
- [ ] **`compose.ts` and `layers.ts` are still two paths and still uncompared** — for every
      scene that is not a climb. The climb resolved its own half by refusing outright, which is
      honest and is not the general fix.
- [x] ~~**Every clip of a subject renders twice under two cache keys.**~~ → **Fixed 16/08 at
      his instruction:** *"Isso é ruim. Em jogos mais robustos vai custar caro esse desperdício.
      Vamos resolver isso."* The scale is resolved above the main build instead of below it, so
      one picture has one key. **83 layers → 79, 2245 KB → 2176 KB of indices, and every stage
      now carries zero byte-identical layers.** Locked in `tests/performance.test.ts`, with its
      null case.
- [x] ~~**The "sprite in situ" axis**~~ → **done, and content asked for it rather than a plan.**
      Three micro games, each a loop inside a real scene with a camera, parallax and
      neighbours. _(Ticked 16/08 at a cycle open; it had sat open through all three. §3b.4.)_
- [x] ~~**Image cells** — his five reference loops in the same blit path as mine~~ →
      **dissolved 16/08**, not solved. It belonged to gate v2, which was retired on 15/08, and
      gate v3 needs no reference files at all. _(§3b.4: it survived the gate that needed it by
      a day and a half.)_

- [x] ~~🔴 THE GATE HAS NEVER FIRED, and `refs/` does not exist~~ → **dissolved 15/08**, not
      solved: gate v2 was retired with the scope redefinition, so the five files it needed
      are no longer needed by anything. **Kept visible on purpose** — it is the record of a
      blocker I raised three times and explained zero times, and gate v3 exists in the shape
      it does because of it.

- [ ] **Mark portable/stack on every grammar rule in the turn it is born.** Standing, never
      ticked. Live since 14/08: `src/core/types.ts` and `src/core/skeleton.ts` carry
      `portable`, `src/grammars/fixture.ts` carries `stack`.
- [ ] **`TASTE-LOOP-LEARNING.md` §1, the thesis under test.** It is born at the close of
      round 1, not at the intake. The candidate: *the Taste Loop presupposes the human's
      taste at rung 5; discrimination is far cheaper than generation, and a discrimination
      gate extracts judgment without demanding direction.*

## Measured baselines

Every number here carries **the command that regenerates it** and the date. A baseline
without both is a rumour.

| what | value | command | date |
|---|---|---|---|
| one bench turn, wall clock | 170 ms | `node bin/bench.ts runs/tree.run.json` | 15/08 |
| render only, 16 frames of 64×64, 38 parts | 72 ms | `node bin/bench.ts runs/tree.run.json` (the `elapsed` line) | 15/08 |
| full cycle: record → replay → compare | 1.0 s | `node bin/record.ts /tmp/c.run.json && node bin/run.ts /tmp/c.run.json && npm test` | 14/08 |
| fixture baseline hash | `a542197e4c49b27d` | `npm run baseline` | 15/08 |
| min pair distance, shipped tunables | 0.106 | `node bin/run.ts runs/fixture.run.json` | 15/08 |
| locks green | 328 | `npm test` | 16/08 |
| the climb: worst gap in an infinite tower | 58 px, against a 96 px apex — ratio 0.60 | `npx vitest run tests/climb.test.ts` | 16/08 |
| the climb, draw calls per frame | 98, against a 200 ceiling | `node bin/micro.ts --static` then read the budget row | 16/08 |
| the climb, on the wire | 11 layers, 35 colours | `node bin/micro.ts --static` | 16/08 |
| **difficulty, and it is a PAIR because one number is not a reading** | never aims: **6.1 m then falls** · aims at the nearest shelf: **67 m in a minute, still climbing** | `npx vitest run tests/climb.test.ts` | 16/08, after his note |
| every hero's on-screen height | forest 132 px · moon 141 px · climb 132 px, all at a 3 px pixel | `node bin/micro.ts --static` | 16/08, after his note |
| outline as a share of painted pixels | kitten 28%, gorilla 27% — the drawing was never the difference | `node bin/bench.ts --grammar cat-rise --tunables cat` | 16/08 |
| gate page, tells found by grep | 0 | `node bin/gate.ts runs/probe-b.run.json && grep -cE "fixture\|label\|keydown\|button\|http\|seed" sheet/gate.html` | 15/08 |

## The harness, as of 14/08

Four commands, and the second is the loop.

| command | what it is |
|---|---|
| `node bin/serve.ts [runs…] [--set …]` | **the surface.** Open it once: the live run first, every kept generation behind it, `/selftest` for the viewer's null case |
| `npm test` | the locks. Determinism, baseline, tunables, both channels' null cases, the animation family, the export contract, the live bench |
| `node bin/bench.ts [run] [--set …]` | one bench turn in the terminal: contact sheet, 25% silhouette, counts, elapsed |
| `node bin/run.ts <run.json>` | headless: state hash and metrics, no presentation layer |
| `node bin/keep.ts <run.json> [--topic …] [--note …]` | keep a generation by hand. The live bench does it on every swap |
| `node bin/publish.ts` | the whole history as one static file → `dist/index.html`, deployable by dropping the folder |
| `node bin/record.ts <out.json> [--set …]` | capture what you are looking at into a replayable run file |
| `node bin/gate.ts <run.json>` | the gate sheet → `sheet/gate.html`. **The one page that is still a file**, and gitignored |

Nothing is written to `.out` any more, and nothing has to be regenerated to be looked at:
the page is served, the history is on disk, and both are always current.

Every tunable lives in `tunables/default.json` and is anchored there — the anchor is
locked, not a comment. A grammar is data in `src/grammars/`; `fixture` is the harness's
own subject and **is not content**.

---

## Held for the human

In a batch, with samples attached. **Every item carries the five lines of `CLAUDE.md` §4:
what to open, what to do, how long, what a pass looks like, what each answer changes.**
Written for him, so no method vocabulary crosses into this section.

- [x] ~~Check four things on the self-test page~~ → **all four confirmed by the human,
      14/08.** The viewer's null case now has the one link the headless locks cannot cover.
- [x] ~~**Approve, change or reject the new gate reading.**~~ → **Answered.** Adopted 14/08
      as written below, then amended by him on 15/08: the end condition is the date, not a
      strike count. Both are in `CLAUDE.md`'s gate block. _(Ticked 15/08 at a cycle open —
      it had sat open in this file for a day after being settled twice. §3b.4.)_

- [x] ~~The five reference loops~~ → **no longer needed.** Gate v3 needs no reference files
      at all; it needs one sentence of commission and one word of verdict.

- [x] ~~🟡 **Should the gorilla, the photographer and the trees be asked the seam question?**~~
      → **Answered 16/08: LEAVE IT.** *"Não vamos mais mexer nesse micro game. Deixemos como
      está."* The 135 hidden lines stay. They are recorded here and in `DECISIONS.md` so that
      whoever lightens that coat one day knows what is under it. Asked 16/08:
      · *Open:* nothing. This is a yes/no about work you have already approved.
      · *What it is:* you told me the gorilla's limb contours were handled on purpose. They were
      not. The gorilla has 135 of those internal lines, exactly like the cat had — you cannot see
      them because the animal is black and the line is nearly black. The cat's are twice as
      strong against ginger fur, which is why they jumped out at you there.
      · *Do:* say **leave it** or **clean it**. "Leave it" means the gorilla keeps its hidden
      lines and I do nothing. "Clean it" means I remove them, which changes 135 pixels of 837 by
      an amount you probably cannot see today — but it stops the defect coming back if that
      animal ever gets a lighter coat.
      · *Time:* ten seconds.
      · *Answer changes:* only whether I touch three subjects you already passed. Either answer
      is fine and I am not asking because I think one is better.

- [x] ~~🟡 **Run 8 — one jump, three inks.** Asked 15/08.~~ → **Answered 15/08.** He ranked
      Chrono first; Stardew and the incumbent tied last. The verdict is compiled into
      `TASTE.md` §1 and §1b and into every palette authored since. _(Ticked 16/08 at a cycle
      open: it still said "this is the open round" a day after it was settled and acted on.
      §3b.4.)_
      · *Open:* `node bin/serve.ts`. Top row, three cells, same jump in three inks.
      · *Do:* put them in order, best first, and say one sentence about the worst one.
      · *Time:* two minutes.
      · *A pass looks like:* one of them clearly looks more like a game you have played.
      · *Answer changes:* which ink every future sample is authored in, including a
      re-render of the walk and the attack. If the incumbent wins, my reading of your
      "a tinta precisa aprimorar" was wrong and I go hunting the real cause among the four
      others I listed — palette range, speckle, light direction, or missing cast shadow.

- [ ] **Run 7 — the jump, the attack, and the walk as control.** SUPERSEDED, kept for the record. Asked 15/08.
      · *Open:* `node bin/serve.ts`. Three loops, top row, labelled jump / attack / walk.
      · *Do:* say which of the three you believe least, and one sentence on why.
      · *Time:* two minutes.
      · *A pass looks like:* the jump feels heavy landing, and the attack feels like it hits
      something rather than waving.
      · *Answer changes:* the walk is run 5's animation with nothing altered, so if the walk
      looks worse than you remember, the new engine did that and I roll it back. If the walk
      holds and an action is weak, the action is weak and the engine stays.
      · *Read:* the proposal below.
      · *Do:* say yes, or change a number, or name a different reading.
      · *Time:* five minutes, and it is the highest-value five minutes in the project.
      · *Answer changes:* everything downstream. Without a reading nothing can kill this,
      and a project that cannot fail is being decorated.

      **The reading, proposed:** six animated loops side by side, on the same tick — **five
      from shipped games, which he picks himself and may study as much as he likes**, and
      one of mine. He puts them in order by one question: *which of these would I believe
      came from a game someone shipped?* First is the most believable, sixth the least.
      · **Strike:** mine lands 5th or 6th.
      · **Non-strike:** mine lands 1st to 4th.
      · **Death:** three strikes in a row. The counter does not move.
      · **Stop — ceiling reached:** three readings in a row at the same position with no
      improvement. Not death: the grammar is finished, and where it stopped gets written
      down (`TASTE-LOOP-LEARNING.md` P2).
      · **Why it replaces the old one:** it needs no blindness at all, so it survives both
      the hole he found and the fact that he is about to learn my hand by judging rounds.
      · **What it costs:** he can be charitable to me in a way that pointing at an impostor
      never allowed. Two guards — the five references are **fixed once and reused for every
      reading**, so a movement in rank is my art moving and never the sheet moving; and
      4th place still means beating two shipped loops.
- [ ] **The five reference loops, once he approves the reading.** Asked 14/08.
      · *Do:* pick five walking loops from games he rates, at the level he wants me held
      to, and drop the files in `refs/`. Any format that plays.
      · *Time:* however long picking five good ones takes; there is no rush and no probe
      blocked on it.
      · *Answer changes:* their size and frame rate set what my cell has to be for the
      comparison to be honest. Picking weak references lowers the bar permanently, since
      the same five are reused for every reading.
- [ ] **Is "ink" in the name aspiration or direction?** Asked 14/08, waits for sample D.
      · *Open:* four looping animations, sent together.
      · *Do:* pick A or B. **(A)** the name is a wish, and the target stays Chrono Trigger.
      **(B)** the drawn, varying line is what he actually wants, and the target is wrong.
      · *Time:* two minutes.
      · *Answer changes:* B rewrites `TASTE.md` §1b and reshapes the probe before it runs.

## Closed

- ~~Readings check~~ → `DECISIONS.md` 14/08 · artifact
- ~~Availability and cadence~~ → `CLAUDE.md` §4 · focus week 14–21/08
- ~~Project name~~ → `claude-ink-2d`, chosen by the human 14/08
