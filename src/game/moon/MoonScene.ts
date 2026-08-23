import Phaser from 'phaser'
import type { CompiledBundle, CompiledClip } from '../../compiler/types.ts'
import { mulberry32 } from '../../core/rng.ts'
import { installBundle } from '../../phaser/installBundle.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'
import { LUNAR_PLACEMENTS, MOON_WORLD } from './project.ts'

const polygon = (...coordinates: number[]): Phaser.Math.Vector2[] => {
  const points: Phaser.Math.Vector2[] = []
  for (let index = 0; index < coordinates.length; index += 2) {
    points.push(new Phaser.Math.Vector2(coordinates[index] as number, coordinates[index + 1] as number))
  }
  return points
}

type DirectionKeys = {
  readonly up: Phaser.Input.Keyboard.Key
  readonly down: Phaser.Input.Keyboard.Key
  readonly left: Phaser.Input.Keyboard.Key
  readonly right: Phaser.Input.Keyboard.Key
}

export class MoonScene extends Phaser.Scene {
  private readonly bundle: CompiledBundle
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private readonly clips: ReadonlyMap<string, CompiledClip>
  private player!: Phaser.GameObjects.Container
  private astronaut!: Phaser.GameObjects.Sprite
  private shadow!: Phaser.GameObjects.Graphics
  private overlay!: Phaser.GameObjects.Graphics
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: DirectionKeys
  private jumpKey!: Phaser.Input.Keyboard.Key
  private mode: WorkspaceMode = 'play'
  private overlays = false
  private jumping = false
  private facing = 's'
  private mirrored = false
  private animation = 'astro-idle-s'
  private lastReportAt = -Infinity

  constructor(bundle: CompiledBundle, report: (snapshot: RuntimeSnapshot) => void) {
    super('moon')
    this.bundle = bundle
    this.report = report
    this.clips = new Map(bundle.clips.map((clip) => [clip.id, clip]))
  }

