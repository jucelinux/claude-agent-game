# HARNESS.md — round zero, for any domain

The Taste Loop is domain-agnostic and therefore cannot run on its own. Every project has to
build the thing that turns work into **re-runnable artifacts a judge can consume**. That
thing is the harness, and building it is round zero: it comes before content, before the
first axis, before the first verdict.

This file is the recipe. A worked example, as actually built, lives in the method
package's `examples/` folder — deliberately **not** copied into projects, so its domain
does not leak into yours. Consult it in the package when you want the shape; read this
file for what transfers.

---

## 1. The three questions, answered concretely

From `TASTE-LOOP.md` §4. Answer them in writing before building anything. If you cannot
answer one, that is the first thing to build.

| | Question | Passes | Fails |
|---|---|---|---|
| **Core** | What can be re-run identically? | Seeded simulation; a pinned model + fixed prompt + temperature 0; a build from a locked lockfile; a dataset snapshot with a hash | "Whatever is on the branch today" |
| **Sample** | What captures the axis in under a minute? | A 3s clip; one rendered page; one API response; a 20-row diff | The whole product; a description of the product |
| **Bar** | What external artifact sets the standard, *for this axis*? | A named competitor, a named book, a specific published benchmark | "Be good"; "industry standard" |

**The core is not optional and it is not about determinism for its own sake.** Without it,
two variants differ by more than the change under test, and every comparison is
contaminated. Nondeterminism at the *point of comparison* is the thing to kill; nothing
requires the product itself to be deterministic.

Three shapes it usually takes:

- **Replayable input.** State advances in fixed steps, and a run is `{seed, inputs[]}`.
  Cheapest and strongest, when the domain allows it.
- **Pinned everything.** Version, config, seed, and data snapshot all recorded with the
  artifact. Use when the system cannot be made deterministic but its *inputs* can.
- **Frozen fixture set.** A committed set of cases the artifact is always regenerated
  against. Weakest, still enough for rung 3.

---

## 2. Architecture prerequisites

Each exists so iteration stays cheap. They are prerequisites of the rig, not preferences.

1. **The deterministic core imports nothing from the presentation layer.** It must run
   headless, under test, with no UI, no browser, no network.
2. **One injected source of randomness, with an explicit seed.** Ambient randomness
   anywhere inside the core is forbidden — that includes wall-clock time, iteration order
   over unordered collections, and anything reading the environment.
3. **Every tunable number lives in one data file.** No magic constants. This is also the
   cheapest A/B mechanism that exists: two data files, same code, same core.
4. **Input, or its domain equivalent, is a log.** A run is data. If a run cannot be
   serialized, it cannot be replayed, and every judgment becomes a live session.
5. **Determinism is tested, and the test is a blocker.** Same seed and same inputs produce
   the same state hash. When that test breaks, nothing else proceeds until it is fixed.
6. **A committed baseline hash.** A second test asserts the run still ends where it ended
   last time. This is what makes every behaviour change a conscious act instead of a
   discovery three weeks later.
7. **Every tunable is derived or anchored, never free-floating.** A new number is born
   derived from a dimension of the domain, or anchored to a number that already exists in
   the tunables file — and the anchor is named. The loop is made of knob turns, and a
   hand-calibrated constant breaks on the first one (`TASTE-LOOP.md` §3c; CHANGELOG v0.5).

---

## 3. What round zero contains, and what it does not

**Contains — the deterministic core, and the agent's eye:**

- headless runner: execute a recorded run with no presentation layer, print the final hash,
  write whatever objective metrics the domain has
- recorder: capture a real session into a run file, so fixtures are *authored by using the
  thing* rather than hand-written
- determinism test and baseline test
- the tunables file, proven to change behaviour with no code edit
- **the agent's perception channel** — a way for the agent to perceive its own output with
  no human and no browser in the path: visual → text dump, audio → envelope, data → shape.
  If the artifact is perceptual and this channel is missing, there is no loop — only
  generation plus syntax checks (`TASTE-LOOP.md` §3c)

**Does not contain — the judging apparatus.** Clip capture, side-by-side pair building,
perceptual diff, automated critic packets. All of it is deferred on purpose.

**The trigger for building it:** when the human is being asked to judge the same subjective
axis more than twice a week. Before a working slice exists, the judge is the human, using
the thing, and there is nothing to automate. Building the judge before the artifact is the
same mistake as running the loop before the slice, wearing better clothes — `TASTE-LOOP.md`
§6.

**The perception channel used to be an exception here, and v0.5 made it the rule.** In the
origin project part of the capture rig was built early, against the deferral, because five
real defects had survived code review and a green suite — the agent was blind on the axis.
The second project confirmed it from day one: a blank output behind 266 green tests,
caught only by the text dump (CHANGELOG v0.5). The distinction that survives: a
**capability gap** (the agent cannot perceive its own output) is round-zero work; the
**judging apparatus** (pair building, perceptual diff, critic packets) stays deferred
until judging is the bottleneck.

---

## 4. Acceptance

Validate against a throwaway case, then delete it.

- [ ] the test suite passes, including both determinism tests
- [ ] running the same recorded run twice prints the same final hash
- [ ] the recorder produces a file the headless runner can consume
- [ ] changing one value in the tunables file changes behaviour with no code edit
- [ ] the whole cycle — record, replay, compare — takes less than a minute of wall time
- [ ] one bench-loop turn — change a tunable, regenerate, look — is fast enough that the
  agent keeps experimenting. ~100 ms is the reference where the domain allows it; half a
  second is *known* to change, and worsen, what gets tried (`TASTE-LOOP.md` §3c — the
  latency of the loop is a design decision, not an optimization)

Then stop, and go build the vertical slice.

---

## 5. Instruments, and the rule that governs all of them

Everything the harness produces is an instrument, and instruments are the method's blind
spot: their output is a number or an image, and both get believed.

**Before trusting a new instrument, run it on a case whose answer is known** — usually with
the measured thing switched off. If it cannot separate that from the real case, it is not an
instrument (`TASTE-LOOP.md` §2). This has caught real defects and has also been skipped, and
the skips are informative: three defects in one instrument, all inherited as conventions
from a different project, and **all three made the instrument approve what it exists to
denounce.** Instrument defects are not random in direction. They flatter. The cycle open
now asks for the null-case run of every new or changed instrument (`TASTE-LOOP.md` §3b.7).

**A lock needs margin, not equality — calibrated against the desired behaviour, in both
directions.** An equality rule passes on a trivial difference; a 100% rule fails a
deliberate pause. The lock hunts the defect, not the defect's neighbourhood, and
calibrating the margin is part of the loop, not slack (`TASTE-LOOP.md` §2).

Two more, learned the same way:

- **A visual instrument catches what is wrong, not what is absent.** A layer that is never
  put on screen leaves no trace in a capture, so the capture approves it. Against absence,
  the check is re-reading the assembly list, not looking at the image.
- **An instrument that reduces or samples hides exactly the differences it exists to show.**
  Check the reduction against a case where you know two inputs differ.
