import Phaser from 'phaser'
import type { CompiledBundle } from '../../compiler/types.ts'
import { installBundle } from '../../phaser/installBundle.ts'
import { buildRearTravelerPose, TRAVELER_HEIGHT } from '../character/modernTraveler.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type PrototypeProgress,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'

export const STAGE_WIDTH = 320
export const STAGE_HEIGHT = 180

type Vec3 = {
  readonly x: number
  readonly y: number
  readonly z: number
}

type ProjectedPoint = {
  readonly x: number
  readonly y: number
  readonly depth: number
}

type CameraPoint = {
  readonly x: number
  readonly y: number
  readonly depth: number
}

type CameraPose = {
  readonly position: Vec3
  readonly forward: Vec3
  readonly right: Vec3
  readonly up: Vec3
}

type Face = {
  readonly vertices: readonly Vec3[]
  readonly color: number
  readonly alpha?: number
}

type ControlKeys = {
  readonly forward: Phaser.Input.Keyboard.Key
  readonly backward: Phaser.Input.Keyboard.Key
  readonly left: Phaser.Input.Keyboard.Key
  readonly right: Phaser.Input.Keyboard.Key
  readonly cursorUp: Phaser.Input.Keyboard.Key
  readonly cursorDown: Phaser.Input.Keyboard.Key
  readonly cursorLeft: Phaser.Input.Keyboard.Key
  readonly cursorRight: Phaser.Input.Keyboard.Key
  readonly interact: Phaser.Input.Keyboard.Key
  readonly alternateInteract: Phaser.Input.Keyboard.Key
}

type RoomSide = 'left' | 'right'

const PALETTE = {
  skyDark: 0x120d08,
  skyMid: 0x2b1c0f,
  skyLight: 0x62411f,
  haze: 0x9b6a32,
  floor: 0xb98b4c,
  wall: 0xc9a261,
  ceiling: 0x4f341c,
  columnMid: 0xa87d46,
  columnLight: 0xc09152,
  turquoise: 0x25877e,
  muralWash: 0x9f7543,
  muralInk: 0x684426,
  muralRed: 0x914c35,
  muralBlue: 0x2f716c,
  gold: 0xe7b64c,
  limestone: 0xe2c98d,
  overlay: 0x62e0cf,
  shadow: 0x1a1109,
} as const

const WORLD_UP: Vec3 = { x: 0, y: 1, z: 0 }
const PLAYER_RADIUS = 0.34
const FOCAL_LENGTH = 118
const NEAR_PLANE = 0.2

const subtract = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z,
})

const dot = (left: Vec3, right: Vec3): number =>
  left.x * right.x + left.y * right.y + left.z * right.z

const cross = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x,
})

const normalize = (value: Vec3): Vec3 => {
  const length = Math.hypot(value.x, value.y, value.z)
  if (length === 0) return { x: 0, y: 0, z: 0 }
  return { x: value.x / length, y: value.y / length, z: value.z / length }
}

const face = (vertices: readonly Vec3[], color: number, alpha?: number): Face => ({
  vertices,
  color,
  alpha,
})

function makeBox(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  colors: readonly [number, number, number],
): Face[] {
  const nearBottomLeft = { x: minX, y: minY, z: minZ }
  const nearBottomRight = { x: maxX, y: minY, z: minZ }
  const nearTopLeft = { x: minX, y: maxY, z: minZ }
  const nearTopRight = { x: maxX, y: maxY, z: minZ }
  const farBottomLeft = { x: minX, y: minY, z: maxZ }
  const farBottomRight = { x: maxX, y: minY, z: maxZ }
  const farTopLeft = { x: minX, y: maxY, z: maxZ }
  const farTopRight = { x: maxX, y: maxY, z: maxZ }

  return [
    face([nearBottomLeft, nearBottomRight, nearTopRight, nearTopLeft], colors[1]),
    face([farBottomRight, farBottomLeft, farTopLeft, farTopRight], colors[0]),
    face([farBottomLeft, nearBottomLeft, nearTopLeft, farTopLeft], colors[0]),
    face([nearBottomRight, farBottomRight, farTopRight, nearTopRight], colors[1]),
    face([nearTopLeft, nearTopRight, farTopRight, farTopLeft], colors[2]),
  ]
}

