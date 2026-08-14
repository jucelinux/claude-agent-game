import type { Grammar } from '../core/types.ts'
import { fixture } from './fixture.ts'

export const GRAMMARS: Readonly<Record<string, Grammar>> = { fixture }

export function grammarByName(name: string): Grammar {
  const g = GRAMMARS[name]
  if (g === undefined) throw new Error(`unknown grammar "${name}" (have: ${Object.keys(GRAMMARS).join(', ')})`)
  return g
}
