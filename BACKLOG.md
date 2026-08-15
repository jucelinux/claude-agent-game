# BACKLOG.md

What is **open**. What is settled lives in `DECISIONS.md`.

A **state** file. Owner of the numbers that change, re-derived when a verdict supersedes
it. It is also where a cold session picks up the work — read against itself at every cycle
open (`TASTE-LOOP.md` §3b).

---

## Gate — 0 strikes of 3, as of 14/08 · **reading SUSPENDED, replacement held for the human**

No reading taken, and none can be taken: the find-the-impostor design is unsound
(`CLAUDE.md` gate block, `DECISIONS.md` 14/08, `TASTE-LOOP-LEARNING.md` Case 01). The
replacement — rank mine against five fixed shipped loops — is in **Held for the human**
below. The count stays at 0 of 3 and does not move while the gate is suspended: a
suspended gate scores nothing, in either direction.

| date | reading | strike? |
|---|---|---|
| — | none yet | — |

Full definition of the reading in `CLAUDE.md`'s gate block. Update **in the same turn** a
reading arrives.

---

## Next round

**Exactly one.**

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
- **This round's knobs, with anchors:** tones per material = **4**, anchored to the
  opening conviction (knob 3–6). Walk frames = **4**, anchored to the Stardew idiom, which
  is the control. Height comes out of the idiom, it is not an independent knob this round.

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
- [ ] **Silhouette lock at 25%** — the instrument exists and is null-cased
      (`silhouette()`); the lock itself waits for a sample worth locking. Round 1.
- [ ] **Value lock** — convert to greyscale, the ramps stay separated. The luminance dump
      is the instrument; the assertion waits for the real palette. Round 1.
- [x] **Animation family lock** — `tests/animation.test.ts`. Margin **0.02 of the canvas**
      (≈ one leg, 46 px of 2304), calibrated in both directions: a twitch of 0.0009 passes
      byte-inequality and fails the margin. Part rotation orients the part; moving the root
      translates every pixel exactly; the gait's four phases are named and ordered.
- [x] **Absence lock** — pixel ownership per part, reported by `measure()` and asserted per
      grammar. Against absence, count; looking does not catch it.
- [x] **Latency of one bench turn.** 90 ms wall, 9 ms of it render. Under the ~100 ms
      reference — no work owed. Re-measure when the arthropod's part count lands.
- [x] **The human's channel.** A self-contained HTML page, no dependency, no network.
      **bench** (labels, `t`, pause, step) is mine; **gate** (no control, no label, no
      tooltip, nothing that names a cell) is his, and both are compiled from the same
      emitter so a cell can never be compared as a renderer: one blit path,
      nearest-neighbour, integer ×4, and **one tick for the whole page**.
- [x] **Null case for the viewer, both ways.** `selftest.html` shows a human what each
      failure looks like; `tests/viewer-runtime.test.ts` runs the same inlined runtime
      headless against a fake DOM. Five defects planted, five caught — smoothing on,
      label leaked into the gate, empty payload, dead tick, index 0 painted opaque. All
      five flatter the sprite. That is the direction instrument defects come in.
- [x] **The live bench** (`bin/serve.ts`, `node:http` only). The page is opened once and
      never rebuilt: a change re-executes in a fresh process — no module cache to lie —
      and the frames swap **under a loop that never stops**, with the last 3 generations
      beside the current one. Locked both ways: it fires when the output changes and stays
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
- [ ] **Image cells** — his five published loops decoded into the *same* blit path as
      mine. Unbuilt: it cannot be null-cased without the files. Round 1.
- [ ] **The gate sheet builder** — shuffles with a seed he picks, writes
      `sheet/mapping.<seed>.json`, which I never read. Round 1, and blocked on the loops
      being his to supply.
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
| one bench turn, wall clock | 90 ms | `node bin/bench.ts` | 14/08 |
| render only, 4 frames of 48×48 | 9 ms | `node bin/bench.ts` (the `elapsed` line) | 14/08 |
| full cycle: record → replay → compare | 1.0 s | `node bin/record.ts /tmp/c.run.json && node bin/run.ts /tmp/c.run.json && npm test` | 14/08 |
| fixture baseline hash | `8d3118679a7194d2` | `npm run baseline` | 14/08 |
| min pair distance, shipped tunables | 0.109 | `node bin/run.ts runs/fixture.run.json` | 14/08 |
| locks green | 45 | `npm test` | 14/08 |
| gate page, tells found by grep | 0 | `grep -cE "fixture\|label\|keydown\|button\|http\|seed" .out/gate.html` | 14/08 |

## The harness, as of 14/08

Four commands, and the second is the loop.

| command | what it is |
|---|---|
| `npm test` | the locks. Determinism, baseline, tunables, both channels' null cases, the animation family |
| `node bin/bench.ts [run] [--set path=value]` | one bench turn: author → look → name the defect. Contact sheet, 25% silhouette, counts, elapsed |
| `node bin/run.ts <run.json>` | headless: state hash and metrics, no presentation layer |
| `node bin/record.ts <out.json> [--set …]` | capture what the bench is showing into a replayable run file |
| `node bin/serve.ts [runs…] [--set …]` | **the bench that stays open.** Open the URL once; edits re-execute and the frames swap under a running loop, with the last 3 generations beside it |
| `node bin/view.ts [runs…] [--mode gate]` | the frozen pages → `.out/bench.html` or `.out/gate.html`. The gate is only ever a file |
| `node bin/selftest.ts` | the viewer's null case, made visible → `.out/selftest.html` |

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
- [ ] **Approve, change or reject the new gate reading.** Asked 14/08, and nothing takes a
      reading until he answers.
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
