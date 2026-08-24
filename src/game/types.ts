export type WorkspaceMode = 'play' | 'inspect'

export const WORKSPACE_SCENES = [
  {
    id: 'depth-study',
    label: 'Pyramid chambers',
    detail: 'WASD / arrows · E or Space enters a glowing mural',
  },
  {
    id: 'glyph-puzzle',
    label: 'Glyph puzzle',
    detail: 'Find the golden key · E breaks the vessel',
  },
  {
    id: 'glyph-platform',
    label: 'Glyph platform',
    detail: 'Climb and face the guardian · E throws stones',
  },
] as const

export type WorkspaceScene = (typeof WORKSPACE_SCENES)[number]['id']

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
