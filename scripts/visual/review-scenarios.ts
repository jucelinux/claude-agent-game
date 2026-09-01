import type { PrototypeMaturity } from '../../src/ui/prototypes.ts'

export type VisualReviewView = {
  readonly key: string
  readonly slug: string
  readonly label: string
  readonly purpose: string
}

export type VisualReviewScenario = {
  readonly prototypeId: string
  readonly title: string
  readonly maturity: PrototypeMaturity
  readonly brief: string
  readonly views: readonly VisualReviewView[]
}

/** Offline review scenarios. Each key maps to a scene-owned Babylon camera bookmark. */
export const VISUAL_REVIEW_SCENARIOS: readonly VisualReviewScenario[] = [
  {
    prototypeId: 'tokyo-neon-89',
    title: 'Tokyo Neon ’89',
    maturity: 'art-pass',
    brief: 'docs/visual-direction/tokyo-neon-89.md',
    views: [
      {
        key: '1',
        slug: '01-alley-entry',
        label: 'Alley entry',
        purpose: 'Target-frame hierarchy, spatial pressure and invitation toward the turn',
      },
      {
        key: '2',
        slug: '02-lit-turn',
        label: 'Lit turn',
        purpose: 'The route bends right behind an illuminated threshold',
      },
      {
        key: '3',
        slug: '03-kissa-frontage',
        label: 'Kissa frontage',
        purpose: 'Correct sign orientation, shutters, utilities and accumulated use',
      },
      {
        key: '4',
        slug: '04-service-turn',
        label: 'Service turn',
        purpose: 'Secondary-route rhythm, asymmetry and environmental story',
      },
      {
        key: '5',
        slug: '05-night-counter',
        label: 'Night counter',
        purpose: 'Human presence, local light and a destination beyond the entry frame',
      },
    ],
  },
]
