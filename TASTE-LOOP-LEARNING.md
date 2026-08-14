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

### Case [NN] — [one line]

**What happened.** [ ]

**The evidence trail.**

| when    | record        | what it shows |
| ------- | ------------- | ------------- |
| [DD/MM] | [file, quote] | [ ]           |

**What actually went wrong.** [Usually not missing information — a missing question.]

**What the method lacked.** [ ]

**What worked and should be promoted from accident to method.** [ ]

---

## 3. Proposals

Raw material for `TASTE-LOOP.md`. Each needs the human's verdict before it graduates.
Number them and never renumber — an adopted proposal keeps its number so the changelog can
point at it.

### P1 — [name] · OPEN / ADOPTED [DD/MM] → §[N]

**The case.** [ ]

**Proposal.** [ ]

**Trigger, so it does not fire on everything.** [ ]

**Cost.** [ ]

---

## 4. Learning log

Append only, newest last. One entry per learning, including the ones that produce **no rule
change** — a case that did not justify a rule is worth recording precisely so the next
session does not relitigate it.

### L1 · [DD/MM] · [one line]

[What was learned, and what it cost to learn.] **Adopted** into `TASTE-LOOP.md` §[N] /
**Not yet adopted** — P[N] is open / **No rule change needed.**

> Record the positives too. A method change that is never observed working is
> indistinguishable from ceremony, and the observation always arrives days after the
> adoption, in a different session, from the human.

---

## 5. Open questions

Things the method does not answer and does not currently pretend to.

- [ ]
