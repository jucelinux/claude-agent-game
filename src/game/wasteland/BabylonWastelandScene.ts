import { Camera } from '@babylonjs/core/Cameras/camera.js'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.js'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Mesh } from '@babylonjs/core/Meshes/mesh.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { Scene } from '@babylonjs/core/scene.js'
import type { CompiledClip } from '../../compiler/types.ts'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { WastelandTravelerDirection } from '../character/wastelandTraveler.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'
import {
  containsWastelandPoint,
  isWastelandWalkable,
  wastelandDirectionFromScreenInput,
  wastelandScreenInputToWorldDelta,
  WASTELAND_BRIDGE_RAILS,
  WASTELAND_BRIDGES,
  WASTELAND_BUILDINGS,
  WASTELAND_CONTAINERS,
  WASTELAND_MAP_BOUNDS,
  WASTELAND_OVERPASS_PILLARS,
  WASTELAND_TOWER_BASE,
  type WastelandRect,
} from './wastelandMap.ts'

const PALETTE = {
  dust: new Color3(0.31, 0.27, 0.22),
  asphalt: new Color3(0.105, 0.115, 0.112),
  concrete: new Color3(0.24, 0.25, 0.24),
  dark: new Color3(0.11, 0.125, 0.125),
  rust: new Color3(0.37, 0.19, 0.12),
  canal: new Color3(0.13, 0.105, 0.085),
  cyan: new Color3(0.18, 0.82, 0.77),
} as const

const makeMaterial = (scene: Scene, name: string, color: Color3): StandardMaterial => {
  const result = new StandardMaterial(name, scene)
  result.diffuseColor = color
  result.specularColor = Color3.Black()
  return result
}

const addRectBox = (
  scene: Scene,
  name: string,
  rect: WastelandRect,
  height: number,
  y: number,
  boxMaterial: StandardMaterial,
): Mesh => {
  const mesh = MeshBuilder.CreateBox(name, {
    width: rect.width,
    height,
    depth: rect.depth,
  }, scene)
  mesh.position.set(rect.x + rect.width * 0.5, y + height * 0.5, rect.y + rect.depth * 0.5)
  mesh.material = boxMaterial
  mesh.receiveShadows = true
  return mesh
}

const surfaceHeightAt = (x: number, y: number): number => {
  const bridge = WASTELAND_BRIDGES.find((candidate) => containsWastelandPoint(candidate, x, y, 0))
  if (bridge !== undefined) return 0.34
  if (x >= 37.2 && x <= 47.6 && y >= 26.2 && y <= 36.6) return 0.14
  return 0
}

