import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Color3 } from '@babylonjs/core/Maths/math.color.js'
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder.js'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.js'
import { Mesh } from '@babylonjs/core/Meshes/mesh.js'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js'
import type { Scene } from '@babylonjs/core/scene.js'
import { MECHA_FOOT_OFFSET, PCB_PULSE_ROUTE, PCB_ROOM_WORLD } from './pcbRoom.ts'

const BOARD_RAISED = new Color3(0.055, 0.085, 0.082)
const BOARD_EDGE = new Color3(0.095, 0.145, 0.135)
const CHIP = new Color3(0.035, 0.047, 0.048)
const CHIP_FACE = new Color3(0.075, 0.092, 0.09)
const CHIP_BEVEL = new Color3(0.145, 0.165, 0.158)
const COPPER = new Color3(0.59, 0.38, 0.19)
const COPPER_LIGHT = new Color3(0.86, 0.63, 0.32)
const COPPER_DARK = new Color3(0.27, 0.15, 0.07)
const SOLDER = new Color3(0.43, 0.49, 0.47)
const SOLDER_LIGHT = new Color3(0.7, 0.76, 0.72)
const CHAR = new Color3(0.025, 0.022, 0.019)
const BURNT_COPPER = new Color3(0.24, 0.095, 0.035)
const SIGNAL = new Color3(0.19, 0.96, 0.78)
const SIGNAL_IDLE = new Color3(0.13, 0.25, 0.23)

type PcbRoomVisuals = {
  /** Updates the native Babylon meshes and returns the discharge's world x. */
  update(timeMs: number, checkpointActive: boolean): number
}

function createMaterial(
  name: string,
  color: Color3,
  scene: Scene,
  alpha = 1,
): StandardMaterial {
  const material = new StandardMaterial(name, scene)
  material.disableLighting = true
  material.diffuseColor = color
  material.emissiveColor = color
  material.specularColor = Color3.Black()
  material.alpha = alpha
  material.backFaceCulling = false
  return material
}

