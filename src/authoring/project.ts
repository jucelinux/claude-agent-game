import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'
import { getProjectAssets } from './catalog.ts'

export const PROJECT_ID = 'lcd-platformer-prototype'
export const PROJECT_SEED = 0x0be91

const PROJECT_SEEDS: Readonly<Record<PrototypeId, number>> = {
  'lcd-platformer-prototype': PROJECT_SEED,
}

export function compileProject(projectId: PrototypeId = PROJECT_ID): CompiledBundle {
  return compileBundle(projectId, getProjectAssets(projectId), PROJECT_SEEDS[projectId])
}
