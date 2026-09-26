import * as THREE from 'three'
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

export const WASH_OUTLET: [number, number, number] = [-5, 1.6, -5.05]
export const WASHING_SPOT: [number, number, number] = [-5, 1.033, -5.05]
export const DRYING_LEVEL = 1.43

export function createWashingEquipment(scene: THREE.Scene) {
  const steel = material({ color: '#b9c7cd', metalness: 0.93, roughness: 0.27 })
  const chrome = material({ color: '#e0e6e9', metalness: 1, roughness: 0.14 })
  const black = material({ color: '#223036', roughness: 0.76 })
  const sink = basin(scene, 0.88, 0.68, 0.12, steel)
  sink.name = 'Inset stainless washing basin'
  sink.position.set(-5, 1.0, -5.1)
  const drain = mesh(sink, new THREE.CylinderGeometry(0.041, 0.041, 0.003, 32), chrome, [0, 0.021, 0.05])
  drain.castShadow = false
  instances(
    sink,
    new THREE.CylinderGeometry(0.004, 0.004, 0.001, 10),
    black,
    Array.from({ length: 8 }, (_, i) => [
      Math.sin((i * Math.PI) / 4) * 0.025,
      0.023,
      0.05 + Math.cos((i * Math.PI) / 4) * 0.025,
    ]),
  )
  const faucet = new THREE.Group()
  faucet.position.set(-5, 1.09, -5.47)
  scene.add(faucet)
  box(faucet, [0.32, 0.032, 0.1], [0, 0.02, 0], chrome, 0.015)
  tube(
    faucet,
    [
      [0, 0.025, 0],
      [0, 0.44, 0],
      [0, 0.65, 0.035],
      [0, 0.68, 0.24],
      [0, 0.61, 0.4],
      [0, 0.53, 0.42],
    ],
    0.017,
    chrome,
  )
  mesh(faucet, new THREE.CylinderGeometry(0.025, 0.025, 0.04, 24), chrome, [0, 0.53, 0.42])

  for (const x of [-0.12, 0.12]) {
    mesh(faucet, new THREE.CylinderGeometry(0.033, 0.039, 0.035, 24), chrome, [x, 0.05, 0])
    box(faucet, [0.085, 0.014, 0.029], [x + Math.sign(x) * 0.017, 0.075, 0], chrome)
    mesh(
      faucet,
      new THREE.CylinderGeometry(0.009, 0.009, 0.003, 16),
      material({ color: x < 0 ? '#ad5446' : '#467f9b', roughness: 0.4 }),
      [x, 0.085, 0],
    )
  }

  box(scene, [0.29, 0.045, 0.045], [-5, 1.52, -5.6], steel)
  tube(
    scene,
    [
      [-5, 1.52, -5.6],
      [-5, 1.52, -5.47],
    ],
    0.008,
    chrome,
  )
  box(scene, [0.22, 0.022, 0.67], [-5.55, 1.102, -5.1], steel)
  instances(
    scene,
    new THREE.BoxGeometry(0.17, 0.002, 0.009),
    chrome,
    Array.from({ length: 23 }, (_, i) => [-5.55, 1.115, -5.39 + i * 0.025]),
  )

  const rack = new THREE.Group()
  rack.name = 'Two-level draining rack'
  rack.position.set(-3.9, 1.1, -5.1)
  scene.add(rack)
  box(rack, [0.92, 0.018, 0.72], [0, 0.012, 0], steel)
  for (const x of [-0.443, 0.443]) box(rack, [0.014, 0.027, 0.72], [x, 0.027, 0], steel, 0.004)
  for (const z of [-0.35, 0.35]) box(rack, [0.9, 0.027, 0.014], [0, 0.027, z], steel, 0.004)

  for (const x of [-0.41, 0.41])
    for (const z of [-0.31, 0.31]) {
      tube(
        rack,
        [
          [x, 0.015, z],
          [x, 0.34, z],
        ],
        0.008,
        chrome,
      )
      box(rack, [0.035, 0.028, 0.035], [x, 0.014, z], black, 0.008)
    }

  instances(
    rack,
    new THREE.BoxGeometry(0.86, 0.008, 0.008),
    chrome,
    Array.from({ length: 22 }, (_, i) => [0, 0.324, -0.315 + i * 0.03]),
  )
  instances(
    rack,
    new THREE.BoxGeometry(0.008, 0.008, 0.66),
    chrome,
    [-0.41, -0.2, 0, 0.2, 0.41].map((x) => [x, 0.319, 0]),
  )

  for (const z of [-0.33, 0.33])
    tube(
      rack,
      [
        [-0.43, 0.34, z],
        [0.43, 0.34, z],
      ],
      0.007,
      chrome,
    )

  panel(rack, 0.37, 0.048, [0, 0.273, 0.334], (ctx, w, h) => {
    ctx.fillStyle = '#263c36'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e7eee3'
    ctx.font = canvasFont(h * 0.5, 600)
    ctx.textAlign = 'center'
    ctx.fillText('건조 · 도구 보관', w / 2, h * 0.7)
  })
}
