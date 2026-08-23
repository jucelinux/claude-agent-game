import { ASTRONAUT } from '../grammars/characters/astronaut.ts'
import { MOON } from '../grammars/scenery/moon.ts'
import type { AssetSource } from '../compiler/types.ts'
import { PROJECT_PARAMS } from './params.ts'

export const PROJECT_ASSETS: readonly AssetSource[] = [
  ...ASTRONAUT.map((grammar) => ({
    id: grammar.name,
    kind: 'character' as const,
    grammar,
    params: PROJECT_PARAMS.astronaut,
  })),
  ...MOON.map((grammar) => ({
    id: grammar.name,
    kind: 'environment' as const,
    grammar,
    params: grammar.name === 'earth'
      ? PROJECT_PARAMS.earth
      : grammar.name.startsWith('crater-')
        ? PROJECT_PARAMS.crater
        : PROJECT_PARAMS.regolith,
  })),
]
