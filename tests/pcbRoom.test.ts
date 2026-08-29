import { describe, expect, it } from 'vitest'
import {
  createMechaMotionState,
  stepMechaMotion,
  type MechaMotionState,
  type MotionInput,
} from '../src/game/lcdPlatformer/motion.ts'
import {
  PCB_ROOM_CHECKPOINT,
  PCB_ROOM_SPAWN,
  PCB_ROOM_WORLD,
} from '../src/game/lcdPlatformer/pcbRoom.ts'

const DT = 1 / 60

const advanceUntilLanding = (
  initial: MechaMotionState,
  frames: number,
  input: MotionInput,
): MechaMotionState => {
  let state = initial
  for (let frame = 0; frame < frames; frame++) {
    state = stepMechaMotion(state, {
      ...input,
      jumpPressed: frame === 0 && input.jumpPressed,
    }, DT, PCB_ROOM_WORLD)
    if (state.landedThisFrame) return state
  }
  return state
}

describe('PCB pilot room traversal', () => {
  it('starts on the central service pad at the visual origin', () => {
    const state = createMechaMotionState(PCB_ROOM_SPAWN)
    const central = PCB_ROOM_WORLD.surfaces.find((surface) => (
      surface.id === 'central-service-pad'
    ))

    expect(state.positionX).toBe(0)
    expect(state.positionY).toBe(0)
    expect(central?.rootY).toBe(state.positionY)
  })

  it('falls when walking into the broken right trace without jumping', () => {
    let state = createMechaMotionState({ positionX: 4.12, positionY: 0, facing: 1 })
    for (let frame = 0; frame < 24; frame++) {
      state = stepMechaMotion(state, {
        axis: 1,
        jumpPressed: false,
        jumpHeld: false,
      }, DT, PCB_ROOM_WORLD)
    }

    expect(state.grounded).toBe(false)
    expect(state.state).toBe('fall')
    expect(state.positionY).toBeLessThan(0)
  })

  it('can clear the broken trace and land on the checkpoint pad', () => {
    let approach = createMechaMotionState({ positionX: 2.65, positionY: 0, facing: 1 })
    for (let frame = 0; frame < 28; frame++) {
      approach = stepMechaMotion(approach, {
        axis: 1,
        jumpPressed: false,
        jumpHeld: false,
      }, DT, PCB_ROOM_WORLD)
    }
    const landed = advanceUntilLanding(
      approach,
      120,
      { axis: 1, jumpPressed: true, jumpHeld: true },
    )

    expect(landed.landedThisFrame).toBe(true)
    expect(landed.positionY).toBe(PCB_ROOM_CHECKPOINT.positionY)
    expect(landed.positionX).toBeGreaterThan(5.2)
  })

  it('can jump from the service pad onto the raised terminal bank', () => {
    const landed = advanceUntilLanding(
      createMechaMotionState({ positionX: -0.95, positionY: 0, facing: -1 }),
      120,
      { axis: -1, jumpPressed: true, jumpHeld: true },
    )

    expect(landed.landedThisFrame).toBe(true)
    expect(landed.positionY).toBe(0.48)
    expect(landed.positionX).toBeLessThan(-1.45)
    expect(landed.positionX).toBeGreaterThan(-2.65)
  })
})
