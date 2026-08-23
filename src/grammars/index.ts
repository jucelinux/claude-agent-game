import type { Grammar } from '../core/types.ts'

/** Procedural content for the active project. Empty on the neutral main branch. */
export const PROJECT_GRAMMARS: readonly Grammar[] = []

export const GRAMMARS: Readonly<Record<string, Grammar>> = Object.freeze(
  Object.fromEntries(PROJECT_GRAMMARS.map((grammar) => [grammar.name, grammar])),
)

export function grammarByName(name: string): Grammar {
  const grammar = GRAMMARS[name]
  if (grammar === undefined) throw new Error(`unknown project grammar "${name}"`)
  return grammar
}
