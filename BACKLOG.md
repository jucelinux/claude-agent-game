# BACKLOG.md

What is **open**, as of 17/08 (distilled — closed items live in `DECISIONS.md` and on
branch `taste-loop-v1`). A state file: re-derived when a verdict supersedes it.

## Gate — v3, the commission test · running **6 of 7**, batch 8 half-read

| batch | commission | verdict | capability the miss specified | cost |
|---|---|---|---|---|
| 1 | astronaut, 8-way walk, moon | **miss** | a body that survives being turned (every positional field rotates) | 1 cycle, 1 reading |
| 2 | kitten platformer, cozy | **ships** | — (notes: difficulty ratio, presentation scale) | 1 cycle, 3 readings |
| 3 | skull runner, SOTN | **miss → answered 18/08: *"sim, agora é uma caveira"*** | **subtraction** (`Part.cut`) — spent, and the verdict is in | 1 cycle, 2 readings |
| 4 | skate + kickflip (roll + pixel-art experiment) | **ships** | — (spec carried: environments are basic) | 1 cycle, 1 reading |
| 5 | "o máximo do motor" → biplane barrel roll, `/aero` | **ships** | — (spec carried: obstacles must leave the screen before dying) | 1 cycle, 1 reading |
| 6 | snowboard, Yoshi's Island SNES aesthetic — "bem pixel art mesmo" | **ships** | — (spec carried: a named reference was met by ELEMENTS, not by fidelity) | 1 cycle, 1 reading |
| 7 | **the real test C**: down-slope camera + carve-amplitude composition, `/descent` | **ships** (cycle 2) | cycle 1 specified: **perspective — scale over distance, spawn at the vanishing point, the treadmill** | 2 cycles, 2 readings |
| 8 | **one game that kills every remaining 3D debt**, PS1 aesthetic, benched by a third person — `/arena` | cycle 1 **miss** (colleague) → cycle 2 **ships from HIM**; the colleague's bar still pending | **scale is the aesthetic** · a prop the SIM cannot see · a camera whose aim is not solved · **nothing on the plane is grounded** | 2 cycles, 2 readings |

**Batch 8, 17/08, his sentence:** *"Ainda temos pendências sobre o 3D e queria matá-las em um
único microgame… um bench que irei validar com outro humano, um liderado meu… 'Jogos com a
memória gráfica de ps1, com gráficos mais poligonais, com uma mecânica refinada'."* Three games
were offered; he took the mech duel, which was the recommendation, because **the yaw
approximation lives in the gait** and only a body that walks while it turns can test it.

**Shipped as `/arena` ("Hangar duel"), one model cycle. The 3D ledger closes.**

| debt | how it was paid |
|---|---|
| yaw had no runtime channel | 12 generated headings; the band is `bodyHeading − cameraHeading`, chosen per frame — the `/descent` band technique on rotation |
| the yaw gait approximation was never measured | **measured, and the batch-1 prediction is refuted** (below) |
| the three axes never composed | `mech-boost` pitches and rolls its root, and the generator yaws the result |
| no camera that rotates | position AND heading on a plane, both moving every frame, over the shoulder with lag |

**The numbers, and the second one is the round's real finding:**

1. **The gait approximation is under a pixel and always was.** The record has said since batch 1
   that this was "the half most likely to fail". Measured on a 45° stride across every heading,
   against a true pose-then-turn: the run-14 depth-offset path puts the knee **0.877 units** off,
   the new rotation path **0.424** — on a 30-unit machine drawn 34 px high, **0.99 px and 0.48 px**.
   The prediction is refuted by measurement.
2. **A half turn was being treated as the identity, and that cost 10.7 units.** `yaw()` guarded
   its gait decomposition on `sin θ` alone; at 180° the sine is zero and the cosine is −1, so the
   rest pose mirrored and the gait did not. **It never shipped** — the astronaut generates five
   facings and none is west — and the mech's twelve walked straight into it. Found by an outlier
   in the new instrument, not by looking.
3. `roll` had never been decomposed under a yaw at all: a banking machine banked about the
   camera's axis instead of its own. Fixed, and measured against its own absence.

**The aesthetic is a capability: `texture.facet`.** A new quantiser that snaps the surface normal
to a lattice, so a smooth solid shades as flat plates with hard creases — one normal per face,
which is what fixed-function hardware did. 0 is byte-identical and every subject before run 21
carries 0; the machines and the hangar carry 2.

**Prediction (one line, before either of them looks):** SHIPS at 55/45 from HIM, and the 45 is
the mechanic rather than the look — a duel is the first game here with an opponent, and "refined"
is a bar no instrument in this repo can read. From the COLLEAGUE I predict the reverse split: he
answers the picture first, and the risk there is that facets on a 34 px body read as noise rather
than as polygons.

**Scored: half right, for the wrong reason.** The colleague did answer the picture first and it
was a miss. But the facets were not read as noise — they were not read at all, because a 34 px
body has no plate big enough to hold a crease. The prediction named the right axis and the wrong
mechanism, which is the §2a bias about confidence sitting on the axis I examined most.

