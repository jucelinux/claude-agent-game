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
- **[derived · 15/08 · run 8, gallery #0020–#0022 · supersedes the probe C line]** **The
  high-budget idiom won on a beetle and lost on a gorilla, and the axis was never the
  budget.** Probe C — 8 tones, gradient, speckle, no line — was the sample he singled out on
  14/08, and it held the house style for seven runs on that one verdict. Ranked against two
  rivals on one animation it **tied for last**. What he ranked first was 5 tones over a wide
  value range with a drawn line; what tied with the incumbent was 4 flat tones with a line.
  **So neither factor alone buys anything: range without regions loses, regions without
  range loses.** The retired line is kept here in words because its shape matters — one
  verdict, one subject, generalised to every subject without a retest.
- **[derived · 15/08 · probe D]** **He reads a defect through what it resembles, not
  through what it is:** "the sash plus the neck skin makes it look like a buggy arm". The
  location was exact and the cause was one level below the words — same material as the
  torso and the arm, and limb-shaped taper. Section 7's sensor role, working exactly as
  described.
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
| tone budget per material | **5, in the Chrono idiom** — and the budget was never the axis. Run 8 ranked three inks on one animation: 8 tones with gradient and noise, and 4 tones flat with a line, **tied for last**; 5 tones over a wide range with a line won. Retires the 15/08 line that read "8, and more budget than I expected to be allowed" | H, 15/08, on run 8 |
| ink: value range × region structure | **both, or neither counts.** The two losers each had one — the incumbent a wide range cut into 195 one-pixel-ish regions, the control 95 real regions inside a narrow flat range | H, 15/08, on run 8 |

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

_Fills from evidence. Every entry cites the artifact that produced it._

- **[15/08 · probe C, gallery #0004] The restraint conviction fell on its first contact
  with a verdict — and the bias it was guarding against was never demonstrated.** The probe
  shipped C as "the direction my bias pulls toward, here to be knocked down by looking";
  the human looked and it is the sample he singled out. **The bias worth recording is not a
  pull toward polish — it is a pull toward predicting that restraint wins**, which let me
  write a sample's verdict into the backlog before anyone had seen it. A prediction dressed
  as a bracket is still a prediction, and this one was wrong.
  **What raises the ceiling, then:** more budget than I expected to be allowed. That is a
  hypothesis with one observation, not a law — the next verdict can move it.

- **[15/08 · run 7, his verdict on gallery #0017] I mistake the size of a change for its
  visibility.** The depth round replaced the shading of every pixel of every part — a
  distance-to-edge sweep became a real three-component lambert — and I wrote in advance that
  the walk "WILL look different". His report: *"não sinto uma mudança visual"*. What he did
  see was **detail and fluidity**, which is the occlusion half of the round and not the
  lighting half. **The bias is not optimism about quality, it is treating engineering
  magnitude as a proxy for perceptual magnitude** — and those are different quantities that
  happen to share my sense of how much work something was. **portable, and the correction is
  cheap:** the eye is the only instrument that reports visibility, so a change to *look*
  gets predicted out loud before he sees it, and the prediction gets scored. This one scored
  zero, and it is the second time §2a has caught me writing a verdict before anyone looked.

- **[15/08 · run 7, gallery #0018–#0019] I carry a working sample's numbers into a
  different problem and treat them as facts about the body.** Both new actions were
  authored at the walk's `gait.swing` of 0.1, and both came back with a limb absent in
  every frame — because 0.1 turn is a *walk's* range, and I had stopped reading it as a
  knob at all. The tell is worth more than the fix: the number had an anchor, the anchor
  was about the walk, and I still spent it on a jump without re-deriving it. **portable, and
  it generalises past this project: a parameter that survives one round gets promoted to a
  constant in my head unless something trips.** What tripped it was the absence lock, not
  looking — the defect was invisible in the picture, because a limb that is not there
  leaves no trace to see.

The conviction it replaces — **deliberate emptiness**, large flat areas, flat first and
accent after — stays recorded in `CLAUDE.md` §1 as a design choice made on day zero. It is
now **contradicted at one point by one verdict**, which is exactly one point and one
verdict: a pivot invalidates a batch, not a line (§8), and the cluster gets hunted before
anything else here is rewritten.

---

## 2b. The model's capability surface

_Every entry cites the artifact that demonstrated it; self-assessment does not count
(`TASTE-LOOP.md` §4)._

- **[15/08 · run 3 · gallery #0009–#0011] Articulation density is the ceiling, not
  perspective.** Three creatures in the same new view, one grammar, one pass. The beetle
  reads: eighteen parts, and the reading is carried by **one heavy mass** with limbs hung
  off it. The mantis and the scorpion do not: the mantis lost its silhouette, and the
  scorpion was wrong at every scale at once — leg proportion, missing pincers, fat segments,
  a tail with a floppiness the human called unnatural. Perspective was not what defeated
  them; **part count in a shape I had not solved yet** was.
  **What raises the ceiling:** fewer parts, and a body whose *mass* does the reading. What
  lowers it: more articulation as a substitute for form. **portable** — this is a fact about
  the model, and the next project inherits it.
- **[15/08 · run 3, the human's cross-cutting note] Depth read as a lighting error, and he
  saw it before I did.** Far limbs were painted in a dark *material*; the light in the
  picture could not explain them. A fact about how I reach for shortcuts: **I encode meaning
  by switching vocabulary when the correct move is a step within one.** portable.

- **[15/08 · run 7, gallery #0017 against #0015] Depth was never the ceiling; *simulating*
  depth was — and I spent six runs improving the simulation.** Every hand-tuned number the
  project has argued about on this axis — the far limb's ramp shift, the 0.85 foreshortening
  found after 0.7 and 0.5 were wrong by eye, the seam rule keyed to paint order — was a
  patch on one missing quantity. The human named the shape of the fix before I did, twice:
  once as *"the far legs are darker in a way the light cannot explain"*, once as the whole
  proposal for this round. **What raises the ceiling: computing the quantity the patches
  were approximating.** What lowers it: another calibrated constant on the same axis, which
  is what I would have produced. **portable** — the next project inherits the question
  *"which hand-tuned family is standing in for one quantity nobody has computed?"*, not the
  z-buffer.

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
