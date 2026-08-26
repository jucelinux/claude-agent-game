import { Engine } from '@babylonjs/core/Engines/engine.js'
import { KeyboardState, type BabylonSceneController } from '../babylon/runtime.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import { createSunlitEarthScene } from './sunlit/SunlitEarthScene.ts'
import {
  getPrototypeScenes,
  type PrototypeId,
  type RuntimeSnapshot,
  type WorkspaceMode,
  type WorkspaceScene,
} from './types.ts'
import { createBabylonWastelandScene } from './wasteland/BabylonWastelandScene.ts'

export type GameHandle = {
  readonly setMode: (mode: WorkspaceMode) => void
  readonly setOverlays: (visible: boolean) => void
  readonly setScene: (scene: WorkspaceScene) => void
  readonly destroy: () => void
}

export function mountGame(
  parent: HTMLElement,
  bundle: CompiledBundle,
  prototypeId: PrototypeId,
  report: (snapshot: RuntimeSnapshot) => void,
): GameHandle {
  const firstScene = getPrototypeScenes(prototypeId)[0]
  if (firstScene === undefined) throw new Error(`prototype ${prototypeId} has no scenes`)

  const canvas = document.createElement('canvas')
  canvas.className = 'babylon-canvas'
  parent.append(canvas)
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    antialias: true,
    powerPreference: 'high-performance',
  }, true)
  const input = new KeyboardState(canvas)
  let mode: WorkspaceMode = 'play'
  let overlays = false
  let active: BabylonSceneController | undefined
  let elapsedMs = 0
  let lastReportAt = -Infinity

  const controllers = new Map<WorkspaceScene, BabylonSceneController>()
  const activate = (sceneId: WorkspaceScene): void => {
    const next = controllers.get(sceneId)
    if (next === undefined) throw new Error(`prototype ${prototypeId} has no scene "${sceneId}"`)
    if (next === active) return
    active?.setActive(false)
    active = next
    active.setMode(mode)
    active.setOverlays(overlays)
    active.setActive(true)
    report(active.snapshot())
  }

  const sceneContext = {
    engine,
    canvas,
    bundle,
    input,
  }
  const created = prototypeId === 'ashfall-prototype'
    ? [createBabylonWastelandScene(sceneContext)]
    : [createSunlitEarthScene(sceneContext)]
  for (const controller of created) controllers.set(controller.id, controller)
  activate(firstScene.id)

  engine.runRenderLoop(() => {
    const controller = active
    if (controller === undefined) return
    const deltaMs = Math.min(40, engine.getDeltaTime())
    elapsedMs += deltaMs
    controller.update(deltaMs / 1000, elapsedMs)
    const visible = active
    visible?.scene.render()
    if (visible !== undefined && elapsedMs - lastReportAt >= 100) {
      lastReportAt = elapsedMs
      report(visible.snapshot())
    }
    input.endFrame()
  })

  const resize = new ResizeObserver(() => engine.resize())
  resize.observe(parent)
  engine.resize()

  return {
    setMode: (nextMode) => {
      mode = nextMode
      active?.setMode(mode)
      if (active !== undefined) report(active.snapshot())
    },
    setOverlays: (visible) => {
      overlays = visible
      active?.setOverlays(overlays)
    },
    setScene: activate,
    destroy: () => {
      engine.stopRenderLoop()
      resize.disconnect()
      input.dispose()
      for (const controller of controllers.values()) controller.dispose()
      controllers.clear()
      engine.dispose()
      canvas.remove()
    },
  }
}
