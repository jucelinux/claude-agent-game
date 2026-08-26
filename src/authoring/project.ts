import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'
import { getProjectAssets } from './catalog.ts'

export const PROJECT_ID = 'ashfall-prototype'
export const PROJECT_SEED = 0x5ec707

const PROJECT_SEEDS: Readonly<Record<PrototypeId, number>> = {
  'ashfall-prototype': PROJECT_SEED,
  'sunlit-earth-prototype': 0x51a17e,
}

export function compileProject(projectId: PrototypeId = PROJECT_ID): CompiledBundle {
  return compileBundle(projectId, getProjectAssets(projectId), PROJECT_SEEDS[projectId])
}
