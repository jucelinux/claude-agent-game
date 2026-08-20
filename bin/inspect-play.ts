/**
 * A text eye for a playable route. It prints semantic checkpoints and a coarse collision map;
 * taste remains visual, while absent state, unreachable goals and wrong turns become greppable.
 *
 *   node bin/inspect-play.ts orrery
 *   node bin/inspect-play.ts orrery path/to/play.json
 */
import { readFileSync } from 'node:fs'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { boxWalls, turnBox, turnPoint } from '../src/runtime/collision.ts'
import { run } from '../tests/harness.ts'
import { describeObservation } from '../src/observation/describe.ts'
import type { Keeps } from '../src/observation/types.ts'
import type { StagePlatformer } from '../src/scene/layers.ts'

const id = process.argv[2] ?? 'orrery'
const game = MICRO_GAMES.find((g) => g.id === id)
if (game === undefined) throw new Error(`no micro game "${id}"`)
const stage = toStage(game.scene)
const page = gamePage({
  id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
  ...(game.keys === undefined ? {} : { keys: game.keys }),
  ...(game.actions === undefined ? {} : { actions: game.actions }),
})
const h = run(page)

type Event = readonly [number, string, boolean]
const events: readonly Event[] = process.argv[3] === undefined
  ? []
  : (JSON.parse(readFileSync(process.argv[3], 'utf8')) as { events?: readonly Event[] }).events ?? []
h.feed(events)

const count = (mask: number): number => ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0)

function map(s: Keeps, N: StagePlatformer): string {
  const W = 40, H = 22, cells = Array.from({ length: H }, () => Array.from({ length: W }, () => ' '))
  const put = (x: number, y: number, c: string): void => {
    const gx = Math.floor(x / stage.w * W), gy = Math.floor(y / stage.h * H)
    if (gx >= 0 && gx < W && gy >= 0 && gy < H) cells[gy]![gx] = c
  }
  for (const raw of [...boxWalls(N.bounds, N.wall), ...N.solids]) {
    const b = turnBox(raw, s.turn, stage.w / 2, stage.h / 2)
    const x0 = Math.max(0, Math.floor(b.x / stage.w * W)), x1 = Math.min(W - 1, Math.floor((b.x + b.w) / stage.w * W))
    const y0 = Math.max(0, Math.floor(b.y / stage.h * H)), y1 = Math.min(H - 1, Math.floor((b.y + b.h) / stage.h * H))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y]![x] = '#'
  }
  for (let i = 0; i < N.suns.length; i++) {
    const p = turnPoint(N.suns[i]!.x, N.suns[i]!.y, s.turn, stage.w / 2, stage.h / 2)
    put(p.x, p.y, (s.suns & (1 << i)) !== 0 ? '●' : String(i + 1))
  }
  const hatch = turnBox(N.hatch, s.turn, stage.w / 2, stage.h / 2)
  put(hatch.x + hatch.w / 2, hatch.y + hatch.h / 2, s.suns === 7 ? 'O' : 'H')
  put(N.core.x, N.core.y, 'X'); put(s.x, s.y - N.bodyH / 2, 'P')
  return cells.map((row) => row.join('')).join('\n')
}

let prior = ''
for (let ms = 0; ms <= Math.max(5000, (events.at(-1)?.[0] ?? 0) + 1000); ms += 16) {
  h.tick(ms)
  const observation = h.observe()
  const semantic = describeObservation(observation)
  if (semantic !== prior) {
    process.stdout.write(`\n${ms.toString().padStart(5)} ms · ${semantic}\n`)
    if (observation.kind === 'platformer' && stage.platformer !== null) {
      process.stdout.write(map(observation.state, stage.platformer) + '\n')
    }
    prior = semantic
  }
}
