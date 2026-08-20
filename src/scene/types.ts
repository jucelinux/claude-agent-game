/**
 * **A scene: the data, and nothing that draws it.**
 *
 * This file used to be called `compose.ts` and it used to contain a **second renderer**. That
 * renderer took a scene and produced a frozen list of finished pictures, for a gallery; the one
 * in `layers.ts` ships the arrangement to the browser and lets the game compose every frame from
 * live state. Two code paths drawing the same world, with nothing comparing them, and they
 * agreed only because they shared the four depth functions at the bottom of this file.
 *
 * **It is one path now, and the reason is his, 16/08:**
 *
 * > *"só faz sentido desenhar se for em uma cena de jogo. O objetivo deste projeto é sairmos com
 * > um arranjo (harness, engine, recursos) que lhe permitam criar jogos. Então acredito que o
 * > subproduto aqui deva ser uma única coisa."*
 *
 * The frozen renderer answered a question from the era when the deliverable was a drawing — *do
 * these subjects belong to one game* — and it was superseded **the same day it was written**, by
 * a commission that needed a gorilla somebody could steer. It then survived thirteen commits
 * with exactly one caller: a 29-line script that rendered one gallery picture. **A second
 * implementation of a rule is two rules eventually**, and this one was two rules that nobody was
 * spending.
 *
 * What is left here is the vocabulary — what a scene *is* — in the same shape and for the same
 * reason as `core/types.ts`: everything is data, so an agent writes a world by writing text.
 * portable.
 */
import type { RGB } from '../core/types.ts'

