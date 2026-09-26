import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBasin as basin,
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
} from '../../shared/visuals/equipment-geometry'
import { createIceScoop, iceScoopScale, iceScoopSizes } from '../../shared/visuals/ice-scoop'
import { createPumpVisual } from '../../shared/visuals/pump-visual'
import type { GameState } from '../../simulation/state'
import { operationFor } from './rules'

export const WATER_OUTLET: [number, number, number] = [1.1, 1.62, -1.48]

export function createWaterStation(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Marco MIX three-button font'
  root.position.set(1.1, 1.065, -1.285)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#c6c9cb', metalness: 0.96, roughness: 0.25 })
  const capSteel = material({ color: '#b9bdc0', metalness: 0.94, roughness: 0.31 })
  const black = material({ color: '#181b1d', roughness: 0.71 })
  // The reference is a continuous round L-shaped font, with three buttons along its crown.
  const path = new THREE.CurvePath<THREE.Vector3>()
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(0, 0.515, 0)))
  path.add(
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.515, 0),
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(0, 0.6, 0.085),
    ),
  )
  mesh(root, new THREE.TubeGeometry(path, 40, 0.031, 24, false), steel)
  const barrel = mesh(root, new THREE.CylinderGeometry(0.0375, 0.0375, 0.187, 40), steel, [0, 0.6, 0.14])
  barrel.rotation.x = Math.PI / 2
  const cap = mesh(root, new THREE.CylinderGeometry(0.0355, 0.0355, 0.003, 40), capSteel, [0, 0.6, 0.235])
  cap.rotation.x = Math.PI / 2
  const seam = mesh(root, new THREE.TorusGeometry(0.0367, 0.0008, 6, 40), black, [0, 0.6, 0.23])
  seam.castShadow = false
  mesh(root, new THREE.CylinderGeometry(0.0155, 0.0155, 0.02, 24), capSteel, [0, 0.565, 0.195])
  mesh(root, new THREE.CylinderGeometry(0.012, 0.012, 0.001, 20), black, [0, 0.555, 0.195])
  for (const z of [0.072, 0.135, 0.198]) {
    mesh(root, new THREE.CylinderGeometry(0.017, 0.017, 0.002, 24), capSteel, [0, 0.638, z])
    mesh(root, new THREE.CylinderGeometry(0.0145, 0.015, 0.004, 24), black, [0, 0.641, z])
  }
  mesh(root, new THREE.CylinderGeometry(0.043, 0.046, 0.007, 40), steel, [0, 0.0035, 0])
  // A flush drain leaves the pipe silhouette clear and keeps the serving cup on the worktop.
  box(root, [0.3, 0.004, 0.33], [0, 0.001, 0.195], capSteel, 0.002)
  box(root, [0.277, 0.001, 0.307], [0, 0.0035, 0.195], black, 0.0005)
  instances(
    root,
    new THREE.BoxGeometry(0.265, 0.002, 0.005),
    steel,
    Array.from({ length: 24 }, (_, i) => [0, 0.0045, 0.05 + i * 0.0125]),
  )
}

