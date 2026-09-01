import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera.js'
import '@babylonjs/core/Collisions/collisionCoordinator.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { PointLight } from '@babylonjs/core/Lights/pointLight.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { Viewport } from '@babylonjs/core/Maths/math.viewport.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Mesh } from '@babylonjs/core/Meshes/mesh.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem.js'
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js'
import { Scene } from '@babylonjs/core/scene.js'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import type {
  BabylonSceneContext,
  BabylonSceneController,
} from '../../babylon/runtime.ts'
import type { RuntimeSnapshot, WorkspaceMode } from '../types.ts'
import {
  getProjectingSignCenterX,
  getTextPlaneOrientation,
  PROJECTING_SIGN_CLEARANCE,
  SIGN_FRAME_MARGIN,
  TEXT_TEXTURE_INVERT_Y,
  type ProjectingSignSide,
  type TextPlaneFacing,
} from './textPlane.ts'

const EYE_HEIGHT = 1.65
const WALK_SPEED = 3.7
const SPAWN = new Vector3(-1.2, EYE_HEIGHT, -16.8)
const LOOK_AT = new Vector3(2.7, 3.1, 11.1)

const REVIEW_VIEWS = [
  { code: 'Digit1', label: 'Alley entry', position: SPAWN, target: LOOK_AT },
  {
    code: 'Digit2',
    label: 'Lit turn',
    position: new Vector3(-0.25, EYE_HEIGHT, -7.2),
    target: new Vector3(2.8, 2.45, 11.4),
  },
  {
    code: 'Digit3',
    label: 'Kissa frontage',
    position: new Vector3(1.2, EYE_HEIGHT, -10),
    target: new Vector3(-3.35, 2.35, -6.5),
  },
  {
    code: 'Digit4',
    label: 'Service turn',
    position: new Vector3(5.8, EYE_HEIGHT, 11.3),
    target: new Vector3(14.3, 2, 11.8),
  },
  {
    code: 'Digit5',
    label: 'Night counter',
    position: new Vector3(10, EYE_HEIGHT, 12.3),
    target: new Vector3(15.8, 2.25, 8.2),
  },
] as const

type BoxSize = {
  readonly width: number
  readonly height: number
  readonly depth: number
}

type SignPulse = {
  readonly material: StandardMaterial
  readonly speed: number
  readonly phase: number
}

type SignOptions = {
  readonly name: string
  readonly label: string
  readonly position: Vector3
  readonly facing: TextPlaneFacing
  readonly width: number
  readonly height: number
  readonly foreground: string
  readonly background: string
  readonly border?: string
  readonly vertical?: boolean
  readonly pulse?: boolean
}

type ProjectingSignOptions = Omit<SignOptions, 'position' | 'facing'> & {
  readonly wallX: number
  readonly y: number
  readonly z: number
  readonly side: ProjectingSignSide
}

type Environment = {
  readonly debugMeshes: readonly Mesh[]
  readonly pulses: readonly SignPulse[]
}

function color(hex: string): Color3 {
  return Color3.FromHexString(hex)
}

function deterministicUnit(seed: number, index: number): number {
  const value = Math.sin(seed * 41.73 + index * 19.19) * 143758.5453
  return value - Math.floor(value)
}

function createMaterial(
  scene: Scene,
  name: string,
  diffuse: string,
  emissive = '#000000',
): StandardMaterial {
  const material = new StandardMaterial(name, scene)
  material.diffuseColor = color(diffuse)
  material.emissiveColor = color(emissive)
  material.specularColor = Color3.Black()
  material.backFaceCulling = true
  return material
}

function createRainTexture(scene: Scene): DynamicTexture {
  const texture = new DynamicTexture('rain-streak-texture', { width: 8, height: 32 }, scene, false)
  texture.hasAlpha = true
  const context = texture.getContext() as unknown as CanvasRenderingContext2D
  context.clearRect(0, 0, 8, 32)
  const gradient = context.createLinearGradient(0, 0, 0, 32)
  gradient.addColorStop(0, 'rgba(222, 231, 220, 0)')
  gradient.addColorStop(0.18, 'rgba(222, 231, 220, 0.5)')
  gradient.addColorStop(0.72, 'rgba(222, 231, 220, 0.92)')
  gradient.addColorStop(1, 'rgba(222, 231, 220, 0)')
  context.fillStyle = gradient
  context.fillRect(3, 0, 2, 32)
  texture.update(false)
  texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
  texture.anisotropicFilteringLevel = 1
  return texture
}

function createRainSplashTexture(scene: Scene): DynamicTexture {
  const texture = new DynamicTexture('rain-splash-texture', { width: 16, height: 8 }, scene, false)
  texture.hasAlpha = true
  const context = texture.getContext() as unknown as CanvasRenderingContext2D
  context.clearRect(0, 0, 16, 8)
  context.fillStyle = 'rgba(216, 226, 215, 0.82)'
  context.fillRect(7, 5, 2, 2)
  context.fillRect(3, 3, 3, 1)
  context.fillRect(10, 3, 3, 1)
  context.fillRect(1, 6, 5, 1)
  context.fillRect(10, 6, 5, 1)
  texture.update(false)
  texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
  texture.anisotropicFilteringLevel = 1
  return texture
}

