/**
 * Typed state exposed by a running game. This module has no DOM or renderer types, so command-line
 * instruments and tests consume the same observation contract as the browser runtime.
 */

export type Climber = {
  at: number; x: number; y: number; vy: number; face: number
  state: 'fall' | 'rise' | 'tuck'; tuck: number
  cam: number; top: number; best: number; over: boolean
}

export type Runs = {
  at: number; dist: number; y: number; vy: number; jumps: number
  state: 'run' | 'flip' | 'leap' | 'caught'; clip: number
  speed: number; menace: number; passed: number; best: number; over: boolean
}

export type Rides = {
  at: number; dist: number; x: number; y: number; vy: number
  steer: number; clip: number; speed: number; best: number; over: boolean
}

export type Player = {
  at: number; x: number; row: number; face: number; dir: string
  state: string; walk: number; atk: number; hit: boolean
  lift: number; vy: number
}

export type Machine = {
  x: number; z: number; h: number; bh: number; vh?: number
  player: boolean; armour: number
  walked: number; boost: number; cool: number; reload: number
  dir: number; flip: number; hurt: number
  bf?: number; bs?: number; band?: number
}

export type Shot = { x: number; z: number; h: number; gone: number; mine: boolean }

export type Duel = {
  you: Machine; foe: Machine
  pillars: { x: number; z: number; band?: number }[]
  shots: Shot[]; over: number; clock: number
}

export type KeeperState = 'idle' | 'run' | 'rise' | 'fall' | 'brace' | 'dead' | 'won'

export type Keeps = {
  at: number; x: number; y: number; vx: number; vy: number; face: number
  state: KeeperState; stateAt: number; walked: number; grounded: boolean
  turn: number; turning: number; turnFrom: number; turnClock: number
  suns: number; over: boolean; won: boolean; elapsed: number; best: number
}

export type Cam = { x: number; z: number; h: number; b: number }

export type RuntimeState = Player | Climber | Runs | Rides | Duel | Keeps | null

/** A discriminant belongs to the observation, not to each shape's compact simulation state. */
export type Observation =
  | { readonly kind: 'stage'; readonly state: Player | null }
  | { readonly kind: 'climb'; readonly state: Climber }
  | { readonly kind: 'runner'; readonly state: Runs }
  | { readonly kind: 'descent'; readonly state: Rides }
  | { readonly kind: 'arena'; readonly state: Duel }
  | { readonly kind: 'platformer'; readonly state: Keeps }
  | { readonly kind: 'inactive'; readonly state: null }
