# CLAUDE.md

The project instance. The method lives in `TASTE-LOOP.md`; the harness in `HARNESS.md`.
**Only this file changes between projects.**

_Scope redefined 15/08, by him, and this file was rewritten whole. What it replaced is not
wrong — it is superseded, and `DECISIONS.md` carries both halves._

## Session start

Read, in this order: this file → `TASTE.md` → the last 20 lines of `DECISIONS.md` →
`BACKLOG.md`. Then `TASTE-LOOP.md` and `HARNESS.md` if the session involves running a
round or building the harness, and `TASTE-LOOP-LEARNING.md` if it involves the method.
Do not write code before that.

Then run the **cycle open** — `TASTE-LOOP.md` §3b.

---

## The gate — version 3, **the commission test**

_Adopted 15/08. Versions 1 and 2 are both retired **unrun**, and that pattern is the most
important thing this section knows about itself — see "Why two gates never fired" below._

**The reading.** He names an object and an animation **in one sentence**, the way anyone
commissions an artist: *"a treasure chest that opens"*, *"a bat that flies"*, *"a torch
with a flame"*. I deliver, with **no further direction and no back-and-forth**. He answers
with one word.

**"Ships" means usable in a game AND he would be glad to have it there** — his call,
15/08, and he took the higher of the two bars offered.

- **Declared cost of that choice, so the retrospective cannot skip it.** One verdict now
  carries two questions — *can drawing be delegated* and *is the result good* — so a miss
  does not say which half missed. **Mitigation, and it costs him one word:** on a miss he
  says why in a word or two. That recovers the distinction without a second verdict.

**Two numbers come out of every batch, and both are the gate:**

| | what it is | what it means |
|---|---|---|
| **hit rate** | commissions that ship / commissions given | whether drawing is delegable at his bar |
| **cost to hit** | my bench cycles per shipped piece, and his attention per piece | whether it is delegable *economically* |

**What kills the project:** a hit rate that does not climb across batches. If, after
several batches, most commissions still come back as misses, drawing is not delegable at
this bar and the project has its answer. **Cost to hit is the second kill:** a hit rate
that only climbs because each piece costs more cycles is not a draughtsman, it is a very
patient apprentice.

**A batch spans kinds, deliberately** — creature, prop, character, effect, environment.
Breadth is the claim now, so a gate measured on one kind measures the wrong thing.

**Why two gates never fired, and why this one can.** Gate v1 (find-the-impostor) died to a
logic hole. Gate v2 (six loops ranked, five of them from shipped games) died because it
needed **five files he had to go and collect**, and across a week they never arrived — and I
raised it three times without once explaining plainly what they were, which is my failure
and not his. **Two gates specified, two gates never run: the pattern is that I design
readings whose setup cost falls on the human.** v3 costs him one sentence to commission and
one word to judge. That is the property that matters, and it outranks any elegance the
retired ones had.

**Every batch gets its reading written the same turn it arrives**, at the top of
`BACKLOG.md`. `DECISIONS.md` records that a reading happened, never the tally.

**No date.** The focus week's 21/08 deadline is retired with the conditions it belonged to
(his call, 15/08 — *"abri mão das condições impostas anteriormente"*). The stopping rule is
now the gate's own two numbers, which is stronger than a calendar because it can say *no*
as well as *time is up*. **The known gap this reopens** (`TASTE-LOOP.md` §12: no stopping
rule) is real and named: nothing now forces an end date, so the honest verdict has to come
from the numbers refusing to move.

---

## 1. The project

- **Name:** claude-ink-2d _(chosen by the human, 14/08)_
- **What it is:** an attempt to turn the model into a **draughtsman of game objects** — and
  the tooling that makes that possible.
- **One-line pitch:** he cannot draw, a great many people cannot, and he can say exactly
  what he wants in a game. If drawing can be delegated, the thing that proves it is
  something another gamedev can install.
- **The question under test, in his words (15/08):** *"Se o Claude fosse capaz de desenhar
  de forma econômica, faria sentido entregar essa responsabilidade para ele?"*
- **The failure condition:** it is not possible to turn the model into a draughtsman.

**Three requirements, all three load-bearing, all three from him on 15/08.**

1. **Breadth.** A draughtsman handles many kinds of object and many kinds of animation. One
   excellent gorilla is not the deliverable; the range is.
2. **The validation loop is the central risk, and it is a *drawing* problem.** His words:
   the no-images rule was never mainly about token economy — it is about **the most
   effective way for the model to draw**, because *validating is part of the drawing
   process*. Dozens of validation cycles per piece is where the cost and the quality both
   live. **This makes the perception channel a first-class axis, not support tooling.**
3. **It has to work outside this repo.** An engine that only runs here is not an artifact.
   **Target chosen 15/08: web / Pixi first** — same language as the core, so it is the
   cheapest route to a proof that actually runs. What ships in the end may be a library, an
   SDK, or something else; that is decided by what turns out to be reusable, not now.

**Binding details that survive the rewrite.** Each is a line in `DECISIONS.md`.

- **The unit of work is the grammar, never a sprite.** Locked indexed palette, per-material
  ramps with a tone budget, a skeleton with named anchors, a frame matrix with named
  phases. A sprite is a *sample* of the grammar. **Pixel retouching is drawing, and drawing
  is where the ceiling is low.**
