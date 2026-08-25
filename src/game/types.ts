import type { WorkspaceScene } from '../projects/manifest.ts'

export {
  PROTOTYPE_SCENES,
  getPrototypeScenes,
  type PrototypeId,
  type WorkspaceScene,
  type WorkspaceSceneDefinition,
} from '../projects/manifest.ts'

export type WorkspaceMode = 'play' | 'inspect'

export type PrototypeProgress = {
  puzzleComplete: boolean
}

export const WORKSPACE_MODE_EVENT = 'workspace:mode'
export const WORKSPACE_OVERLAY_EVENT = 'workspace:overlays'

export type RuntimeSnapshot = {
  readonly scene: WorkspaceScene
  readonly mode: WorkspaceMode
  readonly playerX: number
  readonly playerY: number
  readonly playerDepth: number
  readonly interaction: 'mural' | 'locked-mural' | null
  readonly fps: number
}
