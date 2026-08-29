import {
  getPrototypeScenes,
  isPrototypeId,
  type PrototypeId,
} from '../projects/manifest.ts'

export const PROTOTYPES = [
  {
    id: 'new-project-prototype',
    title: 'New Project',
    eyebrow: 'Blank slate · Babylon scene',
    description:
      'An empty Babylon stage with ground, sky, key light and a walk camera, waiting for the next game concept.',
    status: 'Scaffold',
    format: 'Empty Babylon.js 3D scene',
    sceneCount: getPrototypeScenes('new-project-prototype').length,
    visual: 'blank',
    characterSummary: 'No character assets',
    environmentSummary: 'Native Babylon scaffold',
    inspectorEyebrow: 'Reusable Builder foundation',
    inspectorTitle: 'A clean stage with proven tooling',
    inspectorDescription:
      'The project is empty of game content while retaining Babylon lifecycle, runtime diagnostics, deterministic compilation, visual tests and offline authoring support.',
  },
] as const

export type { PrototypeId } from '../projects/manifest.ts'

export function resolvePrototypeId(value: string | null): PrototypeId | null {
  return isPrototypeId(value) ? value : null
}
