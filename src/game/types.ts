export type WorkspaceMode = 'play' | 'inspect'

export const WORKSPACE_SCENES = [
  {
    id: 'starter',
    label: 'Starter scene',
    detail: 'Neutral Phaser stage',
  },
] as const

export type WorkspaceScene = (typeof WORKSPACE_SCENES)[number]['id']

export const WORKSPACE_MODE_EVENT = 'workspace:mode'
export const WORKSPACE_OVERLAY_EVENT = 'workspace:overlays'

export type RuntimeSnapshot = {
  readonly scene: 'starter'
  readonly mode: WorkspaceMode
  readonly pointerX: number
  readonly pointerY: number
  readonly fps: number
}
