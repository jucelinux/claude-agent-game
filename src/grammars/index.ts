import type { Grammar } from '../core/types.ts'
import { ASTRONAUT } from './characters/astronaut.ts'
import { MOON } from './scenery/moon.ts'

export const PROJECT_GRAMMARS: readonly Grammar[] = [...ASTRONAUT, ...MOON]

export const GRAMMARS: Readonly<Record<string, Grammar>> = Object.freeze(
  Object.fromEntries(PROJECT_GRAMMARS.map((grammar) => [grammar.name, grammar])),
)

export function grammarByName(name: string): Grammar {
  const grammar = GRAMMARS[name]
  if (grammar === undefined) throw new Error(`unknown project grammar "${name}"`)
  return grammar
}
