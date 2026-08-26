import {
  getPrototypeScenes,
  isPrototypeId,
  type PrototypeId,
} from '../projects/manifest.ts'

export const PROTOTYPES = [
  {
    id: 'ashfall-prototype',
    title: 'Ashfall Expanse',
    eyebrow: 'Post-apocalypse · Isometric exploration',
    description:
      'A wide ruined district made for quiet traversal through broken infrastructure, dry canals and cities disappearing into dust.',
    status: 'Playable',
    format: 'Wide isometric traversal',
    sceneCount: getPrototypeScenes('ashfall-prototype').length,
    visual: 'wasteland',
  },
  {
    id: 'sunlit-earth-prototype',
    title: 'Sunlit Earth',
    eyebrow: 'True 3D · Environment study',
    description:
      'A quiet sunlit landscape with warm earth, open sky and room for the next gameplay direction.',
    status: 'Playable',
    format: 'Babylon.js true-3D environment',
    sceneCount: getPrototypeScenes('sunlit-earth-prototype').length,
    visual: 'sunlit',
  },
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
