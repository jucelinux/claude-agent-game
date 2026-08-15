/**
 * The page shell, on stdout, from a **fresh process**.
 *
 *   node bin/shell.ts [--mode live|selftest]
 *
 * The server holds its modules for its whole life, so a
 * shell built in-process meant every edit to the viewer needed a restart. Built out here,
 * editing `src/viewer/page.ts` reloads the tab instead.
 */
import { parse } from './args.ts'
import { emit } from '../src/viewer/page.ts'
import { SELFTEST } from '../src/viewer/selftest.ts'

const { rest } = parse(process.argv.slice(2))

if (rest['mode'] === 'selftest') {
  process.stdout.write(emit(SELFTEST))
} else {
  process.stdout.write(
    emit({
      mode: 'live',
      scale: 4,
      msPerFrame: 100,
      cells: [],
      title: 'claude-ink-2d',
      notes: ['left and right walk the history, one run per slide · space pauses · , and . step one frame'],
    }),
  )
}