export type Placement = {
  readonly grammar: string
  readonly tunables: string
  /** Where this subject's own origin lands in the scene. */
  readonly x: number
  /** Only for a `sky` subject, which has no contact row: places the origin outright. */
  readonly y?: number
  /** Overrides `body.scale`, so subjects can agree about how big they are. */
  readonly scale?: number
  /** Overrides the subject's own frame duration, to make its cycle divide the scene's. */
  readonly msPerFrame?: number
  /**
   * **Distance, and it is the only statement of it: 0 at the camera, 1 at the horizon.**
   *
   * The row this subject stands on, how much haze it carries and where it falls in the paint
   * order are all *derived* from this one number. That is the correction his fourth reading
   * asked for, and it is a correction to the engine rather than to the scene.
   *
   * **What it replaces and why.** Distance used to be stated twice — `recede` for the haze
   * and `baseY` for the row — with nothing tying them together. Two independent fields for
   * one fact means the two can disagree, and they did: trees drawn behind the gorilla with
   * their bases below his feet, which is a picture saying "further away" and "nearer" about
   * the same object. **The fix is not to check for the contradiction. It is to remove the
   * ability to express it.**
   */
  readonly depth?: number
  /**
   * How the sprite meets the row its depth puts it on.
   *
   * - `origin` — the sprite's own origin lands there. Right when the author put the origin at
   *   the ground contact, which is every tree. Exact, and it measures nothing.
   * - `foot` — the lowest painted pixel lands there. Right when the origin is somewhere else:
   *   the gorilla's is his hips.
   *
   * The distinction cost two readings on its own. `foot` on a tree lifts the trunk base by
   * however much its roots paint below it; `origin` on the gorilla buries him to the waist.
   */
  readonly anchor?: 'origin' | 'foot'
  /**
   * **Above the world rather than in it.** No floor, no ground haze, drawn before everything.
   *
   * A cloud is the case. It has no contact row, so `y` places it directly, and hazing it with
   * the *forest's* haze would be wrong twice over — thirty kilometres of air is not fifty
   * metres of trees, and a cloud is not behind the canopy because it is far, it is behind it
   * because it is sky.
   */
  readonly sky?: boolean
  /** Offset into its own cycle, 0..1, so two of the same subject are not in lockstep. */
  readonly phase?: number
  readonly seed?: number
  /**
   * **Continuous motion, in seconds rather than in frames.** For a subject with no floor,
   * which so far means a cloud.
   *
   * It replaces `drift`, and the reason is his third reading: *"vamos deixar o movimento da
   * nuvem mais natural, cadenciado e fluído"*. `drift` was a fraction of the **scene's
   * frame loop**, so a cloud could only return to its start by crossing the entire scene in
   * one cycle — 320 px in 1200 ms, which is seamless and reads as a jet. Anything slower
   * jumped at the loop point.
   *
   * The frame loop was the whole problem. A pre-rendered frame list has no elapsed time, so
   * every motion in it had to be periodic in 24 frames. `speed` is scene pixels per
   * **second**, evaluated live, and it wraps a full sprite width off each edge — so there is
   * no loop point to be seamless at.
   *
   * `swayX`, `bobY` and `period` are the cadence: the cloud gains and loses a little speed
   * and rises and falls, on its own period. Two clouds with different periods never pulse
   * together, which is what stops a sky of three from reading as one object with three
   * parts.
   */
  readonly motion?: {
    /** Scene pixels per second, positive to the right. */
    readonly speed: number
    /** Sideways cadence amplitude, in pixels. It is what makes the speed vary. */
    readonly swayX: number
    /** Vertical cadence amplitude, in pixels. */
    readonly bobY: number
    /** Seconds in one cadence. */
    readonly period: number
    /** Offset into the cadence, 0..1. */
    readonly at: number
  }
  /**
   * **The clips a subject can play.** Named animations over one body — the gorilla's idle,
   * walk and attack; the photographer's walk, prone and run.
   *
   * Each clip is a separate grammar sharing the same skeleton and parts, which is the shape
   * run 7 established and the reason an action costs a gait rather than a redrawing. The
   * runtime holds a *state*, and the state names a clip; nothing about which animation plays
   * lives in the sprites.
   */
  readonly clips?: Readonly<Record<string, { readonly grammar: string; readonly tunables: string }>>
  /**
   * **Driven by the keyboard**, and the first thing in this project a person can change while
   * it is running.
   *
   * It forces the runtime to stop being a frame player: input, state and draw happen per
   * animation frame, and the scene can no longer be a list of pre-composited pictures. The
   * sprites stay pre-rendered — a walk cycle is still a pure function of its grammar — and
   * what moved into the browser is only the *composition*, which is exactly the split
   * `HARNESS.md` §2.1 already requires between a deterministic core and its consumers.
   *
   * **Facing costs a second render, not a flip.** Mirroring a sprite mirrors its lighting, so
   * a body lit from the upper left becomes a body lit from the upper right and the whole wood
   * disagrees with it. The subject is rendered again with the lamp mirrored and then flipped,
   * which puts the light back where the scene keeps it. Cheap here and impossible for a
   * painted sprite sheet, so it is one of the few places where generating the art is
   * straightforwardly better than drawing it.
   */
  readonly player?: {
    /** Scene pixels per second. */
    readonly speed: number
    readonly minX: number
    readonly maxX: number
    readonly idle: string
    readonly walk: string
    readonly attack?: string
    /** How far in front of him the blow reaches, in scene pixels. */
    readonly reach?: number
    /** Where in the attack clip the blow lands, 0..1. Anticipation is longer than impact. */
    readonly hitAt?: number
    /**
     * **Walking in eight directions instead of two**, which is the gap named on 15/08 and the
     * half of his commission of 16/08 that the engine could not reach.
     *
     * When present, the player also moves along the depth axis: `minRow` and `maxRow` bound
     * which contact rows he may stand on, and his **paint order follows him** — walk toward
     * the camera and you pass in front of a boulder you were behind. That is the y-sort every
     * overhead game has, arriving because a commission asked for it.
     *
     * `clip` names the clip prefix; the runtime appends the compass point, so `lope` reaches
     * `lope-e`, `lope-ne`, `lope-n` and their mirrors.
     */
    readonly roam?: {
      readonly minRow: number
      readonly maxRow: number
      /** Rows per second along the depth axis. Lower than `speed`: the floor is foreshortened. */
      readonly depthSpeed: number
    }
    /**
     * **A jump, and it is the first vertical motion in this engine.**
     *
     * `gravity` is scene pixels per second squared and `impulse` is the upward speed a press
     * buys. On the moon that ratio is the whole subject: a sixth of a g means a hang of well
     * over a second, and getting it wrong is what makes lunar gravity look like a trampoline.
     *
     * A jumping body lifts off its contact row and **its shadow does not**. That shadow is the
     * only thing telling a player where he will land, and without it a jump in an overhead
     * view is unreadable.
     */
    readonly jump?: {
      readonly clip: string
      readonly gravity: number
      readonly impulse: number
    }
  }
  /**
   * **The climber: a body that falls, lands on whatever surface is under it, and springs.**
   *
   * A second kind of actor, beside `player` and `approach`, and it is a second kind rather than
   * a flag on the first because almost nothing is shared. A `player` walks on a floor that is
   * always there, chooses when to jump, and never leaves the screen. A climber never chooses
   * to jump at all — **the bounce is automatic, and that is the genre** — has no floor except
   * the platform it is currently over, and spends the whole game leaving the screen upward.
   *
   * Three clip names, and the state machine over them is two comparisons: rising, falling, or
   * playing the 220 ms tuck that fires on contact. Which one is on screen is decided by the
   * sign of one number, which is the smallest state machine this project has and is exactly as
   * large as the genre needs.
   *
   * `CLAUDE.md` §5 says harvest generality, never design it. This is the second actor kind; the
   * first is `player`. What the two share — a facing, a clip per state, a position clamped to
   * the world — is visible now but is not extracted yet, because two cases is where a
   * mechanism becomes arguable and three is where it becomes obvious.
   */
  readonly climber?: {
    readonly rise: string
    readonly fall: string
    readonly tuck: string
  }
  /**
   * **The rider: the descent's actor.** A fifth kind, for the fourth game shape: no horizontal
   * world motion of its own (the world falls past), a steered lane, and a clip per state —
   * gliding, carving (mirrored for the two edges by the clip-pair mechanism), airborne.
   */
  readonly rides?: {
    readonly glide: string
    readonly carve: string
    readonly launch: string
  }
  /**
   * **The pilot: the arena's actor, and the sixth kind.** It has a world position on a plane
   * and a heading of its own, which no actor before it had — every earlier one lived on a row.
   * `player` says whether the keyboard drives it or the machine does.
   */
  readonly pilots?: { readonly player: boolean }
  /**
   * **The runner: a body that never stops and chooses only when to leave the ground.**
   *
   * A third actor kind after `player` and `climber`, and it is a third kind for the same reason
   * the second was: almost nothing is shared. A runner has no horizontal control at all, has two
   * jumps rather than one, and its second jump plays a clip that **turns a full circle** — the
   * first animation in this project that does not return to where it started.
   */
  readonly runs?: {
    readonly run: string
    readonly leap: string
    readonly flip: string
  }
  /**
   * **The keeper of a rotating room.** This actor belongs to the fixed-screen platformer:
   * unlike a runner it has horizontal acceleration, unlike a climber it chooses when to jump,
   * and unlike a floor player it collides with explicit boxes on all four sides.
   *
   * The names resolve through `clips`; behaviour stays in `Platformer` below. Keeping the two
   * facts apart means a different body can inhabit the same room without changing its physics.
   */
  readonly keeper?: {
    readonly idle: string
    readonly run: string
    readonly rise: string
    readonly fall: string
    readonly brace: string
  }
  /**
   * **A subject that walks in from an edge, settles at a distance from the player, and runs
   * home when it is struck.** The photographer, and it is named for the behaviour rather than
   * for the character.
   *
   * **It is deliberately not a framework.** `CLAUDE.md` §5 says harvest generality, never
   * design it: this is the first non-player behaviour in the project, and a behaviour tree
   * written for a sample of one is the judge built before the artifact all over again. When
   * there is a second, whatever the two share becomes the mechanism and this becomes one of
   * its cases.
   */
  readonly approach?: {
    readonly walk: string
    readonly prone: string
    readonly flee: string
    /** The edge it comes from and returns to. */
    readonly from: 'left' | 'right'
    readonly walkSpeed: number
    readonly fleeSpeed: number
    /** Scene pixels from the player it settles at. */
    readonly standoff: number
    /** Seconds before its first entrance, and between one exit and the next entrance. */
    readonly delay: number
    readonly period: number
    /** Seconds between shutter flashes once it is prone. */
    readonly shutter: number
  }
}

