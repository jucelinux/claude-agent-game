import {
  getPrototypeScenes,
  isPrototypeId,
  type PrototypeId,
} from '../projects/manifest.ts'

export const PROTOTYPES = [
  {
    id: 'lcd-platformer-prototype',
    title: 'LCD Platformer',
    eyebrow: '2D study · articulated mecha',
    description:
      'A maintenance mecha traverses giant chip packages, soldered terminals and a ruptured power rail inside colossal hardware.',
    status: 'Playable',
    format: 'Babylon.js 2D · Sprite + meshes',
    sceneCount: getPrototypeScenes('lcd-platformer-prototype').length,
    visual: 'lcd',
  },
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
