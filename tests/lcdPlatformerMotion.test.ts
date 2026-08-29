import { describe, expect, it } from 'vitest'
import {
  createMechaMotionState,
  MECHA_MOTION_CONTRACT,
  MOTION_TUNING,
  presentMechaMotion,
  stepMechaMotion,
  type MechaMotionState,
  type MotionInput,
} from '../src/game/lcdPlatformer/motion.ts'

const DT = 1 / 60
const NONE: MotionInput = { axis: 0, jumpPressed: false, jumpHeld: false }

const advance = (
  initial: MechaMotionState,
  frames: number,
  input: MotionInput,
): MechaMotionState => {
  let state = initial
  for (let frame = 0; frame < frames; frame++) {
    state = stepMechaMotion(state, {
      ...input,
      jumpPressed: frame === 0 && input.jumpPressed,
    }, DT)
  }
  return state
}

describe('LCD mecha motion contract', () => {
  it('requires authored transition states and bidirectional review', () => {
    expect(MECHA_MOTION_CONTRACT.authoredView).toBe('profile')
    expect(MECHA_MOTION_CONTRACT.phaseDriver).toBe('distance')
    expect(MECHA_MOTION_CONTRACT.requiredStates).toEqual([
      'idle',
      'start',
      'locomotion',
      'stop',
      'turn',
      'jump-rise',
      'fall',
      'land',
    ])
    expect(MECHA_MOTION_CONTRACT.reviewScenarios).toContain('start-left')
    expect(MECHA_MOTION_CONTRACT.reviewScenarios).toContain('start-right')
    expect(MECHA_MOTION_CONTRACT.reviewScenarios).toContain('reverse')
  })

  it('starts from a known contact phase instead of revealing a hidden loop', () => {
    const initial = createMechaMotionState()
    const first = stepMechaMotion(initial, {
      axis: 1,
      jumpPressed: false,
      jumpHeld: false,
    }, DT)

    expect(first.state).toBe('start')
    expect(first.facing).toBe(1)
    expect(first.locomotionPhase).toBeGreaterThanOrEqual(0)
    expect(first.locomotionPhase).toBeLessThan(0.01)
    expect(presentMechaMotion(first).locomotionWeight).toBeLessThan(0.1)

    const moving = advance(first, 30, {
      axis: 1,
      jumpPressed: false,
      jumpHeld: false,
    })
    expect(moving.state).toBe('locomotion')
    expect(moving.velocityX).toBeGreaterThan(0)
    expect(moving.locomotionPhase).toBeGreaterThan(first.locomotionPhase)
    expect(presentMechaMotion(moving).locomotionWeight).toBe(1)
  })

  it('uses an explicit stop before returning to idle', () => {
    const moving = advance(createMechaMotionState(), 40, {
      axis: 1,
      jumpPressed: false,
      jumpHeld: false,
    })
    const stopping = stepMechaMotion(moving, NONE, DT)

    expect(stopping.state).toBe('stop')
    expect(stopping.velocityX).toBeLessThan(moving.velocityX)
    expect(presentMechaMotion(stopping).locomotionWeight).toBeGreaterThan(0.9)

    const idle = advance(stopping, 40, NONE)
    expect(idle.state).toBe('idle')
    expect(idle.velocityX).toBe(0)
    expect(presentMechaMotion(idle).locomotionWeight).toBe(0)
  })

  it('brakes through a turn before accelerating in the opposite direction', () => {
    const movingRight = advance(createMechaMotionState(), 40, {
      axis: 1,
      jumpPressed: false,
      jumpHeld: false,
    })
    const turning = stepMechaMotion(movingRight, {
      axis: -1,
      jumpPressed: false,
      jumpHeld: false,
    }, DT)

    expect(turning.state).toBe('turn')
    expect(turning.facing).toBe(-1)
    expect(turning.velocityX).toBeGreaterThanOrEqual(0)
    expect(turning.locomotionPhase).toBeLessThan(0.01)

    const movingLeft = advance(turning, 60, {
      axis: -1,
      jumpPressed: false,
      jumpHeld: false,
    })
    expect(movingLeft.state).toBe('locomotion')
    expect(movingLeft.facing).toBe(-1)
    expect(movingLeft.velocityX).toBeLessThan(0)
    expect(movingLeft.positionX).toBeLessThan(turning.positionX)
  })

  it('moves through jump rise, fall and landing without losing facing', () => {
    const launched = stepMechaMotion(createMechaMotionState(), {
      axis: -1,
      jumpPressed: true,
      jumpHeld: true,
    }, DT)
    expect(launched.state).toBe('jump-rise')
    expect(launched.facing).toBe(-1)
    expect(launched.positionY).toBeGreaterThan(MOTION_TUNING.groundY)

    let state = launched
    const visited = new Set([state.state])
    for (let frame = 0; frame < 180 && !state.landedThisFrame; frame++) {
      state = stepMechaMotion(state, {
        axis: -1,
        jumpPressed: false,
        jumpHeld: frame < 12,
      }, DT)
      visited.add(state.state)
    }

    expect(visited).toContain('fall')
    expect(state.state).toBe('land')
    expect(state.landedThisFrame).toBe(true)
    expect(state.facing).toBe(-1)
    expect(state.positionY).toBe(MOTION_TUNING.groundY)
  })
})
