/**
 * Run 7 — **the gorilla jumps, and the gorilla hits.** His proposal, and it replaces the
 * transformation: validate the body by giving it things to *do*, not another costume.
 *
 * Why these two and not more:
 *
 *  - **The jump is the weight test.** Weight is the only axis other than form that has ever
 *    landed here — "dá pra sentir seu peso caindo" — and a walk only ever shows a quarter
 *    of it. A jump is anticipation, extension, hang, and an impact that has to be absorbed;
 *    all four are timing, and timing is the half of animation this engine is actually good
 *    at, because phases carry it as data rather than as drawing.
 *  - **The attack is the depth test.** A fist that winds up behind the torso and lands in
 *    front of it is one part that changes which side of a mass it is on, inside one cycle.
 *    No paint order expresses that, and until this round nothing here could have.
 *
 * Both are the same body as run 5, unchanged: same skeleton, same parts, same palette. Only
 * the gait differs, which is the claim the grammar has been making since day zero — that an
 * action is data over an existing body and not a redrawing of it. **If that claim is false,
 * these two files are where it breaks**, and they cost one gait each to find out.
 *
 * Timing is authored on a **12-frame grid** so every named phase lands on a real frame; a
 * phase between frames is a key pose nobody ever sees, and the export contract already
 * refuses it.
 *
 * stack — every number. portable — anticipation is longer than impact, and depth travel as
 * the way an arm crosses a body.
 */
import type { Gait, Grammar } from '../../core/types.ts'
import { gorilla } from '../run5/gorilla.ts'

/**
 * **The jump.** Six phases, and the spacing is the animation: three frames of crouch, one
 * single frame from contact to the bottom of the absorb. A heavy body takes a long time to
 * decide to leave the ground and no time at all to arrive.
 */
const JUMP: Gait = {
  name: 'jump',
  phases: [
    { name: 'settle', at: 0 },
    { name: 'crouch', at: 3 / 12 },
    { name: 'launch', at: 5 / 12 },
    { name: 'air', at: 7 / 12 },
    { name: 'land', at: 9 / 12 },
    { name: 'absorb', at: 10 / 12 },
  ],
  tracks: [
    // The body. `y` is down, so the apex is the negative one. The hips lead and the chest
    // arrives late — the same quarter-phase lag that made the walk read as mass rather than
    // as a bouncing toy, reused here because it is the same fact about bodies.
    { bone: 'hips', channel: 'y', keys: [0, 0.5, -0.2, -1, 0.15, 0.65] },
    { bone: 'chest', channel: 'y', keys: [0, 0.4, -0.35, -0.95, 0.35, 0.5] },
    // Pitch: down over the knees to gather, open at launch, tuck in the air, catch nose-up.
    { bone: 'chest', channel: 'angle', keys: [0, 0.135, -0.2, -0.045, 0.225, 0.11] },
    { bone: 'neck', channel: 'angle', keys: [0, 0.07, -0.135, -0.02, 0.16, 0.09] },
    // The head is the last thing to know anything. It looks up before the launch and snaps
    // down a frame after the feet land, which is the whole of what "heavy" means here.
    { bone: 'head', channel: 'angle', keys: [0, -0.045, -0.16, 0.045, 0.07, 0.225] },

    // The legs fold and fire. Femur forward as the body sinks, driven back through the
    // launch, tucked at the apex, reaching to catch, folded again to absorb.
    { bone: 'legNU', channel: 'angle', keys: [0, 0.38, -0.44, 0.57, 0.51, 0.44] },
    { bone: 'legNL', channel: 'angle', keys: [0.1, 0.62, 0.05, 0.56, 0.68, 0.75] },
    // **The far leg is staggered forward at every key, not merely scaled down.** The first
    // pass gave it the near leg's shape at nine tenths of the amplitude, and the far foot
    // came back absent in all twelve frames: two limbs on the same arc are one limb, and
    // the solver is right to draw one. The offset is what makes it a pair.
    { bone: 'legFU', channel: 'angle', keys: [0.14, 0.52, -0.3, 0.71, 0.65, 0.58] },
    { bone: 'legFL', channel: 'angle', keys: [0.14, 0.55, 0.02, 0.49, 0.61, 0.68] },

    // The arms throw. A gorilla's arms are longer than its legs and they carry real mass:
    // they swing back to load, up and forward through the launch, and hang at the apex.
    { bone: 'armNU', channel: 'angle', keys: [0, -0.44, 0.7, 0.25, -0.32, -0.15] },
    { bone: 'armNL', channel: 'angle', keys: [0, 0.28, 0.02, 0.14, 0.38, 0.24] },
    // The far arm swings wider and lags, for the same reason the far leg is staggered.
    { bone: 'armFU', channel: 'angle', keys: [0, -0.62, 0.5, 0.42, -0.2, -0.05] },
    { bone: 'armFL', channel: 'angle', keys: [0, 0.22, 0.03, 0.1, 0.32, 0.2] },

    // **Squash and stretch, on the root, so the whole body carries it.** Run 7 wanted this
    // and worked around its absence: there was only a uniform scale then, and a uniform
    // scale makes a body smaller rather than flatter. The keys are small on purpose — past
    // about a tenth the animal stops being an animal and becomes rubber.
    { bone: 'hips', channel: 'scaleX', keys: [0, 0.06, -0.05, -0.03, 0.1, 0.07] },
    { bone: 'hips', channel: 'scaleY', keys: [0, -0.08, 0.09, 0.05, -0.12, -0.09] },
  ],
}

