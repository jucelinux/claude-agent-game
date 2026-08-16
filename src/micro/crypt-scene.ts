/**
 * **Micro game 4: the run.** His commission, 16/08, delivered without back-and-forth.
 *
 * > *"Nesse microjogo controlamos uma caveira fugindo da morte. Será um jogo estilo a página de
 * > offline do google, em que o dinossauro está correndo infinitamente. Nesse jogo a caveira pula
 * > das lápides e o diferencial aqui é que a caveira tem um pulo duplo em que ela projeta um
 * > salto mortal para frente. Quero um acabamento e familiaridade com o SOTN."*
 *
 * ## The differentiator did not need 3D, and that is this round's first finding
 *
 * He gave me this sentence expecting it to demand pitch and roll — I had asked for a commission
 * that needed them. **It does not.** A forward somersault seen from the side is a rotation in the
 * screen plane, which is precisely what `Bone.angle` has always been.
 *
 * **What it demanded instead was a gap nobody had noticed.** Every gait here was periodic by
 * construction, so the curve is a cyclic Hermite and the segment after the last phase leads back
 * to the first. A full turn is not a cycle. Authored as an ordinary track the flip climbed to
 * 270 degrees and then **unwound** — measured at 193, then 77, before a pixel was drawn. The
 * skull turned three quarters of the way over and rolled backwards out of it.
 *
 * `Gait.wrap: false` is eleven lines and it unlocks every action that ends somewhere other than
 * where it started: a death, a door, a transformation. **The commission demanded a foundation;
 * it was simply not the foundation either of us predicted.**
 *
 * ## SOTN, read as a value distribution rather than a set of colours
 *
 * Symphony of the Night reads because its bright end is *rationed*. Near-black cool grounds, a
 * thin band of very bright accent, and almost nothing in between.
 *
 * That agrees with the 15/08 ink verdict instead of fighting it. The verdict selected a **wide
 * value range**; SOTN spends that range with the mass at the dark end. So the bone runs 18 to
 * 244, the widest in the project, with four of its five tones below the midpoint — and the
 * reaper's cloth tops out at 62, so she is a hole in the picture rather than a figure in it.
 *
 * ## Death is one number
 *
 * She has no plan and no pathfinding. `menace` runs 0 to 1: time pushes it up, hitting a stone
 * shoves it, clearing one gives a little back, and her position on screen is that number read as
 * a distance. At 1 she arrives.
 *
 * **A chaser with a plan would be a mechanism nobody could feel. A gap that closes is one a
 * player reads without being told.**
 */
import type { Scene } from '../scene/types.ts'

/** Wet granite under a low moon. The floor a runner reads at speed, so it is not subtle. */
const SOIL: readonly [number, number, number][] = [
  [14, 12, 22],
  [30, 28, 44],
  [48, 46, 66],
  [70, 68, 92],
]

/** Night, from the horizon up. Indigo over a bruise over black. */
const NIGHT: readonly [number, number, number][] = [
  [10, 8, 20],
  [16, 13, 30],
  [26, 20, 44],
  [40, 28, 58],
  [58, 36, 66],
  [78, 46, 70],
]