export function createIceBin(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Krowne-style recessed ice well'
  root.position.set(2.1, 0.75, -0.93)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#b8bcbe', metalness: 0.91, roughness: 0.38 })
  const black = material({ color: '#101819', roughness: 0.88 })
  const well = basin(root, 0.5, 0.67, 0.31, steel, 0.014)
  // Subtle baked contact shading keeps the recessed liner distinct from the outer sheet metal.
  well.children.forEach((object, surface) => {
    if (!(object instanceof THREE.Mesh)) return
    const positions = object.geometry.getAttribute('position')
    const normals = object.geometry.getAttribute('normal')
    const colors = new Float32Array(positions.count * 3)
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i) + object.position.y,
        z = positions.getZ(i)
      const inward = x * normals.getX(i) + z * normals.getZ(i) < -0.01
      const edgeDistance = Math.min(0.25 - Math.abs(x), 0.335 - Math.abs(z))
      const shade =
        surface === 0
          ? 0.28 + 0.2 * Math.min(1, Math.max(0, edgeDistance) / 0.12)
          : inward && y < 0.307
            ? 0.32 + (0.68 * Math.max(0, y)) / 0.31
            : 1
      colors.set([shade, shade, shade], i * 3)
    }
    object.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const liner = steel.clone()
    liner.vertexColors = true
    object.material = liner
  })
  // Black lid channels sit inside a thin rolled stainless flange.
  for (const x of [-0.233, 0.233]) box(root, [0.018, 0.009, 0.633], [x, 0.317, 0], black, 0.002)
  for (const z of [-0.316, 0.316]) box(root, [0.478, 0.009, 0.018], [0, 0.317, z], black, 0.002)
  for (const x of [-0.251, 0.251]) box(root, [0.007, 0.008, 0.679], [x, 0.323, 0], steel, 0.002)
  box(root, [0.461, 0.009, 0.332], [0, 0.321, -0.167], black, 0.002)
  box(root, [0.44, 0.007, 0.31], [0, 0.327, -0.167], steel, 0.002)
  box(root, [0.463, 0.014, 0.019], [0, 0.338, 0.003], steel, 0.002)
  const drain = mesh(root, new THREE.CylinderGeometry(0.028, 0.028, 0.003, 32), black, [-0.1, 0.022, 0.1])
  drain.castShadow = false
  const drainRim = mesh(root, new THREE.TorusGeometry(0.026, 0.0025, 8, 32), steel, [-0.1, 0.025, 0.1])
  drainRim.rotation.x = Math.PI / 2
  const iceMaterial = material({
    color: '#dceaf0',
    transparent: true,
    opacity: 0.69,
    roughness: 0.15,
    depthWrite: false,
  })
  const ice = new THREE.InstancedMesh(new RoundedBoxGeometry(0.062, 0.05, 0.064, 1, 0.009), iceMaterial, 48)
  ice.name = 'Stored ice'
  const transform = new THREE.Object3D()
  for (let i = 0; i < 48; i++) {
    transform.position.set(
      -0.183 + (i % 6) * 0.073,
      0.221 + Math.sin(i * 2.41) * 0.022,
      -0.258 + Math.floor(i / 6) * 0.074,
    )
    transform.rotation.set(Math.sin(i) * 0.3, i * 1.37, Math.cos(i * 2) * 0.25)
    transform.updateMatrix()
    ice.setMatrixAt(i, transform.matrix)
  }
  ice.computeBoundingSphere()
  root.add(ice)
  const rack = new THREE.Group()
  rack.name = 'Tall Grande Venti scoop holder'
  rack.position.set(0, 0.319, -0.455)
  root.add(rack)
  const acrylic = material({ color: '#dce9ed', transparent: true, opacity: 0.22, roughness: 0.18, depthWrite: false })
  box(rack, [0.6, 0.008, 0.17], [0, 0.006, 0], acrylic, 0.003)
  box(rack, [0.6, 0.105, 0.005], [0, 0.055, -0.08], acrylic, 0.002)
  box(rack, [0.6, 0.105, 0.005], [0, 0.055, 0.08], acrylic, 0.002)
  for (const x of [-0.3, -0.1, 0.1, 0.3]) box(rack, [0.005, 0.105, 0.16], [x, 0.055, 0], acrylic, 0.002)
  for (const [i, size] of iceScoopSizes.entries()) {
    const scoop = createIceScoop(rack, size)
    scoop.position.set(-0.2 + i * 0.2, 0.045 + 0.165 * iceScoopScale[size], 0)
    scoop.rotation.set(-Math.PI / 2, Math.PI, 0, 'YXZ')
    panel(rack, 0.087, 0.033, [-0.2 + i * 0.2, 0.035, 0.084], (ctx, w, h) => {
      ctx.fillStyle = '#304f58'
      ctx.textAlign = 'center'
      ctx.font = canvasFont(h * 0.6, 600)
      ctx.fillText(size[0].toUpperCase(), w / 2, h * 0.77)
    })
  }
}

export function createSyrupStation(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Syrup pump rail'
  root.position.set(3.1, 1.067, -0.99)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#acb9c0', metalness: 0.9, roughness: 0.3 })
  const rubber = material({ color: '#25302e', roughness: 0.9 })
  box(root, [0.67, 0.018, 0.43], [0, 0.01, 0.03], steel)
  box(root, [0.625, 0.009, 0.39], [0, 0.023, 0.03], rubber, 0.003)
  for (const x of [-0.326, 0.326]) box(root, [0.012, 0.085, 0.43], [x, 0.047, 0.03], steel, 0.004)
  const bottles = { glaze: createPumpVisual(root, 'glaze'), classic: createPumpVisual(root, 'classic') }
  bottles.glaze.root.position.set(-0.175, 0.027, -0.03)
  bottles.classic.root.position.set(0.175, 0.027, -0.03)
  return {
    update(state: GameState) {
      const cup = state.cup
      const operation = cup?.craft.location === 'sauce' ? operationFor(cup.recipe, cup.craft)?.operation : null
      const selected =
        operation?.action === 'add' &&
        (operation.amount.kind === 'count' || operation.amount.kind === 'count-range') &&
        operation.amount.unit === 'pump' &&
        (operation.materialId === 'glaze' || operation.materialId === 'classic')
          ? operation.materialId
          : null
      // The chosen pump is placed over the cup by crafting visuals; avoid a second copy in the rail.
      bottles.glaze.root.visible = selected !== 'glaze'
      bottles.classic.root.visible = selected !== 'classic'
    },
  }
}
