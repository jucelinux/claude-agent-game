# TASTE-LOOP-LEARNING.md

Inputs for evolving the method. **Not the method itself.**

| File            | Layer                  | Question it answers                                       |
| --------------- | ---------------------- | --------------------------------------------------------- |
| `TASTE-LOOP.md` | method                 | How do we run a round?                                    |
| **this file**   | **method, under test** | **Where is the method wrong, and what evidence says so?** |
| `CHANGELOG.md`  | method, history        | What changed, why, and has it been observed working?      |
| `DECISIONS.md`  | project                | What did we decide?                                       |
| `TASTE.md`      | project                | What does the human's taste look like, distilled?         |
| `BACKLOG.md`    | project                | What is open?                                             |

This file holds the raw material _before_ it becomes a rule: cases, evidence, and proposals
not yet adopted. A change graduates from here into `TASTE-LOOP.md` **only when the human
accepts it**, and the same turn it graduates it gets an entry in `CHANGELOG.md`.

Keeping the two apart is what stops the method file from turning into a diary of half-tested
ideas — the same log-versus-state split the method applies to the project, applied to the
method itself.

---

## 1. The thesis under test

> [What this collaboration is betting on, in two or three sentences. Not "AI is useful" —
> the specific claim that this method makes true, and which would be observably false if
> the method were wrong.]

---

## 2. Cases

One per incident that the method did not catch. A case is not a complaint: it needs a trail.

### Case 01 — the gate was designed so that running it destroys its own precondition

**What happened.** The intake produced a find-the-impostor gate: six animated loops, five
from published games, one the model's, and the human points at the impostor. It also wrote
a rule — *the human assembles the sheet, and it is precisely his assembling it that
preserves his blindness*. On 14/08, asked for the five loops, the human refused **with the
reason**: collecting them means having seen them, so the sixth is his by elimination. The
gate was suspended the same turn, before its first reading.

**The evidence trail.**

| when  | record | what it shows |
| ----- | ------ | ------------- |
| 14/08 | `INTAKE.md` §6 — "the agent proposes one or two behaviour readings, the human picks one" | the gate was chosen in one sitting, with no adversarial pass over it |
| 14/08 | `CLAUDE.md` gate block — "it is precisely the human assembling it that preserves his blindness" | the rationale states the opposite of what is true, fluently |
| 14/08 | `CLAUDE.md` §5 — "Do not assemble the gate sheet" | two different concerns fused into one rule: *the model must not author fake published art* (true) and *the human assembling preserves blindness* (false) |
| 14/08 | the human, unprompted | the party the instrument measures found the defect the method's author and the model both missed |

**What actually went wrong.** Not a missing fact — a missing question. Nobody asked *who
sees what, and when*. The rule was written from the model's constraint ("I must not
reproduce published art") and the blindness claim was attached to it as a justification,
where it read as reasoning instead of as an assumption to test. Two legitimate concerns
fused into one sentence is how an unsound clause travels undetected.

**What the method lacked.** §2 requires a null case for every *instrument*, and §11
requires the gate to be *behaviour with a kill count* — but nothing anywhere asks the gate
itself to survive a null case. The obvious one here costs one question and would have
caught it on day zero: **"run the reading in your head with the answer known — does it
still discriminate?"** With the human holding the five references, the answer is no, and
that is visible before a single sprite exists.

**What worked and should be promoted from accident to method.** The human was asked for a
*specific artifact* rather than for an *opinion about the gate*. "Send me the five loops"
forced him to simulate the procedure, and simulating it surfaced the flaw. Asking "does
this gate look right to you?" would have got a yes. **The concrete request is the null case
for a procedure** — see P3.

---

## 3. Proposals

Raw material for `TASTE-LOOP.md`. Each needs the human's verdict before it graduates.
Number them and never renumber — an adopted proposal keeps its number so the changelog can
point at it.

### P1 — an external deadline as the stopping rule at project scope · OPEN

**The case.** §12 lists "no stopping rule at any scope" as a known gap: the agent has no
fatigue, and "when are we done" cannot be left to the party with the incentive to continue.
This project got one free, from the calendar — a focus week, 14–21/08.

**Proposal.** When a project has an external deadline, record it as the project-scope
stopping rule at intake, in `CLAUDE.md` §4.

