import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { RUNTIME_IMPORT, bundleRuntime, readModule, runtimeModules } from '../src/micro/bundle.ts'
import { ROOT } from '../src/io/load.ts'
import main from '../tsconfig.json' with { type: 'json' }
import runtime from '../tsconfig.runtime.json' with { type: 'json' }

/**
 * **The contract that lets a forty-line bundler be enough.**
 *
 * The browser runtime is served by concatenating typed modules into one classic script, and that
 * is affordable only because the runtime's own import syntax is CONSTRAINED. A general bundler
 * would be a general problem; this one only has to read code this repository writes — so these
 * locks are what make "code this repository writes" a fact rather than an intention.
 *
 * They also hold the two structural claims the refactor was FOR: no module may reach for the
 * runtime of another game, and no module may be a cycle.
 */
describe('the runtime keeps the shape its delivery depends on', () => {
  const modules = runtimeModules()

  it('there is a module per game shape, and they are the ones the shelf has', () => {
    for (const name of ['mount', 'climb', 'runner', 'descent', 'arena', 'stage', 'paint', 'types']) {
      expect(modules, `src/runtime/${name}.ts is missing`).toContain(name)
    }
  })

  for (const name of runtimeModules()) {
    it(`${name}.ts uses only the two import forms the bundler reads`, () => {
      const src = readFileSync(`${ROOT}src/runtime/${name}.ts`, 'utf8')
      for (const line of src.split('\n')) {
        const t = line.trim()
        if (!t.startsWith('import ')) continue
        if (t.startsWith('import type ')) continue
        expect(RUNTIME_IMPORT.test(t), `${name}.ts: ${t}`).toBe(true)
      }
    })
  }

  it('no module imports another game, which is the whole point of splitting them', () => {
    // The five shapes are siblings. If one of them ever needs another's internals, the thing to
    // move is the shared part into `paint.ts` — not to open a door between two games.
    const shapes = ['climb', 'runner', 'descent', 'arena', 'stage']
    for (const a of shapes) {
      const needs = readModule(a).needs
      for (const b of shapes) {
        if (a !== b) expect(needs, `${a}.ts imports ${b}.ts`).not.toContain(b)
      }
    }
  })

  it('the module graph is acyclic, because the registry evaluates on first use', () => {
    const need = new Map(modules.map((m) => [m, readModule(m).needs]))
    const seen = new Set<string>()
    const stack = new Set<string>()
    const walk = (m: string): void => {
      if (seen.has(m)) return
      expect(stack.has(m), `${m}.ts is part of an import cycle`).toBe(false)
      stack.add(m)
      for (const n of need.get(m) ?? []) walk(n)
      stack.delete(m)
      seen.add(m)
    }
    for (const m of modules) walk(m)
  })

  it('the bundle is deterministic and parses', () => {
    const once = bundleRuntime()
    expect(bundleRuntime()).toBe(once)
    // `new Function` is the same parse the page gets, and it is the check that used to be
    // impossible: a backtick inside a comment broke the old runtime three times in one session
    // and only ever showed up as a TypeScript syntax error in a completely different file.
    expect(() => new Function(once)).not.toThrow()
    expect(once).toContain("var mount = __entry.mount")
  })

  /**
   * **The runtime is held to the same strictness as everything else, and this is what keeps it
   * there.**
   *
   * It landed at 671 errors and needed its own project to compile at all. The relaxations were
   * declared debt with a number; closing them took a layer accessor, a non-null alias per shape
   * and the actor's own declaration captured where it was checked. The only difference left is
   * `lib`, because this half runs in a browser and the other half does not — and a lock is the
   * only thing that stops "temporarily relaxed" from becoming permanent.
   */
  it('the runtime project relaxes nothing except the standard library', () => {
    const relaxable = ['strict', 'strictNullChecks', 'noImplicitAny', 'noUncheckedIndexedAccess',
                       'noImplicitOverride', 'erasableSyntaxOnly', 'verbatimModuleSyntax']
    const opts = runtime.compilerOptions as Record<string, unknown>
    for (const key of relaxable) {
      expect(opts[key], `tsconfig.runtime.json relaxes ${key}`).toBeUndefined()
    }
    expect(Object.keys(opts).sort(), 'the runtime project overrides something new').toEqual(['lib'])
    expect((main.compilerOptions as Record<string, unknown>)['strict']).toBe(true)
  })

  it('no shape reaches for a clock, and only the frame loop may', () => {
    // The narrow version of the determinism lock, stated where the runtime can see it: the
    // exemption used to cover 2200 lines because the whole runtime lived in one of them.
    for (const name of modules) {
      if (name === 'mount') continue
      const src = readFileSync(`${ROOT}src/runtime/${name}.ts`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(/performance\.now|Date\.now|Math\.random/.test(src), `${name}.ts reaches for a clock`).toBe(false)
    }
  })
})
