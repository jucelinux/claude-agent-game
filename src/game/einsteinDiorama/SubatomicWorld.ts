import { GlowLayer } from '@babylonjs/core/Layers/glowLayer.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Color3 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.js'
import type { Mesh } from '@babylonjs/core/Meshes/mesh.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js'
import type { Scene } from '@babylonjs/core/scene.js'

export type PhotonKind = 'particle' | 'wave'

type Photon = {
  readonly kind: PhotonKind
  readonly root: TransformNode
  readonly direction: Vector3
  readonly speed: number
  readonly waveTube?: Mesh
  age: number
}

type QuantumNucleus = {
  readonly root: TransformNode
  readonly electronPivots: readonly TransformNode[]
  readonly phase: number
}

type QuantumMote = {
  readonly mesh: AbstractMesh
  readonly baseY: number
  readonly phase: number
}

export type SubatomicWorld = {
  readonly aimingGround: AbstractMesh
  fire(kind: PhotonKind, origin: Vector3, direction: Vector3): void
  setAimPoint(point: Vector3 | null): void
  update(deltaSeconds: number, timeMs: number): void
}

const PARTICLE_COLOR = new Color3(1, 0.64, 0.16)
const WAVE_COLOR = new Color3(0.18, 0.9, 1)
const PROTON_COLOR = new Color3(1, 0.19, 0.46)
const NEUTRON_COLOR = new Color3(0.38, 0.28, 0.85)

