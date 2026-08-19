import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { gamePage } from '../src/micro/app.ts'
import { run } from './harness.ts'
import { STANDARD, replay } from '../bin/play.ts'
import type { Play } from '../bin/play.ts'

/**
 * **A play, recorded and handed back, runs exactly as it ran.**
 *
 * `bin/record.ts` has captured a GRAMMAR run since round zero — one subject, one set of tunables,
 * no game. Nothing captured a SESSION, which is why `CLAUDE.md`'s engine slice listed "replayable
 * input" as missing and why the agent's perception of a RUNNING game had nothing to watch.
 *
 * It cost almost nothing, and that is the point worth recording: when input became a timeline an
 * hour earlier, a recording stopped needing a concept of its own. **The live path and the
 * replayed path are the same path** — the loop applies an event to the simulation step it belongs
 * to whether the event came from a keyboard or from a file.
 */
describe('a recorded play replays exactly', () => {
  const playFor = (id: string): Play => ({ game: id, seconds: 5, events: STANDARD })

  for (const game of MICRO_GAMES) {
    it(`${game.id}: the same play twice is the same game`, { timeout: 30_000 }, () => {
      const a = JSON.stringify(replay(playFor(game.id), 60))
      const b = JSON.stringify(replay(playFor(game.id), 60))
      expect(b).toBe(a)
    })
  }

  it('the runtime records what it was given, and gives it back', () => {
    // Round trip through the page's own log: press keys, read the log, feed it to a fresh mount,
    // and the two must end in the same state. This is what a browser session hands the agent.
    const game = MICRO_GAMES.find((g) => g.id === 'crypt')!
    const stage = toStage(game.scene)
    const page = gamePage({
      id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
      ...(game.keys === undefined ? {} : { keys: game.keys }),
    })

    const live = run(page)
    let next = 0
    for (let f = 0; f <= 300; f++) {
      const at = (f * 1000) / 60
      while (next < STANDARD.length && STANDARD[next]![0]! <= at) {
        live.key(STANDARD[next]![1]!, STANDARD[next]![2]!, STANDARD[next]![0]!)
        next++
      }
      live.tick(at)
    }
    const recorded = live.log()
    expect(recorded.length, 'the runtime recorded nothing it was pressed').toBe(STANDARD.length)
    expect(recorded).toEqual(STANDARD.map((e) => [e[0], e[1], e[2]]))

    const fed = run(page)
    fed.tick(0)
    fed.feed(recorded)
    for (let f = 1; f <= 300; f++) fed.tick((f * 1000) / 60)
    expect(JSON.stringify(fed.state())).toBe(JSON.stringify(live.state()))
  }, 30_000)

  it('the null case: playing and not playing are different games', () => {
    /**
     * Otherwise every assertion above passes on an engine that ignores input entirely.
     *
     * The climb, deliberately, and not the crypt — which was the first choice and a bad one. Its
     * runner runs by itself and the keys only make him jump; five seconds later he has landed,
     * and the state is identical whether he jumped or not. A null case that cannot fail on the
     * game it is pointed at is the flattering shape this repository keeps finding in its own
     * instruments.
     */
    const played = JSON.stringify(replay({ game: 'cozy', seconds: 5, events: STANDARD }, 60))
    const idle = JSON.stringify(replay({ game: 'cozy', seconds: 5, events: [] }, 60))
    expect(played).not.toBe(idle)
  })
})
