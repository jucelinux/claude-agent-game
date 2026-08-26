import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera.js'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Mesh } from '@babylonjs/core/Meshes/mesh.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js'
import { Scene } from '@babylonjs/core/scene.js'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'

const terrainHeight = (x: number, z: number): number =>
  Math.sin(x * 0.115) * 0.18
  + Math.cos(z * 0.09) * 0.14
  + Math.sin((x + z) * 0.047) * 0.22

export function createSunlitEarthScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.49, 0.72, 0.91, 1)
  scene.fogMode = Scene.FOGMODE_LINEAR
  scene.fogColor = new Color3(0.68, 0.78, 0.79)
  scene.fogStart = 42
  scene.fogEnd = 92
  scene.ambientColor = new Color3(0.32, 0.29, 0.23)

  const camera = new UniversalCamera('sunlit-camera', new Vector3(0, 3.2, -9), scene)
  camera.setTarget(new Vector3(0, 1.2, 7))
  camera.minZ = 0.08
  camera.maxZ = 180
  camera.fov = 0.92
  camera.speed = 0.32
  camera.angularSensibility = 3200
  camera.keysUp = [87, 38]
  camera.keysDown = [83, 40]
  camera.keysLeft = [65, 37]
  camera.keysRight = [68, 39]

  const skyLight = new HemisphericLight('sky-fill', new Vector3(0.2, 1, 0.1), scene)
  skyLight.intensity = 1.05
  skyLight.diffuse = new Color3(1, 0.92, 0.76)
  skyLight.groundColor = new Color3(0.3, 0.21, 0.14)

  const sun = new DirectionalLight('sun', new Vector3(-0.48, -1, 0.32), scene)
  sun.position = new Vector3(24, 38, -18)
  sun.intensity = 2.35
  sun.diffuse = new Color3(1, 0.84, 0.58)

  const ground = MeshBuilder.CreateGround('earthen-ground', {
    width: 120,
    height: 120,
    subdivisions: 72,
    updatable: true,
  }, scene)
  const positions = ground.getVerticesData(VertexBuffer.PositionKind)
  if (positions !== null) {
    for (let index = 0; index < positions.length; index += 3) {
      const x = positions[index] ?? 0
      const z = positions[index + 2] ?? 0
      positions[index + 1] = terrainHeight(x, z)
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, positions)
    ground.convertToFlatShadedMesh()
    ground.refreshBoundingInfo()
  }

  const earth = new StandardMaterial('warm-earth', scene)
  earth.diffuseColor = new Color3(0.49, 0.28, 0.14)
  earth.ambientColor = new Color3(0.23, 0.12, 0.065)
  earth.specularColor = new Color3(0.035, 0.025, 0.018)
  ground.material = earth
  ground.receiveShadows = true

  const stoneMaterial = new StandardMaterial('sun-baked-stone', scene)
  stoneMaterial.diffuseColor = new Color3(0.39, 0.25, 0.17)
  stoneMaterial.specularColor = Color3.Black()
  const rocks: Mesh[] = []
  const rockData = [
    [-8, 12, 1.4, 0.48], [7, 16, 1.9, 0.6], [15, 27, 1.25, 0.42],
    [-18, 31, 2.1, 0.7], [22, 39, 1.6, 0.52], [-27, 43, 1.2, 0.38],
  ] as const
  for (const [x, z, width, height] of rockData) {
    const rock = MeshBuilder.CreateIcoSphere(`rock-${x}-${z}`, {
      radius: 1,
      subdivisions: 1,
      flat: true,
    }, scene)
    rock.position.set(x, terrainHeight(x, z) + height * 0.48, z)
    rock.scaling.set(width, height, width * 0.72)
    rock.rotation.y = (x + z) * 0.17
    rock.material = stoneMaterial
    rocks.push(rock)
  }

  const shadow = new ShadowGenerator(1024, sun)
  shadow.usePercentageCloserFiltering = true
  shadow.bias = 0.002
  for (const rock of rocks) shadow.addShadowCaster(rock)

  const grid = MeshBuilder.CreateLineSystem('terrain-grid', {
    lines: Array.from({ length: 18 }, (_, index) => {
      const offset = -34 + index * 4
      return [new Vector3(-34, 0.035, offset), new Vector3(34, 0.035, offset)]
    }).concat(Array.from({ length: 18 }, (_, index) => {
      const offset = -34 + index * 4
      return [new Vector3(offset, 0.035, -34), new Vector3(offset, 0.035, 34)]
    })),
  }, scene)
  grid.color = new Color3(0.12, 0.78, 0.78)
  grid.isVisible = false

  let mode: WorkspaceMode = 'play'
  let active = false

  const syncControls = (): void => {
    if (active && mode === 'play') camera.attachControl(context.canvas, true)
    else camera.detachControl()
  }

  return {
    id: 'sunlit-earth',
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
      const floor = terrainHeight(camera.position.x, camera.position.z) + 1.25
      if (camera.position.y < floor) camera.position.y = floor
    },
    snapshot: (): RuntimeSnapshot => ({
      scene: 'sunlit-earth',
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
