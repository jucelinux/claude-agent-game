/** Game-specific planar locomotion for the low-poly professor. */

export type ProfessorMotionName = 'idle' | 'start' | 'walk' | 'stop' | 'turn'

export type ProfessorMotionInput = {
  readonly x: number
  readonly z: number
}

export type ProfessorMotionSpawn = {
  readonly x: number
  readonly z: number
  /** Radians around Babylon's Y axis. Zero is the authored +Z facing. */
  readonly heading?: number
}

export type ProfessorMotionState = {
  readonly state: ProfessorMotionName
  readonly stateTime: number
  readonly positionX: number
  readonly positionZ: number
  readonly heading: number
  readonly speed: number
  readonly velocityX: number
  readonly velocityZ: number
  readonly locomotionPhase: number
  readonly locomotionStarted: boolean
}

export const PROFESSOR_MOTION_CONTRACT = {
  authoredForward: '+z',
  inputSpace: 'camera-relative',
  movementPolicy: 'turn-then-forward',
  phaseDriver: 'distance',
  requiredClips: ['Idle_Loop', 'Walk_Loop'],
  reviewScenarios: ['forward', 'backward', 'left', 'right', 'reverse', 'collision'],
} as const

export const PROFESSOR_MOTION_TUNING = {
  maxWalkSpeed: 1.55,
  acceleration: 4.8,
  deceleration: 6.4,
  turnRadiansPerSecond: 6.8,
  turnThresholdRadians: 0.42,
  startSeconds: 0.16,
  stopSeconds: 0.2,
  strideWorldUnits: 1.15,
} as const

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value))

const moveTowards = (value: number, target: number, distance: number): number => {
  if (Math.abs(target - value) <= distance) return target
  return value + Math.sign(target - value) * distance
}

export const shortestAngle = (from: number, to: number): number => {
  const full = Math.PI * 2
  return ((to - from + Math.PI) % full + full) % full - Math.PI
}

export function createProfessorMotionState(
  spawn: ProfessorMotionSpawn = { x: 0.85, z: -0.14 },
): ProfessorMotionState {
  const heading = spawn.heading ?? 0
  return {
    state: 'idle',
    stateTime: 0,
    positionX: spawn.x,
    positionZ: spawn.z,
    heading,
    speed: 0,
    velocityX: 0,
    velocityZ: 0,
    locomotionPhase: 0,
    locomotionStarted: false,
  }
}

export function stepProfessorMotion(
  current: ProfessorMotionState,
  input: ProfessorMotionInput,
  deltaSeconds: number,
): ProfessorMotionState {
  const dt = clamp(deltaSeconds, 0, 0.04)
  const rawMagnitude = Math.hypot(input.x, input.z)
  const inputMagnitude = clamp(rawMagnitude, 0, 1)
  const hasInput = rawMagnitude > 0.001
  const inputX = hasInput ? input.x / rawMagnitude : 0
  const inputZ = hasInput ? input.z / rawMagnitude : 0
  const desiredHeading = hasInput ? Math.atan2(inputX, inputZ) : current.heading
  const initialAngle = shortestAngle(current.heading, desiredHeading)
  const heading = current.heading + clamp(
    initialAngle,
    -PROFESSOR_MOTION_TUNING.turnRadiansPerSecond * dt,
    PROFESSOR_MOTION_TUNING.turnRadiansPerSecond * dt,
  )
  const remainingAngle = shortestAngle(heading, desiredHeading)
  const alignment = hasInput ? Math.max(0, Math.cos(remainingAngle)) : 0
  const targetSpeed = PROFESSOR_MOTION_TUNING.maxWalkSpeed * inputMagnitude * alignment
  const acceleration = targetSpeed > current.speed
    ? PROFESSOR_MOTION_TUNING.acceleration
    : PROFESSOR_MOTION_TUNING.deceleration
  let speed = moveTowards(current.speed, targetSpeed, acceleration * dt)
  let state = current.state
  let stateTime = current.stateTime + dt
  let locomotionPhase = current.locomotionPhase
  let locomotionStarted = false

  const transition = (next: ProfessorMotionName): void => {
    if (state === next) return
    state = next
    stateTime = 0
  }

  if (!hasInput) {
    if (state === 'start' || state === 'walk' || state === 'turn') transition('stop')
    if (state === 'stop' && speed <= 0.02 && stateTime >= PROFESSOR_MOTION_TUNING.stopSeconds) {
      speed = 0
      transition('idle')
    }
  } else if (Math.abs(remainingAngle) > PROFESSOR_MOTION_TUNING.turnThresholdRadians) {
    transition('turn')
  } else if (state === 'idle' || state === 'stop' || state === 'turn') {
    locomotionPhase = 0
    locomotionStarted = true
    transition('start')
  } else if (state === 'start' && stateTime >= PROFESSOR_MOTION_TUNING.startSeconds) {
    transition('walk')
  }

  const velocityX = Math.sin(heading) * speed
  const velocityZ = Math.cos(heading) * speed
  const distance = speed * dt
  if (distance > 0) {
    locomotionPhase = (
      locomotionPhase + distance / PROFESSOR_MOTION_TUNING.strideWorldUnits
    ) % 1
  }

  return {
    state,
    stateTime,
    positionX: current.positionX + velocityX * dt,
    positionZ: current.positionZ + velocityZ * dt,
    heading,
    speed,
    velocityX,
    velocityZ,
    locomotionPhase,
    locomotionStarted,
  }
}

export function reconcileProfessorMotion(
  current: ProfessorMotionState,
  positionX: number,
  positionZ: number,
  blocked: boolean,
): ProfessorMotionState {
  return {
    ...current,
    positionX,
    positionZ,
    speed: blocked ? 0 : current.speed,
    velocityX: blocked ? 0 : current.velocityX,
    velocityZ: blocked ? 0 : current.velocityZ,
  }
}
