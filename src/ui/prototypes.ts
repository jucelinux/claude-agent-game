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
    characterSummary: 'Mecha motion atlas · 60f',
    environmentSummary: 'Colossal PCB · Babylon meshes',
    inspectorEyebrow: 'Playable environment study',
    inspectorTitle: 'Maintenance unit inside colossal hardware',
    inspectorDescription:
      'A Blender-authored profile mecha traverses a processor package, oversized chip leads, exposed copper and a burnt power rail built directly from native Babylon geometry.',
  },
  {
    id: 'einstein-low-poly-prototype',
    title: 'The Relativity Workshop',
    eyebrow: '3D study · low-poly professor',
    description:
      'A wild-haired physicist stands inside a cutaway laboratory built from faceted geometry and tiny pixel textures.',
    status: 'Playable',
    format: 'Babylon.js 3D · Animated GLB + 16px textures',
    sceneCount: getPrototypeScenes('einstein-low-poly-prototype').length,
    visual: 'einstein',
    characterSummary: 'Professor rig · CC0 idle + walk',
    environmentSummary: 'Cutaway laboratory · 16px textures',
    inspectorEyebrow: 'Playable low-poly study',
    inspectorTitle: 'A miniature workshop for impossible ideas',
    inspectorDescription:
      'The character and room are authored offline in Blender as ordinary animated GLB content. Babylon owns locomotion playback, collisions, orbital camera, lighting, shadows and scene lifecycle.',
  },
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
