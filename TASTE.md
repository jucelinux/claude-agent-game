# TASTE.md

Three sections, three functions. The first is distilled from `DECISIONS.md` and grows with
the project. The last two describe the model — one what it pulls toward, one what it can do.

A **state** file: re-derived when a verdict supersedes it. Not a log.

---

## 1. The human's taste

_Seeded at the 14/08 intake. Every `[declared]` line is an **opening position**, outranked
by any later verdict on a sample. When a verdict contradicts a declared line, that is
signal: record it in `DECISIONS.md` and rewrite the line as derived. Maximum ~15 lines.
Last distillation: none — the log does not exist yet._

- `[declared]` Named references: **Comix Zone, Chrono Trigger, Stardew Valley**. He gave
  them without describing what he likes in them — which is the correct format when the
  human knows what he wants without knowing how to say it (§7).
- `[declared]` **Animation is not an extra, it is half the ask.** He corrected this without
  being asked, in the same turn as the references.
- `[declared]` He wants to explore the ceiling, not deliver the minimum: he explicitly
  asked for the most challenging setup and accepted the risk of declared failure.
- `[declared]` He takes a named limitation as data, not as an excuse — he answered my
  acknowledgment of mine with "accepted, and I insist".
- `[declared]` **He wants an artifact to remain.** He chose the artifact reading over the
  capability and method readings, even though he opened the conversation out of curiosity
  about the method.
- `[declared]` **He declines the menu and names his own option.** Three availability
  options offered, none chosen, his own answer better than all three. That is §7 happening:
  translate, do not offer a menu.
- `[declared]` **He picks the medium, delegates the taste inside it, and asks to be told
  before it is applied.** Overrode the GIF recommendation with "let's go HTML", floated a
  game engine as a question rather than an instruction, then handed the call back. The
  shape to read from it: he sets direction and wants the reasoning out loud, not the
  options.

> The three references **do not converge**, and that is what makes them a probe rather than
> a bar. Floor, target and overshoot arrived together.

---

## 1b. Bar per axis

_One bar per axis, never a general bar. The bar is **negotiated**: the human gives
direction and ambition, the model reports the reachable set with samples, the human picks
the point (`TASTE-LOOP.md` §4). These are **opening positions**, not bars — no samples
exist yet._

| axis | opening position | who declared it |
|---|---|---|
| sheet cohesion and consistency | Stardew Valley — **control** | H, 14/08 |
| silhouette and value separation | Chrono Trigger — **target** | H, 14/08 |
| animation weight and arc | Chrono Trigger — **target** | H, 14/08 |
| drawn line, squash & stretch on a humanoid | Comix Zone — **declared overshoot** | H, 14/08 |
| tone budget per material | **EMPTY** — becomes a knob, not a bar | — |

**Why these three, in this order.** Stardew is the control: if I do not clear the control,
round 1 already answers everything and nothing else matters. Chrono is the target because
the sprite is small enough that discipline dominates drawing — what reaches the sprite is
translation under constraint, and translation under constraint is where my ceiling is high.
Comix Zone is the overshoot because every frame is a *redrawing* with variable line weight,
and it is exactly the case I declared unreachable. **If the overshoot does not fail
visibly, my entire §2b is wrong, and that is worth more than the sprite.**

Retired: nothing yet.

---

## 2a. The model's biases

**Deliberately empty.** `INTAKE.md`: §2a and §2b fill from evidence, not from declaration.
Inheriting the lines from another project is exactly the residue v0.6 exists to prevent —
a cold session reads whatever is in the repo as a requirement.

One conviction of this project is **already positioned against** a bias I expect to find
here, and it is locked in `CLAUDE.md` §1 rather than here, because it came from a design
choice and not from a measured incident: **deliberate emptiness** — large flat areas, flat
first and accent after. It exists against the pull to polish. When it falls or is
confirmed, the corresponding line is born here, with the artifact that demonstrated it.

---

## 2b. The model's capability surface

**Deliberately empty.** Every entry cites the artifact that demonstrated it;
self-assessment does not count (`TASTE-LOOP.md` §4). Nothing has been produced yet.

Two **hypotheses** recorded on 14/08, so they can be refuted rather than rewritten later.
They are not §2b entries and must not be treated as such until a sample supports them:

- **H1.** A body with a grammar — segmented, articulated, mineral, vegetal, mechanical —
  reaches the bar. A humanoid with cloth does not, and no number of rounds fixes it.
- **H2.** "And animate it" **raises** the ceiling instead of lowering it. Static animation
  is remembered drawing; animation as a system is timing, named phases, arc, spacing — all
  countable, all lockable.

**Prediction recorded now, so it cannot be rewritten later:** the human finds the impostor
in rounds 1 and 2. From round 4 on, he misses or hesitates on the arthropod. On the
humanoid he never misses.

**How to use this section:** when an axis stalls, the question is not *"how do I work
around my limitation?"* — it is *"which idiom of this axis is maximized by the shape of my
limitation?"*.

Mark every future entry as **portable** (a fact about the model) or **stack** (a fact about
this project), or the next project inherits superstition.

---

## 3. House rule

Failure is a result, not a fault. It becomes a line in `DECISIONS.md` the same way a win
does.
