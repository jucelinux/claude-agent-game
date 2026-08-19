/**
 * **Replay a recorded play, headless, and say what it did.**
 *
 *   node bin/play.ts crypt                       the standard play, at 60 Hz
 *   node bin/play.ts crypt runs/first.play.json  a recorded one
 *   node bin/play.ts crypt --hz 144              the same play, another screen
 *   node bin/play.ts crypt --write runs/x.json   record the standard play to a file
 *
 * `bin/record.ts` captures a GRAMMAR run — one subject, one set of tunables, no game. This
 * captures a SESSION: a game, a duration, and the keys that were pressed with the millisecond
 * each was pressed at. It is the second of the five things `CLAUDE.md`'s engine slice is defined
 * by, and the thing the agent's perception of a RUNNING game will have to watch.
 *
 * **It costs almost nothing, and that is the dividend of a decision made an hour earlier.** When
 * input became a timeline — an event carrying its own timestamp, applied to the simulation step
 * it belongs to — a recording stopped needing a concept of its own. A play IS that list. Replay
 * cannot drift, because the live path and the replayed path are the same path.
 *
 * To capture a real play from the browser: open a game, play it, and in the console read
 * `__last.log()`. That is the `events` array below.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { gamePage } from '../src/micro/app.ts'
import { run } from '../tests/harness.ts'

export type Play = {
  readonly game: string
  readonly seconds: number
  /** `[millisecond, key, down]`, in time order. */
  readonly events: readonly (readonly [number, string, boolean])[]
}

/**
 * **The standard play**, used when no file is given — the same ragged times
 * `tests/timestep.test.ts` drives, so a run of this command and a run of that lock are
 * comparable by eye.
 */
export const STANDARD: Play['events'] = [
  [137, 'ArrowRight', true], [909, 'ArrowRight', false],
  [1013, ' ', true], [1061, ' ', false],
  [1302, 'ArrowLeft', true], [2117, 'ArrowLeft', false],
  [2204, 'ArrowUp', true], [2418, 'x', true],
  [3006, 'ArrowUp', false], [3223, 'x', false],
  [3401, ' ', true], [3449, ' ', false],
]

/** Drive one game through a play at a given refresh rate and return the state it ends in. */
export function replay(play: Play, hz: number): unknown {
  const game = MICRO_GAMES.find((g) => g.id === play.game)
  if (game === undefined) throw new Error(`no game "${play.game}" on the shelf`)
  const stage = toStage(game.scene)
  const page = gamePage({
    id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
    ...(game.keys === undefined ? {} : { keys: game.keys }),
  })
  const h = run(page)
  const frames = Math.floor(play.seconds * hz)
  let next = 0
  for (let f = 0; f <= frames; f++) {
    // The last tick of every rate lands on the same millisecond, so two rates are compared at
    // one moment rather than at two.
    const at = f === frames ? play.seconds * 1000 : (f * 1000) / hz
    while (next < play.events.length && play.events[next]![0]! <= at) {
      const e = play.events[next]!
      h.key(e[1]!, e[2]!, e[0]!)
      next++
    }
    h.tick(at)
  }
  return h.state()
}

if (process.argv[1]?.endsWith('play.ts') === true) {
  const args = process.argv.slice(2)
  const id = args.find((a) => !a.startsWith('--') && !a.endsWith('.json'))
  const file = args.find((a) => a.endsWith('.json'))
  const flag = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`)
    return i < 0 ? undefined : args[i + 1]
  }
  if (id === undefined) {
    process.stderr.write('usage: node bin/play.ts <game> [play.json] [--hz 60] [--write out.json]\n')
    process.exit(1)
  }
  const play: Play = file === undefined
    ? { game: id, seconds: Number(flag('seconds') ?? 5), events: STANDARD }
    : (JSON.parse(readFileSync(file, 'utf8')) as Play)

  const out = flag('write')
  if (out !== undefined) {
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, `${JSON.stringify(play, null, 2)}\n`)
    process.stdout.write(`wrote ${out}\n`)
  }

  const hz = Number(flag('hz') ?? 60)
  const state = replay(play, hz)
  process.stdout.write(`${play.game}  ${play.seconds}s  ${play.events.length} events  at ${hz} Hz\n`)
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`)
}
