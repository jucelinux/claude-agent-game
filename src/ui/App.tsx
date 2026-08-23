import { useEffect, useRef, useState } from 'react'
import type { CompiledClip } from '../compiler/types.ts'
import { formatGet } from '../game/landing/model.ts'
import { INITIAL_LAUNCH_STATE, LAUNCH_PROCEDURES, formatLaunchClock } from '../game/launch/model.ts'
import type { GameHandle } from '../game/mountGame.ts'
import type { RuntimeSnapshot, WorkspaceMode, WorkspaceScene } from '../game/types.ts'
import CompilerWorker from '../workers/compiler.worker.ts?worker'
import type { CompilerWorkerResult } from '../workers/compiler.worker.ts'

const EMPTY_RUNTIME: RuntimeSnapshot = {
  scene: 'launch',
  clockSeconds: INITIAL_LAUNCH_STATE.clockSeconds,
  phase: INITIAL_LAUNCH_STATE.status,
  station: 'collins-right',
  procedure: 'ingress-relock',
  objective: 'SECURE THE LAUNCH POSITION',
  acceptance: 'RHC CLEAR · STRUT RELEASE RE-LOCKED',
  completedProcedures: 0,
  totalProcedures: LAUNCH_PROCEDURES.length,
  timeRate: 0,
  mistakes: 0,
  fps: 0,
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const paletteColor = (color: readonly [number, number, number]): string =>
  `rgb(${color[0]} ${color[1]} ${color[2]})`

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

function ClipPreview({ clip }: { readonly clip: CompiledClip }): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)
  const scale = Math.max(1, Math.floor(Math.min(
    220 / clip.cell.w,
    150 / clip.cell.h,
  )))

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context || clip.frames.length === 0) return
    context.imageSmoothingEnabled = false
    const atlas = new ImageData(
      new Uint8ClampedArray(clip.atlas.rgba),
      clip.atlas.w,
      clip.atlas.h,
    )
    let frameIndex = 0
    let timeout: number | undefined

    const draw = (): void => {
      const frame = clip.frames[frameIndex]!
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

function LoadingWorkspace({ error }: { readonly error: string | null }): React.JSX.Element {
  return (
    <main className="loading-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <div><strong>Agent Game Builder</strong><span>Apollo 11 campaign</span></div>
        </div>
      </header>
      <section className="loading-workspace" aria-live="polite">
        <div className={`compiler-pulse ${error === null ? '' : 'failed'}`} />
        <span className="eyebrow">Deterministic compiler</span>
        <h1>{error === null ? 'Building the project bundle' : 'Compilation failed'}</h1>
        <p>{error ?? 'Rasterizing authored clips in an isolated worker. The interface stays responsive.'}</p>
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
  const [activeScene, setActiveScene] = useState<WorkspaceScene>('launch')
  const [selectedId, setSelectedId] = useState('astro-idle-s')
  const gameHost = useRef<HTMLDivElement>(null)
  const gameHandle = useRef<GameHandle | null>(null)
  const requestedScene = useRef<WorkspaceScene>('launch')
  const inspector = useRef<HTMLElement>(null)

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
        const snapshotScene = snapshot.scene === 'launch'
          ? 'launch'
          : snapshot.scene === 'landing'
            ? 'landing'
            : 'moon'
        if (snapshotScene !== requestedScene.current) return
        setRuntime(snapshot)
        setActiveScene(snapshotScene)
      })
      gameHandle.current = mounted
      mounted.setScene(requestedScene.current)
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
  const selected = compilation.bundle.clips.find((clip) => clip.id === selectedId) ?? characterClips[0]
  const frameCount = compilation.bundle.clips.reduce((total, clip) => total + clip.frames.length, 0)
  const byteCount = compilation.bundle.clips.reduce((total, clip) => total + clip.atlas.rgba.byteLength, 0)
  const selectScene = (scene: WorkspaceScene): void => {
    requestedScene.current = scene
    setActiveScene(scene)
    gameHandle.current?.setScene(scene)
  }
  const selectClip = (id: string): void => {
    setSelectedId(id)
    inspector.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const sceneTitle = runtime.scene === 'launch'
    ? 'LaunchScene / ingress to tower clear'
    : runtime.scene === 'landing'
      ? 'LandingScene / P66 terminal descent'
      : 'MoonScene'

  return (
    <main className="workspace-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <div>
            <strong>Agent Game Builder</strong>
            <span>Apollo 11 campaign</span>
          </div>
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

          <nav aria-label="Project assets">
            <section className="asset-group">
              <h2>Scene</h2>
              <button
                className={`scene-row ${activeScene === 'launch' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'launch'}
                onClick={() => selectScene('launch')}
              ><span className="tree-glyph">◇</span> Launch day</button>
              <button
                className={`scene-row indent ${activeScene === 'launch' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'launch'}
                onClick={() => selectScene('launch')}
              ><span className="tree-glyph">⌁</span> Ingress to tower clear</button>
              <button
                className={`scene-row ${activeScene === 'landing' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'landing'}
                onClick={() => selectScene('landing')}
              ><span className="tree-glyph">◇</span> Powered descent</button>
              <button
                className={`scene-row indent ${activeScene === 'landing' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'landing'}
                onClick={() => selectScene('landing')}
              ><span className="tree-glyph">⌁</span> P66 terminal descent</button>
              <button
                className={`scene-row ${activeScene === 'moon' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'moon'}
                onClick={() => selectScene('moon')}
              ><span className="tree-glyph">◇</span> Moon surface</button>
              <button
                className={`scene-row indent ${activeScene === 'moon' ? 'active-scene' : ''}`}
                aria-pressed={activeScene === 'moon'}
                onClick={() => {
                  selectClip('astro-idle-s')
                  selectScene('moon')
                }}
              ><span className="tree-glyph">●</span> Astronaut</button>
            </section>

            <section className="asset-group">
              <h2>Character clips</h2>
              {characterClips.map((clip) => (
                <button
                  key={clip.id}
                  className={`asset-row ${selectedId === clip.id ? 'selected' : ''}`}
                  aria-pressed={selectedId === clip.id}
                  onClick={() => selectClip(clip.id)}
                >
                  <span>{clip.id.replace('astro-', '')}</span>
                  <small>{clip.frames.length}f</small>
                </button>
              ))}
            </section>

            <section className="asset-group">
              <h2>Environment</h2>
              {environmentClips.map((clip) => (
                <button
                  key={clip.id}
                  className={`asset-row ${selectedId === clip.id ? 'selected' : ''}`}
                  aria-pressed={selectedId === clip.id}
                  onClick={() => selectClip(clip.id)}
                >
                  <span>{clip.id}</span>
                  <small>{clip.frames.length}f</small>
                </button>
              ))}
            </section>
          </nav>
        </aside>

        <section className="stage-column">
          <div className="stage-toolbar">
            <div>
              <span className="eyebrow">Phaser scene</span>
              <strong>{sceneTitle}</strong>
              {runtime.scene === 'launch' && <span className="blockout-badge">chapter skeleton</span>}
              {runtime.scene === 'landing' && <span className="blockout-badge">playable slice</span>}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={overlays} onChange={(event) => setOverlays(event.target.checked)} />
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
            {runtime.scene === 'launch' ? (
              <>
                <span><kbd>1–3</kbd> or click required actions</span>
                <span><kbd>enter</kbd> continue / verify</span>
                <span><kbd>space</kbd> continue / next event</span>
                <span><kbd>R</kbd> reset</span>
              </>
            ) : runtime.scene === 'landing' ? (
              <>
                <span><kbd>W/S</kbd> reduce/increase descent rate</span>
                <span><kbd>A/D</kbd> decelerate/accelerate forward</span>
                <span><kbd>R</kbd> reset</span>
              </>
            ) : (
              <>
                <span><kbd>WASD</kbd> or <kbd>arrows</kbd> move</span>
                <span><kbd>space</kbd> lunar jump</span>
              </>
            )}
            <span className="runtime-fps">{runtime.fps || '—'} fps</span>
          </div>
        </section>

        <aside ref={inspector} className="inspector panel">
          {selected === undefined ? <p>No asset selected.</p> : <ClipInspector clip={selected} />}

          <section className="inspector-section runtime-section">
            <div className="section-heading"><h3>{runtime.scene === 'launch' ? 'Live launch' : runtime.scene === 'landing' ? 'Live descent' : 'Live entity'}</h3><span>Phaser</span></div>
            {runtime.scene === 'launch' ? (
              <dl className="runtime-values">
                <div><dt>Clock</dt><dd>{formatLaunchClock(runtime.clockSeconds)}</dd></div>
                <div><dt>Phase</dt><dd>{runtime.phase}</dd></div>
                <div><dt>Station</dt><dd>{runtime.station}</dd></div>
                <div><dt>Procedure</dt><dd>{runtime.procedure}</dd></div>
                <div><dt>Objective</dt><dd>{runtime.objective}</dd></div>
                <div><dt>Acceptance</dt><dd>{runtime.acceptance}</dd></div>
                <div><dt>Progress</dt><dd>{runtime.completedProcedures} / {runtime.totalProcedures}</dd></div>
                <div><dt>Time rate</dt><dd>{runtime.timeRate || 'hold'}{runtime.timeRate > 0 ? '×' : ''}</dd></div>
                <div><dt>Errors</dt><dd>{runtime.mistakes}</dd></div>
              </dl>
            ) : runtime.scene === 'landing' ? (
              <dl className="runtime-values">
                <div><dt>GET</dt><dd>{formatGet(runtime.getSeconds)}</dd></div>
                <div><dt>Program</dt><dd>{runtime.program}</dd></div>
                <div><dt>Altitude</dt><dd>{runtime.altitudeFt.toFixed(0)} ft</dd></div>
                <div><dt>Vertical</dt><dd>{runtime.verticalSpeedFps.toFixed(1)} ft/s</dd></div>
                <div><dt>Forward</dt><dd>{runtime.forwardSpeedFps.toFixed(1)} ft/s</dd></div>
                <div><dt>Downrange</dt><dd>{runtime.downrangeFt.toFixed(0)} ft</dd></div>
                <div><dt>ROD command</dt><dd>{runtime.descentRateCommandFps.toFixed(1)} ft/s</dd></div>
                <div><dt>Burn margin</dt><dd>{runtime.fuelSeconds.toFixed(0)} s</dd></div>
                <div><dt>Terrain</dt><dd>{runtime.site}</dd></div>
                <div><dt>State</dt><dd>{runtime.status}</dd></div>
              </dl>
            ) : (
              <dl className="runtime-values">
                <div><dt>Position</dt><dd>{runtime.x}, {runtime.y}</dd></div>
                <div><dt>Facing</dt><dd>{runtime.facing}</dd></div>
                <div><dt>State</dt><dd>{runtime.jumping ? 'airborne' : 'grounded'}</dd></div>
                <div><dt>Animation</dt><dd>{runtime.animation.replace('astro-', '')}</dd></div>
              </dl>
            )}
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
