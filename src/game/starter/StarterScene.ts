import Phaser from 'phaser'
import type { CompiledBundle } from '../../compiler/types.ts'
import { installBundle } from '../../phaser/installBundle.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'

export const STAGE_WIDTH = 960
export const STAGE_HEIGHT = 540

export class StarterScene extends Phaser.Scene {
  private readonly bundle: CompiledBundle
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private mode: WorkspaceMode = 'play'
  private overlay?: Phaser.GameObjects.Graphics
  private cursor?: Phaser.GameObjects.Graphics
  private lastReportAt = -Infinity

  constructor(bundle: CompiledBundle, report: (snapshot: RuntimeSnapshot) => void) {
    super('starter')
    this.bundle = bundle
    this.report = report
  }

  create(): void {
    installBundle(this, this.bundle)
    this.drawStage()
    this.overlay = this.drawOverlay().setVisible(false)
    this.cursor = this.drawCursor()

    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.releaseWorkspaceEvents, this)
    this.publishSnapshot()
  }

  override update(time: number): void {
    const pointer = this.input.activePointer
    this.cursor?.setPosition(
      Phaser.Math.Clamp(Math.round(pointer.x), 0, STAGE_WIDTH),
      Phaser.Math.Clamp(Math.round(pointer.y), 0, STAGE_HEIGHT),
    )
    if (time - this.lastReportAt >= 100) this.publishSnapshot()
  }

  private drawStage(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x080c13, 1)
    graphics.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    graphics.lineStyle(1, 0x172231, 1)
    for (let x = 0; x <= STAGE_WIDTH; x += 48) graphics.lineBetween(x, 0, x, STAGE_HEIGHT)
    for (let y = 0; y <= STAGE_HEIGHT; y += 48) graphics.lineBetween(0, y, STAGE_WIDTH, y)

    this.add.text(48, 44, 'UNTITLED GAME', {
      color: '#dce3ee',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '24px',
      fontStyle: 'bold',
    })
    this.add.text(48, 82, 'StarterScene', {
      color: '#5be7ff',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '13px',
    })

    const card = this.add.rectangle(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, 520, 184, 0x0d131d, 0.96)
    card.setStrokeStyle(1, 0x2a394b)
    this.add.text(STAGE_WIDTH / 2, STAGE_HEIGHT / 2 - 34, 'PHASER RUNTIME READY', {
      color: '#6ee7a5',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.text(
      STAGE_WIDTH / 2,
      STAGE_HEIGHT / 2 + 20,
      'Choose the next game direction before adding content.\nThe scene, compiler and asset pipelines are ready.',
      {
        align: 'center',
        color: '#7e8999',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '12px',
        lineSpacing: 8,
      },
    ).setOrigin(0.5)
  }

  private drawOverlay(): Phaser.GameObjects.Graphics {
    const overlay = this.add.graphics()
    overlay.lineStyle(1, 0x5be7ff, 0.72)
    overlay.strokeRect(1, 1, STAGE_WIDTH - 2, STAGE_HEIGHT - 2)
    overlay.lineBetween(STAGE_WIDTH / 2, 0, STAGE_WIDTH / 2, STAGE_HEIGHT)
    overlay.lineBetween(0, STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT / 2)
    overlay.strokeRect(48, 48, STAGE_WIDTH - 96, STAGE_HEIGHT - 96)
    return overlay
  }

  private drawCursor(): Phaser.GameObjects.Graphics {
    const cursor = this.add.graphics()
    cursor.lineStyle(1, 0x5be7ff, 0.8)
    cursor.lineBetween(-7, 0, 7, 0)
    cursor.lineBetween(0, -7, 0, 7)
    return cursor
  }

  private readonly setWorkspaceMode = (mode: WorkspaceMode): void => {
    this.mode = mode
    this.input.enabled = mode === 'play'
    this.cursor?.setVisible(mode === 'play')
    this.publishSnapshot()
  }

  private readonly setOverlayVisibility = (visible: boolean): void => {
    this.overlay?.setVisible(visible)
  }

  private publishSnapshot(): void {
    const pointer = this.input.activePointer
    this.lastReportAt = this.time.now
    this.report({
      scene: 'starter',
      mode: this.mode,
      pointerX: Phaser.Math.Clamp(Math.round(pointer.x), 0, STAGE_WIDTH),
      pointerY: Phaser.Math.Clamp(Math.round(pointer.y), 0, STAGE_HEIGHT),
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private readonly releaseWorkspaceEvents = (): void => {
    this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
  }
}
