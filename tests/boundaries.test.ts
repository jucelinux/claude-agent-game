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
  it('keeps Babylon and React out of authoring and compilation', () => {
    const roots = ['src/core', 'src/grammars', 'src/authoring', 'src/compiler']
    for (const root of roots) {
      for (const file of filesUnder(root).filter((path) => path.endsWith('.ts'))) {
        const source = readFileSync(file, 'utf8')
        expect(source, relative(process.cwd(), file)).not.toMatch(/from ['"](?:@babylonjs\/|react)/)
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

  it('keeps main free of archived game implementations', () => {
    expect(existsSync('CAMPAIGN.md')).toBe(false)
    expect(existsSync('src/game/launch')).toBe(false)
    expect(existsSync('src/game/landing')).toBe(false)
    expect(existsSync('src/game/moon')).toBe(false)
    expect(existsSync('src/grammars/characters')).toBe(false)
    expect(existsSync('src/grammars/scenery')).toBe(false)
    expect(existsSync('public/assets/launch')).toBe(false)
    expect(existsSync('public/assets/landing')).toBe(false)
  })

  it('does not retain the archived Babylon prototypes', () => {
    const source = filesUnder('src')
      .filter((path) => /\.(?:ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')

    expect(existsSync('src/game/wasteland')).toBe(false)
    expect(existsSync('src/game/sunlit')).toBe(false)
    expect(existsSync('src/game/character')).toBe(false)
    expect(existsSync('public/assets/ashfall')).toBe(false)
    expect(source).not.toContain('ashfall-prototype')
    expect(source).not.toContain('sunlit-earth-prototype')
  })

  it('does not retain the removed Pyramid Glyph prototype', () => {
    const source = filesUnder('src')
      .filter((path) => /\.(?:ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')

    expect(existsSync('src/game/pyramid')).toBe(false)
    expect(existsSync('src/game/glyph')).toBe(false)
    expect(existsSync('src/game/character/hieroglyphTraveler.ts')).toBe(false)
    expect(source).not.toContain('pyramid-glyph-prototype')
  })

  it('uses Babylon as the only active runtime engine', () => {
    const source = readFileSync('src/game/mountGame.ts', 'utf8')
    const packageJson = readFileSync('package.json', 'utf8')
    const sourceFiles = filesUnder('src').filter((path) => path.endsWith('.ts'))

    expect(source).toContain('new Engine(canvas')
    expect(source).toContain('visible?.scene.render()')
    expect(packageJson).toContain('@babylonjs/core')
    expect(packageJson).not.toContain('"phaser"')
    for (const file of sourceFiles) {
      expect(readFileSync(file, 'utf8'), relative(process.cwd(), file)).not.toMatch(/from ['"]phaser['"]/)
    }
  })
})