### Batch 8, cycle 1 — MISS, the colleague's words unsoftened

> *"Eu não gostei dos gráficos. Pareceu aquelas tentativas de 3d em jogos 2d (Sonic 3d, Crack
> Down). Eu esperava algo mais poligonal mesmo no estilo Armored Core (mechas grandes na tela,
> uma tela maior, mais velocidade, dinâmica)."*
>
> *"Existe um barril no mapa e esse barril não serve para nada: não há bloqueio do projétil nele,
> quando eu me aproximo, percebo que ele está flutuando ao invés de posicionado no chão."*
>
> *"O strafe está funcionando, porém a depender da relação de distância e ângulo que estou do
> inimigo, simplesmente a cena vai para um ângulo em que não consigo visualizar nem meu player,
> nem o inimigo."*

He named the technique exactly: banded-yaw sprites on a projected floor **are** the Sonic 3D
method. The four things he asked for decompose into one number and three defects.

**The number is SCALE, and the record already owned it from the other side** (batch 4: *"the
cause is scale, not the drawn line"*). Frame 240×150 → **288×180**; machine 34 px → **60 px**,
a third of the frame's height; the duel held at 70–130 units → **44–88**; every speed raised.

| defect | the layer it was really in | what shipped this cycle |
|---|---|---|
| *"a cena vai para um ângulo…"* | **units.** `project()` read a heading stored in TURNS as if it were radians, so the rig and the view agreed only at zero and parted on the first strafe | the conversion, plus a rig split in two — the boom lags (it is what spends the yaw bands), the aim is SOLVED every frame as the bisector of the two machines, clamped so the player cannot leave the frame |
| *"não há bloqueio do projétil"* | **the simulation never had the prop.** Pillars were hashed inside the DRAW loop | one list, held by the sim: shots die on it, machines are pushed out of it, and the columns are spread at twice the keep-out so one pass is exact |
| *"ele está flutuando"* | **three causes, not one.** No contact shadow anywhere; the pillars shared the machines' scale ladder so they STOPPED GROWING at arm's length; and every sprite was stamped by its origin — which for a mech is its core, so the machines had been hovering a leg's length above the floor since the first build | projected ground ellipses under everything that stands; a pillar ladder of its own reaching 3.2; `anchor: 'foot'` |
| *"esse barril não serve para nada"* | also **placement**: seven columns on a rim while the duel was fought in the middle | nine, spread from a fifth of the way out to four fifths |

**What the LOOK caught that no count could** (`CLAUDE.md` §5.4, two entries this round):

1. **A scale band is a fraction of the authored size, and for one build it was not.**
   `build({ scale })` sets `body.scale` *absolutely*. That was the same number for as long as
   every arena tunable sat at 1; the moment the machines were authored at 1.76 the enemy
   rendered at 0.79 of ONE — less than half what the projection asked for. Every sprite was
   internally perfect, every budget inside its ceiling, 53 locks green. One frame of the game
   showed it. Locked now, with the null case.
2. **`shadow.steps` cannot be cut.** It is 70 percent of the raster (45 ms → 13 ms at 0), so it
   was the obvious saving for an 8.5 s page build. At 4 the plates flatten and the era's hard
   cast shadow goes with them — the one thing the colleague named that the counting channel
   cannot see. Cost kept, and written down rather than hidden.

**Still open on this batch:** the colleague has not seen cycle 2.

**Named limitations, cycle 2 — carried on purpose, not overlooked:**

- **A machine closer than the rig snaps down.** The scale ladder tops out at 1, and the enemy
  asks for up to 1.57 when it flies past the camera — about one frame in seventy, measured. A
  band above 1 for the machines costs 1.5× the whole arena build; the pillars got one because
  they are cheap and because *"flutuando"* named them. Spend it when a verdict does.
- **`/arena` builds in 8.5 s**, the shelf's slowest by three times, and the shelf has no cache
  by design. The one large saving (`shadow.steps`) was measured and refused by the look. The
  next honest lever is the boost clip's 9 frames, and that is an animation decision, not mine.
- **Twelve yaw bands, and a locked duel can only reach them through the dash and the boom's
  lead.** The cone is a theorem about framing cameras (`DECISIONS.md`, 18/08). One varied drive
  reaches 12 of 12; a passive one would not.

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

**Cycle 2 verdict, 17/08, unsoftened — it ships.** *"Gostei do resultado! De fato agora percebo
a sensação de movimento e profundidade. Percebi o crescimento de forma suave, sem saltos."*
Prediction scored: called ships at 60/40, right — and the 40 (does the band growth read smooth)
is the exact thing he certified in his own words.

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

- [x] **The skull, 18/08: *"sim, agora é uma caveira!"*** — batch 3's miss is answered and
      **subtraction gets its verdict**. He volunteered a second thing nobody asked about:
      *"nesse ajuste eu gostei da fluidez da animação. Antes estava com uma animação
      desengonçada, agora vejo um personagem correndo."*
      **That credit does not belong to the cut.** The same round replaced the runner's frame
      rule: it was `dist / 2.2`, a divisor I picked, which at the speed cap ran 9.9 stride
      cycles a second — his own earlier words, *"parece que ela está correndo em
      supervelocidade"*. It is now `dist / (strideLen / frames)` with `strideLen` **derived from
      the body**: a sprinter covers about 1.2 of its own height per stride and this one is 34 px,
      so 41. Two unrelated fixes shipped in one round and he read them as one improvement —
      which is the §1 rule that he grades a GAME, never a round, seen from the flattering side
      for once.

- [x] **`/arena` cycle 2 — HIS half, 18/08: SHIPS.** *"Eu adorei o jogo. Após as correções eu
      me senti num jogo de robôs do PS1. As correções foram certeiras e a mecânica do jogo
      melhorou também."*
      **Prediction scored, and I split the two humans along the wrong seam.** I predicted him
      ships at 60/40 with the 40 on the duel feeling thin — right verdict, and the named risk did
      not appear; he said the mechanic improved. But I had assigned the PS1 axis entirely to the
      colleague, and he answered it himself, unprompted and positively. **A bar named for one
      reader is not invisible to the other.**
      Also: *"as correções foram certeiras"* is the miss-as-specification loop closing in one
      cycle — a defect list from the bar-holder converted directly into a ship from the
      taste-holder, with no round of guessing in between.

- [ ] 🔴 **The colleague's second reading on `/arena` — the only thing batch 8 still waits for.**
      · *Open:* the shelf → `/arena`. · *Do:* one duel, ~2 minutes. One word plus one word of why.
      · *What changed since he looked:* twice the machine on screen (60 px in a 288 px frame,
      against 34 in 240), a duel held at half the range, a camera whose aim is solved rather than
      eased, columns that stop shots and stand on the floor, and a contact shadow under
      everything.
      · *Changes:* **ships** → the two readers agreed, and the aesthetic vocabulary gains "PS1"
      as a met bar. **misses** → his word says whether "poligonal" is still about SIZE or about
      something the facet cannot reach, and that word is the next round. A disagreement between
      the two is still worth more than either agreement, and it is now the LIKELY outcome
      rather than the hoped-for one — Jucelinux has already shipped it.

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
- [x] **The look amendment is measured, and round 3 answers it: the look STAYS.**
      Round 1 of 3: caught 3 scene facts, verdict unchanged. Round 2 (batch 5): caught 2 scene
      facts, zero sprite facts, ship unchanged — and his verdict named neither. **Round 3
      (run 22, batch 8 cycle 2) caught two things, and the first would have cost the round:**
      a scale band was setting `body.scale` absolutely instead of as a fraction of the authored
      size, so the enemy rendered at less than half the size the projection asked for — with
      every sprite internally perfect, every budget inside its ceiling and 53 locks green. No
      count could reach it; one frame of the game did. The second was the reverse: the look
      REFUSED a saving (`shadow.steps`, 70% of the raster) because cutting it flattens the
      plates. Two rounds of nothing and one round that paid for all three.
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
| locks green | 575 | `npm test` | 17/08, after run 21 |
| locks green | **612** | `npm test` | 18/08, after run 22 |
| **the yaw gait approximation, measured at last** | legacy 0.877 units = **0.99 px**; exact 0.424 = **0.48 px** (30-unit machine, 34 px on screen) | `npx vitest run tests/arena.test.ts` | 17/08 |
| the half-turn defect, before the fix | **10.7 units** at band 6, against 0.4 at every other heading | same command, band sweep | 17/08 |
| `/arena` budget, cycle 1 | 100 layers, 35 colours, 21 calls/frame of 200, 338k px to decode, 60 fps measured | `node bin/micro.ts --static` | 17/08 |
| **`/arena` budget, cycle 2** (288×180, 60 px machine, 9 columns) | 153 layers, 34 calls/frame of 200, **1.6M px to decode**, 6.4 MB resident, 2.56× overdraw | `node bin/micro.ts --static` | 18/08 |
| **`/arena` page build, and it is the shelf's slowest by three times** | **8.5–9.2 s** — 12 headings × 2 clips × 6 sizes on a 60 px self-shadowing body | `node -e` over `toStage(arenaScene)` | 18/08 |
| the self-shadow's share of the raster | 45 ms → **13 ms** at `shadow.steps` 0; the look refuses the saving (plates flatten at 4) | `node bin/bench.ts --grammar mech-walk-0 --tunables mech --set shadow.steps=N` | 18/08 |
| the framing clamp, measured over 9 strafe cadences | worst **60.2 px** off centre of a 79.5 px bound, 144 px half-frame; on the broken build, **417 px** and the player lost behind the camera | `npx vitest run tests/arena.test.ts` | 18/08 |
| the scale a machine actually asks for in play | **0.31 – 1.57**, mass at 1.0 (the player, pinned) and 0.5–0.7 (the enemy); a pillar reaches **5.5** | driven through `tests/harness.ts`, 6000 frames | 18/08 |
| yaw headings reached in one varied drive | **12 of 12** — 6 by the player, 8 by the enemy, and the overlap is why both are needed | `npx vitest run tests/arena.test.ts` | 18/08 |
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
