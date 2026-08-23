export type WorkspaceMode = 'play' | 'inspect'
export type WorkspaceScene = 'launch' | 'landing' | 'moon'

export const WORKSPACE_MODE_EVENT = 'workspace:mode'
export const WORKSPACE_OVERLAY_EVENT = 'workspace:overlays'

export type SurfaceRuntimeSnapshot = {
  readonly scene: 'surface'
  readonly x: number
  readonly y: number
  readonly facing: string
  readonly animation: string
  readonly jumping: boolean
  readonly fps: number
}

export type LandingRuntimeSnapshot = {
  readonly scene: 'landing'
  readonly getSeconds: number
  readonly altitudeFt: number
  readonly verticalSpeedFps: number
  readonly forwardSpeedFps: number
  readonly downrangeFt: number
  readonly descentRateCommandFps: number
  readonly fuelSeconds: number
  readonly program: 'P66'
  readonly site: 'crater' | 'boulders' | 'plain' | 'overshoot'
  readonly status: 'flying' | 'landed' | 'hard-landing'
  readonly fps: number
}

export type LaunchRuntimeSnapshot = {
  readonly scene: 'launch'
  readonly clockSeconds: number
  readonly phase: 'prelaunch' | 'terminal-count' | 'ignition' | 'liftoff' | 'tower-clear' | 'complete' | 'scrubbed'
  readonly station: 'collins-right' | 'crew-forward' | 'armstrong-left'
  readonly procedure: string
  readonly objective: string
  readonly acceptance: string
  readonly completedProcedures: number
  readonly totalProcedures: number
  readonly timeRate: number
  readonly mistakes: number
  readonly fps: number
}

export type RuntimeSnapshot = LaunchRuntimeSnapshot | SurfaceRuntimeSnapshot | LandingRuntimeSnapshot
