import type { AssetSource } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'
import { WASTELAND_TRAVELER_3D_ATLAS_ASSETS } from './wastelandTraveler3dAtlas.ts'

/** Sunlit Earth is currently a geometric blockout with no compiled raster assets. */
const EMPTY_PROJECT_ASSETS: readonly AssetSource[] = []

/** The Blender bake uses a human motion-capture cycle retargeted to the low-poly traveler. */
export const ASHFALL_ASSETS: readonly AssetSource[] = WASTELAND_TRAVELER_3D_ATLAS_ASSETS

const PROJECT_ASSETS_BY_ID: Readonly<Record<PrototypeId, readonly AssetSource[]>> = {
  'ashfall-prototype': ASHFALL_ASSETS,
  'sunlit-earth-prototype': EMPTY_PROJECT_ASSETS,
}

export function getProjectAssets(projectId: PrototypeId): readonly AssetSource[] {
  return PROJECT_ASSETS_BY_ID[projectId]
}