**Trigger.** Only where a deadline already exists. Inventing one is a fake rule.

**Cost.** A deadline stops the clock, not the work: it says *time is up*, never *this is
as good as it gets*. It cannot tell a finished project from an abandoned one — which is
exactly what P2 tries to answer.

### P2 — the ceiling, instrumented: a plateau in the gate reading is the stopping rule · OPEN

**The case.** The human, 14/08: *"after a few dozen runs we will be discussing whether the
improvements are reachable, or whether there is nothing to do because the ceiling has been
hit."* That is the missing stopping rule arriving as an intuition — and as an intuition it
is unusable, because the discussion has no trigger and the party with no fatigue is in it.

**Proposal.** Where the gate produces an **ordinal** reading rather than a binary one, the
project stops on a **plateau**: N consecutive readings with no improvement in position ends
the project by *ceiling reached*, and the ceiling is written down. Distinct from death by
strikes, and it fires while the project is still healthy — which is the only moment a
stopping rule is worth anything.

**Trigger.** Gates that yield a rank or a score, not gates that yield yes/no.

**Cost.** A plateau and a hard problem look identical from inside. The rule will sometimes
stop a project one round before the breakthrough, and that is the price of having a rule at
all instead of an appetite.

### P3 — a procedure's null case is a concrete request, not a review · OPEN

**The case.** Case 01. The gate's unsound clause survived the intake, `CLAUDE.md`, and
several sessions of both parties reading it. It died the moment the human was asked for the
five loops, because supplying them made him run the procedure in his head.

**Proposal.** Before a procedure that costs the human anything is adopted, ask for the
**first concrete artifact it requires**, not for an opinion about the procedure. Also: run
the reading once with the answer known — a reading that still discriminates when the
outcome is known is sound; one that does not was never measuring what it claimed.

**Trigger.** Any procedure the human executes: the gate, a batch format, a review ritual.

**Cost.** One extra round trip before adopting, and it feels like bureaucracy right up to
the first time it saves a month.

---

## 4. Learning log

Append only, newest last. One entry per learning, including the ones that produce **no rule
change** — a case that did not justify a rule is worth recording precisely so the next
session does not relitigate it.

### L1 · 14/08 · the instrument the method never null-cases is the gate itself

Every instrument in this repo was made to fail on purpose before being believed — the
perception channel, the viewer, the live bench, the export validator; twelve defects
planted, twelve caught. The one instrument that got none of that treatment is the one the
whole project hangs from, and it was unsound from the day it was written. **Cost of
learning it: zero**, because the human found it before the first reading — and that is
luck, not method. **Not yet adopted** — P3 is open.

### L2 · 14/08 · the human's two roles are in conflict, and only one of them survives

He asked to judge rounds directly, which is right for direction and fatal for any gate that
needs him blind: someone who watches dozens of runs learns the model's hand and will point
at the impostor for reasons that have nothing to do with quality. The replacement has to
work **with** him knowing exactly which loop is the model's. That constraint arrived from
his request, not from the method, and it is what forced the reading from *find the
impostor* to *where does mine rank*. **No rule change needed** — but §7 gains a case: the
human's roles can conflict, and the gate is the role that has to bend.

> Record the positives too. A method change that is never observed working is
> indistinguishable from ceremony, and the observation always arrives days after the
> adoption, in a different session, from the human.

---

## 5. Open questions

Things the method does not answer and does not currently pretend to.

- [ ]

---

## Proposal, 16/08 — **the commission is one artifact and should be two readings**

_Raised by him, and explicitly not ordered: "não estou ordenando que tenha que ser assim, mas
estou tentando relativizar o que estamos fazendo aqui com desenvolvimento ágil."_

**His shape:**

1. we agree a character, he gives the details
2. the model builds it and decides for itself whether the sample can be presented
3. the scene is built with that new resource in it, and he brings feedback

**The evidence that he is describing a rule the method already has, and that we broke it.**
§3.6: *human review in batches, bounded by attributability — as much as one sitting can
attribute, no more*, and it names both failure modes, the second being **accumulation**.

Gate v3 was designed so the reading costs him one sentence and one word, and its
no-back-and-forth property is what makes it cheap. **That same property forces accumulation:**
a whole commission lands in one reading, so a body, a gait, a light source and a ground arrive
together. Batch 1 came back with **five separate failures in one message**, spread across three
subsystems, and he had to write the list. That is the accumulation failure, arriving through the
gate's own design rather than in spite of it.

