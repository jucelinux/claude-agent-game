/**
 * Seeded input exploration for running games. It does not judge fun or search for a winning
 * route. It asks the cheaper questions a known replay cannot: does ordinary alternate input
 * throw, produce a non-finite state, or violate a declared world boundary?
 *
 *   node bin/explore-play.ts all
 *   node bin/explore-play.ts orrery --seeds 32 --seconds 8
 *   node bin/explore-play.ts orrery --write /tmp/orrery-failure.play.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { turnBox } from '../src/runtime/collision.ts'
import { run } from '../tests/harness.ts'
import type { Observation } from '../src/observation/types.ts'
import type { Stage } from '../src/scene/layers.ts'
import type { Play } from './play.ts'

export type ExplorationFailure = {
  readonly game: string
  readonly seed: number
  readonly at: number
  readonly reason: string
  readonly play: Play
}

const mix = (value: number): number => {
  let n = value >>> 0
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5
  return n >>> 0
}

/** A deterministic, balanced sequence: held movement plus taps on both semantic verbs. */
export function generatedPlay(game: string, seed: number, seconds: number): Play {
  const events: (readonly [number, string, boolean])[] = []
  let random = seed >>> 0
  let horizontal = ''
  let vertical = ''
  const choose = (keys: readonly string[]): string => {
    random = mix(random || 0x9e3779b9)
    return keys[random % keys.length]!
  }
  const hold = (at: number, prior: string, next: string): string => {
    if (prior === next) return prior
    if (prior !== '') events.push([at, prior, false])
    if (next !== '') events.push([at, next, true])
    return next
  }
  const slots = Math.max(1, Math.floor((seconds * 1000 - 120) / 300))
  for (let i = 0; i < slots; i++) {
    const at = 100 + i * 300
    horizontal = hold(at, horizontal, choose(['', 'ArrowLeft', 'ArrowRight']))
    vertical = hold(at + 1, vertical, choose(['', 'ArrowUp', 'ArrowDown']))
    random = mix(random)
    if (i % 4 === 1 || (random & 7) === 0) events.push([at + 40, ' ', true], [at + 72, ' ', false])
    random = mix(random)
    if (i % 5 === 2 || (random & 15) === 0) events.push([at + 90, 'x', true], [at + 122, 'x', false])
  }
  const end = Math.max(0, seconds * 1000 - 4)
  if (horizontal !== '') events.push([end, horizontal, false])
  if (vertical !== '') events.push([end + 1, vertical, false])
  events.sort((a, b) => a[0] - b[0])
  return { game, seconds, events }
}

function finite(value: unknown, path: string, errors: string[]): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) errors.push(`${path} is ${String(value)}`)
    return
  }
  if (value === null || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) finite(value[i], `${path}[${i}]`, errors)
    return
  }
  for (const [key, child] of Object.entries(value)) finite(child, `${path}.${key}`, errors)
}

/** Product invariants only. No aesthetic or difficulty threshold belongs here. */
export function validateObservation(observation: Observation, stage: Stage): readonly string[] {
  const errors: string[] = []
  finite(observation, observation.kind, errors)
  if (observation.kind === 'stage' && observation.state !== null) {
    const actor = stage.placed[observation.state.at]?.player
    if (actor !== undefined) {
      if (observation.state.x < actor.minX - 0.001 || observation.state.x > actor.maxX + 0.001) errors.push('stage player left its authored x range')
      if (actor.roam !== undefined && (observation.state.row < actor.roam.minRow - 0.001 || observation.state.row > actor.roam.maxRow + 0.001)) errors.push('stage player left its authored row range')
    }
  }
  if (observation.kind === 'climb' && (observation.state.x < 0 || observation.state.x >= stage.w)) errors.push('climber left its wrapped world')
  if (observation.kind === 'descent' && stage.descent !== null) {
    if (observation.state.x < stage.descent.minX - 0.001 || observation.state.x > stage.descent.maxX + 0.001) errors.push('rider left its authored lane range')
  }
  if (observation.kind === 'arena' && stage.arena !== null) {
    for (const [name, machine] of [['player', observation.state.you], ['foe', observation.state.foe]] as const) {
      if (Math.hypot(machine.x, machine.z) > stage.arena.radius + 0.001) errors.push(`${name} left the arena radius`)
    }
  }
  if (observation.kind === 'platformer' && stage.platformer !== null) {
    const s = observation.state, p = stage.platformer
    const b = turnBox(p.bounds, s.turn, stage.w / 2, stage.h / 2)
    if (s.x - p.bodyHalfW < b.x - 0.001 || s.x + p.bodyHalfW > b.x + b.w + 0.001 ||
        s.y - p.bodyH < b.y - 0.001 || s.y > b.y + b.h + 0.001) {
      errors.push('keeper body left the navigable room')
    }
    if (!Number.isInteger(s.turn) || s.turn < 0 || s.turn > 3) errors.push('keeper turn is not an exact quarter')
  }
  return errors
}

