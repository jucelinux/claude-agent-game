/**
 * **The catalog** (16/08). The lexicon of subjects, organized for retrieval: before
 * authoring a new subject, an agent asks this file what already exists.
 *
 * Three layers, kept distinct on purpose:
 *  - the **vocabulary** (primitives, fields, tracks) lives in `src/core/` and grows only
 *    when a miss specifies a capability;
 *  - the **lexicon** (this file) is subjects as data, folders by kind;
 *  - the **generators** (`makeTree`, `yaw.ts`) make many subjects from one authoring.
 *
 * `kind` and `tags` are open strings: a new taxonomy (3D, style, whatever the future
 * asks) is added by using it, never by editing a type. The lock (`tests/catalog.test.ts`)
 * asserts every entry is described and every game reference is real — not membership in
 * a closed set.
 */
import type { Grammar } from '../core/types.ts'
import { fixture } from './fixture.ts'
import { probeA, probeB, probeC } from './probes/idioms.ts'
import { probeD } from './probes/humanoid.ts'
import { gorillaJumpChrono, gorillaJumpStardew } from './probes/gorilla-inks.ts'
import { beetle, beetleWave } from './creatures/beetle.ts'
import { mantis } from './creatures/mantis.ts'
import { scorpion } from './creatures/scorpion.ts'
import { gorilla } from './creatures/gorilla.ts'
import { gorillaMech } from './creatures/gorilla-mech.ts'
import { gorillaAttack, gorillaJump } from './creatures/gorilla-actions.ts'
import { gorillaIdle } from './creatures/gorilla-idle.ts'
import { CAT, catTuck } from './creatures/cat.ts'
import { PHOTOGRAPHER } from './characters/photographer.ts'
import { ASTRONAUT } from './characters/astronaut.ts'
import { BONES, bonesFlip, bonesLeap } from './characters/bones.ts'
import { skateFlip, skateOllie, skateRoll } from './characters/skater.ts'
import { tree } from './vegetation/tree.ts'
import { FOREST } from './vegetation/forest.ts'
import { CLOUDS } from './scenery/cloud.ts'
import { MOON } from './scenery/moon.ts'
import { PERCHES } from './scenery/perch.ts'
import { CRYPT_PROPS, death } from './scenery/crypt.ts'
import { streetCone, streetKerb, streetRail } from './scenery/street.ts'
import { aeroClimb, aeroCruise, aeroRoll } from './vehicles/aero.ts'
import { skyBalloon, skyFlock, skyKite } from './scenery/aloft.ts'
import { snowCarve, snowJump, snowRodeo } from './characters/boarder.ts'
import { pistePine, pistePuff, pisteSapling, pisteSnowman } from './scenery/piste.ts'

/** shipped = judged usable · probe = built to compare, never content · retired = superseded or failed. */
export type GrammarStatus = 'shipped' | 'probe' | 'retired'

export type CatalogEntry = {
  readonly grammar: Grammar
  /** Open taxonomy. Current kinds: creature, character, vegetation, scenery, prop, harness. */
  readonly kind: string
  readonly status: GrammarStatus
  /** One searchable line: what it is and what it proved. */
  readonly description: string
  /** Shelf routes this grammar appears in. */
  readonly games?: readonly string[]
  /** Open tags for taxonomies that do not exist yet (3d, style, …). */
  readonly tags?: readonly string[]
}

type Meta = Omit<CatalogEntry, 'grammar'>

const entry = (grammar: Grammar, meta: Meta): Record<string, CatalogEntry> => ({
  [grammar.name]: { grammar, ...meta },
})

/** One family, one metadata: generated grammars share their provenance. */
const family = (grammars: readonly Grammar[], meta: Meta): Record<string, CatalogEntry> =>
  Object.fromEntries(grammars.map((g) => [g.name, { grammar: g, ...meta }]))

