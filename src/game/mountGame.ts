import Phaser from 'phaser'
import type { CompiledBundle } from '../compiler/types.ts'
import { LaunchScene } from './launch/LaunchScene.ts'
import { LandingScene } from './landing/LandingScene.ts'
import { MoonScene } from './moon/MoonScene.ts'
import { MOON_WORLD } from './moon/project.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
  type WorkspaceScene,
} from './types.ts'

export type GameHandle = {
  readonly setMode: (mode: WorkspaceMode) => void
  readonly setOverlays: (visible: boolean) => void
  readonly setScene: (scene: WorkspaceScene) => void
  readonly destroy: () => void
}

export function mountGame(
  parent: HTMLElement,
  bundle: CompiledBundle,
  report: (snapshot: RuntimeSnapshot) => void,
): GameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: MOON_WORLD.width,
    height: MOON_WORLD.height,
    backgroundColor: '#07070d',
    pixelArt: true,
    antialias: false,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new LaunchScene(report), new LandingScene(report), new MoonScene(bundle, report)],
  })

  let mode: WorkspaceMode = 'play'
  let overlays = false
  let requestedScene: WorkspaceScene = 'launch'

  const syncWorkspaceState = (): void => {
    game.events.emit(WORKSPACE_MODE_EVENT, mode)
    game.events.emit(WORKSPACE_OVERLAY_EVENT, overlays)
  }

  const startRequestedScene = (): void => {
    if (!game.isBooted) return
    const active = game.scene.getScenes(true)[0]
    if (active?.scene.key === requestedScene) {
      syncWorkspaceState()
      return
    }

    // Core READY may fire while SceneManager is still draining its pending scene queue.
    // SceneManager.start handles that state itself; looking up the inactive scene first does not.
    game.scene.start(requestedScene)
    game.events.once(Phaser.Core.Events.POST_RENDER, syncWorkspaceState)
  }

  game.events.once(Phaser.Core.Events.READY, startRequestedScene)

  return {
    setMode: (nextMode) => {
      mode = nextMode
      game.events.emit(WORKSPACE_MODE_EVENT, mode)
    },
    setOverlays: (visible) => {
      overlays = visible
      game.events.emit(WORKSPACE_OVERLAY_EVENT, overlays)
    },
    setScene: (scene) => {
      requestedScene = scene
      startRequestedScene()
    },
    destroy: () => game.destroy(true),
  }
}
