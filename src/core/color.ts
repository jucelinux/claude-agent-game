import type { RGB } from './types.ts'

/**
 * Relative luminance, 0..1. Core, not presentation: **value separation is a property of the
 * art, not of the page that shows it**, and both the agent's text dump and the silhouette
 * locks have to agree on what "darker" means or they measure two different things.
 * portable.
 */
export function luminance(rgb: RGB): number {
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
}

/**
 * The ground the sprite is judged against. It has to match the viewer's, because index 0 is
 * transparent and the page's background *is* the sprite's background — a lock measuring
 * contrast against a different grey than the eye sees is a lock measuring nothing. The two
 * are pinned together by a test rather than by an import, since the core may not reach into
 * the presentation layer (`HARNESS.md` §2.1).
 */
export const GROUND_RGB: RGB = [0x6b, 0x6b, 0x6b]