/**
 * **A world that scrolls, generates its own surfaces, and can be lost.**
 *
 * Every scene before this one was a stage: a fixed camera, a fixed cast, a floor painted into
 * the backdrop. His commission of 16/08 — *"um jogo de plataforma em que um gatinho pula de
 * plataforma em plataforma"* — needs three things none of those had, and this type is all
 * three in one place.
 *
 * 1. **Surfaces instead of a floor.** A floor is one contact row derived from depth. A
 *    platform is a sprite with a top edge that a body can be stopped by, and there are an
 *    unbounded number of them.
 * 2. **A camera.** Everything drawn so far sat at an absolute row. Here the world is taller
 *    than the screen and the screen follows the player up it.
 * 3. **Consequence.** `DECISIONS.md`, 16/08: *"the forest has a mechanic and no consequence —
 *    it is the smallest work on the list with the largest return, and it is what turns a
 *    reactive scene into a game."* He read that line and chose this over the 3D work. A climb
 *    has a height reached and a fall that ends it, and those two facts are the whole of it.
 *
 * **The platforms are generated, never placed, and they are generated the same way the stars
 * and the dust and the rain are: by an integer hash of an index.** Band `k` yields a position
 * and a variant, closed form, so an endless tower costs no storage and replays identically on
 * every machine. That is the same rule as everywhere else in this project and it is what makes
 * a run reproducible — `CLAUDE.md` §1: a recorded input sequence must replay to the same
 * state, or an agent cannot verify a game at all.
 */
export type Climb = {
  /** Vertical distance between two bands of platforms, in scene pixels. */
  readonly bandH: number
  /**
   * **How many shelves a band carries, each in its own slice of the width.**
   *
   * It is not a density knob, it is what stops the game from locking. With one per band and a
   * steady sideways input the whole system is periodic, so the crossing position at every shelf
   * above a landing is a fixed offset from it — and a fixed offset either matches or never
   * does. Slicing the width puts a shelf in each part of the world at every altitude, so no
   * single offset can miss them all.
   */
  readonly perBand: number
  /** How much a platform may sit below its own band's row. Keeps the tower off a grid. */
  readonly jitterY: number
  /**
   * How far a shelf may stray from its constructed position round the world. It is a *jitter on
   * a guarantee*: the spacing is built by construction and this loosens it without breaking it,
   * so the tower never reads as a lattice and never leaves a whole side unreachable.
   */
  readonly spreadJitter: number
  /** Which grammars may be stamped as a platform. The hash picks one per band. */
  readonly perches: readonly { readonly grammar: string; readonly tunables: string }[]
  /**
   * **Half the width of the standable surface, in scene pixels.**
   *
   * Declared rather than measured off the sprite, and the difference matters: the fern variant
   * hangs a leaf five pixels past the end of its board, and a leaf is not a floor. Every
   * variant shares one plank, so one number is the truth for all of them.
   */
  readonly halfW: number
  /**
   * How far off the plank's end a paw may be and still catch, in scene pixels. It exists to be
   * generous rather than to be right: a landing that misses by one pixel is a landing a player
   * believes he made.
   */
  readonly footHalf: number
  /** How long the landing clip plays before the pose returns to rising, in milliseconds. */
  readonly tuckMs: number
  /** Scene pixels per second squared. */
  readonly gravity: number
  /** Upward speed a landing buys, in scene pixels per second. Nothing else ever grants it. */
  readonly bounce: number
  /** Sideways speed under the arrow keys, in scene pixels per second. */
  readonly steer: number
  /** Where the camera holds the player, as a fraction of the screen height from the top. */
  readonly hold: number
  /** Rows above the start row where the first band sits. The starting ground is below it. */
  readonly firstBand: number
  /** Seeds the band hash. Change it and the whole tower is a different tower. */
  readonly seed: number
  /** Scene pixels that count as one metre in the score. */
  readonly pxPerMetre: number
  /**
   * **The sky is a function of altitude, and that is the reward for climbing.**
   *
   * A ramp walked from the start row upward: warm at the bottom, dark at the top. `skyHeight`
   * is how far up the ramp is fully spent. Quantised to bands at draw time, because a smooth
   * vertical gradient is a palette entry per row and this project has never spent colour that
   * way — the floor takes 8 steps, haze takes 4.
   */
  readonly skyRamp: readonly RGB[]
  readonly skyHeight: number
  /** Stars, fading in with altitude, scrolled at their own rate so the sky has depth. */
  readonly stars: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number; readonly parallax: number }
  /**
   * **Motes: warm specks drifting through the air, and they are the second field this engine
   * has.** Rain was the first. Both are functions of position and time evaluated per frame,
   * owning no skeleton and attached to nothing, which is what makes them a field rather than a
   * body — two hundred fireflies would otherwise be two hundred parts.
   */
  readonly motes: {
    readonly count: number
    readonly colors: readonly RGB[]
    readonly seed: number
    /** Pixels per second the drift carries them sideways. */
    readonly speed: number
    /** Seconds in one rise-and-fall of a single mote. */
    readonly period: number
    readonly parallax: number
  }
}

