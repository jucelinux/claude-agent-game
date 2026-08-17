/**
 * The catalog is the lexicon's retrieval surface: an agent asks it what exists before
 * authoring. What the lock asserts is what retrieval needs — every entry described,
 * every reference real. It does NOT assert membership of `kind` or `tags` in a closed
 * set: a new taxonomy is added by using it (CLAUDE.md, don'ts — harvest, not design).
 */
import { describe, expect, it } from 'vitest'
import { CATALOG, GRAMMARS, PAIRS } from '../src/grammars/index.ts'
import { MICRO_GAMES } from '../src/micro/registry.ts'

const STATUSES = ['shipped', 'probe', 'retired'] as const

describe('the catalog', () => {
  it('keys every entry by its own grammar name — one name, one subject', () => {
    for (const [name, e] of Object.entries(CATALOG)) expect(e.grammar.name).toBe(name)
  })

  it('describes every entry with a line an agent can search', () => {
    for (const [name, e] of Object.entries(CATALOG)) {
      expect(e.kind.length, `${name} has no kind`).toBeGreaterThan(0)
      expect(e.description.length, `${name} description too thin to search`).toBeGreaterThanOrEqual(24)
      expect(STATUSES).toContain(e.status)
    }
  })

  it('points game references at routes that exist on the shelf', () => {
    const routes = new Set(MICRO_GAMES.map((g) => g.id))
    for (const [name, e] of Object.entries(CATALOG)) {
      for (const game of e.games ?? []) expect(routes.has(game), `${name} names unknown game "${game}"`).toBe(true)
    }
  })

  it('pairs every catalogued grammar with the tunables it was authored against', () => {
    const paired = new Set(PAIRS.map((p) => p.grammar))
    for (const name of Object.keys(GRAMMARS)) expect(paired.has(name), `${name} has no tunables pair`).toBe(true)
  })

  it('ships nothing unjudged into a game: a probe or retired grammar appears in no route', () => {
    for (const [name, e] of Object.entries(CATALOG)) {
      if (e.status !== 'shipped') expect(e.games ?? [], `${name} is ${e.status} but placed in a game`).toHaveLength(0)
    }
  })
})
