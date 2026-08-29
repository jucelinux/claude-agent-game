/**
 * Game-specific locomotion rules for the LCD mecha.
 *
 * Babylon owns animation playback. This module only decides which authored
 * motion state is active and advances world movement in a deterministic way.
 */

export type Facing = -1 | 1

export type MotionStateName =
  | 'idle'
  | 'start'
  | 'locomotion'
  | 'stop'
  | 'turn'
  | 'jump-rise'
  | 'fall'
  | 'land'

export type MotionInput = {
  readonly axis: -1 | 0 | 1
  readonly jumpPressed: boolean
  readonly jumpHeld: boolean
}

export type MotionSurface = {
  readonly id: string
  readonly left: number
  readonly right: number
  /** Vertical position of the mecha pivot while supported by this surface. */
  readonly rootY: number
}

export type MotionWorld = {
  readonly surfaces: readonly MotionSurface[]
}

export type MechaMotionSpawn = {
  readonly positionX: number
  readonly positionY: number
  readonly facing?: Facing
}

export type MechaMotionState = {
  readonly state: MotionStateName
  readonly stateTime: number
  readonly facing: Facing
  readonly positionX: number
  readonly positionY: number
  readonly velocityX: number
  readonly velocityY: number
  readonly grounded: boolean
  readonly coyoteTime: number
  readonly jumpBuffer: number
  readonly locomotionPhase: number
  readonly landedThisFrame: boolean
}

export type MotionPresentation = {
  readonly idleWeight: number
  readonly locomotionWeight: number
  readonly airWeight: number
  readonly locomotionFrame: number
}

export const MECHA_MOTION_CONTRACT = {
  authoredView: 'profile',
  canonicalFacing: 'right',
  facingPolicy: 'instant-mirror',
  phaseDriver: 'distance',
  requiredStates: [
    'idle',
    'start',
    'locomotion',
    'stop',
    'turn',
    'jump-rise',
    'fall',
    'land',
  ],
  reviewScenarios: [
    'start-right',
    'stop-right',
    'start-left',
    'reverse',
    'jump',
    'land',
  ],
} as const

export const MOTION_TUNING = {
  groundY: 0,
  maxRunSpeed: 2.65,
  groundAcceleration: 10.5,
  groundDeceleration: 12,
  airAcceleration: 5.5,
  airDeceleration: 2.2,
  jumpSpeed: 5.15,
  jumpCutSpeed: 2.6,
  gravity: 13.5,
  coyoteSeconds: 0.1,
  jumpBufferSeconds: 0.12,
  startSeconds: 0.14,
  stopSeconds: 0.18,
  turnSeconds: 0.16,
  landSeconds: 0.42,
  strideWorldUnits: 1.2,
  worldLimit: 7.25,
  locomotionFrames: 48,
} as const

const DEFAULT_MOTION_WORLD: MotionWorld = {
  surfaces: [{
    id: 'default-ground',
    left: -Infinity,
    right: Infinity,
    rootY: MOTION_TUNING.groundY,
  }],
}