export const CATALOG: Readonly<Record<string, CatalogEntry>> = {
  ...entry(fixture, {
    kind: 'harness',
    status: 'shipped',
    description: "the harness's own subject — a plain biped walk that calibrates the instruments. Not content",
  }),
  ...entry(probeA, { kind: 'creature', status: 'probe', description: 'run 1 idiom probe: Stardew control — few tones, 4 frames, cohesion over virtuosity' }),
  ...entry(probeB, { kind: 'creature', status: 'probe', description: 'run 1 idiom probe: Chrono target — silhouette and value carry the weight' }),
  ...entry(probeC, { kind: 'creature', status: 'probe', description: 'run 1 idiom probe: high budget — won on a beetle, lost on a gorilla; calibrates the noise null case' }),
  ...entry(probeD, { kind: 'character', status: 'probe', description: 'run 1 idiom probe: Comix Zone overshoot on a humanoid ninja' }),
  ...entry(beetle, { kind: 'creature', status: 'shipped', description: 'three-quarter arthropod, tripod gait — one heavy mass carries the reading, 18 parts' }),
  ...entry(beetleWave, { kind: 'creature', status: 'retired', description: 'the metachronal-wave gait that lost to the tripod on his eye' }),
  ...entry(mantis, { kind: 'creature', status: 'retired', description: 'lost its silhouette to articulation density — the finding that named the part-count ceiling' }),
  ...entry(scorpion, { kind: 'creature', status: 'retired', description: 'wrong at every scale at once — retired with the mantis, kept as the record of the ceiling' }),
  ...entry(gorilla, {
    kind: 'creature',
    status: 'shipped',
    games: ['forest'],
    description: 'the silverback walk — the first body where weight landed. Black coat, grey saddle as marking, Chrono ink',
  }),
  ...entry(gorillaIdle, { kind: 'creature', status: 'shipped', games: ['forest'], description: 'breath, look and weight on periods that never repeat inside the loop' }),
  ...entry(gorillaJump, { kind: 'creature', status: 'shipped', games: ['forest'], description: 'six phases with squash and stretch — crouch 1.20, apex 0.70, landing 1.24 wide over tall' }),
  ...entry(gorillaAttack, { kind: 'creature', status: 'shipped', games: ['forest'], description: 'the near fist crosses from behind the torso to in front — the clip that demanded the z-buffer' }),
  ...entry(gorillaMech, { kind: 'creature', status: 'shipped', description: 'the gorilla become a robot by a ping-pong transformation — plates arrive and leave by scale' }),
  ...entry(gorillaJumpStardew, { kind: 'creature', status: 'probe', description: 'run 8 ink probe: the jump re-paletted flat — tied last, and settled the ink verdict' }),
  ...entry(gorillaJumpChrono, { kind: 'creature', status: 'probe', description: 'run 8 ink probe: the jump in 5 tones with a line — his ranked first, now the house idiom' }),
  ...entry(tree, { kind: 'vegetation', status: 'shipped', description: 'the single tree of run 9 — lobed foliage, wind as lag down the hierarchy, falling leaves' }),
  ...family(FOREST, {
    kind: 'vegetation',
    status: 'shipped',
    games: ['forest'],
    description: 'makeTree: recursive growth, one palette for the whole wood — no two crowns alike',
  }),
  ...family(CLOUDS, { kind: 'scenery', status: 'shipped', games: ['forest'], description: 'sky layer — drift in scene px/s on periods that are deliberately not multiples' }),
  ...family(PHOTOGRAPHER, {
    kind: 'character',
    status: 'shipped',
    games: ['forest'],
    description: 'three gaits on one body — walk, prone (the spine at ninety degrees), run; the camera is an aimed bone',
  }),
  ...family(ASTRONAUT, {
    kind: 'character',
    status: 'shipped',
    games: ['moon'],
    description: 'fifteen grammars from one authored body — the yaw transform that made bodies turnable',
  }),
  ...family(MOON, { kind: 'scenery', status: 'shipped', games: ['moon'], description: 'regolith, craters agreeing with the lamp, the Earth tidally locked and still' }),
  ...family(CAT, {
    kind: 'creature',
    status: 'shipped',
    games: ['cozy'],
    description: 'the kitten — 22 welded parts in 34 px, the subject that produced Part.weld and the seam question',
  }),
  ...family(PERCHES, { kind: 'prop', status: 'shipped', games: ['cozy'], description: 'the climb shelves — moss, stone and stems sized to the landing window' }),
  ...family(BONES, {
    kind: 'character',
    status: 'shipped',
    games: ['crypt'],
    description: 'the skeleton runner — the skull re-authored around Part.cut: sockets as cavities, jaw as the one real seam',
  }),
  ...family(
    CRYPT_PROPS.filter((g) => g.name !== death.name),
    { kind: 'prop', status: 'shipped', games: ['crypt'], description: 'gravestones sized from the two jump impulses — a third of the yard needs the flip' },
  ),
  ...entry(death, { kind: 'character', status: 'shipped', games: ['crypt'], description: 'the reaper — one number, menace, read as a distance a player feels closing' }),
  ...family([skateRoll, skateOllie, skateFlip], {
    kind: 'character',
    status: 'shipped',
    games: ['skate'],
    description: 'the skater — roll, ollie, kickflip: the first rotation that leaves the screen plane, deck faces trading places',
  }),
  ...family([streetKerb, streetCone, streetRail], {
    kind: 'prop',
    status: 'shipped',
    games: ['skate'],
    description: 'street furniture graded to the two tricks — the kerb and cone fall to the ollie, the rail needs the flip',
  }),
  // `vehicle` is a new kind, added by using it (the catalog's own rule): the first subject here
  // that is a machine a player rides rather than a body that walks.
  ...family([aeroCruise, aeroClimb, aeroRoll], {
    kind: 'vehicle',
    status: 'shipped',
    games: ['aero'],
    description: 'the biplane — barrel roll on the ROOT of a 21-part skeleton, run 18: wing faces trade places and the span sweeps into the silhouette; the climb is the screen-plane control',
    tags: ['3d-roll'],
  }),
  ...family([skyBalloon, skyFlock, skyKite], {
    kind: 'prop',
    status: 'shipped',
    games: ['aero'],
    description: 'sky furniture graded to the two presses — balloon and flock fall to the climb, the kite balloon’s cable needs the roll; every column honestly full',
  }),
  ...family([snowCarve, snowJump, snowRodeo], {
    kind: 'character',
    status: 'shipped',
    games: ['snow'],
    description: 'the snowboarder, run 19 — Yoshi’s Island chibi (head 0.4 of height, his reference), and the rodeo composes a full roll with a LEANING root: the declared approximation under test',
    tags: ['3d-roll', 'yoshi-island'],
  }),
  ...family([pisteSnowman, pisteSapling, pistePine], {
    kind: 'prop',
    status: 'shipped',
    games: ['snow'],
    description: 'piste furniture graded to the two presses — snowman and sapling fall to the jump, the tall snow-capped pine needs the rodeo; YI winter palette',
    tags: ['yoshi-island'],
  }),
  ...entry(pistePuff, {
    kind: 'scenery',
    status: 'shipped',
    games: ['snow'],
    description: 'a Yoshi’s Island cloud: flat white puff, width 2.2× height, OUTLINED — drawn with the scene’s own crayon; lives in the drift bands',
    tags: ['yoshi-island'],
  }),
}

