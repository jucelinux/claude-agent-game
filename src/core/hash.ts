import { createHash } from 'node:crypto'
import type { IndexedBuffer } from './types.ts'

/** The state hash of a run: dimensions and index bytes of every frame, in order. */
export function hashBuffers(buffers: readonly IndexedBuffer[]): string {
  const h = createHash('sha256')
  const head = Buffer.alloc(8)
  for (const b of buffers) {
    head.writeUInt32LE(b.w, 0)
    head.writeUInt32LE(b.h, 4)
    h.update(head)
    h.update(b.data)
  }
  return h.digest('hex').slice(0, 16)
}
