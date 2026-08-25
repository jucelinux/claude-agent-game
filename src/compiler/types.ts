import type { Grammar, IndexedBuffer, Params, RGB } from '../core/types.ts'

export type AssetKind = 'character' | 'environment'

export type GrammarAssetSource = {
  readonly id: string
  readonly kind: AssetKind
  readonly grammar: Grammar
  readonly params: Params
}

export type RasterAssetSource = {
  readonly id: string
  readonly kind: AssetKind
  readonly raster: {
    readonly frames: readonly {
      readonly buf: IndexedBuffer
      readonly t: number
      readonly durationMs: number
    }[]
    readonly palette: readonly RGB[]
    readonly origin: { readonly x: number; readonly y: number }
    readonly contact: { readonly x: number; readonly y: number }
    readonly phases: readonly { readonly name: string; readonly at: number; readonly frame: number }[]
    readonly loops: boolean
    readonly materials: readonly { readonly name: string; readonly indices: readonly number[] }[]
  }
}

export type AssetSource = GrammarAssetSource | RasterAssetSource

export type AtlasFrame = {
  readonly index: number
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly t: number
  readonly durationMs: number
}

export type CompiledClip = {
  readonly id: string
  readonly kind: AssetKind
  readonly textureKey: string
  readonly atlas: {
    readonly w: number
    readonly h: number
    readonly rgba: Uint8ClampedArray
  }
  readonly cell: { readonly w: number; readonly h: number }
  readonly origin: { readonly x: number; readonly y: number }
  readonly contact: { readonly x: number; readonly y: number }
  readonly bounds: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
  readonly frames: readonly AtlasFrame[]
  readonly phases: readonly { readonly name: string; readonly at: number; readonly frame: number }[]
  readonly loops: boolean
  readonly palette: readonly RGB[]
  readonly materials: readonly { readonly name: string; readonly indices: readonly number[] }[]
  readonly anchors: readonly {
    readonly name: string
    readonly parent: string | null
    readonly x: number
    readonly y: number
    readonly angleTurns: number
  }[]
  readonly checksum: string
}

export type CompiledBundle = {
  readonly format: 'agent-game-bundle'
  readonly version: 1
  readonly project: string
  readonly seed: number
  readonly clips: readonly CompiledClip[]
  readonly checksum: string
}
