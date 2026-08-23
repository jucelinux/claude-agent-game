import Phaser from 'phaser'
import {
  ALL_ENGINES_RUNNING_SECONDS,
  AUTOMATIC_SEQUENCE_SECONDS,
  IGNITION_SEQUENCE_SECONDS,
  INITIAL_LAUNCH_STATE,
  LAUNCH_PROCEDURES,
  activateLaunchControl,
  canVerifyLaunchProcedure,
  formatLaunchClock,
  getArmstrongWindowPose,
  getCurrentLaunchProcedure,
  getLaunchEventCallout,
  isLaunchProcedureDue,
  stepLaunch,
  verifyLaunchProcedure,
  type LaunchControlId,
  type LaunchState,
  type LaunchStation,
} from './model.ts'
import {
  WORKSPACE_MODE_EVENT,
  WORKSPACE_OVERLAY_EVENT,
  type RuntimeSnapshot,
  type WorkspaceMode,
} from '../types.ts'

const WIDTH = 960
const HEIGHT = 540
const PAD_ART_KEY = 'launch-pad39a-establishing'
const WINDOW_ART_KEY = 'launch-armstrong-window'
const UI_TONE_KEY = 'launch-ui-tone'
const RELAY_TONE_KEY = 'launch-relay-tone'
const ADVANCE_TONE_KEY = 'launch-advance-tone'
const CABIN_HUM_KEY = 'launch-cabin-hum'
const RUMBLE_KEY = 'launch-rumble'
const MINIMUM_TRANSITION_MS = 900
const ARMSTRONG_WINDOW = { x: 294, y: 94, width: 462, height: 180 } as const

type LaunchKeys = {
  readonly action1: Phaser.Input.Keyboard.Key
  readonly action2: Phaser.Input.Keyboard.Key
  readonly action3: Phaser.Input.Keyboard.Key
  readonly confirm: Phaser.Input.Keyboard.Key
  readonly advance: Phaser.Input.Keyboard.Key
  readonly reset: Phaser.Input.Keyboard.Key
}

type LaunchPresentation = 'pad' | 'ingress' | 'cabin' | 'operations' | 'transition'

type ControlSpec = {
  readonly label: string
  readonly target: string
  readonly kind: 'SET' | 'VERIFY' | 'COORD'
}

type OperationReadouts = {
  readonly clock: Phaser.GameObjects.Text
  readonly rate: Phaser.GameObjects.Text
  readonly station: Phaser.GameObjects.Text
  readonly stationDetail: Phaser.GameObjects.Text
  readonly checklistCode: Phaser.GameObjects.Text
  readonly checklistTitle: Phaser.GameObjects.Text
  readonly checklistCommand: Phaser.GameObjects.Text
  readonly checklistProgress: Phaser.GameObjects.Text
  readonly objective: Phaser.GameObjects.Text
  readonly procedure: Phaser.GameObjects.Text
  readonly acceptance: Phaser.GameObjects.Text
  readonly hint: Phaser.GameObjects.Text
  readonly event: Phaser.GameObjects.Text
  readonly evidence: Phaser.GameObjects.Text
  readonly metrics: Phaser.GameObjects.Text
}

type IntroductionReadouts = {
  readonly chapter: Phaser.GameObjects.Text
  readonly clock: Phaser.GameObjects.Text
  readonly title: Phaser.GameObjects.Text
  readonly subtitle: Phaser.GameObjects.Text
  readonly caption: Phaser.GameObjects.Text
  readonly prompt: Phaser.GameObjects.Text
  readonly artLabel1: Phaser.GameObjects.Text
  readonly artLabel2: Phaser.GameObjects.Text
  readonly artLabel3: Phaser.GameObjects.Text
  readonly button: Phaser.GameObjects.Text
}

const CONTROL_SPECS: Record<LaunchControlId, ControlSpec> = {
  'inspect-strut': { label: 'SHOCK STRUT', target: 'INSPECT RELEASE', kind: 'VERIFY' },
  'request-pad-support': { label: 'WHITE ROOM', target: 'REQUEST SUPPORT', kind: 'COORD' },
  'verify-relock': { label: 'STRUT RELEASE', target: 'VERIFY RE-LOCK', kind: 'VERIFY' },
  'mcc-command-link': { label: 'MCC COMMAND', target: 'READ BACK', kind: 'VERIFY' },
  'eds-test': { label: 'EDS TEST', target: 'VERIFY NOMINAL', kind: 'VERIFY' },
  'les-indicator': { label: 'LES', target: 'VERIFY ARMED', kind: 'VERIFY' },
  'eds-auto': { label: 'EDS AUTO', target: 'ON', kind: 'SET' },
  'lv-rates-auto': { label: 'LV RATES', target: 'AUTO', kind: 'SET' },
  'two-eng-out-auto': { label: '2 ENG OUT', target: 'AUTO', kind: 'SET' },
  'cte-update': { label: 'CTE UPDATE', target: 'VERIFY AZIMUTH', kind: 'VERIFY' },
  'rhc-direct-a': { label: 'RHC DIRECT 1', target: 'MAIN A', kind: 'SET' },
  'rhc-direct-b': { label: 'RHC DIRECT 2', target: 'MAIN B', kind: 'SET' },
  'fc-react-latch': { label: 'FC REACT', target: 'LATCH', kind: 'SET' },
  'secondary-cooling-off': { label: 'SEC COOL LOOP', target: 'OFF', kind: 'SET' },
  'tvc-servo-1': { label: 'TVC SERVO 1', target: 'AC1 / MNA', kind: 'SET' },
  'tvc-servo-2': { label: 'TVC SERVO 2', target: 'AC2 / MNB', kind: 'SET' },
  'launch-comm-check': { label: 'LAUNCH COMM', target: 'VOICE CHECK', kind: 'VERIFY' },
  'dsky-p02': { label: 'DSKY', target: 'VERIFY P02', kind: 'VERIFY' },
  'v75-no-enter': { label: 'V75', target: 'NO ENTER', kind: 'SET' },
  'tape-forward': { label: 'TAPE RCD FWD', target: 'FORWARD', kind: 'SET' },
  'glycol-bypass': { label: 'PRIM GLY / RAD', target: 'BYPASS', kind: 'SET' },
  'main-bus-tie-a': { label: 'MAIN BUS TIE 1', target: 'ON', kind: 'SET' },
  'main-bus-tie-b': { label: 'MAIN BUS TIE 2', target: 'ON', kind: 'SET' },
  'pad-comm-off': { label: 'PAD COMM 1 / 2', target: 'OFF', kind: 'SET' },
  'gdc-align': { label: 'GDC ALIGN', target: 'FDAI 2 NO MOTION', kind: 'VERIFY' },
  'liftoff-light': { label: 'LIFTOFF', target: 'LIGHT ON', kind: 'VERIFY' },
  'met-running': { label: 'EVENT TIMER', target: 'COUNTING UP', kind: 'VERIFY' },
  'tower-view': { label: 'LEFT WINDOW', target: 'TOWER CLEAR', kind: 'VERIFY' },
}

