import { Camera } from '@babylonjs/core/Cameras/camera.js'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.js'
import { Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { Scene } from '@babylonjs/core/scene.js'
import { Sprite } from '@babylonjs/core/Sprites/sprite.js'
import { SpriteManager } from '@babylonjs/core/Sprites/spriteManager.js'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'
import { createPcbRoomVisuals } from './PcbRoomVisuals.ts'
import {
  createMechaMotionState,
  MOTION_TUNING,
  stepMechaMotion,
  type MechaMotionSpawn,
  type MechaMotionState,
} from './motion.ts'
import {
  PCB_PULSE_ROUTE,
  PCB_ROOM_CHECKPOINT,
  PCB_ROOM_FALL_LIMIT,
  PCB_ROOM_SPAWN,
  PCB_ROOM_WORLD,
} from './pcbRoom.ts'

const DARK_PCB = new Color4(0.063, 0.098, 0.106, 1)
const SCREEN_WIDTH = 16
const SCREEN_HEIGHT = 9
const ATLAS_URL = '/assets/lcd-platformer/mecha/motion-atlas.png'
const CELL_SIZE = 320
const FRAMES_PER_CLIP = 12
const MECHA_SIZE = 2.55
const MECHA_VISUAL_OFFSET_X = -0.048
const MECHA_VISUAL_OFFSET_Y = -0.028

const CLIP_ROW = {
  idle: 0,
  walk: 1,
  jumpStart: 2,
  jumpLoop: 3,
  land: 4,
} as const

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const wrap01 = (value: number): number => value - Math.floor(value)

const loopCell = (row: number, phase: number): number => (
  row * FRAMES_PER_CLIP
  + Math.min(FRAMES_PER_CLIP - 1, Math.floor(wrap01(phase) * FRAMES_PER_CLIP))
)

const oneShotCell = (row: number, progress: number): number => (
  row * FRAMES_PER_CLIP
  + Math.round(clamp01(progress) * (FRAMES_PER_CLIP - 1))
)

function resolveMechaCell(motion: MechaMotionState, visualTime: number): number {
  switch (motion.state) {
    case 'start':
    case 'locomotion':
    case 'stop':
      return loopCell(CLIP_ROW.walk, motion.locomotionPhase)
    case 'turn':
      // The contact frame is held while braking. A new stride only starts
      // after the explicit turn state has completed.
      return CLIP_ROW.walk * FRAMES_PER_CLIP
    case 'jump-rise':
      return oneShotCell(CLIP_ROW.jumpStart, motion.stateTime / 0.42)
    case 'fall':
      return loopCell(CLIP_ROW.jumpLoop, motion.stateTime / 1.1)
    case 'land':
      return oneShotCell(CLIP_ROW.land, motion.stateTime / MOTION_TUNING.landSeconds)
    case 'idle':
      return loopCell(CLIP_ROW.idle, visualTime / 2.5)
  }
}

export function createLcdPlatformerScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = DARK_PCB

  const camera = new FreeCamera('lcd-camera', new Vector3(0, 0, -10), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.setTarget(Vector3.Zero())
  camera.minZ = 0.1
  camera.maxZ = 30
  scene.activeCamera = camera

  const room = createPcbRoomVisuals(scene)

  // Babylon owns texture loading, atlas addressing, alpha blending and sprite
  // rendering. Blender only authored the offline pixels and motion frames.
  const spriteManager = new SpriteManager(
    'lcd-mecha-atlas',
    ATLAS_URL,
    1,
    CELL_SIZE,
    scene,
  )
  spriteManager.isPickable = false
  const mecha = new Sprite('lcd-mecha', spriteManager)
  mecha.width = MECHA_SIZE
  mecha.height = MECHA_SIZE
  mecha.isPickable = false

  let mode: WorkspaceMode = 'play'
  let checkpoint: MechaMotionSpawn = PCB_ROOM_SPAWN
  let checkpointActive = false
  let interaction: string | null = 'maintenance pad online'
  let motion = createMechaMotionState(checkpoint)
  let visualTime = 0
  let lastRenderWidth = 0
  let lastRenderHeight = 0

  const syncCamera = (): void => {
    const width = Math.max(1, context.engine.getRenderWidth())
    const height = Math.max(1, context.engine.getRenderHeight())
    if (width === lastRenderWidth && height === lastRenderHeight) return
    lastRenderWidth = width
    lastRenderHeight = height
    const aspect = width / height
    const halfWidth = Math.max(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 * aspect)
    const halfHeight = Math.max(SCREEN_HEIGHT / 2, SCREEN_WIDTH / 2 / aspect)
    camera.orthoLeft = -halfWidth
    camera.orthoRight = halfWidth
    camera.orthoTop = halfHeight
    camera.orthoBottom = -halfHeight
  }

  const syncMecha = (): void => {
    mecha.position.set(
      motion.positionX + MECHA_VISUAL_OFFSET_X,
      motion.positionY + MECHA_VISUAL_OFFSET_Y,
      0,
    )
    mecha.invertU = motion.facing === -1
    mecha.cellIndex = resolveMechaCell(motion, visualTime)
  }

  const reset = (reason = 'maintenance reset'): void => {
    motion = createMechaMotionState(checkpoint)
    visualTime = 0
    interaction = reason
    syncMecha()
  }

  const updateGame = (deltaSeconds: number, timeMs: number): void => {
    syncCamera()
    const pulseX = room.update(timeMs, checkpointActive)
    if (mode !== 'play') return
    if (context.input.consume('KeyR')) reset()

    const left = context.input.isDown('ArrowLeft', 'KeyA')
    const right = context.input.isDown('ArrowRight', 'KeyD')
    const axisValue = Number(right) - Number(left)
    const axis = axisValue < 0 ? -1 : axisValue > 0 ? 1 : 0
    motion = stepMechaMotion(motion, {
      axis,
      jumpPressed: context.input.consume('Space', 'ArrowUp', 'KeyW'),
      jumpHeld: context.input.isDown('Space', 'ArrowUp', 'KeyW'),
    }, deltaSeconds, PCB_ROOM_WORLD)

    if (motion.positionY < PCB_ROOM_FALL_LIMIT) {
      reset('recovered by service pad')
    } else if (
      Math.abs(motion.positionX - pulseX) <= PCB_PULSE_ROUTE.dangerHalfWidth
      && motion.positionY < PCB_PULSE_ROUTE.safeRootY
    ) {
      reset('signal pulse discharge')
    } else if (
      !checkpointActive
      && motion.grounded
      && Math.abs(motion.positionX - PCB_ROOM_CHECKPOINT.positionX) < 0.58
    ) {
      checkpointActive = true
      checkpoint = PCB_ROOM_CHECKPOINT
      interaction = 'checkpoint via synchronized'
    }
    visualTime += Math.max(0, Math.min(0.04, deltaSeconds))
    syncMecha()
  }

  syncCamera()
  room.update(0, checkpointActive)
  syncMecha()

  return {
    id: 'lcd-platformer',
    scene,
    setActive: (active) => {
      if (active) context.canvas.focus({ preventScroll: true })
    },
    setMode: (nextMode) => {
      mode = nextMode
      if (mode === 'play') context.canvas.focus({ preventScroll: true })
    },
    setOverlays: () => undefined,
    update: updateGame,
    snapshot: (): RuntimeSnapshot => ({
      scene: 'lcd-platformer',
      mode,
      playerX: Number(motion.positionX.toFixed(2)),
      playerY: Number(motion.positionY.toFixed(2)),
      playerDepth: 0,
      playerFacing: motion.facing === 1 ? 'right' : 'left',
      motionState: motion.state,
      motionPhase: Number(motion.locomotionPhase.toFixed(3)),
      velocityX: Number(motion.velocityX.toFixed(2)),
      velocityY: Number(motion.velocityY.toFixed(2)),
      interaction,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      mecha.dispose()
      spriteManager.dispose()
      scene.dispose()
    },
  }
}
