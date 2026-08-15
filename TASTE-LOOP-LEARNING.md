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