function emissiveMaterial(
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

function wavePath(phase: number): Vector3[] {
  return Array.from({ length: 19 }, (_, index) => {
    const t = index / 18
    const angle = t * Math.PI * 4 + phase
    const envelope = Math.sin(t * Math.PI)
    return new Vector3(
      Math.sin(angle) * envelope * 0.22,
      Math.cos(angle) * envelope * 0.08,
      -0.7 + t * 1.65,
    )
  })
}

export function createSubatomicWorld(scene: Scene): SubatomicWorld {
  const root = new TransformNode('subatomic-world', scene)
  const glow = new GlowLayer('quantum-emission', scene, { blurKernelSize: 32 })
  glow.intensity = 0.72

  const vacuum = new StandardMaterial('quantum-vacuum', scene)
  vacuum.diffuseColor = new Color3(0.012, 0.018, 0.052)
  vacuum.emissiveColor = new Color3(0.008, 0.025, 0.065)
  vacuum.specularColor = new Color3(0.1, 0.16, 0.3)
  vacuum.alpha = 0.97

  const field = emissiveMaterial('quantum-field', new Color3(0.12, 0.34, 0.68), scene, 0.38)
  const fieldFaint = emissiveMaterial(
    'quantum-field-faint',
    new Color3(0.08, 0.26, 0.48),
    scene,
    0.18,
  )
  const electron = emissiveMaterial('quantum-electron', WAVE_COLOR, scene)
  const proton = emissiveMaterial('quantum-proton', PROTON_COLOR, scene)
  const neutron = emissiveMaterial('quantum-neutron', NEUTRON_COLOR, scene)
  const particle = emissiveMaterial('photon-particle', PARTICLE_COLOR, scene)
  const particleHalo = emissiveMaterial('photon-particle-halo', PARTICLE_COLOR, scene, 0.2)
  const wave = emissiveMaterial('photon-wave', WAVE_COLOR, scene)
  const waveHalo = emissiveMaterial('photon-wave-halo', WAVE_COLOR, scene, 0.2)

  const aimingGround = MeshBuilder.CreateGround(
    'quantum-vacuum-plane',
    { width: 20, height: 20, subdivisions: 1 },
    scene,
  )
  aimingGround.material = vacuum
  aimingGround.parent = root
  aimingGround.isPickable = true
  aimingGround.receiveShadows = true

  const fieldRings: AbstractMesh[] = []
  for (const [index, diameter] of [3.2, 6.1, 9.4, 15.6].entries()) {
    const ring = MeshBuilder.CreateTorus(
      `quantum-field-ring-${index}`,
      { diameter, thickness: index === 3 ? 0.035 : 0.022, tessellation: 72 },
      scene,
    )
    ring.position.y = 0.035 + index * 0.006
    ring.rotation.x = (index - 1.5) * 0.035
    ring.material = index === 3 ? field : fieldFaint
    ring.parent = root
    ring.isPickable = false
    fieldRings.push(ring)
  }

  for (let index = 0; index < 24; index++) {
    const angle = index / 24 * Math.PI * 2
    const radius = index % 2 === 0 ? 7.72 : 7.88
    const tick = MeshBuilder.CreateBox(
      `quantum-boundary-tick-${index}`,
      { width: 0.025, height: index % 3 === 0 ? 0.16 : 0.08, depth: 0.42 },
      scene,
    )
    tick.position.set(Math.sin(angle) * radius, 0.09, Math.cos(angle) * radius)
    tick.rotation.y = angle
    tick.material = index % 3 === 0 ? electron : field
    tick.parent = root
    tick.isPickable = false
  }

  const nuclei: QuantumNucleus[] = []
  const nucleusPositions = [
    new Vector3(-3.9, 0.58, -2.35),
    new Vector3(3.75, 0.66, -2.8),
    new Vector3(-3.25, 0.62, 3.25),
    new Vector3(4.15, 0.58, 2.45),
  ]
  for (const [nucleusIndex, position] of nucleusPositions.entries()) {
    const nucleusRoot = new TransformNode(`quantum-nucleus-${nucleusIndex}`, scene)
    nucleusRoot.position.copyFrom(position)
    nucleusRoot.parent = root

    const offsets = [
      new Vector3(-0.18, 0.05, 0),
      new Vector3(0.16, 0.08, 0.08),
      new Vector3(0, -0.12, -0.14),
      new Vector3(0.04, 0.2, -0.08),
      new Vector3(-0.1, -0.08, 0.18),
    ]
    for (const [index, offset] of offsets.entries()) {
      const nucleon = MeshBuilder.CreateIcoSphere(
        `nucleon-${nucleusIndex}-${index}`,
        { radius: 0.22, subdivisions: 1, flat: true },
        scene,
      )
      nucleon.position.copyFrom(offset)
      nucleon.material = index % 2 === 0 ? proton : neutron
      nucleon.parent = nucleusRoot
      nucleon.isPickable = false
    }

    const electronPivots: TransformNode[] = []
    for (let orbitIndex = 0; orbitIndex < 2; orbitIndex++) {
      const pivot = new TransformNode(`electron-orbit-pivot-${nucleusIndex}-${orbitIndex}`, scene)
      pivot.rotation.z = orbitIndex === 0 ? 0.7 : -0.9
      pivot.parent = nucleusRoot
      const orbitRadius = 0.72 + orbitIndex * 0.2
      const orbit = MeshBuilder.CreateTorus(
        `electron-orbit-${nucleusIndex}-${orbitIndex}`,
        { diameter: orbitRadius * 2, thickness: 0.012, tessellation: 40 },
        scene,
      )
      orbit.material = fieldFaint
      orbit.parent = pivot
      orbit.isPickable = false
      const electronMesh = MeshBuilder.CreateIcoSphere(
        `electron-${nucleusIndex}-${orbitIndex}`,
        { radius: 0.095, subdivisions: 1, flat: true },
        scene,
      )
      electronMesh.position.x = orbitRadius
      electronMesh.material = electron
      electronMesh.parent = pivot
      electronMesh.isPickable = false
      electronPivots.push(pivot)
    }
    nuclei.push({ root: nucleusRoot, electronPivots, phase: nucleusIndex * 1.7 })
  }

  const motes: QuantumMote[] = []
  for (let index = 0; index < 32; index++) {
    const angle = index * 2.3999632297
    const radius = 1.8 + index % 7 * 0.82
    const mote = MeshBuilder.CreateIcoSphere(
      `vacuum-fluctuation-${index}`,
      { radius: index % 5 === 0 ? 0.055 : 0.032, subdivisions: 1, flat: true },
      scene,
    )
    const baseY = 0.32 + index % 6 * 0.19
    mote.position.set(Math.sin(angle) * radius, baseY, Math.cos(angle) * radius)
    mote.material = index % 4 === 0 ? wave : field
    mote.parent = root
    mote.isPickable = false
    motes.push({ mesh: mote, baseY, phase: index * 0.83 })
  }

  const reticle = MeshBuilder.CreateTorus(
    'photon-aim-reticle',
    { diameter: 0.42, thickness: 0.028, tessellation: 32 },
    scene,
  )
  reticle.position.y = 0.055
  reticle.material = electron
  reticle.parent = root
  reticle.isPickable = false
  reticle.setEnabled(false)

  const photons: Photon[] = []
  let photonSequence = 0

  const fire = (kind: PhotonKind, origin: Vector3, requestedDirection: Vector3): void => {
    const direction = requestedDirection.clone()
    direction.y = 0
    if (direction.lengthSquared() < 0.0001) direction.set(0, 0, 1)
    direction.normalize()

    const id = photonSequence++
    const photonRoot = new TransformNode(`photon-${kind}-${id}`, scene)
    photonRoot.position.copyFrom(origin).addInPlace(direction.scale(0.72))
    photonRoot.position.y = kind === 'particle' ? 0.95 : 0.86
    photonRoot.rotation.y = Math.atan2(direction.x, direction.z)
    photonRoot.parent = root

    if (kind === 'particle') {
      const core = MeshBuilder.CreateIcoSphere(
        `particle-core-${id}`,
        { radius: 0.14, subdivisions: 1, flat: true },
        scene,
      )
      core.material = particle
      core.parent = photonRoot
      core.isPickable = false
      const halo = MeshBuilder.CreateIcoSphere(
        `particle-halo-${id}`,
        { radius: 0.25, subdivisions: 2, flat: true },
        scene,
      )
      halo.material = particleHalo
      halo.parent = photonRoot
      halo.isPickable = false
      for (let trailIndex = 1; trailIndex <= 4; trailIndex++) {
        const trail = MeshBuilder.CreateIcoSphere(
          `particle-trail-${id}-${trailIndex}`,
          { radius: 0.075 / Math.sqrt(trailIndex), subdivisions: 1, flat: true },
          scene,
        )
        trail.position.z = -trailIndex * 0.18
        trail.material = particle
        trail.parent = photonRoot
        trail.isPickable = false
      }
    } else {
      const tube = MeshBuilder.CreateTube(
        `wave-packet-${id}`,
        { path: wavePath(0), radius: 0.042, tessellation: 7, updatable: true },
        scene,
      )
      tube.material = wave
      tube.parent = photonRoot
      tube.isPickable = false
      const front = MeshBuilder.CreateTorus(
        `wave-front-${id}`,
        { diameter: 0.54, thickness: 0.035, tessellation: 32 },
        scene,
      )
      front.position.z = 0.96
      front.rotation.x = Math.PI / 2
      front.material = wave
      front.parent = photonRoot
      front.isPickable = false
      const halo = MeshBuilder.CreateTorus(
        `wave-front-halo-${id}`,
        { diameter: 0.78, thickness: 0.055, tessellation: 32 },
        scene,
      )
      halo.position.z = 0.96
      halo.rotation.x = Math.PI / 2
      halo.material = waveHalo
      halo.parent = photonRoot
      halo.isPickable = false
      photons.push({ kind, root: photonRoot, direction, speed: 5.7, age: 0, waveTube: tube })
      return
    }

    photons.push({ kind, root: photonRoot, direction, speed: 7.8, age: 0 })
  }

  return {
    aimingGround,
    fire,
    setAimPoint: (point) => {
      reticle.setEnabled(point !== null)
      if (point !== null) reticle.position.set(point.x, 0.055, point.z)
    },
    update: (deltaSeconds, timeMs) => {
      const time = timeMs / 1_000
      for (const [index, ring] of fieldRings.entries()) {
        ring.rotation.y = time * (index % 2 === 0 ? 0.08 : -0.06)
        ring.scaling.y = 1 + Math.sin(time * 1.4 + index) * 0.035
      }
      for (const [index, nucleus] of nuclei.entries()) {
        nucleus.root.position.y = nucleusPositions[index]!.y
          + Math.sin(time * 1.7 + nucleus.phase) * 0.08
        nucleus.root.rotation.y = time * (index % 2 === 0 ? 0.25 : -0.2)
        for (const [orbitIndex, pivot] of nucleus.electronPivots.entries()) {
          pivot.rotation.y = time * (2.1 + orbitIndex * 0.7) + nucleus.phase
        }
      }
      for (const mote of motes) {
        mote.mesh.position.y = mote.baseY + Math.sin(time * 1.35 + mote.phase) * 0.16
        mote.mesh.rotation.y = time + mote.phase
      }
      reticle.rotation.y = time * 1.8

      for (let index = photons.length - 1; index >= 0; index--) {
        const photon = photons[index]!
        photon.age += deltaSeconds
        photon.root.position.addInPlace(photon.direction.scale(photon.speed * deltaSeconds))
        const pulse = 1 + Math.sin(photon.age * 18) * 0.12
        photon.root.scaling.setAll(pulse)
        if (photon.waveTube !== undefined) {
          MeshBuilder.CreateTube(
            photon.waveTube.name,
            {
              path: wavePath(photon.age * 13),
              radius: 0.042,
              tessellation: 7,
              instance: photon.waveTube,
            },
            scene,
          )
        } else {
          photon.root.rotation.z += deltaSeconds * 7
        }
        if (photon.age > 2.35) {
          photon.root.dispose(false)
          photons.splice(index, 1)
        }
      }
    },
  }
}