/**
 * **A world that comes at you, and the only thing you decide is when to leave the ground.**
 *
 * His commission, 16/08: *"um jogo estilo a página de offline do google, em que o dinossauro
 * está correndo infinitamente... a caveira pula das lápides e o diferencial aqui é que a caveira
 * tem um pulo duplo em que ela projeta um salto mortal para frente."*
 *
 * **It is the climb's structure with the axis turned.** The camera is fixed and the world moves;
 * obstacles are generated from an integer hash of their index rather than stored, so the run is
 * endless and identical on every machine. What is new is the second jump and what it costs: a
 * somersault that must complete rather than oscillate, which is why `Gait.wrap` exists.
 *
 * **And Death is a number.** She is not an actor with a plan — she is one value between 0 and 1
 * that creeps up with time and jumps on a hit, and her position on screen is that value read
 * back as a distance. A chaser with pathfinding would be a mechanism nobody could feel; a bar
 * that fills is a mechanism a player reads without being told.
 */
export type Runner = {
  /** The row the world stands on. */
  readonly groundRow: number
  /**
   * **The contact shadow, and its absence is `SCARS.md` #1.** A subject standing on a floor with
   * nothing under it does not read as standing on it — the finding is batch 4's and it was made
   * on this very shape. `rx` is the disc's half-width at ground level and `fade` the height at
   * which it stops shrinking. **Optional, and the option is the point:** a game that does not
   * want one says so in its scene, in a sentence, and the lock reads the sentence.
   */
  readonly contact?: { readonly rx: number; readonly alpha: number; readonly color: RGB; readonly fade: number }
  /** Why this runner has no contact shadow, if it has none. Read by `tests/scars.test.ts`. */
  readonly noContact?: string
  /** Where the runner is held on screen. He never moves horizontally; the world does. */
  readonly holdX: number
  /** Scene pixels per second at the start, and how much a second adds to it. */
  readonly speed: number
  readonly accel: number
  readonly maxSpeed: number
  readonly gravity: number
  /** Upward speed the first press buys, and the second. */
  readonly jump: number
  readonly flip: number
  /**
   * **How far the body travels in one stride cycle, in scene pixels.** The run animation
   * advances with distance over this, so the legs and the ground always agree however fast the
   * world is moving. It was a hand-picked divisor and the cycle then hit **9.9 strides a second**
   * at the speed cap — *"parece que ela está correndo em supervelocidade"*.
   */
  readonly strideLen: number
  /** Obstacle grammars. The hash picks one per slot. */
  readonly stones: readonly { readonly grammar: string; readonly tunables: string }[]
  /** Base distance between obstacles, and how much of that the hash may add. */
  readonly spacing: number
  readonly jitterX: number
  /**
   * **Clear ground before the first stone.** Without it the run could begin with an obstacle
   * already inside the runner's box: slot zero sits at `jitter` and the jitter can be zero, so a
   * fresh start was a collision before the player had touched a key. Found by a lock rather than
   * by playing, because it only happens on the first frame of a run.
   */
  readonly leadIn: number
  /**
   * Half the runner's collision box. **There is no matching height**: an obstacle's height is
   * read from its own art — the crop's top row above the ground line — so a stone's difficulty
   * is a fact about how it was drawn and never a number typed in two places.
   */
  readonly bodyHalfW: number
  /** Half an obstacle's collision box. Declared, because a mossy edge is not a wall. */
  readonly stoneHalfW: number
  readonly pxPerMetre: number
  /**
   * **Death, as one number that fills.** `creep` is how much of the gap she closes per second,
   * `hit` is what one collision costs, and `relief` is what clearing an obstacle gives back.
   * At 1 she reaches him.
   */
  readonly reaper?: { readonly grammar: string; readonly tunables: string; readonly creep: number; readonly hit: number; readonly relief: number; readonly fromX: number }
  /**
   * **Optional now, and the second game is what earned that** (`CLAUDE.md` §5: harvest generality,
   * do not design it). The crypt's chaser is a gap that closes and it is the right consequence for
   * a graveyard. A street has nothing chasing you, so a collision ends the run outright — the
   * dinosaur's rule, one mechanism instead of two.
   */
  /** The line shown when a run ends. A chaser and a kerb do not end a run in the same words. */
  readonly overText?: string
  /**
   * **Ordered dither for the backdrop, and this is where the pixel-art weave measurably pays.**
   *
   * The sprite pipeline carries the same lattice and it is switched off on every body: a 36 px
   * character of 27 primitives has 0.000 of its pixels inside a single-owner 4×4 cell, so a weave
   * there is the speckle his 15/08 verdict retired. A sky is one surface a hundred rows deep.
   *
   * `amount` is in stop units and `lattice` is 2 or 4. The backdrop is painted once into a static
   * canvas and never scrolls, so the pattern cannot crawl — which is the one dither defect worth
   * predicting, avoided by construction rather than by tuning.
   */
  readonly dither?: { readonly amount: number; readonly lattice: number }
  /** Painted top to bottom over the screen, not by altitude: the sky here does not change. */
  readonly skyRamp: readonly RGB[]
  readonly stars?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number; readonly below: number }
  /** The moon, and it is the only round thing in the picture. Absent in daylight. */
  readonly moon?: { readonly x: number; readonly y: number; readonly r: number; readonly color: RGB; readonly halo: RGB }
  /**
   * **Drifting bands: sprites that belong to the sky and scroll slower than the world.**
   *
   * The runner's backdrop is painted once and welded to the screen — that is the dither rule —
   * so anything that has to MOVE with the world's travel cannot live in it. A drift band is the
   * stones' own mechanism at a fraction of the speed: slot `k` yields a position, an altitude
   * and a variant from one integer hash, nothing is stored, and `parallax` is how much of the
   * world's distance the band travels. Far things travel little; that is the whole of depth in
   * a sideways sky.
   *
   * Harvested, not designed: the forest's clouds already drift and the stones already hash —
   * this is the two mechanisms meeting, needed by the first game whose scene is all sky.
   */
  readonly drift?: readonly {
    readonly puffs: readonly { readonly grammar: string; readonly tunables: string; readonly scale?: number }[]
    /** World pixels between slots, and how much of that the hash may add. */
    readonly spacing: number
    readonly jitterX: number
    /** Screen rows the band's centres may occupy. */
    readonly minY: number
    readonly maxY: number
    /** Fraction of the world's distance this band scrolls at. 0 is the backdrop; 1 is a stone. */
    readonly parallax: number
    readonly seed: number
  }[]
  readonly seed: number
}

