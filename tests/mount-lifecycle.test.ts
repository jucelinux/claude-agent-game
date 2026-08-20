import { describe, expect, it } from 'vitest'
import { gamePage, shelfPage } from '../src/micro/app.ts'
import { forestScene } from '../src/micro/forest-scene.ts'
import { toStage } from '../src/scene/layers.ts'
import { run } from './harness.ts'

const stage = toStage(forestScene)
const game = { id: 'forest', title: 'Forest', blurb: '', date: '', meta: [], stage }

describe('mounted games have a viewport lifecycle', () => {
  it('stops simulation while paused and resumes without catching up the hidden interval', () => {
    const h = run(gamePage(game))
    h.tick(0); h.tick(100)
    const before = h.observe()
    expect(before.kind).toBe('stage')
    if (before.kind !== 'stage' || before.state === null) throw new Error('forest has no player')
    const beforeX = before.state.x
    const snapshot = JSON.stringify(before)

    h.key('ArrowRight', true, 100)
    h.pause(); h.tick(5_000)
    expect(JSON.stringify(h.observe())).toBe(snapshot)

    h.resume(); h.tick(10_000)
    expect(JSON.stringify(h.observe())).toBe(snapshot)
    h.tick(10_017)
    const after = h.observe()
    if (after.kind !== 'stage' || after.state === null) throw new Error('forest player disappeared')
    expect(after.state.x).toBeGreaterThan(beforeX)
  })

  it('mounts shelf cards near the viewport and pauses cards that leave it', () => {
    const html = shelfPage([game])
    expect(html).toContain('IntersectionObserver')
    expect(html).toContain("rootMargin: '160px 0px'")
    expect(html).toContain('__mounted[i].pause()')
    expect(html).toContain('__mounted[i].resume()')
  })
})
