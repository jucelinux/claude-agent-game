# CLAUDE.md

The project instance, **distilled 16/08** after the external review (`ANALISE-EXTERNA-2026-08-16.md`).
The narrative version of every file lives on branch `taste-loop-v1`; history lives in
`DECISIONS.md` (append-only) and in git. This file holds only what binds.

## Session start

Read, in order: this file → `TASTE.md` → the last 20 lines of `DECISIONS.md` → `BACKLOG.md`.
Read `TASTE-LOOP.md` and `HARNESS.md` only when running a round or changing the harness.
Do not write code before that. Then run the cycle open (`TASTE-LOOP.md` §3b) — at its
**cheap** setting while the method is frozen: rungs 1–3 plus contradiction sweep; skip the
method-debt items.

## The project

- **Name:** claude-agent-game (repo). Formerly claude-ink-2d.
- **What it is:** a game engine whose interface is a coding agent — "o GameMaker dos
  agentes". He can say exactly what he wants in a game; he cannot draw. The product is the
  arrangement (harness + engine + drawing grammar) that lets an agent deliver it.
- **The product surface is ONE thing:** the shelf. `node bin/micro.ts`, port 5177, `/` is
  the shelf, `/<id>` is a game. Live from current code on every request. Nothing is ever
  removed from it.
- **Failure condition:** he decides, from judgment. No metric decides for him.
- **The defining requirement (deferred by him, still defining):** a fresh agent, given only
  this repository, can build a small game.

## The gate — v3, the commission test

- He names an object and an animation in one sentence. The model delivers a micro game,
  no back-and-forth. He answers in one word, plus a word of why on a miss.
- **"Ships"** = usable in a game AND he would be glad to have it there.
- **A miss is a specification, not a strike.** Its output is the name of the missing
  capability. Every capability in this grammar was born this way.
- Two numbers recorded per batch, evidence never thresholds: **hit rate** and **cost to
  hit** (model cycles + his readings per shipped piece).
- The reading is written into `BACKLOG.md` the same turn it arrives, in his words,
  unsoftened. `DECISIONS.md` records that a reading happened, never the tally.
- A batch spans kinds (creature, prop, character, effect, environment).
- **Prediction discipline (reduced 16/08):** before he looks, ONE line — verdict +
  probability + the one reason. After, ONE line scoring it. No essays.
- Do not build a reading whose setup cost lands on him (gates v1 and v2 died of it).

## Method status — FROZEN 16/08

The Taste Loop's **core stays binding**: verdicts compile into knobs/locks/prose; the
perception channels; miss-as-specification; binary questions in batches; attributability
bounds a reading (a foundation is bounded by the null case instead, and may accumulate).

**Suspended until three batches show a cost** (then it returns with that evidence):
round-close ceremony, method proposals and `TASTE-LOOP-LEARNING.md` upkeep, `TASTE.md` §2a
essays, gate redesigns. The method is settled; the product gets the attention.

## The bench loop — amended 16/08, structured look adopted

1. **The counting channel is non-negotiable and runs every turn.** `node bin/bench.ts`:
   contact sheet, silhouette, findings, counts. It finds what sight cannot — absence
   leaves no trace in a picture.
2. **The model MAY look during the bench loop.** `node bin/see.ts [run] [--set …]` writes
   a contact-sheet PNG to `.eye/`; Read the file. Use it for the correspondence class —
   "does this look like the thing" — which counting cannot reach.
3. **Every fix enters through the grammar.** There is nothing else to edit; pixel
   retouching does not exist as an operation here.
4. **Measured:** each round records one line — what looking caught that counting did not.
   If three batches show nothing, the look retires.
5. **References at intake:** before authoring a NEW subject kind, look at 2–3 reference
   images (his, or CC0) and extract **structural numbers** — proportions, landmarks,
   ratios — into the grammar as anchored tunables. `refs/` stays gitignored.

## Collaboration

