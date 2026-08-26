import type { Engine } from '@babylonjs/core/Engines/engine.js'
import type { Scene } from '@babylonjs/core/scene.js'
import type { CompiledBundle } from '../compiler/types.ts'
import type {
  RuntimeSnapshot,
  WorkspaceMode,
  WorkspaceScene,
} from '../game/types.ts'

/** Thin lifecycle contract between the React Builder and project-owned Babylon scenes. */
export type BabylonSceneController = {
  readonly id: WorkspaceScene
  readonly scene: Scene
  setActive(active: boolean): void
  setMode(mode: WorkspaceMode): void
  setOverlays(visible: boolean): void
  update(deltaSeconds: number, timeMs: number): void
  snapshot(): RuntimeSnapshot
  dispose(): void
}

export type BabylonSceneContext = {
  readonly engine: Engine
  readonly canvas: HTMLCanvasElement
  readonly bundle: CompiledBundle
  readonly input: KeyboardState
}

export class KeyboardState {
  private readonly held = new Set<string>()
  private readonly pressed = new Set<string>()
  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', 'Playable Babylon.js scene')
    canvas.addEventListener('pointerdown', this.focus)
    canvas.addEventListener('keydown', this.keyDown)
    canvas.addEventListener('keyup', this.keyUp)
    canvas.addEventListener('blur', this.clear)
  }

  isDown(...codes: readonly string[]): boolean {
    return codes.some((code) => this.held.has(code))
  }

  consume(...codes: readonly string[]): boolean {
    const code = codes.find((candidate) => this.pressed.has(candidate))
    if (code === undefined) return false
    this.pressed.delete(code)
    return true
  }

  endFrame(): void {
    this.pressed.clear()
  }

  dispose(): void {
    this.clear()
    this.canvas.removeEventListener('pointerdown', this.focus)
    this.canvas.removeEventListener('keydown', this.keyDown)
    this.canvas.removeEventListener('keyup', this.keyUp)
    this.canvas.removeEventListener('blur', this.clear)
  }

  private readonly focus = (): void => this.canvas.focus({ preventScroll: true })

  private readonly keyDown = (event: KeyboardEvent): void => {
    if (!event.repeat) this.pressed.add(event.code)
    this.held.add(event.code)
    if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault()
  }

  private readonly keyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code)
  }

  private readonly clear = (): void => {
    this.held.clear()
    this.pressed.clear()
  }
}
