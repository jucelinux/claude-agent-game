import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'
import { getProjectAssets } from './catalog.ts'

export const PROJECT_ID = 'pyramid-glyph-prototype'
export const PROJECT_SEED = 0x1a6e17

const PROJECT_SEEDS: Readonly<Record<PrototypeId, number>> = {
  'pyramid-glyph-prototype': PROJECT_SEED,
  'ashfall-prototype': 0x5ec707,
}

export function compileProject(projectId: PrototypeId = PROJECT_ID): CompiledBundle {
  return compileBundle(projectId, getProjectAssets(projectId), PROJECT_SEEDS[projectId])
}