/**
 * **The descent: a world that scrolls down the fall line, and the first new camera since the
 * moon.** His correction, 17/08: transfer test C was always about validating the camera
 * relation, and batch 6 resolved that away silently. This is the camera, built.
 *
 * The view is high behind the rider: the horizon is a strip at the top, the piste fills the
 * rest, and new terrain enters at the BOTTOM edge and rises as the camera advances down the
 * slope. The projection stays the engine's 2.5D — no divide — so the world recedes by rows,
 * the classic pixel idiom his reference's own genre uses.
 *
 * Obstacles are hashed 2D slots (a slope distance AND a lane), nothing stored. The one verb
 * pair: steer (which banks the body into the composed carve) and a hop. **An airborne rider
 * clears any obstacle whose art stands under `clearance`** — height read from the crop, so a
 * rock is jumpable and a pine is lethal because of how each is DRAWN, never because of a flag.
 */
export type Descent = {
  /** The screen row the rider's origin is held on. Terrain ahead is BELOW this row. */
  readonly holdY: number
  readonly minX: number
  readonly maxX: number
  /** Pixels per second across the slope. */
  readonly steer: number
  /** Down-slope speed: opening, gain per second, cap. */
  readonly speed: number
  readonly accel: number
  readonly maxSpeed: number
  /** The hop: upward speed a press buys, against gravity in px/s². */
  readonly jump: number
  readonly gravity: number
  /** Art shorter than this many pixels is cleared while airborne. */
  readonly clearance: number
  /** Slope pixels per glide/carve cycle — the animation advances with distance, as always. */
  readonly strideLen: number
  /**
   * **The perspective, and it is his batch-7 miss compiled into three numbers.**
   *
   * *"os objetos deveriam aparecer em escala, ao fundo, e crescerem conforme se aproximam."*
   * The projection has no divide, so the divide lives here: a thing `A` slope-pixels ahead
   * draws at factor `zNear / (A + zNear)` — 1 at the rider's own row, shrinking toward the
   * horizon — and its row and lane converge toward the vanishing point by the same factor.
   * `range` is how far ahead the piste is populated; past it a thing is the horizon's.
   *
   * **`scales` are the discrete bands the factor snaps to, and each band is its own crisp
   * render** through the ordinary build cache — never a stretched sprite, because nearest
   * neighbour through a fractional scale is the one thing the blit rules forbid.
   */
  readonly zNear: number
  readonly range: number
  readonly scales: readonly number[]
  /**
   * **Bands at or under `farBelow` render through `farTunables`** — in practice the same file
   * with the drawn line off. The look caught why: a 1 px ink ring around a 5 px render is a
   * black block, and the reference's own genre drops the line at distance.
   */
  readonly farTunables?: string
  readonly farBelow?: number
  /** Flowing piste dust: what makes the treadmill read between obstacles. */
  readonly dust?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number }
  readonly stones: readonly { readonly grammar: string; readonly tunables: string }[]
  /** Slope pixels between slots, the hash's own jitter along the slope. */
  readonly spacingD: number
  readonly jitterD: number
  readonly leadIn: number
  readonly bodyHalfW: number
  /** The rider's collision window along the slope. */
  readonly bodyHalfD: number
  readonly stoneHalfW: number
  readonly stoneHalfD: number
  readonly pxPerMetre: number
  readonly overText?: string
  readonly dither?: { readonly amount: number; readonly lattice: number }
  /** Rows above this are sky; the piste ramp starts here. */
  readonly horizonRow: number
  readonly skyRamp: readonly RGB[]
  /**
   * **The ridge: a treeline baked ONCE into the backdrop.** A far ridge does not visibly move
   * when you travel straight away from it, so it is static by honesty, not by cheapness —
   * and static means the lattice under it cannot crawl.
   */
  readonly ridge?: {
    readonly puffs: readonly { readonly grammar: string; readonly tunables: string; readonly scale?: number }[]
    readonly spacing: number
    readonly jitterX: number
    readonly row: number
    readonly seed: number
  }
  /** Clouds baked into the sky strip, same reasoning. */
  readonly clouds?: {
    readonly grammar: string
    readonly tunables: string
    readonly count: number
    readonly minY: number
    readonly maxY: number
    readonly seed: number
  }
  readonly seed: number
}

