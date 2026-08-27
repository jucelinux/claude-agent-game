import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera.js'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { Scene } from '@babylonjs/core/scene.js'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'

const GROUND_SIZE = 60
const GRID_STEP = 4
const EYE_HEIGHT = 1.7

/**
 * Empty stage for the next game. It holds only what a Babylon scene needs to be
 * looked at — ground, sky, key light and a walk camera — so the first real scene
 * work replaces content instead of plumbing.
 */
export function createNewProjectScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.09, 0.11, 0.14, 1)
  scene.ambientColor = new Color3(0.24, 0.25, 0.28)

  const camera = new UniversalCamera('stage-camera', new Vector3(0, EYE_HEIGHT, -12), scene)
  camera.setTarget(new Vector3(0, 1, 0))
  camera.minZ = 0.08
  camera.maxZ = 200
  camera.speed = 0.28
  camera.angularSensibility = 3200
  camera.keysUp = [87, 38]
  camera.keysDown = [83, 40]
  camera.keysLeft = [65, 37]
  camera.keysRight = [68, 39]

  const fill = new HemisphericLight('sky-fill', new Vector3(0.1, 1, 0.2), scene)
  fill.intensity = 0.75
  fill.diffuse = new Color3(0.82, 0.86, 0.95)
  fill.groundColor = new Color3(0.16, 0.17, 0.2)

  const key = new DirectionalLight('key-light', new Vector3(-0.5, -1, 0.35), scene)
  key.position = new Vector3(18, 26, -14)
  key.intensity = 1.4

  const ground = MeshBuilder.CreateGround('ground', {
    width: GROUND_SIZE,
    height: GROUND_SIZE,
  }, scene)
  const groundMaterial = new StandardMaterial('ground-material', scene)
  groundMaterial.diffuseColor = new Color3(0.21, 0.23, 0.26)
  groundMaterial.specularColor = Color3.Black()
  ground.material = groundMaterial
  ground.receiveShadows = true

  const half = GROUND_SIZE / 2
  const lineCount = GROUND_SIZE / GRID_STEP + 1
  const grid = MeshBuilder.CreateLineSystem('ground-grid', {
    lines: Array.from({ length: lineCount }, (_, index) => {
      const offset = -half + index * GRID_STEP
      return [new Vector3(-half, 0.02, offset), new Vector3(half, 0.02, offset)]
    }).concat(Array.from({ length: lineCount }, (_, index) => {
      const offset = -half + index * GRID_STEP
      return [new Vector3(offset, 0.02, -half), new Vector3(offset, 0.02, half)]
    })),
  }, scene)
  grid.color = new Color3(0.14, 0.68, 0.72)
  grid.isVisible = false

  const marker = MeshBuilder.CreateBox('origin-marker', { size: 1 }, scene)
  marker.position.set(0, 0.5, 0)
  const markerMaterial = new StandardMaterial('origin-material', scene)
  markerMaterial.diffuseColor = new Color3(0.55, 0.58, 0.62)
  markerMaterial.specularColor = new Color3(0.06, 0.06, 0.07)
  marker.material = markerMaterial

  let mode: WorkspaceMode = 'play'
  let active = false

  const syncControls = (): void => {
    if (active && mode === 'play') camera.attachControl(context.canvas, true)
    else camera.detachControl()
  }

  return {
    id: 'new-project',
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
      grid.isVisible = visible
    },
    update: () => {
      camera.position.y = EYE_HEIGHT
    },
    snapshot: (): RuntimeSnapshot => ({
      scene: 'new-project',
      mode,
      playerX: Number(camera.position.x.toFixed(2)),
      playerY: Number(camera.position.y.toFixed(2)),
      playerDepth: Number(camera.position.z.toFixed(2)),
      interaction: null,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      camera.detachControl()
      scene.dispose()
    },
  }
}
