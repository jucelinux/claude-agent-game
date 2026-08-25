export const PROTOTYPE_IDS = [
  'pyramid-glyph-prototype',
  'ashfall-prototype',
] as const

export type PrototypeId = (typeof PROTOTYPE_IDS)[number]

export const PROTOTYPE_SCENES = {
  'pyramid-glyph-prototype': [
    {
      id: 'depth-study',
      label: 'Pyramid chambers',
      detail: 'WASD / arrows · E or Space enters a glowing mural',
    },
    {
      id: 'glyph-puzzle',
      label: 'Glyph puzzle',
      detail: 'Find the golden key · E breaks the vessel',
    },
    {
      id: 'glyph-platform',
      label: 'Glyph platform',
      detail: 'Climb and face the guardian · E throws stones',
    },
  ],
  'ashfall-prototype': [
    {
      id: 'wasteland-map',
      label: 'Ashfall Expanse',
      detail: 'WASD / arrows walk · explore Sector 07',
    },
  ],
} as const

type PrototypeSceneMap = typeof PROTOTYPE_SCENES

export type WorkspaceScene = PrototypeSceneMap[PrototypeId][number]['id']

export type WorkspaceSceneDefinition = {
  readonly id: WorkspaceScene
  readonly label: string
  readonly detail: string
}

export function isPrototypeId(value: string | null): value is PrototypeId {
  return PROTOTYPE_IDS.some((id) => id === value)
}

export function getPrototypeScenes(
  prototypeId: PrototypeId,
): readonly WorkspaceSceneDefinition[] {
  return PROTOTYPE_SCENES[prototypeId]
}