function makePillar(x: number, z: number): Face[] {
  const stone = [PALETTE.columnMid, PALETTE.columnMid, PALETTE.columnLight] as const
  const gold = [0xb98534, 0xb98534, 0xd2a546] as const
  return [
    ...makeBox(x - 0.42, x + 0.42, 0.36, 5.24, z - 0.42, z + 0.42, stone),
    ...makeBox(x - 0.62, x + 0.62, 0, 0.4, z - 0.62, z + 0.62, gold),
    ...makeBox(x - 0.62, x + 0.62, 5.2, 5.8, z - 0.62, z + 0.62, gold),
  ]
}

function makeShadow(x: number, z: number): Face {
  const vertices: Vec3[] = []
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2
    vertices.push({
      x: x + Math.cos(angle) * 0.52,
      y: 0.025,
      z: z + Math.sin(angle) * 0.38,
    })
  }
  return face(vertices, PALETTE.shadow, 0.56)
}

function makeTraveler(
  x: number,
  z: number,
  camera: CameraPose,
  walkPhase: number,
  idlePhase: number,
  moving: boolean,
): Face[] {
  return buildRearTravelerPose({ walkPhase, idlePhase, moving }).map((part) => face(
    part.points.map((point) => ({
      x: x + camera.right.x * point.x,
      y: point.y,
      z: z + camera.right.z * point.x,
    })),
    part.color,
  ))
}

function buildGround(): Face[] {
  const faces: Face[] = []
  for (let z = -12; z < 30; z += 4) {
    faces.push(face([
      { x: -7, y: 0, z },
      { x: 7, y: 0, z },
      { x: 7, y: 0, z: z + 4 },
      { x: -7, y: 0, z: z + 4 },
    ], PALETTE.floor))
  }
  return faces
}

function buildCeiling(): Face[] {
  const faces: Face[] = []
  for (let z = -12; z < 30; z += 4) {
    faces.push(face([
      { x: -7, y: 5.8, z },
      { x: -7, y: 5.8, z: z + 4 },
      { x: 7, y: 5.8, z: z + 4 },
      { x: 7, y: 5.8, z },
    ], PALETTE.ceiling))
  }
  return faces
}

function makeSideWall(side: RoomSide, minZ: number, maxZ: number): Face {
  const x = side === 'left' ? -7 : 7
  return face([
    { x, y: 0, z: minZ },
    { x, y: 0, z: maxZ },
    { x, y: 5.8, z: maxZ },
    { x, y: 5.8, z: minZ },
  ], PALETTE.wall)
}

function buildRoom(): Face[] {
  const faces: Face[] = [...buildCeiling()]
  for (let z = -12; z < 30; z += 4) {
    faces.push(makeSideWall('left', z, z + 4), makeSideWall('right', z, z + 4))
  }
  faces.push(
    face([
      { x: 7, y: 0, z: 30 },
      { x: -7, y: 0, z: 30 },
      { x: -7, y: 5.8, z: 30 },
      { x: 7, y: 5.8, z: 30 },
    ], PALETTE.wall),
  )
  return faces
}

const MURAL_CENTER_Y = 2.45
const MURAL_CENTER_Z = 12.5

function makeWallShape(
  side: RoomSide,
  points: readonly { readonly y: number; readonly z: number }[],
  color: number,
  alpha = 1,
): Face {
  const x = side === 'left' ? -6.965 : 6.965
  return face(points.map((point) => ({ x, y: point.y, z: point.z })), color, alpha)
}

function makeWallRect(
  side: RoomSide,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  color: number,
  alpha = 1,
): Face {
  return makeWallShape(side, [
    { y: minY, z: minZ },
    { y: minY, z: maxZ },
    { y: maxY, z: maxZ },
    { y: maxY, z: minZ },
  ], color, alpha)
}

