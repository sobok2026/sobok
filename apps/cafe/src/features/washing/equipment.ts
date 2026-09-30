import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBasin as basin,
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'

export const WASH_OUTLET: [number, number, number] = [STATIONS.wash.x, 1.45, STATIONS.wash.z + 0.02]
export const WASHING_SPOT: [number, number, number] = [STATIONS.wash.x, 0.775, STATIONS.wash.z + 0.02]
export const DIRTY_SPOT: [number, number, number] = [STATIONS.wash.x + 1.37, 0.992, STATIONS.wash.z]
export const WASHED_SPOT: [number, number, number] = [STATIONS.drying.x, 1.115, STATIONS.drying.z]
export const DRYING_LEVEL = 1.43

export function createDishRack(parent: THREE.Object3D, y = 0) {
  const root = new THREE.Group()
  root.position.y = y
  parent.add(root)
  const plastic = material({ color: '#b8c9c4', roughness: 0.59 })
  for (const z of [-0.245, 0.245]) box(root, [0.5, 0.09, 0.012], [0, 0.047, z], plastic, 0.004)
  for (const x of [-0.245, 0.245]) box(root, [0.012, 0.09, 0.5], [x, 0.047, 0], plastic, 0.004)
  instances(
    root,
    new THREE.BoxGeometry(0.48, 0.012, 0.01),
    plastic,
    Array.from({ length: 15 }, (_, i) => [0, 0.013, -0.23 + i * 0.033]),
  )
  instances(
    root,
    new THREE.BoxGeometry(0.01, 0.012, 0.48),
    plastic,
    Array.from({ length: 15 }, (_, i) => [-0.23 + i * 0.033, 0.021, 0]),
  )
  return root
}

