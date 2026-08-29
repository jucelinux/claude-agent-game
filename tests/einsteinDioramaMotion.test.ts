import { describe, expect, it } from 'vitest'
import {
  createProfessorMotionState,
  PROFESSOR_MOTION_CONTRACT,
  PROFESSOR_MOTION_TUNING,
  reconcileProfessorMotion,
  shortestAngle,
  stepProfessorMotion,
  type ProfessorMotionInput,
  type ProfessorMotionState,
} from '../src/game/einsteinDiorama/motion.ts'

const DT = 1 / 60
const NONE: ProfessorMotionInput = { x: 0, z: 0 }

function advance(
  initial: ProfessorMotionState,
  frames: number,
  input: ProfessorMotionInput,
): ProfessorMotionState {
  let state = initial
  for (let frame = 0; frame < frames; frame++) state = stepProfessorMotion(state, input, DT)
  return state
}

describe('low-poly professor locomotion contract', () => {
  it('uses camera-relative input but only moves along the authored forward axis', () => {
    expect(PROFESSOR_MOTION_CONTRACT.authoredForward).toBe('+z')
    expect(PROFESSOR_MOTION_CONTRACT.movementPolicy).toBe('turn-then-forward')
    expect(PROFESSOR_MOTION_CONTRACT.requiredClips).toEqual(['Idle_Loop', 'Walk_Loop'])

    const moving = advance(createProfessorMotionState({ x: 0, z: 0 }), 60, { x: 1, z: 1 })
    const velocityHeading = Math.atan2(moving.velocityX, moving.velocityZ)
    expect(Math.abs(shortestAngle(moving.heading, velocityHeading))).toBeLessThan(0.0001)
    expect(moving.speed).toBeCloseTo(PROFESSOR_MOTION_TUNING.maxWalkSpeed, 3)
  })

  it('turns before translating when input begins behind the character', () => {
    let state = createProfessorMotionState({ x: 0, z: 0, heading: 0 })
    state = stepProfessorMotion(state, { x: 0, z: -1 }, DT)
    expect(state.state).toBe('turn')
    expect(state.speed).toBe(0)
    expect(state.positionZ).toBe(0)

    state = advance(state, 40, { x: 0, z: -1 })
    expect(state.state).toMatch(/start|walk/)
    expect(state.positionZ).toBeLessThan(0)
    expect(Math.abs(shortestAngle(state.heading, Math.PI))).toBeLessThan(0.08)
  })

  it('starts the walk clip from a known phase and brakes into idle', () => {
    const first = stepProfessorMotion(createProfessorMotionState(), { x: 0, z: 1 }, DT)
    expect(first.state).toBe('start')
    expect(first.locomotionStarted).toBe(true)
    expect(first.locomotionPhase).toBeLessThan(0.01)

    const walking = advance(first, 30, { x: 0, z: 1 })
    expect(walking.state).toBe('walk')
    expect(walking.speed).toBeGreaterThan(1)

    const stopping = stepProfessorMotion(walking, NONE, DT)
    expect(stopping.state).toBe('stop')
    expect(stopping.speed).toBeLessThan(walking.speed)
    const idle = advance(stopping, 40, NONE)
    expect(idle.state).toBe('idle')
    expect(idle.speed).toBe(0)
  })

  it('normalizes diagonal input and stops animation drive when Babylon blocks motion', () => {
    const straight = advance(createProfessorMotionState({ x: 0, z: 0 }), 90, { x: 0, z: 1 })
    const diagonal = advance(createProfessorMotionState({ x: 0, z: 0 }), 90, { x: 1, z: 1 })
    expect(diagonal.speed).toBeCloseTo(straight.speed, 5)

    const blocked = reconcileProfessorMotion(diagonal, 1.2, -0.4, true)
    expect(blocked.positionX).toBe(1.2)
    expect(blocked.positionZ).toBe(-0.4)
    expect(blocked.speed).toBe(0)
    expect(blocked.velocityX).toBe(0)
    expect(blocked.velocityZ).toBe(0)
  })
})