const pageFor = (id: string): { page: string; stage: Stage } => {
  const game = MICRO_GAMES.find((g) => g.id === id)
  if (game === undefined) throw new Error(`no game "${id}" on the shelf`)
  const stage = toStage(game.scene)
  return {
    stage,
    page: gamePage({
      id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
      ...(game.keys === undefined ? {} : { keys: game.keys }),
      ...(game.actions === undefined ? {} : { actions: game.actions }),
    }),
  }
}

function runOne(page: string, stage: Stage, play: Play, seed: number, hz: number): ExplorationFailure | null {
  const h = run(page)
  h.feed(play.events)
  const frames = Math.floor(play.seconds * hz)
  let at = 0
  try {
    for (let f = 0; f <= frames; f++) {
      at = f === frames ? play.seconds * 1000 : f * 1000 / hz
      h.tick(at)
      const errors = validateObservation(h.observe(), stage)
      if (errors.length > 0) return { game: play.game, seed, at, reason: errors.join('; '), play }
    }
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
    return { game: play.game, seed, at, reason: message, play }
  }
  return null
}

export function exploreGame(id: string, seeds: number, seconds: number, hz = 60): ExplorationFailure | null {
  const built = pageFor(id)
  for (let seed = 1; seed <= seeds; seed++) {
    const play = generatedPlay(id, seed, seconds)
    const failure = runOne(built.page, built.stage, play, seed, hz)
    if (failure !== null) return failure
  }
  return null
}

if (process.argv[1]?.endsWith('explore-play.ts') === true) {
  const args = process.argv.slice(2)
  const target = args[0] !== undefined && !args[0].startsWith('--') ? args[0] : 'all'
  const flag = (name: string, fallback: string): string => {
    const at = args.indexOf(`--${name}`)
    return at < 0 ? fallback : args[at + 1] ?? fallback
  }
  const seeds = Number(flag('seeds', '16')), seconds = Number(flag('seconds', '5')), hz = Number(flag('hz', '60'))
  if (!Number.isInteger(seeds) || seeds < 1 || !Number.isFinite(seconds) || seconds <= 0 ||
      !Number.isFinite(hz) || hz <= 0) throw new Error('seeds must be a positive integer; seconds and hz must be positive numbers')
  const ids = target === 'all' ? MICRO_GAMES.map((g) => g.id) : [target]
  let failure: ExplorationFailure | null = null
  for (const id of ids) {
    process.stdout.write(`${id} · ${seeds} seeds × ${seconds}s at ${hz} Hz ... `)
    failure = exploreGame(id, seeds, seconds, hz)
    process.stdout.write(failure === null ? 'ok\n' : `FAIL at ${failure.at.toFixed(1)} ms · ${failure.reason}\n`)
    if (failure !== null) break
  }
  if (failure !== null) {
    const outAt = args.indexOf('--write')
    const out = outAt < 0 ? '' : args[outAt + 1] ?? ''
    const payload = `${JSON.stringify(failure.play, null, 2)}\n`
    if (out !== '') {
      mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, payload)
      process.stdout.write(`wrote reproducible failure to ${out}\n`)
    } else process.stdout.write(payload)
    process.exitCode = 1
  }
}
