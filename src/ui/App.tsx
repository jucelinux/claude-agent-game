import { useEffect, useRef, useState } from 'react'
import type { CompiledClip } from '../compiler/types.ts'
import type { GameHandle } from '../game/mountGame.ts'
import {
  getPrototypeScenes,
  type RuntimeSnapshot,
  type WorkspaceMode,
  type WorkspaceScene,
} from '../game/types.ts'
import CompilerWorker from '../workers/compiler.worker.ts?worker'
import type {
  CompilerWorkerRequest,
  CompilerWorkerResult,
} from '../workers/compiler.worker.ts'
import {
  PROTOTYPES,
  resolvePrototypeId,
  type PrototypeId,
} from './prototypes.ts'

const emptyRuntime = (scene: WorkspaceScene): RuntimeSnapshot => ({
  scene,
  mode: 'play',
  playerX: 0,
  playerY: 0,
  playerDepth: 1.5,
  interaction: null,
  fps: 0,
})

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const paletteColor = (color: readonly [number, number, number]): string =>
  `rgb(${color[0]} ${color[1]} ${color[2]})`

const prototypeCount: number = PROTOTYPES.length

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
      <span className="eyebrow">Scene geometry</span>
      <h2>Gameplay blockout</h2>
      <p>
        This prototype uses scene-authored geometry and native Babylon meshes.
        Compiled assets remain empty until the new project declares its first asset.
      </p>
    </section>
  )
}

function BuilderBrand({
  onExit,
  prototypeTitle,
}: {
  readonly onExit: () => void
  readonly prototypeTitle: string
}): React.JSX.Element {
  return (
    <div className="workspace-brand-group">
      <button className="catalog-return" onClick={onExit} aria-label="Back to prototype catalog">
        <span aria-hidden="true">←</span>
        Prototypes
      </button>
      <div className="brand">
        <span className="brand-mark">AG</span>
        <div><strong>Agent Game Builder</strong><span>{prototypeTitle}</span></div>
      </div>
    </div>
  )
}

