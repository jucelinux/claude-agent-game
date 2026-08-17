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
- **[derived · 16/08 · batch 2, the kitten against the astronaut]** **An inner line is a claim
  that two things are two things, and whether to draw it is a fact about the subject rather than
  a setting.** He raised it as a question about judgement — *"seu discernimento de quando tratar
  esse contorno e quando deixá-lo visível. Isso depende muito do objeto que você está
  desenhando"* — and supplied both ends himself: the astronaut's limb connections *"ficou
  legal"*, the kitten's tail, ears, legs and hind paws did not. **The test that separates them is
  whether the real object would have a seam.** A pressure suit has seams; a cat does not.
  Compiled as `Part.weld`.
- **[derived · 16/08 · the same message]** **He judges the finished picture and does not care
  which layer produced it, so a complaint names a symptom and never a cause.** *"Mais pixelado"*
  turned out to be the scene's scale, with the drawing measuring identical to the gorilla's on
  every axis. *"O contorno das formas"* turned out to be the grammar, on a defect the palette
  had been hiding on every earlier subject. Two notes in one message, two different layers, and
  neither was where the words pointed.
- **[derived · 16/08 · batch 4, the skate]** **He grades a game, never a round.** The round was framed
  as an experiment to prove a thesis — his framing — and his verdict named four things, all of them a
  player's: the board obeying the button, the colours, the absence of positioning bugs, and
  *"consistência de sua parte nessa run"*. **The thesis went unmentioned.** So "prove a concept" tells
  me what the round is FOR; it does not change what he looks at.
- **[derived · 16/08 · the same message]** **Consistency is a thing he names and rewards, and it is not
  the same as quality.** *"a ausência de qualquer bug relacionado ao posicionamento do skate e dos
  obstáculos, demonstrou consistência de sua parte nessa run."* Three of the four defects in batch 3
  were placement bugs. He noticed their absence and said so — an axis where the score is zero when
  nothing happens, which is the only axis here that behaves that way.
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

- **[15/08 · two build orders in two turns, both corrected by him] I sequence toward the
  newest stated goal instead of asking what it depends on.** He reframed the product as an
  engine, and within one turn I had written a build order putting the engine first and
  deferring the drawing subsystem — the only one with measured results and a running gate.
  His correction was one sentence of dependency: production capacity is upstream of the
  engine, because an engine with a thin asset pipeline makes thin games. **The pull is
  toward the most recently spoken thing, and a stated goal is not the same as the next
  step.** portable, and cheap to correct: before ordering work, name what each item is
  blocked by, and let the graph do the ordering instead of the conversation.

- **[15/08 · three gate designs, all corrected by him] I keep trying to mechanise the one
  judgment that is his.** Gate v1 hid the answer from him and had a logic hole. Gate v2
  needed five files he had to collect, and I asked for them three times without once saying
  what they were. Gate v3's first draft — written an hour after v2 was retired for exactly
  this — set a numeric kill condition, and he corrected it in one message: *"esse projeto
  falha quando eu decidir que falha... não vou ter uma métrica simples"*. **Three designs,
  three different mechanisms, one direction: the decision moving away from the person who
  holds it.** The pull is not toward rigour, it is toward *not having to ask* — a threshold
  is a way of never being told no. **portable, and it generalises past gates:** any place I
  am designing a rule that would spare me a conversation, the rule is probably the wrong
  artifact.

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

- **[16/08 · batch 2, his verdict against my prediction] I put my confidence on the axis I paid
  the most attention to, when it belongs on the axis with the weakest instrument.** Batch 1
  taught me to predict against what I had *not* examined, so I named the cat: 22 parts in a
  34 px body, a face of four parts in a 12 px skull, all counted and never looked at. **The cat
  is what he praised, by name.** Both his notes landed on the loop — the part I had measured in
  every way a number can reach, and shipped fourteen locks for. **"Not examined" is not the same
  as "at risk", and I substituted one for the other.** The loop's numbers were green from an
  instrument that could not perceive the quantity he judged it on: a headless run holding one
  key reports whether progress *happens*, never whether it is *earned*, so it certified a tower
  he found too easy to fall off. **portable, and it sharpens batch 1's lesson rather than
  replacing it: a green number from an instrument blind to the question is worth less than a
  count nobody has looked at. Ask what each instrument cannot see, and put the confidence
  there.**

- **[16/08 · batch 2, "mais pixelado"] I look for a complaint's cause in the layer it names.**
  He said the kitten looked mechanical and wanted it more pixelated, and every reflex I had was
  a grammar reflex — part count, seams, the inner outline, the tone budget. All of it measured
  identical to the gorilla he was comparing it to, down to 28% of painted pixels being outline
  against his 27%. **The cause was that this was the only game on the shelf rendering at ×2**:
  132 px of hero everywhere else, 72 px here, at two thirds the pixel size. Nothing about the
  drawing was wrong and nothing about the drawing changed. **portable: a subject can be drawn
  correctly and presented wrongly, and the layer a complaint names is where the symptom is, not
  where the cause has to be.**