/**
 * **The arena: a ground plane, two machines, and a camera that orbits — the last camera the
 * 3D ledger was missing.**
 *
 * Every camera before this one either stood still or slid along one axis. This one has a
 * **position and a heading in the world**, and both change every frame, so a thing's place on
 * screen is no longer a row and a column — it is a projection. That is what makes the yaw bands
 * mean something: the band a machine draws at is `bodyHeading − cameraHeading`, and with a
 * camera that turns, every one of the twelve gets used.
 *
 * The projection is a real divide, the one `/descent` introduced, now in two axes:
 *
 * ```
 * fwd  = dx·sin h + dz·cos h        depth ahead of the camera
 * side = dx·cos h − dz·sin h        offset to its right
 * k    = focal / fwd
 * screen = (w/2 + side·k, horizon + (camHeight − y)·k)
 * ```
 *
 * **Nothing here is a renderer change.** The sprites are still pre-rendered indexed bytes from
 * the deterministic core; what the browser gained is one more way to decide where to stamp them
 * — which is the same split `HARNESS.md` §2.1 has demanded since round zero.
 */
export type Arena = {
  /** Half-width of the floor, in world units. Both machines are clamped inside it. */
  readonly radius: number
  /** Screen row of the eye line. The floor is drawn below it, the sky above. */
  readonly horizonRow: number
  /** Camera height above the plane, and how far behind the player it trails. */
  readonly camHeight: number
  readonly camDist: number
  /**
   * **Over the shoulder: the camera stands this far to its own right.** With a lock camera the
   * enemy sits dead centre by construction, and a camera on the player's own axis puts his back
   * exactly in front of it — the first build had the two machines overlapping every frame. The
   * offset is what those games all did, and it costs one term in the projection.
   */
  readonly camSide: number
  /**
   * **The camera turns toward the lock, but it LAGS**, and the lag is not a nicety: a camera
   * welded behind the player would hold him at relative heading zero for ever, and eleven of
   * the twelve yaw bands would never draw. Turning per second; lower is more lag.
   *
   * The lag belongs to the BOOM — where the camera stands — and to nothing else. The first
   * build let one eased angle both place the camera and aim it, and the aim became a
   * consequence of the lag rather than of what had to be shown.
   */
  readonly camEase: number
  /**
   * **How far off the view axis the player may sit, in turns — and it is a guarantee, not a
   * taste.** The camera aims at the bisector of the two machines so both frame symmetrically;
   * this clamps that aim so the player is never further from the centre than the frame can
   * hold. Derived from the frame's own half-width: `atan((w/2 · margin) / focal) / 2pi`.
   */
  readonly frameHold: number
  /**
   * **How far the boom leads a strafe, in turns.** Hold right and the camera swings out that
   * way. It is the genre's own move and it is also one of the two things that spend the yaw
   * bands — see `faceEase`.
   */
  readonly boomLead: number
  /**
   * **How fast a body turns toward where it is TRAVELLING, in turns a second.**
   *
   * A locked duel has a geometry worth stating: the camera must frame both machines, so it
   * looks roughly along the axis they face, so the player is always seen from behind and the
   * enemy head-on. That bounds the reachable yaw bands to a cone — a theorem about framing
   * cameras rather than a tuning. A machine under boost is the honest exception: thrusters push
   * along travel, so a dashing machine points where it dashes while its weapon stays on target,
   * and a sideways dash shows the body in full profile.
   */
  readonly faceEase: number
  /** Pixels per world unit at unit depth, and the depth below which nothing draws. */
  readonly focal: number
  readonly near: number
  /** How many yaw bands the machines were generated at, and the scale bands they draw through. */
  readonly bands: number
  /**
   * **The machines' ladder, and the pillars' — separate, because they do not share a range.**
   * Measured over three long drives: a machine lives between 0.31 and 1 of the reference size
   * (the player is pinned at 1 by the rig), while a pillar the camera walks past reaches 3.2.
   * One ladder for both meant the pillar stopped growing at arm's length, and a prop that does
   * not grow as you close on it is not in the world, whatever row it is stamped on.
   */
  readonly scales: readonly number[]
  readonly pillarScales: readonly number[]
  /**
   * **How much better a new size band must be before a thing leaves the one it is drawing at.**
   *
   * Nearest-band-per-frame has no memory, so a thing sitting on a boundary flips every frame and
   * the flip is a whole band of size. His report: *"tem uma distância específica que o tamanho
   * fica variando constantemente, causando uma sensação de bug"*.
   *
   * `/descent` uses the same ladder ratio and never showed it, and that is the general lesson:
   * on a treadmill every object crosses every boundary ONCE, in one direction. In an arena the
   * enemy closes and backs off and the player strafes, so a thing can LIVE on a boundary. The
   * band technique did not change; the motion did.
   */
  readonly bandHold: number
  /** Clip name prefixes; the runtime appends the band index. */
  readonly walk: string
  readonly boost: string
  /** World units per second, and per second of strafe. */
  readonly speed: number
  readonly strafe: number
  /** The dash: speed, how long it lasts, and how long before another. */
  readonly boostSpeed: number
  readonly boostMs: number
  readonly boostCoolMs: number
  /** World units the stride covers in one walk cycle. The gait advances with distance. */
  readonly strideLen: number
  /** The duel: a shot's speed, its reach, what it costs, and the reload. */
  readonly shotSpeed: number
  readonly shotRange: number
  readonly shotHalf: number
  readonly damage: number
  readonly reloadMs: number
  /** Armour both machines start with. First to zero loses. */
  readonly armour: number
  /** The enemy's ranges: it closes past `far` and backs off inside `close`. */
  readonly aiClose: number
  readonly aiFar: number
  readonly aiReloadMs: number
  /**
   * **The floor grid, and it is the period cue that costs almost nothing.** Lines in world
   * space, projected — so they converge on the vanishing point and swing as the camera turns.
   * More than any shading, a grid is what told a player of that era that the floor was a plane
   * in space rather than a picture of one.
   */
  readonly grid: { readonly step: number; readonly color: RGB; readonly fade: RGB }
  /** Pillars: the same hash-slot mechanism as every other world here. */
  readonly pillars: { readonly grammar: string; readonly tunables: string; readonly count: number; readonly seed: number }
  /**
   * **What a pillar and a machine occupy on the plane, in world units.** These exist because a
   * pillar that only the painter knew about is scenery wearing an obstacle's clothes: a shot
   * went through it and a machine walked into it. The simulation holds the same list the paint
   * loop draws, and these two radii are what it tests against.
   */
  readonly pillarHalf: number
  readonly bodyHalf: number
  /**
   * **The contact shadow: a ground disc under everything that stands on the plane.** Arithmetic
   * already put every sprite on the floor; nothing told the eye. Batch 4 named this class once
   * — *"neither rider is grounded"* — and it shipped again in the first arena, so the number
   * lives in the scene now rather than in a draw call.
   */
  readonly contact: { readonly alpha: number; readonly color: RGB }
  readonly skyRamp: readonly RGB[]
  readonly floorRamp: readonly RGB[]
  readonly dither?: { readonly amount: number; readonly lattice: number }
  /**
   * No `overText` here, and the absence is deliberate: a duel has TWO outcomes and one string
   * cannot carry both. The runner's single field was right for a runner, where the only ending
   * is losing. A field the runtime ignores is a field that lies.
   */
  readonly seed: number
}

