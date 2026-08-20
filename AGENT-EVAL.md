# Fresh-agent evaluation

The product claim is behavioural: a coding agent with no conversation history can use this
repository to deliver a small game. This file records trials without turning their result into a
leaderboard or hiding human corrections.

## Protocol

1. Start each candidate from the same clean commit in a separate worktree.
2. Give one commission, the repository and no implementation hints.
3. Do not compare agents on a task whose solution from another run is present in their context.
4. Record wall time, model cycles, human readings, dependencies, regressions and process misses.
5. The human plays the artifact. `ships` means usable in a game and welcome there.
6. Keep every defect in the record even when the final result ships.

The comparison is about cost to a shipped artifact. Test count, source size and self-reported
confidence are evidence about causes, never the verdict.

## Trial 1 — Codex · `/orrery` · 20/08/2026

- **Ask:** inspect the repository, propose the strongest microgame the agent could build, then
  build it after one approval.
- **Artifact:** a one-screen platformer whose chamber rotates by exact quarter turns; procedural
  keeper, five clips, three goals, win/loss, audio, typed collision and a saved replay.
- **Final verdict:** **SHIPS** — Jucelinux: *"Validei o jogo aqui, gostei deste micro jogo."*
- **Cost:** one creation cycle, two correction cycles, three human readings before the verdict.
- **Dependencies:** none.
- **Correctness misses:** an undeclared reachable `run -> fall` transition threw in the browser;
  rotating the foot point embedded the upright body in a border and allowed escape.
- **Process miss:** Codex applied an external design skill that was not part of the repository's
  method. No dependency or generated artifact entered the project; the agent contract now makes
  the tool boundary explicit.
- **What the trial proved:** a fresh agent can extend grammar, scene and runtime and reach an
  approved game. A single successful replay is not enough exploration of ordinary player input.

## Next comparative run

Use a new commission from the clean commit that contains this protocol. The second candidate must
not receive Orrery's implementation as a solution template. Record the result in the same fields;
do not normalize away a different number of human corrections.
