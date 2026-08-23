import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import { PROJECT_ASSETS } from './catalog.ts'

export const PROJECT_ID = 'apollo-11'
export const PROJECT_SEED = 0x140816

export function compileProject(): CompiledBundle {
  return compileBundle(PROJECT_ID, PROJECT_ASSETS, PROJECT_SEED)
}