function createRain(scene: Scene, emitter: Vector3): void {
  const rain = new ParticleSystem('alley-rain', 1200, scene)
  rain.particleTexture = createRainTexture(scene)
  rain.emitter = emitter
  rain.createBoxEmitter(
    new Vector3(-1.35, -18, -0.25),
    new Vector3(-0.65, -14, 0.55),
    new Vector3(-7, 5.5, -10),
    new Vector3(7, 10, 13),
  )
  rain.emitRate = 520
  rain.minLifeTime = 0.58
  rain.maxLifeTime = 0.92
  rain.minEmitPower = 0.9
  rain.maxEmitPower = 1.12
  rain.minSize = 0.16
  rain.maxSize = 0.22
  rain.minScaleX = 0.12
  rain.maxScaleX = 0.18
  rain.minScaleY = 2.4
  rain.maxScaleY = 3.8
  rain.gravity = new Vector3(-0.35, -4.5, 0.18)
  rain.color1 = new Color4(0.56, 0.67, 0.63, 0.25)
  rain.color2 = new Color4(0.72, 0.64, 0.5, 0.3)
  rain.colorDead = new Color4(0.35, 0.43, 0.4, 0)
  rain.blendMode = ParticleSystem.BLENDMODE_STANDARD
  rain.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED
  rain.isBillboardBased = true
  rain.start()

  const splashes = new ParticleSystem('alley-rain-splashes', 160, scene)
  splashes.particleTexture = createRainSplashTexture(scene)
  splashes.emitter = emitter
  splashes.createBoxEmitter(
    new Vector3(-0.35, 0.75, -0.35),
    new Vector3(0.35, 1.35, 0.35),
    new Vector3(-2.8, -1.58, -7),
    new Vector3(2.8, -1.55, 8),
  )
  splashes.emitRate = 140
  splashes.minLifeTime = 0.12
  splashes.maxLifeTime = 0.24
  splashes.minEmitPower = 0.22
  splashes.maxEmitPower = 0.48
  splashes.minSize = 0.028
  splashes.maxSize = 0.075
  splashes.minScaleX = 0.7
  splashes.maxScaleX = 1
  splashes.minScaleY = 0.45
  splashes.maxScaleY = 0.7
  splashes.gravity = new Vector3(0, -5.5, 0)
  splashes.color1 = new Color4(0.58, 0.67, 0.63, 0.14)
  splashes.color2 = new Color4(0.76, 0.66, 0.5, 0.16)
  splashes.colorDead = new Color4(0.35, 0.43, 0.4, 0)
  splashes.blendMode = ParticleSystem.BLENDMODE_STANDARD
  splashes.start()
}

function createPixelSurfaceMaterial(
  scene: Scene,
  name: string,
  base: string,
  flecks: readonly string[],
  seed: number,
  repeatU = 2,
  repeatV = 3,
): StandardMaterial {
  const texture = new DynamicTexture(`${name}-texture`, { width: 64, height: 64 }, scene, false)
  texture.hasAlpha = false
  const context = texture.getContext() as unknown as CanvasRenderingContext2D
  context.fillStyle = base
  context.fillRect(0, 0, 64, 64)
  for (let index = 0; index < 74; index++) {
    const x = Math.floor(deterministicUnit(seed, index * 3) * 64)
    const y = Math.floor(deterministicUnit(seed, index * 3 + 1) * 64)
    const width = 1 + Math.floor(deterministicUnit(seed, index * 3 + 2) * 8)
    const height = index % 5 === 0 ? 1 : 1 + (index % 3)
    context.fillStyle = flecks[index % flecks.length] ?? base
    context.fillRect(x, y, width, height)
  }
  context.fillStyle = flecks[0] ?? base
  context.fillRect(0, 47, 64, 2)
  context.fillStyle = flecks[1] ?? base
  context.fillRect(18, 0, 1, 64)
  texture.update(true)
  texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
  texture.wrapU = Texture.WRAP_ADDRESSMODE
  texture.wrapV = Texture.WRAP_ADDRESSMODE
  texture.uScale = repeatU
  texture.vScale = repeatV
  texture.anisotropicFilteringLevel = 1

  const material = createMaterial(scene, name, '#ffffff')
  material.diffuseTexture = texture
  material.diffuseColor = new Color3(0.94, 0.94, 0.94)
  return material
}

function createBox(
  scene: Scene,
  name: string,
  size: BoxSize,
  position: Vector3,
  material: StandardMaterial,
  collidable = false,
): Mesh {
  const mesh = MeshBuilder.CreateBox(name, size, scene)
  mesh.position.copyFrom(position)
  mesh.material = material
  mesh.checkCollisions = collidable
  return mesh
}

function createCylinder(
  scene: Scene,
  name: string,
  height: number,
  diameter: number,
  position: Vector3,
  material: StandardMaterial,
  tessellation = 8,
): Mesh {
  const mesh = MeshBuilder.CreateCylinder(name, { height, diameter, tessellation }, scene)
  mesh.position.copyFrom(position)
  mesh.material = material
  return mesh
}

function surfacePoint(
  facing: TextPlaneFacing,
  surface: Vector3,
  along: number,
  y: number,
  outward = 0,
): Vector3 {
  switch (facing) {
    case 'east': return new Vector3(surface.x + outward, y, surface.z + along)
    case 'west': return new Vector3(surface.x - outward, y, surface.z + along)
    case 'north': return new Vector3(surface.x + along, y, surface.z + outward)
    case 'south': return new Vector3(surface.x + along, y, surface.z - outward)
  }
}

function createSurfacePanel(
  scene: Scene,
  name: string,
  surface: Vector3,
  facing: TextPlaneFacing,
  along: number,
  y: number,
  width: number,
  height: number,
  thickness: number,
  material: StandardMaterial,
  outward = 0.02,
): Mesh {
  const eastWest = facing === 'east' || facing === 'west'
  return createBox(
    scene,
    name,
    eastWest
      ? { width: thickness, height, depth: width }
      : { width, height, depth: thickness },
    surfacePoint(facing, surface, along, y, outward + thickness / 2),
    material,
  )
}

function createTextPlane(
  scene: Scene,
  name: string,
  width: number,
  height: number,
  position: Vector3,
  facing: TextPlaneFacing,
  material: StandardMaterial,
): Mesh {
  const orientation = getTextPlaneOrientation(facing, 0.012)
  const plane = MeshBuilder.CreatePlane(name, {
    width,
    height,
    sideOrientation: Mesh.FRONTSIDE,
  }, scene)
  plane.position.set(
    position.x + orientation.offsetX,
    position.y,
    position.z + orientation.offsetZ,
  )
  plane.rotation.y = orientation.rotationY
  plane.material = material
  plane.metadata = {
    kind: 'readable-sign-face',
    facing,
    front: [orientation.frontX, orientation.frontZ],
  }
  return plane
}

