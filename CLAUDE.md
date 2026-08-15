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
important thing this section knows about itself — see "Why three gates got this wrong" below._

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

**A miss is not a strike. A miss is a specification.** — his correction, 15/08, and it
rewrites what this section is for. When a commission comes back short, the model's job is
**not** to iterate the sample. It is to name **which capability was missing**, so it can be
discussed and built. That is what every miss in this project has actually produced:

| the miss | the capability it specified |
|---|---|
| far limbs read as a lighting error | depth was being faked by paint order → the z-buffer |
| a limb absent in all twelve frames | a walk's amplitude cannot express an action |
| "ficou horrível" on the tree | every primitive was convex → the lobed primitive |
| the crown as a sponge | 28 parts in a 30×28 px space, past a recorded ceiling |

**Two numbers are recorded every batch. They are evidence, never thresholds.**

| | what it is | what it is for |
|---|---|---|
| **hit rate** | commissions that ship / commissions given | whether the range is widening |
| **cost to hit** | model bench cycles per shipped piece, and his attention per piece | his stated central risk, instrumented |

**Nobody is killed by a number. He decides when this project ends, and he will not have a
simple metric for it** — his words, 15/08. Five misses in a row are a prompt to *design*,
not a verdict to *quit*.

**The residual risk, named rather than solved.** `TASTE-LOOP.md` §12 lists "no stopping
rule" as a known gap, and its reasoning is that the party with the incentive to continue
should not be the one deciding when to stop — which is the model, not him. A threshold was
the wrong answer to that; the right one is **behavioural and lands on me**: misses get
reported in his words and unsoftened, predictions get recorded before he looks and scored
after, and the numbers above go in the record whether or not they flatter. The safeguard is
that his judgment arrives well-fed, not that it arrives pre-empted.

**A batch spans kinds, deliberately** — creature, prop, character, effect, environment.
Breadth is the claim now, so a gate measured on one kind measures the wrong thing.

**The gate stays on drawing for now — his call, 15/08.** Drawing is the only subsystem with
a measured result, and swapping the reading would throw away the series that exists. **An
engine gate is born with the first playable slice and not before**: a reading with nothing
to read is how v1 and v2 both died.

**Why three gates got this wrong, and what survives.** Gate v1 (find-the-impostor) died to a
logic hole. Gate v2 (six loops ranked, five of them from shipped games) died because it
needed **five files he had to go and collect**, and across a week they never arrived — and I
raised it three times without once explaining plainly what they were, which is my failure
and not his. **And v3's first draft, an hour old, tried to make a threshold do his deciding for him.
Three gates, three different ways of moving the judgment away from the only person who
has it: a logic hole, then a setup cost dumped on him, then an automated kill.** v3 costs him one sentence to commission and
one word to judge. That is the property that matters, and it outranks any elegance the
retired ones had.

**Every batch gets its reading written the same turn it arrives**, at the top of
`BACKLOG.md`. `DECISIONS.md` records that a reading happened, never the tally.

**No date, and no numeric stopping rule.** The 21/08 deadline is retired with the
conditions it belonged to (*"abri mão das condições impostas anteriormente"*), and the
metric that briefly replaced it lasted one turn before he corrected it. **The stopping
decision is his, held in his head, and it is allowed to be.**

---

## 1. The project

- **Name:** claude-ink-2d _(chosen by the human, 14/08)_
- **What it is, as of 15/08:** **a game engine whose interface is a coding agent.** His
  words: *"o GameMaker dos agentes"*, and *"uma engine de jogos que permita que o usuário
  consiga construir seu jogo através de agentes de código"*.
- **One-line pitch:** he cannot draw, a great many people cannot, and he can say exactly
  what he wants in a game. The thing that lets him have it is not a better artist — it is an
  engine another agent can drive.
- **The failure condition:** it is not possible to build a game through agents with this —
  and **he calls it**, from judgment rather than from a threshold.

**This reframing renames what exists; it does not discard it.** Every property the harness
has was built so the model could draw without him watching, and each one turns out to be
what *any* agent needs to build *anything* without a human in the loop:

| property | why an agent needs it | built for |
|---|---|---|
| everything is text and data | an agent writes text | the sprite grammar |
| a deterministic core | an agent iterates and compares | round zero |
| a perception channel with no human in it | an agent sees its own output | round zero |
| a findings channel | an agent locates its own defect | 15/08 |
| locks | an agent verifies without asking | every round |
| every number anchored | an agent knows why a value is that value | `HARNESS.md` §2.7 |

