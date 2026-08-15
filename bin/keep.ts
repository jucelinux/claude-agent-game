/**
 * Keep a run in the gallery, forever.
 *
 *   node bin/keep.ts runs/probe-b.run.json --topic "the abdomen becomes plates" --note "B"
 *   node bin/keep.ts runs/*.run.json
 *
 * A generation whose hash is already kept is skipped: the history records movement.
 */
import { parse } from './args.ts'
import { execute } from '../src/io/load.ts'
import { entryFrom, keep, nextNumber } from '../src/io/gallery.ts'

const argv = process.argv.slice(2)
const runs = argv.filter((a) => a.endsWith('.json'))
const flags = argv.filter((a) => !a.endsWith('.json'))
const { rest } = parse(flags)
const note = typeof rest['note'] === 'string' ? rest['note'] : undefined
const topic = typeof rest['topic'] === 'string' ? rest['topic'] : undefined
const run = typeof rest['run'] === 'string' ? Number(rest['run']) : 0
const element = typeof rest['element'] === 'string' ? rest['element'] : ''
const date = new Date().toISOString().slice(0, 10)

const specs = runs.length > 0 ? runs.map((r) => parse([r, ...flags]).spec) : [parse(flags).spec]
let n = nextNumber()
for (const spec of specs) {
  const result = execute(spec)
  const path = keep(entryFrom(result, n, date, note, topic, run, element))
  if (path === null) {
    process.stdout.write(`already kept  ${spec.grammar}  ${result.hash}\n`)
  } else {
    process.stdout.write(`kept  ${path.split('/').pop()}\n`)
    n++
  }
}
