import '@babylonjs/loaders/glTF/2.0/glTFLoader.js'
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_emissive_strength.js'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js'
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { Scene } from '@babylonjs/core/scene.js'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'
import {
  createProfessorMotionState,
  PROFESSOR_MOTION_TUNING,
  reconcileProfessorMotion,
  stepProfessorMotion,
  type ProfessorMotionState,
} from './motion.ts'
import { createSubatomicWorld, type PhotonKind } from './SubatomicWorld.ts'

const MODEL_ROOT = '/assets/einstein-diorama/'
const MODEL_FILE = 'einstein-lab.glb'
const SPAWN = { x: 0, z: 0, heading: 0 } as const
const CAMERA_POSITION = new Vector3(7.4, 7.2, 9.4)
const CAMERA_TARGET = new Vector3(0, 1.45, 0)
const ARENA_RADIUS = 7.05
const PARTICLE_COOLDOWN_MS = 130
const WAVE_COOLDOWN_MS = 260

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const smoothstep = (value: number): number => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export function createEinsteinDioramaScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.003, 0.006, 0.025, 1)
  scene.ambientColor = new Color3(0.055, 0.075, 0.16)
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType =
    ImageProcessingConfiguration.TONEMAPPING_ACES
  scene.imageProcessingConfiguration.exposure = 1.42
  scene.imageProcessingConfiguration.contrast = 1.13

  const camera = new ArcRotateCamera(
    'professor-quantum-camera',
    0,
    0,
    12,
    CAMERA_TARGET,
    scene,
  )
  camera.setPosition(CAMERA_POSITION)
  camera.fov = 0.66
  camera.minZ = 0.05
  camera.maxZ = 90
  camera.lowerRadiusLimit = camera.radius
  camera.upperRadiusLimit = camera.radius
  camera.lowerBetaLimit = camera.beta
  camera.upperBetaLimit = camera.beta
  camera.lowerAlphaLimit = camera.alpha
  camera.upperAlphaLimit = camera.alpha
  camera.panningSensibility = 0
  camera.keysUp = []
  camera.keysDown = []
  camera.keysLeft = []
  camera.keysRight = []
  scene.activeCamera = camera

  const ambient = new HemisphericLight('quantum-ambient', new Vector3(0, 1, 0), scene)
  ambient.intensity = 0.9
  ambient.diffuse = new Color3(0.33, 0.52, 0.95)
  ambient.groundColor = new Color3(0.06, 0.025, 0.16)

  const key = new DirectionalLight(
    'quantum-magenta-key',
    new Vector3(0.38, -1, -0.64),
    scene,
  )
  key.position = new Vector3(-5.5, 9.5, 7.5)
  key.intensity = 2.9
  key.diffuse = new Color3(1, 0.28, 0.58)

  const rim = new DirectionalLight(
    'quantum-cyan-rim',
    new Vector3(-0.5, -0.72, 0.54),
    scene,
  )
  rim.position = new Vector3(5, 7.5, -5.5)
  rim.intensity = 2.15
  rim.diffuse = new Color3(0.18, 0.78, 1)

  const shadows = new ShadowGenerator(1024, key)
  shadows.usePercentageCloserFiltering = true
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM
  shadows.bias = 0.0008
  shadows.normalBias = 0.018

  const world = createSubatomicWorld(scene)
  const playerCollider = MeshBuilder.CreateBox(
    'Professor_CollisionBody',
    { width: 0.56, height: 1.7, depth: 0.56 },
    scene,
  )
  playerCollider.position.set(SPAWN.x, 0, SPAWN.z)
  playerCollider.isVisible = false
  playerCollider.isPickable = false

  let mode: WorkspaceMode = 'play'
  let active = false
  let overlays = false
  let disposed = false
  let ready = false
  let importedMeshes: AbstractMesh[] = []
  let idleAnimation: AnimationGroup | undefined
  let walkAnimation: AnimationGroup | undefined
  let motion: ProfessorMotionState = createProfessorMotionState(SPAWN)
  let interaction: string | null = 'loading Einstein into the quantum field'
  let interactionExpiresAt = 0
  let sceneTimeMs = 0
  let aimDirection = new Vector3(0, 0, 1)
  const lastShotAt: Record<PhotonKind, number> = {
    particle: -Infinity,
    wave: -Infinity,
  }

  const syncControls = (): void => {
    camera.detachControl()
    if (active && mode === 'play') context.canvas.focus({ preventScroll: true })
  }

  const syncAnimation = (): void => {
    const normalizedSpeed = clamp01(motion.speed / PROFESSOR_MOTION_TUNING.maxWalkSpeed)
    const walkWeight = smoothstep(normalizedSpeed)
    idleAnimation?.setWeightForAllAnimatables(1 - walkWeight)
    if (walkAnimation !== undefined) {
      walkAnimation.setWeightForAllAnimatables(walkWeight)
      walkAnimation.speedRatio = 0.72 + normalizedSpeed * 0.48
    }
  }

  const showInteraction = (message: string, durationMs = 1_150): void => {
    interaction = message
    interactionExpiresAt = sceneTimeMs + durationMs
  }

  const reset = (): void => {
    motion = createProfessorMotionState(SPAWN)
    playerCollider.position.set(SPAWN.x, 0, SPAWN.z)
    playerCollider.rotation.y = SPAWN.heading
    aimDirection.set(0, 0, 1)
    walkAnimation?.goToFrame(walkAnimation.from)
    syncAnimation()
    showInteraction('Einstein returned to the field origin')
  }

  const pickQuantumFloor = (event: PointerEvent): Vector3 | null => {
    const bounds = context.canvas.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return null
    const renderX = (event.clientX - bounds.left) * context.engine.getRenderWidth() / bounds.width
    const renderY = (event.clientY - bounds.top) * context.engine.getRenderHeight() / bounds.height
    const pick = scene.pick(
      renderX,
      renderY,
      (candidate) => candidate === world.aimingGround,
      false,
      camera,
    )
    return pick?.pickedPoint ?? null
  }

  const updateAim = (event: PointerEvent): void => {
    const point = pickQuantumFloor(event)
    world.setAimPoint(point)
    if (point !== null) {
      const nextAim = point.subtract(playerCollider.position)
      nextAim.y = 0
      if (nextAim.lengthSquared() > 0.04) aimDirection = nextAim.normalize()
    }
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (!active || mode !== 'play') return
    updateAim(event)
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (!active || mode !== 'play' || !ready || (event.button !== 0 && event.button !== 2)) return
    event.preventDefault()
    updateAim(event)
    const kind: PhotonKind = event.button === 2 ? 'particle' : 'wave'
    const cooldown = kind === 'particle' ? PARTICLE_COOLDOWN_MS : WAVE_COOLDOWN_MS
    if (sceneTimeMs - lastShotAt[kind] < cooldown) return
    lastShotAt[kind] = sceneTimeMs
    world.fire(kind, playerCollider.position, aimDirection)
    showInteraction(
      kind === 'particle'
        ? 'particle photon fired · right mouse'
        : 'wave photon fired · left mouse',
    )
  }

  const onPointerLeave = (): void => world.setAimPoint(null)
  const onContextMenu = (event: MouseEvent): void => event.preventDefault()
  context.canvas.addEventListener('pointermove', onPointerMove)
  context.canvas.addEventListener('pointerdown', onPointerDown)
  context.canvas.addEventListener('pointerleave', onPointerLeave)
  context.canvas.addEventListener('contextmenu', onContextMenu)

  void SceneLoader.ImportMeshAsync('', MODEL_ROOT, MODEL_FILE, scene).then((result) => {
    if (disposed) {
      for (const mesh of result.meshes) mesh.dispose()
      return
    }
    importedMeshes = result.meshes
    for (const mesh of importedMeshes) {
      // Older committed assets contained the workshop; the runtime consumes only Einstein.
      if (mesh.name.startsWith('Environment_')) mesh.setEnabled(false)
      mesh.receiveShadows = false
      mesh.showBoundingBox = overlays
      if (mesh.name.startsWith('Character_')) shadows.addShadowCaster(mesh)
    }
    for (const texture of scene.textures) {
      if (texture instanceof Texture) {
        texture.updateSamplingMode(Texture.NEAREST_NEAREST_MIPNEAREST)
      }
    }

    const rig = result.transformNodes.find((node) => node.name === 'Character_Rig')
      ?? result.meshes.find((mesh) => mesh.name === 'Character_Rig')
    idleAnimation = result.animationGroups.find((group) => group.name === 'Idle_Loop')
    walkAnimation = result.animationGroups.find((group) => group.name === 'Walk_Loop')
    if (rig === undefined || idleAnimation === undefined || walkAnimation === undefined) {
      throw new Error('animated professor GLB is missing its rig or locomotion clips')
    }
    rig.parent = playerCollider
    for (const group of result.animationGroups) group.stop()
    idleAnimation.start(true, 1, idleAnimation.from, idleAnimation.to, false)
    walkAnimation.start(true, 1, walkAnimation.from, walkAnimation.to, false)
    walkAnimation.goToFrame(walkAnimation.from)
    syncAnimation()
    ready = true
    interaction = 'WASD/arrows move · left wave · right particle · R resets'
  }).catch((error: unknown) => {
    interaction = error instanceof Error ? error.message : String(error)
  })

  const updateScene = (deltaSeconds: number, timeMs: number): void => {
    sceneTimeMs = timeMs
    world.update(deltaSeconds, timeMs)
    if (!ready || mode !== 'play') return
    if (context.input.consume('KeyR')) reset()

    const horizontal = Number(context.input.isDown('ArrowRight', 'KeyD'))
      - Number(context.input.isDown('ArrowLeft', 'KeyA'))
    const vertical = Number(context.input.isDown('ArrowUp', 'KeyW'))
      - Number(context.input.isDown('ArrowDown', 'KeyS'))
    const cameraForward = camera.target.subtract(camera.position)
    cameraForward.y = 0
    if (cameraForward.lengthSquared() < 0.0001) cameraForward.set(0, 0, -1)
    cameraForward.normalize()
    // Babylon's screen-right direction is Up × Forward for this view. The former
    // Forward × Up order made A and D visibly swap sides.
    const cameraRight = Vector3.Cross(Vector3.Up(), cameraForward).normalize()
    const worldInput = cameraForward.scale(vertical).addInPlace(cameraRight.scale(horizontal))

    let next = stepProfessorMotion(motion, { x: worldInput.x, z: worldInput.z }, deltaSeconds)
    if (next.locomotionStarted) walkAnimation?.goToFrame(walkAnimation.from)
    const requested = new Vector3(next.positionX, 0, next.positionZ)
    const requestedRadius = Math.hypot(requested.x, requested.z)
    const blocked = requestedRadius > ARENA_RADIUS
    if (blocked) requested.scaleInPlace(ARENA_RADIUS / requestedRadius)
    playerCollider.position.copyFrom(requested)
    next = reconcileProfessorMotion(next, requested.x, requested.z, blocked)
    motion = next
    playerCollider.rotation.y = motion.heading
    syncAnimation()

    const followTarget = new Vector3(motion.positionX, 1.45, motion.positionZ)
    const followWeight = 1 - Math.exp(-5.5 * Math.max(0, Math.min(0.04, deltaSeconds)))
    camera.target.copyFrom(Vector3.Lerp(camera.target, followTarget, followWeight))
    if (blocked) {
      interaction = 'the quantum boundary bends this route back inward'
    } else if (sceneTimeMs >= interactionExpiresAt) {
      interaction = 'WASD/arrows move · left wave · right particle · R resets'
    }
  }

  return {
    id: 'einstein-subatomic',
    scene,
    setActive: (nextActive) => {
      active = nextActive
      if (!active) world.setAimPoint(null)
      syncControls()
      if (active) context.canvas.focus({ preventScroll: true })
    },
    setMode: (nextMode) => {
      mode = nextMode
      if (mode !== 'play') world.setAimPoint(null)
      syncControls()
    },
    setOverlays: (visible) => {
      overlays = visible
      for (const mesh of scene.meshes) mesh.showBoundingBox = overlays
    },
    update: updateScene,
    snapshot: (): RuntimeSnapshot => ({
      scene: 'einstein-subatomic',
      mode,
      playerX: Number(motion.positionX.toFixed(2)),
      playerY: 0,
      playerDepth: Number(motion.positionZ.toFixed(2)),
      playerFacing: Math.sin(motion.heading) < 0 ? 'left' : 'right',
      motionState: ready ? motion.state : 'loading-field',
      motionPhase: Number(motion.locomotionPhase.toFixed(3)),
      velocityX: Number(motion.velocityX.toFixed(2)),
      velocityY: Number(motion.velocityZ.toFixed(2)),
      interaction,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      disposed = true
      camera.detachControl()
      context.canvas.removeEventListener('pointermove', onPointerMove)
      context.canvas.removeEventListener('pointerdown', onPointerDown)
      context.canvas.removeEventListener('pointerleave', onPointerLeave)
      context.canvas.removeEventListener('contextmenu', onContextMenu)
      importedMeshes = []
      shadows.dispose()
      scene.dispose()
    },
  }
}