export function createWashingEquipment(parent: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Three compartment stainless sink and separated drainboards'
  root.position.set(STATIONS.wash.x, 0, STATIONS.wash.z)
  parent.add(root)
  const steel = material({ color: '#b9c2c6', metalness: 0.9, roughness: 0.38 })
  const chrome = material({ color: '#d8dfe2', metalness: 0.95, roughness: 0.22 })
  const black = material({ color: '#293132', roughness: 0.75 })

  box(root, [3.05, 0.36, 0.035], [0.43, 1.11, -0.43], steel, 0.005)
  box(root, [3.05, 0.085, 0.035], [0.43, 0.935, 0.405], steel)
  for (const z of [-0.37, 0.37]) box(root, [3.05, 0.034, 0.11], [0.43, 0.973, z], steel, 0.004)

  for (const x of [-0.66, 0, 0.66]) {
    const sink = basin(root, 0.61, 0.62, 0.23, steel)
    sink.position.set(x, 0.75, 0)
    mesh(sink, new THREE.CylinderGeometry(0.035, 0.035, 0.004, 20), black, [0, 0.022, 0.08])
    tube(
      root,
      [
        [x, 0.76, 0.08],
        [x, 0.38, 0.08],
        [x, 0.25, -0.12],
        [x, 0.28, -0.32],
      ],
      0.025,
      chrome,
    )
  }

  for (const x of [-1.03, -0.33, 0.33, 1.02]) box(root, [0.048, 0.025, 0.75], [x, 0.98, 0], steel, 0.004)
  box(root, [0.88, 0.028, 0.78], [1.51, 0.98, 0], steel)
  instances(
    root,
    new THREE.BoxGeometry(0.8, 0.004, 0.012),
    chrome,
    Array.from({ length: 18 }, (_, i) => [1.51, 0.998, -0.32 + i * 0.038]),
  )
  for (const x of [-0.99, 0.98, 1.9]) {
    for (const z of [-0.32, 0.32]) {
      mesh(root, new THREE.CylinderGeometry(0.023, 0.025, 0.89, 12), steel, [x, 0.49, z])
      mesh(root, new THREE.CylinderGeometry(0.029, 0.029, 0.055, 12), black, [x, 0.068, z])
    }
  }
  box(root, [2.91, 0.03, 0.03], [0.46, 0.26, -0.32], steel)
  box(root, [2.91, 0.03, 0.03], [0.46, 0.26, 0.32], steel)

  // Wall-mounted bridge mixer, pre-rinse hose and separate swing spout.
  box(root, [0.29, 0.055, 0.07], [0, 1.16, -0.39], chrome)
  for (const x of [-0.115, 0.115]) {
    mesh(root, new THREE.CylinderGeometry(0.029, 0.029, 0.035, 16), chrome, [x, 1.2, -0.34])
    box(root, [0.095, 0.014, 0.028], [x, 1.219, -0.34], chrome)
  }
  tube(
    root,
    [
      [0, 1.16, -0.34],
      [0, 1.24, -0.22],
      [0, 1.24, 0.02],
    ],
    0.016,
    chrome,
  )
  tube(
    root,
    [
      [0, 1.19, -0.35],
      [0, 1.92, -0.35],
      [0, 2.01, -0.25],
      [0, 1.99, -0.03],
      [0, 1.63, 0.02],
    ],
    0.021,
    black,
  )
  const coil = new THREE.CurvePath<THREE.Vector3>()
  const points = Array.from(
    { length: 180 },
    (_, i) => new THREE.Vector3(Math.sin(i * 0.78) * 0.033, 1.48 + i * 0.0026, -0.35 + Math.cos(i * 0.78) * 0.033),
  )
  for (let i = 1; i < points.length; i++) coil.add(new THREE.LineCurve3(points[i - 1], points[i]))
  mesh(root, new THREE.TubeGeometry(coil, 180, 0.004, 5, false), chrome)
  mesh(root, new THREE.CylinderGeometry(0.025, 0.038, 0.18, 20), black, [0, 1.55, 0.02])
  mesh(root, new THREE.CylinderGeometry(0.042, 0.04, 0.025, 20), chrome, [0, 1.45, 0.02])
  box(root, [0.027, 0.13, 0.02], [0.04, 1.57, 0.02], chrome)

  for (const [x, text] of [
    [-0.66, '세척'],
    [0, '헹굼'],
    [0.66, '소독'],
  ] as const) {
    panel(root, 0.23, 0.065, [x, 1.2, -0.407], (ctx, w, h) => {
      ctx.fillStyle = '#eff0e8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#32483e'
      ctx.font = canvasFont(h * 0.59, 600)
      ctx.textAlign = 'center'
      ctx.fillText(text, w / 2, h * 0.73)
    })
  }

  const drainboard = new THREE.Group()
  drainboard.position.set(WASHED_SPOT[0], 0, WASHED_SPOT[2])
  parent.add(drainboard)
  box(drainboard, [1.0, 0.035, 0.78], [0, 1.09, 0], steel)
  box(drainboard, [1.0, 0.25, 0.028], [0, 1.21, -0.39], steel)
  for (const x of [-0.43, 0.43]) {
    for (const z of [-0.32, 0.32])
      mesh(drainboard, new THREE.CylinderGeometry(0.022, 0.025, 1.01, 12), steel, [x, 0.55, z])
  }
  const dryingRack = createDishRack(drainboard, 1.111)
  dryingRack.scale.set(1.8, 1, 1.25)
  for (const y of [1.72, 2.15]) {
    instances(
      drainboard,
      new THREE.BoxGeometry(0.98, 0.012, 0.009),
      chrome,
      Array.from({ length: 16 }, (_, i) => [0, y, -0.32 + i * 0.027]),
    )
    for (const x of [-0.44, 0.44])
      tube(
        drainboard,
        [
          [x, y + 0.09, -0.42],
          [x, y, -0.42],
          [x, y, 0.09],
          [x, y - 0.24, -0.42],
        ],
        0.014,
        steel,
      )
  }
  for (let i = 0; i < 3; i++) createDishRack(drainboard, 1.73 + i * 0.105)
}