/** One axis-aligned solid in the room's authored, unrotated coordinates. */
export type PlatformBox = { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

/**
 * **A whole room that turns by exact quarter steps.** The visual may interpolate between two
 * orientations, but collision commits once, at the end of the turn. That distinction is the
 * determinism contract: the simulation only ever sees axis-aligned boxes and integer turns.
 */
export type Platformer = {
  readonly startX: number
  readonly startY: number
  readonly bodyHalfW: number
  readonly bodyH: number
  readonly speed: number
  readonly accel: number
  readonly friction: number
  readonly gravity: number
  readonly jump: number
  readonly coyoteMs: number
  readonly bufferMs: number
  readonly strideLen: number
  readonly rotateMs: number
  /** The navigable interior. Unlike the decorative border boxes, this always contains the body. */
  readonly bounds: PlatformBox
  /** Border thickness outside `bounds`; collision and paint derive the same four walls from it. */
  readonly wall: number
  readonly solids: readonly PlatformBox[]
  readonly core: { readonly x: number; readonly y: number; readonly r: number }
  readonly suns: readonly { readonly x: number; readonly y: number; readonly r: number }[]
  readonly hatch: PlatformBox
  readonly sun: {
    readonly dormant: { readonly grammar: string; readonly tunables: string }
    readonly lit: { readonly grammar: string; readonly tunables: string }
  }
  readonly rings: readonly { readonly r: number; readonly speed: number; readonly spokes: number }[]
  readonly colors: {
    readonly void: RGB
    readonly chamber: RGB
    readonly chamberHi: RGB
    readonly ink: RGB
    readonly brass: RGB
    readonly brassHi: RGB
    readonly teal: RGB
    readonly tealDark: RGB
    readonly bone: RGB
    readonly vermilion: RGB
  }
  readonly seed: number
}

/** Physical keys for a game's semantic verbs. Movement remains the shared arrows/WASD plane. */
export type ActionBindings = {
  readonly primary: readonly string[]
  readonly secondary: readonly string[]
}

export type Scene = {
  readonly name: string
  readonly w: number
  readonly h: number
  /** Frames in the scene's own loop. */
  readonly frames: number
  readonly msPerFrame: number
  readonly scale: number
  /**
   * **The floor, as a plane rather than a line.** `ground` is the row a subject at depth 1
   * stands on and where the floor starts painting; `nearRow` is the row a subject at depth 0
   * stands on. Everything between is the floor receding away from the camera.
   *
   * The scene used to declare only `ground` and leave the rest of the band undifferentiated,
   * which is why depth was not readable in it: rows 128 to 176 were one flat colour, so
   * nothing told the eye that lower meant nearer. It does now, by the same haze the subjects
   * carry — one rule for the floor and the things standing on it.
   */
  readonly ground: number
  readonly nearRow: number
  /** How far a subject at depth 1 is pulled toward the sky's colour. */
  readonly haze: number
  readonly sky: RGB
  /**
   * **Stars, and they are a backdrop rather than a field.**
   *
   * A field is evaluated per pixel per frame because it *moves*. Stars do not: the moon is
   * tidally locked and its sky is fixed, so they are painted once into the backdrop from an
   * integer hash. Two colours and a count, which is the whole of a night sky at this scale.
   */
  readonly stars?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number; readonly below: number }
  /**
   * **Dust on the floor, and it is a backdrop rather than a field**, for the same reason the
   * stars are: it does not move.
   *
   * Regolith is powder churned by four billion years of impacts. Painted as a flat fill it
   * reads as a floor tile, and no amount of value gradient fixes that — *"me parece apenas um
   * chão preto com pedras"*. A scattering of single pixels in two tones is the whole of it,
   * and it is the cheapest texture this engine can express.
   */
  readonly dust?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number }
  /** Dark to light, walked by depth. The lightest is the far edge of the floor. */
  readonly groundRamp: readonly RGB[]
  readonly placements: readonly Placement[]
  /**
   * **Fields: weather, and the first thing here that is not a body.**
   *
   * A grammar is bones and parts, so two hundred raindrops would be two hundred parts. Rain,
   * snow, sparks, embers and smoke are none of them bodies — they are **functions of
   * position and time**, evaluated per pixel, owning no skeleton and attached to nothing.
   * That makes them scene-level by nature: a body belongs to a creature, and weather belongs
   * to the world.
   *
   * Closed form and seeded by an integer hash, so a field is as deterministic as everything
   * else here and loops exactly when its speed completes a whole number of passes.
   */
  readonly fields?: readonly Field[]
  /**
   * **Present on a climbing scene and absent on every other kind.** See `Climb` above.
   *
   * `compose()` refuses a scene that carries it — a scrolling, generated, stateful world has no
   * frozen frame list, and rendering one would produce a picture that agrees with nothing the
   * player sees. That refusal is deliberate and it is the honest handling of the divergence
   * `DECISIONS.md` named on 16/08: this file and `layers.ts` are two paths drawing the same
   * scene, and the cheapest way to keep them from disagreeing is for one of them to say so.
   */
  readonly climb?: Climb
  /** Present on an endless runner and absent on every other kind. See `Runner`. */
  readonly runner?: Runner
  /** Present on a down-slope game and absent on every other kind. See `Descent`. */
  readonly descent?: Descent
  /** Present on an arena duel and absent on every other kind. See `Arena`. */
  readonly arena?: Arena
  /** Present on a quarter-turn room platformer and absent on every other kind. */
  readonly platformer?: Platformer
}