function createSignMaterial(scene: Scene, options: SignOptions): StandardMaterial {
  const textureWidth = options.vertical === true ? 64 : 256
  const textureHeight = options.vertical === true ? 256 : 64
  const texture = new DynamicTexture(
    `${options.name}-texture`,
    { width: textureWidth, height: textureHeight },
    scene,
    false,
  )
  texture.hasAlpha = false
  const context = texture.getContext() as unknown as CanvasRenderingContext2D
  context.fillStyle = options.background
  context.fillRect(0, 0, textureWidth, textureHeight)
  context.strokeStyle = options.border ?? options.foreground
  context.lineWidth = options.vertical === true ? 3 : 4
  context.strokeRect(3, 3, textureWidth - 6, textureHeight - 6)
  context.fillStyle = options.foreground
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  if (options.vertical === true) {
    const glyphs = Array.from(options.label.replaceAll(' ', ''))
    const fontSize = Math.min(45, Math.floor(206 / Math.max(1, glyphs.length)))
    context.font = `800 ${fontSize}px sans-serif`
    glyphs.forEach((glyph, index) => {
      const y = 128 + (index - (glyphs.length - 1) / 2) * (fontSize + 5)
      context.fillText(glyph, 32, y)
    })
  } else {
    let fontSize = options.label.length > 9 ? 27 : 34
    context.font = `800 ${fontSize}px sans-serif`
    while (context.measureText(options.label).width > textureWidth - 20 && fontSize > 16) {
      fontSize--
      context.font = `800 ${fontSize}px sans-serif`
    }
    context.fillText(options.label, textureWidth / 2, textureHeight / 2 + 1)
  }
  context.globalAlpha = 0.24
  context.fillStyle = '#101010'
  context.fillRect(textureWidth * 0.63, 0, 3, textureHeight)
  context.fillRect(0, textureHeight * 0.72, textureWidth, 2)
  context.globalAlpha = 1
  texture.update(TEXT_TEXTURE_INVERT_Y)
  texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
  texture.anisotropicFilteringLevel = 1

  const material = new StandardMaterial(`${options.name}-material`, scene)
  material.diffuseColor = Color3.Black()
  material.emissiveColor = Color3.Black()
  material.specularColor = Color3.Black()
  material.emissiveTexture = texture
  material.disableLighting = true
  material.backFaceCulling = true
  return material
}

function createFramedSign(
  scene: Scene,
  options: SignOptions,
  frameMaterial: StandardMaterial,
  pulses: SignPulse[],
): void {
  const eastWest = options.facing === 'east' || options.facing === 'west'
  const frame = createBox(
    scene,
    `${options.name}-opaque-backing`,
    eastWest
      ? { width: SIGN_FRAME_MARGIN, height: options.height + SIGN_FRAME_MARGIN, depth: options.width + SIGN_FRAME_MARGIN }
      : { width: options.width + SIGN_FRAME_MARGIN, height: options.height + SIGN_FRAME_MARGIN, depth: SIGN_FRAME_MARGIN },
    options.position,
    frameMaterial,
  )
  frame.metadata = { kind: 'opaque-sign-back', publicFacing: options.facing }
  const facePosition = surfacePoint(options.facing, options.position, 0, options.position.y, 0.092)
  const material = createSignMaterial(scene, options)
  createTextPlane(scene, `${options.name}-readable-face`, options.width, options.height, facePosition, options.facing, material)
  if (options.pulse === true) {
    pulses.push({ material, speed: 1.4 + options.name.length * 0.03, phase: options.name.length })
  }
}

function createProjectingSign(
  scene: Scene,
  options: ProjectingSignOptions,
  frameMaterial: StandardMaterial,
  pulses: SignPulse[],
): void {
  const centerX = getProjectingSignCenterX(options.wallX, options.width, options.side)
  createFramedSign(scene, {
    ...options,
    position: new Vector3(centerX, options.y, options.z),
    facing: 'south',
  }, frameMaterial, pulses)

  const halfFramedWidth = (options.width + SIGN_FRAME_MARGIN) / 2
  const signEdgeX = centerX + (options.side === 'left' ? -halfFramedWidth : halfFramedWidth)
  const mountCenterX = (options.wallX + signEdgeX) / 2
  const mountWidth = PROJECTING_SIGN_CLEARANCE + 0.12
  for (const [index, yOffset] of [-options.height * 0.28, options.height * 0.28].entries()) {
    createBox(
      scene,
      `${options.name}-mount-${index}`,
      { width: mountWidth, height: 0.055, depth: 0.055 },
      new Vector3(mountCenterX, options.y + yOffset, options.z),
      frameMaterial,
    )
  }
}

function createAwning(
  scene: Scene,
  name: string,
  surface: Vector3,
  facing: TextPlaneFacing,
  along: number,
  y: number,
  width: number,
  material: StandardMaterial,
): void {
  const eastWest = facing === 'east' || facing === 'west'
  const awning = createBox(
    scene,
    name,
    eastWest
      ? { width: 1.1, height: 0.14, depth: width }
      : { width, height: 0.14, depth: 1.1 },
    surfacePoint(facing, surface, along, y, 0.52),
    material,
  )
  if (facing === 'east') awning.rotation.z = -0.13
  if (facing === 'west') awning.rotation.z = 0.13
  if (facing === 'north') awning.rotation.x = 0.13
  if (facing === 'south') awning.rotation.x = -0.13
}

function createShutter(
  scene: Scene,
  name: string,
  surface: Vector3,
  facing: TextPlaneFacing,
  along: number,
  width: number,
  frame: StandardMaterial,
  slat: StandardMaterial,
): void {
  createSurfacePanel(scene, `${name}-door`, surface, facing, along, 1.48, width, 2.82, 0.12, frame)
  for (let row = 0; row < 14; row++) {
    createSurfacePanel(
      scene,
      `${name}-slat-${row}`,
      surface,
      facing,
      along,
      0.22 + row * 0.19,
      width - 0.16,
      0.055,
      0.055,
      slat,
      0.105,
    )
  }
}

function createWindow(
  scene: Scene,
  name: string,
  surface: Vector3,
  facing: TextPlaneFacing,
  along: number,
  y: number,
  width: number,
  height: number,
  frame: StandardMaterial,
  glass: StandardMaterial,
): void {
  createSurfacePanel(scene, `${name}-frame`, surface, facing, along, y, width + 0.22, height + 0.22, 0.12, frame)
  createSurfacePanel(scene, `${name}-glass`, surface, facing, along, y, width, height, 0.055, glass, 0.13)
  createSurfacePanel(scene, `${name}-mullion-v`, surface, facing, along, y, 0.075, height, 0.07, frame, 0.2)
  createSurfacePanel(scene, `${name}-mullion-h`, surface, facing, along, y, width, 0.075, 0.07, frame, 0.2)
}

