import Phaser from 'phaser'
import type { CompiledBundle } from '../../compiler/types.ts'
import { installBundle } from '../../phaser/installBundle.ts'
import { buildHieroglyphTravelerPose } from '../character/hieroglyphTraveler.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type PrototypeProgress,
  type RuntimeSnapshot,
  type WorkspaceMode,
  type WorkspaceScene,
} from '../types.ts'
import {
  buildEgyptianGuardian,
  type GuardianMood,
} from './egyptianGuardian.ts'

const STAGE_WIDTH = 320
const STAGE_HEIGHT = 180
const VASE_X = 112
const KEY_X = 143

export type GlyphStage = 'puzzle' | 'platform'

type GlyphControls = {
  readonly left: Phaser.Input.Keyboard.Key
  readonly right: Phaser.Input.Keyboard.Key
  readonly cursorLeft: Phaser.Input.Keyboard.Key
  readonly cursorRight: Phaser.Input.Keyboard.Key
  readonly jump: Phaser.Input.Keyboard.Key
  readonly cursorUp: Phaser.Input.Keyboard.Key
  readonly alternateJump: Phaser.Input.Keyboard.Key
  readonly action: Phaser.Input.Keyboard.Key
}

const COLORS = {
  outside: 0x160e08,
  paper: 0xc99e5f,
  paperLight: 0xe0bd7c,
  paperShade: 0xaa7840,
  ink: 0x644123,
  inkFaded: 0x85603a,
  platform: 0x76502b,
  platformTop: 0xe1bd73,
  halo: 0x2a9184,
  gold: 0xe2ae3e,
  lapis: 0x23536b,
  ochre: 0x963f2f,
  danger: 0x5c2921,
  clay: 0x9d4a2f,
  clayLight: 0xc56d43,
  stone: 0x7d694b,
  stoneLight: 0xb39b70,
  overlay: 0x62e0cf,
} as const

const sceneKeyFor = (stage: GlyphStage): WorkspaceScene =>
  stage === 'puzzle' ? 'glyph-puzzle' : 'glyph-platform'

export class GlyphWorldScene extends Phaser.Scene {
  private readonly bundle: CompiledBundle
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private readonly progress: PrototypeProgress
  private readonly stage: GlyphStage
  private readonly workspaceScene: WorkspaceScene
  private mode: WorkspaceMode = 'play'
  private player?: Phaser.GameObjects.Rectangle
  private character?: Phaser.GameObjects.Graphics
  private controls?: GlyphControls
  private overlay?: Phaser.GameObjects.Graphics
  private statusText?: Phaser.GameObjects.Text
  private guardianArt?: Phaser.GameObjects.Graphics
  private goalArt?: Phaser.GameObjects.Graphics
  private goalZone?: Phaser.GameObjects.Rectangle
  private vaseArt?: Phaser.GameObjects.Graphics
  private vaseCollider?: Phaser.GameObjects.Rectangle
  private keyArt?: Phaser.GameObjects.Graphics
  private bossHitbox?: Phaser.GameObjects.Rectangle
  private readonly bossProjectiles = new Set<Phaser.GameObjects.Arc>()
  private readonly platforms: Phaser.GameObjects.Rectangle[] = []
  private walkPhase = 0
  private idlePhase = 0
  private facing: -1 | 1 = 1
  private playerMoving = false
  private vaseBroken = false
  private keyCollected = false
  private bossHealth = 3
  private bossDefeated = false
  private transitioning = false
  private spawnX = 28
  private spawnY = 148
  private lastBossShotAt = -Infinity
  private lastStoneAt = -Infinity
  private lastReportAt = -Infinity

  constructor(
    bundle: CompiledBundle,
    report: (snapshot: RuntimeSnapshot) => void,
    progress: PrototypeProgress,
    stage: GlyphStage,
  ) {
    super(sceneKeyFor(stage))
    this.bundle = bundle
    this.report = report
    this.progress = progress
    this.stage = stage
    this.workspaceScene = sceneKeyFor(stage)
  }

