import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const filesUnder = (root: string): string[] => {
  if (!existsSync(root)) return []
  const files: string[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...filesUnder(path))
    else files.push(path)
  }
  return files
}

describe('architectural boundary', () => {
  it('keeps Phaser and React out of authoring and compilation', () => {
    const roots = ['src/core', 'src/grammars', 'src/authoring', 'src/compiler']
    for (const root of roots) {
      for (const file of filesUnder(root).filter((path) => path.endsWith('.ts'))) {
        const source = readFileSync(file, 'utf8')
        expect(source, relative(process.cwd(), file)).not.toMatch(/from ['"](?:phaser|react)/)
      }
    }
  })

  it('has no ambient clock or randomness inside the deterministic boundary', () => {
    const roots = ['src/core', 'src/grammars', 'src/authoring', 'src/compiler']
    for (const root of roots) {
      for (const file of filesUnder(root).filter((path) => path.endsWith('.ts'))) {
        const source = readFileSync(file, 'utf8')
        expect(source, relative(process.cwd(), file)).not.toMatch(/Math\.random\s*\(|Date\.now\s*\(|performance\.now\s*\(/)
      }
    }
  })

  it('does not retain the repository-owned engine or microgame shelf', () => {
    const sourceFiles = filesUnder('src').map((path) => relative(process.cwd(), path))
    expect(sourceFiles.some((path) => path.startsWith('src/runtime/'))).toBe(false)
    expect(sourceFiles.some((path) => path.startsWith('src/micro/'))).toBe(false)
    expect(sourceFiles.some((path) => path.startsWith('src/scene/'))).toBe(false)
  })
})
