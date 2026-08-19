# SCARS.md

**Every lesson that applies to more than one game, and whether anything enforces it.**

A **state** file, born 18/08. It exists because of a measured failure of the method: the contact
shadow was recorded in three markdown files — `DECISIONS.md`, `TASTE.md` §2b and the backlog —
and still shipped missing from three games, including the one it was discovered in. Jucelinux
named the cause before this file did:

> *"Ele é bom em acumular memórias, mas não transforma essas memórias em gates ou estruturas
> determinísticas no projeto. Quando eu converso contigo, vejo a disciplina do taste loop sendo
> aplicada religiosamente. Quando você conversa com o código essa disciplina some."*

**Markdown is memory. A lock is obligation. This file is the bridge, and its only job is to make
the gap between them visible.** A row with no gate is not a failure of will; it is a hole in the
repository, and it will be walked into again.

## The promotion rule

A scar becomes a **gate** when the judgment behind it is spent — he has ruled, and the answer is
a fact about the product. It stays **prose** while the judgment is still open. The don't in
`CLAUDE.md` still holds: a rule that would spare a conversation is suspect, so the gate must
force the QUESTION and never the ANSWER.

The shape that does that is the one `tunables/*.json` already uses: **satisfy it, or declare in
the scene why it does not apply, in a sentence a human reads.** Silence must not pass. `bandHold`
is the reason this matters — the arena needs it and `/descent` genuinely does not, and a gate
that demanded it of both would have added a meaningless number to a shipped game.

## The catalogue

| # | the scar | found | applies to | gate |
|---|---|---|---|---|
| 1 | **Nothing on a plane is grounded without a contact shadow** | batch 4, `/skate` — *"nenhum dos dois pilotos está apoiado no chão"* | every game with a subject standing on a floor | ❌ **none** — present in `/descent`, `/arena`, `/moon`; **missing in `/skate`, `/crypt`, `/snow`**, and `/skate` is where it was found |
| 2 | **An obstacle leaves the screen before it is destroyed** | batch 5 — genre convention is part of what he checks | every side-scroller | ⚠️ `tests/despawn.test.ts`, but it names three stages by hand and two games have been born since |
| 3 | **An animation rate is derived from the body, never picked** | twice — *"supervelocidade"*, then *"desengonçada"* | every animated actor that travels | ❌ none. Every game happens to carry `strideLen`; nothing checks that the next one will |
| 4 | **A size band is HELD, not re-chosen every frame** | batch 8 cycle 2 — *"causando uma sensação de bug"* | any game whose subjects can sit at a fixed distance | ⚠️ locked in `tests/arena.test.ts` only. `/descent` genuinely does not need it — on a treadmill every boundary is crossed once — which is why the gate must ask rather than demand |
| 5 | **An instrument must not test its own copy of the thing** | four times, `HARNESS.md` §5 | every lock over runtime behaviour | ⚠️ the arena hands out its real `project`; nothing stops the next test file re-implementing something |
| 6 | **Nothing is ever drawn at a coordinate that is not a number** | 18/08, by the compiler, the hour the runtime left its string | every game | ✅ `tests/golden.test.ts`, sweeps `MICRO_GAMES` |
| 11 | **The simulation advances in fixed steps, and input is a timeline rather than a poll** | 18/08, by reading the build order — a stated prerequisite the code never met | every game | ✅ `tests/timestep.test.ts`, sweeps `MICRO_GAMES` at 60, 90 and 144 Hz |
| 7 | **One placement rule** (`rowOf`), never a second row arithmetic | run 12 | every draw path | ✅ locked |
| 8 | **Nothing is rendered, shipped or decoded twice** | his own reading — *"isso é ruim… vamos resolver isso"* | every game | ✅ `tests/performance.test.ts`, sweeps `MICRO_GAMES` |
| 9 | **Every tunable is anchored, in a sentence** | run 7 | every tunables file | ✅ `src/io/load.ts` refuses to load otherwise |
| 10 | **No ambient randomness, and no clock below the consumers** | `HARNESS.md` §2.5 | all of `src/` | ✅ `tests/determinism.test.ts` |

**Five of eleven sweep every game. Three have nothing.** That count is the honest state of the
method as of 18/08, and it is the number to move.

## What is not in here

Scars that are about ONE subject or ONE game stay in `DECISIONS.md` and nowhere else — the
mirrored knee, the swallowed part, the yaw collapse threshold. Promoting those would be the
failure mode this file's own rule warns about: a gate for a thing that was never general is a
gate that will be wrong the first time somebody means it differently.
