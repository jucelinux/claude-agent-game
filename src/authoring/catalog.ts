import type { AssetSource } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'

/** The imported mecha atlas stays outside the procedural grammar bundle. */
const EMPTY_PROJECT_ASSETS: readonly AssetSource[] = []

const PROJECT_ASSETS_BY_ID: Readonly<Record<PrototypeId, readonly AssetSource[]>> = {
  'lcd-platformer-prototype': EMPTY_PROJECT_ASSETS,
}

export function getProjectAssets(projectId: PrototypeId): readonly AssetSource[] {
  return PROJECT_ASSETS_BY_ID[projectId]
}
