import Phaser from 'phaser'
import type { CompiledBundle } from '../compiler/types.ts'
import { StarterScene, STAGE_HEIGHT, STAGE_WIDTH } from './starter/StarterScene.ts'
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
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    backgroundColor: '#080c13',
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
    scene: [new StarterScene(bundle, report)],
  })

  let mode: WorkspaceMode = 'play'
  let overlays = false
  let requestedScene: WorkspaceScene = 'starter'

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

    // READY may fire while SceneManager is draining its pending queue. `start` supports that
    // state; eagerly resolving the scene with `getScene` can return null and break navigation.
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
