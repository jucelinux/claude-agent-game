import { useEffect, useRef, useState } from 'react'
import type { CompiledClip } from '../compiler/types.ts'
import type { GameHandle } from '../game/mountGame.ts'
import {
  WORKSPACE_SCENES,
  type RuntimeSnapshot,
  type WorkspaceMode,
  type WorkspaceScene,
} from '../game/types.ts'
import CompilerWorker from '../workers/compiler.worker.ts?worker'
import type { CompilerWorkerResult } from '../workers/compiler.worker.ts'

const INITIAL_SCENE = WORKSPACE_SCENES[0].id
const EMPTY_RUNTIME: RuntimeSnapshot = {
  scene: INITIAL_SCENE,
  mode: 'play',
  pointerX: 0,
  pointerY: 0,
  fps: 0,
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const paletteColor = (color: readonly [number, number, number]): string =>
  `rgb(${color[0]} ${color[1]} ${color[2]})`

function ClipPreview({ clip }: { readonly clip: CompiledClip }): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)
  const scale = Math.max(1, Math.floor(Math.min(220 / clip.cell.w, 150 / clip.cell.h)))

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context || clip.frames.length === 0) return
    context.imageSmoothingEnabled = false
    const atlas = new ImageData(new Uint8ClampedArray(clip.atlas.rgba), clip.atlas.w, clip.atlas.h)
    let frameIndex = 0
    let timeout: number | undefined

    const draw = (): void => {
      const frame = clip.frames[frameIndex]
      if (frame === undefined) return
      context.clearRect(0, 0, clip.cell.w, clip.cell.h)
      context.putImageData(atlas, -frame.x, -frame.y)
      if (clip.frames.length <= 1) return
      frameIndex = (frameIndex + 1) % clip.frames.length
      timeout = window.setTimeout(draw, Math.max(40, frame.durationMs))
    }

    draw()
    return () => window.clearTimeout(timeout)
  }, [clip])

  return (
    <figure className="clip-preview">
      <div className={`clip-preview-stage ${clip.kind}`}>
        <canvas
          ref={canvas}
          width={clip.cell.w}
          height={clip.cell.h}
          style={{ width: clip.cell.w * scale, height: clip.cell.h * scale }}
          role="img"
          aria-label={`Pixel preview of ${clip.id}`}
        />
      </div>
      <figcaption><span>Compiled preview</span><code>{scale}× nearest</code></figcaption>
    </figure>
  )
}