function makeMuralGlow(
  side: RoomSide,
  time: number,
  active: boolean,
  available = true,
): Face[] {
  if (!available) return []
  const pulse = (Math.sin(time * 0.004) + 1) * 0.5
  const color = active ? PALETTE.limestone : PALETTE.turquoise
  const strength = active ? 1 : 0.58 + pulse * 0.2
  const glowShape = (radiusY: number, radiusZ: number, alpha: number): Face => makeWallShape(side, [
    { y: MURAL_CENTER_Y - radiusY * 0.58, z: MURAL_CENTER_Z - radiusZ },
    { y: MURAL_CENTER_Y - radiusY, z: MURAL_CENTER_Z - radiusZ * 0.48 },
    { y: MURAL_CENTER_Y - radiusY, z: MURAL_CENTER_Z + radiusZ * 0.48 },
    { y: MURAL_CENTER_Y - radiusY * 0.58, z: MURAL_CENTER_Z + radiusZ },
    { y: MURAL_CENTER_Y + radiusY * 0.58, z: MURAL_CENTER_Z + radiusZ },
    { y: MURAL_CENTER_Y + radiusY, z: MURAL_CENTER_Z + radiusZ * 0.48 },
    { y: MURAL_CENTER_Y + radiusY, z: MURAL_CENTER_Z - radiusZ * 0.48 },
    { y: MURAL_CENTER_Y + radiusY * 0.58, z: MURAL_CENTER_Z - radiusZ },
  ], color, alpha * strength)

  return [
    glowShape(1.58 + pulse * 0.05, 1.62 + pulse * 0.05, 0.055),
    glowShape(1.38 + pulse * 0.035, 1.42 + pulse * 0.035, 0.075),
    glowShape(1.2 + pulse * 0.02, 1.24 + pulse * 0.02, 0.1),
  ]
}

