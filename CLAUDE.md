# CLAUDE.md

The project instance. The method lives in `TASTE-LOOP.md`; the harness in `HARNESS.md`.
**Only this file changes between projects.**

## Session start

Read, in this order: this file → `TASTE.md` → the last 20 lines of `DECISIONS.md` →
`BACKLOG.md`. Then `TASTE-LOOP.md` and `HARNESS.md` if the session involves running a
round or building the harness, and `TASTE-LOOP-LEARNING.md` if it involves the method.
Do not write code before that.

Then run the **cycle open** — `TASTE-LOOP.md` §3b.

**The gate — the project's only direction metric.**

- **The reading:** a sheet of **animated loops**, 6 in all — 5 from published games, 1
  mine, shuffled by script with the mapping in a file I do not read. The human knows there
  is exactly one impostor and points at it. The reading is **correctness + time to point**.
- **Strike:** a correct call in under ~10 seconds.
  **Non-strike:** a wrong call, hesitation past ~10 s, or "I don't know".
- **Death condition:** 3 consecutive strikes kill the thesis.
- **It counts STRIKES: zero is the best state, not the worst.**
- **First reading:** round 1 proper, after the frontier probe settles the idiom. The probe
  gets no reading — disposable samples are not the thesis.
- **Standing at 0 of 3 on 14/08.** The live count lives at the top of `BACKLOG.md` and is
  updated in the same turn the reading arrives; `DECISIONS.md` records that it changed,
  never by how much.

**Why animated and not still, and why that is load-bearing.** A still sprite of mine
passes for good far more often than a sprite of mine walking. A gate on stills lies in my
favour on exactly the axis the project exists to test. If the core changes, the gate
changes with it — and a replacement that cannot kill is not a replacement.

**Why find-the-impostor and not "is this good?".** This project's human declared that
visual creative direction is his largest gap (§4). Discrimination is far cheaper than
generation: someone who does not yet draw can still point at the forgery. The gate
extracts judgment without demanding direction, and that is why it has this shape.

---

## 1. The project

- **Name:** claude-ink-2d _(chosen by the human, 14/08)_
- **What it is:** a reusable sprite and animation grammar for articulated bodies.
- **One-line pitch:** turning drawing into constraint satisfaction produces an artifact
  that outlives the project — and the Taste Loop is what takes it to the bar.
- **Target:** indexed 2D sprite for games, judged by direct comparison against published
  art.

**The reading, chosen on 14/08 (`INTAKE.md` block 5): the project is the ARTIFACT.** A
reusable grammar that happens to test the loop. Not the inverse. Three consequences, and
all of them change what gets built:

1. **Reusable is harvested, not designed.** Build for the arthropod and only for the
   arthropod; mark each rule **portable** or **stack** the moment it is born. Generality
   designed early is the same "late and narrow" failure in better clothes.
2. **The gate can still kill, and now it kills something else.** Under the capability
   reading, 3 strikes would kill the project. Under the artifact reading, 3 strikes say
   *this grammar does not reach the commercial bar* — and the grammar still exists at a
   lower bar. **Declared cost:** this is exactly the shape the known gap "no stopping
   rule" takes here. A nice little grammar that never reaches the bar is the most
   comfortable state possible, and nothing in the method detects it.
3. **What remains at the end is the grammar repository**, not the gate sheet.

**The three questions of `TASTE-LOOP.md` §4, answered in writing.**

| | Answer |
|---|---|
| **Core** | `sprite(grammar, params, seed) → indexed buffer`. Deterministic by construction: no clock, no `Math.random`, no DOM. Every scene is closed form in `t`. |
| **Sample** | An animated strip of one walk cycle, ~1 s, looping. Not a still. |
| **Bar** | Chrono Trigger, per axis (see `TASTE.md` §1b). |

**Binding details, as of 14/08.** Each one is a line in `DECISIONS.md` and binds just the
same. Do not reopen without a new line there.

- **The unit of work is the grammar, never a sprite.** I author a locked indexed palette,
  per-material ramps with a tone budget, a skeleton with named anchors, a frame matrix with
  named phases. The sprite is a *sample* of the grammar. Every round becomes a knob or a
  lock in the grammar. **Pixel retouching is drawing, and drawing is where my ceiling is
  low.**