function ClipInspector({ clip }: { readonly clip: CompiledClip }): React.JSX.Element {
  const duration = clip.frames.reduce((total, frame) => total + frame.durationMs, 0)
  return (
    <>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Generated asset</span>
          <h2>{clip.id}</h2>
        </div>
        <span className={`kind-badge ${clip.kind}`}>{clip.kind}</span>
      </div>

      <ClipPreview clip={clip} />

      <dl className="property-grid">
        <div><dt>Frames</dt><dd>{clip.frames.length}</dd></div>
        <div><dt>Duration</dt><dd>{duration} ms</dd></div>
        <div><dt>Cell</dt><dd>{clip.cell.w} × {clip.cell.h}</dd></div>
        <div><dt>Loop</dt><dd>{clip.loops ? 'yes' : 'no'}</dd></div>
        <div><dt>Origin</dt><dd>{clip.origin.x}, {clip.origin.y}</dd></div>
        <div><dt>Contact</dt><dd>{clip.contact.x}, {clip.contact.y}</dd></div>
      </dl>

      <section className="inspector-section">
        <h3>Palette</h3>
        <div className="palette" aria-label={`${clip.palette.length} palette colors`}>
          {clip.palette.slice(1).map((color, index) => (
            <span
              key={`${color.join('-')}-${index}`}
              className="swatch"
              style={{ background: paletteColor(color) }}
              title={`index ${index + 1}: ${color.join(', ')}`}
            />
          ))}
        </div>
      </section>

      <section className="inspector-section">
        <h3>Phases</h3>
        <div className="phase-list">
          {clip.phases.map((phase) => (
            <div key={phase.name}>
              <span>{phase.name}</span>
              <code>frame {phase.frame}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="inspector-section checksum">
        <h3>Deterministic checksum</h3>
        <code>{clip.checksum}</code>
      </section>
    </>
  )
}

function EmptyInspector(): React.JSX.Element {
  return (
    <section className="empty-inspector">
      <span className="eyebrow">Asset inspector</span>
      <h2>No compiled assets yet</h2>
      <p>
        Add procedural assets in <code>src/authoring/catalog.ts</code>. Generated images and
        Blender renders live under <code>public/assets</code> and are loaded by the game scene.
      </p>
    </section>
  )
}

function LoadingWorkspace({ error }: { readonly error: string | null }): React.JSX.Element {
  return (
    <main className="loading-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <div><strong>Agent Game Builder</strong><span>Untitled game</span></div>
        </div>
      </header>
      <section className="loading-workspace" aria-live="polite">
        <div className={`compiler-pulse ${error === null ? '' : 'failed'}`} />
        <span className="eyebrow">Deterministic compiler</span>
        <h1>{error === null ? 'Building the project bundle' : 'Compilation failed'}</h1>
        <p>{error ?? 'Compiling the project catalog in an isolated worker.'}</p>
      </section>
    </main>
  )
}

export function App(): React.JSX.Element {
  const [compilation, setCompilation] = useState<CompilerWorkerResult | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [mode, setMode] = useState<WorkspaceMode>('play')
  const [overlays, setOverlays] = useState(false)
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(EMPTY_RUNTIME)
  const [activeScene, setActiveScene] = useState<WorkspaceScene>(INITIAL_SCENE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const gameHost = useRef<HTMLDivElement>(null)
  const gameHandle = useRef<GameHandle | null>(null)
  const requestedScene = useRef<WorkspaceScene>(INITIAL_SCENE)
  const workspaceState = useRef({ mode, overlays })
  const inspector = useRef<HTMLElement>(null)
  workspaceState.current = { mode, overlays }

  useEffect(() => {
    const worker = new CompilerWorker()
    worker.onmessage = (event: MessageEvent<CompilerWorkerResult>) => setCompilation(event.data)
    worker.onerror = (event) => setCompileError(event.message || 'The asset compiler failed.')
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (compilation === null) return
    const host = gameHost.current
    if (host === null) return
    let disposed = false
    let mounted: GameHandle | null = null

    void import('../game/mountGame.ts').then(({ mountGame }) => {
      if (disposed) return
      mounted = mountGame(host, compilation.bundle, (snapshot) => {
        if (snapshot.scene !== requestedScene.current) return
        setRuntime(snapshot)
        setActiveScene(snapshot.scene)
      })
      gameHandle.current = mounted
      mounted.setScene(requestedScene.current)
      mounted.setMode(workspaceState.current.mode)
      mounted.setOverlays(workspaceState.current.overlays)
    }).catch((error: unknown) => {
      setCompileError(error instanceof Error ? error.message : String(error))
    })

    return () => {
      disposed = true
      gameHandle.current = null
      mounted?.destroy()
    }
  }, [compilation])

  useEffect(() => gameHandle.current?.setMode(mode), [mode])
  useEffect(() => gameHandle.current?.setOverlays(overlays), [overlays])

  if (compilation === null) return <LoadingWorkspace error={compileError} />

  const characterClips = compilation.bundle.clips.filter((clip) => clip.kind === 'character')
  const environmentClips = compilation.bundle.clips.filter((clip) => clip.kind === 'environment')
  const selected = compilation.bundle.clips.find((clip) => clip.id === selectedId)
    ?? compilation.bundle.clips[0]
  const frameCount = compilation.bundle.clips.reduce((total, clip) => total + clip.frames.length, 0)
  const byteCount = compilation.bundle.clips.reduce((total, clip) => total + clip.atlas.rgba.byteLength, 0)
  const scene = WORKSPACE_SCENES.find((entry) => entry.id === activeScene) ?? WORKSPACE_SCENES[0]

  const selectScene = (nextScene: WorkspaceScene): void => {
    requestedScene.current = nextScene
    setActiveScene(nextScene)
    gameHandle.current?.setScene(nextScene)
  }

  const selectClip = (id: string): void => {
    setSelectedId(id)
    inspector.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="workspace-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <div><strong>Agent Game Builder</strong><span>Untitled game</span></div>
        </div>

        <div className="mode-switch" role="group" aria-label="Workspace mode">
          <button className={mode === 'play' ? 'active' : ''} onClick={() => setMode('play')}>Play</button>
          <button className={mode === 'inspect' ? 'active' : ''} onClick={() => setMode('inspect')}>Inspect</button>
        </div>

        <div className="build-state">
          <span className="status-dot" />
          Bundle ready
          <code>{compilation.bundle.checksum}</code>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="navigator panel">
          <div className="panel-title">
            <span>Project</span>
            <small>{compilation.bundle.clips.length} assets</small>
          </div>

          <nav aria-label="Project content">
            <section className="asset-group">
              <h2>Scenes</h2>
              {WORKSPACE_SCENES.map((entry) => (
                <button
                  key={entry.id}
                  className={`scene-row ${activeScene === entry.id ? 'active-scene' : ''}`}
                  aria-pressed={activeScene === entry.id}
                  onClick={() => selectScene(entry.id)}
                >
                  <span className="tree-glyph">◇</span>
                  {entry.label}
                </button>
              ))}
            </section>

            <section className="asset-group">
              <h2>Character clips</h2>
              {characterClips.length === 0 && <p className="empty-list">No character assets</p>}
              {characterClips.map((clip) => (
                <button
                  key={clip.id}
                  className={`asset-row ${selected?.id === clip.id ? 'selected' : ''}`}
                  aria-pressed={selected?.id === clip.id}
                  onClick={() => selectClip(clip.id)}
                >
                  <span>{clip.id}</span><small>{clip.frames.length}f</small>
                </button>
              ))}
            </section>

            <section className="asset-group">
              <h2>Environment</h2>
              {environmentClips.length === 0 && <p className="empty-list">No environment assets</p>}
              {environmentClips.map((clip) => (
                <button
                  key={clip.id}
                  className={`asset-row ${selected?.id === clip.id ? 'selected' : ''}`}
                  aria-pressed={selected?.id === clip.id}
                  onClick={() => selectClip(clip.id)}
                >
                  <span>{clip.id}</span><small>{clip.frames.length}f</small>
                </button>
              ))}
            </section>
          </nav>
        </aside>

        <section className="stage-column">
          <div className="stage-toolbar">
            <div>
              <span className="eyebrow">Phaser scene</span>
              <strong>{scene.label}</strong>
              <span className="blockout-badge">blank project</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={overlays}
                onChange={(event) => setOverlays(event.target.checked)}
              />
              <span />
              Debug overlays
            </label>
          </div>
          <div className="viewport-frame">
            <div ref={gameHost} className="game-host" />
            {mode === 'inspect' && <div className="inspect-notice">Input paused for inspection</div>}
            {compileError !== null && <div className="runtime-error">{compileError}</div>}
          </div>
          <div className="transport-bar">
            <span>{scene.detail}</span>
            <span>pointer {runtime.pointerX}, {runtime.pointerY}</span>
            <span className="runtime-fps">{runtime.fps || '—'} fps</span>
          </div>
        </section>

        <aside ref={inspector} className="inspector panel">
          {selected === undefined ? <EmptyInspector /> : <ClipInspector clip={selected} />}

          <section className="inspector-section runtime-section">
            <div className="section-heading"><h3>Live scene</h3><span>Phaser</span></div>
            <dl className="runtime-values">
              <div><dt>Scene</dt><dd>{runtime.scene}</dd></div>
              <div><dt>Mode</dt><dd>{runtime.mode}</dd></div>
              <div><dt>Pointer</dt><dd>{runtime.pointerX}, {runtime.pointerY}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <footer className="diagnostics">
        <div className="diagnostic-title"><span>Compiler</span><small>deterministic asset pipeline</small></div>
        <div className="log-line"><span className="log-ok">READY</span> compiled {frameCount} frames across {compilation.bundle.clips.length} assets in {compilation.elapsedMs.toFixed(1)} ms</div>
        <div className="log-metric">RGBA {formatBytes(byteCount)}</div>
        <div className="log-metric">bundle v{compilation.bundle.version}</div>
      </footer>
    </main>
  )
}
