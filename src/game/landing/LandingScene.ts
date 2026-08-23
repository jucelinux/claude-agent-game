import Phaser from 'phaser'
import {
  P66_TERMINAL_START_STATE,
  classifyLandingSite,
  formatGet,
  getLandingAnnunciators,
  getLandingObjective,
  stepLanding,
  type LandingAnnunciatorTone,
  type LandingState,
} from './model.ts'
import {
  P66_TERRAIN_DEFERRED_ATLAS_KEYS,
  P66_TERRAIN_DITHER_STEPS,
  P66_TERRAIN_FRAME_HEIGHT,
  P66_TERRAIN_FRAME_WIDTH,
  P66_TERRAIN_STARTUP_ATLAS_KEYS,
  P66_TERRAIN_TRANSITION_MS,
  getP66TerrainDitherStep,
  getP66TerrainFrame,
  getP66TerrainPose,
  isP66TerrainDitherPixelVisible,
  type P66TerrainFrame,
} from './bakedTerrain.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'

const COCKPIT_KEY = 'p66-cockpit-snes'
const P66_DISPLAY_SCALE = 3
const P66_DITHER_MASK_KEYS = Array.from(
  { length: P66_TERRAIN_DITHER_STEPS + 1 },
  (_, step) => `p66-terrain-dither-${String(step).padStart(2, '0')}`,
) as readonly string[]

type ControlKeys = {
  readonly rateUp: Phaser.Input.Keyboard.Key
  readonly rateDown: Phaser.Input.Keyboard.Key
  readonly forwardDown: Phaser.Input.Keyboard.Key
  readonly forwardUp: Phaser.Input.Keyboard.Key
  readonly reset: Phaser.Input.Keyboard.Key
}

type Readouts = {
  readonly get: Phaser.GameObjects.Text
  readonly objective: Phaser.GameObjects.Text
  readonly hint: Phaser.GameObjects.Text
  readonly conditions: readonly Phaser.GameObjects.Text[]
  readonly altitude: Phaser.GameObjects.Text
  readonly vertical: Phaser.GameObjects.Text
  readonly forward: Phaser.GameObjects.Text
  readonly fuel: Phaser.GameObjects.Text
  readonly checklist: Phaser.GameObjects.Text
  readonly annunciators: readonly AnnunciatorReadout[]
}

type AnnunciatorReadout = {
  readonly label: Phaser.GameObjects.Text
  readonly lamp: Phaser.GameObjects.Rectangle
}

type TerrainLayer = {
  readonly sprite: Phaser.GameObjects.Sprite
  mask: Phaser.Filters.Mask | null
}

const makeTextStyle = (
  size: number,
  color = '#c8c4ae',
  align: Phaser.Types.GameObjects.Text.TextStyle['align'] = 'left',
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: `${size}px`,
  color,
  align,
  resolution: 1,
})

const objectiveLines = (status: ReturnType<typeof getLandingObjective>['id']): string => {
  switch (status) {
    case 'clear-crater': return 'FLY BEYOND\nTHE CRATER'
    case 'clear-boulders': return 'CLEAR THE\nBOULDER FIELD'
    case 'arrest-forward': return 'SLOW FORWARD\nMOTION'
    case 'slow-descent': return 'SLOW THE\nDESCENT'
    case 'touchdown': return 'DESCEND ON\nCLEAR GROUND'
    case 'complete': return 'EAGLE HAS\nLANDED'
    case 'failed': return 'LOSS OF\nMISSION'
  }
}

const instructionLines = (instruction: string): string => instruction.replace(' · ', '\n')
const gate = (ready: boolean): string => ready ? 'READY' : 'NEED '
const check = (ready: boolean): string => ready ? '[X]' : '[ ]'
const ANNUNCIATOR_COLORS: Record<LandingAnnunciatorTone, { text: string, lamp: number }> = {
  off: { text: '#5d5f58', lamp: 0x272a26 },
  ready: { text: '#b8d35c', lamp: 0xb8d35c },
  caution: { text: '#d3a951', lamp: 0xd3a951 },
  danger: { text: '#d36b51', lamp: 0xd36b51 },
}