export function createBabylonWastelandScene(
  context: BabylonSceneContext,
): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.035, 0.05, 0.06, 1)
  scene.fogMode = Scene.FOGMODE_LINEAR
  scene.fogColor = new Color3(0.095, 0.105, 0.105)
  scene.fogStart = 34
  scene.fogEnd = 72
  scene.ambientColor = new Color3(0.11, 0.1, 0.085)

  const materials = {
    dust: makeMaterial(scene, 'ash-dust', PALETTE.dust),
    asphalt: makeMaterial(scene, 'ash-asphalt', PALETTE.asphalt),
    concrete: makeMaterial(scene, 'ash-concrete', PALETTE.concrete),
    dark: makeMaterial(scene, 'ash-dark-concrete', PALETTE.dark),
    rust: makeMaterial(scene, 'ash-rust', PALETTE.rust),
    canal: makeMaterial(scene, 'ash-canal', PALETTE.canal),
  }

  const ground = MeshBuilder.CreateGround('ashfall-ground', {
    width: WASTELAND_MAP_BOUNDS.width,
    height: WASTELAND_MAP_BOUNDS.depth,
    subdivisions: 1,
  }, scene)
  ground.position.set(WASTELAND_MAP_BOUNDS.width * 0.5, -0.03, WASTELAND_MAP_BOUNDS.depth * 0.5)
  ground.material = materials.dust
  ground.receiveShadows = true

  addRectBox(scene, 'arterial-x', { x: 31, y: 0, width: 5, depth: 64 }, 0.035, 0, materials.asphalt)
  addRectBox(scene, 'arterial-z', { x: 0, y: 29, width: 72, depth: 5 }, 0.04, 0, materials.asphalt)
  addRectBox(scene, 'overpass-road-bed', { x: 0, y: 17, width: 72, depth: 4 }, 0.04, 0, materials.asphalt)
  addRectBox(scene, 'dry-canal', { x: 0, y: 44.45, width: 72, depth: 4.55 }, 0.24, -0.62, materials.canal)
  addRectBox(scene, 'central-plaza', { x: 37.2, y: 26.2, width: 10.4, depth: 10.4 }, 0.14, 0, materials.concrete)

  const casters: Mesh[] = []
  for (const [index, building] of WASTELAND_BUILDINGS.entries()) {
    const buildingMaterial = building.palette === 'dark'
      ? materials.dark
      : building.palette === 'rust' ? materials.rust : materials.concrete
    const body = addRectBox(scene, `building-${index}`, building, building.height, 0, buildingMaterial)
    casters.push(body)
    const roof = addRectBox(scene, `building-roof-${index}`, {
      x: building.x + 0.35,
      y: building.y + 0.35,
      width: Math.max(0.8, building.width - 0.7),
      depth: Math.max(0.8, building.depth - 0.7),
    }, 0.22, building.height, materials.dark)
    casters.push(roof)
  }
  for (const [index, container] of WASTELAND_CONTAINERS.entries()) {
    const containerMaterial = container.palette === 'rust' ? materials.rust : materials.dark
    casters.push(addRectBox(scene, `container-${index}`, container, 1.15, 0, containerMaterial))
  }
  for (const [index, pillar] of WASTELAND_OVERPASS_PILLARS.entries()) {
    casters.push(addRectBox(scene, `overpass-pillar-${index}`, pillar, 2.25, 0, materials.dark))
  }
  addRectBox(scene, 'overpass-left', { x: 0, y: 17.9, width: 27, depth: 1.7 }, 0.34, 2.18, materials.concrete)
  addRectBox(scene, 'overpass-right', { x: 33, y: 17.9, width: 39, depth: 1.7 }, 0.34, 2.18, materials.concrete)

  for (const [index, bridge] of WASTELAND_BRIDGES.entries()) {
    addRectBox(scene, `bridge-${index}`, bridge, 0.3, 0.03, materials.concrete)
  }
  for (const [index, rail] of WASTELAND_BRIDGE_RAILS.entries()) {
    casters.push(addRectBox(scene, `bridge-rail-${index}`, rail, 0.3, 0.33, materials.rust))
  }

  const towerBase = addRectBox(scene, 'tower-base', WASTELAND_TOWER_BASE, 0.5, 0.14, materials.dark)
  casters.push(towerBase)
  const mast = MeshBuilder.CreateCylinder('tower-mast', { height: 6.2, diameter: 0.24, tessellation: 6 }, scene)
  mast.position.set(40.85, 3.8, 25.85)
  mast.material = materials.rust
  casters.push(mast)
  const beacon = MeshBuilder.CreateSphere('tower-beacon', { diameter: 0.25, segments: 8 }, scene)
  beacon.position.set(40.85, 7.05, 25.85)
  const beaconMaterial = makeMaterial(scene, 'beacon-material', PALETTE.cyan)
  beaconMaterial.emissiveColor = PALETTE.cyan
  beacon.material = beaconMaterial

  const sky = new HemisphericLight('ash-sky', new Vector3(-0.2, 1, 0.1), scene)
  sky.intensity = 0.72
  sky.diffuse = new Color3(0.42, 0.43, 0.39)
  sky.groundColor = new Color3(0.09, 0.075, 0.06)
  const light = new DirectionalLight('ash-light', new Vector3(-0.6, -1, 0.35), scene)
  light.position.set(28, 42, -12)
  light.intensity = 1.25
  light.diffuse = new Color3(0.72, 0.62, 0.48)
  const shadows = new ShadowGenerator(1024, light)
  shadows.usePoissonSampling = true
  for (const caster of casters) shadows.addShadowCaster(caster)

  const camera = new FreeCamera('ashfall-camera', new Vector3(52, 20, 24), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.minZ = 0.1
  camera.maxZ = 120
  const syncOrtho = (): void => {
    const height = 17
    const aspect = context.engine.getRenderWidth() / Math.max(1, context.engine.getRenderHeight())
    camera.orthoTop = height
    camera.orthoBottom = -height
    camera.orthoLeft = -height * aspect
    camera.orthoRight = height * aspect
  }
  syncOrtho()

  let playerX = 37
  let playerY = 38
  let cameraX = playerX
  let cameraY = playerY
  let mode: WorkspaceMode = 'play'
  let moving = false
  let direction: WastelandTravelerDirection = 's'
  let animationTimeMs = 0
  let renderedClip = ''
  let renderedFrame = -1

  const firstClip = context.bundle.clips.find((clip) => clip.id === 'ashfall-traveler-s-idle')
  if (firstClip === undefined) throw new Error('Ashfall bundle is missing the traveler atlas')
  const travelerTexture = new DynamicTexture('ashfall-traveler-texture', {
    width: firstClip.cell.w,
    height: firstClip.cell.h,
  }, scene, false, Texture.NEAREST_SAMPLINGMODE)
  travelerTexture.hasAlpha = true
  const travelerDraw = travelerTexture.getContext() as unknown as CanvasRenderingContext2D
  const travelerMaterial = new StandardMaterial('ashfall-traveler-material', scene)
  travelerMaterial.diffuseTexture = travelerTexture
  travelerMaterial.opacityTexture = travelerTexture
  travelerMaterial.emissiveColor = Color3.White()
  travelerMaterial.disableLighting = true
  travelerMaterial.backFaceCulling = false
  const travelerHeight = 2.15
  const traveler = MeshBuilder.CreatePlane('ashfall-traveler', {
    width: travelerHeight * firstClip.cell.w / firstClip.cell.h,
    height: travelerHeight,
  }, scene)
  traveler.material = travelerMaterial
  traveler.billboardMode = Mesh.BILLBOARDMODE_ALL

  const imageData = new Map<string, ImageData>()
  const clipFor = (state: 'idle' | 'walk'): CompiledClip => {
    const id = `ashfall-traveler-${direction}-${state}`
    const clip = context.bundle.clips.find((candidate) => candidate.id === id)
    if (clip === undefined) throw new Error(`Missing compiled character clip "${id}"`)
    return clip
  }

  const updateTravelerTexture = (clip: CompiledClip): void => {
    const duration = clip.frames.reduce((total, frame) => total + frame.durationMs, 0)
    let cursor = duration === 0 ? 0 : animationTimeMs % duration
    let frameIndex = 0
    for (let index = 0; index < clip.frames.length; index += 1) {
      const frame = clip.frames[index]
      if (frame === undefined) continue
      if (cursor < frame.durationMs) {
        frameIndex = index
        break
      }
      cursor -= frame.durationMs
    }
    if (renderedClip === clip.id && renderedFrame === frameIndex) return
    const frame = clip.frames[frameIndex]
    if (frame === undefined) return
    let atlas = imageData.get(clip.id)
    if (atlas === undefined) {
      atlas = new ImageData(new Uint8ClampedArray(clip.atlas.rgba), clip.atlas.w, clip.atlas.h)
      imageData.set(clip.id, atlas)
    }
    travelerDraw.clearRect(0, 0, clip.cell.w, clip.cell.h)
    travelerDraw.putImageData(atlas, -frame.x, -frame.y)
    // Atlas frames use Canvas' top-left origin; keep that screen-space orientation
    // when Babylon uploads the dynamic billboard texture.
    travelerTexture.update()
    renderedClip = clip.id
    renderedFrame = frameIndex
  }

  const grid = MeshBuilder.CreateLineSystem('ashfall-grid', {
    lines: Array.from({ length: 19 }, (_, index) => {
      const x = index * 4
      return [new Vector3(x, 0.04, 0), new Vector3(x, 0.04, 64)]
    }).concat(Array.from({ length: 17 }, (_, index) => {
      const z = index * 4
      return [new Vector3(0, 0.04, z), new Vector3(72, 0.04, z)]
    })),
  }, scene)
  grid.color = PALETTE.cyan
  grid.isVisible = false

  return {
    id: 'wasteland-map',
    scene,
    setActive: (active) => {
      if (active) {
        context.canvas.focus({ preventScroll: true })
        syncOrtho()
      }
    },
    setMode: (nextMode) => {
      mode = nextMode
      if (mode === 'inspect') moving = false
    },
    setOverlays: (visible) => {
      grid.isVisible = visible
    },
    update: (deltaSeconds, timeMs) => {
      const screenX = Number(context.input.isDown('KeyD', 'ArrowRight'))
        - Number(context.input.isDown('KeyA', 'ArrowLeft'))
      const screenY = Number(context.input.isDown('KeyS', 'ArrowDown'))
        - Number(context.input.isDown('KeyW', 'ArrowUp'))
      const length = Math.hypot(screenX, screenY)
      moving = mode === 'play' && length > 0
      if (moving) {
        const normalizedX = screenX / length
        const normalizedY = screenY / length
        const delta = wastelandScreenInputToWorldDelta(normalizedX, normalizedY, deltaSeconds)
        const nextX = playerX + delta.x
        const nextY = playerY + delta.y
        if (isWastelandWalkable(nextX, playerY)) playerX = nextX
        if (isWastelandWalkable(playerX, nextY)) playerY = nextY
        direction = wastelandDirectionFromScreenInput(normalizedX, normalizedY)
      }
      animationTimeMs += deltaSeconds * 1000
      updateTravelerTexture(clipFor(moving ? 'walk' : 'idle'))
      traveler.position.set(playerX, surfaceHeightAt(playerX, playerY) + travelerHeight * 0.5, playerY)

      const follow = 1 - Math.exp(-deltaSeconds * 6)
      cameraX += (playerX - cameraX) * follow
      cameraY += (playerY - cameraY) * follow
      camera.position.set(cameraX + 15, 20, cameraY - 15)
      camera.setTarget(new Vector3(cameraX, 0.8, cameraY))
      const pulse = 0.7 + (Math.sin(timeMs * 0.004) + 1) * 0.28
      beacon.scaling.setAll(pulse)
    },
    snapshot: (): RuntimeSnapshot => ({
      scene: 'wasteland-map',
      mode,
      playerX: Number(playerX.toFixed(2)),
      playerY: Number(playerY.toFixed(2)),
      playerDepth: Number((playerX + playerY).toFixed(2)),
      interaction: null,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      travelerTexture.dispose()
      scene.dispose()
    },
  }
}