- **[16/08 · the climb, four tuning sweeps] Four identical results are a finding, and I read
  them as four points on a curve.** The kitten could not climb past the first shelf, so I swept
  the landing window: 8 px, 14, 20, 26 — **exactly 4.0 m every time** — then 34, and suddenly
  10. I widened the knob four times before asking why the first four had produced no gradient
  at all. A difficulty setting produces a curve; **a cliff is the shape of a structural fault**,
  and the fault was that with one shelf per band and a steady input the whole game is a periodic
  system whose crossing position at every shelf is a fixed offset from the landing below it.
  Either it matches or it never does. **The pull is to treat a knob that did nothing as a knob
  that needs more, rather than as evidence the knob is not connected to the problem.** portable,
  and it generalises past tuning: an intervention with no measurable effect is information about
  the model, not a reason to intervene harder.

- **[16/08 · the swallowed check, withdrawn before shipping] I reach for the measurement I can
  take rather than the one the question needs.** A limb pair authored as one pose reached its
  fourth occurrence, so the method says compile it into a lock. I wrote the check where the last
  four defects had been *seen* — in the pixels — measuring declared shape area against best
  painted frame. It fired on 237 parts across 69 subjects, including bodies he had passed
  without a word, because **occlusion is normal and no pixel count separates a part correctly
  hidden from one accidentally hidden.** The difference is intent, and the intent is in the
  grammar. Moving the check there took ten lines and it fired on nine subjects, all nine
  symmetric on purpose. **portable:** when a check over-fires on healthy work, the usual fault is
  not the threshold, it is that the invariant was asserted about the wrong artifact.

- **[16/08 · batch 4, and my prediction was about a conversation he was not in] I predict his verdict
  from the round's internal argument instead of from the artifact he meets.** I called a MISS at 60/40
  and named the pixel-art half, reasoning that the weave was invisible on the rider and that "the
  extreme was applied and the instrument refused it" would sound like an excuse. **He never mentioned
  it.** He named the board obeying the button, the colours, the absence of positioning bugs and the
  consistency of the run — four player's readings, none about the experiment. The thesis had been the
  whole texture of my session and it was not in the room. `TASTE-LOOP.md` §4 forbids judging from
  source because a reviewer rates effort; **I was predicting from source, which is the same error
  aimed at myself.** portable, and the correction is cheap: write the prediction from what is on the
  screen, and if a factor cannot be seen by someone who has read nothing, it cannot move the
  prediction.

- **[16/08 · the weave instrument, calibrated on a gradient and pointed at a body within the hour] I
  build an instrument, prove it on the easiest possible artifact, and then trust it on the hardest
  one without re-measuring.** `PERIODIC` separated an ordered weave (0.628) from the retired speckle
  (0.068) on a 64×64 single-material ramp, with margins asserted either side and a null case in both
  directions. It was a good instrument. Then it reported **-0.22 on the rider with the weave switched
  on** — "this is dirt" — and I had no way to tell whether the dither was broken or the number was.
  The answer was that a 36 px body of 27 primitives has **0.000** of its pixels inside a
  single-owner 4×4 cell, so there was nothing for a lattice to sit on and the measure was reading
  seams and outlines. **This is §2b's own transfer rule turned on my instruments instead of on my
  drawing**: probe C won on a beetle and held the house style for seven runs; this threshold won on a
  gradient and I aimed it at a character in the same session. **portable, and the correction is one
  question asked before the second use: what is different about the artifact I am about to measure?**
  An instrument's calibration is a fact about the thing it was calibrated on.

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

### The mastery ledger — **what has actually shipped, and on which axis**

_Added 16/08, at his instruction: *"vamos considerar que todas as melhorias incrementais te dão
dominância... você já dominou isso e não precisamos ter a dor de parto para cada item que você já
tem maestria."* He is right, and spending that capital needs a ledger rather than a feeling —
this section's standing rule already says **self-assessment does not count**._

**Dominance transfers along the axis it was proven on, and not across it.** That sentence is not
caution, it is the recorded history of this project's four most expensive mistakes: probe C won
on a beetle and held the house style for **seven runs** before losing on a gorilla; the gorilla's
coat was the wrong colour for a day after his verdict on its walk; the inner line was wrong on
**every subject since round zero** and only a ginger cat made it visible.

| capability | proven by | read on | what does NOT transfer |
|---|---|---|---|
| a body with a gait, side view | gorilla, photographer, astronaut, kitten | four subjects, four verdicts | nothing known. **Spend freely** |
| recursive vegetation | 14 trees from one grammar, the forest | one scene, one scale, background role | a tree seen from above, at night, or as a surface to land on |
| fields — rain, motes | the forest and the climb | two scenes | anything with volume: fire, smoke, an explosion |
| a receding ground plane | forest, moon, garden | three scenes, three lighting regimes | nothing known. **Spend freely** |
| a body a person steers | gorilla, astronaut, kitten | three games | nothing known. **Spend freely** |
| props: rocks, craters, shelves | moon, climb | two scenes | anything a body interacts with beyond standing on it |
| **a body turned in depth** | astronaut, 15 grammars | **one subject, and it took five corrections** | **a body whose depth over width is under ~0.45 collapses. Measured** |
| a face at small scale | the kitten | **one subject, one verdict** | any face that is not a round-skulled animal |
| a game that can be lost | the climb | **one game** | any win condition that is not "how far did you get" |
| pattern inside a part | — | **does not exist** | — |
| pitch and roll | — | **inexpressible.** A bone has one angle, in the screen plane | — |

**The cheap safeguard, and it costs him nothing.** A commission that moves a mastered subject
along an axis it has not been read on gets **one line at delivery** saying so. Not a reading, not
a question — a pointer at where the risk is. Silence would be the model spending capital it does
not have; an extra reading would be spending his attention on a settled question.

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
