export const PROTOTYPE_IDS = [
  'ashfall-prototype',
  'sunlit-earth-prototype',
] as const

export type PrototypeId = (typeof PROTOTYPE_IDS)[number]

export const PROTOTYPE_SCENES = {
  'ashfall-prototype': [
    {
      id: 'wasteland-map',
      label: 'Ashfall Expanse',
      detail: 'WASD / arrows walk · explore Sector 07',
    },
  ],
  'sunlit-earth-prototype': [
    {
      id: 'sunlit-earth',
      label: 'Sunlit Earth',
      detail: 'WASD moves · mouse looks · a first true-3D terrain study',
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