function createAirConditioner(
  scene: Scene,
  name: string,
  surface: Vector3,
  facing: TextPlaneFacing,
  along: number,
  y: number,
  body: StandardMaterial,
  dark: StandardMaterial,
): void {
  const centre = surfacePoint(facing, surface, along, y, 0.32)
  const eastWest = facing === 'east' || facing === 'west'
  createBox(
    scene,
    `${name}-body`,
    eastWest
      ? { width: 0.62, height: 0.82, depth: 1.08 }
      : { width: 1.08, height: 0.82, depth: 0.62 },
    centre,
    body,
  )
  const fan = createCylinder(scene, `${name}-fan`, 0.07, 0.52, surfacePoint(facing, surface, along, y, 0.67), dark, 10)
  if (eastWest) fan.rotation.z = Math.PI / 2
  else fan.rotation.x = Math.PI / 2
}

function createVerticalPipe(
  scene: Scene,
  name: string,
  x: number,
  z: number,
  fromY: number,
  toY: number,
  material: StandardMaterial,
): void {
  const pipe = MeshBuilder.CreateTube(name, {
    path: [new Vector3(x, fromY, z), new Vector3(x, toY, z)],
    radius: 0.055,
    tessellation: 6,
    cap: Mesh.CAP_ALL,
  }, scene)
  pipe.material = material
}

function createCable(
  scene: Scene,
  name: string,
  start: Vector3,
  end: Vector3,
  sag: number,
  material: StandardMaterial,
): void {
  const points = Array.from({ length: 9 }, (_, index) => {
    const t = index / 8
    const point = Vector3.Lerp(start, end, t)
    point.y -= Math.sin(t * Math.PI) * sag
    return point
  })
  const cable = MeshBuilder.CreateTube(name, { path: points, radius: 0.027, tessellation: 5 }, scene)
  cable.material = material
}

function createLantern(
  scene: Scene,
  name: string,
  position: Vector3,
  paper: StandardMaterial,
  cap: StandardMaterial,
): void {
  createCylinder(scene, `${name}-paper`, 0.68, 0.38, position, paper, 8)
  createCylinder(scene, `${name}-top`, 0.08, 0.25, position.add(new Vector3(0, 0.37, 0)), cap, 8)
  createCylinder(scene, `${name}-bottom`, 0.08, 0.25, position.add(new Vector3(0, -0.37, 0)), cap, 8)
  createCylinder(scene, `${name}-cord`, 0.58, 0.035, position.add(new Vector3(0, 0.68, 0)), cap, 5)
}

function createVendingMachine(
  scene: Scene,
  surface: Vector3,
  body: StandardMaterial,
  panel: StandardMaterial,
  light: StandardMaterial,
): void {
  createBox(scene, 'vending-body', { width: 0.78, height: 2.05, depth: 1.15 }, new Vector3(surface.x - 0.39, 1.13, surface.z), body, true)
  createSurfacePanel(scene, 'vending-lit-panel', surface, 'west', 0, 1.45, 0.9, 1.18, 0.04, light, 0.015)
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4; column++) {
      createSurfacePanel(
        scene,
        `vending-product-${row}-${column}`,
        surface,
        'west',
        -0.32 + column * 0.21,
        1.78 - row * 0.25,
        0.13,
        0.11,
        0.025,
        column % 2 === 0 ? panel : body,
        0.06,
      )
    }
  }
  createSurfacePanel(scene, 'vending-slot', surface, 'west', 0.2, 0.55, 0.34, 0.12, 0.04, panel, 0.06)
}

function createBicycle(scene: Scene, name: string, x: number, z: number, material: StandardMaterial): void {
  const back = new Vector3(x, 0.58, z - 0.58)
  const front = new Vector3(x, 0.58, z + 0.58)
  for (const [key, centre] of [['back', back], ['front', front]] as const) {
    const wheel = MeshBuilder.CreateTorus(`${name}-${key}-wheel`, { diameter: 0.9, thickness: 0.045, tessellation: 12 }, scene)
    wheel.position.copyFrom(centre)
    wheel.rotation.z = Math.PI / 2
    wheel.material = material
  }
  const hub = new Vector3(x, 0.62, z)
  const seat = new Vector3(x, 1.18, z - 0.12)
  const handle = new Vector3(x, 1.26, z + 0.44)
  for (const [index, path] of [[back, hub, seat, back], [front, hub, handle, front], [hub, seat]].entries()) {
    const tube = MeshBuilder.CreateTube(`${name}-frame-${index}`, { path, radius: 0.035, tessellation: 5 }, scene)
    tube.material = material
  }
}

function createResident(
  scene: Scene,
  position: Vector3,
  coat: StandardMaterial,
  skin: StandardMaterial,
  dark: StandardMaterial,
): void {
  const body = MeshBuilder.CreateCylinder('resident-coat', {
    height: 1.18,
    diameterTop: 0.48,
    diameterBottom: 0.72,
    tessellation: 7,
  }, scene)
  body.position.copyFrom(position.add(new Vector3(0, 0.88, 0)))
  body.material = coat
  const head = MeshBuilder.CreateSphere('resident-head', { diameter: 0.38, segments: 5 }, scene)
  head.position.copyFrom(position.add(new Vector3(0, 1.66, 0)))
  head.material = skin
  createBox(scene, 'resident-hair', { width: 0.39, height: 0.18, depth: 0.38 }, position.add(new Vector3(0, 1.83, 0)), dark)
}

function createDebugLine(
  scene: Scene,
  name: string,
  points: readonly Vector3[],
  lineColor: string,
): Mesh {
  const line = MeshBuilder.CreateLines(name, { points: [...points] }, scene)
  line.color = color(lineColor)
  line.alpha = 0.72
  line.isVisible = false
  return line
}