export const GRAMMARS: Readonly<Record<string, Grammar>> = Object.fromEntries(
  Object.entries(CATALOG).map(([name, e]) => [name, e.grammar]),
)

/**
 * Which tunables each grammar is authored against. A grammar and a tone budget are one
 * decision — validating a grammar against somebody else's budget would report a violation
 * that does not exist, and hide the one that does.
 */
export const PAIRS: readonly { readonly grammar: string; readonly tunables: string }[] = [
  { grammar: 'fixture', tunables: 'default' },
  { grammar: 'probe-a', tunables: 'probe-a' },
  { grammar: 'probe-b', tunables: 'probe-b' },
  { grammar: 'probe-c', tunables: 'probe-c' },
  { grammar: 'probe-d', tunables: 'probe-d' },
  { grammar: 'beetle', tunables: 'beetle' },
  { grammar: 'beetle-wave', tunables: 'beetle' },
  { grammar: 'mantis', tunables: 'mantis' },
  { grammar: 'scorpion', tunables: 'scorpion' },
  { grammar: 'gorilla', tunables: 'gorilla' },
  { grammar: 'gorilla-mech', tunables: 'gorilla-mech' },
  { grammar: 'gorilla-jump', tunables: 'gorilla-jump' },
  { grammar: 'gorilla-attack', tunables: 'gorilla-attack' },
  { grammar: 'gorilla-jump-stardew', tunables: 'gorilla-jump-stardew' },
  { grammar: 'gorilla-jump-chrono', tunables: 'gorilla-jump-chrono' },
  { grammar: 'tree', tunables: 'tree' },
  ...FOREST.map((g) => ({ grammar: g.name, tunables: 'wood' })),
  ...CLOUDS.map((g) => ({ grammar: g.name, tunables: 'sky' })),
  { grammar: 'gorilla-idle', tunables: 'gorilla-idle' },
  ...PHOTOGRAPHER.map((g) => ({ grammar: g.name, tunables: 'photog' })),
  ...ASTRONAUT.map((g) => ({ grammar: g.name, tunables: 'astronaut' })),
  { grammar: 'earth', tunables: 'earth' },
  ...MOON.filter((g) => g.name !== 'earth').map((g) => ({ grammar: g.name, tunables: 'regolith' })),
  // **The tuck has its own tunables and the other two clips share one.** A frame count lives in
  // the tunables file, and a clip that plays once needs four frames where a clip that loops
  // needs eight. Everything else in the two files is identical, which a lock asserts.
  ...CAT.filter((g) => g.name !== catTuck.name).map((g) => ({ grammar: g.name, tunables: 'cat' })),
  { grammar: catTuck.name, tunables: 'cat-tuck' },
  ...PERCHES.map((g) => ({ grammar: g.name, tunables: 'perch' })),
  // Three clips, three tunables files, and the reason is the same each time: a frame count and
  // an amplitude live in the tunables, so a clip that plays once needs its own, and a clip that
  // turns a full circle needs one with a swing of 1.
  { grammar: 'bones-run', tunables: 'bones' },
  { grammar: bonesLeap.name, tunables: 'bones-leap' },
  { grammar: bonesFlip.name, tunables: 'bones-flip' },
  ...CRYPT_PROPS.filter((g) => g.name !== death.name).map((g) => ({ grammar: g.name, tunables: 'crypt' })),
  { grammar: death.name, tunables: 'death' },
  // Three clips, three tunables files, for the reason the crypt records: a frame count and an
  // amplitude live in the tunables. The kickflip additionally needs `gait.roll` at a whole turn,
  // which is a range no looping clip has any business carrying.
  { grammar: skateRoll.name, tunables: 'skate' },
  { grammar: skateOllie.name, tunables: 'skate-ollie' },
  { grammar: skateFlip.name, tunables: 'skate-flip' },
  ...[streetKerb, streetCone, streetRail].map((g) => ({ grammar: g.name, tunables: 'street' })),
  // Three clips, three files, the skater's reason: a frame count and an amplitude live in the
  // tunables, and the barrel roll needs gait.roll at a whole turn.
  { grammar: aeroCruise.name, tunables: 'aero' },
  { grammar: aeroClimb.name, tunables: 'aero-climb' },
  { grammar: aeroRoll.name, tunables: 'aero-roll' },
  // The stills share a file; the flock animates and carries its own — the cat-tuck rule.
  { grammar: skyBalloon.name, tunables: 'aloft' },
  { grammar: skyKite.name, tunables: 'aloft' },
  { grammar: skyFlock.name, tunables: 'aloft-flock' },
  // Run 19: three clips, three files (frame count + amplitude live in the tunables); the piste
  // stills share one; the puff breathes on two frames and carries its own.
  { grammar: snowCarve.name, tunables: 'snow' },
  { grammar: snowJump.name, tunables: 'snow-jump' },
  { grammar: snowRodeo.name, tunables: 'snow-rodeo' },
  { grammar: pisteSnowman.name, tunables: 'piste' },
  { grammar: pisteSapling.name, tunables: 'piste' },
  { grammar: pistePine.name, tunables: 'piste' },
  { grammar: pistePuff.name, tunables: 'puff' },
]

export function grammarByName(name: string): Grammar {
  const g = GRAMMARS[name]
  if (g === undefined) throw new Error(`unknown grammar "${name}" (have: ${Object.keys(GRAMMARS).join(', ')})`)
  return g
}
