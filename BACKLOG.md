# BACKLOG.md

What is **open**. What is settled lives in `DECISIONS.md`.

A **state** file. Owner of the numbers that change, re-derived when a verdict supersedes
it. It is also where a cold session picks up the work — read against itself at every cycle
open (`TASTE-LOOP.md` §3b).

---

## Gate — **the date is the gate**, as of 15/08 · one reading, 21/08

The reading is **my position among five fixed shipped loops**, and a run improves or it
does not (`CLAUDE.md` gate block). **Two readings taken so far**, both against run 2, both
negative — the table below. _(Corrected 15/08 at a cycle open: this block said "no reading
taken yet" directly above a table of two. §3b.4.)_

| date | reading | improved? | strike? |
|---|---|---|---|
| 15/08 | run 3 (three-quarter, three creatures) against run 2 | **no** — "não superou, mas aprecio a tentativa" | **strike 1** |
| 15/08 | run 4 (the beetle alone, three corrections, antennae up) against run 2 | **no** — "não vou dizer que superou, mas ficou boa também. Com mais algumas iterações, ficaria no mesmo patamar" | **strike 2** |

**The count is retired, at his call on 15/08.** Two readings say the same thing and they
still say it — run 3 and run 4 did not beat run 2 — but they inform direction rather than
kill. **The kill is 21/08**: one honest verdict on the ceiling reached and on whether the
artifact is worth publishing. Six days.

_Corrected 15/08 at a cycle open (§3b.4): a sentence here still read "two more readings
without improvement end it", which is the retired counter wearing prose. Nothing but the
date ends this. Where the plateau sits still decides **which verdict** the date gets — at
run 2's level or below, the grammar does not reach the bar; above it, the ceiling was
reached — but it no longer decides **when**._

**Unread, awaiting his eye:** run 5 (the gorilla walk) drew a verdict on weight but never a
gate reading; run 6 (the transformation) was dropped by him on 15/08 in favour of run 7 and
is kept in the history unread.

Full definition of the reading in `CLAUDE.md`'s gate block. Update **in the same turn** a
reading arrives.

---

## Next round — **run 8, the ink probe.** Open 15/08, verdict pending.

**First round on the ink axis, so it is a frontier probe (§3.0): three idioms, one
animation, and the spread brackets.** His design. Body, skeleton, parts, gait, canvas,
scale, frame count and every gait amplitude are frozen identical — whatever the three
disagree about is the ink, because nothing else may vary.

| | sample | budget | line | noise | light | gallery |
|---|---|---|---|---|---|---|
| **incumbent** | `gorilla-jump` | 8 tones | none, rim carries the edge | speckle 0.18 | soft, curve 1.25 | #0020 |
| **control** | `gorilla-jump-stardew` | 4 tones | outer + inner | none | flat, curve 1.0 | #0021 |
| **target** | `gorilla-jump-chrono` | 5 tones, wide range | outer + inner | none | raking, curve 1.1 | #0022 |

- **What it tests:** his diagnosis that form and movement are ahead and the surface is
  behind — and, underneath it, whether the incumbent idiom was ever right for a *complex*
  body. It was adopted on one verdict on one insect and never retested across seven runs.
- **The measurement, not yet a lock:** the same 667 body pixels split into **195** tone
  regions under the incumbent and **95** under the control, with 46% of the incumbent's
  regions a single pixel. Candidate round-zero instrument if this axis is confirmed;
  deliberately not compiled yet (§6, do not build the judge before the artifact).
- **My prediction, on the record so it can be scored:** the incumbent loses on this body,
  Chrono wins. The previous prediction I recorded scored zero.

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
- [ ] **The exporter** — indexed atlas PNG (zlib is stdlib) + the manifest, and a ~40-line
      example loading it in Pixi, and later Godot. Pixi as the **consumer that proves the
      claim**, never as a dependency. At the vertical slice: exporting disposable probe art
      is inventory.
- [ ] **The "sprite in situ" axis** — the loop inside a real scene, with camera, parallax
      and neighbours. This is where a game engine finally earns its place. Trigger: after
      the gate has taken a reading, never before — it adds a variable the published loops
      do not have, and the error would flatter mine.
- [ ] **Image cells** — his five reference loops decoded into the *same* blit path as mine,
      so the sheet never compares two renderers. Unbuilt: it cannot be null-cased without
      the files. Needed for the first gate reading.

- [ ] 🔴 **THE GATE HAS NEVER FIRED, and `refs/` does not exist.** Found at the 15/08 cycle
      open, and it outranks everything else in this file. `CLAUDE.md` defines the reading as
      *six loops side by side, five of them from shipped games that he picks* — and those
      five files have never been supplied, so the sheet the gate is defined against has
      never been built. What the table above records as two readings were **his verdicts
      comparing my run against my previous run**, which is a real signal about movement and
      is not the gate: it measures me against myself, and the whole point of the reading is
      that it measures me against published art.
      **Consequence, stated flatly:** on 21/08 the project's only direction metric cannot
      produce its verdict. Two things gate it and neither is mine to do first — the five
      files, and then Image cells above (~1 session, and it cannot be null-cased before the
      files exist). **Six days.** Raised to him 15/08.
- [x] ~~The gate sheet builder — shuffle, mapping file I never read~~ → **dead with gate
      v1.** Reading v2 needs no blindness, so it needs no shuffle and no hidden mapping:
      the human may know exactly which loop is mine and the reading still works.
- [x] **Every generation kept** (`gallery/`), at the human's request, 14/08. One JSON per
      generation with a new hash — indexed frames, palette, the run that made them. Rebuilt
      served by `bin/serve.ts` from the kept data and never from current code, so
      a refactor that changes the render shows up as a difference instead of overwriting
      the past. The live bench keeps automatically on every swap; the suite is barred.
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
| one bench turn, wall clock | 120 ms | `node bin/bench.ts runs/gorilla-attack.run.json` | 15/08 |
| render only, 12 frames of 64×64 | 32 ms | `node bin/bench.ts runs/gorilla-attack.run.json` (the `elapsed` line) | 15/08 |
| full cycle: record → replay → compare | 1.0 s | `node bin/record.ts /tmp/c.run.json && node bin/run.ts /tmp/c.run.json && npm test` | 14/08 |
| fixture baseline hash | `a542197e4c49b27d` | `npm run baseline` | 15/08 |
| min pair distance, shipped tunables | 0.106 | `node bin/run.ts runs/fixture.run.json` | 15/08 |
| locks green | 60 | `npm test` | 15/08 |
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

- [ ] 🔴 **The five reference loops — now the critical path, not a nicety.** Re-asked 15/08
      with the finding above attached: `refs/` is empty, so the gate has never fired once.
      · *Do:* drop five files in `refs/`. Any format that plays.
      · *Time:* however long picking five good ones takes — but it is the only item in this
      project with a deadline attached to it now.
      · *Answer changes:* whether 21/08 has a reading at all. Without the files there is no
      sheet, and without a sheet the date arrives with nothing but my own opinion of my own
      work, which is the "decorated, not steered" state the method names as the failure.

- [x] ~~**Run 7 — the jump, the attack, and the walk as control.**~~ → **Answered 15/08:**
      liked, no visual change felt, movement and detail better. Control held; engine stays.

- [ ] 🟡 **Run 8 — one jump, three inks.** Asked 15/08. **This is the open round.**
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