function createTokyoAlley(scene: Scene): Environment {
  const concrete = createPixelSurfaceMaterial(scene, 'aged-concrete', '#4a4945', ['#343735', '#626058', '#292d2c'], 4, 2, 4)
  const greenPlaster = createPixelSurfaceMaterial(scene, 'green-plaster', '#45534d', ['#2e3b37', '#697067', '#303a36'], 7, 2, 3)
  const tiledWall = createPixelSurfaceMaterial(scene, 'small-tile', '#484b4a', ['#252b2b', '#696b66', '#353b3a'], 11, 4, 5)
  const asphalt = createPixelSurfaceMaterial(scene, 'rain-wet-asphalt', '#222725', ['#121716', '#3a403b', '#1c2220'], 16, 5, 8)
  asphalt.specularColor = color('#39443f')
  asphalt.specularPower = 32
  const rust = createPixelSurfaceMaterial(scene, 'rusted-metal', '#624638', ['#3b302c', '#8a5e43', '#292727'], 23, 2, 3)
  const shutter = createPixelSurfaceMaterial(scene, 'painted-shutter', '#5d625f', ['#373d3c', '#777a72', '#4a514f'], 31, 2, 3)
  const frame = createMaterial(scene, 'painted-frame', '#262b2a')
  const blackMetal = createMaterial(scene, 'black-metal', '#111615')
  const dirtyWhite = createMaterial(scene, 'dirty-white', '#aaa99d')
  const darkGlass = createMaterial(scene, 'dark-glass', '#131c1c', '#07100e')
  const warmGlass = createMaterial(scene, 'warm-glass', '#58472d', '#7b4d20')
  const counterLight = createMaterial(scene, 'counter-light', '#7a6b3d', '#b07828')
  const redLamp = createMaterial(scene, 'red-paper-lamp', '#8d2f23', '#bd3925')
  const amberLamp = createMaterial(scene, 'amber-paper-lamp', '#8f6a2d', '#b97824')
  const tealLamp = createMaterial(scene, 'teal-tube-light', '#315e58', '#378e82')
  const bluePlastic = createMaterial(scene, 'blue-plastic', '#2f4c55', '#0d2024')
  const thresholdGreen = createMaterial(scene, 'threshold-green', '#31483e', '#14251e')
  const crate = createMaterial(scene, 'wood-crate', '#67513a')
  const skin = createMaterial(scene, 'resident-skin', '#92705b')
  const coat = createMaterial(scene, 'resident-coat-material', '#31373b')
  const pulses: SignPulse[] = []

  createBox(scene, 'world-foundation', { width: 64, height: 0.3, depth: 72 }, new Vector3(4, -0.22, 1), asphalt)
  createBox(scene, 'main-alley-ground', { width: 7, height: 0.08, depth: 34 }, new Vector3(-0.05, 0, -5.8), asphalt)
  createBox(scene, 'side-alley-ground', { width: 17, height: 0.075, depth: 7 }, new Vector3(11.8, 0.005, 11.5), asphalt)
  for (let index = 0; index < 17; index++) {
    createBox(scene, `alley-paving-seam-${index}`, { width: 6.65, height: 0.018, depth: 0.035 }, new Vector3(-0.05, 0.052, -21.5 + index * 2), blackMetal)
  }
  createBox(scene, 'main-drain', { width: 0.24, height: 0.035, depth: 32 }, new Vector3(-2.98, 0.07, -5.8), blackMetal)
  for (let index = 0; index < 24; index++) {
    createBox(scene, `drain-slot-${index}`, { width: 0.34, height: 0.024, depth: 0.035 }, new Vector3(-2.98, 0.095, -20 + index * 1.25), rust)
  }

  createBox(scene, 'left-block', { width: 7, height: 13, depth: 40 }, new Vector3(-7, 6.5, -4), concrete, true)
  createBox(scene, 'left-upper-setback', { width: 6, height: 7, depth: 22 }, new Vector3(-7.6, 16.5, -1), greenPlaster, true)
  createBox(scene, 'right-front-block', { width: 6, height: 15, depth: 31 }, new Vector3(6.5, 7.5, -7.5), tiledWall, true)
  createBox(scene, 'right-front-rooftop', { width: 4.5, height: 6, depth: 16 }, new Vector3(7.2, 18, -8), concrete, true)
  createBox(scene, 'turn-block', { width: 7, height: 17, depth: 6 }, new Vector3(-2.5, 8.5, 18), greenPlaster, true)
  createBox(scene, 'side-south-block', { width: 17, height: 12, depth: 8 }, new Vector3(13.5, 6, 4), rust, true)
  createBox(scene, 'side-north-block', { width: 17, height: 14, depth: 8 }, new Vector3(13.5, 7, 19), concrete, true)
  createBox(scene, 'side-end-block', { width: 5, height: 16, depth: 15 }, new Vector3(23, 8, 11.5), tiledWall, true)

  const leftFace = new Vector3(-3.5, 0, -4)
  createShutter(scene, 'left-record-shutter', leftFace, 'east', -12, 3.4, frame, shutter)
  createShutter(scene, 'left-kissa-shutter', leftFace, 'east', -6.5, 3.8, frame, rust)
  createSurfacePanel(scene, 'left-service-door', leftFace, 'east', 1.2, 1.25, 1.65, 2.4, 0.12, blackMetal)
  createSurfacePanel(scene, 'left-door-handle', leftFace, 'east', 0.8, 1.25, 0.07, 0.34, 0.05, dirtyWhite, 0.19)
  for (const [index, z] of [-15, -10, -3.5, 3.5, 9].entries()) {
    createWindow(scene, `left-window-${index}`, leftFace, 'east', z, 5.15 + (index % 2) * 0.22, 2.25, 1.4, frame, index === 3 ? warmGlass : darkGlass)
  }
  createAwning(scene, 'kissa-awning', leftFace, 'east', -1.8, 3.25, 5.8, rust)
  createAirConditioner(scene, 'left-ac-lower', leftFace, 'east', 5.8, 3.9, dirtyWhite, blackMetal)
  createAirConditioner(scene, 'left-ac-upper', leftFace, 'east', -7.5, 8.1, dirtyWhite, blackMetal)
  createVerticalPipe(scene, 'left-drainpipe-a', -3.18, -14.2, 0.2, 10.8, rust)
  createVerticalPipe(scene, 'left-drainpipe-b', -3.2, 7.6, 0.2, 12.2, blackMetal)

  createProjectingSign(scene, { name: 'record-sign', label: 'RECORD', wallX: leftFace.x, y: 5.7, z: -9.8, side: 'left', width: 3.5, height: 0.92, foreground: '#e2bf63', background: '#432d25', border: '#765641', pulse: true }, blackMetal, pulses)
  createProjectingSign(scene, { name: 'kissa-sign', label: '純喫茶 白夜', wallX: leftFace.x, y: 6.75, z: -4.4, side: 'left', width: 4.5, height: 1.05, foreground: '#d64b32', background: '#232725', border: '#90734a', pulse: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'mahjong-sign', label: '麻雀東風', position: new Vector3(-3.24, 8.5, 1.8), facing: 'east', width: 1.22, height: 4.25, foreground: '#dcaa48', background: '#3d3428', vertical: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'shinjuku-address', label: '新宿区 歌舞伎町', position: new Vector3(-3.3, 3.85, 7.4), facing: 'east', width: 3.1, height: 0.72, foreground: '#ece5c7', background: '#31574f', border: '#a3a07f' }, blackMetal, pulses)

  const rightFace = new Vector3(3.5, 0, -7.5)
  createShutter(scene, 'right-game-shutter', rightFace, 'west', -8, 3.3, frame, shutter)
  createSurfacePanel(scene, 'right-counter-wall', rightFace, 'west', 1, 1.7, 5.2, 3.25, 0.12, rust)
  createWindow(scene, 'right-counter-window', rightFace, 'west', 1, 1.95, 3.65, 1.7, frame, warmGlass)
  createAwning(scene, 'right-counter-awning', rightFace, 'west', 1, 3.45, 5.5, greenPlaster)
  createSurfacePanel(scene, 'counter-service-shelf', rightFace, 'west', 1, 0.95, 3.7, 0.16, 0.55, crate, 0.42)
  for (const [index, z] of [-17.5, -12.5, -4, 5].entries()) {
    createWindow(scene, `right-window-${index}`, rightFace, 'west', z, 5.2 + (index % 2) * 0.25, 2.1, 1.3, frame, index === 3 ? warmGlass : darkGlass)
  }
  createAirConditioner(scene, 'right-ac-lower', rightFace, 'west', -2.6, 7.5, dirtyWhite, blackMetal)
  createAirConditioner(scene, 'right-ac-upper', rightFace, 'west', -11.5, 10.1, dirtyWhite, blackMetal)
  createVerticalPipe(scene, 'right-pipe-a', 3.16, -14.5, 0.2, 13.1, blackMetal)
  createVerticalPipe(scene, 'right-pipe-b', 3.18, 5.4, 0.2, 11.2, rust)

  createProjectingSign(scene, { name: 'game-sign', label: 'ゲーム', wallX: rightFace.x, y: 6.15, z: -12.4, side: 'right', width: 2.7, height: 0.9, foreground: '#74b7a5', background: '#202d2a', border: '#527c70' }, blackMetal, pulses)
  createProjectingSign(scene, { name: 'yakitori-sign', label: '焼鳥', wallX: rightFace.x, y: 5.3, z: -0.1, side: 'right', width: 4.2, height: 1, foreground: '#e15a3a', background: '#2c211e', border: '#9c553e', pulse: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'late-night-sign', label: '深夜営業', position: new Vector3(3.18, 7.7, 5.4), facing: 'west', width: 1.1, height: 3.75, foreground: '#d7ba53', background: '#25332d', vertical: true, pulse: true }, blackMetal, pulses)
  createLantern(scene, 'counter-lantern-a', new Vector3(2.86, 3.32, -0.3), redLamp, blackMetal)
  createLantern(scene, 'counter-lantern-b', new Vector3(2.86, 3.32, 0.75), amberLamp, blackMetal)
  createVendingMachine(scene, new Vector3(3.08, 0, -5), bluePlastic, redLamp, counterLight)

  const turnFace = new Vector3(-2.5, 0, 15)
  createSurfacePanel(scene, 'turn-wall-patch', turnFace, 'south', 0.7, 4.3, 4.8, 6.3, 0.12, tiledWall)
  createWindow(scene, 'turn-window-a', turnFace, 'south', -2.7, 6.2, 2.2, 1.65, frame, darkGlass)
  createWindow(scene, 'turn-window-b', turnFace, 'south', 1.4, 9, 2.25, 1.6, frame, darkGlass)
  createAirConditioner(scene, 'turn-ac', turnFace, 'south', -0.8, 11.2, dirtyWhite, blackMetal)
  createVerticalPipe(scene, 'turn-pipe', 1.2, 14.62, 0.2, 14.2, rust)
  createFramedSign(scene, { name: 'aoyagi-sign', label: 'スナック青柳', position: new Vector3(-1.35, 7.7, 14.72), facing: 'south', width: 5.8, height: 1.35, foreground: '#d84b32', background: '#2e332d', border: '#8e7344', pulse: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'coffee-sign', label: 'COFFEE', position: new Vector3(2.35, 4.65, 14.66), facing: 'south', width: 1.15, height: 3.4, foreground: '#e3c15c', background: '#3b3025', vertical: true, pulse: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'district-sign', label: '新宿二丁目', position: new Vector3(-2.2, 11.1, 14.68), facing: 'south', width: 3.8, height: 0.9, foreground: '#84b3a2', background: '#24312e', border: '#4c6f64' }, blackMetal, pulses)
  createBox(scene, 'turn-threshold', { width: 2.1, height: 0.18, depth: 1.15 }, new Vector3(2.48, 0.12, 11.3), crate)
  createBox(scene, 'turn-floor-light', { width: 3.2, height: 0.035, depth: 6.1 }, new Vector3(3.55, 0.08, 11.5), thresholdGreen)
  createBox(scene, 'turn-teal-light', { width: 1.8, height: 0.12, depth: 0.12 }, new Vector3(2.45, 3.65, 14.52), tealLamp)
  createFramedSign(scene, { name: 'alley-entry-sign', label: '入口', position: new Vector3(4.65, 3.2, 11.45), facing: 'west', width: 0.9, height: 2.5, foreground: '#e0b94e', background: '#24322c', vertical: true, pulse: true }, blackMetal, pulses)

  const northSideFace = new Vector3(12, 0, 15)
  createShutter(scene, 'side-north-shutter', northSideFace, 'south', -4.1, 4.1, frame, shutter)
  createWindow(scene, 'side-north-window-a', northSideFace, 'south', 2.5, 4.7, 2.2, 1.3, frame, darkGlass)
  createWindow(scene, 'side-north-window-b', northSideFace, 'south', 7.6, 5.2, 2.4, 1.5, frame, warmGlass)
  createAwning(scene, 'side-north-awning', northSideFace, 'south', 4.8, 3.35, 6.2, greenPlaster)
  createFramedSign(scene, { name: 'bar-sign', label: 'BAR こま', position: new Vector3(8.7, 6.1, 14.58), facing: 'south', width: 3.2, height: 0.88, foreground: '#7fc1ad', background: '#25312f', border: '#466d62', pulse: true }, blackMetal, pulses)
  createFramedSign(scene, { name: 'snack-sign', label: 'スナック', position: new Vector3(14.8, 7.4, 14.62), facing: 'south', width: 1.05, height: 3.6, foreground: '#d66b42', background: '#31231f', vertical: true }, blackMetal, pulses)

  const southSideFace = new Vector3(12, 0, 8)
  createWindow(scene, 'side-south-counter', southSideFace, 'north', 3.8, 2.2, 4.5, 1.8, frame, warmGlass)
  createAwning(scene, 'side-south-awning', southSideFace, 'north', 3.8, 3.55, 6.3, rust)
  createSurfacePanel(scene, 'side-south-shelf', southSideFace, 'north', 3.8, 1.05, 4.3, 0.18, 0.55, crate, 0.43)
  for (let index = 0; index < 4; index++) {
    createLantern(scene, `side-lantern-${index}`, new Vector3(11.3 + index * 1.05, 3.42, 8.58), index % 2 === 0 ? redLamp : amberLamp, blackMetal)
  }

  for (const [index, cratePosition] of [
    new Vector3(-2.82, 0.35, 5.6),
    new Vector3(-2.58, 0.72, 5.8),
    new Vector3(3.1, 0.31, 8.8),
    new Vector3(4.2, 0.42, 9.1),
    new Vector3(17.2, 0.34, 8.8),
  ].entries()) {
    createBox(scene, `street-crate-${index}`, { width: 0.7, height: 0.62, depth: 0.72 }, cratePosition, crate)
  }
  createBicycle(scene, 'delivery-bike', -3.02, 3.6, blackMetal)
  createResident(scene, new Vector3(16.6, 0, 11.8), coat, skin, blackMetal)

  for (const [index, z] of [-16, -8, 1, 8].entries()) {
    createCable(scene, `cross-cable-${index}`, new Vector3(-3.3, 8.8 + index * 0.4, z), new Vector3(3.3, 9.6 + index * 0.25, z + 0.5), 0.55, blackMetal)
  }
  createCable(scene, 'turn-cable-a', new Vector3(-3.2, 12.6, 8), new Vector3(8, 11.5, 14.8), 1.3, blackMetal)
  createCable(scene, 'side-cable-a', new Vector3(3.8, 9.5, 8.2), new Vector3(18.5, 10.3, 14.7), 1.5, blackMetal)

  const warmPoint = new PointLight('counter-warm-light', new Vector3(2.5, 3.4, 0.4), scene)
  warmPoint.diffuse = color('#d47a38')
  warmPoint.intensity = 0.62
  warmPoint.range = 8
  const turnPoint = new PointLight('turn-amber-light', new Vector3(2.5, 4.1, 12.2), scene)
  turnPoint.diffuse = color('#d89a45')
  turnPoint.intensity = 0.9
  turnPoint.range = 10
  const doorwayPoint = new PointLight('doorway-green-light', new Vector3(4.2, 2.8, 11.5), scene)
  doorwayPoint.diffuse = color('#7e9f6b')
  doorwayPoint.intensity = 0.78
  doorwayPoint.range = 7
  const redPoint = new PointLight('upper-red-light', new Vector3(-2.4, 7.5, -4.2), scene)
  redPoint.diffuse = color('#a53b2c')
  redPoint.intensity = 0.55
  redPoint.range = 9
  const tealPoint = new PointLight('side-teal-light', new Vector3(10.5, 4.5, 13.2), scene)
  tealPoint.diffuse = color('#3f8f80')
  tealPoint.intensity = 0.52
  tealPoint.range = 9
  const entryPoint = new PointLight('entry-soft-light', new Vector3(0, 5.5, -10), scene)
  entryPoint.diffuse = color('#89917a')
  entryPoint.intensity = 0.85
  entryPoint.range = 19

  const debugMeshes = [
    createDebugLine(scene, 'debug-main-route', [new Vector3(0, 0.14, -21), new Vector3(0, 0.14, 11.5), new Vector3(20, 0.14, 11.5)], '#e3b64f'),
    createDebugLine(scene, 'debug-left-bound', [new Vector3(-3.5, 0.15, -22), new Vector3(-3.5, 0.15, 15)], '#45a898'),
    createDebugLine(scene, 'debug-right-bound', [new Vector3(3.5, 0.15, -22), new Vector3(3.5, 0.15, 8)], '#45a898'),
    createDebugLine(scene, 'debug-side-north', [new Vector3(3.5, 0.15, 15), new Vector3(20.5, 0.15, 15)], '#bd4d35'),
    createDebugLine(scene, 'debug-side-south', [new Vector3(3.5, 0.15, 8), new Vector3(20.5, 0.15, 8)], '#bd4d35'),
  ]
  return { debugMeshes, pulses }
}