const moveTowards = (value: number, target: number, distance: number): number => {
  if (Math.abs(target - value) <= distance) return target
  return value + Math.sign(target - value) * distance
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const smoothstep = (value: number): number => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export function createMechaMotionState(
  spawn: MechaMotionSpawn = {
    positionX: 0,
    positionY: MOTION_TUNING.groundY,
  },
): MechaMotionState {
  return {
    state: 'idle',
    stateTime: 0,
    facing: spawn.facing ?? 1,
    positionX: spawn.positionX,
    positionY: spawn.positionY,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    coyoteTime: MOTION_TUNING.coyoteSeconds,
    jumpBuffer: 0,
    locomotionPhase: 0,
    landedThisFrame: false,
  }
}

export function presentMechaMotion(state: MechaMotionState): MotionPresentation {
  const airWeight = state.state === 'jump-rise' || state.state === 'fall' ? 1 : 0
  let locomotionWeight = 0
  if (state.state === 'start') {
    locomotionWeight = smoothstep(state.stateTime / MOTION_TUNING.startSeconds)
  } else if (state.state === 'locomotion') {
    locomotionWeight = 1
  } else if (state.state === 'stop') {
    locomotionWeight = 1 - smoothstep(state.stateTime / MOTION_TUNING.stopSeconds)
  }
  locomotionWeight *= 1 - airWeight
  return {
    idleWeight: (1 - airWeight) * (1 - locomotionWeight),
    locomotionWeight,
    airWeight,
    locomotionFrame: state.locomotionPhase * MOTION_TUNING.locomotionFrames,
  }
}

export function stepMechaMotion(
  current: MechaMotionState,
  input: MotionInput,
  deltaSeconds: number,
  world: MotionWorld = DEFAULT_MOTION_WORLD,
): MechaMotionState {
  const dt = Math.max(0, Math.min(0.04, deltaSeconds))
  let state = current.state
  let stateTime = current.stateTime + dt
  let facing = current.facing
  let positionX = current.positionX
  let positionY = current.positionY
  let velocityX = current.velocityX
  let velocityY = current.velocityY
  let grounded = current.grounded
  let coyoteTime = grounded
    ? MOTION_TUNING.coyoteSeconds
    : Math.max(0, current.coyoteTime - dt)
  let jumpBuffer = input.jumpPressed
    ? MOTION_TUNING.jumpBufferSeconds
    : Math.max(0, current.jumpBuffer - dt)
  let locomotionPhase = current.locomotionPhase
  let landedThisFrame = false

  const transition = (next: MotionStateName): void => {
    if (state === next) return
    state = next
    stateTime = 0
  }

  const hasSupportAt = (x: number, rootY: number): boolean => world.surfaces.some((surface) => (
    x >= surface.left
    && x <= surface.right
    && Math.abs(surface.rootY - rootY) <= 0.06
  ))

  const findLanding = (
    x: number,
    previousRootY: number,
    nextRootY: number,
  ): MotionSurface | undefined => world.surfaces
    .filter((surface) => (
      x >= surface.left
      && x <= surface.right
      && previousRootY >= surface.rootY - 0.001
      && nextRootY <= surface.rootY
    ))
    .sort((left, right) => right.rootY - left.rootY)[0]

  if (grounded) {
    if (state === 'land') {
      if (stateTime >= MOTION_TUNING.landSeconds) {
        transition(input.axis === 0 ? 'idle' : 'start')
        if (input.axis !== 0) facing = input.axis
      }
    } else if (input.axis !== 0 && input.axis !== facing) {
      facing = input.axis
      locomotionPhase = 0
      transition('turn')
    } else if (state === 'turn') {
      if (stateTime >= MOTION_TUNING.turnSeconds && Math.abs(velocityX) < 0.08) {
        transition(input.axis === 0 ? 'idle' : 'start')
      }
    } else if (input.axis !== 0) {
      if (state === 'idle' || state === 'stop') {
        locomotionPhase = 0
        transition('start')
      } else if (state === 'start' && stateTime >= MOTION_TUNING.startSeconds) {
        transition('locomotion')
      }
    } else if (state === 'start' || state === 'locomotion') {
      transition('stop')
    } else if (state === 'stop' && stateTime >= MOTION_TUNING.stopSeconds && Math.abs(velocityX) < 0.05) {
      transition('idle')
    }
  }

  const canDriveOnGround = state === 'start' || state === 'locomotion'
  const desiredDirection = grounded
    ? (canDriveOnGround ? facing : 0)
    : input.axis
  const acceleration = desiredDirection === 0
    ? (grounded ? MOTION_TUNING.groundDeceleration : MOTION_TUNING.airDeceleration)
    : (grounded ? MOTION_TUNING.groundAcceleration : MOTION_TUNING.airAcceleration)
  velocityX = moveTowards(
    velocityX,
    desiredDirection * MOTION_TUNING.maxRunSpeed,
    acceleration * dt,
  )

  const previousX = positionX
  positionX += velocityX * dt
  if (Math.abs(positionX) > MOTION_TUNING.worldLimit) {
    positionX = Math.sign(positionX) * MOTION_TUNING.worldLimit
    velocityX = 0
  }
  if (grounded && !hasSupportAt(positionX, positionY)) {
    grounded = false
    transition('fall')
  }
  if (grounded && state !== 'turn' && Math.abs(positionX - previousX) > 0) {
    locomotionPhase = (
      locomotionPhase + Math.abs(positionX - previousX) / MOTION_TUNING.strideWorldUnits
    ) % 1
  }

  if (jumpBuffer > 0 && coyoteTime > 0) {
    velocityY = MOTION_TUNING.jumpSpeed
    grounded = false
    jumpBuffer = 0
    coyoteTime = 0
    transition('jump-rise')
  }

  if (!grounded) {
    if (!input.jumpHeld && velocityY > MOTION_TUNING.jumpCutSpeed) {
      velocityY = MOTION_TUNING.jumpCutSpeed
    }
    velocityY -= MOTION_TUNING.gravity * dt
    const previousY = positionY
    positionY += velocityY * dt
    if (velocityY <= 0 && state === 'jump-rise') transition('fall')
    const landing = velocityY <= 0
      ? findLanding(positionX, previousY, positionY)
      : undefined
    if (landing !== undefined) {
      positionY = landing.rootY
      velocityY = 0
      grounded = true
      landedThisFrame = true
      transition('land')
    }
  }

  return {
    state,
    stateTime,
    facing,
    positionX,
    positionY,
    velocityX,
    velocityY,
    grounded,
    coyoteTime,
    jumpBuffer,
    locomotionPhase,
    landedThisFrame,
  }
}
