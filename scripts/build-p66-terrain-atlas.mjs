import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const rawDirectory = resolve(process.argv[2] ?? '/tmp/p66-grid-raw')
const outputDirectory = resolve(process.argv[3] ?? 'public/assets/landing')
const workDirectory = resolve(process.argv[4] ?? '/tmp/p66-grid-build')
const manifest = JSON.parse(readFileSync(resolve(rawDirectory, 'manifest.json'), 'utf8'))
const frameCount = manifest.frames.length
const framesPerAtlas = 16
const atlasCount = Math.ceil(frameCount / framesPerAtlas)
const frameWidth = manifest.logicalWidth
const frameHeight = manifest.logicalHeight

if (frameCount !== 400) throw new Error(`Expected 400 P66 frames, received ${frameCount}.`)
if (frameWidth !== 352 || frameHeight !== 198) {
  throw new Error(`Expected 352 × 198 P66 frames, received ${frameWidth} × ${frameHeight}.`)
}
mkdirSync(outputDirectory, { recursive: true })
rmSync(workDirectory, { recursive: true, force: true })
mkdirSync(resolve(workDirectory, 'quantized'), { recursive: true })

const run = (ffmpegArguments) => {
  const result = spawnSync('ffmpeg', ['-y', '-v', 'error', ...ffmpegArguments], { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`ffmpeg failed with status ${result.status}.`)
}

const palettePath = resolve(workDirectory, 'p66-terrain-palette.png')
run([
  '-framerate', '1', '-start_number', '0',
  '-i', resolve(rawDirectory, 'p66-frame-%03d.png'),
  '-frames:v', String(frameCount),
  '-vf', 'palettegen=max_colors=16:stats_mode=full',
  palettePath,
])

run([
  '-framerate', '1', '-start_number', '0',
  '-i', resolve(rawDirectory, 'p66-frame-%03d.png'),
  '-i', palettePath,
  '-frames:v', String(frameCount),
  '-lavfi', 'paletteuse=dither=bayer:bayer_scale=3',
  '-start_number', '0',
  resolve(workDirectory, 'quantized/p66-frame-%03d.png'),
])

for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
  const frame = resolve(
    workDirectory,
    `quantized/p66-frame-${String(frameIndex).padStart(3, '0')}.png`,
  )
  if (!existsSync(frame)) throw new Error(`Missing quantized P66 frame ${frameIndex}.`)
}
const overflowFrame = resolve(
  workDirectory,
  `quantized/p66-frame-${String(frameCount).padStart(3, '0')}.png`,
)
if (existsSync(overflowFrame)) {
  throw new Error(`Unexpected quantized P66 frame ${frameCount}; output numbering is shifted.`)
}

for (let atlasIndex = 0; atlasIndex < atlasCount; atlasIndex += 1) {
  const output = resolve(outputDirectory, `p66-terrain-atlas-${String(atlasIndex).padStart(2, '0')}.png`)
  run([
    '-framerate', '1', '-start_number', String(atlasIndex * framesPerAtlas),
    '-i', resolve(workDirectory, 'quantized/p66-frame-%03d.png'),
    '-vf', 'tile=4x4:padding=0:margin=0',
    '-frames:v', '1',
    output,
  ])
}

copyFileSync(palettePath, resolve(outputDirectory, 'p66-terrain-palette.png'))
copyFileSync(resolve(rawDirectory, 'manifest.json'), resolve(outputDirectory, 'p66-terrain-manifest.json'))

const pngDimensions = (path) => {
  const source = readFileSync(path)
  return [source.readUInt32BE(16), source.readUInt32BE(20)]
}

for (let atlasIndex = 0; atlasIndex < atlasCount; atlasIndex += 1) {
  const path = resolve(outputDirectory, `p66-terrain-atlas-${String(atlasIndex).padStart(2, '0')}.png`)
  const dimensions = pngDimensions(path)
  if (dimensions[0] !== frameWidth * 4 || dimensions[1] !== frameHeight * 4) {
    throw new Error(`${path} has invalid dimensions ${dimensions.join(' × ')}.`)
  }
}

process.stdout.write(`Built ${atlasCount} palette-locked atlases from ${frameCount} Blender states.\n`)