- **Animation by transforming anchored parts**, never by redrawing frames. This is the cut
  that separates reachable from unreachable, and nine runs have not strained it.
- **An open knob declares its point and its anchor every round** (`HARNESS.md` §2.7).
- **Depth is solved, not authored** — 2.5D, a z-buffer, no projection divide (run 7).
- **The ink idiom is five tones over a wide value range, with a drawn line** (run 8, his
  ranking). Value range and region structure are two factors and both are required.

**Dead — do not restore from old notes.**

- **Subject: arthropod.** Superseded by gorilla, then tree, then breadth as a requirement.
- **Gate v1 and gate v2.** Both retired unrun. Do not reintroduce a reading whose setup
  cost lands on him.
- **The 21/08 date**, and the three-strike counter before it.
- **"Do not generalize the grammar before it works once."** It worked — the same body took
  a walk, a jump and an attack, and the same engine took a tree. **Generality is now the
  work**, under one surviving constraint: *harvest, do not design*. A rule earns its
  generality by being extracted from two subjects that already work, never by being
  imagined for subjects that do not exist yet.

---

## 2. Build order, as of 15/08

1. ~~Round zero — deterministic core + perception channel~~ **done, 14/08.**
2. ~~Vertical slice of a grammar~~ **done** — gorilla walk/jump/attack, tree.
3. **The exporter, and it has moved to the front.** Indexed atlas PNG (zlib is stdlib) plus
   the manifest `src/export/contract.ts` already locks, then a small Pixi loader that plays
   it. It was deferred on the grounds that "exporting disposable probe art is inventory";
   that reasoning died when *compatible outward* became a requirement instead of a wish.
4. **The perception channel, as a measured axis.** Interventions are judged by their effect
   on **cost to hit**, not by how nice the readout looks.
5. **Commission batches**, which is the gate running.
6. Judging apparatus — only if judging becomes the bottleneck. Trigger in `HARNESS.md`.

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript, Node, no DOM | The core has to run headless, under test |
| Output | indexed buffer → indexed PNG atlas + JSON manifest | A locked palette is verifiable in index space |
| Tests / locks | Vitest | Rung 2 is where taste compiles |
| Perception channel | text dump + frame strip + counts | Against wrong presence, look. Against absence, count |
| Consumer | **Pixi**, as the thing that proves the claim — never as a dependency of the core | An engine that cannot ingest the artifact means the artifact does not exist |

No image dependency is proposed yet; PNG write is stdlib zlib. Architecture rules in
`HARNESS.md` §2 are prerequisites, not preferences.

---

## 4. The human

Jucelinux. Software engineer, author of the Taste Loop, reference practitioner of the
method.

**The pleasure boundary, inverted — and it is the variable under test.** He declared the
visual creative part his largest gap and asked to delegate it. The Taste Loop presupposes
the human has taste to spend at rung 5; here he is handing over precisely the piece the
method assumes he brings. **He is not short of judgment — he plays a great deal and can say
exactly what he wants in a game.** He is short of the hand. That is the whole asymmetry the
project exists to exploit.

He is the tiebreaker and the one who sets the bar — not an inspector. Rules in
`TASTE-LOOP.md` §7: binary questions, in batches, never for something a test resolves.

- **Cadence:** several batches per week. High availability raises the **frequency** of
  batches, never their size — size is bounded by attributability (§3.6).
- **He stretches the rope on purpose.** His own words, 15/08: he will keep pushing to find
  the limits of the current setup so it can be extrapolated. **A question that sounds naive
  is usually a harness probe** — "leaves follow a mathematical pattern, could you draw the
  pattern?" was this project's own founding premise applied one level deeper than the model
  had applied it, and it turned into a primitive.
- **Delegation line:** the model applies alone — clear margin, rungs 1–3 green. Waits for a
  batch — a tie, a direction call. Interrupts immediately — nothing, now that the gate has
  no strike counter.
- **The shape of every ask, and it binds.** State, in plain language a fifteen-year-old
  would follow: **what to open · what to do · how long it takes · what a pass looks like ·
  what each possible answer changes.** No method vocabulary. **An ask he has to decode gets
  rubber-stamped, and a rubber stamp is worse than silence because it arrives looking like
  data.** Gate v2 died of exactly this failure — three requests for "the refs" that never
  once said what they were.

---

## 5. Project-specific don'ts

- Do not add a dependency without proposing it first. Pixi is a **consumer in an example**,
  never an import of the core.
- **Do not retouch pixels.** If the fix does not fit as a knob, a lock, or a primitive in
  the grammar, it is not the fix.
- **Do not judge stills.** Every sample that reaches him is in motion.
- **Do not design generality; harvest it.** Breadth is the goal now, and the failure mode
  moved with it: parameterising over subjects that do not exist yet is building the judge
  before the artifact, again.
- **Do not build a reading whose setup cost lands on him.** Two gates died of it.
- **Do not enrich the perception channel into a picture.** A channel that cannot show
  pixels forces every fix into the generative representation — that is §5's no-retouching
  rule enforced by blindness instead of by discipline, and it is very likely *why* text
  perception improved the drawing in his other repos. Enrich it toward **answering
  questions about parts**, never toward showing a better image.
