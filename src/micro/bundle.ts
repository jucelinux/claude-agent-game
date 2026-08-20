/**
 * **The runtime's delivery, and it is forty lines because it refuses to be a build step.**
 *
 * The browser runtime used to live inside a template literal in `app.ts` — 2014 lines of one
 * scope, invisible to the compiler, with backticks forbidden inside its own comments. It broke
 * the parse three times in one session, and a scene field that never reached the payload once
 * shipped through 522 green locks and died only in a browser. The cause was not carelessness:
 * a string cannot contradict the agent writing it.
 *
 * So the runtime is now real TypeScript modules under `src/runtime/`, and this turns them into
 * the one classic `<script>` the page has always served.
 *
 * **No dependency, and no build step.** Node strips the types itself (`node:module`), and the
 * module wiring is a twelve-line registry. The rule that made this affordable is that the
 * runtime's own import syntax is CONSTRAINED — see `RUNTIME_IMPORT` — and a lock asserts every
 * runtime module obeys it. A general bundler would be a general problem; this one only has to
 * read code the repository writes.
 *
 * Each generated module receives a `sourceURL`, so a browser exception names the TypeScript
 * module that owns it instead of one enormous inline HTML line. It is not a source map — the
 * reported line is the stripped module's line — but it turns "the runtime threw" into a file
 * an agent can open immediately.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { ROOT } from '../io/load.ts'

/**
 * **The only two import forms a runtime module may use**, both on one line, named bindings only.
 * Anything else is a parse this file would have to become clever about, and clever is what a
 * forty-line bundler cannot afford. `tests/runtime-shape.test.ts` locks it.
 */
export const RUNTIME_IMPORT = /^import\s+\{([^}]+)\}\s+from\s+'\.\/([\w-]+)\.ts'$/
const RUNTIME_TYPE_IMPORT = /^import\s+type\s+/

const DIR = `${ROOT}src/runtime/`

/** Every runtime module, by name, in a stable order — the directory listing, sorted. */
export const runtimeModules = (): readonly string[] =>
  readdirSync(DIR).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3)).sort()

export type ModuleSource = { readonly name: string; readonly needs: readonly string[]; readonly body: string }

/**
 * **Read one module and separate its wiring from its code.** Types are stripped first, because
 * `import type` lines vanish there and never reach the regex — one fewer case to be clever
 * about. What is left is plain JavaScript plus the two constrained forms.
 */
export function readModule(name: string): ModuleSource {
  const src = readFileSync(`${DIR}${name}.ts`, 'utf8')
  const stripped = stripTypeScriptTypes(src, { mode: 'strip' })
  const needs: string[] = []
  const out: string[] = []
  for (const line of stripped.split('\n')) {
    const t = line.trim()
    if (RUNTIME_TYPE_IMPORT.test(t)) continue
    const m = RUNTIME_IMPORT.exec(t)
    if (m !== null) {
      needs.push(m[2]!)
      // The binding list becomes a destructure of the module's exports, evaluated at call time
      // so a cycle between two modules is a late read rather than an undefined one.
      out.push(`const {${m[1]!.replace(/\s+as\s+/g, ': ')}} = __req('${m[2]!}')`)
      continue
    }
    if (t.startsWith('import ')) {
      throw new Error(`src/runtime/${name}.ts: unsupported import — runtime modules use the two forms in bundle.ts:\n  ${t}`)
    }
    out.push(line.replace(/^export\s+(function|const|let|var|class)\s/, '$1 '))
  }
  // Exports are collected after stripping, from the source, so `export type` never lands here.
  const exported = [...stripped.matchAll(/^export\s+(?:function|const|let|var|class)\s+([\w$]+)/gm)].map((m) => m[1]!)
  const tail = exported.length === 0 ? '' : `\n__x = {${exported.map((e) => `${e}: ${e}`).join(', ')}}`
  return { name, needs, body: `${out.join('\n')}${tail}` }
}

/**
 * **The registry, and it is the whole of the module system.** Modules are evaluated on first
 * request and cached, so the order in the file does not matter and a diamond is evaluated once.
 * Each body runs in its own function scope — which is the point of the exercise: `var side` in
 * two different games can no longer be one variable.
 */
export function bundleRuntime(entry = 'mount'): string {
  const parts = runtimeModules().map(readModule)
  const defs = parts
    .map((p) => {
      const source = `(function(){ var __x = {}\n${p.body}\nreturn __x })\n//# sourceURL=/src/runtime/${p.name}.ts`
      // Direct eval is deliberate: unlike `Function`, the module keeps the page/harness lexical
      // environment (document, requestAnimationFrame, atob). The source is repository-owned.
      return `__m['${p.name}'] = eval(${JSON.stringify(source)})`
    })
    .join('\n')
  return `var __m = {}, __c = {}
function __req(k){ if (__c[k]) return __c[k]; var f = __m[k]; if (!f) throw new Error('no runtime module ' + k); return (__c[k] = f()) }
${defs}
var __entry = __req('${entry}')
var mount = __entry.mount
`
}
