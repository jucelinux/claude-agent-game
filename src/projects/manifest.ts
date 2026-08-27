export const PROTOTYPE_IDS = [
  'new-project-prototype',
] as const

export type PrototypeId = (typeof PROTOTYPE_IDS)[number]

export const PROTOTYPE_SCENES = {
  'new-project-prototype': [
    {
      id: 'new-project',
      label: 'Blank Scene',
      detail: 'WASD moves · mouse looks · empty Babylon stage for the next game',
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