/**
 * **The attack** — a wind-up and an overhead slam onto the knuckles.
 *
 * Five phases, and one of the gaps is a single frame: `strike` to `impact`. Everything
 * before it is slow enough to be read as intention, and the hit itself is not readable at
 * all, which is what makes it land.
 *
 * The `z` track on the near arm is the round's demonstration. At the wind-up the fist is at
 * depth +0.6 of the amplitude — behind the chest's front surface, so the torso swallows it
 * — and at the strike it is far in front of every other part on the body. One part, one
 * cycle, both sides of a mass.
 */
const ATTACK: Gait = {
  name: 'attack',
  phases: [
    { name: 'ready', at: 0 },
    { name: 'wind', at: 4 / 12 },
    { name: 'strike', at: 7 / 12 },
    { name: 'impact', at: 8 / 12 },
    { name: 'recover', at: 10 / 12 },
  ],
  /**
   * **Authored against `gait.swing` = 0.4, not the project's 0.1, and that was a finding
   * rather than a preference.** The first pass used the walk's amplitude and the absence
   * lock killed it: the far arm rendered 0 or 1 pixels in all twelve frames. The cause was
   * not the depth solver doing its job too well — it was that 0.1 turn caps every angle on
   * the body at 36°, and an arm that never rises past 36° never leaves the torso's outline,
   * so the only thing keeping the near arm visible was being in front. A walk's amplitude
   * cannot express a strike. Every key below is therefore a fraction of 144°.
   */
  tracks: [
    // The torso rears back to load and drives through: about 18°, which is forty times the
    // roll it takes in a walk and still the second-biggest angle here.
    { bone: 'chest', channel: 'angle', keys: [0, -0.125, 0.1, 0.14, 0.02] },
    { bone: 'chest', channel: 'y', keys: [0, -0.6, 0.3, 0.8, 0.15] },
    { bone: 'hips', channel: 'y', keys: [0, -0.2, 0.2, 0.5, 0.1] },
    { bone: 'neck', channel: 'angle', keys: [0, -0.09, 0.1, 0.14, 0.012] },
    { bone: 'head', channel: 'angle', keys: [0, -0.125, 0.075, 0.15, 0.025] },

    // The near arm rises to about the horizontal — which is the pose that finally clears
    // the chest's own outline — and comes down past vertical to land on the knuckles.
    { bone: 'armNU', channel: 'angle', keys: [0, -0.625, 0.174, 0.243, 0.035] },
    { bone: 'armNL', channel: 'angle', keys: [0, 0.35, 0.02, -0.02, 0.08] },
    // **The depth travel.** Positive is away from the viewer: the fist tucks behind the
    // torso to load and comes out past everything to hit.
    { bone: 'armNU', channel: 'z', keys: [0, 0.6, -0.5, -0.55, -0.1] },

    // The far arm goes **higher** at the wind-up and lands a beat later. Higher is not
    // decoration: it is the only way a limb behind the mass gets seen at all, and the round
    // learned that by measuring it rather than by looking, because the eye had nothing to
    // look at. The lag is what makes the slam two impacts instead of one.
    { bone: 'armFU', channel: 'angle', keys: [0, -0.75, 0.05, 0.2, 0.03] },
    { bone: 'armFL', channel: 'angle', keys: [0, 0.3, 0.03, -0.01, 0.06] },

    // The stance braces. The legs do not swing here; they take the load and give it back.
    { bone: 'legNU', channel: 'angle', keys: [0, 0.075, -0.04, 0.11, 0.025] },
    { bone: 'legNL', channel: 'angle', keys: [0, 0.16, 0.3, 0.1, 0.2] },
    // **The far leg is staggered forward through the whole gait — every key is positive.**
    // Squared up it sat exactly behind its twin and the depth solver correctly rendered
    // none of it: the far foot came back absent in all twelve frames, which is a true
    // answer to a badly posed question. An animal bracing for a hit widens its stance, so
    // the fix is the stance and not the solver.
    { bone: 'legFU', channel: 'angle', keys: [0.1, 0.16, 0.06, 0.2, 0.11] },
    { bone: 'legFL', channel: 'angle', keys: [0.02, 0.2, 0.26, 0.08, 0.16] },
  ],
}

export const gorillaJump: Grammar = { ...gorilla, name: 'gorilla-jump', gait: JUMP }
export const gorillaAttack: Grammar = { ...gorilla, name: 'gorilla-attack', gait: ATTACK }
