/**
 * Run 8 — **the same jump, in three inks.** His proposal, and it is the frontier probe the
 * ink axis never got (`TASTE-LOOP.md` §3.0).
 *
 * The diagnosis it tests is his: form and movement are ahead, the surface is behind. The
 * design is what makes it a probe rather than a preference — **body, skeleton, parts, gait,
 * canvas, scale, frame count and every gait amplitude are held identical to
 * `gorilla-jump`**. Only the ink moves. Whatever the three samples disagree about is the
 * ink, because nothing else is free to vary.
 *
 * **Why an idiom is a palette and not a set of knobs.** The tone budget is a lock — a ramp
 * has exactly `tones.perMaterial` entries — so "spend four tones instead of eight" cannot be
 * expressed by turning a dial. That is the lock working: a budget you can quietly overrun is
 * not a budget. It also means each idiom is a grammar, which is the honest shape, because a
 * palette has always been part of the grammar and never part of the tuning.
 *
 * **The bias this exists to knock down, stated before anyone looks.** Seven consecutive runs
 * have shipped one idiom — eight tones, per-pixel speckle, no outer line — on the strength of
 * a single verdict on a single insect probe, which `TASTE.md` §2a itself recorded as *"a
 * hypothesis with one observation, not a law"*. Nothing has retested it since. This is the
 * retest, and the incumbent is in the comparison rather than assumed.
 *
 * **Prediction, recorded now so it can be scored** (the last one scored zero): the incumbent
 * loses on this body. A gorilla is a complex form, its information is in the mass and the
 * silhouette, and eight tones spread as a gradient across a narrow dark ramp compete with
 * that instead of serving it. I expect Chrono to win and Stardew to beat the incumbent too.
 *
 * stack — every colour below. portable — the finding that a complex form wants regions where
 * a simple one wanted gradient, **if** the reading supports it.
 */
import type { Grammar, Palette, Part } from '../../core/types.ts'
import { gorillaJump } from '../run7/actions.ts'

/**
 * **Stardew — the control.** Four tones, warm and light, and a real outer line.
 *
 * The idiom's actual commitments: no per-pixel noise, no rim, near-flat ambient light, and
 * a palette that lives well above the ground instead of hugging the dark end. The current
 * gorilla's lightest fur is a mid grey; every tone here is warmer and the range is wider,
 * which is what four tones need in order to read as four rather than as a smudge.
 */
const STARDEW: Palette = {
  name: 'gorilla-stardew',
  colors: [
    [0, 0, 0],
    // fur — warm brown-grey, four clearly separated steps
    [48, 38, 44],
    [86, 68, 66],
    [130, 106, 96],
    [178, 154, 134],
    // hide — the face, knuckles and feet; cooler and a step darker throughout
    [32, 26, 30],
    [58, 48, 50],
    [88, 76, 74],
    [124, 110, 104],
    // ink — the outline. Dark, never pure black: a black ring on a mid-grey page reads as
    // a sticker cut out of the background rather than as a drawn edge.
    [16, 12, 16],
    [24, 19, 24],
    [34, 28, 33],
    [46, 39, 45],
  ],
  ramps: [
    { material: 'fur', indices: [1, 2, 3, 4] },
    { material: 'hide', indices: [5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12] },
  ],
}

/**
 * **Chrono — the target, and the declared bar for silhouette and value separation.**
 *
 * Five tones, and the whole point is the *range*: the darkest fur is nearly black and the
 * lightest is a warm cream, so the light side and the shadow side are two different values
 * rather than two neighbours. Shadows lean cool and purple, highlights lean warm — the one
 * trick that makes a five-tone ramp look like more than five.
 */
const CHRONO: Palette = {
  name: 'gorilla-chrono',
  colors: [
    [0, 0, 0],
    // fur — cool deep shadow to warm highlight, across a genuinely wide range
    [30, 24, 34],
    [58, 46, 58],
    [96, 78, 82],
    [142, 118, 112],
    [196, 172, 152],
    // hide
    [24, 18, 26],
    [46, 34, 40],
    [74, 58, 60],
    [108, 88, 86],
    [148, 126, 118],
    // ink — a violet-black, so the outline belongs to the same world as the shadows
    [14, 10, 18],
    [20, 15, 25],
    [28, 21, 33],
    [38, 29, 43],
    [50, 39, 55],
  ],
  ramps: [
    { material: 'fur', indices: [1, 2, 3, 4, 5] },
    { material: 'hide', indices: [6, 7, 8, 9, 10] },
    { material: 'ink', indices: [11, 12, 13, 14, 15] },
  ],
}

/**
 * Re-ink the body without touching it. The one thing that cannot survive the move untouched
 * is `shift`, the far-side cheat: it is measured in **steps of a ramp**, so -2 on an
 * eight-tone ramp is a quarter of the range and the same -2 on four tones is half of it. Both
 * idioms land on -1 by that ratio, which is the smallest cheat that still exists — below one
 * step there is no such thing as a partial tone.
 */
function reInk(palette: Palette, tones: number): readonly Part[] {
  return gorillaJump.parts.map((part) => {
    if (part.shift === undefined) return part
    const scaled = Math.round(part.shift * (tones / 8))
    return { ...part, shift: scaled === 0 ? Math.sign(part.shift) : scaled }
  })
}

export const gorillaJumpStardew: Grammar = {
  ...gorillaJump,
  name: 'gorilla-jump-stardew',
  palette: STARDEW,
  parts: reInk(STARDEW, 4),
}

export const gorillaJumpChrono: Grammar = {
  ...gorillaJump,
  name: 'gorilla-jump-chrono',
  palette: CHRONO,
  parts: reInk(CHRONO, 5),
}
