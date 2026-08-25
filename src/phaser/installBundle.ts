import Phaser from 'phaser'
import type { CompiledBundle } from '../compiler/types.ts'

export function installBundle(scene: Phaser.Scene, bundle: CompiledBundle): void {
  for (const clip of bundle.clips) {
    if (!scene.textures.exists(clip.textureKey)) {
      const texture = scene.textures.createCanvas(clip.textureKey, clip.atlas.w, clip.atlas.h)
      if (texture === null) throw new Error(`Phaser could not create texture "${clip.textureKey}"`)
      const context = texture.getContext()
      const pixels = context.createImageData(clip.atlas.w, clip.atlas.h)
      pixels.data.set(clip.atlas.rgba)
      context.putImageData(pixels, 0, 0)
      texture.refresh()
      for (const frame of clip.frames) {
        texture.add(frame.index, 0, frame.x, frame.y, frame.w, frame.h)
      }
    }

    if (!scene.anims.exists(clip.id)) {
      const firstFrame = clip.frames[0]
      if (firstFrame === undefined) throw new Error(`${clip.id}: no animation frames`)
      const baseDuration = Math.min(...clip.frames.map((frame) => frame.durationMs))
      scene.anims.create({
        key: clip.id,
        frames: clip.frames.map((frame) => ({
          key: clip.textureKey,
          frame: frame.index,
          duration: frame.durationMs - baseDuration,
        })),
        frameRate: 1000 / baseDuration,
        repeat: clip.loops ? -1 : 0,
      })
    }
  }
}