function makeMuralPainting(
  side: RoomSide,
  time: number,
  active: boolean,
  available = true,
): Face[] {
  const pulse = (Math.sin(time * 0.004) + 1) * 0.5
  const centerAccent = !available
    ? PALETTE.muralInk
    : active
      ? PALETTE.limestone
      : PALETTE.turquoise
  const faces: Face[] = [
    makeWallRect(side, 1.25, 3.65, 11.3, 13.7, PALETTE.muralWash, 0.52),
    makeWallRect(side, 1.25, 1.34, 11.3, 13.7, PALETTE.muralInk, 0.72),
    makeWallRect(side, 3.56, 3.65, 11.3, 13.7, PALETTE.muralInk, 0.72),
    makeWallRect(side, 1.25, 3.65, 11.3, 11.39, PALETTE.muralInk, 0.72),
    makeWallRect(side, 1.25, 3.65, 13.61, 13.7, PALETTE.muralInk, 0.72),

    // Faded profile figure: headdress, face, torso, kilt and a striding pose.
    makeWallShape(side, [
      { y: 3.22, z: 11.73 },
      { y: 3.1, z: 12.12 },
      { y: 2.82, z: 12.08 },
      { y: 2.75, z: 11.78 },
      { y: 2.91, z: 11.61 },
    ], PALETTE.muralBlue, 0.82),
    makeWallShape(side, [
      { y: 3.05, z: 12.08 },
      { y: 3.04, z: 12.27 },
      { y: 2.92, z: 12.36 },
      { y: 2.82, z: 12.1 },
    ], PALETTE.muralRed, 0.8),
    makeWallShape(side, [
      { y: 2.78, z: 11.82 },
      { y: 2.72, z: 12.15 },
      { y: 2.05, z: 12.08 },
      { y: 1.96, z: 11.75 },
    ], PALETTE.muralRed, 0.78),
    makeWallShape(side, [
      { y: 2.5, z: 12.05 },
      { y: 2.41, z: 12.64 },
      { y: 2.29, z: 12.63 },
      { y: 2.3, z: 12.0 },
    ], PALETTE.muralInk, 0.8),
    makeWallShape(side, [
      { y: 2.08, z: 11.72 },
      { y: 2.12, z: 12.12 },
      { y: 1.82, z: 12.26 },
      { y: 1.76, z: 11.7 },
    ], PALETTE.muralBlue, 0.78),
    makeWallShape(side, [
      { y: 1.8, z: 11.76 },
      { y: 1.8, z: 11.94 },
      { y: 1.38, z: 12.13 },
      { y: 1.34, z: 11.97 },
    ], PALETTE.muralInk, 0.82),
    makeWallShape(side, [
      { y: 1.8, z: 12.04 },
      { y: 1.8, z: 12.22 },
      { y: 1.37, z: 12.42 },
      { y: 1.34, z: 12.25 },
    ], PALETTE.muralInk, 0.82),

    // Small marks make the panel read as a painted hieroglyphic scene at a distance.
    makeWallRect(side, 2.92, 3.08, 12.72, 13.35, PALETTE.muralInk, 0.72),
    makeWallRect(side, 2.58, 2.74, 12.87, 13.43, PALETTE.muralBlue, 0.76),
    makeWallRect(side, 2.22, 2.36, 12.76, 13.2, PALETTE.muralInk, 0.7),
    makeWallRect(side, 1.56, 2.02, 13.12, 13.23, PALETTE.muralRed, 0.74),
    makeWallRect(side, 1.55, 1.68, 12.74, 13.46, PALETTE.muralInk, 0.7),
  ]

  if (side === 'left') {
    const sun: { y: number; z: number }[] = []
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2
      sun.push({
        y: 3.28 + Math.sin(angle) * 0.22,
        z: 12.56 + Math.cos(angle) * 0.22,
      })
    }
    faces.push(makeWallShape(side, sun, centerAccent, 0.58 + pulse * 0.2))
  } else {
    faces.push(
      makeWallRect(side, 3.08, 3.17, 12.35, 12.92, centerAccent, 0.58 + pulse * 0.2),
      makeWallRect(side, 3.18, 3.27, 12.5, 12.92, centerAccent, 0.58 + pulse * 0.2),
      makeWallRect(side, 3.28, 3.37, 12.65, 12.92, centerAccent, 0.58 + pulse * 0.2),
    )
  }
  if (!available) {
    faces.push(
      makeWallShape(side, [
        { y: 1.58, z: 11.7 },
        { y: 1.48, z: 11.84 },
        { y: 3.32, z: 13.3 },
        { y: 3.42, z: 13.16 },
      ], PALETTE.muralInk, 0.64),
      makeWallShape(side, [
        { y: 3.32, z: 11.7 },
        { y: 3.42, z: 11.84 },
        { y: 1.58, z: 13.3 },
        { y: 1.48, z: 13.16 },
      ], PALETTE.muralInk, 0.64),
    )
  }
  return faces
}

const GROUND_FACES = buildGround()
const ROOM_FACES = buildRoom()
const PILLAR_FACES = [
  ...makePillar(-6.25, 2.5),
  ...makePillar(6.25, 2.5),
  ...makePillar(-6.25, 20.5),
  ...makePillar(6.25, 20.5),
]

export class DepthStudyScene extends Phaser.Scene {
  private readonly bundle: CompiledBundle
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private readonly progress: PrototypeProgress
  private mode: WorkspaceMode = 'play'
  private world?: Phaser.GameObjects.Graphics
  private overlay?: Phaser.GameObjects.Graphics
  private interactionPrompt?: Phaser.GameObjects.Text
  private controls?: ControlKeys
  private playerX = 0
  private playerZ = 1.5
  private walkPhase = 0
  private idlePhase = 0
  private playerMoving = false
  private cameraFocusX = 0
  private cameraFocusZ = 1.5
  private transitioning = false
  private lastReportAt = -Infinity

  constructor(
    bundle: CompiledBundle,
    report: (snapshot: RuntimeSnapshot) => void,
    progress: PrototypeProgress,
  ) {
    super('depth-study')
    this.bundle = bundle
    this.report = report
    this.progress = progress
  }

