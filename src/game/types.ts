import type { WorkspaceScene } from '../projects/manifest.ts'

export {
  PROTOTYPE_SCENES,
  getPrototypeScenes,
  type PrototypeId,
  type WorkspaceScene,
  type WorkspaceSceneDefinition,
} from '../projects/manifest.ts'

export type WorkspaceMode = 'play' | 'inspect'

export type RuntimeSnapshot = {
  readonly scene: WorkspaceScene
  readonly mode: WorkspaceMode
  readonly playerX: number
  readonly playerY: number
  readonly playerDepth: number
  readonly playerFacing: 'left' | 'right'
  readonly motionState: string
  readonly motionPhase: number
  readonly velocityX: number
  readonly velocityY: number
  readonly interaction: string | null
  readonly fps: number
}