export type Field =
  /**
   * Rain. Drops fall in columns spaced `spacing` apart, each column offset by a hash of its
   * index so the sheet never marches in step. A drop is a short streak, slanted by `slant`
   * pixels of drift per pixel of fall — which is what makes rain read as weather rather than
   * as a scan line.
   */
  | {
      readonly kind: 'rain'
      /** Palette entries, dark to light. A near drop is lighter than a far one. */
      readonly colors: readonly RGB[]
      readonly spacing: number
      readonly length: number
      readonly slant: number
      /**
       * Passes down the screen per scene cycle. It set the fall SPEED and had to be whole
       * while frames were pre-composited — a loop point demanded it. The runtime has been
       * continuous in seconds since 15/08, there is no loop point left, and snow needs a
       * fraction: a flake at a drop's whole-pass speed is hail.
       */
      readonly passes: number
      readonly seed: number
    }

/**
 * **Everything about distance, derived from one number, in one place.**
 *
 * Both consumers — this compositor and `layers.ts` — call these rather than each doing the
 * arithmetic. Two implementations of a rule is two rules eventually.
 */
export const standRow = (s: Scene, depth: number): number =>
  Math.round(s.nearRow - (s.nearRow - s.ground) * depth)

/**
 * **Haze, quantised to four bands.**
 *
 * Every distinct haze value is a distinct copy of a subject's whole palette — 25 entries for
 * a tree — so a haze that varies continuously with depth spends the 256 indices on air. Seven
 * depth planes cost 171 colours before this; four bands cost about a hundred.
 *
 * The cost is declared rather than hidden: two planes that share a haze band are separated by
 * their **row** alone, which is exactly what separates two trees standing side by side in any
 * case. It is the same trade the floor makes with its eight steps, and the same one indexed
 * colour has made everywhere in this project since round zero.
 */
const HAZE_STEPS = 4
export const hazeAt = (s: Scene, depth: number): number =>
  (s.haze * Math.round(depth * HAZE_STEPS)) / HAZE_STEPS

/**
 * Where a subject falls in the paint order. Sky first, then far to near.
 *
 * `depth` is the whole of it, which is the point: when the row and the haze are both derived
 * from the same number, the order cannot disagree with either.
 */
export const paintOrder = (p: Placement, i: number): number =>
  (p.sky === true ? -1 : 1 - (p.depth ?? 0)) * 1000 + i * 0.001

/** How far the floor at row `y` has receded. 1 at the horizon, 0 at the near edge. */
export const floorDepth = (s: Scene, y: number): number =>
  Math.max(0, Math.min(1, (s.nearRow - y) / Math.max(1, s.nearRow - s.ground)))
