# BACKLOG.md

What is **open**. What is settled lives in `DECISIONS.md`.

A **state** file. Owner of the numbers that change, re-derived when a verdict supersedes
it. It is also where a cold session picks up the work — read against itself at every cycle
open (`TASTE-LOOP.md` §3b).

---

## Gate — 0 strikes of 3, as of 14/08

No reading taken. The first one comes in round 1 proper, after the probe settles the
idiom. Zero strikes is the best state.

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
| locks green | 22 | `npm test` | 14/08 |

## The harness, as of 14/08

Four commands, and the second is the loop.

| command | what it is |
|---|---|
| `npm test` | the locks. Determinism, baseline, tunables, the channel's null cases, the animation family |
| `node bin/bench.ts [run] [--set path=value]` | one bench turn: author → look → name the defect. Contact sheet, 25% silhouette, counts, elapsed |
| `node bin/run.ts <run.json>` | headless: state hash and metrics, no presentation layer |
| `node bin/record.ts <out.json> [--set …]` | capture what the bench is showing into a replayable run file |

Every tunable lives in `tunables/default.json` and is anchored there — the anchor is
locked, not a comment. A grammar is data in `src/grammars/`; `fixture` is the harness's
own subject and **is not content**.

---

## Held for the human

In a batch, binary, with samples attached.

- [ ] **Is "ink" in the name aspiration or direction?** `claude-ink-2d` names ink, and ink
      is Comix Zone — the overshoot I just declared unreachable, against Chrono Trigger as
      the target. Binary: **(A)** the name is aspiration, the bar in `TASTE.md` §1b is
      right; **(B)** drawn line is the real target, and §1b is wrong. If B, the probe
      changes shape before it runs. Attach sample D when it exists.

## Closed

- ~~Readings check~~ → `DECISIONS.md` 14/08 · artifact
- ~~Availability and cadence~~ → `CLAUDE.md` §4 · focus week 14–21/08
- ~~Project name~~ → `claude-ink-2d`, chosen by the human 14/08
