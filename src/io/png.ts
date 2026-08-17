/**
 * A minimal PNG encoder over `node:zlib` — no dependency, RGB color type 2.
 *
 * This exists for ONE consumer: `bin/see.ts`, the agent's structured look during the
 * bench loop (CLAUDE.md §5, amended 16/08). The encode is pure: same frames, same
 * palette, same scale → byte-identical file. That determinism is locked, because an
 * instrument whose output drifts cannot be compared against itself.
 */
import { deflateSync } from 'node:zlib'
import type { IndexedBuffer, Palette, RGB } from '../core/types.ts'
import { GROUND_RGB } from '../core/color.ts'

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = (CRC_TABLE[(c ^ (bytes[i] as number)) & 0xff] as number) ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** Encode raw RGB rows (no filter) into a complete PNG file. */
export function encodePng(w: number, h: number, rgb: Uint8Array): Uint8Array {
  if (rgb.length !== w * h * 3) throw new Error(`rgb buffer is ${rgb.length}, want ${w * h * 3}`)
  const ihdr = new Uint8Array(13)
  const iv = new DataView(ihdr.buffer)
  iv.setUint32(0, w)
  iv.setUint32(4, h)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  // compression 0, filter 0, interlace 0 already zeroed
  const raw = new Uint8Array(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    // filter byte 0 per scanline, then the row
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1)
  }
  const idat = new Uint8Array(deflateSync(raw, { level: 9 }))
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const file = new Uint8Array(total)
  let at = 0
  for (const p of parts) {
    file.set(p, at)
    at += p.length
  }
  return file
}

/**
 * Compose a frame strip into one contact-sheet PNG: frames side by side, integer scale,
 * index 0 painted as the measurement ground (`GROUND_RGB`) — the same reference the
 * edge-contrast lock measures against, so the look and the lock see the same picture.
 */
export function sheetPng(
  frames: readonly IndexedBuffer[],
  palette: Palette,
  scale: number,
  gutter = 2,
): Uint8Array {
  const first = frames[0]
  if (first === undefined) throw new Error('sheetPng wants at least one frame')
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`scale must be a positive integer, is ${scale}`)
  const w = (first.w * frames.length + gutter * (frames.length - 1)) * scale
  const h = first.h * scale
  const rgb = new Uint8Array(w * h * 3)
  const ground = GROUND_RGB
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = ground[0]
    rgb[i + 1] = ground[1]
    rgb[i + 2] = ground[2]
  }
  frames.forEach((frame, f) => {
    if (frame.w !== first.w || frame.h !== first.h) {
      throw new Error(`frame ${f} is ${frame.w}x${frame.h}, want ${first.w}x${first.h}`)
    }
    const x0 = f * (first.w + gutter) * scale
    for (let y = 0; y < frame.h; y++) {
      for (let x = 0; x < frame.w; x++) {
        const index = frame.data[y * frame.w + x] as number
        if (index === 0) continue
        const color = palette.colors[index] as RGB | undefined
        if (color === undefined) throw new Error(`palette "${palette.name}" has no colour at index ${index}`)
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const at = ((y * scale + sy) * w + x0 + x * scale + sx) * 3
            rgb[at] = color[0]
            rgb[at + 1] = color[1]
            rgb[at + 2] = color[2]
          }
        }
      }
    }
  })
  return encodePng(w, h, rgb)
}
