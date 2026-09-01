import {
  getPrototypeScenes,
  isPrototypeId,
  type PrototypeId,
} from '../projects/manifest.ts'

export const PROTOTYPE_MATURITIES = [
  'reference',
  'blockout',
  'art-pass',
  'review-candidate',
  'approved',
] as const

export type PrototypeMaturity = (typeof PROTOTYPE_MATURITIES)[number]

export const PROTOTYPE_MATURITY_LABELS: Readonly<Record<PrototypeMaturity, string>> = {
  reference: 'Reference',
  blockout: 'Blockout',
  'art-pass': 'Art pass',
  'review-candidate': 'Review candidate',
  approved: 'Approved',
}

type PrototypeDefinition = {
  readonly id: PrototypeId
  readonly title: string
  readonly eyebrow: string
  readonly description: string
  readonly maturity: PrototypeMaturity
  readonly visualBrief: string
  readonly format: string
  readonly sceneCount: number
  readonly visual: string
  readonly characterSummary: string
  readonly environmentSummary: string
  readonly inspectorEyebrow: string
  readonly inspectorTitle: string
  readonly inspectorDescription: string
}

export const PROTOTYPES: readonly PrototypeDefinition[] = [
  {
    id: 'tokyo-neon-89',
    title: 'Tokyo Neon ’89',
    eyebrow: 'Art pass · PS1 Asian Gothic target',
    description:
      'A target-driven Shinjuku alley art pass translating Kowloon’s Gate spatial pressure into a navigable Tokyo ’89 scene.',
    maturity: 'art-pass',
    visualBrief: 'docs/visual-direction/tokyo-neon-89.md',
    format: 'Babylon.js PS1-target art pass',
    sceneCount: getPrototypeScenes('tokyo-neon-89').length,
    visual: 'neon',
    characterSummary: 'First-person environment study',
    environmentSummary: 'Authored L-shaped alley and low-resolution signage',
    inspectorEyebrow: 'Target approved · render awaiting review',
    inspectorTitle: 'Shinjuku alley art pass',
    inspectorDescription:
      'The approved Kowloon’s Gate composition now shapes the route, facades, lighting and PS1 image grammar. The rendered interpretation remains an art pass until it clears canonical visual review.',
  },
]

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
