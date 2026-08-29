import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'

const ASSET_DIR = resolve(process.cwd(), 'public/assets/einstein-diorama')

function readGlbJson(buffer: Buffer): Record<string, unknown> {
  expect(buffer.subarray(0, 4).toString('ascii')).toBe('glTF')
  expect(buffer.readUInt32LE(4)).toBe(2)
  expect(buffer.readUInt32LE(8)).toBe(buffer.byteLength)
  const jsonLength = buffer.readUInt32LE(12)
  expect(buffer.subarray(16, 20).toString('ascii')).toBe('JSON')
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8')) as Record<string, unknown>
}

describe('low-poly professor character asset', () => {
  it('ships a character-only GLB with a recognizable silhouette', async () => {
    const buffer = await readFile(resolve(ASSET_DIR, 'einstein-lab.glb'))
    const gltf = readGlbJson(buffer)
    const nodes = gltf.nodes as readonly { readonly name?: string }[]
    const meshes = gltf.meshes as readonly unknown[]
    const materials = gltf.materials as readonly unknown[]
    const images = gltf.images as readonly unknown[]
    const animations = gltf.animations as readonly { readonly name?: string }[]
    const names = nodes.map((node) => node.name ?? '')

    expect(buffer.byteLength).toBeGreaterThan(150_000)
    expect(meshes.length).toBeGreaterThanOrEqual(35)
    expect(materials.length).toBe(6)
    expect(images.length).toBe(6)
    expect(names).toContain('Character_Head')
    expect(names).toContain('Character_Mustache_L')
    expect(names.filter((name) => name.startsWith('Character_Hair_')).length).toBeGreaterThan(10)
    expect(names.some((name) => name.startsWith('Environment_'))).toBe(false)
    expect(names).toContain('Character_Rig')
    expect(animations.map((animation) => animation.name)).toEqual(['Idle_Loop', 'Walk_Loop'])
  })

  it('retains tiny source textures and the authored catalog preview', async () => {
    const files = await readdir(ASSET_DIR)
    const textures = files.filter((name) => name.startsWith('tex-') && name.endsWith('.png'))
    expect(textures).toHaveLength(6)

    for (const texture of textures) {
      const png = PNG.sync.read(await readFile(resolve(ASSET_DIR, texture)))
      expect([png.width, png.height]).toEqual([16, 16])
    }

    const preview = PNG.sync.read(await readFile(resolve(ASSET_DIR, 'preview.png')))
    expect([preview.width, preview.height]).toEqual([960, 540])
  })
})
