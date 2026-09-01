import { compileBundle } from '../compiler/compile.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'
import { getProjectAssets } from './catalog.ts'

export const PROJECT_ID = 'tokyo-neon-89'
export const PROJECT_SEED = 0x1989

const PROJECT_SEEDS: Readonly<Record<PrototypeId, number>> = {
  'tokyo-neon-89': PROJECT_SEED,
}

export function compileProject(projectId: PrototypeId = PROJECT_ID): CompiledBundle {
  return compileBundle(projectId, getProjectAssets(projectId), PROJECT_SEEDS[projectId])
}
