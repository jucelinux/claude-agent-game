import Phaser from 'phaser'
import type { CompiledBundle, CompiledClip } from '../../compiler/types.ts'
import { installBundle } from '../../phaser/installBundle.ts'
import {
  WASTELAND_TRAVELER_DIRECTIONS,
  type WastelandTravelerDirection,
} from '../character/wastelandTraveler.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'
import {
  containsWastelandPoint,
  getWastelandFootprintRelation,
  isWastelandGroundCenterVisible,
  isWastelandWalkable,
  sliceWastelandRectForPainter,
  wastelandScreenInputToWorldDelta,
  WASTELAND_BRIDGE_RAILS,
  WASTELAND_BRIDGES,
  WASTELAND_BUILDINGS,
  WASTELAND_CONTAINERS,
  WASTELAND_GROUND_RENDER_WINDOW,
  WASTELAND_MAP_BOUNDS,
  WASTELAND_OVERPASS_PILLARS,
  WASTELAND_TOWER_BASE,
  WASTELAND_TILE_HALF_HEIGHT,
  WASTELAND_TILE_HALF_WIDTH,
  type WastelandRect,
} from './wastelandMap.ts'

export const WASTELAND_STAGE_WIDTH = 320
export const WASTELAND_STAGE_HEIGHT = 180
export { WASTELAND_MAP_BOUNDS } from './wastelandMap.ts'

const TILE_HALF_WIDTH = WASTELAND_TILE_HALF_WIDTH
const TILE_HALF_HEIGHT = WASTELAND_TILE_HALF_HEIGHT
const HEIGHT_SCALE = 9
const ORIGIN_X = 160
const ORIGIN_Y = 103

type IsoPoint = {
  readonly x: number
  readonly y: number
}

type BoxColors = {
  readonly top: number
  readonly right: number
  readonly left: number
}

type Rect = WastelandRect

type Building = Rect & {
  readonly height: number
  readonly colors: BoxColors
  readonly rows: number
  readonly columns: number
}

type WorldLabel = {
  readonly label: string
  readonly x: number
  readonly y: number
  readonly z: number
}

type LabelObject = {
  readonly definition: WorldLabel
  readonly text: Phaser.GameObjects.Text
}

type RenderCommand = {
  readonly depth: number
  readonly footprint?: Rect
  readonly draw: (graphics: Phaser.GameObjects.Graphics) => void
}

type WastelandControls = {
  readonly up: Phaser.Input.Keyboard.Key
  readonly down: Phaser.Input.Keyboard.Key
  readonly left: Phaser.Input.Keyboard.Key
  readonly right: Phaser.Input.Keyboard.Key
  readonly cursorUp: Phaser.Input.Keyboard.Key
  readonly cursorDown: Phaser.Input.Keyboard.Key
  readonly cursorLeft: Phaser.Input.Keyboard.Key
  readonly cursorRight: Phaser.Input.Keyboard.Key
}

const COLORS = {
  sky: 0x0b1015,
  horizon: 0x15191b,
  ash: 0x222525,
  distant: 0x10161a,
  distantLight: 0x192025,
  dust: 0x554d41,
  dustLight: 0x5b5245,
  dustDark: 0x4e473d,
  asphalt: 0x373a38,
  asphaltLight: 0x3c3f3c,
  concreteTop: 0x4a4b46,
  concreteRight: 0x292c2c,
  concreteLeft: 0x343636,
  concreteDark: 0x202324,
  rustTop: 0x744934,
  rustRight: 0x3d2b25,
  rustLeft: 0x543427,
  canal: 0x332c27,
  canalLight: 0x3a312b,
  shadow: 0x080b0e,
  cyan: 0x61d7cf,
  amber: 0xe0a34b,
  warning: 0xb45d3e,
  pale: 0xc8c2ad,
  overlay: 0x6ee7db,
} as const

const CONCRETE: BoxColors = {
  top: COLORS.concreteTop,
  right: COLORS.concreteRight,
  left: COLORS.concreteLeft,
}

const DARK_CONCRETE: BoxColors = {
  top: 0x363a39,
  right: 0x1d2122,
  left: 0x282b2b,
}

const RUST: BoxColors = {
  top: COLORS.rustTop,
  right: COLORS.rustRight,
  left: COLORS.rustLeft,
}

const BUILDINGS: readonly Building[] = WASTELAND_BUILDINGS.map(({ palette, ...building }) => ({
  ...building,
  colors: palette === 'dark' ? DARK_CONCRETE : palette === 'rust' ? RUST : CONCRETE,
}))