export function createPcbRoomVisuals(scene: Scene): PcbRoomVisuals {
  const root = new TransformNode('colossal-pcb-room', scene)

  const boardRaised = createMaterial('pcb-mask-raised', BOARD_RAISED, scene)
  const boardEdge = createMaterial('pcb-mask-edge', BOARD_EDGE, scene)
  const chip = createMaterial('component-epoxy', CHIP, scene)
  const chipFace = createMaterial('component-face', CHIP_FACE, scene)
  const chipBevel = createMaterial('component-bevel', CHIP_BEVEL, scene)
  const copper = createMaterial('exposed-copper', COPPER, scene)
  const copperLight = createMaterial('polished-copper', COPPER_LIGHT, scene)
  const copperDark = createMaterial('recessed-copper', COPPER_DARK, scene)
  const solder = createMaterial('solder', SOLDER, scene)
  const solderLight = createMaterial('solder-highlight', SOLDER_LIGHT, scene)
  const char = createMaterial('burnt-substrate', CHAR, scene, 0.98)
  const burntCopper = createMaterial('burnt-copper', BURNT_COPPER, scene)
  const distantChip = createMaterial('distant-component', CHIP, scene, 0.88)
  const distantFace = createMaterial('distant-component-face', CHIP_FACE, scene, 0.72)
  const distantCopper = createMaterial('distant-copper', COPPER, scene, 0.36)
  const distantMetal = createMaterial('distant-metal', SOLDER, scene, 0.42)
  const pulseMaterial = createMaterial('electrical-discharge', SIGNAL, scene, 0.98)
  const pulseHaloMaterial = createMaterial('electrical-discharge-halo', SIGNAL, scene, 0.13)
  const checkpointMaterial = createMaterial('checkpoint-contact', SIGNAL_IDLE, scene, 0.9)

  const panel = (
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    z: number,
    material: StandardMaterial,
    rotation = 0,
    parent: TransformNode = root,
  ): Mesh => {
    const mesh = CreatePlane(name, { width, height }, scene)
    mesh.position.set(x, y, z)
    mesh.rotation.z = rotation
    mesh.material = material
    mesh.parent = parent
    mesh.isPickable = false
    return mesh
  }

  const polygon = (
    name: string,
    points: readonly (readonly [number, number])[],
    z: number,
    material: StandardMaterial,
    parent: TransformNode = root,
  ): Mesh => {
    const mesh = new Mesh(name, scene)
    const positions = points.flatMap(([x, y]) => [x, y, 0])
    const indices: number[] = []
    for (let index = 1; index < points.length - 1; index++) indices.push(0, index, index + 1)
    const normals: number[] = []
    VertexData.ComputeNormals(positions, indices, normals)
    const data = new VertexData()
    data.positions = positions
    data.indices = indices
    data.normals = normals
    data.applyToMesh(mesh)
    mesh.position.z = z
    mesh.material = material
    mesh.parent = parent
    mesh.isPickable = false
    return mesh
  }

  const segment = (
    name: string,
    from: readonly [number, number],
    to: readonly [number, number],
    width: number,
    z: number,
    material: StandardMaterial,
    parent: TransformNode = root,
  ): Mesh => {
    const deltaX = to[0] - from[0]
    const deltaY = to[1] - from[1]
    return panel(
      name,
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      Math.hypot(deltaX, deltaY),
      width,
      z,
      material,
      Math.atan2(deltaY, deltaX),
      parent,
    )
  }

  const disc = (
    name: string,
    x: number,
    y: number,
    radius: number,
    z: number,
    material: StandardMaterial,
    scaleX = 1,
    scaleY = 1,
    parent: TransformNode = root,
  ): Mesh => {
    const mesh = CreateDisc(name, { radius, tessellation: 40 }, scene)
    mesh.position.set(x, y, z)
    mesh.scaling.set(scaleX, scaleY, 1)
    mesh.material = material
    mesh.parent = parent
    mesh.isPickable = false
    return mesh
  }

  const ring = (
    name: string,
    x: number,
    y: number,
    radius: number,
    z: number,
    outerMaterial: StandardMaterial,
    innerMaterial: StandardMaterial,
  ): void => {
    disc(`${name}-outer`, x, y, radius, z, outerMaterial)
    disc(`${name}-inner`, x, y, radius * 0.48, z - 0.015, innerMaterial)
    disc(`${name}-glint`, x - radius * 0.22, y + radius * 0.26, radius * 0.13, z - 0.025, solderLight)
  }

  const surfaceY = (id: string): number => {
    const surface = PCB_ROOM_WORLD.surfaces.find((candidate) => candidate.id === id)
    if (surface === undefined) throw new Error(`missing PCB surface ${id}`)
    return surface.rootY - MECHA_FOOT_OFFSET
  }

  // A processor package dominates the back wall. Its scale and fan-out make
  // the playable mecha read as a maintenance unit inside real hardware.
  polygon('processor-shadow', [
    [-2.78, 1.18], [2.82, 1.18], [3.16, 1.52], [3.16, 3.9],
    [2.82, 4.24], [-2.78, 4.24], [-3.12, 3.9], [-3.12, 1.52],
  ], 2.72, char)
  polygon('processor-package', [
    [-2.58, 1.34], [2.62, 1.34], [2.94, 1.66], [2.94, 3.72],
    [2.62, 4.04], [-2.58, 4.04], [-2.9, 3.72], [-2.9, 1.66],
  ], 2.62, distantChip)
  polygon('processor-face', [
    [-2.25, 1.58], [2.3, 1.58], [2.64, 1.91], [2.64, 3.49],
    [2.3, 3.81], [-2.25, 3.81], [-2.58, 3.49], [-2.58, 1.91],
  ], 2.56, distantFace)
  polygon('processor-die', [
    [-1.05, 2.02], [1.13, 2.02], [1.38, 2.27], [1.38, 3.25],
    [1.13, 3.5], [-1.05, 3.5], [-1.3, 3.25], [-1.3, 2.27],
  ], 2.5, distantChip)
  panel('processor-die-sheen', 0.04, 3.39, 2.08, 0.07, 2.46, distantMetal)

  for (let pin = 0; pin < 11; pin++) {
    const pinX = -2.35 + pin * 0.47
    panel(`processor-pin-bottom-${pin}`, pinX, 1.2, 0.18, 0.34, 2.52, distantCopper)
    panel(`processor-pin-top-${pin}`, pinX, 4.17, 0.18, 0.28, 2.55, distantCopper)
  }
  for (let pin = 0; pin < 5; pin++) {
    const pinY = 1.85 + pin * 0.46
    panel(`processor-pin-left-${pin}`, -3.03, pinY, 0.34, 0.15, 2.52, distantCopper)
    panel(`processor-pin-right-${pin}`, 3.07, pinY, 0.34, 0.15, 2.52, distantCopper)
  }

  const fanOut: readonly (readonly [readonly [number, number], readonly [number, number], readonly [number, number]])[] = [
    [[-2.3, 1.06], [-3.25, 0.7], [-4.72, 0.7]],
    [[-1.82, 1.06], [-2.95, 0.46], [-4.75, 0.46]],
    [[-1.34, 1.06], [-2.35, 0.22], [-4.8, 0.22]],
    [[1.42, 1.06], [2.45, 0.42], [4.28, 0.42]],
    [[1.9, 1.06], [2.95, 0.68], [4.62, 0.68]],
    [[2.36, 1.06], [3.33, 0.92], [4.96, 0.92]],
  ]
  fanOut.forEach((path, index) => {
    segment(`processor-fanout-a-${index}`, path[0], path[1], 0.065, 2.38, distantCopper)
    segment(`processor-fanout-b-${index}`, path[1], path[2], 0.065, 2.38, distantCopper)
    disc(`processor-fanout-pad-${index}`, path[2][0], path[2][1], 0.115, 2.35, distantCopper)
  })

  // Left: a heat sink and its fins create a hard, mechanical silhouette.
  panel('heat-sink-base', -6.62, 1.46, 2.25, 0.28, 2.46, distantMetal)
  for (let fin = 0; fin < 7; fin++) {
    const x = -7.46 + fin * 0.28
    polygon(`heat-sink-fin-${fin}`, [
      [x, 1.56], [x + 0.18, 1.56], [x + 0.1, 3.68], [x - 0.05, 3.68],
    ], 2.48, distantMetal)
  }

  // Right: two oversized capacitors give the room a second recognizable
  // landmark and break up the flat circuit-board vocabulary.
  const capacitor = (name: string, x: number, baseY: number, width: number, height: number): void => {
    panel(`${name}-shadow`, x + 0.12, baseY + height * 0.47, width, height, 2.6, char)
    panel(`${name}-body`, x, baseY + height * 0.5, width, height, 2.48, distantChip)
    panel(`${name}-left-shade`, x - width * 0.4, baseY + height * 0.5, width * 0.18, height, 2.43, distantFace)
    disc(`${name}-cap`, x, baseY + height, width * 0.5, 2.4, distantMetal, 1, 0.28)
    disc(`${name}-base`, x, baseY, width * 0.5, 2.43, distantChip, 1, 0.22)
    panel(`${name}-vent-a`, x, baseY + height + 0.01, width * 0.48, 0.035, 2.34, distantChip, 0.42)
    panel(`${name}-vent-b`, x, baseY + height + 0.01, width * 0.48, 0.035, 2.34, distantChip, -0.42)
  }
  capacitor('capacitor-large', 6.43, 1.56, 1.36, 2.15)
  capacitor('capacitor-small', 4.92, 1.76, 0.88, 1.42)

  // Sparse buried traces remain subordinate to the component silhouettes.
  const buriedPaths: readonly (readonly [readonly [number, number], readonly [number, number]])[] = [
    [[-7.8, -3.42], [-6.18, -3.42]], [[-6.18, -3.42], [-6.18, -2.7]],
    [[-4.9, -3.08], [-3.28, -3.08]], [[3.15, -3.2], [4.9, -3.2]],
    [[4.9, -3.2], [4.9, -2.68]], [[5.32, -2.68], [7.8, -2.68]],
  ]
  buriedPaths.forEach(([from, to], index) => {
    segment(`buried-trace-${index}`, from, to, 0.07, 2.5, distantCopper)
  })

  // Central route: the top of a BGA package is the starting runway.
  const centralY = surfaceY('central-service-pad')
  polygon('bga-package-shadow', [
    [-1.58, centralY - 0.15], [1.58, centralY - 0.15], [1.78, centralY - 0.38],
    [1.78, centralY - 1.42], [1.55, centralY - 1.65], [-1.55, centralY - 1.65],
    [-1.78, centralY - 1.42], [-1.78, centralY - 0.38],
  ], 1.38, char)
  polygon('bga-package', [
    [-1.45, centralY], [1.45, centralY], [1.64, centralY - 0.2],
    [1.64, centralY - 1.28], [1.42, centralY - 1.5], [-1.42, centralY - 1.5],
    [-1.64, centralY - 1.28], [-1.64, centralY - 0.2],
  ], 1.23, chip)
  panel('bga-top-bevel', 0, centralY - 0.055, 2.88, 0.11, 1.12, chipBevel)
  panel('bga-face', 0, centralY - 0.72, 2.98, 1.17, 1.16, chipFace)
  polygon('bga-face-shadow', [
    [-1.49, centralY - 1.1], [1.49, centralY - 1.1], [1.42, centralY - 1.5],
    [-1.42, centralY - 1.5],
  ], 1.08, chip)
  ring('service-hatch', 0, centralY - 0.68, 0.43, 1.01, solder, chip)
  for (let ball = 0; ball < 7; ball++) {
    disc(`bga-ball-${ball}`, -1.2 + ball * 0.4, centralY - 1.6, 0.115, 1.05, solder)
    disc(`bga-ball-highlight-${ball}`, -1.23 + ball * 0.4, centralY - 1.56, 0.035, 1.01, solderLight)
  }

  // Right route: an exposed power rail emerges from under the package. Its
  // torn end and charred crater explain the jump instead of merely marking it.
  const busY = surfaceY('right-data-bus')
  polygon('power-rail-mask', [
    [1.4, busY - 0.06], [4.32, busY - 0.06], [4.2, busY - 0.44],
    [3.58, busY - 0.38], [3.02, busY - 0.46], [2.34, busY - 0.36],
    [1.68, busY - 0.44], [1.4, busY - 0.31],
  ], 1.3, boardEdge)
  polygon('power-rail-copper', [
    [1.4, busY], [4.28, busY], [4.17, busY - 0.24], [3.6, busY - 0.2],
    [3.02, busY - 0.29], [2.34, busY - 0.2], [1.68, busY - 0.27],
    [1.4, busY - 0.18],
  ], 1.13, copper)
  panel('power-rail-running-edge', 2.82, busY - 0.025, 2.78, 0.05, 1.02, copperLight)
  for (const [index, x] of [2.05, 2.92, 3.72].entries()) {
    disc(`power-rail-rivet-${index}`, x, busY - 0.16, 0.085, 1.01, solder)
    disc(`power-rail-rivet-glint-${index}`, x - 0.018, busY - 0.13, 0.022, 0.98, solderLight)
  }

  const checkpointY = surfaceY('right-checkpoint-pad')
  polygon('burn-crater', [
    [4.03, busY - 0.07], [4.22, busY + 0.15], [4.45, busY + 0.03],
    [4.62, busY + 0.16], [4.79, busY - 0.01], [5.03, busY + 0.1],
    [5.27, busY - 0.11], [5.13, busY - 0.64], [4.72, busY - 0.78],
    [4.24, busY - 0.62],
  ], 1.39, char)
  polygon('burnt-rail-left', [
    [4.02, busY], [4.3, busY], [4.18, busY - 0.23], [4.02, busY - 0.18],
  ], 1.01, burntCopper)
  polygon('burnt-rail-right', [
    [5.2, checkpointY], [5.42, checkpointY], [5.42, checkpointY - 0.2],
    [5.27, checkpointY - 0.25],
  ], 1.01, burntCopper)
  const charredFragments = [[4.42, busY - 0.29], [4.68, busY - 0.49], [4.92, busY - 0.27]] as const
  for (const [index, point] of charredFragments.entries()) {
    disc(`charred-fragment-${index}`, point[0], point[1], 0.07 + index * 0.012, 1.02, burntCopper, 1.5, 0.62)
  }

  // The far landing is a physical test fixture. Its contact changes material
  // when synchronized, so the checkpoint remains diegetic.
  polygon('test-fixture-shadow', [
    [5.12, checkpointY - 0.12], [7.52, checkpointY - 0.12],
    [7.68, checkpointY - 0.3], [7.68, checkpointY - 1.45],
    [7.5, checkpointY - 1.65], [5.12, checkpointY - 1.65],
  ], 1.4, char)
  polygon('test-fixture', [
    [5.2, checkpointY], [7.4, checkpointY], [7.58, checkpointY - 0.2],
    [7.58, checkpointY - 1.33], [7.4, checkpointY - 1.52],
    [5.2, checkpointY - 1.52],
  ], 1.23, boardRaised)
  panel('test-fixture-top', 6.3, checkpointY - 0.055, 2.18, 0.11, 1.1, copperLight)
  panel('test-fixture-face', 6.38, checkpointY - 0.72, 2.15, 1.15, 1.13, chipFace)
  ring('checkpoint-socket', 6.25, checkpointY - 0.68, 0.47, 1.01, checkpointMaterial, chip)
  panel('test-probe-left', 5.57, checkpointY - 0.75, 0.16, 0.54, 1.02, copper)
  panel('test-probe-right', 6.93, checkpointY - 0.75, 0.16, 0.54, 1.02, copper)

  // Left route: oversized gull-wing leads climb onto a controller package.
  const terminalY = surfaceY('left-terminal-bank')
  panel('terminal-support-shadow', -2.05, terminalY - 0.31, 1.22, 0.62, 1.34, char)
  panel('terminal-contact-surface', -2.05, terminalY - 0.045, 1.2, 0.09, 1.03, solderLight)
  for (let pin = 0; pin < 5; pin++) {
    const x = -2.53 + pin * 0.24
    polygon(`gull-wing-pin-${pin}`, [
      [x - 0.08, terminalY], [x + 0.08, terminalY],
      [x + 0.06, terminalY - 0.22], [x + 0.13, centralY + 0.03],
      [x + 0.08, centralY - 0.09], [x - 0.08, centralY - 0.09],
      [x - 0.13, centralY + 0.06], [x - 0.06, terminalY - 0.24],
    ], 1.08, solder)
    panel(`gull-wing-glint-${pin}`, x - 0.025, terminalY - 0.08, 0.035, 0.22, 1.01, solderLight, -0.08)
  }

  const controllerY = surfaceY('left-controller-chip')
  polygon('controller-shadow', [
    [-5.98, controllerY - 0.12], [-2.55, controllerY - 0.12],
    [-2.4, controllerY - 0.34], [-2.55, controllerY - 1.55],
    [-5.98, controllerY - 1.55], [-6.12, controllerY - 1.34],
  ], 1.4, char)
  polygon('controller-package', [
    [-5.85, controllerY], [-2.65, controllerY], [-2.5, controllerY - 0.2],
    [-2.62, controllerY - 1.35], [-5.85, controllerY - 1.35],
    [-6, controllerY - 1.16], [-6, controllerY - 0.2],
  ], 1.23, chip)
  panel('controller-top-bevel', -4.25, controllerY - 0.055, 3.16, 0.11, 1.08, chipBevel)
  panel('controller-face', -4.25, controllerY - 0.7, 3.08, 1.08, 1.14, chipFace)
  disc('controller-index-notch', -5.38, controllerY - 0.22, 0.17, 1.02, chip, 1, 0.58)
  disc('controller-index-dot', -5.23, controllerY - 0.48, 0.075, 1.01, chipBevel)
  for (let pin = 0; pin < 6; pin++) {
    panel(`controller-lower-pin-${pin}`, -5.55 + pin * 0.53, controllerY - 1.42, 0.27, 0.18, 1.07, copper)
  }

  const connectorY = surfaceY('left-connector')
  polygon('edge-connector-shadow', [
    [-7.55, connectorY - 0.13], [-5.72, connectorY - 0.13],
    [-5.6, connectorY - 0.34], [-5.72, connectorY - 1.22],
    [-7.55, connectorY - 1.22],
  ], 1.38, char)
  polygon('edge-connector', [
    [-7.4, connectorY], [-5.85, connectorY], [-5.7, connectorY - 0.2],
    [-5.82, connectorY - 1.05], [-7.4, connectorY - 1.05],
  ], 1.22, boardRaised)
  panel('edge-connector-lip', -6.625, connectorY - 0.055, 1.54, 0.11, 1.08, boardEdge)
  for (let finger = 0; finger < 4; finger++) {
    const x = -7.19 + finger * 0.39
    polygon(`edge-connector-finger-${finger}`, [
      [x - 0.12, connectorY - 0.14], [x + 0.12, connectorY - 0.14],
      [x + 0.09, connectorY - 0.88], [x - 0.09, connectorY - 0.88],
    ], 1.02, copperLight)
    panel(`edge-connector-finger-shade-${finger}`, x + 0.07, connectorY - 0.51, 0.035, 0.72, 0.99, copperDark)
  }

  // A small traveling arc replaces the previous generic vertical bar.
  const discharge = new TransformNode('traveling-electrical-discharge', scene)
  discharge.parent = root
  discharge.position.set(PCB_PULSE_ROUTE.left, busY + 0.02, -0.16)
  const pulseHalo = disc('discharge-halo', 0, 0.42, 0.42, 0, pulseHaloMaterial, 0.72, 1.28, discharge)
  const arcPoints: readonly (readonly [number, number])[] = [
    [-0.17, 0.06], [0.1, 0.22], [-0.09, 0.39], [0.15, 0.57],
    [-0.04, 0.73], [0.11, 0.91],
  ]
  const arcSegments = arcPoints.slice(0, -1).map((point, index) => segment(
    `discharge-arc-${index}`,
    point,
    arcPoints[index + 1]!,
    0.065,
    -0.04,
    pulseMaterial,
    discharge,
  ))
  disc('discharge-contact', 0, 0.06, 0.12, -0.05, pulseMaterial, 1.45, 0.46, discharge)

  return {
    update: (timeMs, checkpointActive) => {
      const phase = (timeMs % PCB_PULSE_ROUTE.periodMs) / PCB_PULSE_ROUTE.periodMs
      const travel = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5
      const pulseX = PCB_PULSE_ROUTE.left
        + (PCB_PULSE_ROUTE.right - PCB_PULSE_ROUTE.left) * travel
      discharge.position.x = pulseX
      const flicker = 0.86 + Math.sin(timeMs * 0.021) * 0.14
      discharge.scaling.y = flicker
      discharge.rotation.z = Math.sin(timeMs * 0.016) * 0.035
      pulseHalo.scaling.x = 0.68 + flicker * 0.08
      pulseHalo.scaling.y = 1.12 + flicker * 0.2
      pulseHaloMaterial.alpha = 0.09 + flicker * 0.07
      arcSegments.forEach((arc, index) => {
        arc.scaling.x = 0.9 + Math.sin(timeMs * 0.027 + index) * 0.12
      })
      checkpointMaterial.emissiveColor.copyFrom(checkpointActive ? SIGNAL : SIGNAL_IDLE)
      checkpointMaterial.diffuseColor.copyFrom(checkpointActive ? SIGNAL : SIGNAL_IDLE)
      return pulseX
    },
  }
}
