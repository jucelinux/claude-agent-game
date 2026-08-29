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
    title: 'Einstein: Quantum Field',
    eyebrow: '3D action study · wave/particle duality',
    description:
      'Einstein crosses a luminous subatomic field and projects photons as particles or propagating waves.',
    status: 'Playable',
    format: 'Babylon.js 3D · Animated GLB + native meshes',
    sceneCount: getPrototypeScenes('einstein-low-poly-prototype').length,
    visual: 'einstein',
    characterSummary: 'Professor rig · CC0 idle + walk',
    environmentSummary: 'Subatomic field · native Babylon meshes',
    inspectorEyebrow: 'Playable quantum action study',
    inspectorTitle: 'Wave and particle, at Einstein’s fingertips',
    inspectorDescription:
      'The animated character is authored offline in Blender. Babylon owns the procedural quantum field, aiming, photon motion, locomotion playback, lighting, shadows and scene lifecycle.',
  },
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
