import {
  getPrototypeScenes,
  isPrototypeId,
  type PrototypeId,
} from '../projects/manifest.ts'

export const PROTOTYPES = [
  {
    id: 'pyramid-glyph-prototype',
    title: 'Pyramid Glyph Prototype',
    eyebrow: 'Ancient Egypt · Another World study',
    description:
      'A mixed 3D and 2D adventure through pyramid chambers, living hieroglyphs, puzzles and a compact boss encounter.',
    status: 'Playable',
    format: '3D chamber + 2D glyph worlds',
    sceneCount: getPrototypeScenes('pyramid-glyph-prototype').length,
    visual: 'pyramid',
  },
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
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
