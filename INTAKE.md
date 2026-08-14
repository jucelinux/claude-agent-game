# INTAKE.md — cycle zero

Runs **once**, in the first session after install, before round zero and before any
content. A round has a close (`TASTE-LOOP.md` §3.9); a cycle has an open (§3b); a project
has an **intake** — the conversation that turns a set of empty templates into a project
the method can run on. An installed method with unfilled brackets gives a cold session
nothing to displace its priors with, so it inherits, improvises, or guesses (CHANGELOG
v0.6 was a session inheriting; v0.7 is this file).

---

## What this is not

- **Not a questionnaire about taste.** Declared taste is a hypothesis — the human is a
  high-sensitivity, low-resolution instrument about their own preferences too (§7). The
  method extracts taste from **verdicts on samples** (§3.0, §8); the intake collects only
  what declaration can actually know, and *schedules probes* for the rest.
- **Not a capability assessment.** `TASTE.md` §2b fills from demonstrating artifacts
  only; the agent asserting its ceiling here would violate §4 on day one.
- **Not repeatable.** It runs once. Later changes flow through verdicts and the normal
  propagate step — rerunning the intake would overwrite derived taste with declared taste.

## Ground rules

- One sitting; target **under 30 minutes** of the human's attention.
- Binary questions where possible; when the human gropes for words, **translate — do not
  offer a menu** (§7). References they name are worth more than options you invent.
- Every taste-adjacent line lands in the files tagged **`[declared]`**: an opening
  position, outranked by any later verdict on a sample. When a verdict contradicts a
  declared line, that disagreement is signal — record it in `DECISIONS.md`, then rewrite
  the line as derived.

---

## The six blocks

### 1. The thing · → `CLAUDE.md` §1

Name. What it is, one line, no adjectives. The claim that makes it worth building.
Target — platform, audience, medium. Then: **which existing things does this want to
stand next to?** Collect the references; do not set bars yet.

### 2. Direction and ambition · → `TASTE.md` §1b, as opening positions

For the two or three axes the human most cares about: the external reference, and how far
to push — approach it, match it, beat it. These are **opening positions, not bars**: a
bar is negotiated against samples (§4) and no samples exist yet. The first frontier
probes (§3.0) are scheduled from exactly this list — that is how each position becomes a
bar or gets corrected by one.

### 3. Constraints and pleasures · → `CLAUDE.md` §1; `TASTE.md` §1 `[declared]`

- **Hard constraints** — non-negotiables of stack, scope, idiom, budget, deadline. Each
  with its one-line reason; a constraint offered as a virtue gets both halves recorded
  (§8).
- **The pleasure boundary — what parts of the work the human wants to keep doing
  themselves.** Delegating those is a failure even when the output is good; the method
  optimizes the spend of human judgment, not its elimination. Also the inverse: what they
  never want to touch again.

### 4. The collaboration contract · → `CLAUDE.md` §4

- **Availability**, honestly: how much attention per day or week. This bounds batch size
  — a batch is as much as one sitting can attribute (§3.6), and the sitting just got
  measured.
- **Cadence**: when batches land, and through what channel.
- **The delegation line**: what the agent applies alone (clear-margin wins, rungs 1–3
  green, settled in `TASTE.md`) · what waits for a batch · what interrupts immediately
  (usually gate strikes, and nothing else).

### 5. The readings check

The agent states **2–3 materially different readings** of what the project *is*, one
line each; the human picks or corrects. A cheap misreading at this moment ships weeks of
working code that is not the thing — this is the day-zero half of known gap P9 (§12);
the per-request half remains open.

### 6. The gate · → `CLAUDE.md` gate block; counter owner in `BACKLOG.md`

The human names what *alive* means for this project. The agent proposes one or two
**behaviour readings** that could measure it, each with a kill count; the human picks
one. Behaviour, not opinion; a counter with an owner; renegotiated whenever the core
pivots (§11). A project that leaves the intake without a gate has not finished the
intake.

---

## Output, same turn

1. `CLAUDE.md` §1 and §4 filled — no bracket left standing.
2. `TASTE.md` §1 seeded with `[declared]` lines; §1b holding the opening positions;
   §2a and §2b left empty **on purpose** — they fill from evidence.
3. `BACKLOG.md`: the first frontier probe(s) scheduled as the next round; the gate
   counter installed at the top.
4. `DECISIONS.md`, one line: `DD/MM · LOOP · intake complete · axes <A, B>; gate <G>`.
5. Then this file is done. **Guard, checked at every cycle open:** brackets still in
   `CLAUDE.md` §1 and no intake line in `DECISIONS.md` → run this before any work, and
   produce nothing from an unfilled instance.
