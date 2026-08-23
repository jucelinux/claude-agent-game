import { describe, expect, it } from 'vitest'
import { ASTRONAUT, FACINGS } from '../src/grammars/characters/astronaut.ts'
import { MOON } from '../src/grammars/scenery/moon.ts'
import { GRAMMARS } from '../src/grammars/index.ts'

describe('the retained authorial project', () => {
  it('contains three astronaut motions in five authored facings', () => {
    expect(ASTRONAUT).toHaveLength(15)
    expect(FACINGS).toEqual(['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'])
    for (const motion of ['idle', 'lope', 'leap']) {
      for (const facing of ['e', 'ne', 'n', 'se', 's']) {
        expect(GRAMMARS[`astro-${motion}-${facing}`]).toBeDefined()
      }
    }
  })

  it('retains the Earth, crater family and lunar rocks', () => {
    expect(MOON.map((grammar) => grammar.name)).toEqual([
      'earth',
      'crater-a', 'crater-b', 'crater-c', 'crater-d', 'crater-e', 'crater-f',
      'rock-a', 'rock-b', 'rock-c',
    ])
  })
})