  create(): void {
    this.resetSceneState()
    installBundle(this, this.bundle)
    this.input.enabled = this.mode === 'play'
    this.physics.world.setBounds(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    if (this.mode === 'play') this.physics.world.resume()

    this.drawBackdrop()
    this.guardianArt = this.add.graphics().setDepth(2)
    this.createPlatforms()
    this.drawPlatformTexture()
    this.createPlayer()
    if (this.stage === 'puzzle') this.createPuzzleMechanics()
    else this.createBossMechanics()

    this.controls = this.createControls()
    this.overlay = this.drawOverlay().setVisible(false).setDepth(20)
    this.statusText = this.add.text(STAGE_WIDTH * 0.5, 14, this.initialInstruction(), {
      color: '#3f2a18',
      backgroundColor: '#d9b36e',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '6px',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(18)

    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.releaseWorkspaceEvents, this)

    this.cameras.main.fadeIn(220, 20, 12, 7)
    this.drawGuardian(0)
    this.publishSnapshot()
  }

  override update(time: number, delta: number): void {
    const deltaSeconds = Math.min(delta, 40) / 1000
    this.idlePhase += deltaSeconds
    if (this.mode === 'play' && !this.transitioning) {
      this.updatePlayer(deltaSeconds)
      if (this.stage === 'puzzle') this.updatePuzzle()
      else this.updateBossFight(time)
    }
    this.drawCharacter()
    this.drawGuardian(time)
    this.updateGlyphEffects(time)
    if (time - this.lastReportAt >= 100) this.publishSnapshot()
  }

  private resetSceneState(): void {
    this.platforms.length = 0
    this.bossProjectiles.clear()
    this.player = undefined
    this.character = undefined
    this.controls = undefined
    this.overlay = undefined
    this.statusText = undefined
    this.guardianArt = undefined
    this.goalArt = undefined
    this.goalZone = undefined
    this.vaseArt = undefined
    this.vaseCollider = undefined
    this.keyArt = undefined
    this.bossHitbox = undefined
    this.vaseBroken = false
    this.keyCollected = false
    this.bossHealth = 3
    this.bossDefeated = false
    this.transitioning = false
    this.playerMoving = false
    this.walkPhase = 0
    this.idlePhase = 0
    this.facing = 1
    this.lastBossShotAt = -Infinity
    this.lastStoneAt = -Infinity
    this.lastReportAt = -Infinity
  }

  private initialInstruction(): string {
    return this.stage === 'puzzle'
      ? 'THE GUARDIAN HIDES A WAY OUT'
      : 'GUARDIAN 3 / 3 · E THROWS A STONE'
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.outside)
    graphics.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    graphics.fillStyle(COLORS.paper)
    graphics.fillRect(5, 4, STAGE_WIDTH - 10, STAGE_HEIGHT - 8)
    graphics.fillStyle(COLORS.paperLight, 0.42)
    graphics.fillRect(8, 7, STAGE_WIDTH - 16, 2)
    graphics.fillStyle(COLORS.paperShade, 0.48)
    graphics.fillRect(8, STAGE_HEIGHT - 10, STAGE_WIDTH - 16, 2)

    graphics.lineStyle(1, COLORS.ochre, 0.7)
    graphics.strokeRect(8, 7, STAGE_WIDTH - 16, STAGE_HEIGHT - 14)
    graphics.lineStyle(1, COLORS.ink, 0.25)
    for (let x = 18; x < STAGE_WIDTH - 10; x += 24) {
      graphics.lineBetween(x + 16, 24, x + 16, 156)
      for (let y = 31; y < 151; y += 19) {
        this.drawFadedGlyph(graphics, x, y, Math.floor(x / 24 + y / 19) % 4)
      }
    }

    graphics.fillStyle(COLORS.lapis, 0.82)
    graphics.fillRect(9, 25, STAGE_WIDTH - 18, 5)
    graphics.fillStyle(COLORS.gold, 0.9)
    graphics.fillRect(9, 25, STAGE_WIDTH - 18, 1)
    graphics.fillRect(9, 29, STAGE_WIDTH - 18, 1)
    for (let x = 14; x < STAGE_WIDTH - 12; x += 18) {
      graphics.fillStyle(Math.floor(x / 18) % 2 === 0 ? COLORS.ochre : COLORS.gold, 0.9)
      graphics.fillRect(x, 27, 4, 1)
      graphics.fillRect(x + 6, 27, 2, 1)
    }

    if (this.stage === 'platform') {
      graphics.fillStyle(COLORS.danger, 0.86)
      graphics.fillRect(5, 168, STAGE_WIDTH - 10, 8)
      graphics.fillStyle(COLORS.ochre, 0.8)
      for (let x = 8; x < STAGE_WIDTH - 7; x += 11) graphics.fillRect(x, 168, 6, 1)
    }
  }

  private drawFadedGlyph(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    variant: number,
  ): void {
    const color = variant % 3 === 0 ? COLORS.ochre : COLORS.inkFaded
    graphics.fillStyle(color, 0.34)
    graphics.lineStyle(1, color, 0.36)
    if (variant === 0) {
      graphics.strokeCircle(x + 5, y + 3, 3)
      graphics.fillRect(x + 4, y + 7, 2, 7)
      graphics.fillRect(x + 1, y + 11, 8, 1)
    } else if (variant === 1) {
      graphics.fillRect(x + 1, y, 10, 2)
      graphics.fillRect(x + 5, y + 4, 2, 9)
      graphics.fillRect(x + 2, y + 10, 8, 1)
    } else if (variant === 2) {
      graphics.lineBetween(x + 1, y + 2, x + 10, y + 7)
      graphics.lineBetween(x + 10, y + 7, x + 2, y + 12)
      graphics.fillRect(x + 4, y + 6, 5, 1)
    } else {
      graphics.fillRect(x + 1, y + 1, 3, 3)
      graphics.fillRect(x + 7, y, 4, 5)
      graphics.fillRect(x + 3, y + 8, 7, 2)
      graphics.fillRect(x + 1, y + 13, 11, 1)
    }
  }

  private createPlatforms(): void {
    if (this.stage === 'puzzle') {
      this.createPlatform(160, 172, 320, 16)
      return
    }
    this.createPlatform(29, 172, 58, 16)
    this.createPlatform(86, 146, 44, 8)
    this.createPlatform(145, 117, 42, 8)
    this.createPlatform(205, 144, 48, 8)
    this.createPlatform(261, 112, 50, 8)
    this.createPlatform(303, 82, 34, 8)
  }

  private createPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, COLORS.platform).setDepth(3)
    platform.setStrokeStyle(1, COLORS.platformTop)
    this.physics.add.existing(platform, true)
    this.platforms.push(platform)
  }

  private drawPlatformTexture(): void {
    const graphics = this.add.graphics().setDepth(4)
    for (const platform of this.platforms) {
      const left = Math.round(platform.x - platform.width * 0.5)
      const top = Math.round(platform.y - platform.height * 0.5)
      graphics.fillStyle(COLORS.gold)
      graphics.fillRect(left, top, platform.width, 1)
      graphics.fillStyle(COLORS.lapis, 0.76)
      for (let x = left + 3; x < left + platform.width - 2; x += 9) {
        graphics.fillRect(x, top + 3, 3, 1)
      }
      graphics.fillStyle(COLORS.paperLight, 0.58)
      for (let x = left + 7; x < left + platform.width - 2; x += 17) {
        graphics.fillRect(x, top + 5, 2, 1)
      }
    }
  }

  private createPlayer(): void {
    this.spawnX = this.stage === 'puzzle' ? 34 : 27
    this.spawnY = this.stage === 'puzzle' ? 149 : 148
    const player = this.add.rectangle(this.spawnX, this.spawnY, 9, 26, 0xffffff, 0)
    this.physics.add.existing(player)
    const body = player.body as Phaser.Physics.Arcade.Body
    body.setSize(9, 26)
    body.setGravityY(520)
    body.setMaxVelocity(110, 260)
    body.pushable = false
    body.setCollideWorldBounds(true)
    for (const platform of this.platforms) this.physics.add.collider(player, platform)
    this.player = player
    this.character = this.add.graphics().setDepth(10)
    this.drawCharacter()
  }

  private createPuzzleMechanics(): void {
    const player = this.player
    if (player === undefined) return

    this.vaseArt = this.add.graphics().setDepth(8).setPosition(VASE_X, 164)
    this.drawVase(false)
    const vaseCollider = this.add.rectangle(VASE_X, 151, 19, 26, 0xffffff, 0)
    this.physics.add.existing(vaseCollider, true)
    this.physics.add.collider(player, vaseCollider)
    this.vaseCollider = vaseCollider

    const key = this.add.graphics().setDepth(9).setVisible(false)
    key.lineStyle(3, COLORS.gold, 1)
    key.strokeCircle(0, 0, 5)
    key.lineStyle(2, COLORS.gold, 1)
    key.lineBetween(4, 3, 13, 12)
    key.lineBetween(9, 8, 12, 5)
    key.lineBetween(12, 11, 15, 8)
    this.keyArt = key

    this.createGoal(301, 146)
  }

  private drawVase(broken: boolean): void {
    const graphics = this.vaseArt
    if (graphics === undefined) return
    graphics.clear()
    if (broken) {
      graphics.fillStyle(COLORS.clayLight)
      graphics.beginPath()
      graphics.moveTo(-12, -4)
      graphics.lineTo(-3, -12)
      graphics.lineTo(0, 0)
      graphics.closePath()
      graphics.fillPath()
      graphics.fillStyle(COLORS.clay)
      graphics.beginPath()
      graphics.moveTo(1, 0)
      graphics.lineTo(5, -13)
      graphics.lineTo(13, -3)
      graphics.closePath()
      graphics.fillPath()
      graphics.fillRect(-8, -2, 18, 2)
      return
    }

    graphics.fillStyle(COLORS.clay)
    graphics.beginPath()
    graphics.moveTo(-6, -25)
    graphics.lineTo(6, -25)
    graphics.lineTo(5, -20)
    graphics.lineTo(11, -14)
    graphics.lineTo(9, -3)
    graphics.lineTo(5, 0)
    graphics.lineTo(-5, 0)
    graphics.lineTo(-9, -3)
    graphics.lineTo(-11, -14)
    graphics.lineTo(-5, -20)
    graphics.closePath()
    graphics.fillPath()
    graphics.fillStyle(COLORS.clayLight)
    graphics.fillRect(-7, -27, 14, 3)
    graphics.fillRect(-7, -16, 14, 2)
    graphics.fillStyle(COLORS.gold, 0.82)
    graphics.fillRect(-5, -12, 10, 2)
  }

  private createBossMechanics(): void {
    const player = this.player
    if (player === undefined) return
    const hitbox = this.add.rectangle(279, 72, 52, 84, 0xffffff, 0)
    this.physics.add.existing(hitbox, true)
    this.bossHitbox = hitbox
    this.createGoal(303, 59)
  }

  private createGoal(x: number, y: number): void {
    const player = this.player
    if (player === undefined) return
    const art = this.add.graphics().setDepth(8).setPosition(x, y).setVisible(false)
    art.fillStyle(COLORS.halo, 0.16)
    art.fillCircle(0, 0, 15)
    art.lineStyle(2, COLORS.halo, 0.86)
    art.strokeCircle(0, 0, 10)
    art.lineStyle(1, COLORS.gold, 0.94)
    art.strokeCircle(0, 0, 6)
    art.fillStyle(COLORS.gold, 0.92)
    art.fillRect(-1, -7, 2, 14)
    art.fillRect(-5, -1, 10, 2)
    this.goalArt = art

    const goal = this.add.rectangle(x, y, 18, 34, 0xffffff, 0)
    this.physics.add.existing(goal, true)
    const body = goal.body as Phaser.Physics.Arcade.StaticBody
    body.enable = false
    this.physics.add.overlap(player, goal, () => this.completeStage())
    this.goalZone = goal
  }

  private activateGoal(): void {
    this.goalArt?.setVisible(true)
    const body = this.goalZone?.body as Phaser.Physics.Arcade.StaticBody | undefined
    if (body !== undefined) body.enable = true
  }

  private createControls(): GlyphControls | undefined {
    const keyboard = this.input.keyboard
    if (keyboard === null) return undefined
    return {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursorLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      cursorRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      cursorUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      alternateJump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      action: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    }
  }

  private updatePlayer(deltaSeconds: number): void {
    const player = this.player
    const controls = this.controls
    if (player === undefined || controls === undefined) {
      this.playerMoving = false
      return
    }
    const body = player.body as Phaser.Physics.Arcade.Body
    const direction = Number(controls.right.isDown || controls.cursorRight.isDown)
      - Number(controls.left.isDown || controls.cursorLeft.isDown)
    this.playerMoving = direction !== 0
    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1
      this.walkPhase += deltaSeconds * 9
    }
    body.setVelocityX(direction * 86)

    const jumpPressed = Phaser.Input.Keyboard.JustDown(controls.jump)
      || Phaser.Input.Keyboard.JustDown(controls.cursorUp)
      || Phaser.Input.Keyboard.JustDown(controls.alternateJump)
    if (jumpPressed && body.blocked.down) body.setVelocityY(-205)
  }

  private updatePuzzle(): void {
    const player = this.player
    const controls = this.controls
    if (player === undefined || controls === undefined) return

    if (!this.vaseBroken) {
      const nearVase = Math.abs(player.x - VASE_X) <= 24 && player.y >= 132
      this.statusText?.setText(nearVase ? 'E  BREAK THE CLAY VESSEL' : this.initialInstruction())
      if (nearVase && Phaser.Input.Keyboard.JustDown(controls.action)) this.breakVase()
      return
    }

    if (!this.keyCollected) {
      this.statusText?.setText('THE GOLDEN KEY IS EXPOSED')
      if (Math.abs(player.x - KEY_X) <= 12 && Math.abs(player.y - 149) <= 22) {
        this.collectKey()
      }
    }
  }

  private breakVase(): void {
    if (this.vaseBroken) return
    this.vaseBroken = true
    const body = this.vaseCollider?.body as Phaser.Physics.Arcade.StaticBody | undefined
    if (body !== undefined) body.enable = false
    this.drawVase(true)
    this.keyArt?.setVisible(true)
    this.statusText?.setText('THE GUARDIAN AWAKENS')
    this.cameras.main.shake(180, 0.006)
  }

  private collectKey(): void {
    if (this.keyCollected) return
    this.keyCollected = true
    this.keyArt?.setVisible(false)
    this.activateGoal()
    this.statusText?.setText('KEY CLAIMED · ENTER THE RETURN MARK')
    this.cameras.main.flash(120, 226, 174, 62)
  }

  private updateBossFight(time: number): void {
    if ((this.player?.y ?? 0) > 160) this.resetPlayer()
    if (this.bossDefeated) return

    const controls = this.controls
    if (controls !== undefined
      && Phaser.Input.Keyboard.JustDown(controls.action)
      && time - this.lastStoneAt >= 360) {
      this.throwStone(time)
    }
    if (time - this.lastBossShotAt >= 1450) this.fireBossProjectile(time)
  }

  private throwStone(time: number): void {
    const player = this.player
    const boss = this.bossHitbox
    if (player === undefined || boss === undefined || this.bossDefeated) return
    this.lastStoneAt = time
    const stone = this.add.circle(
      player.x + this.facing * 9,
      player.y - 7,
      3,
      COLORS.stone,
    ).setStrokeStyle(1, COLORS.stoneLight).setDepth(12)
    this.physics.add.existing(stone)
    const body = stone.body as Phaser.Physics.Arcade.Body
    body.setCircle(3)
    body.setGravityY(260)
    body.setVelocity(this.facing * 155, -84)
    this.physics.add.overlap(stone, boss, () => this.hitBoss(stone))
    this.time.delayedCall(1900, () => {
      if (stone.active) stone.destroy()
    })
  }

  private hitBoss(stone: Phaser.GameObjects.Arc): void {
    if (!stone.active || this.bossDefeated) return
    stone.destroy()
    this.bossHealth = Math.max(0, this.bossHealth - 1)
    this.cameras.main.shake(110, 0.005)
    this.cameras.main.flash(70, 219, 70, 46)
    if (this.bossHealth > 0) {
      this.statusText?.setText(`GUARDIAN ${this.bossHealth} / 3 · E THROWS A STONE`)
      return
    }

    this.bossDefeated = true
    const body = this.bossHitbox?.body as Phaser.Physics.Arcade.StaticBody | undefined
    if (body !== undefined) body.enable = false
    for (const projectile of this.bossProjectiles) projectile.destroy()
    this.bossProjectiles.clear()
    this.activateGoal()
    this.statusText?.setText('THE GUARDIAN FALLS · ENTER THE MARK')
  }

  private fireBossProjectile(time: number): void {
    const player = this.player
    if (player === undefined || this.bossDefeated) return
    this.lastBossShotAt = time
    const originX = 256
    const originY = 72
    const deltaX = player.x - originX
    const deltaY = player.y - originY
    const length = Math.hypot(deltaX, deltaY) || 1
    const projectile = this.add.circle(originX, originY, 4, COLORS.danger)
      .setStrokeStyle(1, COLORS.gold)
      .setDepth(11)
    this.physics.add.existing(projectile)
    const body = projectile.body as Phaser.Physics.Arcade.Body
    body.setCircle(4)
    body.setVelocity((deltaX / length) * 82, (deltaY / length) * 82)
    this.bossProjectiles.add(projectile)
    this.physics.add.overlap(projectile, player, () => {
      if (!projectile.active) return
      this.bossProjectiles.delete(projectile)
      projectile.destroy()
      this.resetPlayer()
    })
    this.time.delayedCall(3200, () => {
      if (!projectile.active) return
      this.bossProjectiles.delete(projectile)
      projectile.destroy()
    })
  }

  private resetPlayer(): void {
    const player = this.player
    if (player === undefined || this.transitioning) return
    for (const projectile of this.bossProjectiles) projectile.destroy()
    this.bossProjectiles.clear()
    this.lastBossShotAt = this.time.now
    const body = player.body as Phaser.Physics.Arcade.Body
    body.reset(this.spawnX, this.spawnY)
    body.setVelocity(0, 0)
    this.playerMoving = false
    this.cameras.main.shake(90, 0.004)
  }

  private completeStage(): void {
    const objectiveComplete = this.stage === 'puzzle' ? this.keyCollected : this.bossDefeated
    if (this.transitioning || !objectiveComplete) return
    if (this.stage === 'puzzle') this.progress.puzzleComplete = true
    this.transitioning = true
    this.playerMoving = false
    this.input.enabled = false
    this.physics.world.pause()
    this.statusText?.setText('THE GLYPH RELEASES YOU')
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('depth-study')
    })
    this.cameras.main.fadeOut(260, 20, 12, 7)
  }

  private drawCharacter(): void {
    const player = this.player
    const graphics = this.character
    if (player === undefined || graphics === undefined) return
    const body = player.body as Phaser.Physics.Arcade.Body
    const pose = buildHieroglyphTravelerPose({
      walkPhase: this.walkPhase,
      idlePhase: this.idlePhase,
      moving: this.playerMoving,
      airborne: !body.blocked.down,
      facing: this.facing,
    })
    const scale = 15
    graphics.clear()
    graphics.setPosition(Math.round(player.x), Math.round(player.y + body.height * 0.5))
    for (const part of pose) {
      const first = part.points[0]
      if (first === undefined) continue
      graphics.fillStyle(part.color)
      graphics.beginPath()
      graphics.moveTo(Math.round(first.x * scale), Math.round(-first.y * scale))
      for (let index = 1; index < part.points.length; index += 1) {
        const point = part.points[index]
        if (point) graphics.lineTo(Math.round(point.x * scale), Math.round(-point.y * scale))
      }
      graphics.closePath()
      graphics.fillPath()
    }
  }

  private drawGuardian(time: number): void {
    const graphics = this.guardianArt
    if (graphics === undefined) return
    const anchorX = this.stage === 'puzzle' ? 248 : 286
    const anchorY = this.stage === 'puzzle' ? 115 : 108
    const scale = this.stage === 'puzzle' ? 0.95 : 0.78
    const playerX = this.player?.x ?? 0
    const gaze = Phaser.Math.Clamp((playerX - anchorX) / 100, -1, 1)
    const mood: GuardianMood = this.stage === 'puzzle'
      ? this.vaseBroken ? 'enraged' : 'watching'
      : this.bossDefeated ? 'defeated' : 'enraged'
    const angryShake = mood === 'enraged' ? Math.round(Math.sin(time * 0.024)) : 0

    graphics.clear()
    graphics.setPosition(anchorX + angryShake, anchorY)
    graphics.setScale(scale)
    graphics.setAngle(mood === 'defeated' ? 4 : 0)
    graphics.setAlpha(mood === 'defeated' ? 0.62 : 1)
    for (const part of buildEgyptianGuardian(mood, gaze)) {
      const first = part.points[0]
      if (first === undefined) continue
      graphics.fillStyle(part.color, part.alpha ?? 1)
      graphics.beginPath()
      graphics.moveTo(Math.round(first.x), Math.round(first.y))
      for (let index = 1; index < part.points.length; index += 1) {
        const point = part.points[index]
        if (point) graphics.lineTo(Math.round(point.x), Math.round(point.y))
      }
      graphics.closePath()
      graphics.fillPath()
    }
  }

  private updateGlyphEffects(time: number): void {
    this.goalArt?.setAlpha(0.72 + (Math.sin(time * 0.006) + 1) * 0.13)
    if (this.keyArt?.visible) {
      this.keyArt.setPosition(KEY_X, 146 + Math.round(Math.sin(time * 0.008) * 2))
    }
  }

  private drawOverlay(): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, COLORS.overlay, 0.7)
    graphics.strokeRect(1, 1, STAGE_WIDTH - 2, STAGE_HEIGHT - 2)
    for (const platform of this.platforms) {
      graphics.strokeRect(
        platform.x - platform.width * 0.5,
        platform.y - platform.height * 0.5,
        platform.width,
        platform.height,
      )
    }
    if (this.stage === 'puzzle') graphics.strokeRect(VASE_X - 10, 138, 20, 26)
    else graphics.strokeRect(253, 30, 52, 84)
    return graphics
  }

  private readonly setWorkspaceMode = (mode: WorkspaceMode): void => {
    this.mode = mode
    if (mode === 'inspect') this.playerMoving = false
    this.input.enabled = mode === 'play' && !this.transitioning
    if (mode === 'play' && !this.transitioning) this.physics.world.resume()
    else this.physics.world.pause()
    this.publishSnapshot()
  }

  private readonly setOverlayVisibility = (visible: boolean): void => {
    this.overlay?.setVisible(visible)
  }

  private publishSnapshot(): void {
    const player = this.player
    this.lastReportAt = this.time.now
    this.report({
      scene: this.workspaceScene,
      mode: this.mode,
      playerX: Number((player?.x ?? 0).toFixed(2)),
      playerY: Number((player?.y ?? 0).toFixed(2)),
      playerDepth: 0,
      interaction: null,
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private readonly releaseWorkspaceEvents = (): void => {
    this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
  }
}