- **Delivery format:** everything he asks for is born as an object belonging to a game —
  a cloud arrives as a sky a cloud crosses. He says when a new micro game starts.
- **Async checkpoints (adopted 16/08, his ask):** when a feature slice stands on its route
  — the skater, the track, the background — announce it in ONE line, keep working. His
  silence means continue; his comment enters the running round as insight, not as a formal
  reading. Never block on a checkpoint.
- **Slice a commission into visible features** (skeleton in scene → environment →
  mechanic → polish), each appearing on the route when it stands. The number to watch:
  his notes getting shorter.
- **The ask format, binding:** what to open · what to do · how long it takes · what a pass
  looks like · what each answer changes. Plain language a fifteen-year-old follows.
- **Language rule:** reports to him in ASD-STE100 Simplified Technical English (or the
  simplified aeronautical Portuguese). Short sentences, active voice, one idea per
  sentence, no metaphor. Numbers, costs and misses stay exact; if a result is bad, say it
  is bad. Scope: reports. Repository files keep their (now dry) style.
- **Cadence:** several batches per week; availability raises frequency, never batch size.
- His imprecise report is a sensor, near perfect on *that*, rarely right on *where* —
  hunt the root, never patch the symptom. A complaint names a layer; the cause is often in
  another (check how a thing is SHOWN before touching how it is DRAWN).
- When a verdict is about feel, the model owes a number that moved with it.
- Mastery is spent, not re-litigated: a commission touching a mastered subject on a read
  axis proceeds freely; on an unread axis it gets one line at delivery naming the risk.
  The ledger is `TASTE.md` §2b.

## Build order — as of 16/08

1. ~~Round zero~~ · 2. ~~grammar slice~~ · 3. ~~exporter~~ (dead) — done or dead.
4. **Finish the drawing via commission batches.** "Finish" = commissions ship reliably
   across kinds. Known gaps, built only when a miss names them: pattern inside a part ·
   effects (fire, smoke) · full 3D pitch (roll exists) · generativity beyond trees.
5. **Then the engine slice:** one-screen platformer — deterministic headless sim, fixed
   timestep, box collision, replayable input, animation state machine. (Much exists
   already: the climb, the runners.)
6. **The differentiator: the agent's perception of a RUNNING game.** Same pattern as the
   sprite channel, one level up.
7. Judging apparatus — only if judging becomes the bottleneck.

Drawing capacity is upstream of the engine: production capacity bounds game diversity.

## Architecture — prerequisites, not preferences

- The deterministic core imports nothing from presentation. `sprite(grammar, params,
  seed)` is closed-form; the browser is a consumer. A recorded input replays identically.
- The unit of work is the **grammar**, never a sprite. Animation transforms anchored
  parts; frames are never redrawn.
- Every tunable lives in `tunables/`, anchored, locked. Depth is solved (z-buffer, 2.5D),
  never authored. One placement rule (`rowOf`); one renderer.
- The ink idiom: five tones over a wide value range, with a drawn line (his run-8
  ranking). Value range AND region structure, both or neither counts.
- Declared per part because no measurement can infer intent: `marking`, `weld`, `cut`,
  symmetric-pair exemptions.

## Don'ts

- No dependency without proposing it first (Pixi = consumer in an example, never core).
- No pixel retouching. No judging stills — everything he sees is in motion.
- Do not design generality; harvest it from two working subjects.
- Do not enrich the counting channel into a picture — the look is `bin/see.ts`, separate,
  and the counts stay primary for absence.
- Do not mechanise his judgment. Any rule that would spare a conversation is suspect.
- Commit only when he asks or a batch closes.

## The human

Jucelinux. Software engineer, author of the Taste Loop. Plays a great deal; can say
exactly what he wants in a game; delegates the hand, not the judgment. He stretches the
rope on purpose — a naive-sounding question is usually a harness probe. He picks the
medium, delegates the taste inside it, and wants the reasoning out loud before it is
applied.
