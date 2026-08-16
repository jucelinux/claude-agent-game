import type { Grammar } from '../core/types.ts'
import { fixture } from './fixture.ts'
import { probeA, probeB, probeC } from './probe/idioms.ts'
import { probeD } from './probe/humanoid.ts'
import { beetle, beetleWave } from './run3/beetle.ts'
import { mantis } from './run3/mantis.ts'
import { scorpion } from './run3/scorpion.ts'
import { gorilla } from './run5/gorilla.ts'
import { gorillaMech } from './run6/mech.ts'
import { gorillaAttack, gorillaJump } from './run7/actions.ts'
import { gorillaJumpChrono, gorillaJumpStardew } from './run8/idioms.ts'
import { tree } from './run9/tree.ts'
import { FOREST } from './run12/forest.ts'
import { CLOUDS } from './run12/cloud.ts'
import { PHOTOGRAPHER } from './run13/photographer.ts'
import { gorillaIdle } from './run13/idle.ts'
import { ASTRONAUT } from './run14/astronaut.ts'
import { MOON } from './run14/moon.ts'

export const GRAMMARS: Readonly<Record<string, Grammar>> = {
  fixture,
  'probe-a': probeA,
  'probe-b': probeB,
  'probe-c': probeC,
  'probe-d': probeD,
  beetle,
  'beetle-wave': beetleWave,
  mantis,
  scorpion,
  gorilla,
  'gorilla-mech': gorillaMech,
  'gorilla-jump': gorillaJump,
  'gorilla-attack': gorillaAttack,
  'gorilla-jump-stardew': gorillaJumpStardew,
  'gorilla-jump-chrono': gorillaJumpChrono,
  tree,
  ...Object.fromEntries(FOREST.map((g) => [g.name, g])),
  ...Object.fromEntries(CLOUDS.map((g) => [g.name, g])),
  'gorilla-idle': gorillaIdle,
  ...Object.fromEntries(PHOTOGRAPHER.map((g) => [g.name, g])),
  ...Object.fromEntries(ASTRONAUT.map((g) => [g.name, g])),
  ...Object.fromEntries(MOON.map((g) => [g.name, g])),
}

/**
 * Which tunables each grammar is authored against. A grammar and a tone budget are one
 * decision — validating a grammar against somebody else's budget would report a violation
 * that does not exist, and hide the one that does.
 */
export const PAIRS: readonly { readonly grammar: string; readonly tunables: string }[] = [
  { grammar: 'fixture', tunables: 'default' },
  { grammar: 'probe-a', tunables: 'probe-a' },
  { grammar: 'probe-b', tunables: 'probe-b' },
  { grammar: 'probe-c', tunables: 'probe-c' },
  { grammar: 'probe-d', tunables: 'probe-d' },
  { grammar: 'beetle', tunables: 'beetle' },
  { grammar: 'beetle-wave', tunables: 'beetle' },
  { grammar: 'mantis', tunables: 'mantis' },
  { grammar: 'scorpion', tunables: 'scorpion' },
  { grammar: 'gorilla', tunables: 'gorilla' },
  { grammar: 'gorilla-mech', tunables: 'gorilla-mech' },
  { grammar: 'gorilla-jump', tunables: 'gorilla-jump' },
  { grammar: 'gorilla-attack', tunables: 'gorilla-attack' },
  { grammar: 'gorilla-jump-stardew', tunables: 'gorilla-jump-stardew' },
  { grammar: 'gorilla-jump-chrono', tunables: 'gorilla-jump-chrono' },
  { grammar: 'tree', tunables: 'tree' },
  ...FOREST.map((g) => ({ grammar: g.name, tunables: 'wood' })),
  ...CLOUDS.map((g) => ({ grammar: g.name, tunables: 'sky' })),
  { grammar: 'gorilla-idle', tunables: 'gorilla-idle' },
  ...PHOTOGRAPHER.map((g) => ({ grammar: g.name, tunables: 'photog' })),
  ...ASTRONAUT.map((g) => ({ grammar: g.name, tunables: 'astronaut' })),
  { grammar: 'earth', tunables: 'earth' },
  ...MOON.filter((g) => g.name !== 'earth').map((g) => ({ grammar: g.name, tunables: 'regolith' })),
]

export function grammarByName(name: string): Grammar {
  const g = GRAMMARS[name]
  if (g === undefined) throw new Error(`unknown grammar "${name}" (have: ${Object.keys(GRAMMARS).join(', ')})`)
  return g
}