  create(): void {
    this.jumping = false
    this.facing = 's'
    this.mirrored = false
    this.animation = 'astro-idle-s'
    this.lastReportAt = -Infinity
    installBundle(this, this.bundle)
    this.cameras.main.setRoundPixels(true)
    this.physics.world.setBounds(
      MOON_WORLD.playable.x,
      MOON_WORLD.playable.y,
      MOON_WORLD.playable.w,
      MOON_WORLD.playable.h,
    )
    this.drawWorld()
    this.createPlayer()

    const keyboard = this.input.keyboard
    if (keyboard === null) throw new Error('keyboard input is unavailable')
    this.cursors = keyboard.createCursorKeys()
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as DirectionKeys
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
      this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
    })
  }

  override update(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.cursors.down.isDown || this.wasd.down.isDown
    const dx = this.mode === 'play' ? Number(right) - Number(left) : 0
    const dy = this.mode === 'play' ? Number(down) - Number(up) : 0
    const moving = dx !== 0 || dy !== 0

    if (moving) {
      const direction = new Phaser.Math.Vector2(dx, dy).normalize()
      body.setVelocity(direction.x * 114, direction.y * 78)
      this.readFacing(dx, dy)
    } else {
      body.setVelocity(0, 0)
    }

    if (this.mode === 'play' && Phaser.Input.Keyboard.JustDown(this.jumpKey) && !this.jumping) {
      this.startJump()
    }

    this.playMotion(this.jumping ? 'leap' : moving ? 'lope' : 'idle')
    this.player.setDepth(this.player.y)
    this.drawOverlays()

    if (time - this.lastReportAt >= 100) {
      this.lastReportAt = time
      this.report({
        scene: 'surface',
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: `${this.mirrored ? 'west/' : ''}${this.facing}`,
        animation: this.animation,
        jumping: this.jumping,
        fps: Math.round(this.game.loop.actualFps),
      })
    }
  }

  private drawWorld(): void {
    this.drawSky()
    this.drawRegolith()

    const earth = this.clip('earth')
    this.add.image(738, 86, earth.textureKey, 0).setScale(2).setDepth(-925)

    for (const placement of LUNAR_PLACEMENTS) {
      const clip = this.clip(placement.asset)
      const isRock = placement.asset.startsWith('rock-')
      if (isRock) this.drawGroundShadow(placement.x, placement.y, 22 * placement.scale, 0.34, placement.y - 1)
      this.add.image(placement.x, placement.y, clip.textureKey, 0)
        .setScale(placement.scale)
        .setRotation(placement.rotation ?? 0)
        .setDepth(isRock ? placement.y : -800 + placement.y / 1000)
    }
  }

  private drawSky(): void {
    this.add.graphics().setDepth(-1000)
      .fillStyle(0x030409)
      .fillRect(0, 0, MOON_WORLD.width, MOON_WORLD.horizon)

    const stars = this.add.graphics().setDepth(-950)
    const rng = mulberry32(23)
    const colors = [0x666b7d, 0xa1a8ba, 0xe8edf7]
    for (let index = 0; index < 82; index++) {
      const x = Math.floor(rng() * MOON_WORLD.width)
      const y = Math.floor(8 + rng() * (MOON_WORLD.horizon - 28))
      const rare = rng() > 0.9
      stars.fillStyle(colors[Math.floor(rng() * colors.length)] as number, 0.56 + rng() * 0.38)
      stars.fillRect(x, y, rare ? 2 : 1, rare ? 2 : 1)
      if (rare && rng() > 0.55) {
        stars.fillStyle(0xcfd5e3, 0.28)
        stars.fillRect(x - 1, y, 1, 1).fillRect(x + 2, y + 1, 1, 1)
      }
    }
  }

  private drawRegolith(): void {
    const terrain = this.add.graphics().setDepth(-900)

    // Two hard-edged ridges. Distance changes scale, not sharpness: there is no lunar haze.
    terrain.fillStyle(0x17171b)
    terrain.fillPoints(polygon(
      0, MOON_WORLD.horizon, 0, 190, 72, 184, 130, 165, 188, 190, 282, 176,
      366, MOON_WORLD.horizon,
    ), true)
    terrain.fillPoints(polygon(
      548, MOON_WORLD.horizon, 628, 188, 704, 174, 778, 190, 846, 168, 930, 194,
      960, 188, 960, MOON_WORLD.horizon,
    ), true)

    terrain.fillStyle(0x34312f)
    terrain.fillPoints(polygon(
      0, MOON_WORLD.horizon, 0, 199, 96, 190, 174, 181, 238, 193, 322, 188,
      418, MOON_WORLD.horizon,
    ), true)
    terrain.fillPoints(polygon(
      602, MOON_WORLD.horizon, 684, 194, 752, 185, 820, 196, 902, 184, 960, 196,
      960, MOON_WORLD.horizon,
    ), true)

    // The plain is one field with broad geological facets, not animated horizontal bands.
    terrain.fillStyle(0x56514b).fillRect(
      0,
      MOON_WORLD.horizon,
      MOON_WORLD.width,
      MOON_WORLD.height - MOON_WORLD.horizon,
    )
    terrain.fillStyle(0x47433f)
    terrain.fillPoints(polygon(
      0, MOON_WORLD.horizon, 430, MOON_WORLD.horizon, 304, 300, 0, 348,
    ), true)
    terrain.fillStyle(0x625c55)
    terrain.fillPoints(polygon(250, 540, 420, 278, 960, 232, 960, 540), true)
    terrain.fillStyle(0x4d4944)
    terrain.fillPoints(polygon(0, 430, 270, 368, 558, 402, 476, 540, 0, 540), true)
    terrain.fillStyle(0x6c655c)
    terrain.fillPoints(polygon(598, 540, 710, 358, 960, 334, 960, 540), true)

    const texture = this.add.graphics().setDepth(-850)
    const rng = mulberry32(71)
    const dark = [0x2d2b29, 0x3e3a36, 0x49443f]
    const light = [0x8c8579, 0xaaa294, 0x746e65]
    for (let index = 0; index < 430; index++) {
      const perspective = Math.sqrt(rng())
      const y = Math.floor(MOON_WORLD.horizon + perspective * (MOON_WORLD.height - MOON_WORLD.horizon))
      const x = Math.floor(rng() * MOON_WORLD.width)
      const lit = rng() > 0.67
      const palette = lit ? light : dark
      const width = perspective > 0.76 && rng() > 0.72 ? 2 + Math.floor(rng() * 3) : 1
      texture.fillStyle(palette[Math.floor(rng() * palette.length)] as number, 0.22 + perspective * 0.34)
      texture.fillRect(x, y, width, 1)
    }

    // Raking sunlight catches short ridges and leaves a paired dark pixel down-sun.
    for (let index = 0; index < 32; index++) {
      const x = Math.floor(rng() * MOON_WORLD.width)
      const y = Math.floor(270 + rng() * 250)
      const length = 2 + Math.floor(rng() * 5)
      texture.fillStyle(0xaaa294, 0.46).fillRect(x, y, length, 1)
      texture.fillStyle(0x282725, 0.42).fillRect(x + length, y + 1, length + 2, 1)
    }
  }

  private drawGroundShadow(x: number, y: number, length: number, alpha: number, depth: number): void {
    this.add.graphics().setDepth(depth)
      .fillStyle(0x07080a, alpha)
      .fillPoints(polygon(
        x - 3, y, x + 5, y,
        x + length, y + length * 0.34, x + length * 0.42, y + length * 0.22,
      ), true)
  }

  private createPlayer(): void {
    const clip = this.clip('astro-idle-s')
    this.shadow = this.add.graphics()
      .fillStyle(0x07080a, 0.48)
      .fillPoints(polygon(-7, -2, 8, -1, 68, 22, 30, 18, 5, 7, -4, 4), true)
    this.astronaut = this.add.sprite(0, 0, clip.textureKey, 0)
      .setOrigin(clip.contact.x / clip.cell.w, clip.contact.y / clip.cell.h)
      .setScale(2)
    this.player = this.add.container(480, 382, [this.shadow, this.astronaut]).setSize(42, 24)
    this.physics.add.existing(this.player)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(42, 24)
    body.setCollideWorldBounds(true)
    this.overlay = this.add.graphics().setDepth(2000).setVisible(this.overlays)
    this.playMotion('idle')
  }

  private clip(id: string): CompiledClip {
    const clip = this.clips.get(id)
    if (clip === undefined) throw new Error(`bundle has no clip "${id}"`)
    return clip
  }

  private readFacing(dx: number, dy: number): void {
    if (dx === 0) {
      this.facing = dy < 0 ? 'n' : 's'
      this.mirrored = false
      return
    }
    this.mirrored = dx < 0
    this.facing = dy < 0 ? 'ne' : dy > 0 ? 'se' : 'e'
  }

  private playMotion(motion: 'idle' | 'lope' | 'leap'): void {
    const next = `astro-${motion}-${this.facing}`
    this.astronaut.setFlipX(this.mirrored)
    if (next === this.animation && this.astronaut.anims.isPlaying) return
    this.animation = next
    this.astronaut.play(next, true)
  }

  private startJump(): void {
    this.jumping = true
    this.tweens.add({
      targets: this.astronaut,
      y: -92,
      duration: 1475,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.astronaut.y = 0
        this.jumping = false
      },
    })
    this.tweens.add({
      targets: this.shadow,
      scaleX: 0.44,
      scaleY: 0.44,
      alpha: 0.14,
      duration: 1475,
      ease: 'Quad.easeOut',
      yoyo: true,
    })
  }

  private setWorkspaceMode(mode: WorkspaceMode): void {
    this.mode = mode
    if (mode === 'inspect') {
      const body = this.player.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }
  }

  private setOverlays(value: boolean): void {
    this.overlays = value
    this.overlay.setVisible(value)
  }

  private drawOverlays(): void {
    if (!this.overlays) return
    this.overlay.clear()
    const body = this.player.body as Phaser.Physics.Arcade.Body
    this.overlay.lineStyle(1, 0x5be7ff, 0.9)
    this.overlay.strokeRect(body.x, body.y, body.width, body.height)
    this.overlay.lineBetween(this.player.x - 8, this.player.y, this.player.x + 8, this.player.y)
    this.overlay.lineBetween(this.player.x, this.player.y - 8, this.player.x, this.player.y + 8)
  }
}