const STATION_LABELS: Record<LaunchStation, string> = {
  'collins-right': 'COLLINS · RIGHT COUCH',
  'crew-forward': 'CREW · FORWARD PANEL',
  'armstrong-left': 'ARMSTRONG · LEFT COUCH',
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

const constrainText = (
  text: Phaser.GameObjects.Text,
  width: number,
  maxLines = 1,
): Phaser.GameObjects.Text => text.setWordWrapWidth(width, true).setMaxLines(maxLines)

const writeAscii = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

/** Temporary deterministic cues. Archival Apollo audio remains a separately sourced asset task. */
const makeToneDataUri = (
  durationSeconds: number,
  sampleAt: (seconds: number, progress: number) => number,
): string => {
  const sampleRate = 16_000
  const sampleCount = Math.floor(sampleRate * durationSeconds)
  const dataBytes = sampleCount * 2
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataBytes, true)
  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount
    const sample = Phaser.Math.Clamp(sampleAt(index / sampleRate, progress), -1, 1)
    view.setInt16(44 + index * 2, Math.round(sample * 30_000), true)
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:audio/wav;base64,${btoa(binary)}`
}

export class LaunchScene extends Phaser.Scene {
  private readonly report: (snapshot: RuntimeSnapshot) => void
  private state: LaunchState = INITIAL_LAUNCH_STATE
  private keys!: LaunchKeys
  private presentation: LaunchPresentation = 'pad'
  private operationsLayer!: Phaser.GameObjects.Container
  private introLayer!: Phaser.GameObjects.Container
  private introPadImage!: Phaser.GameObjects.Image
  private windowExteriorImage!: Phaser.GameObjects.Image
  private windowMaskShape!: Phaser.GameObjects.Graphics
  private windowEffectGraphics!: Phaser.GameObjects.Graphics
  private stationGraphics!: Phaser.GameObjects.Graphics
  private introGraphics!: Phaser.GameObjects.Graphics
  private controlLayer!: Phaser.GameObjects.Container
  private readouts!: OperationReadouts
  private introReadouts!: IntroductionReadouts
  private verifyButton!: Phaser.GameObjects.Container
  private verifyButtonSurface!: Phaser.GameObjects.Rectangle
  private advanceButton!: Phaser.GameObjects.Container
  private advanceButtonSurface!: Phaser.GameObjects.Rectangle
  private advanceButtonLabel!: Phaser.GameObjects.Text
  private introButton!: Phaser.GameObjects.Container
  private introButtonSurface!: Phaser.GameObjects.Rectangle
  private overlay!: Phaser.GameObjects.Graphics
  private cabinHum!: Phaser.Sound.BaseSound
  private rumble!: Phaser.Sound.BaseSound
  private mode: WorkspaceMode = 'play'
  private overlays = false
  private transitionStartedAt = 0
  private controlSignature = ''
  private lastCallout = 'CREW INGRESS'
  private lastReportAt = -Infinity

  constructor(report: (snapshot: RuntimeSnapshot) => void) {
    super('launch')
    this.report = report
  }

  preload(): void {
    this.load.image(PAD_ART_KEY, '/assets/launch/pad39a-establishing-snes.png')
    this.load.image(WINDOW_ART_KEY, '/assets/launch/armstrong-window-exterior-snes.png')
    this.load.audio(UI_TONE_KEY, makeToneDataUri(
      0.11,
      (seconds, progress) => (
        Math.sin(seconds * Math.PI * 2 * 920)
        + Math.sign(Math.sin(seconds * Math.PI * 2 * 460)) * 0.22
      ) * (1 - progress) ** 2 * 0.28,
    ))
    this.load.audio(RELAY_TONE_KEY, makeToneDataUri(
      0.09,
      (seconds, progress) => (
        Math.sin(seconds * Math.PI * 2 * 118)
        + Math.sin(seconds * Math.PI * 2 * 2_340) * 0.28
      ) * (1 - progress) ** 5 * 0.55,
    ))
    this.load.audio(ADVANCE_TONE_KEY, makeToneDataUri(
      0.62,
      (seconds, progress) => {
        const phase = Math.PI * 2 * (135 * seconds + 520 * seconds * seconds)
        return Math.sin(phase) * Math.sin(Math.PI * progress) * 0.24
      },
    ))
    this.load.audio(CABIN_HUM_KEY, makeToneDataUri(
      2,
      (seconds) => (
        Math.sin(seconds * Math.PI * 2 * 60) * 0.48
        + Math.sin(seconds * Math.PI * 2 * 180) * 0.14
        + Math.sin(seconds * Math.PI * 2 * 420) * 0.04
        + Math.sin(seconds * Math.PI * 2 * 997) * Math.sin(seconds * Math.PI * 2 * 7) * 0.018
      ) * 0.13,
    ))
    this.load.audio(RUMBLE_KEY, makeToneDataUri(
      1,
      (seconds) => (
        Math.sin(seconds * Math.PI * 2 * 36)
        + Math.sin(seconds * Math.PI * 2 * 52) * 0.62
        + Math.sin(seconds * Math.PI * 2 * 83) * Math.sin(seconds * Math.PI * 2 * 11) * 0.2
      ) * 0.23,
    ))
  }

  create(): void {
    this.resetState()
    this.cameras.main.setRoundPixels(true)
    this.cameras.main.setBackgroundColor('#05070a')

    this.operationsLayer = this.add.container(0, 0).setDepth(10)
    this.createOperationsFrame()
    this.stationGraphics = this.add.graphics()
    this.operationsLayer.add(this.stationGraphics)
    this.windowExteriorImage = this.add.image(150, 0, WINDOW_ART_KEY)
      .setOrigin(0)
      .setScale(1.25)
      .setVisible(false)
    this.windowMaskShape = this.make.graphics({ x: 0, y: 0 })
    this.windowMaskShape.fillStyle(0xffffff).fillRect(
      ARMSTRONG_WINDOW.x,
      ARMSTRONG_WINDOW.y,
      ARMSTRONG_WINDOW.width,
      ARMSTRONG_WINDOW.height,
    )
    this.windowExteriorImage.setMask(this.windowMaskShape.createGeometryMask())
    this.operationsLayer.add(this.windowExteriorImage)
    this.windowEffectGraphics = this.add.graphics()
    this.operationsLayer.add(this.windowEffectGraphics)
    this.controlLayer = this.add.container(0, 0)
    this.operationsLayer.add(this.controlLayer)
    this.createOperationReadouts()
    this.createActionButtons()

    this.introLayer = this.add.container(0, 0).setDepth(30)
    this.createIntroduction()
    this.overlay = this.add.graphics().setDepth(100).setVisible(this.overlays)

    const keyboard = this.input.keyboard
    if (keyboard === null) throw new Error('keyboard input is unavailable')
    this.keys = keyboard.addKeys({
      action1: Phaser.Input.Keyboard.KeyCodes.ONE,
      action2: Phaser.Input.Keyboard.KeyCodes.TWO,
      action3: Phaser.Input.Keyboard.KeyCodes.THREE,
      confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
      advance: Phaser.Input.Keyboard.KeyCodes.SPACE,
      reset: Phaser.Input.Keyboard.KeyCodes.R,
    }) as LaunchKeys

    this.cabinHum = this.sound.add(CABIN_HUM_KEY, { loop: true, volume: 0.16 })
    this.rumble = this.sound.add(RUMBLE_KEY, { loop: true, volume: 0.16 })
    this.game.events.on(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
    this.game.events.on(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.rumble.stop()
      this.cabinHum.stop()
      this.cameras.main.setScroll(0, 0)
      this.game.events.off(WORKSPACE_MODE_EVENT, this.setWorkspaceMode, this)
      this.game.events.off(WORKSPACE_OVERLAY_EVENT, this.setOverlays, this)
    })

    this.updatePresentation()
  }

  override update(time: number, delta: number): void {
    if (this.mode === 'play') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.reset)) this.resetAttempt()

      if (this.presentation === 'operations') {
        this.readKeyboardActions(time)
        this.state = stepLaunch(this.state, { accelerate: false }, Math.min(delta / 1_000, 0.1))
      } else if (this.presentation === 'transition') {
        this.state = stepLaunch(this.state, { accelerate: true }, Math.min(delta / 1_000, 0.1))
        if (
          isLaunchProcedureDue(this.state)
          && time - this.transitionStartedAt >= MINIMUM_TRANSITION_MS
        ) {
          this.finishTimeAdvance()
        }
      } else if (
        Phaser.Input.Keyboard.JustDown(this.keys.confirm)
        || Phaser.Input.Keyboard.JustDown(this.keys.advance)
      ) {
        this.advanceIntroduction()
      }
    }

    this.syncRumble()
    this.updatePresentation()
    if (time - this.lastReportAt >= 100) {
      this.lastReportAt = time
      this.reportState()
    }
  }

  private resetState(): void {
    this.state = {
      ...INITIAL_LAUNCH_STATE,
      activeControls: [],
      completedProcedures: [],
    }
    this.presentation = 'pad'
    this.transitionStartedAt = 0
    this.controlSignature = ''
    this.lastCallout = 'CREW INGRESS'
    this.lastReportAt = -Infinity
  }

  private createOperationsFrame(): void {
    const frame = this.add.graphics()
    frame.fillStyle(0x05070a).fillRect(0, 0, WIDTH, HEIGHT)
    frame.fillStyle(0x10151a).fillRect(0, 0, WIDTH, 34)
    frame.lineStyle(1, 0x34404a).strokeRect(0, 0, WIDTH, HEIGHT)
    frame.lineBetween(0, 34, WIDTH, 34)

    frame.fillStyle(0xc2b99e).fillRect(16, 48, 238, 462)
    frame.fillStyle(0x998f76).fillRect(22, 54, 226, 6)
    frame.lineStyle(2, 0x514b3f).strokeRect(16, 48, 238, 462)
    frame.fillStyle(0x292e30).fillRect(268, 48, 676, 326)
    frame.lineStyle(2, 0x4a5252).strokeRect(268, 48, 676, 326)
    frame.fillStyle(0x101516).fillRect(268, 386, 676, 124)
    frame.lineStyle(2, 0x4a5252).strokeRect(268, 386, 676, 124)
    this.operationsLayer.add(frame)

    const fixedLabels = [
      this.add.text(18, 12, 'APOLLO 11  /  LAUNCH DAY', makeTextStyle(10, '#d4ab52')),
      this.add.text(30, 70, 'LAUNCH OPERATIONS', makeTextStyle(10, '#2e2c28')),
      this.add.text(30, 88, 'CSM-107  /  AS-506', makeTextStyle(8, '#5c5548')),
      this.add.text(286, 398, 'MISSION OBJECTIVE', makeTextStyle(7, '#707a78')),
      this.add.text(286, 438, 'CURRENT PROCEDURE', makeTextStyle(7, '#707a78')),
      this.add.text(286, 478, 'ACCEPTANCE', makeTextStyle(7, '#707a78')),
    ]
    this.operationsLayer.add(fixedLabels)
  }

  private createOperationReadouts(): void {
    this.readouts = {
      clock: this.add.text(670, 10, '', makeTextStyle(13, '#b8d35c')),
      rate: this.add.text(932, 13, '', makeTextStyle(8, '#8c9694', 'right')).setOrigin(1, 0),
      station: constrainText(this.add.text(286, 58, '', makeTextStyle(9, '#b8d35c')), 360),
      stationDetail: constrainText(this.add.text(286, 73, '', makeTextStyle(7, '#717b79')), 390),
      checklistCode: this.add.text(30, 118, '', makeTextStyle(8, '#625a4a')),
      checklistTitle: constrainText(this.add.text(30, 145, '', makeTextStyle(12, '#292824')), 202, 2),
      checklistCommand: constrainText(this.add.text(30, 194, '', makeTextStyle(9, '#3c3931')).setLineSpacing(5), 202, 4),
      checklistProgress: constrainText(this.add.text(30, 300, '', makeTextStyle(8, '#39362f')).setLineSpacing(7), 202, 7),
      objective: constrainText(this.add.text(286, 414, '', makeTextStyle(10, '#d4ab52')), 430),
      procedure: constrainText(this.add.text(286, 453, '', makeTextStyle(9, '#e0d7bf')), 430),
      acceptance: constrainText(this.add.text(286, 493, '', makeTextStyle(8, '#b8d35c')), 520),
      hint: this.add.text(928, 493, '', makeTextStyle(7, '#a9b1ae', 'right')).setOrigin(1, 0),
      event: constrainText(this.add.text(606, 349, '', makeTextStyle(9, '#d7d2c0', 'center')).setOrigin(0.5, 0), 590),
      evidence: this.add.text(920, 58, '', makeTextStyle(7, '#697475', 'right')).setOrigin(1, 0),
      metrics: constrainText(this.add.text(30, 470, '', makeTextStyle(7, '#5c5548')), 202, 3),
    }
    this.operationsLayer.add(Object.values(this.readouts))
  }

  private createActionButtons(): void {
    this.verifyButtonSurface = this.add.rectangle(838, 448, 184, 42, 0x263228)
      .setStrokeStyle(1, 0x70895a)
      .setInteractive({ useHandCursor: true })
    const verifyLabel = this.add.text(838, 448, 'VERIFY  [ENTER]', makeTextStyle(9, '#b8d35c', 'center'))
      .setOrigin(0.5)
    this.verifyButton = this.add.container(0, 0, [this.verifyButtonSurface, verifyLabel])
    this.verifyButtonSurface.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.mode === 'play') this.verifyCurrentProcedure()
    })

    this.advanceButtonSurface = this.add.rectangle(838, 448, 184, 42, 0x1d2b32)
      .setStrokeStyle(1, 0x416d7d)
      .setInteractive({ useHandCursor: true })
    this.advanceButtonLabel = this.add.text(838, 448, '', makeTextStyle(8, '#70c5d5', 'center'))
      .setOrigin(0.5)
    this.advanceButton = this.add.container(0, 0, [this.advanceButtonSurface, this.advanceButtonLabel])
    this.advanceButtonSurface.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.mode === 'play') this.startTimeAdvance(this.game.loop.time)
    })
    this.operationsLayer.add([this.verifyButton, this.advanceButton])
  }

  private createIntroduction(): void {
    this.introPadImage = this.add.image(0, 0, PAD_ART_KEY).setOrigin(0).setScale(3)
    this.introLayer.add(this.introPadImage)
    this.introGraphics = this.add.graphics()
    this.introLayer.add(this.introGraphics)
    this.introReadouts = {
      chapter: this.add.text(48, 34, '', makeTextStyle(10, '#d4ab52')),
      clock: this.add.text(912, 34, '', makeTextStyle(11, '#cbd59c', 'right')).setOrigin(1, 0),
      title: constrainText(this.add.text(48, 70, '', makeTextStyle(24, '#f0ead7')), 560, 2),
      subtitle: constrainText(this.add.text(50, 133, '', makeTextStyle(10, '#aab2ad')), 520, 2),
      caption: constrainText(this.add.text(50, 412, '', makeTextStyle(11, '#e7dfc8')), 590, 2),
      prompt: constrainText(this.add.text(50, 465, '', makeTextStyle(8, '#78827f')), 560, 2),
      artLabel1: this.add.text(0, 0, '', makeTextStyle(8, '#d9e4e0', 'center')).setOrigin(0.5),
      artLabel2: this.add.text(0, 0, '', makeTextStyle(8, '#d9e4e0', 'center')).setOrigin(0.5),
      artLabel3: this.add.text(0, 0, '', makeTextStyle(8, '#d9e4e0', 'center')).setOrigin(0.5),
      button: this.add.text(806, 468, '', makeTextStyle(9, '#d9e5bd', 'center')).setOrigin(0.5),
    }
    this.introLayer.add(Object.values(this.introReadouts))

    this.introButtonSurface = this.add.rectangle(806, 468, 220, 48, 0x243126)
      .setStrokeStyle(2, 0x82965f)
      .setInteractive({ useHandCursor: true })
    this.introButtonSurface.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.mode === 'play') this.advanceIntroduction()
    })
    this.introButton = this.add.container(0, 0, [this.introButtonSurface])
    this.introLayer.addAt(this.introButton, 2)
  }

  private readKeyboardActions(time: number): void {
    const procedure = getCurrentLaunchProcedure(this.state)
    if (procedure && isLaunchProcedureDue(this.state)) {
      const actionKeys = [this.keys.action1, this.keys.action2, this.keys.action3]
      actionKeys.forEach((key, index) => {
        const control = procedure.controls[index]
        if (control && Phaser.Input.Keyboard.JustDown(key)) this.activateControl(control)
      })
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) this.verifyCurrentProcedure()
    if (Phaser.Input.Keyboard.JustDown(this.keys.advance)) this.startTimeAdvance(time)
  }

  private advanceIntroduction(): void {
    if (this.presentation === 'pad') this.presentation = 'ingress'
    else if (this.presentation === 'ingress') this.presentation = 'cabin'
    else if (this.presentation === 'cabin') this.presentation = 'operations'
    else return
    this.sound.play(UI_TONE_KEY, { volume: 0.18 })
    if (!this.cabinHum.isPlaying) this.cabinHum.play()
    this.updatePresentation()
  }

  private activateControl(control: LaunchControlId): void {
    const before = this.state.activeControls.length
    this.state = activateLaunchControl(this.state, control)
    if (this.state.activeControls.length > before) this.sound.play(RELAY_TONE_KEY, { volume: 0.24 })
  }

  private verifyCurrentProcedure(): void {
    const procedure = getCurrentLaunchProcedure(this.state)
    const accepted = canVerifyLaunchProcedure(this.state)
    this.state = verifyLaunchProcedure(this.state)
    if (accepted && procedure) {
      this.lastCallout = procedure.callout
      this.sound.play(UI_TONE_KEY, { volume: 0.28, rate: 1.25 })
    } else if (this.state.status !== 'complete' && this.state.status !== 'scrubbed') {
      this.lastCallout = 'CHECK INCOMPLETE · VERIFY EVERY INDICATION'
    }
  }

  private startTimeAdvance(time: number): void {
    if (
      this.presentation !== 'operations'
      || this.state.status !== 'prelaunch'
      || isLaunchProcedureDue(this.state)
    ) return
    this.transitionStartedAt = time
    this.presentation = 'transition'
    this.sound.play(ADVANCE_TONE_KEY, { volume: 0.25 })
  }

  private finishTimeAdvance(): void {
    this.presentation = 'operations'
    this.controlSignature = ''
    this.lastCallout = 'CREW PROCEDURE DUE'
    this.sound.play(UI_TONE_KEY, { volume: 0.22, rate: 1.1 })
  }

  private resetAttempt(): void {
    this.rumble.stop()
    this.cabinHum.stop()
    this.cameras.main.setScroll(0, 0)
    this.resetState()
  }

  private updatePresentation(): void {
    const showIntroduction = this.presentation !== 'operations'
    this.introLayer.setVisible(showIntroduction)
    this.operationsLayer.setVisible(!showIntroduction)
    if (this.introButtonSurface.input) {
      this.introButtonSurface.input.enabled = showIntroduction
        && this.presentation !== 'transition'
        && this.mode === 'play'
    }

    if (showIntroduction) {
      this.advanceButtonSurface.disableInteractive()
      this.verifyButtonSurface.disableInteractive()
      this.drawIntroduction()
      this.drawOverlays()
      this.updateVibration()
      return
    }

    const procedure = getCurrentLaunchProcedure(this.state)
    const due = isLaunchProcedureDue(this.state)
    const station = procedure?.station ?? 'armstrong-left'
    const canAdvance = this.state.status === 'prelaunch' && !due
    const canVerify = procedure !== null && due

    this.readouts.clock.setText(formatLaunchClock(this.state.clockSeconds))
    this.readouts.rate.setText(this.state.timeRate > 1
      ? `${this.state.timeRate}×`
      : this.state.timeRate === 1
        ? '1× REAL TIME'
        : 'COUNT HOLD')
    this.readouts.station.setText(STATION_LABELS[station])
    this.readouts.stationDetail.setText(station === 'collins-right'
      ? 'RIGHT STATION · ROTATION HAND CONTROLLER #2'
      : station === 'armstrong-left'
        ? 'LEFT WINDOW · LAUNCH VEHICLE INDICATIONS'
        : 'SHARED BOOST-CONFIGURATION WORK AREA')
    this.readouts.event.setText(due ? this.lastCallout : getLaunchEventCallout(this.state))
    this.readouts.metrics.setText([
      `COMPLETE  ${String(this.state.completedProcedures.length).padStart(2, '0')} / ${LAUNCH_PROCEDURES.length}`,
      `ERRORS    ${String(this.state.mistakes).padStart(2, '0')}`,
      this.state.clockSeconds >= AUTOMATIC_SEQUENCE_SECONDS ? 'TERMINAL  1×' : 'CREW / PAD LOOP',
    ])

    if (this.state.status === 'complete') {
      this.readouts.checklistCode.setText('CHAPTER 01 / COMPLETE')
      this.readouts.checklistTitle.setText('TOWER CLEAR')
      this.readouts.checklistCommand.setText('LAUNCH CONTROL HANDS THE FLIGHT TO HOUSTON.')
      this.readouts.checklistProgress.setText('[X] COLUMBIA CONFIGURED\n[X] LIFTOFF VERIFIED\n[X] TOWER CLEAR')
      this.readouts.objective.setText('APOLLO 11 IS IN FLIGHT')
      this.readouts.procedure.setText('CHAPTER COMPLETE')
      this.readouts.acceptance.setText('HOUSTON HAS THE FLIGHT')
      this.readouts.hint.setText('R  REPLAY')
      this.readouts.evidence.setText('FLOWN')
    } else if (this.state.status === 'scrubbed') {
      this.readouts.checklistCode.setText('LAUNCH / SCRUB')
      this.readouts.checklistTitle.setText('SEQUENCE CUTOFF')
      this.readouts.checklistCommand.setText('FINAL CONFIGURATION WAS NOT VERIFIED BEFORE IGNITION.')
      this.readouts.checklistProgress.setText('THE POST-IGNITION CONSEQUENCE IS A SCRUB.')
      this.readouts.objective.setText('PRESERVE THE CREW')
      this.readouts.procedure.setText('LAUNCH ATTEMPT ENDED')
      this.readouts.acceptance.setText('NO LIFTOFF')
      this.readouts.hint.setText('R  RESET')
      this.readouts.evidence.setText('PLAN / RULE')
    } else if (procedure) {
      const index = this.state.procedureIndex + 1
      this.readouts.checklistCode.setText(`L / ${String(index).padStart(2, '0')}   ${formatLaunchClock(procedure.dueSeconds)}`)
      this.readouts.checklistTitle.setText(procedure.title)
      this.readouts.checklistCommand.setText(procedure.command)
      this.readouts.checklistProgress.setText(procedure.controls.map((control) => {
        const spec = CONTROL_SPECS[control]
        return `${this.state.activeControls.includes(control) ? '[X]' : '[ ]'} ${spec.label}\n    ${spec.target}`
      }))
      this.readouts.objective.setText('PREPARE COLUMBIA FOR LAUNCH')
      this.readouts.procedure.setText(due ? procedure.title : `NEXT · ${procedure.title}`)
      this.readouts.acceptance.setText(procedure.acceptance)
      this.readouts.hint.setText(due
        ? canVerifyLaunchProcedure(this.state)
          ? 'ENTER  VERIFY'
          : '1–3 / CLICK'
        : this.state.status === 'prelaunch'
          ? 'SPACE  ADVANCE'
          : 'MONITOR')
      this.readouts.evidence.setText(procedure.evidenceClass.toUpperCase())
    }

    this.verifyButton.setVisible(canVerify)
    if (canVerify) {
      const accepted = canVerifyLaunchProcedure(this.state)
      this.verifyButtonSurface.setFillStyle(accepted ? 0x263a24 : 0x2a2d29)
      this.verifyButtonSurface.setStrokeStyle(1, accepted ? 0xb8d35c : 0x60655d)
      if (this.mode === 'play') this.verifyButtonSurface.setInteractive({ useHandCursor: true })
      else this.verifyButtonSurface.disableInteractive()
    } else {
      this.verifyButtonSurface.disableInteractive()
    }

    this.advanceButton.setVisible(canAdvance)
    if (canAdvance && procedure) {
      this.advanceButtonLabel.setText(`ADVANCE TO\n${formatLaunchClock(procedure.dueSeconds)}  [SPACE]`)
      if (this.mode === 'play') this.advanceButtonSurface.setInteractive({ useHandCursor: true })
      else this.advanceButtonSurface.disableInteractive()
    } else {
      this.advanceButtonSurface.disableInteractive()
    }

    this.drawStation(station)
    this.syncControlButtons(procedure?.controls ?? [], due)
    this.drawOverlays()
    this.updateVibration()
  }

  private drawIntroduction(): void {
    const graphics = this.introGraphics
    graphics.clear()
    this.introPadImage.setVisible(false)
    this.hideArtLabels()
    this.introReadouts.clock.setText(formatLaunchClock(this.state.clockSeconds))
    this.introButton.setVisible(this.presentation !== 'transition')
    this.introReadouts.button.setVisible(this.presentation !== 'transition')

    if (this.presentation === 'pad') {
      this.drawPad39A(graphics, false)
      this.setIntroCopy(
        'NASA · KENNEDY SPACE CENTER',
        'APOLLO 11',
        'LAUNCH COMPLEX 39A · 16 JULY 1969',
        'SATURN V AS-506 IS WAITING WITH COLUMBIA AND EAGLE.',
        'MISSION: LAND ON THE MOON AND RETURN THE CREW SAFELY TO EARTH.',
        'APPROACH SPACECRAFT',
      )
      this.placeArtLabel(this.introReadouts.artLabel1, 765, 422, '39A', '#f0ead7')
      this.placeArtLabel(this.introReadouts.artLabel2, 113, 351, 'NASA', '#e9f4f7')
    } else if (this.presentation === 'ingress') {
      this.drawWhiteRoom(graphics)
      this.setIntroCopy(
        'PAD 39A · CREW ACCESS ARM',
        'FIRST INTO COLUMBIA',
        '06:54 EDT · NEIL ARMSTRONG · COMMANDER',
        'THE SPACECRAFT HATCH IS OPEN WHILE THE PAD TEAM CONTINUES THE COUNTDOWN.',
        'BOARD CSM-107 AND TAKE THE LEFT COUCH.',
        'ENTER COLUMBIA',
      )
      this.placeArtLabel(this.introReadouts.artLabel1, 601, 232, 'NASA', '#d9e4e0')
      this.placeArtLabel(this.introReadouts.artLabel2, 818, 126, 'CSM-107', '#7b8785')
    } else if (this.presentation === 'cabin') {
      this.drawCrewCabin(graphics)
      this.setIntroCopy(
        'COLUMBIA · FORWARD COMPARTMENT',
        'THE CREW IS ABOARD',
        'ARMSTRONG · ALDRIN · COLLINS',
        'AT THE RIGHT COUCH, COLLINS FINDS RHC #2 FOUL OF THE SHOCK-STRUT RELEASE.',
        'FIRST TASK: RECOGNIZE THE CONDITION, COORDINATE SUPPORT, VERIFY THE RE-LOCK.',
        'INSPECT RIGHT COUCH',
      )
      this.placeArtLabel(this.introReadouts.artLabel1, 323, 340, 'ARMSTRONG', '#c9d5d0')
      this.placeArtLabel(this.introReadouts.artLabel2, 495, 322, 'ALDRIN', '#c9d5d0')
      this.placeArtLabel(this.introReadouts.artLabel3, 665, 340, 'COLLINS', '#d4ab52')
    } else {
      this.drawPad39A(graphics, true)
      const procedure = getCurrentLaunchProcedure(this.state)
      this.setIntroCopy(
        'APOLLO 11 · COUNTDOWN CONTINUES',
        formatLaunchClock(this.state.clockSeconds),
        'COLUMBIA SECURE · PAD AND SPACECRAFT TEAMS AT WORK',
        procedure ? `NEXT CREW PROCEDURE: ${procedure.title}` : 'TERMINAL COUNT APPROACHING',
        'THE CLOCK IS ADVANCING TO THE NEXT UNSOLVED CREW RESPONSIBILITY.',
        '',
      )
      this.placeArtLabel(this.introReadouts.artLabel1, 765, 422, '39A', '#f0ead7')
    }
  }

  private setIntroCopy(
    chapter: string,
    title: string,
    subtitle: string,
    caption: string,
    prompt: string,
    button: string,
  ): void {
    this.introReadouts.chapter.setText(chapter)
    this.introReadouts.title.setText(title)
    this.introReadouts.subtitle.setText(subtitle)
    this.introReadouts.caption.setText(caption)
    this.introReadouts.prompt.setText(prompt)
    this.introReadouts.button.setText(button)
  }

  private hideArtLabels(): void {
    this.introReadouts.artLabel1.setVisible(false)
    this.introReadouts.artLabel2.setVisible(false)
    this.introReadouts.artLabel3.setVisible(false)
  }

  private placeArtLabel(
    label: Phaser.GameObjects.Text,
    x: number,
    y: number,
    value: string,
    color: string,
  ): void {
    label.setPosition(x, y).setText(value).setColor(color).setVisible(true)
  }

  private drawPad39A(graphics: Phaser.GameObjects.Graphics, passage: boolean): void {
    if (!this.textures.exists(PAD_ART_KEY)) {
      this.drawPad39AFallback(graphics, passage)
      return
    }

    const elapsed = this.time.now
    const drift = Math.min(1, elapsed / 10_000)
    const scale = 3.06 - drift * 0.04
    this.introPadImage
      .setVisible(true)
      .setScale(scale)
      .setPosition(
        Math.round((WIDTH - 320 * scale) / 2),
        Math.round((HEIGHT - 180 * scale) / 2),
      )

    // Deterministic pixel vapor and tower lamps keep the generated plate alive without changing
    // its historical geometry or asking Phaser to synthesize a second environment.
    const vaporTime = elapsed / 1_100
    for (let index = 0; index < 9; index += 1) {
      const phase = (vaporTime + index * 0.19) % 1
      const size = 3 + Math.floor(phase * 8)
      const x = 657 + Math.floor(phase * 34) + (index % 2) * 4
      const y = 292 - Math.floor(phase * 42) - index * 2
      graphics.fillStyle(index % 2 === 0 ? 0xe7e4d7 : 0xa9b8ba, (1 - phase) * 0.54)
      graphics.fillRect(x, y, size * 2, size)
    }
    if (Math.floor(elapsed / 540) % 2 === 0) {
      graphics.fillStyle(0xd26b43, 0.9).fillRect(784, 249, 5, 5)
      graphics.fillStyle(0xf0c46c, 0.45).fillRect(782, 247, 9, 9)
    }

    if (passage) {
      graphics.fillStyle(0x05080b, 0.4).fillRect(0, 0, WIDTH, HEIGHT)
      const sweep = Math.floor((this.state.clockSeconds - INITIAL_LAUNCH_STATE.clockSeconds) / 60) % WIDTH
      graphics.fillStyle(0xd7aa6f, 0.12).fillRect(sweep, 170, 6, 180)
    }
    graphics.fillStyle(0x05080b, 0.74).fillRect(0, 0, WIDTH, 168)
    graphics.fillStyle(0x05080b, 0.82).fillRect(0, 398, WIDTH, 142)
  }

  private drawPad39AFallback(graphics: Phaser.GameObjects.Graphics, passage: boolean): void {
    graphics.fillStyle(0x07101d).fillRect(0, 0, WIDTH, HEIGHT)
    graphics.fillStyle(0x10273b).fillRect(0, 170, WIDTH, 180)
    graphics.fillStyle(0x24475a).fillRect(0, 270, WIDTH, 80)
    graphics.fillStyle(0xc47b4c).fillRect(0, 324, WIDTH, 26)
    graphics.fillStyle(0xd7aa6f).fillRect(0, 344, WIDTH, 9)
    graphics.fillStyle(0x15211f).fillRect(0, 353, WIDTH, 187)

    for (let index = 0; index < 34; index += 1) {
      const x = (index * 83 + 31) % WIDTH
      const y = 166 + ((index * 37) % 145)
      graphics.fillStyle(index % 3 === 0 ? 0x6e7f85 : 0x405b67).fillRect(x, y, 3, 3)
    }

    // Saturn V: launch escape system, spacecraft and three stages.
    graphics.fillStyle(0xd8d6c9).fillTriangle(607, 92, 653, 92, 630, 49)
    graphics.fillStyle(0xc6c7bf).fillRect(625, 34, 10, 18)
    graphics.fillStyle(0x202326).fillRect(628, 14, 4, 22)
    graphics.fillStyle(0xe6e3d5).fillRect(604, 92, 52, 294)
    graphics.fillStyle(0x161a1d).fillRect(604, 116, 52, 19)
    graphics.fillStyle(0x202326).fillRect(604, 226, 52, 25)
    graphics.fillStyle(0x202326).fillRect(604, 337, 52, 16)
    graphics.fillStyle(0xe6e3d5).fillRect(596, 376, 68, 20)
    graphics.fillStyle(0x161a1d).fillRect(596, 382, 68, 8)
    graphics.fillStyle(0xbec1bc).fillRect(610, 137, 5, 88)
    graphics.fillStyle(0x777e7c).fillRect(648, 137, 5, 88)

    // Mobile launcher and red service structure.
    graphics.fillStyle(0x4d5553).fillRect(558, 396, 260, 22)
    graphics.fillStyle(0x242c2c).fillRect(540, 418, 300, 16)
    graphics.fillStyle(0x67362e).fillRect(700, 78, 18, 318)
    graphics.fillStyle(0x8b4739).fillRect(792, 112, 13, 284)
    graphics.lineStyle(5, 0x824136)
    for (let floor = 0; floor < 8; floor += 1) {
      const y = 104 + floor * 39
      graphics.lineBetween(700, y, 805, y)
      graphics.lineBetween(700, y, 805, y + 39)
      graphics.lineBetween(805, y, 700, y + 39)
    }
    graphics.lineStyle(8, 0x6a3831).lineBetween(706, 151, 655, 151)
    graphics.lineStyle(4, 0xc7a65f).lineBetween(704, 151, 655, 151)
    graphics.fillStyle(0x29302f).fillRect(752, 388, 36, 39)

    // Foreground transfer van and three crew figures establish human scale.
    graphics.fillStyle(0x172021).fillRect(58, 366, 164, 52)
    graphics.fillStyle(0xd9ddd7).fillRect(72, 350, 116, 26)
    graphics.fillStyle(0x5e777e).fillRect(83, 356, 73, 16)
    graphics.fillStyle(0x1c2324).fillRect(68, 411, 32, 13)
    graphics.fillStyle(0x1c2324).fillRect(178, 411, 32, 13)
    graphics.fillStyle(0x315b78).fillRect(104, 380, 45, 18)
    for (let crew = 0; crew < 3; crew += 1) {
      const x = 270 + crew * 32
      graphics.fillStyle(0xebe9dc).fillRect(x, 371 - crew * 3, 18, 28)
      graphics.fillStyle(0xd2d4cd).fillRect(x + 3, 361 - crew * 3, 12, 12)
      graphics.fillStyle(0x29302f).fillRect(x + 1, 399 - crew * 3, 6, 18)
      graphics.fillStyle(0x29302f).fillRect(x + 11, 399 - crew * 3, 6, 18)
    }

    graphics.fillStyle(0x27302d).fillRect(715, 416, 100, 54)
    graphics.lineStyle(3, 0x6e746d).strokeRect(723, 424, 84, 38)

    if (passage) {
      graphics.fillStyle(0x05080b, 0.36).fillRect(0, 0, WIDTH, HEIGHT)
      const sweep = Math.floor((this.state.clockSeconds - INITIAL_LAUNCH_STATE.clockSeconds) / 60) % WIDTH
      graphics.fillStyle(0xd7aa6f, 0.18).fillRect(sweep, 170, 6, 180)
    }

    graphics.fillStyle(0x05080b, 0.74).fillRect(0, 0, WIDTH, 168)
    graphics.fillStyle(0x05080b, 0.82).fillRect(0, 398, WIDTH, 142)
  }

  private drawWhiteRoom(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x080d11).fillRect(0, 0, WIDTH, HEIGHT)
    graphics.fillStyle(0xb7b3a6).fillRect(440, 155, 520, 246)
    graphics.fillStyle(0x747a77).fillRect(455, 171, 505, 18)
    graphics.fillStyle(0x343b3b).fillRect(716, 193, 244, 192)
    graphics.fillStyle(0x111819).fillRect(752, 213, 208, 150)
    graphics.lineStyle(9, 0x8d918b).strokeRect(730, 198, 230, 180)
    graphics.lineStyle(3, 0xd0cbbd).strokeRect(746, 210, 214, 156)
    graphics.fillStyle(0x4d5553).fillRect(0, 369, WIDTH, 171)
    graphics.fillStyle(0x242b2c).fillRect(0, 392, WIDTH, 18)

    // White-room technician keeps the player grounded in the pad operation.
    graphics.fillStyle(0xe2dfd3).fillRect(286, 225, 74, 138)
    graphics.fillStyle(0xbec2bd).fillRect(299, 190, 50, 45)
    graphics.fillStyle(0x454d4d).fillRect(306, 201, 36, 12)
    graphics.fillStyle(0xe2dfd3).fillRect(266, 247, 27, 95)
    graphics.fillStyle(0xe2dfd3).fillRect(357, 247, 26, 95)
    graphics.fillStyle(0x242b2c).fillRect(293, 359, 25, 44)
    graphics.fillStyle(0x242b2c).fillRect(332, 359, 25, 44)

    // Armstrong in the launch pressure suit, at the open hatch.
    graphics.fillStyle(0xece9dc).fillRect(542, 222, 100, 146)
    graphics.fillStyle(0xd3d3ca).fillRect(558, 174, 69, 61)
    graphics.fillStyle(0x263a43).fillRect(570, 188, 47, 25)
    graphics.fillStyle(0xf0eee2).fillRect(516, 238, 34, 112)
    graphics.fillStyle(0xf0eee2).fillRect(636, 238, 34, 106)
    graphics.fillStyle(0x252c2d).fillRect(552, 362, 36, 48)
    graphics.fillStyle(0x252c2d).fillRect(606, 362, 36, 48)
    graphics.fillStyle(0x275b7a).fillRect(582, 252, 26, 18)
    graphics.fillStyle(0xb9493f).fillRect(617, 248, 18, 12)
    graphics.lineStyle(5, 0xc17d46).lineBetween(525, 297, 460, 340)
    graphics.fillStyle(0x05080b, 0.76).fillRect(0, 0, WIDTH, 168)
    graphics.fillStyle(0x05080b, 0.84).fillRect(0, 398, WIDTH, 142)
  }

  private drawCrewCabin(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x05080b).fillRect(0, 0, WIDTH, HEIGHT)
    graphics.fillStyle(0x252c2d).fillTriangle(105, 170, 855, 170, 480, 410)
    graphics.lineStyle(10, 0x555c5b).lineBetween(102, 164, 858, 164)
    graphics.lineStyle(8, 0x4a5150).lineBetween(112, 171, 258, 390)
    graphics.lineStyle(8, 0x4a5150).lineBetween(848, 171, 700, 390)

    graphics.fillStyle(0x0d1214).fillRect(350, 182, 260, 126)
    graphics.lineStyle(4, 0x656b68).strokeRect(350, 182, 260, 126)
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const x = 368 + column * 33
        const y = 198 + row * 31
        graphics.fillStyle(0x020405).fillRect(x, y, 22, 19)
        graphics.fillStyle((row + column) % 4 === 0 ? 0xc9ad54 : 0x596b5a).fillRect(x + 4, y + 13, 8, 3)
      }
    }

    this.drawCabinCrew(graphics, 275, 254, false)
    this.drawCabinCrew(graphics, 446, 235, false)
    this.drawCabinCrew(graphics, 618, 254, true)

    graphics.fillStyle(0x733f2f).fillRect(713, 270, 22, 62)
    graphics.lineStyle(4, 0xd4ab52).strokeRect(705, 262, 38, 78)
    graphics.fillStyle(0x05080b, 0.74).fillRect(0, 0, WIDTH, 168)
    graphics.fillStyle(0x05080b, 0.86).fillRect(0, 398, WIDTH, 142)
  }

  private drawCabinCrew(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    highlighted: boolean,
  ): void {
    graphics.fillStyle(0x14191a).fillRect(x - 42, y - 18, 84, 146)
    graphics.fillStyle(0xdeddd4).fillRect(x - 31, y + 32, 62, 79)
    graphics.fillStyle(0xc9cac4).fillRect(x - 25, y - 10, 50, 49)
    graphics.fillStyle(0x26383d).fillRect(x - 18, y + 2, 36, 18)
    graphics.fillStyle(0x536561).fillRect(x - 24, y + 52, 48, 8)
    graphics.fillStyle(0x275b7a).fillRect(x - 18, y + 69, 16, 11)
    if (highlighted) graphics.lineStyle(3, 0xd4ab52).strokeRect(x - 47, y - 23, 94, 158)
  }

  private drawStation(station: LaunchStation): void {
    const graphics = this.stationGraphics
    graphics.clear()
    this.windowEffectGraphics.clear()
    this.windowExteriorImage.setVisible(false)
    graphics.fillStyle(0x151a1b).fillRect(272, 52, 668, 318)
    graphics.fillStyle(0x222728).fillRect(280, 88, 652, 258)

    if (station === 'collins-right') this.drawCollinsStation(graphics)
    else if (station === 'armstrong-left') this.drawArmstrongStation(graphics)
    else this.drawForwardPanel(graphics)
  }

  private drawCollinsStation(graphics: Phaser.GameObjects.Graphics): void {
    this.drawWindow(graphics, 638, 99, 258, 100)
    graphics.fillStyle(0x303536).fillRect(320, 104, 224, 194)
    graphics.lineStyle(5, 0x555958).lineBetween(348, 294, 512, 112)
    graphics.lineStyle(2, 0x111516).lineBetween(350, 294, 514, 112)
    graphics.fillStyle(0x15191a).fillRect(374, 132, 54, 94)
    graphics.fillStyle(0x6b5439).fillRect(390, 148, 22, 66)
    graphics.lineStyle(2, 0xd4ab52).strokeRect(368, 126, 66, 106)
    graphics.fillStyle(0xd9d7cd).fillRect(507, 249, 78, 74)
    graphics.fillStyle(0x26383d).fillRect(520, 257, 48, 21)
    graphics.fillStyle(0x1a1f20).fillRect(294, 320, 616, 22)
  }

  private drawForwardPanel(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x101415).fillRect(300, 96, 610, 140)
    graphics.lineStyle(2, 0x4c5351).strokeRect(300, 96, 610, 140)
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = 318 + column * 71
        const y = 113 + row * 52
        graphics.fillStyle(0x070a0b).fillRect(x, y, 48, 34)
        graphics.fillStyle((column + row) % 3 === 0 ? 0xb8d35c : 0x6c735f).fillRect(x + 7, y + 24, 10, 2)
        graphics.fillStyle(0x333837).fillRect(x + 27, y + 8, 7, 16)
      }
    }
    graphics.fillStyle(0x171c1e).fillTriangle(300, 246, 910, 246, 824, 342)
    graphics.fillStyle(0xd8d5cb).fillRect(306, 290, 66, 39)
    graphics.fillStyle(0xd8d5cb).fillRect(838, 290, 66, 39)
    graphics.fillStyle(0x25383c).fillRect(318, 298, 40, 15)
    graphics.fillStyle(0x25383c).fillRect(850, 298, 40, 15)
  }

  private drawArmstrongStation(graphics: Phaser.GameObjects.Graphics): void {
    const { x: windowX, y: windowY, width: windowWidth, height: windowHeight } = ARMSTRONG_WINDOW
    this.updateArmstrongWindowView()
    graphics.fillStyle(0x080b0c).fillRect(windowX - 10, windowY - 10, windowWidth + 20, 10)
    graphics.fillStyle(0x080b0c).fillRect(windowX - 10, windowY + windowHeight, windowWidth + 20, 10)
    graphics.fillStyle(0x080b0c).fillRect(windowX - 10, windowY, 10, windowHeight)
    graphics.fillStyle(0x080b0c).fillRect(windowX + windowWidth, windowY, 10, windowHeight)
    graphics.lineStyle(5, 0x626d6c).strokeRect(windowX - 6, windowY - 6, windowWidth + 12, windowHeight + 12)
    graphics.lineStyle(2, 0xa2aaa5).strokeRect(windowX, windowY, windowWidth, windowHeight)
    graphics.fillStyle(0x101415).fillRect(774, 96, 142, 174)
    graphics.lineStyle(2, 0x4c5351).strokeRect(774, 96, 142, 174)
    graphics.fillStyle(0x050708).fillRect(790, 112, 110, 48)
    for (let engine = 0; engine < 5; engine += 1) {
      graphics.fillStyle(this.state.clockSeconds >= ALL_ENGINES_RUNNING_SECONDS ? 0x171b1b : 0xd4ab52)
        .fillRect(798 + engine * 20, 128, 12, 8)
    }
    graphics.fillStyle(0x050708).fillRect(790, 176, 50, 58)
    graphics.fillStyle(0x050708).fillRect(850, 176, 50, 58)
    graphics.fillStyle(this.state.clockSeconds >= 0 ? 0xb8d35c : 0x52584c).fillRect(800, 201, 30, 7)
    graphics.fillStyle(this.state.clockSeconds >= 0 ? 0xb8d35c : 0x52584c).fillRect(860, 201, 30, 7)
    graphics.fillStyle(0x171c1e).fillTriangle(294, 286, 916, 286, 830, 342)
  }

  private updateArmstrongWindowView(): void {
    const pose = getArmstrongWindowPose(this.state.clockSeconds)
    const opticalShake = this.state.clockSeconds >= IGNITION_SEQUENCE_SECONDS
      ? Math.sin(this.state.clockSeconds * 41) * (this.state.clockSeconds >= 0 ? 3 : 1)
      : 0
    this.windowExteriorImage
      .setVisible(true)
      .setScale(pose.scale)
      .setPosition(
        Math.round(pose.x + opticalShake),
        Math.round(pose.y + opticalShake * 0.5),
      )

    const ambientTime = this.time.now / 900
    for (let index = 0; index < 6; index += 1) {
      const phase = (ambientTime + index * 0.21) % 1
      const size = 3 + Math.floor(phase * 5)
      this.windowEffectGraphics.fillStyle(index % 2 === 0 ? 0xffffff : 0xcbd5d4, (1 - phase) * 0.32)
      this.windowEffectGraphics.fillRect(
        690 - Math.floor(phase * 38) + index * 2,
        201 - Math.floor(phase * 30),
        size * 2,
        size,
      )
    }
    if (Math.floor(this.time.now / 480) % 2 === 0) {
      this.windowEffectGraphics.fillStyle(0xf07b45, 0.85).fillRect(711, 140, 4, 4)
    }

    if (pose.ignitionLight > 0) {
      const flicker = 0.12 + (Math.sin(this.state.clockSeconds * 47) + 1) * 0.05
      this.windowEffectGraphics.fillStyle(0xe99a4a, flicker * (0.4 + pose.ignitionLight * 0.6))
      this.windowEffectGraphics.fillRect(
        ARMSTRONG_WINDOW.x,
        ARMSTRONG_WINDOW.y + ARMSTRONG_WINDOW.height - 31,
        ARMSTRONG_WINDOW.width,
        31,
      )
      for (let index = 0; index < 11; index += 1) {
        const phase = (this.state.clockSeconds * 1.7 + index * 0.23) % 1
        const x = ARMSTRONG_WINDOW.x + 6 + ((index * 43) % (ARMSTRONG_WINDOW.width - 20))
        const y = ARMSTRONG_WINDOW.y + ARMSTRONG_WINDOW.height - 6
          - Math.abs(phase) * (20 + index % 3 * 5)
        this.windowEffectGraphics.fillStyle(index % 2 === 0 ? 0xf3d5a0 : 0xb7b7ad, 0.28)
        this.windowEffectGraphics.fillRect(x, y, 8 + index % 3 * 4, 4 + index % 2 * 3)
      }
    }
  }

  private drawWindow(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const sky = this.state.clockSeconds < -3_600 ? 0x59676d : 0x859195
    graphics.fillStyle(0x080b0c).fillRect(x - 8, y - 8, width + 16, height + 16)
    graphics.fillStyle(sky).fillRect(x, y, width, height)

    const launchRise = this.state.clockSeconds <= 0
      ? 0
      : Phaser.Math.Clamp(this.state.clockSeconds / 12, 0, 1) * 132
    const towerX = x + Math.floor(width * 0.72)
    const towerTop = y + 12 + launchRise
    graphics.fillStyle(0x33393a).fillRect(towerX, towerTop, 18, height + 40)
    graphics.lineStyle(2, 0x272c2d)
    for (let rung = 0; rung < 7; rung += 1) {
      const rungY = towerTop + 12 + rung * 18
      graphics.lineBetween(towerX - 18, rungY, towerX + 38, rungY)
      graphics.lineBetween(towerX - 18, rungY, towerX + 38, rungY + 18)
    }
    if (this.state.clockSeconds < -300) {
      graphics.fillStyle(0x454b4b).fillRect(towerX - 72, towerTop + 38, 78, 8)
    }
    graphics.fillStyle(0x777c79).fillRect(x, y + height - 12, width, 12)
    graphics.lineStyle(3, 0x5a6261).strokeRect(x, y, width, height)
  }

  private syncControlButtons(controls: readonly LaunchControlId[], due: boolean): void {
    const signature = `${due}:${controls.join(',')}:${this.state.activeControls.join(',')}:${this.mode}`
    if (signature === this.controlSignature) return
    this.controlSignature = signature
    this.controlLayer.removeAll(true)
    if (!due || this.state.status === 'complete' || this.state.status === 'scrubbed') return

    const width = 174
    const gap = 18
    const total = controls.length * width + Math.max(0, controls.length - 1) * gap
    const startX = 606 - total / 2 + width / 2
    controls.forEach((control, index) => {
      const spec = CONTROL_SPECS[control]
      const selected = this.state.activeControls.includes(control)
      const x = Math.round(startX + index * (width + gap))
      const y = 296
      const surface = this.add.rectangle(x, y, width, 70, selected ? 0x263a24 : 0x171c1d)
        .setStrokeStyle(2, selected ? 0xb8d35c : 0x596362)
      const number = this.add.text(x - 75, y - 27, String(index + 1), makeTextStyle(8, selected ? '#b8d35c' : '#d4ab52'))
      const kind = this.add.text(x + 74, y - 27, spec.kind, makeTextStyle(7, '#727d7b', 'right')).setOrigin(1, 0)
      const label = constrainText(this.add.text(x, y - 8, spec.label, makeTextStyle(9, selected ? '#d9e5bd' : '#d7d2c0', 'center')).setOrigin(0.5), 154)
      const target = constrainText(this.add.text(x, y + 15, selected ? 'CONFIRMED' : spec.target, makeTextStyle(7, selected ? '#b8d35c' : '#8d9996', 'center')).setOrigin(0.5), 154)
      if (this.mode === 'play') {
        surface.setInteractive({ useHandCursor: true })
        surface.on(Phaser.Input.Events.POINTER_DOWN, () => this.activateControl(control))
        surface.on(Phaser.Input.Events.POINTER_OVER, () => {
          if (!selected) surface.setStrokeStyle(2, 0xd4ab52)
        })
        surface.on(Phaser.Input.Events.POINTER_OUT, () => {
          if (!selected) surface.setStrokeStyle(2, 0x596362)
        })
      }
      this.controlLayer.add([surface, number, kind, label, target])
    })
  }

  private syncRumble(): void {
    const shouldRumble = this.state.clockSeconds >= IGNITION_SEQUENCE_SECONDS
      && this.state.clockSeconds < 12
      && this.state.status !== 'scrubbed'
    if (shouldRumble && !this.rumble.isPlaying) this.rumble.play()
    if (!shouldRumble && this.rumble.isPlaying) this.rumble.stop()
  }

  private updateVibration(): void {
    if (
      this.presentation !== 'operations'
      || this.state.clockSeconds < IGNITION_SEQUENCE_SECONDS
      || this.state.clockSeconds >= 12
      || this.state.status === 'scrubbed'
    ) {
      this.cameras.main.setScroll(0, 0)
      return
    }
    const released = this.state.clockSeconds >= 0
    const intensity = released ? 2.4 : 0.8
    const x = Math.round(Math.sin(this.state.clockSeconds * 31) * intensity)
    const y = Math.round(Math.sin(this.state.clockSeconds * 23 + 0.8) * intensity)
    this.cameras.main.setScroll(x, y)
  }

  private drawOverlays(): void {
    this.overlay.clear().setVisible(this.overlays)
    if (!this.overlays) return
    this.overlay.lineStyle(1, 0x5be7ff, 0.8)
    if (this.presentation === 'operations') {
      this.overlay.strokeRect(16, 48, 238, 462)
      this.overlay.strokeRect(268, 48, 676, 326)
      this.overlay.strokeRect(268, 386, 676, 124)
    } else {
      this.overlay.strokeRect(24, 22, 912, 496)
    }
  }

  private reportState(): void {
    const procedure = getCurrentLaunchProcedure(this.state)
    this.report({
      scene: 'launch',
      clockSeconds: this.state.clockSeconds,
      phase: this.state.status,
      station: procedure?.station ?? 'armstrong-left',
      procedure: procedure?.id ?? 'complete',
      objective: procedure?.title ?? 'CHAPTER COMPLETE',
      acceptance: procedure?.acceptance ?? 'HOUSTON HAS THE FLIGHT',
      completedProcedures: this.state.completedProcedures.length,
      totalProcedures: LAUNCH_PROCEDURES.length,
      timeRate: this.state.timeRate,
      mistakes: this.state.mistakes,
      fps: Math.round(this.game.loop.actualFps),
    })
  }

  private setWorkspaceMode(mode: WorkspaceMode): void {
    this.mode = mode
    this.controlSignature = ''
    if (this.introButtonSurface.input) {
      this.introButtonSurface.input.enabled = mode === 'play'
        && this.presentation !== 'transition'
        && this.presentation !== 'operations'
    }
    if (mode !== 'play') {
      this.advanceButtonSurface.disableInteractive()
      this.verifyButtonSurface.disableInteractive()
    }
    this.updatePresentation()
  }

  private setOverlays(value: boolean): void {
    this.overlays = value
    this.overlay.setVisible(value)
  }
}
