/**
 * The page payload as JSON, on stdout. Exists so the server can get **fresh** frames
 * without trusting a module cache: a new process has a new module graph, so editing the
 * grammar or the core is picked up with no cache-busting tricks and no stale lies.
 *
 *   node bin/payload.ts [runs…] [--set path=value]
 */
import { parse } from './args.ts'
import { buildCells, toJson } from '../src/viewer/cells.ts'

const argv = process.argv.slice(2)
const runs = argv.filter((a) => a.endsWith('.json'))
const flags = argv.filter((a) => !a.endsWith('.json'))
const specs = runs.length > 0 ? runs.map((r) => parse([r, ...flags]).spec) : [parse(flags).spec]

process.stdout.write(toJson(buildCells(specs), 'live'))