  create(): void {
    this.transitioning = false
    this.input.enabled = this.mode === 'play'
    this.cameras.main.resetFX()
    installBundle(this, this.bundle)
    this.world = this.add.graphics()
    this.overlay = this.add.graphics().setVisible(false)
    this.interactionPrompt = this.add.text(STAGE_WIDTH * 0.5, STAGE_HEIGHT - 15, 'E / SPACE  ENTER HIEROGLYPH', {
      color: '#f0d99f',
      backgroundColor: '#1a1109',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '7px',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
    this.controls = this.createControls()

    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.releaseWorkspaceEvents, this)

    this.cameras.main.fadeIn(180, 8, 9, 24)
    this.drawFrame(0)
    this.publishSnapshot()
  }

  override update(time: number, delta: number): void {
    const deltaSeconds = Math.min(delta, 40) / 1000
    this.idlePhase += deltaSeconds
    if (this.mode === 'play') this.updatePlayer(deltaSeconds)
    this.updateInteraction()

    const cameraFollow = 1 - Math.exp(-delta * 0.0045)
    this.cameraFocusX = Phaser.Math.Linear(this.cameraFocusX, this.playerX * 0.2, cameraFollow)
    this.cameraFocusZ = Phaser.Math.Linear(this.cameraFocusZ, this.playerZ, cameraFollow)
    this.drawFrame(time)

    if (time - this.lastReportAt >= 100) this.publishSnapshot()
  }

  private createControls(): ControlKeys | undefined {
    const keyboard = this.input.keyboard
    if (keyboard === null) return undefined
    return {
      forward: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      backward: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursorUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      cursorDown: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      cursorLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      cursorRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      alternateInteract: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    }
  }

  private getNearbyMural(): RoomSide | null {
    if (Math.abs(this.playerZ - 12.5) > 1.55) return null
    if (this.playerX <= -5.65) return 'left'
    if (this.playerX >= 5.65) return 'right'
    return null
  }

  private updateInteraction(): void {
    const side = this.getNearbyMural()
    this.interactionPrompt?.setVisible(side !== null && this.mode === 'play' && !this.transitioning)
    if (side === null || this.controls === undefined || this.transitioning || this.mode !== 'play') return
    if (side === 'right' && !this.progress.puzzleComplete) {
      this.interactionPrompt?.setText('THE HIEROGLYPH IS DORMANT')
      return
    }
    this.interactionPrompt?.setText('E / SPACE  ENTER HIEROGLYPH')
    const pressed = Phaser.Input.Keyboard.JustDown(this.controls.interact)
      || Phaser.Input.Keyboard.JustDown(this.controls.alternateInteract)
    if (!pressed) return

    this.transitioning = true
    this.interactionPrompt?.setVisible(false)
    this.input.enabled = false
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(side === 'left' ? 'glyph-puzzle' : 'glyph-platform')
    })
    this.cameras.main.fadeOut(240, 8, 9, 24)
  }

  private updatePlayer(deltaSeconds: number): void {
    if (this.controls === undefined) {
      this.playerMoving = false
      return
    }
    const horizontal = Number(this.controls.right.isDown || this.controls.cursorRight.isDown)
      - Number(this.controls.left.isDown || this.controls.cursorLeft.isDown)
    const depth = Number(this.controls.forward.isDown || this.controls.cursorUp.isDown)
      - Number(this.controls.backward.isDown || this.controls.cursorDown.isDown)
    const magnitude = Math.hypot(horizontal, depth)
    this.playerMoving = magnitude > 0
    if (magnitude === 0) return

    const distance = 4.2 * deltaSeconds
    this.walkPhase += deltaSeconds * 8.5
    this.playerZ = Phaser.Math.Clamp(
      this.playerZ + (depth / magnitude) * distance,
      -1.5,
      28.5,
    )
    this.playerX = Phaser.Math.Clamp(
      this.playerX + (horizontal / magnitude) * distance,
      -6.45,
      6.45,
    )
  }

  private getCamera(): CameraPose {
    const position = {
      x: this.cameraFocusX,
      y: 4.9,
      z: this.cameraFocusZ - 9.6,
    }
    const target = {
      x: this.cameraFocusX * 0.35,
      y: 0.82,
      z: this.cameraFocusZ + 5.8,
    }
    const forward = normalize(subtract(target, position))
    const right = normalize(cross(WORLD_UP, forward))
    return {
      position,
      forward,
      right,
      up: normalize(cross(forward, right)),
    }
  }

  private toCameraPoint(point: Vec3, camera: CameraPose): CameraPoint {
    const relative = subtract(point, camera.position)
    return {
      x: dot(relative, camera.right),
      y: dot(relative, camera.up),
      depth: dot(relative, camera.forward),
    }
  }

  private projectCameraPoint(point: CameraPoint): ProjectedPoint {
    const scale = FOCAL_LENGTH / point.depth
    return {
      x: STAGE_WIDTH * 0.5 + point.x * scale,
      y: STAGE_HEIGHT * 0.48 - point.y * scale,
      depth: point.depth,
    }
  }

  private project(point: Vec3, camera: CameraPose): ProjectedPoint | null {
    const cameraPoint = this.toCameraPoint(point, camera)
    if (cameraPoint.depth <= NEAR_PLANE) return null
    return this.projectCameraPoint(cameraPoint)
  }

  private clipNearPlane(points: readonly CameraPoint[]): CameraPoint[] {
    const clipped: CameraPoint[] = []
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]
      const previous = points[(index + points.length - 1) % points.length]
      if (current === undefined || previous === undefined) continue
      const currentInside = current.depth >= NEAR_PLANE
      const previousInside = previous.depth >= NEAR_PLANE

      if (currentInside !== previousInside) {
        const amount = (NEAR_PLANE - previous.depth) / (current.depth - previous.depth)
        clipped.push({
          x: Phaser.Math.Linear(previous.x, current.x, amount),
          y: Phaser.Math.Linear(previous.y, current.y, amount),
          depth: NEAR_PLANE,
        })
      }
      if (currentInside) clipped.push(current)
    }
    return clipped
  }

  private drawFrame(time: number): void {
    const graphics = this.world
    if (graphics === undefined) return
    graphics.clear()
    this.drawBackdrop(graphics)

    const camera = this.getCamera()
    this.drawFaces(graphics, GROUND_FACES, camera)
    this.drawFaces(graphics, ROOM_FACES, camera)
    this.drawFaces(graphics, PILLAR_FACES, camera)
    const nearbyMural = this.getNearbyMural()
    this.drawFaces(graphics, [
      ...makeMuralGlow('left', time, nearbyMural === 'left'),
      ...makeMuralGlow(
        'right',
        time,
        nearbyMural === 'right',
        this.progress.puzzleComplete,
      ),
    ], camera)
    this.drawFaces(graphics, [
      ...makeMuralPainting('left', time, nearbyMural === 'left'),
      ...makeMuralPainting(
        'right',
        time,
        nearbyMural === 'right',
        this.progress.puzzleComplete,
      ),
    ], camera)
    this.drawFaces(graphics, [
      makeShadow(this.playerX, this.playerZ),
      ...makeTraveler(
        this.playerX,
        this.playerZ,
        camera,
        this.walkPhase,
        this.idlePhase,
        this.playerMoving,
      ),
    ], camera)
    this.drawDust(graphics, time)
    this.drawOverlay(camera)
  }

  private drawBackdrop(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(PALETTE.skyDark)
    graphics.fillRect(0, 0, STAGE_WIDTH, 50)
    graphics.fillStyle(PALETTE.skyMid)
    graphics.fillRect(0, 50, STAGE_WIDTH, 38)
    graphics.fillStyle(PALETTE.skyLight)
    graphics.fillRect(0, 88, STAGE_WIDTH, 28)
    graphics.fillStyle(PALETTE.haze)
    graphics.fillRect(0, 116, STAGE_WIDTH, 64)

    graphics.fillStyle(PALETTE.skyDark, 0.5)
    graphics.fillRect(0, 34, STAGE_WIDTH, 2)
    graphics.fillRect(0, 72, STAGE_WIDTH, 1)
  }

  private drawDust(graphics: Phaser.GameObjects.Graphics, time: number): void {
    const drift = (time * 0.009) % 86
    graphics.fillStyle(PALETTE.gold, 0.42)
    graphics.fillRect(54 + drift, 75, 1, 1)
    graphics.fillRect(238 - drift * 0.65, 91, 1, 1)
    graphics.fillRect(113 + drift * 0.42, 105, 2, 1)
  }

  private drawFaces(
    graphics: Phaser.GameObjects.Graphics,
    faces: readonly Face[],
    camera: CameraPose,
  ): void {
    const projected = faces.flatMap((source) => {
      const cameraPoints = source.vertices.map((vertex) => this.toCameraPoint(vertex, camera))
      const clippedPoints = this.clipNearPlane(cameraPoints)
      if (clippedPoints.length < 3) return []
      const visiblePoints = clippedPoints.map((point) => this.projectCameraPoint(point))
      const depth = visiblePoints.reduce((total, point) => total + point.depth, 0) / visiblePoints.length
      return [{ source, points: visiblePoints, depth }]
    }).sort((left, right) => right.depth - left.depth)

    for (const polygon of projected) {
      const first = polygon.points[0]
      if (first === undefined) continue
      graphics.fillStyle(polygon.source.color, polygon.source.alpha ?? 1)
      graphics.beginPath()
      graphics.moveTo(Math.round(first.x), Math.round(first.y))
      for (let index = 1; index < polygon.points.length; index += 1) {
        const point = polygon.points[index]
        if (point) graphics.lineTo(Math.round(point.x), Math.round(point.y))
      }
      graphics.closePath()
      graphics.fillPath()
    }
  }

  private drawOverlay(camera: CameraPose): void {
    const overlay = this.overlay
    if (overlay === undefined || !overlay.visible) return
    overlay.clear()
    overlay.lineStyle(1, PALETTE.overlay, 0.42)

    const startZ = Math.floor((this.playerZ - 4) / 2) * 2
    for (let z = startZ; z <= this.playerZ + 18; z += 2) {
      this.drawProjectedLine(overlay, { x: -7, y: 0.035, z }, { x: 7, y: 0.035, z }, camera)
    }
    for (let x = -7; x <= 7; x += 2) {
      this.drawProjectedLine(
        overlay,
        { x, y: 0.035, z: this.playerZ - 4 },
        { x, y: 0.035, z: this.playerZ + 18 },
        camera,
      )
    }

    overlay.lineStyle(1, PALETTE.overlay, 0.9)
    this.drawProjectedLine(
      overlay,
      { x: this.playerX, y: 0, z: this.playerZ },
      { x: this.playerX, y: TRAVELER_HEIGHT + 0.35, z: this.playerZ },
      camera,
    )
  }

  private drawProjectedLine(
    graphics: Phaser.GameObjects.Graphics,
    start: Vec3,
    end: Vec3,
    camera: CameraPose,
  ): void {
    const projectedStart = this.project(start, camera)
    const projectedEnd = this.project(end, camera)
    if (projectedStart === null || projectedEnd === null) return
    graphics.lineBetween(
      Math.round(projectedStart.x),
      Math.round(projectedStart.y),
      Math.round(projectedEnd.x),
      Math.round(projectedEnd.y),
    )
  }

  private readonly setWorkspaceMode = (mode: WorkspaceMode): void => {
    this.mode = mode
    if (mode === 'inspect') this.playerMoving = false
    this.input.enabled = mode === 'play'
    this.publishSnapshot()
  }

  private readonly setOverlayVisibility = (visible: boolean): void => {
    this.overlay?.setVisible(visible)
    if (!visible) this.overlay?.clear()
  }

  private publishSnapshot(): void {
    this.lastReportAt = this.time.now
    this.report({
      scene: 'depth-study',
      mode: this.mode,
      playerX: Number(this.playerX.toFixed(2)),
      playerY: 0,
      playerDepth: Number(this.playerZ.toFixed(2)),
      interaction: this.getNearbyMural() === null
        ? null
        : this.getNearbyMural() === 'right' && !this.progress.puzzleComplete
          ? 'locked-mural'
          : 'mural',
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private readonly releaseWorkspaceEvents = (): void => {
    this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlayVisibility, this)
  }
}