- **Subject: arthropod.** A real grammar (segmentation, chitin, bilateral symmetry,
  articulated legs with documented gait phases), genuinely excellent game territory, and
  where my ceiling is highest — if it fails there, it fails anywhere.
- **Animation by transforming anchored parts**, not by redrawing frames. This is the cut
  that separates reachable from unreachable.
- **An open knob declares its point and its anchor every round.** Height, tone budget and
  frame count are negotiable *between* rounds, never undefined *within* one
  (`HARNESS.md` §2.7).

**Dead — do not restore from old notes.** Nothing yet. `DECISIONS.md` keeps carrying any
superseded line because it is append-only; superseded is not the same as wrong at the time.

---

## 2. Build order

1. **Round zero — `HARNESS.md`.** Deterministic core + **perception channel**. The channel
   is the expensive part here: it is the one instrument that has already betrayed me three
   times in the same file, and all three times by making the eye *approve* what it exists
   to denounce. Null case before believing anything the sheet says.
2. **Frontier probe** (`BACKLOG.md` → next round). Disposable samples.
3. **Vertical slice** of the grammar in the winning idiom.
4. **Taste Loop rounds**, pointed at silhouette, value and timing.
5. Judging apparatus — only if judging becomes the bottleneck. Trigger in `HARNESS.md`.

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript, Node, no DOM | The core has to run headless, under test |
| Output | indexed buffer → indexed PNG | A locked palette is verifiable in index space |
| Tests / locks | Vitest | Rung 2 is where taste compiles |
| Perception channel | text dump (contact sheet in luminance blocks) **+** frame strip side by side | Against wrong presence, look. Against absence, count |

No image dependency is proposed yet. Architecture rules in `HARNESS.md` §2 — those are
prerequisites of the harness, not preferences.

---

## 4. The human

Jucelinux. Software engineer, author of the Taste Loop, reference practitioner of the
method.

**The pleasure boundary, inverted — and it is the variable under test.** He declared that
the visual creative part is his largest gap and explicitly asked to delegate it. In every
other project the intake asks what the human wants to keep doing; here he is handing over
precisely the piece the method assumes he brings. **The Taste Loop presupposes that the
human has taste to spend at rung 5.** That is why the gate measures discrimination and not
direction.

He is the tiebreaker and the one who sets the bar — not an inspector. Rules for when to
call him in `TASTE-LOOP.md` §7. Short version: binary questions, in batches, never for
something a test resolves.

- **Availability, as of 14/08:** **focus week** — 14/08 to 21/08 dedicated to validating
  this experiment. He declined the three options I offered and named his own; that is the
  §7 pattern, and his answer is better than the menu.
- **Cadence:** several batches per week, not one. **High availability raises the
  FREQUENCY of batches, not their size** — size stays bounded by attributability (§3.6),
  which does not move with the calendar. Seven changes in one batch are still an
  unattributable reaction even with the human available every day.
- **The week is a de facto stopping rule, at project scope.** The method has none (§12,
  known gap). This one arrived free, via the calendar, and is worth recording as a
  candidate in `TASTE-LOOP-LEARNING.md` — an external deadline is the cheapest substitute
  for the missing rule, and the model has no fatigue to produce one on its own.
- **Delegation line:** the model applies alone — clear margin, rungs 1–3 green, already
  settled in `TASTE.md`. Waits for a batch — a tie, a direction call. Interrupts
  immediately — a gate strike, and nothing else.

---

## 5. Project-specific don'ts

- Do not add a dependency without proposing it first.
- Do not start content with round zero incomplete.
- **Do not retouch pixels.** If the fix does not fit as a knob or a lock in the grammar,
  it is not the fix — it is cosmetic, and §3.1 says the defect is almost never in the
  parameter you want to touch.
- **Do not assemble the gate sheet.** I do not reproduce published game art, and it is
  precisely the human assembling it that preserves his blindness.
- **Do not judge stills.** Every sample that reaches the human is in motion.
- **Do not generalize the grammar before it works once.** The artifact reading makes this
  tempting — "reusable" invites parameterizing over body plans on day one. Parameterizing
  before a sample passes the bar is building the judge before the artifact. Marking
  portable/stack is cheap; abstracting is not.
