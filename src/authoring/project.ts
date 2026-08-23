import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import { PROJECT_ASSETS } from './catalog.ts'

export const PROJECT_ID = 'untitled-game'
export const PROJECT_SEED = 0x1a6e17

export function compileProject(): CompiledBundle {
  return compileBundle(PROJECT_ID, PROJECT_ASSETS, PROJECT_SEED)
}
