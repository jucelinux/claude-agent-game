import type { MechaMotionSpawn, MotionWorld } from './motion.ts'

export const MECHA_FOOT_OFFSET = 1.01
export const PCB_ROOM_FALL_LIMIT = -4.6

export const PCB_ROOM_SPAWN: MechaMotionSpawn = {
  positionX: 0,
  positionY: 0,
  facing: 1,
}

export const PCB_ROOM_CHECKPOINT: MechaMotionSpawn = {
  positionX: 6.25,
  positionY: 0,
  facing: -1,
}

/**
 * One-way support surfaces for the first PCB chamber. Their root height is the
 * mecha pivot, while the rendered copper surface sits one foot offset below.
 */
export const PCB_ROOM_WORLD: MotionWorld = {
  surfaces: [
    { id: 'central-service-pad', left: -1.45, right: 1.45, rootY: 0 },
    { id: 'right-data-bus', left: 1.4, right: 4.3, rootY: 0 },
    { id: 'right-checkpoint-pad', left: 5.2, right: 7.4, rootY: 0 },
    { id: 'left-terminal-bank', left: -2.65, right: -1.45, rootY: 0.48 },
    { id: 'left-controller-chip', left: -5.85, right: -2.65, rootY: 1.02 },
    { id: 'left-connector', left: -7.4, right: -5.85, rootY: 0.46 },
  ],
}

export const PCB_PULSE_ROUTE = {
  left: 1.85,
  right: 4.02,
  periodMs: 2_700,
  dangerHalfWidth: 0.42,
  safeRootY: 0.62,
} as const
