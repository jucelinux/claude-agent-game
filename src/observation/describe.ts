import type { Observation } from './types.ts'

const bits = (mask: number): number => ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0)

/** One stable line per semantic state. It is deliberately not a full object dump. */
export function describeObservation(o: Observation): string {
  if (o.kind === 'inactive') return 'inactive'
  if (o.kind === 'stage') return o.state === null ? 'stage · diorama' : `stage · ${o.state.state} · x ${Math.round(o.state.x)} · row ${Math.round(o.state.row)} · lift ${Math.round(o.state.lift)}`
  if (o.kind === 'climb') return `climb · ${o.state.state} · ${Math.floor(o.state.best)} m${o.state.over ? ' · OVER' : ''}`
  if (o.kind === 'runner') return `runner · ${o.state.state} · ${Math.floor(o.state.best)} m · jumps ${o.state.jumps}${o.state.over ? ' · OVER' : ''}`
  if (o.kind === 'descent') return `descent · ${Math.floor(o.state.best)} m · steer ${o.state.steer}${o.state.over ? ' · OVER' : ''}`
  if (o.kind === 'arena') return `arena · AP ${Math.round(o.state.you.armour)} · target ${Math.round(o.state.foe.armour)} · shots ${o.state.shots.length}${o.state.over ? ` · OVER ${o.state.over}` : ''}`
  return `platformer · turn ${o.state.turn}${o.state.turning ? ' →' : ''} · ${o.state.state} · suns ${bits(o.state.suns)}/3${o.state.over ? ' · OVER' : ''}${o.state.won ? ' · WON' : ''}`
}
