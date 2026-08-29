export const PROTOTYPE_IDS = [
  'lcd-platformer-prototype',
  'einstein-low-poly-prototype',
] as const

export type PrototypeId = (typeof PROTOTYPE_IDS)[number]

export const PROTOTYPE_SCENES = {
  'lcd-platformer-prototype': [
    {
      id: 'lcd-platformer',
      label: 'Colossal PCB Chamber',
      detail: 'A/D or arrows move · W/↑/Space jumps · R resets',
    },
  ],
  'einstein-low-poly-prototype': [
    {
      id: 'einstein-diorama',
      label: 'The Relativity Workshop',
      detail: 'WASD/arrows move · drag orbits · wheel zooms · R resets',
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
