import '@babylonjs/loaders/glTF/2.0/glTFLoader.js'
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_emissive_strength.js'
import '@babylonjs/core/Collisions/collisionCoordinator.js'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Ray } from '@babylonjs/core/Culling/ray.js'
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

const MODEL_ROOT = '/assets/einstein-diorama/'
const MODEL_FILE = 'einstein-lab.glb'
const SPAWN = { x: 0.85, z: -0.14, heading: 0 } as const
// Blender's front-facing -Y is converted to Babylon's +Z by the glTF loader.
const CAMERA_POSITION = new Vector3(7.7, 6.2, 9.6)
const CAMERA_TARGET = new Vector3(0, 1.75, -0.55)

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const smoothstep = (value: number): number => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export function createEinsteinDioramaScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.018, 0.042, 0.055, 1)
  scene.ambientColor = new Color3(0.08, 0.1, 0.12)
  scene.collisionsEnabled = true
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType =
    ImageProcessingConfiguration.TONEMAPPING_ACES
  scene.imageProcessingConfiguration.exposure = 1.32
  scene.imageProcessingConfiguration.contrast = 1.06

  const camera = new ArcRotateCamera(
    'professor-diorama-camera',
    0,
    0,
    12,
    CAMERA_TARGET,
    scene,
  )
  camera.setPosition(CAMERA_POSITION)
  camera.fov = 0.62
  camera.minZ = 0.05
  camera.maxZ = 80
  camera.lowerRadiusLimit = 9.4
  camera.upperRadiusLimit = 14.4
  camera.lowerBetaLimit = 0.72
  camera.upperBetaLimit = 1.31
  camera.lowerAlphaLimit = camera.alpha - 0.56
  camera.upperAlphaLimit = camera.alpha + 0.56
  camera.panningSensibility = 0
  camera.wheelDeltaPercentage = 0.015
  camera.inertia = 0.72
  camera.angularSensibilityX = 1_100
  camera.angularSensibilityY = 1_100
  camera.keysUp = []
  camera.keysDown = []
  camera.keysLeft = []
  camera.keysRight = []
  scene.activeCamera = camera

  const ambient = new HemisphericLight('professor-ambient', new Vector3(0, 1, 0), scene)
  ambient.intensity = 0.82
  ambient.diffuse = new Color3(0.48, 0.68, 0.78)
  ambient.groundColor = new Color3(0.09, 0.055, 0.035)

  const key = new DirectionalLight(
    'professor-warm-key',
    new Vector3(0.42, -1, -0.72),
    scene,
  )
  key.position = new Vector3(-4.5, 8.5, 6.5)
  key.intensity = 3.1
  key.diffuse = new Color3(1, 0.58, 0.3)

  const rim = new DirectionalLight(
    'professor-cool-rim',
    new Vector3(-0.48, -0.76, 0.58),
    scene,
  )
  rim.position = new Vector3(4, 6.5, -4.5)
  rim.intensity = 1.65
  rim.diffuse = new Color3(0.3, 0.62, 1)

  const shadows = new ShadowGenerator(1024, key)
  shadows.usePercentageCloserFiltering = true
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM
  shadows.bias = 0.0008
  shadows.normalBias = 0.018

  const collisionMeshes: AbstractMesh[] = []
  const collisionBox = (
    name: string,
    position: Vector3,
    width: number,
    height: number,
    depth: number,
  ): AbstractMesh => {
    const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene)
    mesh.position.copyFrom(position)
    mesh.isVisible = false
    mesh.isPickable = false
    mesh.checkCollisions = true
    collisionMeshes.push(mesh)
    return mesh
  }
  collisionBox('Collision_RoomLeft', new Vector3(-3.82, 1.1, 0), 0.18, 2.2, 5.6)
  collisionBox('Collision_RoomRight', new Vector3(3.82, 1.1, 0), 0.18, 2.2, 5.6)
  collisionBox('Collision_RoomBack', new Vector3(0, 1.1, -2.72), 7.8, 2.2, 0.18)
  collisionBox('Collision_RoomFront', new Vector3(0, 1.1, 2.72), 7.8, 2.2, 0.18)
  collisionBox('Collision_Workbench', new Vector3(-2.15, 0.7, -0.72), 2.7, 1.4, 1.42)

  const playerCollider = MeshBuilder.CreateBox(
    'Professor_CollisionBody',
    { width: 0.56, height: 1.7, depth: 0.56 },
    scene,
  )
  playerCollider.position.set(SPAWN.x, 0, SPAWN.z)
  playerCollider.isVisible = false
  playerCollider.isPickable = false
  playerCollider.checkCollisions = true
  playerCollider.ellipsoid.set(0.28, 0.84, 0.28)
  playerCollider.ellipsoidOffset.set(0, 0.84, 0)
  collisionMeshes.push(playerCollider)

  let mode: WorkspaceMode = 'play'
  let active = false
  let overlays = false
  let disposed = false
  let ready = false
  let meshes: AbstractMesh[] = []
  let occlusionWalls: AbstractMesh[] = []
  let leftWallContents: AbstractMesh[] = []
  let backWallContents: AbstractMesh[] = []
  let idleAnimation: AnimationGroup | undefined
  let walkAnimation: AnimationGroup | undefined
  let motion: ProfessorMotionState = createProfessorMotionState(SPAWN)
  let interaction: string | null = 'loading animated low-poly diorama'

  const syncControls = (): void => {
    camera.detachControl()
    if (active && mode === 'play') camera.attachControl(context.canvas, true)
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

  const reset = (): void => {
    motion = createProfessorMotionState(SPAWN)
    playerCollider.position.set(SPAWN.x, 0, SPAWN.z)
    playerCollider.rotation.y = SPAWN.heading
    for (const wall of occlusionWalls) wall.isVisible = true
    walkAnimation?.goToFrame(walkAnimation.from)
    syncAnimation()
    interaction = 'professor returned to the chalk mark'
  }

  void SceneLoader.ImportMeshAsync('', MODEL_ROOT, MODEL_FILE, scene).then((result) => {
    if (disposed) {
      for (const mesh of result.meshes) mesh.dispose()
      return
    }
    meshes = result.meshes
    leftWallContents = meshes.filter((mesh) => mesh.name.startsWith('Environment_Left'))
    backWallContents = meshes.filter((mesh) =>
      mesh.name.startsWith('Environment_Back')
      || mesh.name.startsWith('Environment_Blackboard')
      || mesh.name.startsWith('Environment_Board')
      || mesh.name.startsWith('Environment_Chalk'))
    occlusionWalls = meshes.filter((mesh) =>
      mesh.name === 'Environment_BackWall' || mesh.name === 'Environment_LeftWall')
    for (const mesh of meshes) {
      mesh.receiveShadows = true
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
    interaction = 'WASD or arrows move · drag to orbit · R resets'
  }).catch((error: unknown) => {
    interaction = error instanceof Error ? error.message : String(error)
  })

  const updateScene = (deltaSeconds: number): void => {
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
    const cameraRight = Vector3.Cross(cameraForward, Vector3.Up()).normalize()
    const worldInput = cameraForward.scale(vertical).addInPlace(cameraRight.scale(horizontal))

    const previous = motion
    let next = stepProfessorMotion(motion, { x: worldInput.x, z: worldInput.z }, deltaSeconds)
    if (next.locomotionStarted) walkAnimation?.goToFrame(walkAnimation.from)
    const requested = new Vector3(
      next.positionX - previous.positionX,
      0,
      next.positionZ - previous.positionZ,
    )
    const before = playerCollider.position.clone()
    playerCollider.moveWithCollisions(requested)
    const actualDistance = Vector3.Distance(before, playerCollider.position)
    const blocked = requested.lengthSquared() > 0.000001
      && actualDistance < requested.length() * 0.35
    next = reconcileProfessorMotion(
      next,
      playerCollider.position.x,
      playerCollider.position.z,
      blocked,
    )
    motion = next
    playerCollider.rotation.y = motion.heading
    syncAnimation()

    const followTarget = new Vector3(motion.positionX, 1.72, motion.positionZ)
    const followWeight = 1 - Math.exp(-5.5 * Math.max(0, Math.min(0.04, deltaSeconds)))
    camera.target.copyFrom(Vector3.Lerp(camera.target, followTarget, followWeight))
    const occlusionRay = Ray.CreateNewFromTo(camera.position, followTarget)
    // Picking ignores hidden meshes, so expose both candidates for the query and
    // apply the cutaway result before Babylon renders this frame.
    for (const wall of occlusionWalls) wall.isVisible = true
    const cutawayWall = scene.pickWithRay(
      occlusionRay,
      (candidate) => occlusionWalls.includes(candidate),
      false,
    )?.pickedMesh
    const hideLeftWall = cutawayWall?.name === 'Environment_LeftWall'
    const hideBackWall = cutawayWall?.name === 'Environment_BackWall'
    for (const mesh of leftWallContents) mesh.isVisible = !hideLeftWall
    for (const mesh of backWallContents) mesh.isVisible = !hideBackWall
    interaction = blocked
      ? 'the room or workbench blocks this route'
      : 'WASD or arrows move · drag to orbit · R resets'
  }

  return {
    id: 'einstein-diorama',
    scene,
    setActive: (nextActive) => {
      active = nextActive
      syncControls()
      if (active) context.canvas.focus({ preventScroll: true })
    },
    setMode: (nextMode) => {
      mode = nextMode
      syncControls()
    },
    setOverlays: (visible) => {
      overlays = visible
      for (const mesh of meshes) mesh.showBoundingBox = overlays
      for (const mesh of collisionMeshes) mesh.showBoundingBox = overlays
    },
    update: updateScene,
    snapshot: (): RuntimeSnapshot => ({
      scene: 'einstein-diorama',
      mode,
      playerX: Number(motion.positionX.toFixed(2)),
      playerY: 0,
      playerDepth: Number(motion.positionZ.toFixed(2)),
      playerFacing: Math.sin(motion.heading) < 0 ? 'left' : 'right',
      motionState: ready ? motion.state : 'loading-study',
      motionPhase: Number(motion.locomotionPhase.toFixed(3)),
      velocityX: Number(motion.velocityX.toFixed(2)),
      velocityY: Number(motion.velocityZ.toFixed(2)),
      interaction,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      disposed = true
      camera.detachControl()
      meshes = []
      occlusionWalls = []
      leftWallContents = []
      backWallContents = []
      shadows.dispose()
      scene.dispose()
    },
  }
}