function LoadingWorkspace({
  error,
  onExit,
  prototypeTitle,
}: {
  readonly error: string | null
  readonly onExit: () => void
  readonly prototypeTitle: string
}): React.JSX.Element {
  return (
    <main className="loading-shell">
      <header className="topbar">
        <BuilderBrand onExit={onExit} prototypeTitle={prototypeTitle} />
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

function BuilderWorkspace({
  onExit,
  prototypeId,
}: {
  readonly onExit: () => void
  readonly prototypeId: PrototypeId
}): React.JSX.Element {
  const prototype = PROTOTYPES.find((entry) => entry.id === prototypeId)
  if (prototype === undefined) throw new Error(`unknown prototype ${prototypeId}`)
  const workspaceScenes = getPrototypeScenes(prototypeId)
  const initialScene = workspaceScenes[0]
  if (initialScene === undefined) throw new Error(`prototype ${prototypeId} has no scenes`)
  const [compilation, setCompilation] = useState<CompilerWorkerResult | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [mode, setMode] = useState<WorkspaceMode>('play')
  const [overlays, setOverlays] = useState(false)
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(() => emptyRuntime(initialScene.id))
  const [activeScene, setActiveScene] = useState<WorkspaceScene>(initialScene.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const gameHost = useRef<HTMLDivElement>(null)
  const gameHandle = useRef<GameHandle | null>(null)
  const requestedScene = useRef<WorkspaceScene>(initialScene.id)
  const workspaceState = useRef({ mode, overlays })
  const inspector = useRef<HTMLElement>(null)
  workspaceState.current = { mode, overlays }

  useEffect(() => {
    const worker = new CompilerWorker()
    worker.onmessage = (event: MessageEvent<CompilerWorkerResult>) => setCompilation(event.data)
    worker.onerror = (event) => setCompileError(event.message || 'The asset compiler failed.')
    worker.postMessage({ prototypeId } satisfies CompilerWorkerRequest)
    return () => worker.terminate()
  }, [prototypeId])

  useEffect(() => {
    if (compilation === null) return
    const host = gameHost.current
    if (host === null) return
    let disposed = false
    let mounted: GameHandle | null = null

    void import('../game/mountGame.ts').then(({ mountGame }) => {
      if (disposed) return
      mounted = mountGame(host, compilation.bundle, prototypeId, (snapshot) => {
        requestedScene.current = snapshot.scene
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
  }, [compilation, prototypeId])

  useEffect(() => gameHandle.current?.setMode(mode), [mode])
  useEffect(() => gameHandle.current?.setOverlays(overlays), [overlays])

  if (compilation === null) {
    return (
      <LoadingWorkspace
        error={compileError}
        onExit={onExit}
        prototypeTitle={prototype.title}
      />
    )
  }

  const characterClips = compilation.bundle.clips.filter((clip) => clip.kind === 'character')
  const environmentClips = compilation.bundle.clips.filter((clip) => clip.kind === 'environment')
  const selected = compilation.bundle.clips.find((clip) => clip.id === selectedId)
    ?? compilation.bundle.clips[0]
  const frameCount = compilation.bundle.clips.reduce((total, clip) => total + clip.frames.length, 0)
  const byteCount = compilation.bundle.clips.reduce((total, clip) => total + clip.atlas.rgba.byteLength, 0)
  const scene = workspaceScenes.find((entry) => entry.id === activeScene) ?? initialScene
  const position =
    `position ${runtime.playerX.toFixed(1)} · depth ${runtime.playerDepth.toFixed(1)}`

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
        <BuilderBrand onExit={onExit} prototypeTitle={prototype.title} />

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
              {workspaceScenes.map((entry) => (
                <button
                  key={entry.id}
                  className={`scene-row ${activeScene === entry.id ? 'active-scene' : ''}`}
                  aria-pressed={activeScene === entry.id}
                  onClick={() => selectScene(entry.id)}
                >
                  <span className="tree-icon">◇</span>
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
              <span className="eyebrow">Babylon scene</span>
              <strong>{scene.label}</strong>
              <span className="blockout-badge">{prototype.format}</span>
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
            <span>{position}</span>
            <span className="runtime-fps">{runtime.fps || '—'} fps</span>
          </div>
        </section>

        <aside ref={inspector} className="inspector panel">
          {selected === undefined ? <EmptyInspector /> : <ClipInspector clip={selected} />}

          <section className="inspector-section runtime-section">
            <div className="section-heading"><h3>Live scene</h3><span>Babylon</span></div>
            <dl className="runtime-values">
              <div><dt>Scene</dt><dd>{runtime.scene}</dd></div>
              <div><dt>Mode</dt><dd>{runtime.mode}</dd></div>
              <div><dt>Horizontal</dt><dd>{runtime.playerX.toFixed(2)}</dd></div>
              <div><dt>Height</dt><dd>{runtime.playerY.toFixed(2)}</dd></div>
              <div><dt>Depth</dt><dd>{runtime.playerDepth.toFixed(2)}</dd></div>
              <div><dt>Interaction</dt><dd>{runtime.interaction ?? 'none'}</dd></div>
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

function BlankStagePreview(): React.JSX.Element {
  return (
    <div className="blank-preview" aria-hidden="true">
      <span className="blank-horizon" />
      <span className="blank-floor" />
      <span className="blank-marker" />
    </div>
  )
}

function PrototypeCatalog({
  onOpen,
}: {
  readonly onOpen: (id: PrototypeId) => void
}): React.JSX.Element {
  return (
    <main className="catalog-shell">
      <header className="catalog-topbar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <div><strong>Agent Game Builder</strong><span>Prototype catalog</span></div>
        </div>
        <div className="catalog-availability">
          <span className="status-dot" />
          {prototypeCount} {prototypeCount === 1 ? 'prototype' : 'prototypes'} available
        </div>
      </header>

      <div className="catalog-content">
        <section className="catalog-hero">
          <div>
            <span className="eyebrow">Playable studies</span>
            <h1>Choose a prototype<br />to enter the Builder.</h1>
          </div>
          <p>
            Each prototype opens as its own authoring workspace, with playable scenes,
            runtime diagnostics and project-specific assets.
          </p>
        </section>

        <section className="catalog-library" aria-labelledby="prototype-library-title">
          <div className="catalog-section-heading">
            <div>
              <span className="eyebrow">Current library</span>
              <h2 id="prototype-library-title">Prototypes</h2>
            </div>
            <span>
              {String(prototypeCount).padStart(2, '0')}{' '}
              {prototypeCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div className="prototype-grid">
            {PROTOTYPES.map((prototype) => (
              <button
                key={prototype.id}
                className="prototype-card"
                onClick={() => onOpen(prototype.id)}
                aria-label={`Open ${prototype.title} in Agent Game Builder`}
              >
                <BlankStagePreview />
                <span className="prototype-card-copy">
                  <span className="prototype-card-kicker">
                    <span>{prototype.status}</span>
                    {prototype.eyebrow}
                  </span>
                  <strong>{prototype.title}</strong>
                  <span className="prototype-description">{prototype.description}</span>
                  <span className="prototype-meta">
                    <span>{prototype.sceneCount} scenes</span>
                    <span>{prototype.format}</span>
                    <span className="prototype-open">Open builder <b aria-hidden="true">↗</b></span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="catalog-footer">
        <span>Agent Game Builder</span>
        <span>Local prototype workspace</span>
      </footer>
    </main>
  )
}

export function App(): React.JSX.Element {
  const [activePrototype, setActivePrototype] = useState<PrototypeId | null>(() =>
    resolvePrototypeId(new URLSearchParams(window.location.search).get('prototype')),
  )

  useEffect(() => {
    const handlePopState = (): void => {
      setActivePrototype(
        resolvePrototypeId(new URLSearchParams(window.location.search).get('prototype')),
      )
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const prototype = PROTOTYPES.find((entry) => entry.id === activePrototype)
    document.title = prototype === undefined
      ? 'Prototype Catalog — Agent Game Builder'
      : `${prototype.title} — Agent Game Builder`
  }, [activePrototype])

  const navigateToPrototype = (prototype: PrototypeId | null): void => {
    const url = new URL(window.location.href)
    if (prototype === null) url.searchParams.delete('prototype')
    else url.searchParams.set('prototype', prototype)
    window.history.pushState({ prototype }, '', url)
    setActivePrototype(prototype)
  }

  return activePrototype === null
    ? <PrototypeCatalog onOpen={(id) => navigateToPrototype(id)} />
    : (
        <BuilderWorkspace
          key={activePrototype}
          prototypeId={activePrototype}
          onExit={() => navigateToPrototype(null)}
        />
      )
}