**So the harness is the product, and the sprite grammar is subsystem one** — the one that
proved the pattern works on a visual artifact.

**Three requirements, and the third one changed on 15/08.**

1. **Breadth.** A draughtsman handles many kinds of object and many kinds of animation. That
   requirement survives intact: the drawing gate still runs, and drawing is still where the
   only measured results are.
2. **The validation loop is the central risk, and it is a *making* problem.** His words: the
   no-images rule is about the most effective way to work, because *validating is part of
   making*. **This now generalises one level up.** An agent building a game has to perceive
   the running game without playing it, which is the same problem as perceiving a sprite
   without looking at it. Deterministic simulation, a text channel, a findings list.
3. **~~It has to work outside this repo~~ → it has to work for agents other than this one.**
   The exporter is dead: exporting to somebody else's engine was building a bridge to a
   competitor, and it answered a requirement that has been replaced. What replaced it is
   harder and testable: **can a fresh agent, given only this repository, build a small
   game?** If not, the product does not exist however well it works when I drive it.

**The slice, chosen by him 15/08: a one-screen platformer.** A character, a floor, some
platforms, something to reach. It needs gravity, box-against-box collision, a jump and a
fixed camera — and it reuses more of what exists than the alternatives, because the gorilla
already jumps. **Build the engine only as far as that game needs it.** A game engine is
enormous and the failure mode is a thin version of everything and a good version of nothing;
the method's own answer is a vertical slice first (`TASTE-LOOP.md` §6).

**The architectural rule, inherited and now load-bearing twice.** The engine's core is a
**deterministic headless simulation**, and rendering is a consumer of it — exactly as
`sprite()` is deterministic and the viewer is a consumer (`HARNESS.md` §2.1). A recorded
input sequence must replay to the same state, or an agent cannot verify a game at all.

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

## 2. Build order, as of 15/08 — **re-cut when the product became an engine**

1. ~~Round zero — deterministic core + perception channel~~ **done, 14/08.**
2. ~~Vertical slice of a grammar~~ **done** — gorilla walk/jump/attack, tree.
3. ~~The exporter~~ **dead, 15/08.** It answered "compatible outward", and that requirement
   was replaced by "usable by agents other than this one". Exporting into another engine is
   a bridge to a competitor.
4. **The engine slice: a one-screen platformer.** In dependency order —
   deterministic headless simulation with a fixed timestep · entities · box collision and
   gravity · recorded input that replays identically · the animation state machine
   (idle, walk, jump, attack) · the browser runtime, which is mostly the viewer that
   already exists plus input.
5. **The agent's perception of a *running game*.** The same pattern as the sprite channel,
   one level up: a text readout of the simulation and a findings list — *the player never
   reached the goal*, *the player fell through the floor at frame 143*, *this gap cannot be
   cleared by any jump*. **This is the differentiator, not the platformer.**
6. **Drawing subsystem, item 4: pattern inside a part.** Deferred on purpose. No commission
   has failed for want of it yet, and building it now would be designing generality instead
   of harvesting it (§5). It enters when a commission needs it.
7. Judging apparatus — only if judging becomes the bottleneck.

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
- **Language rule, added 15/08, at his request.** Report to him in **ASD-STE100 Simplified
  Technical English**. If you write in Portuguese, use the simplified Portuguese of the
  aeronautical standard. The rules to obey:
  - Write short sentences. Use 20 words maximum in an instruction. Use 25 words maximum in
    a description.
  - Write in the active voice.
  - Use one word for one meaning. Do not change the word to make the text more varied.
  - Write one idea in one sentence.
  - Do not use metaphor. Do not use idiom.
  - Keep the articles. Do not remove words to make the text short.
  - Use a list when you show steps or items.
  - Use 6 sentences maximum in a paragraph.
  - Technical names and technical verbs of this domain are permitted. Examples: z-buffer,
    palette, ramp, primitive, gate, phase.

  **This rule agrees with the ask format below.** That paragraph already says an ask must
  use plain language. This rule makes the requirement exact instead of approximate.

  **What does not change:** the numbers, the declared costs, and the misses. Simple language
  is not less precision. If a result is bad, say that it is bad.

  **What this rule does not do:** it does not make the text shorter. Simple sentences use
  more space than dense sentences. A limit on length is a separate rule.

  **Scope:** reports to him. The repository files keep their present style. He must ask
  before that changes.

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