const CONTAINERS: readonly (Rect & { readonly colors: BoxColors })[] = WASTELAND_CONTAINERS.map(
  ({ palette, ...container }) => ({
    ...container,
    colors: palette === 'dark' ? DARK_CONCRETE : RUST,
  }),
)

const OVERPASS_PILLARS = WASTELAND_OVERPASS_PILLARS
const BRIDGES = WASTELAND_BRIDGES
const BRIDGE_RAILS = WASTELAND_BRIDGE_RAILS
const TOWER_BASE = WASTELAND_TOWER_BASE

const STATIC_SOLIDS: readonly Rect[] = [
  ...BUILDINGS,
  ...CONTAINERS,
  ...OVERPASS_PILLARS,
  TOWER_BASE,
  { x: 27, y: 18, width: 6.4, depth: 2.5 },
] as const

const LANDMARKS: readonly WorldLabel[] = [
  { label: 'NORTH RUINS', x: 10, y: 8, z: 7 },
  { label: 'BROKEN OVERPASS', x: 30, y: 19, z: 3.5 },
  { label: 'RELAY TOWER', x: 41, y: 25.8, z: 7.7 },
  { label: 'CENTRAL PLAZA', x: 39, y: 34, z: 1.2 },
  { label: 'DRY CANAL', x: 28, y: 47, z: 0.2 },
  { label: 'SOUTH SHELLS', x: 49, y: 55, z: 6.4 },
] as const

const modulo = (value: number, divisor: number): number => ((value % divisor) + divisor) % divisor