/**
 * Playable P66 terminal-descent slice.
 *
 * Phaser owns input, timing and rendering. The authored exterior changes only from the
 * game-specific landing state, while the deterministic model remains independent from Phaser.
 */
export class LandingScene extends Phaser.Scene {
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private state: LandingState = { ...P66_TERMINAL_START_STATE }
  private terrainCurrent!: TerrainLayer
  private terrainIncoming!: TerrainLayer
  private terrainCurrentFrame!: P66TerrainFrame
  private terrainIncomingFrame: P66TerrainFrame | null = null
  private terrainTransitionMs = 0
  private terrainDitherStep = P66_TERRAIN_DITHER_STEPS
  private terrainTransitionsReady = false
  private readouts!: Readouts
  private controls!: ControlKeys
  private debug!: Phaser.GameObjects.Graphics
  private mode: WorkspaceMode = 'play'
  private overlays = false
  private accumulator = 0
  private lastReportAt = -Infinity

  constructor(report: (snapshot: RuntimeSnapshot) => void) {
    super('landing')
    this.report = report
  }

  preload(): void {
    this.load.image(COCKPIT_KEY, '/assets/landing/p66-cockpit-snes.png')
    for (const key of P66_TERRAIN_STARTUP_ATLAS_KEYS) {
      this.load.spritesheet(key, `/assets/landing/${key}.png`, {
        frameWidth: P66_TERRAIN_FRAME_WIDTH,
        frameHeight: P66_TERRAIN_FRAME_HEIGHT,
      })
    }
  }