export const cryptScene: Scene = {
  name: 'crypt',
  /**
   * **Landscape, and it is the genre's shape.** A runner needs to see three obstacles ahead or
   * every death is unfair. 240×150 at ×4 is 960×600 — the widest world here and the chunkiest
   * pixel, which is the SOTN register and also what his second reading on the kitten asked for.
   */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 112,
  nearRow: 150,
  haze: 0,
  sky: [10, 8, 20],
  groundRamp: SOIL,
  placements: [
    {
      grammar: 'bones-run', tunables: 'bones', x: 54, depth: 0, anchor: 'foot',
      clips: {
        run: { grammar: 'bones-run', tunables: 'bones' },
        leap: { grammar: 'bones-leap', tunables: 'bones-leap' },
        flip: { grammar: 'bones-flip', tunables: 'bones-flip' },
      },
      runs: { run: 'run', leap: 'leap', flip: 'flip' },
    },
  ],
  runner: {
    groundRow: 112,
    // He is held a quarter into the screen: enough room behind him for Death to be visible and
    // enough ahead to read three stones.
    holdX: 62,
    /**
     * **The two numbers the whole game rests on, and the second jump is the reason for both.**
     *
     * The world starts at 108 px/s and gains 2.6 every second. Everything else about the
     * difficulty follows from that one ramp: the gap between stones shrinks in *time* without
     * shrinking in *space*, so the graveyard never gets denser and the player only gets less
     * warning. That is the dinosaur's whole curve and it needs no schedule.
     */
    speed: 108,
    accel: 2.6,
    // 175 px/s, and the cap is set by the WORST gap rather than the average one — see `spacing`.
    maxSpeed: 175,
    gravity: 430,
    /**
     * **Two impulses, and the second one is the commission.**
     *
     * 137 px/s against 430 px/s² gives an apex of **22 px** — enough for the broken stump at 11
     * and the slab at 18, and not enough for the cross at 26. The somersault adds 110 px/s from
     * wherever he happens to be, which takes the apex to **36 px**.
     *
     * **So a third of the graveyard is unreachable without the flip.** That is the difference
     * between a differentiator and a decoration, and the three obstacle heights were set from
     * these two numbers rather than the other way round.
     */
    jump: 137,
    /**
     * **150, and it was 110.** His reading: *"a projeção do pulo duplo deveria garantir mais
     * altura, concorda?"* — and yes. At 110 the second press bought 14 px on top of 22, which is
     * less than half a body: a player pressed twice and could not see what the second press had
     * done. At 150 it buys 26 and the apex reaches **48 px**, which is a body and a half.
     */
    flip: 150,
    // 41 px: a sprinting figure covers about 1.2 of its own height per stride, and he is 34.
    // That gives 2.6 strides a second at the starting speed and 4.3 at the cap.
    strideLen: 41,
    stones: [
      { grammar: 'tomb-broken', tunables: 'crypt' },
      { grammar: 'tomb-slab', tunables: 'crypt' },
      { grammar: 'tomb-broken', tunables: 'crypt' },
      { grammar: 'tomb-cross', tunables: 'crypt' },
      { grammar: 'tomb-slab', tunables: 'crypt' },
    ],
    /**
     * **160 apart with 40 of jitter, and the second number cost a lock to get right.**
     *
     * The jitter only ever ADDS, so I wrote that the base spacing was a floor on every gap. It
     * is not: the gap between two stones is `spacing + jitter(k) - jitter(k-1)`, so the worst
     * case is `spacing - jitterX`. **That is the same mistake, in the same shape, as the climb's
     * band height** — jitter compounds across a pair, and writing it down once did not stop me
     * making it twice.
     *
     * At 130 and 70 the worst pair was 61 px, which at the speed cap arrives 0.32 s apart
     * against a jump that hangs for 0.64 — a player could be landing on the second stone before
     * he had come down off the first, with no input that would have saved him. At 160 and 40 the
     * worst pair is 120 px and 0.69 s, which clears the hang.
     */
    // 210 px of clear ground before the first stone: about two seconds at the starting speed,
    // which is long enough to see what the game is before it asks anything.
    leadIn: 210,
    spacing: 160,
    jitterX: 40,
    // The body is 30 px wide with the shroud, and 11 is the ribcage rather than the rag: a cape
    // that kills you is a cape a player will hate.
    bodyHalfW: 11,
    // The cross is 13 px across at its arms and the slab 13 at its base. 7 is the plinth, not
    // the moss — the same reasoning as the climb's plank, where a leaf is not a floor.
    stoneHalfW: 7,
    // 34 px is the skeleton's own height, so the score counts his own body lengths.
    pxPerMetre: 34,
    /**
     * **Death, tuned so a clean run holds her and a clumsy one does not.**
     *
     * `creep` 0.012 fills the gap in 83 seconds of flawless running. One collision costs 0.17,
     * which is fourteen seconds gained — so six hits end a run. Clearing a stone gives 0.02
     * back, which at speed is roughly what the creep takes, so **skill buys time and nothing
     * else**. She never retreats past where she started.
     */
    reaper: {
      grammar: 'death', tunables: 'death',
      creep: 0.012, hit: 0.17, relief: 0.02, fromX: -34,
    },
    skyRamp: NIGHT,
    stars: { count: 120, colors: [[70, 66, 96], [128, 122, 158], [206, 202, 224]], seed: 41, below: 96 },
    // Low and large, near the horizon behind the stones. A low moon is what puts a rim on a
    // skull instead of a wash over it, and `tunables/bones.json` sets the lamp to match.
    moon: { x: 196, y: 44, r: 15, color: [226, 224, 206], halo: [46, 42, 66] },
    seed: 83,
  },
}
