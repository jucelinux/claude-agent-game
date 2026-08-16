/**
 * Run 13 — **the gorilla stands still**, which turns out to be the hardest of his gaits and
 * the one the mechanic needs most.
 *
 * His ask of 16/08: *"também quero estado em idle do gorila"*. Until now a player who let go
 * of the keys got frame 0 of the walk held forever, and a held frame does not read as
 * standing — it reads as a bug. **An idle is not the absence of an animation. It is the
 * animation a body plays when it is doing nothing**, and a body playing nothing is a
 * cardboard cutout.
 *
 * **What makes an idle read, and all three are timing rather than shape:**
 *
 * 1. **It is slower than everything else.** 16 frames at 110 ms is 1760 ms — three strides.
 *    Anything near the walk's speed reads as a walk in place.
 * 2. **Its parts do not agree with each other.** The chest breathes on the full cycle, the
 *    head looks on a half of it, the far arm shifts on a third. Three periods that do not
 *    divide each other means the pose never repeats inside the loop, so the eye cannot find
 *    the seam. A single sine on everything is a machine idling, not an animal resting.
 * 3. **The weight is somewhere.** A gorilla on its knuckles rocks slightly forward and back
 *    between its arms and its hips, and that shift is the only thing in this file that says
 *    the animal is heavy — which is the axis this project has been measured on since run 5.
 *
 * Same body as run 5, unchanged. Only the gait differs, which is the claim the grammar has
 * been making since day zero.
 */
import type { Gait, Grammar } from '../../core/types.ts'
import { gorilla } from '../run5/gorilla.ts'

/**
 * Eight named phases over 16 frames, so every key lands on a whole frame at eighths. Eight
 * rather than four because a breath has a hold at the top and a longer fall than rise, and
 * four phases cannot express an asymmetric curve — the shape of a breath *is* the asymmetry.
 */
const IDLE: Gait = {
  name: 'idle',
  phases: [
    { name: 'rest', at: 0 },
    { name: 'draw', at: 2 / 16 },
    { name: 'full', at: 4 / 16 },
    { name: 'hold', at: 6 / 16 },
    { name: 'fall', at: 8 / 16 },
    { name: 'settle', at: 10 / 16 },
    { name: 'shift', at: 12 / 16 },
    { name: 'return', at: 14 / 16 },
  ],
  tracks: [
    // **The breath.** Rises over three phases, holds one, falls over four. `gait.lift` is
    // 2.2 px on this body, so a key of 1 is about two pixels — which is all a breath is at
    // this size, and one more would be a pant.
    { bone: 'chest', channel: 'y', keys: [0, -0.55, -1, -0.9, -0.35, 0.1, 0.15, 0.05] },
    { bone: 'chest', channel: 'scaleY', keys: [0, 0.012, 0.022, 0.02, 0.008, -0.004, -0.004, 0] },
    { bone: 'chest', channel: 'angle', keys: [0, -0.1, -0.16, -0.14, -0.04, 0.06, 0.1, 0.04] },

    // **The weight shift, on a period that does not divide the breath's.** It runs once over
    // the whole cycle against the breath's rise-and-fall, and it is offset so the two never
    // peak together. The hips lead and the shoulders follow, which is the same quarter-phase
    // lag the walk uses and the same fact about bodies.
    { bone: 'hips', channel: 'x', keys: [0, 0.3, 0.55, 0.5, 0.2, -0.25, -0.5, -0.3] },
    { bone: 'hips', channel: 'y', keys: [0, 0.1, 0.2, 0.25, 0.15, -0.05, -0.15, -0.1] },

    // **The look.** Twice per cycle, and it is the one part fast enough to notice — a resting
    // animal's head is the only thing on it that moves with intent. The neck leads and the
    // head arrives late, so the turn has a body behind it.
    { bone: 'neck', channel: 'angle', keys: [0, 0.14, 0.05, -0.12, -0.18, -0.04, 0.12, 0.1] },
    { bone: 'head', channel: 'angle', keys: [0.05, 0.02, 0.2, 0.12, -0.08, -0.22, -0.06, 0.14] },

    // The arms take the weight shift through the knuckles, a third of a phase behind the
    // hips. Barely anything, and its absence is what makes a standing sprite look propped.
    { bone: 'armNU', channel: 'angle', keys: [0, -0.06, -0.1, -0.08, -0.02, 0.05, 0.09, 0.05] },
    { bone: 'armFU', channel: 'angle', keys: [0.02, 0.06, 0.09, 0.05, -0.02, -0.07, -0.1, -0.05] },
    { bone: 'armNL', channel: 'angle', keys: [0, 0.03, 0.05, 0.04, 0.01, -0.02, -0.04, -0.02] },
    { bone: 'legNU', channel: 'angle', keys: [0, 0.02, 0.04, 0.05, 0.03, -0.01, -0.04, -0.03] },
    { bone: 'legFU', channel: 'angle', keys: [0.01, -0.01, -0.03, -0.04, -0.02, 0.02, 0.04, 0.02] },
  ],
}

export const gorillaIdle: Grammar = { ...gorilla, name: 'gorilla-idle', gait: IDLE }