  create(): void {
    this.terrainIncomingFrame = null
    this.terrainTransitionMs = 0
    this.terrainDitherStep = P66_TERRAIN_DITHER_STEPS
    this.terrainTransitionsReady = false
    this.accumulator = 0
    this.lastReportAt = -Infinity
    this.cameras.main.setRoundPixels(true)
    this.terrainCurrentFrame = getP66TerrainFrame(
      this.state.forwardPositionFt,
      this.state.altitudeFt,
    )
    this.terrainCurrent = this.createTerrainLayer(this.terrainCurrentFrame, 0)
    this.terrainIncoming = this.createTerrainLayer(this.terrainCurrentFrame, 1)
    this.terrainIncoming.sprite.setVisible(false)
    this.add.image(0, 0, COCKPIT_KEY).setOrigin(0).setScale(P66_DISPLAY_SCALE).setDepth(10)
    this.createDiegeticReadouts()
    this.controls = this.input.keyboard!.addKeys({
      rateUp: Phaser.Input.Keyboard.KeyCodes.W,
      rateDown: Phaser.Input.Keyboard.KeyCodes.S,
      forwardDown: Phaser.Input.Keyboard.KeyCodes.A,
      forwardUp: Phaser.Input.Keyboard.KeyCodes.D,
      reset: Phaser.Input.Keyboard.KeyCodes.R,
    }) as ControlKeys
    this.debug = this.add.graphics().setDepth(100).setVisible(this.overlays)
    this.debug.lineStyle(1, 0x5be7ff, 0.8)
    this.debug.strokeRect(846, 69, 65, 86)
    this.debug.strokeRect(738, 164, 170, 46)
    this.debug.strokeRect(752, 214, 157, 116)
    this.debug.strokeRect(715, 365, 139, 137)
    this.updatePresentation(0)

    // Let the browser present a complete, unfiltered lunar frame before preparing transition
    // masks and asking the Loader for the rest of the descent plates.
    this.game.events.once(Phaser.Core.Events.POST_RENDER, this.finishTerrainStartup, this)

    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
      this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
      this.game.events.off(Phaser.Core.Events.POST_RENDER, this.finishTerrainStartup, this)
    })
  }

  override update(time: number, delta: number): void {
    if (this.mode === 'play') {
      if (Phaser.Input.Keyboard.JustDown(this.controls.reset)) this.resetAttempt()
      this.advanceSimulation(delta)
    }

    this.updatePresentation(delta)
    if (time - this.lastReportAt >= 100) {
      this.lastReportAt = time
      this.reportState()
    }
  }

  private advanceSimulation(deltaMs: number): void {
    if (this.state.status !== 'flying') return
    this.accumulator += Math.min(deltaMs / 1_000, 0.1)
    const fixedStep = 1 / 60
    while (this.accumulator >= fixedStep) {
      this.state = stepLanding(this.state, {
        rateCommand: Number(this.controls.rateUp.isDown) - Number(this.controls.rateDown.isDown),
        forwardCommand: Number(this.controls.forwardUp.isDown) - Number(this.controls.forwardDown.isDown),
      }, fixedStep)
      this.accumulator -= fixedStep
    }
  }

  private resetAttempt(): void {
    this.state = { ...P66_TERMINAL_START_STATE }
    this.accumulator = 0
  }

  private createDiegeticReadouts(): void {
    const green = '#b8d35c'
    const amber = '#d3a951'
    const muted = '#777a70'
    const paper = '#302e28'

    this.add.text(878, 94, 'P66', makeTextStyle(16, green, 'center')).setOrigin(0.5).setDepth(20)
    const get = this.add.text(823, 182, '', makeTextStyle(11, amber, 'center')).setOrigin(0.5).setDepth(20)

    this.add.text(830, 230, 'CURRENT OBJECTIVE', makeTextStyle(7, muted, 'center'))
      .setOrigin(0.5).setDepth(20)
    const objective = this.add.text(830, 252, '', makeTextStyle(12, amber, 'center'))
      .setOrigin(0.5).setLineSpacing(3).setDepth(20)
    const hint = this.add.text(830, 297, '', makeTextStyle(7, '#b5b19f', 'center'))
      .setOrigin(0.5).setLineSpacing(2).setDepth(20)

    this.add.text(784, 379, 'LANDING CONDITIONS', makeTextStyle(7, muted, 'center'))
      .setOrigin(0.5).setDepth(20)
    const conditions = [402, 422, 442, 462].map((y) =>
      this.add.text(733, y, '', makeTextStyle(8, amber)).setDepth(20),
    )

    this.add.text(371, 423, 'ALTITUDE', makeTextStyle(7, muted, 'center')).setOrigin(0.5).setDepth(20)
    const altitude = this.add.text(371, 441, '', makeTextStyle(12, green, 'center')).setOrigin(0.5).setDepth(20)
    this.add.text(371, 471, 'VERTICAL', makeTextStyle(7, muted, 'center')).setOrigin(0.5).setDepth(20)
    const vertical = this.add.text(371, 489, '', makeTextStyle(12, green, 'center')).setOrigin(0.5).setDepth(20)
    this.add.text(452, 423, 'FORWARD', makeTextStyle(7, muted, 'center')).setOrigin(0.5).setDepth(20)
    const forward = this.add.text(452, 441, '', makeTextStyle(12, amber, 'center')).setOrigin(0.5).setDepth(20)
    this.add.text(452, 471, 'FUEL', makeTextStyle(7, muted, 'center')).setOrigin(0.5).setDepth(20)
    const fuel = this.add.text(458, 489, '', makeTextStyle(9, green, 'center')).setOrigin(0.5).setDepth(20)

    const annunciatorPositions = [
      { x: 243, y: 430 }, { x: 304, y: 430 },
      { x: 243, y: 472 }, { x: 304, y: 472 },
      { x: 243, y: 513 }, { x: 304, y: 513 },
    ] as const
    const annunciators = getLandingAnnunciators(this.state).map((annunciator, index) => {
      const position = annunciatorPositions[index]!
      return {
        label: this.add.text(
          position.x,
          position.y - 3,
          annunciator.label,
          makeTextStyle(7, ANNUNCIATOR_COLORS.off.text, 'center'),
        ).setOrigin(0.5).setDepth(20),
        lamp: this.add.rectangle(
          position.x,
          position.y + 9,
          21,
          3,
          ANNUNCIATOR_COLORS.off.lamp,
        ).setDepth(20),
      }
    })

    this.add.text(46, 368, 'LANDING', makeTextStyle(9, paper)).setDepth(20)
    const checklist = this.add.text(42, 392, '', makeTextStyle(8, paper)).setLineSpacing(7).setDepth(20)
    this.add.text(42, 505, 'TASK: LAND EAGLE', makeTextStyle(7, paper)).setDepth(20)

    this.readouts = {
      get,
      objective,
      hint,
      conditions,
      altitude,
      vertical,
      forward,
      fuel,
      checklist,
      annunciators,
    }
  }

  private updatePresentation(deltaMs: number): void {
    this.updateTerrainPresentation(deltaMs)

    const site = classifyLandingSite(this.state.forwardPositionFt)
    const objective = getLandingObjective(this.state)
    const groundReady = site === 'plain'
    const forwardReady = Math.abs(this.state.forwardSpeedFps) <= 8
    const verticalReady = Math.abs(this.state.verticalSpeedFps) <= 6
    const fuelReady = this.state.fuelSeconds > 0

    this.readouts.get.setText(`GET ${formatGet(this.state.getSeconds)}`)
    this.readouts.objective
      .setText(objectiveLines(objective.id))
      .setColor(this.state.status === 'landed' ? '#b8d35c' : this.state.status === 'hard-landing' ? '#d36b51' : '#d3a951')
    this.readouts.hint.setText(instructionLines(objective.controlHint))
    const conditionLines = [
      `${gate(groundReady)}  GROUND  ${site.toUpperCase()}`,
      `${gate(forwardReady)}  FWD ≤8  ${Math.abs(this.state.forwardSpeedFps).toFixed(1)}`,
      `${gate(verticalReady)}  VERT ≤6 ${Math.abs(this.state.verticalSpeedFps).toFixed(1)}`,
      `${gate(fuelReady)}  FUEL    ${this.state.fuelSeconds.toFixed(0)} SEC`,
    ]
    const conditionReady = [groundReady, forwardReady, verticalReady, fuelReady]
    this.readouts.conditions.forEach((line, index) => {
      line.setText(conditionLines[index] ?? '').setColor(conditionReady[index] ? '#b8d35c' : '#d3a951')
    })
    this.readouts.altitude.setText(`${this.state.altitudeFt.toFixed(0)} FT`)
    this.readouts.vertical.setText(this.state.verticalSpeedFps.toFixed(1)).setColor(verticalReady ? '#b8d35c' : '#d3a951')
    this.readouts.forward.setText(this.state.forwardSpeedFps.toFixed(1)).setColor(forwardReady ? '#b8d35c' : '#d3a951')
    this.readouts.fuel
      .setText(`${this.state.fuelSeconds.toFixed(0)} SEC`)
      .setColor(this.state.fuelSeconds > 30 ? '#b8d35c' : this.state.fuelSeconds > 0 ? '#d3a951' : '#d36b51')
    const annunciators = getLandingAnnunciators(this.state)
    this.readouts.annunciators.forEach((readout, index) => {
      const annunciator = annunciators[index]!
      const color = ANNUNCIATOR_COLORS[annunciator.tone]
      readout.label.setColor(color.text)
      readout.lamp.setFillStyle(color.lamp)
    })
    this.readouts.checklist.setText([
      `${check(this.state.forwardPositionFt >= 1_050)} CLEAR CRATER`,
      `${check(groundReady)} FIND OPEN GROUND`,
      `${check(forwardReady)} FWD RATE  ≤ 8`,
      `${check(verticalReady)} VERT RATE ≤ 6`,
      `${check(this.state.status === 'landed')} CONTACT LIGHT`,
    ])
  }

  private createTerrainDitherMasks(): void {
    for (let step = 0; step <= P66_TERRAIN_DITHER_STEPS; step += 1) {
      const key = P66_DITHER_MASK_KEYS[step]!
      if (this.textures.exists(key)) continue
      const texture = this.textures.createCanvas(
        key,
        P66_TERRAIN_FRAME_WIDTH,
        P66_TERRAIN_FRAME_HEIGHT,
      )
      if (!texture) throw new Error(`Unable to create P66 dither mask ${key}.`)
      const context = texture.getContext()
      const image = context.createImageData(P66_TERRAIN_FRAME_WIDTH, P66_TERRAIN_FRAME_HEIGHT)
      for (let y = 0; y < P66_TERRAIN_FRAME_HEIGHT; y += 1) {
        for (let x = 0; x < P66_TERRAIN_FRAME_WIDTH; x += 1) {
          const pixel = (y * P66_TERRAIN_FRAME_WIDTH + x) * 4
          const visible = isP66TerrainDitherPixelVisible(x, y, step)
          image.data[pixel] = 255
          image.data[pixel + 1] = 255
          image.data[pixel + 2] = 255
          image.data[pixel + 3] = visible ? 255 : 0
        }
      }
      context.putImageData(image, 0, 0)
      texture.refresh()
    }
  }

  private createTerrainLayer(frame: P66TerrainFrame, depth: number): TerrainLayer {
    const sprite = this.add.sprite(480, 270, frame.textureKey, frame.atlasFrame)
      .setOrigin(0.5).setScale(P66_DISPLAY_SCALE).setDepth(depth)
    return { sprite, mask: null }
  }

  private finishTerrainStartup(): void {
    this.time.delayedCall(0, () => {
      this.createTerrainDitherMasks()
      this.terrainTransitionsReady = true
      this.loadDeferredTerrainAtlases()
    })
  }

  private loadDeferredTerrainAtlases(): void {
    let queued = 0
    for (const key of P66_TERRAIN_DEFERRED_ATLAS_KEYS) {
      if (this.textures.exists(key)) continue
      this.load.spritesheet(key, `/assets/landing/${key}.png`, {
        frameWidth: P66_TERRAIN_FRAME_WIDTH,
        frameHeight: P66_TERRAIN_FRAME_HEIGHT,
      })
      queued += 1
    }
    if (queued > 0 && !this.load.isLoading()) this.load.start()
  }

  private ensureTerrainMask(layer: TerrainLayer): Phaser.Filters.Mask {
    if (layer.mask) return layer.mask
    layer.sprite.enableFilters()
    layer.mask = layer.sprite.filters!.internal.addMask(
      P66_DITHER_MASK_KEYS[P66_TERRAIN_DITHER_STEPS],
    )
    return layer.mask
  }

  private applyTerrainPose(layer: TerrainLayer, frame: P66TerrainFrame): void {
    const pose = getP66TerrainPose(
      frame,
      this.state.forwardPositionFt,
      this.state.altitudeFt,
    )
    layer.sprite.setPosition(pose.x, pose.y).setScale(pose.scale)
  }

  private beginTerrainTransition(frame: P66TerrainFrame): void {
    this.terrainIncomingFrame = frame
    this.terrainTransitionMs = 0
    this.terrainDitherStep = 0
    this.terrainIncoming.sprite
      .setTexture(frame.textureKey, frame.atlasFrame)
      .setDepth(1)
      .setVisible(true)
    this.ensureTerrainMask(this.terrainIncoming).setTexture(P66_DITHER_MASK_KEYS[0])
    this.terrainCurrent.sprite.setDepth(0).setVisible(true)
  }

  private finishTerrainTransition(): void {
    if (!this.terrainIncomingFrame) return
    this.terrainIncoming.mask?.setTexture(P66_DITHER_MASK_KEYS[P66_TERRAIN_DITHER_STEPS])
    this.terrainCurrent.sprite.setVisible(false)
    const previous = this.terrainCurrent
    this.terrainCurrent = this.terrainIncoming
    this.terrainIncoming = previous
    this.terrainCurrentFrame = this.terrainIncomingFrame
    this.terrainIncomingFrame = null
    this.terrainDitherStep = P66_TERRAIN_DITHER_STEPS
    this.terrainCurrent.sprite.setDepth(0).setVisible(true)
    this.terrainIncoming.sprite.setDepth(1).setVisible(false)
    this.terrainCurrent.sprite.filters?.internal.clear()
    this.terrainCurrent.mask = null
  }

  private cancelTerrainTransition(): void {
    this.terrainIncomingFrame = null
    this.terrainTransitionMs = 0
    this.terrainDitherStep = P66_TERRAIN_DITHER_STEPS
    this.terrainIncoming.sprite.setVisible(false)
  }

  private updateTerrainPresentation(deltaMs: number): void {
    const desired = getP66TerrainFrame(this.state.forwardPositionFt, this.state.altitudeFt)
    const selected = this.textures.exists(desired.textureKey)
      ? desired
      : (this.terrainIncomingFrame ?? this.terrainCurrentFrame)
    if (!this.terrainTransitionsReady) {
      this.applyTerrainPose(this.terrainCurrent, this.terrainCurrentFrame)
      return
    }
    if (
      this.terrainIncomingFrame
      && selected.absoluteFrame === this.terrainCurrentFrame.absoluteFrame
    ) {
      this.cancelTerrainTransition()
    } else if (
      this.terrainIncomingFrame
      && selected.absoluteFrame !== this.terrainIncomingFrame.absoluteFrame
    ) {
      this.finishTerrainTransition()
    }
    if (
      !this.terrainIncomingFrame
      && selected.absoluteFrame !== this.terrainCurrentFrame.absoluteFrame
    ) {
      this.beginTerrainTransition(selected)
    }

    this.applyTerrainPose(this.terrainCurrent, this.terrainCurrentFrame)
    if (!this.terrainIncomingFrame) return

    this.applyTerrainPose(this.terrainIncoming, this.terrainIncomingFrame)
    this.terrainTransitionMs = Math.min(
      P66_TERRAIN_TRANSITION_MS,
      this.terrainTransitionMs + Math.max(0, deltaMs),
    )
    const ditherStep = getP66TerrainDitherStep(this.terrainTransitionMs)
    if (ditherStep !== this.terrainDitherStep) {
      this.terrainDitherStep = ditherStep
      this.terrainIncoming.mask?.setTexture(P66_DITHER_MASK_KEYS[ditherStep])
    }
    if (ditherStep === P66_TERRAIN_DITHER_STEPS) this.finishTerrainTransition()
  }

  private reportState(): void {
    this.report({
      scene: 'landing',
      getSeconds: this.state.getSeconds,
      altitudeFt: this.state.altitudeFt,
      verticalSpeedFps: this.state.verticalSpeedFps,
      forwardSpeedFps: this.state.forwardSpeedFps,
      downrangeFt: this.state.forwardPositionFt,
      descentRateCommandFps: this.state.descentRateCommandFps,
      fuelSeconds: this.state.fuelSeconds,
      program: 'P66',
      site: classifyLandingSite(this.state.forwardPositionFt),
      status: this.state.status,
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private setWorkspaceMode(mode: WorkspaceMode): void {
    this.mode = mode
  }

  private setOverlays(value: boolean): void {
    this.overlays = value
    this.debug.setVisible(value)
  }
}
