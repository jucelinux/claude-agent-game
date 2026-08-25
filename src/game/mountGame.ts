import Phaser from 'phaser'
import type { CompiledBundle } from '../compiler/types.ts'
import { DepthStudyScene, STAGE_HEIGHT, STAGE_WIDTH } from './depth/DepthStudyScene.ts'
import { GlyphWorldScene } from './glyph/GlyphWorldScene.ts'
import { WastelandMapScene } from './wasteland/WastelandMapScene.ts'
import {
  getPrototypeScenes,
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type PrototypeId,
  type PrototypeProgress,
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
  prototypeId: PrototypeId,
  report: (snapshot: RuntimeSnapshot) => void,
): GameHandle {
  let mode: WorkspaceMode = 'play'
  let overlays = false
  const firstScene = getPrototypeScenes(prototypeId)[0]
  if (firstScene === undefined) throw new Error(`prototype ${prototypeId} has no scenes`)
  let requestedScene: WorkspaceScene = firstScene.id
  const reportScene = (snapshot: RuntimeSnapshot): void => {
    report(snapshot)
  }
  const progress: PrototypeProgress = { puzzleComplete: false }
  const scenes = prototypeId === 'pyramid-glyph-prototype'
    ? [
        new DepthStudyScene(bundle, reportScene, progress),
        new GlyphWorldScene(bundle, reportScene, progress, 'puzzle'),
        new GlyphWorldScene(bundle, reportScene, progress, 'platform'),
      ]
    : [new WastelandMapScene(bundle, reportScene)]

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    backgroundColor: prototypeId === 'ashfall-prototype' ? '#0b1015' : '#080c13',
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
    scene: scenes,
  })

  const syncWorkspaceState = (): void => {
    game.events.emit(WORKSPACE_MODE_EVENT, mode)
    game.events.emit(WORKSPACE_OVERLAY_EVENT, overlays)
  }

  const startRequestedScene = (): void => {
    if (!game.isBooted) return
    const activeScenes = game.scene.getScenes(true)
    if (activeScenes.length === 1 && activeScenes[0]?.scene.key === requestedScene) {
      syncWorkspaceState()
      return
    }

    for (const activeScene of activeScenes) {
      if (activeScene.scene.key !== requestedScene) game.scene.stop(activeScene.scene.key)
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
