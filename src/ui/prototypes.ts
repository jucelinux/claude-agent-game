import { WORKSPACE_SCENES } from '../game/types.ts'

export const PROTOTYPES = [
  {
    id: 'pyramid-glyph-prototype',
    title: 'Pyramid Glyph Prototype',
    eyebrow: 'Ancient Egypt · Another World study',
    description:
      'A mixed 3D and 2D adventure through pyramid chambers, living hieroglyphs, puzzles and a compact boss encounter.',
    status: 'Playable',
    format: '3D chamber + 2D glyph worlds',
    sceneCount: WORKSPACE_SCENES.length,
  },
] as const

export type PrototypeId = (typeof PROTOTYPES)[number]['id']

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return PROTOTYPES.some((prototype) => prototype.id === value)
    ? value as PrototypeId
    : null
}
