import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { PNG } from 'pngjs'

const values = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]
  if (key === undefined || value === undefined || !key.startsWith('--')) {
    throw new Error('atlas arguments must be --key value pairs')
  }
  values.set(key.slice(2), value)
}

const required = (key) => {
  const value = values.get(key)
  if (value === undefined) throw new Error(`missing --${key}`)
  return value
}

const positiveInteger = (key) => {
  const value = Number(required(key))
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${key} must be a positive integer`)
  }
  return value
}

const inputDir = path.resolve(required('input-dir'))
const output = path.resolve(required('output'))
const columns = positiveInteger('columns')
const rows = positiveInteger('rows')
const cellSize = positiveInteger('cell-size')
const atlas = new PNG({
  width: columns * cellSize,
  height: rows * cellSize,
  colorType: 6,
})

for (let frame = 0; frame < columns * rows; frame++) {
  const filename = `frame-${String(frame).padStart(3, '0')}.png`
  const source = PNG.sync.read(readFileSync(path.join(inputDir, filename)))
  if (source.width !== cellSize || source.height !== cellSize) {
    throw new Error(`${filename} is ${source.width}x${source.height}; expected ${cellSize}x${cellSize}`)
  }
  PNG.bitblt(
    source,
    atlas,
    0,
    0,
    cellSize,
    cellSize,
    frame % columns * cellSize,
    Math.floor(frame / columns) * cellSize,
  )
}

writeFileSync(output, PNG.sync.write(atlas, { colorType: 6 }))