const hashCell = (x: number, y: number): number => {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

const containsWithMargin = containsWastelandPoint

export class WastelandMapScene extends Phaser.Scene {
  private readonly bundle: CompiledBundle
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private mode: WorkspaceMode = 'play'
  private world?: Phaser.GameObjects.Graphics
  private foreground?: Phaser.GameObjects.Graphics
  private character?: Phaser.GameObjects.Sprite
  private overlay?: Phaser.GameObjects.Graphics
  private statusText?: Phaser.GameObjects.Text
  private controls?: WastelandControls
  private readonly landmarkLabels: LabelObject[] = []
  private playerX = 37
  private playerY = 38
  private cameraX = 37
  private cameraY = 38
  private characterDirection: WastelandTravelerDirection = 's'
  private moving = false
  private lastReportAt = -Infinity

  constructor(bundle: CompiledBundle, report: (snapshot: RuntimeSnapshot) => void) {
    super('wasteland-map')
    this.bundle = bundle
    this.report = report
  }

  create(): void {
    installBundle(this, this.bundle)
    this.world = this.add.graphics().setDepth(0)
    this.character = this.createCharacterSprite()
    this.foreground = this.add.graphics().setDepth(12)
    this.overlay = this.add.graphics().setDepth(20).setVisible(false)
    this.statusText = this.add.text(9, 9, '', {
      color: '#9aa79f',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '6px',
      letterSpacing: 1,
    }).setDepth(22)
    this.controls = this.createControls()
    this.createLandmarkLabels()
    this.updateStatus()

    this.input.enabled = this.mode === 'play'
    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.releaseWorkspaceEvents, this)

    this.cameras.main.fadeIn(260, 8, 12, 15)
    this.drawFrame(0)
    this.publishSnapshot()
  }

  override update(time: number, delta: number): void {
    if (this.mode === 'play') this.updatePlayer(Math.min(delta, 40) / 1000)
    this.updateCamera(delta)
    this.updateStatus()
    this.drawFrame(time)
    if (time - this.lastReportAt >= 100) this.publishSnapshot()
  }

  private createControls(): WastelandControls | undefined {
    const keyboard = this.input.keyboard
    if (keyboard === null) return undefined
    return {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursorUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      cursorDown: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      cursorLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      cursorRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    }
  }

  private updatePlayer(deltaSeconds: number): void {
    const controls = this.controls
    if (controls === undefined) return
    const screenX = Number(controls.right.isDown || controls.cursorRight.isDown)
      - Number(controls.left.isDown || controls.cursorLeft.isDown)
    const screenY = Number(controls.down.isDown || controls.cursorDown.isDown)
      - Number(controls.up.isDown || controls.cursorUp.isDown)
    const inputLength = Math.hypot(screenX, screenY)
    this.moving = inputLength > 0
    if (!this.moving) return

    const normalizedX = screenX / inputLength
    const normalizedY = screenY / inputLength
    const worldDelta = wastelandScreenInputToWorldDelta(normalizedX, normalizedY, deltaSeconds)
    const previousX = this.playerX
    const previousY = this.playerY
    const nextX = this.playerX + worldDelta.x
    const nextY = this.playerY + worldDelta.y

    if (isWastelandWalkable(nextX, this.playerY)) this.playerX = nextX
    if (isWastelandWalkable(this.playerX, nextY)) this.playerY = nextY

    this.characterDirection = this.directionFromScreenVector(normalizedX, normalizedY)
    this.moving = Math.hypot(this.playerX - previousX, this.playerY - previousY) > 0.0001
  }

  private updateCamera(delta: number): void {
    const follow = 1 - Math.exp(-delta * 0.0055)
    const targetX = Phaser.Math.Clamp(this.playerX, 8, WASTELAND_MAP_BOUNDS.width - 8)
    const targetY = Phaser.Math.Clamp(this.playerY, 8, WASTELAND_MAP_BOUNDS.depth - 8)
    this.cameraX = Phaser.Math.Linear(this.cameraX, targetX, follow)
    this.cameraY = Phaser.Math.Linear(this.cameraY, targetY, follow)
  }

  private updateStatus(): void {
    this.statusText?.setText(
      `ASHFALL // ${this.playerX.toFixed(1).padStart(4, '0')}:${this.playerY.toFixed(1).padStart(4, '0')}`,
    )
  }

  private project(x: number, y: number, z = 0): IsoPoint {
    const relativeX = x - this.cameraX
    const relativeY = y - this.cameraY
    return {
      x: ORIGIN_X + (relativeX - relativeY) * TILE_HALF_WIDTH,
      y: ORIGIN_Y + (relativeX + relativeY) * TILE_HALF_HEIGHT - z * HEIGHT_SCALE,
    }
  }

  private drawFrame(time: number): void {
    const graphics = this.world
    if (graphics === undefined) return
    graphics.clear()
    this.drawAtmosphere(graphics, time)
    this.drawVisibleGround(graphics)
    this.drawSortedWorld(graphics, time)
    this.drawDust(graphics, time)
    this.updateCharacterSprite()
    this.updateLandmarkLabels()
    this.drawDebugOverlay()
  }

  private drawAtmosphere(graphics: Phaser.GameObjects.Graphics, time: number): void {
    graphics.fillStyle(COLORS.sky)
    graphics.fillRect(0, 0, WASTELAND_STAGE_WIDTH, WASTELAND_STAGE_HEIGHT)
    graphics.fillStyle(COLORS.horizon)
    graphics.fillRect(0, 27, WASTELAND_STAGE_WIDTH, 57)
    graphics.fillStyle(COLORS.ash, 0.46)
    graphics.fillRect(0, 66, WASTELAND_STAGE_WIDTH, 38)
    const haze = 0.07 + (Math.sin(time * 0.0007) + 1) * 0.025
    graphics.fillStyle(COLORS.warning, haze)
    graphics.fillRect(0, 51, WASTELAND_STAGE_WIDTH, 23)
    graphics.fillStyle(COLORS.shadow, 0.34)
    graphics.fillRect(0, 101, WASTELAND_STAGE_WIDTH, 79)
  }

  private drawVisibleGround(graphics: Phaser.GameObjects.Graphics): void {
    // The visual ground extends beyond the collision map. Camera clamping keeps the
    // playable district finite, while this larger plane guarantees that its edges and
    // a screen-space fallback never appear during camera interpolation.
    const minX = Math.floor(this.cameraX - WASTELAND_GROUND_RENDER_WINDOW.radius)
    const maxX = Math.ceil(this.cameraX + WASTELAND_GROUND_RENDER_WINDOW.radius)
    const minY = Math.floor(this.cameraY - WASTELAND_GROUND_RENDER_WINDOW.radius)
    const maxY = Math.ceil(this.cameraY + WASTELAND_GROUND_RENDER_WINDOW.radius)

    for (let depth = minX + minY; depth <= maxX + maxY; depth += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const y = depth - x
        if (y < minY || y > maxY) continue
        const center = this.project(x + 0.5, y + 0.5)
        if (!isWastelandGroundCenterVisible(center.x, center.y)) continue
        this.drawGroundTile(graphics, x, y)
      }
    }
  }

  private drawGroundTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const hash = hashCell(x, y)
    const patchHash = hashCell(Math.floor(x / 3), Math.floor(y / 3))
    const isCanal = y >= 45 && y <= 48
    const isArterial = (x >= 31 && x <= 36) || (y >= 29 && y <= 34)
    const isOverpassRoad = y >= 17 && y <= 21
    const isPlaza = x >= 37 && x <= 47 && y >= 26 && y <= 37
    const z = isCanal ? -0.58 : 0
    const color = isCanal
      ? patchHash % 4 === 0 ? COLORS.canalLight : COLORS.canal
      : isPlaza
        ? patchHash % 5 === 0 ? 0x4b4c46 : 0x464741
        : isArterial || isOverpassRoad
          ? patchHash % 5 === 0 ? COLORS.asphaltLight : COLORS.asphalt
          : patchHash % 7 === 0
            ? COLORS.dustDark
            : patchHash % 3 === 0 ? COLORS.dustLight : COLORS.dust

    this.fillPolygon(graphics, [
      this.project(x, y, z),
      this.project(x + 1.02, y, z),
      this.project(x + 1.02, y + 1.02, z),
      this.project(x, y + 1.02, z),
    ], color)

    if (!isCanal && hash % 17 === 0) {
      const start = this.project(x + 0.17, y + 0.29, 0.015)
      const middle = this.project(x + 0.52, y + 0.42, 0.015)
      const end = this.project(x + 0.76, y + 0.75, 0.015)
      graphics.lineStyle(1, COLORS.shadow, 0.32)
      graphics.beginPath()
      graphics.moveTo(Math.round(start.x), Math.round(start.y))
      graphics.lineTo(Math.round(middle.x), Math.round(middle.y))
      graphics.lineTo(Math.round(end.x), Math.round(end.y))
      graphics.strokePath()
    }
  }

  private drawSortedWorld(graphics: Phaser.GameObjects.Graphics, time: number): void {
    const commands: RenderCommand[] = []
    const foreground = this.foreground
    foreground?.clear()
    this.drawVisiblePlatforms(graphics)

    for (const building of BUILDINGS) {
      if (!this.isWorldRectVisible(building, building.height)) continue
      commands.push({
        depth: building.x + building.y + building.width + building.depth,
        footprint: building,
        draw: (target) => this.drawBuilding(target, building),
      })
    }

    for (const container of CONTAINERS) {
      if (!this.isWorldRectVisible(container, 1.2)) continue
      commands.push({
        depth: container.x + container.y + container.width + container.depth,
        footprint: container,
        draw: (target) => this.drawContainer(target, container),
      })
    }

    this.queueOverpass(commands)
    this.queueCanal(commands)

    if (this.isWorldRectVisible(TOWER_BASE, 7.5)) {
      commands.push({
        depth: TOWER_BASE.x + TOWER_BASE.y + TOWER_BASE.width + TOWER_BASE.depth,
        footprint: TOWER_BASE,
        draw: (target) => this.drawRelayTower(target, time),
      })
    }

    this.queueProceduralDebris(commands)

    commands.sort((left, right) => left.depth - right.depth)
    const characterDepth = this.playerX + this.playerY + 0.7
    for (const command of commands) {
      const objectInFront = command.footprint === undefined
        ? command.depth > characterDepth
        : this.isFootprintInFrontOfCharacter(command.footprint, command.depth, characterDepth)
      const target = objectInFront && foreground !== undefined ? foreground : graphics
      command.draw(target)
    }
    this.drawCharacterShadow(graphics)
  }

  private drawVisiblePlatforms(graphics: Phaser.GameObjects.Graphics): void {
    const plaza = { x: 37.2, y: 26.2, width: 10.4, depth: 10.4 }
    if (this.isWorldRectVisible(plaza, 0.3)) {
      this.drawBox(graphics, plaza.x, plaza.y, 0, plaza.width, plaza.depth, 0.14, CONCRETE)
    }
    for (const bridge of BRIDGES) {
      if (this.isWorldRectVisible(bridge, 0.8)) {
        this.drawBox(graphics, bridge.x, bridge.y, 0.03, bridge.width, bridge.depth, 0.3, CONCRETE)
      }
    }
  }

  private queueOverpass(
    commands: RenderCommand[],
  ): void {
    for (const pillar of OVERPASS_PILLARS) {
      if (!this.isWorldRectVisible(pillar, 2.5)) continue
      commands.push({
        depth: pillar.x + pillar.y + pillar.width + pillar.depth,
        footprint: pillar,
        draw: (target) => this.drawBox(target, pillar.x, pillar.y, 0, pillar.width, pillar.depth, 2.25, DARK_CONCRETE),
      })
    }

    const chunks: Rect[] = []
    for (let x = 0; x < 27; x += 3) chunks.push({ x, y: 17.9, width: Math.min(3, 27 - x), depth: 1.7 })
    for (let x = 33; x < WASTELAND_MAP_BOUNDS.width; x += 3) {
      chunks.push({ x, y: 17.9, width: Math.min(3, WASTELAND_MAP_BOUNDS.width - x), depth: 1.7 })
    }

    for (const chunk of chunks) {
      if (!this.isWorldRectVisible(chunk, 2.6)) continue
      commands.push({
        depth: chunk.x + chunk.y + chunk.width + chunk.depth,
        draw: (target) => {
          this.drawBox(target, chunk.x, chunk.y, 2.18, chunk.width, chunk.depth, 0.34, CONCRETE)
          this.drawBox(target, chunk.x, chunk.y + 0.28, 2.52, chunk.width, 1.05, 0.05, {
            top: COLORS.asphalt,
            right: COLORS.asphalt,
            left: COLORS.asphalt,
          })
        },
      })
    }

    const collapse = { x: 27, y: 18, width: 6.4, depth: 2.5 }
    if (this.isWorldRectVisible(collapse, 2.8)) {
      commands.push({
        depth: collapse.x + collapse.y + collapse.width + collapse.depth,
        footprint: collapse,
        draw: (target) => this.drawCollapsedSpan(target),
      })
    }
  }

  private drawCollapsedSpan(graphics: Phaser.GameObjects.Graphics): void {
    const left = this.project(27, 18.1, 2.52)
    const low = this.project(30.3, 19.2, 0.3)
    const right = this.project(33.3, 18.1, 2.52)
    graphics.lineStyle(3, COLORS.concreteDark, 0.98)
    graphics.beginPath()
    graphics.moveTo(Math.round(left.x), Math.round(left.y))
    graphics.lineTo(Math.round(low.x), Math.round(low.y))
    graphics.lineTo(Math.round(right.x), Math.round(right.y))
    graphics.strokePath()
    this.drawBox(graphics, 29.2, 18.7, 0, 2.2, 1.1, 0.35, CONCRETE)
  }

  private queueCanal(
    commands: RenderCommand[],
  ): void {
    for (const wallY of [44.4, 48.65]) {
      for (let x = 0; x < WASTELAND_MAP_BOUNDS.width; x += 3) {
        const width = Math.min(3, WASTELAND_MAP_BOUNDS.width - x)
        const wall = { x, y: wallY, width, depth: 0.42 }
        const intersectsBridge = BRIDGES.some((bridge) =>
          x < bridge.x + bridge.width && x + width > bridge.x,
        )
        if (!intersectsBridge && this.isWorldRectVisible(wall, 0.7)) {
          commands.push({
            depth: wall.x + wall.y + wall.width + wall.depth,
            draw: (target) => this.drawBox(
              target,
              wall.x,
              wall.y,
              wallY > 46 ? -0.58 : 0,
              wall.width,
              wall.depth,
              wallY > 46 ? 0.58 : 0.48,
              DARK_CONCRETE,
            ),
          })
        }
      }
    }

    for (const rail of BRIDGE_RAILS) {
      if (!this.isWorldRectVisible(rail, 0.8)) continue
      const slices = sliceWastelandRectForPainter(rail)
      for (const [index, slice] of slices.entries()) {
        commands.push({
          depth: slice.x + slice.y + slice.width + slice.depth,
          footprint: slice,
          draw: (target) => this.drawBridgeRailSlice(target, slice, index === slices.length - 1),
        })
      }
    }
  }

  private drawBridgeRailSlice(
    graphics: Phaser.GameObjects.Graphics,
    slice: Rect,
    closesFarEnd: boolean,
  ): void {
    const z = 0.33
    const height = 0.3
    const baseX = this.project(slice.x + slice.width, slice.y, z)
    const baseXY = this.project(slice.x + slice.width, slice.y + slice.depth, z)
    const top = this.project(slice.x, slice.y, z + height)
    const topX = this.project(slice.x + slice.width, slice.y, z + height)
    const topXY = this.project(slice.x + slice.width, slice.y + slice.depth, z + height)
    const topY = this.project(slice.x, slice.y + slice.depth, z + height)

    this.fillPolygon(graphics, [baseX, baseXY, topXY, topX], RUST.right)
    if (closesFarEnd) {
      const baseY = this.project(slice.x, slice.y + slice.depth, z)
      this.fillPolygon(graphics, [baseXY, baseY, topY, topXY], RUST.left)
    }
    this.fillPolygon(graphics, [top, topX, topXY, topY], RUST.top)
  }

  private queueProceduralDebris(
    commands: RenderCommand[],
  ): void {
    const minX = Math.max(1, Math.floor(this.cameraX - 18))
    const maxX = Math.min(WASTELAND_MAP_BOUNDS.width - 2, Math.ceil(this.cameraX + 18))
    const minY = Math.max(1, Math.floor(this.cameraY - 18))
    const maxY = Math.min(WASTELAND_MAP_BOUNDS.depth - 2, Math.ceil(this.cameraY + 18))

    for (let cellX = Math.floor(minX / 4); cellX <= Math.ceil(maxX / 4); cellX += 1) {
      for (let cellY = Math.floor(minY / 4); cellY <= Math.ceil(maxY / 4); cellY += 1) {
        const hash = hashCell(cellX, cellY)
        if (hash % 3 !== 0) continue
        const x = cellX * 4 + 0.7 + (hash & 0xff) / 255 * 2.2
        const y = cellY * 4 + 0.7 + ((hash >>> 8) & 0xff) / 255 * 2.2
        if (y >= 44 && y <= 49) continue
        if (x >= 30 && x <= 37) continue
        if (y >= 28 && y <= 35) continue
        if (STATIC_SOLIDS.some((rect) => containsWithMargin(rect, x, y, 0.7))) continue
        const rect = { x, y, width: 0.25 + ((hash >>> 16) & 3) * 0.12, depth: 0.24 + ((hash >>> 18) & 3) * 0.1 }
        commands.push({
          depth: rect.x + rect.y + rect.width + rect.depth,
          draw: (target) => this.drawBox(
            target,
            rect.x,
            rect.y,
            0,
            rect.width,
            rect.depth,
            0.18 + ((hash >>> 20) & 3) * 0.1,
            hash % 2 === 0 ? CONCRETE : RUST,
          ),
        })
      }
    }
  }

  private drawBuilding(graphics: Phaser.GameObjects.Graphics, building: Building): void {
    this.drawBox(
      graphics,
      building.x,
      building.y,
      0,
      building.width,
      building.depth,
      building.height,
      building.colors,
    )
    this.drawBox(
      graphics,
      building.x + 0.45,
      building.y + 0.4,
      building.height,
      Math.max(0.8, building.width - 1.1),
      Math.max(0.8, building.depth - 1),
      0.24,
      DARK_CONCRETE,
    )
    this.drawWindows(
      graphics,
      building.x,
      building.y + building.depth + 0.02,
      building.width,
      building.height,
      building.columns,
      building.rows,
    )
  }

  private drawContainer(
    graphics: Phaser.GameObjects.Graphics,
    container: Rect & { readonly colors: BoxColors },
  ): void {
    this.drawBox(graphics, container.x, container.y, 0, container.width, container.depth, 1.15, container.colors)
    for (let stripe = 0.35; stripe < container.width - 0.1; stripe += 0.42) {
      const top = this.project(container.x + stripe, container.y + container.depth + 0.02, 1.02)
      const bottom = this.project(container.x + stripe, container.y + container.depth + 0.02, 0.16)
      graphics.lineStyle(1, COLORS.shadow, 0.26)
      graphics.lineBetween(Math.round(top.x), Math.round(top.y), Math.round(bottom.x), Math.round(bottom.y))
    }
  }

  private drawRelayTower(graphics: Phaser.GameObjects.Graphics, time: number): void {
    this.drawBox(graphics, TOWER_BASE.x, TOWER_BASE.y, 0.14, TOWER_BASE.width, TOWER_BASE.depth, 0.5, DARK_CONCRETE)
    this.drawBox(graphics, 40.68, 25.68, 0.64, 0.3, 0.3, 4.9, RUST)
    this.drawBox(graphics, 40.35, 25.35, 3.65, 0.98, 0.98, 0.18, CONCRETE)
    const mastTop = this.project(40.83, 25.83, 7.1)
    const mastBase = this.project(40.83, 25.83, 5.45)
    graphics.lineStyle(1, COLORS.pale, 0.72)
    graphics.lineBetween(Math.round(mastBase.x), Math.round(mastBase.y), Math.round(mastTop.x), Math.round(mastTop.y))
    graphics.lineBetween(Math.round(mastTop.x), Math.round(mastTop.y), Math.round(mastTop.x - 5), Math.round(mastTop.y + 7))
    graphics.lineBetween(Math.round(mastTop.x), Math.round(mastTop.y), Math.round(mastTop.x + 5), Math.round(mastTop.y + 6))
    const pulse = (Math.sin(time * 0.0032) + 1) * 0.5
    graphics.fillStyle(COLORS.cyan, 0.07 + pulse * 0.07)
    graphics.fillCircle(Math.round(mastTop.x), Math.round(mastTop.y), 7 + pulse * 3)
    graphics.fillStyle(COLORS.cyan, 0.8)
    graphics.fillRect(Math.round(mastTop.x) - 1, Math.round(mastTop.y) - 1, 2, 2)
  }

  private drawWindows(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    frontY: number,
    width: number,
    height: number,
    columns: number,
    rows: number,
  ): void {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if ((row * 3 + column) % 5 === 4) continue
        const cellWidth = (width - 0.7) / columns
        const minX = x + 0.28 + column * cellWidth
        const maxX = minX + Math.min(0.42, cellWidth * 0.52)
        const cellHeight = (height - 0.9) / rows
        const minZ = 0.5 + row * cellHeight
        const maxZ = minZ + Math.min(0.46, cellHeight * 0.5)
        this.fillPolygon(graphics, [
          this.project(minX, frontY, minZ),
          this.project(maxX, frontY, minZ),
          this.project(maxX, frontY, maxZ),
          this.project(minX, frontY, maxZ),
        ], COLORS.shadow, 0.76)
      }
    }
  }

  private drawCharacterShadow(graphics: Phaser.GameObjects.Graphics): void {
    const height = this.surfaceHeightAt(this.playerX, this.playerY)
    const point = this.project(this.playerX, this.playerY, height)
    graphics.fillStyle(COLORS.shadow, 0.5)
    graphics.fillEllipse(Math.round(point.x), Math.round(point.y + 1), 11, 4)
  }

  private directionFromScreenVector(x: number, y: number): WastelandTravelerDirection {
    const index = modulo(
      Math.round(Math.atan2(y, x) / (Math.PI / 4)),
      WASTELAND_TRAVELER_DIRECTIONS.length,
    )
    return WASTELAND_TRAVELER_DIRECTIONS[index] ?? 's'
  }

  private createCharacterSprite(): Phaser.GameObjects.Sprite {
    const clip = this.characterClip('s', 'idle')
    return this.add.sprite(ORIGIN_X, ORIGIN_Y, clip.textureKey, 0)
      .setOrigin(clip.contact.x / clip.cell.w, clip.contact.y / clip.cell.h)
      .setDepth(10)
      .play(clip.id)
  }

  private characterClip(
    direction: WastelandTravelerDirection,
    state: 'idle' | 'walk',
  ): CompiledClip {
    const clipId = `ashfall-traveler-${direction}-${state}`
    const clip = this.bundle.clips.find((candidate) => candidate.id === clipId)
    if (clip === undefined) throw new Error(`Missing compiled character clip "${clipId}"`)
    return clip
  }

  private updateCharacterSprite(): void {
    const character = this.character
    if (character === undefined) return
    const clip = this.characterClip(this.characterDirection, this.moving ? 'walk' : 'idle')
    const point = this.project(
      this.playerX,
      this.playerY,
      this.surfaceHeightAt(this.playerX, this.playerY),
    )
    character
      .setPosition(Math.round(point.x), Math.round(point.y))
      .setOrigin(clip.contact.x / clip.cell.w, clip.contact.y / clip.cell.h)
    const currentKey = character.anims.currentAnim?.key
    if (currentKey === clip.id) return
    const stateSuffix = this.moving ? '-walk' : '-idle'
    const preservedProgress = currentKey?.endsWith(stateSuffix)
      ? character.anims.getProgress()
      : 0
    character.play(clip.id)
    if (preservedProgress > 0) character.anims.setProgress(preservedProgress)
  }

  private surfaceHeightAt(x: number, y: number): number {
    const bridge = BRIDGES.find((candidate) => containsWithMargin(candidate, x, y, 0))
    if (bridge !== undefined) return 0.34
    if (x >= 37.2 && x <= 47.6 && y >= 26.2 && y <= 36.6) return 0.14
    return 0
  }

  private isFootprintInFrontOfCharacter(
    rect: Rect,
    objectDepth: number,
    characterDepth: number,
  ): boolean {
    const relation = getWastelandFootprintRelation(rect, this.playerX, this.playerY)
    if (relation === 'player-in-front') return false
    if (relation === 'object-in-front') return true
    // Collision keeps overlap unreachable, with scalar depth as a safe fallback.
    return objectDepth > characterDepth
  }

  private isWorldRectVisible(rect: Rect, height: number): boolean {
    const center = this.project(rect.x + rect.width * 0.5, rect.y + rect.depth * 0.5, height * 0.5)
    const marginX = (rect.width + rect.depth) * TILE_HALF_WIDTH + 30
    const marginY = (rect.width + rect.depth) * TILE_HALF_HEIGHT + height * HEIGHT_SCALE + 20
    return center.x > -marginX
      && center.x < WASTELAND_STAGE_WIDTH + marginX
      && center.y > -marginY
      && center.y < WASTELAND_STAGE_HEIGHT + marginY
  }

  private drawBox(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    colors: BoxColors,
  ): void {
    const baseX = this.project(x + width, y, z)
    const baseXY = this.project(x + width, y + depth, z)
    const baseY = this.project(x, y + depth, z)
    const top = this.project(x, y, z + height)
    const topX = this.project(x + width, y, z + height)
    const topXY = this.project(x + width, y + depth, z + height)
    const topY = this.project(x, y + depth, z + height)

    this.fillPolygon(graphics, [baseX, baseXY, topXY, topX], colors.right)
    this.fillPolygon(graphics, [baseXY, baseY, topY, topXY], colors.left)
    this.fillPolygon(graphics, [top, topX, topXY, topY], colors.top)
  }

  private fillPolygon(
    graphics: Phaser.GameObjects.Graphics,
    points: readonly IsoPoint[],
    color: number,
    alpha = 1,
  ): void {
    const first = points[0]
    if (first === undefined) return
    graphics.fillStyle(color, alpha)
    graphics.beginPath()
    graphics.moveTo(Math.round(first.x), Math.round(first.y))
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index]
      if (point !== undefined) graphics.lineTo(Math.round(point.x), Math.round(point.y))
    }
    graphics.closePath()
    graphics.fillPath()
  }

  private drawDust(graphics: Phaser.GameObjects.Graphics, time: number): void {
    const cameraDrift = (this.cameraX - this.cameraY) * 7
    for (let index = 0; index < 26; index += 1) {
      const speed = 0.002 + (index % 4) * 0.0007
      const x = modulo(index * 83 + time * speed * 36 - cameraDrift, WASTELAND_STAGE_WIDTH)
      const y = 25 + modulo(index * 37 + time * speed * 8, 132)
      graphics.fillStyle(index % 6 === 0 ? COLORS.amber : COLORS.pale, 0.11 + (index % 3) * 0.045)
      graphics.fillRect(Math.round(x), Math.round(y), 1, 1)
    }
  }

  private createLandmarkLabels(): void {
    for (const definition of LANDMARKS) {
      const text = this.add.text(0, 0, definition.label, {
        color: '#6ee7db',
        backgroundColor: '#071015',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '5px',
        padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(24).setVisible(false)
      this.landmarkLabels.push({ definition, text })
    }
  }

  private updateLandmarkLabels(): void {
    const overlayVisible = this.overlay?.visible ?? false
    for (const entry of this.landmarkLabels) {
      const point = this.project(entry.definition.x, entry.definition.y, entry.definition.z)
      const onScreen = point.x > 20
        && point.x < WASTELAND_STAGE_WIDTH - 20
        && point.y > 18
        && point.y < WASTELAND_STAGE_HEIGHT - 12
      entry.text.setPosition(point.x, point.y).setVisible(overlayVisible && onScreen)
    }
  }

  private drawDebugOverlay(): void {
    const overlay = this.overlay
    if (overlay === undefined || !overlay.visible) return
    overlay.clear()
    overlay.lineStyle(1, COLORS.overlay, 0.2)
    const minX = Math.max(0, Math.floor(this.cameraX - 14))
    const maxX = Math.min(WASTELAND_MAP_BOUNDS.width, Math.ceil(this.cameraX + 14))
    const minY = Math.max(0, Math.floor(this.cameraY - 14))
    const maxY = Math.min(WASTELAND_MAP_BOUNDS.depth, Math.ceil(this.cameraY + 14))
    for (let x = minX; x <= maxX; x += 2) {
      const start = this.project(x, minY, 0.1)
      const end = this.project(x, maxY, 0.1)
      overlay.lineBetween(Math.round(start.x), Math.round(start.y), Math.round(end.x), Math.round(end.y))
    }
    for (let y = minY; y <= maxY; y += 2) {
      const start = this.project(minX, y, 0.1)
      const end = this.project(maxX, y, 0.1)
      overlay.lineBetween(Math.round(start.x), Math.round(start.y), Math.round(end.x), Math.round(end.y))
    }
    const player = this.project(this.playerX, this.playerY, this.surfaceHeightAt(this.playerX, this.playerY))
    overlay.lineStyle(1, COLORS.cyan, 0.85)
    overlay.strokeCircle(Math.round(player.x), Math.round(player.y - 7), 9)
  }

  private readonly setWorkspaceMode = (mode: WorkspaceMode): void => {
    this.mode = mode
    this.input.enabled = mode === 'play'
    this.moving = false
    this.publishSnapshot()
  }

  private readonly setOverlayVisibility = (visible: boolean): void => {
    this.overlay?.setVisible(visible)
    if (!visible) {
      this.overlay?.clear()
      for (const entry of this.landmarkLabels) entry.text.setVisible(false)
    }
  }

  private publishSnapshot(): void {
    this.lastReportAt = this.time.now
    this.report({
      scene: 'wasteland-map',
      mode: this.mode,
      playerX: Number(this.playerX.toFixed(2)),
      playerY: Number(this.playerY.toFixed(2)),
      playerDepth: Number(this.playerY.toFixed(2)),
      interaction: null,
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private readonly releaseWorkspaceEvents = (): void => {
    this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
  }
}