Batch 2 accidentally ran his shape and it worked: the cat was read, shipped, and *then* two
notes arrived about the scene and the drawing separately. Each was attributable in one line.

**The cost, and it is a real rule this would collide with.** `CLAUDE.md` §4 binds: *"tudo que eu
lhe pedir daqui pra frente nasce como um objeto que pertence a um jogo"* — a cloud is delivered
as a sky a cloud crosses, because a sprite judged alone is judged against itself, which is the
sprite shelf he retired.

**The resolution that keeps both:** two readings over **one** artifact, never two artifacts. The
resource is still shown in motion and still shown in a scene — just a bare one that is not
itself the deliverable of that reading. Reading 1 asks *is this the character*. Reading 2 asks
*is this the game*. Neither is a still and neither is a sprite in a cell.

**Status:** not adopted. It costs him one extra reading per commission and buys attribution. The
number to watch is whether his notes get shorter, not whether there are fewer of them.

**Scoped by him the same day, and the scope is the more useful half.** *"Importante separarmos o
que é discussão sobre uma mudança fundacional nesse repo do que for tema de um microjogo...
quando você está melhorando as estruturas que lhe tornarão o melhor agente de códigos para
gamedev, possivelmente as coisas vão se acumular."*

**Attributability binds a reading, not a change.** It is a rule about the human's attention, so
it applies exactly where his attention is spent and nowhere else:

| | a commission | a foundation |
|---|---|---|
| what it is | a micro game he plays | a change to the core: 3D, the depth solver, a new field |
| judged by | his eye, once, one word | **the locks, before he ever sees it** |
| bounded by | **attributability** — small enough to attribute | **the null case** — arbitrarily large, provided nothing that already works moves |
| may accumulate | no | **yes, and it should** |

Three foundational changes shipped on 16/08 and all three were verified the second way, not the
first: `Part.weld` (every subject predating the field renders byte-identical, asserted over the
whole catalogue), the cache fix and the deletion of the second renderer (all three games hash
identical before and after). **None of them was shown to him and none of them needed to be.**

Splitting a foundation to make it attributable would be worse than pointless — half a rotation
is not a shippable state, and the intermediate readings would be of bodies that are broken on
purpose.

**Two bounds still apply to foundational work, and they are not attributability:**

1. **Nothing that already works may move**, or the difference is declared and locked. That is
   the gate all three changes above passed.
2. **A foundation is demanded by a commission, never planned ahead of one.** The yaw arrived
   because an astronaut had to walk in eight directions; the whole climb engine arrived because
   a kitten had to land on something. `CLAUDE.md` records that order as *the right way round*.

So the two halves compose rather than conflict: **the foundation may accumulate freely, because
the reading is still only ever on the game.**

---

## Note, 16/08 — **on convergence, and why the model should stop aiming at it**

His framing: *"ambos os sensores (os meus e os seus) são limitados. Não há empatia aqui em
relação a como eu me sinto quando jogo e como você se sente quando joga. Esse trabalho é uma
tentativa de encontrar essa convergência."*

**The evidence from this project says the two channels are complementary rather than
convergent, and that this is the better arrangement.** One case, same day, same defect:

| | what it found | what it could not |
|---|---|---|
| the model's robot driver | **the tower was locked** — a periodic orbit that four tuning sweeps could not explain | that a climbable tower was boring |
| him, playing | *"é difícil errar um salto assim"* | why, or where |

**The robot measured a property; he measured an experience.** No instrument converts one into
the other, and a model that tried would be building the judge before the artifact for the fourth
time in this project's history.

**What actually accumulates is not empathy, it is `TASTE.md`.** Every verdict compiles into a
knob, a lock, or a line, and the file is the only thing that gets closer to his eye over time.
The mechanism already exists and this session used it four times.

**One thing worth promoting to a rule, because it is what makes the asymmetry productive:** when
a verdict is about *feel*, the model owes a **number that moved with it**. He said "too easy";
the number was *aiming buys eleven times the height*, and it is a lock now. Done every time, his
feel becomes the model's instrument — which is convergence in the only direction that is
available.
