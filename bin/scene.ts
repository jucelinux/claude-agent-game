/**
 * Compose a scene and keep it, so it lands on the same page as every sprite.
 *
 *   node bin/scene.ts
 */
import { compose } from '../src/scene/compose.ts'
import { galleryScene } from '../src/scene/gallery-scene.ts'
import { entryFromScene, keep, nextNumber } from '../src/io/gallery.ts'
import { report } from '../src/perception/structure.ts'

const composed = compose(galleryScene)
const own = composed.cohesion.perSubject.reduce((a, s) => a + s.colours, 0)
const shared = composed.cohesion.perSubject.reduce((a, s) => a + s.shared, 0)

process.stdout.write(`scene ${composed.scene.w}x${composed.scene.h}, ${composed.buffers.length} frames\n`)
process.stdout.write(`palette: ${composed.cohesion.totalColours} colours of 256\n`)
process.stdout.write(`cohesion: ${own} unique, ${shared} reused — ${Math.round((100 * shared) / (own + shared))}% reuse\n`)
for (const s of composed.cohesion.perSubject) {
  process.stdout.write(`  ${s.name.padEnd(24)} ${String(s.colours).padStart(3)} own  ${String(s.shared).padStart(3)} shared\n`)
}
void report

const path = keep(
  entryFromScene(composed, nextNumber(), new Date().toISOString().slice(0, 10),
    'Every drawing so far, standing in one place. The sky is measured, not picked: of four candidates only a mid value clears every subject, because they were all tuned against the viewer grey and collectively span the whole value range.',
    'run 11: everything so far, in one scene', 11, 'scene-everything',
    [`${composed.cohesion.totalColours} colours`, `${Math.round((100 * shared) / (own + shared))}% palette reuse`]),
)
process.stdout.write(path === null ? 'already kept\n' : `kept  ${path.split('/').pop()}\n`)
