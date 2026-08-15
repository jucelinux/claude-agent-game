import type { Grammar } from '../core/types.ts'
import { fixture } from './fixture.ts'
import { probeA, probeB, probeC } from './probe/idioms.ts'
import { probeD } from './probe/humanoid.ts'
import { beetle, beetleWave } from './run3/beetle.ts'
import { mantis } from './run3/mantis.ts'
import { scorpion } from './run3/scorpion.ts'

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
]

export function grammarByName(name: string): Grammar {
  const g = GRAMMARS[name]
  if (g === undefined) throw new Error(`unknown grammar "${name}" (have: ${Object.keys(GRAMMARS).join(', ')})`)
  return g
}
