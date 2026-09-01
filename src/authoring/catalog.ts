import type { AssetSource } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'

/** Tokyo Neon '89 is built from Babylon geometry and runtime-authored sign textures. */
const TOKYO_NEON_ASSETS: readonly AssetSource[] = []

const PROJECT_ASSETS_BY_ID: Readonly<Record<PrototypeId, readonly AssetSource[]>> = {
  'tokyo-neon-89': TOKYO_NEON_ASSETS,
}

export function getProjectAssets(projectId: PrototypeId): readonly AssetSource[] {
  return PROJECT_ASSETS_BY_ID[projectId]
}