/** A navigable PS1-inspired Shinjuku alley shaped by the approved Kowloon's Gate target. */
export function createTokyoNeonScene(context: BabylonSceneContext): BabylonSceneController {
  const scene = new Scene(context.engine)
  scene.clearColor = new Color4(0.018, 0.023, 0.021, 1)
  scene.ambientColor = color('#20251f')
  scene.fogMode = Scene.FOGMODE_LINEAR
  scene.fogStart = 17
  scene.fogEnd = 42
  scene.fogColor = color('#111814')
  scene.collisionsEnabled = true
  scene.imageProcessingConfiguration.exposure = 1.14
  scene.imageProcessingConfiguration.contrast = 1.16

  const camera = new UniversalCamera('alley-walk-camera', SPAWN.clone(), scene)
  camera.setTarget(LOOK_AT)
  camera.minZ = 0.08
  camera.maxZ = 52
  camera.fov = 0.86
  camera.speed = 0.18
  camera.inertia = 0
  camera.angularSensibility = 3800
  camera.ellipsoid = new Vector3(0.42, 0.8, 0.42)
  camera.checkCollisions = true
  camera.keysUp = [87, 38]
  camera.keysDown = [83, 40]
  camera.keysLeft = [65, 37]
  camera.keysRight = [68, 39]
  camera.inputs.removeByType('FreeCameraKeyboardMoveInput')

  let viewportWidth = -1
  let viewportHeight = -1
  const updateFourThreeViewport = (): void => {
    const width = context.engine.getRenderWidth()
    const height = context.engine.getRenderHeight()
    if (width === viewportWidth && height === viewportHeight) return
    viewportWidth = width
    viewportHeight = height
    const canvasAspect = width / Math.max(1, height)
    const targetAspect = 4 / 3
    if (canvasAspect > targetAspect) {
      const normalizedWidth = targetAspect / canvasAspect
      camera.viewport = new Viewport((1 - normalizedWidth) / 2, 0, normalizedWidth, 1)
    } else {
      const normalizedHeight = canvasAspect / targetAspect
      camera.viewport = new Viewport(0, (1 - normalizedHeight) / 2, 1, normalizedHeight)
    }
  }
  updateFourThreeViewport()
  scene.onBeforeRenderObservable.add(updateFourThreeViewport)

  const ambient = new HemisphericLight('alley-fill', new Vector3(-0.2, 1, 0.25), scene)
  ambient.intensity = 0.78
  ambient.diffuse = color('#879184')
  ambient.groundColor = color('#111410')

  const pipeline = new DefaultRenderingPipeline('ps1-alley-pipeline', true, scene, [camera])
  pipeline.fxaaEnabled = false
  pipeline.bloomEnabled = false
  pipeline.grainEnabled = true
  pipeline.grain.intensity = 2.4
  pipeline.grain.animated = false
  const environment = createTokyoAlley(scene)
  const rainEmitter = camera.position.clone()
  createRain(scene, rainEmitter)

  let mode: WorkspaceMode = 'play'
  let active = false
  let previousPosition = camera.position.clone()
  let velocityX = 0
  let velocityZ = 0
  let motionPhase = 0
  let motionState = 'idle'
  let interaction: string | null = 'WASD/arrows move · drag to look · R resets · 1–5 review views'

  const syncControls = (): void => {
    if (active && mode === 'play') camera.attachControl(context.canvas, true)
    else camera.detachControl()
  }
  const setCameraView = (position: Vector3, target: Vector3): void => {
    camera.position.copyFrom(position)
    camera.cameraDirection.setAll(0)
    camera.cameraRotation.setAll(0)
    camera.setTarget(target)
    previousPosition.copyFrom(camera.position)
    velocityX = 0
    velocityZ = 0
    motionState = 'idle'
  }

  return {
    id: 'neon-crossing',
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
      for (const mesh of environment.debugMeshes) mesh.isVisible = visible
    },
    update: (deltaSeconds, elapsedMs) => {
      const dt = Math.max(0, Math.min(0.04, deltaSeconds))
      if (mode === 'play' && context.input.consume('KeyR')) {
        setCameraView(SPAWN, LOOK_AT)
        motionPhase = 0
        interaction = 'returned to the neon crossing entrance'
      }
      if (mode === 'play') {
        const reviewView = REVIEW_VIEWS.find((view) => context.input.consume(view.code))
        if (reviewView !== undefined) {
          setCameraView(reviewView.position, reviewView.target)
          interaction = `review view · ${reviewView.label}`
        }
      }
      if (mode === 'play' && dt > 0) {
        const forward = camera.getDirection(Vector3.Forward())
        const right = camera.getDirection(Vector3.Right())
        forward.y = 0
        right.y = 0
        forward.normalize()
        right.normalize()
        const movement = Vector3.Zero()
        if (context.input.isDown('KeyW', 'ArrowUp')) movement.addInPlace(forward)
        if (context.input.isDown('KeyS', 'ArrowDown')) movement.subtractInPlace(forward)
        if (context.input.isDown('KeyD', 'ArrowRight')) movement.addInPlace(right)
        if (context.input.isDown('KeyA', 'ArrowLeft')) movement.subtractInPlace(right)
        if (movement.lengthSquared() > 0) {
          movement.normalize().scaleInPlace(WALK_SPEED * dt)
          camera.cameraDirection.addInPlace(movement)
        }
      }

      camera.position.y = EYE_HEIGHT
      rainEmitter.copyFrom(camera.position)
      const seconds = elapsedMs / 1000
      for (const pulse of environment.pulses) {
        const slowPulse = 0.82 + Math.sin(seconds * pulse.speed + pulse.phase) * 0.12
        const transformerDrop = Math.sin(seconds * 17.3 + pulse.phase) > 0.975 ? 0.58 : 1
        if (pulse.material.emissiveTexture !== null) {
          pulse.material.emissiveTexture.level = slowPulse * transformerDrop
        }
      }
      if (dt > 0) {
        const deltaX = camera.position.x - previousPosition.x
        const deltaZ = camera.position.z - previousPosition.z
        velocityX = deltaX / dt
        velocityZ = deltaZ / dt
        const distance = Math.hypot(deltaX, deltaZ)
        motionState = distance > 0.0001 ? 'walk' : 'idle'
        motionPhase = (motionPhase + distance / 3.2) % 1
        previousPosition.copyFrom(camera.position)
      }
    },
    snapshot: (): RuntimeSnapshot => ({
      scene: 'neon-crossing',
      mode,
      playerX: Number(camera.position.x.toFixed(2)),
      playerY: Number(camera.position.y.toFixed(2)),
      playerDepth: Number(camera.position.z.toFixed(2)),
      playerFacing: Math.sin(camera.rotation.y) < 0 ? 'left' : 'right',
      motionState,
      motionPhase: Number(motionPhase.toFixed(3)),
      velocityX: Number(velocityX.toFixed(2)),
      velocityY: Number(velocityZ.toFixed(2)),
      interaction,
      fps: Math.round(context.engine.getFps()),
    }),
    dispose: () => {
      camera.detachControl()
      pipeline.dispose()
      scene.dispose()
    },
  }
}
