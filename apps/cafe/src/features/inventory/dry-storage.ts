import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
} from '../../shared/visuals/equipment-geometry'

export function createDryStorage(
  scene: THREE.Scene,
  position = { x: STATIONS.stock.x as number, z: STATIONS.stock.z as number },
  yaw = 0,
  label = '예비 재고',
) {
  const root = new THREE.Group()
  root.name = `Wire metro shelving · ${label}`
  root.position.set(position.x, 0, position.z)
  root.rotation.y = yaw
  scene.add(root)
  const chrome = material({ color: '#b9c5c6', metalness: 0.82, roughness: 0.4 })
  const cardboard = material({ color: '#b89469', roughness: 0.91 })
  const lightCardboard = material({ color: '#d3b68c', roughness: 0.86 })
  const paper = material({ color: '#e5e4d6', roughness: 0.74 })
  const tape = material({ color: '#ae936a', roughness: 0.59 })
  const green = material({ color: '#3e6254', roughness: 0.7 })
  const posts = [-0.76, 0.76].flatMap((x) => [-0.24, 0.24].map((z) => [x, 1.08, z] as [number, number, number]))
  instances(root, new THREE.CylinderGeometry(0.018, 0.018, 2.14, 12), chrome, posts)
  for (const y of [0.2, 0.66, 1.12, 1.58, 2.04]) {
    for (const z of [-0.26, 0.26]) box(root, [1.59, 0.042, 0.025], [0, y, z], chrome, 0.003)
    for (const x of [-0.78, 0.78]) box(root, [0.025, 0.042, 0.54], [x, y, 0], chrome, 0.003)
    instances(
      root,
      new THREE.BoxGeometry(0.007, 0.008, 0.51),
      chrome,
      Array.from({ length: 49 }, (_, i) => [-0.74 + i * 0.031, y + 0.017, 0]),
    )
    instances(
      root,
      new THREE.CylinderGeometry(0.027, 0.027, 0.055, 12),
      green,
      posts.map(([x, , z]) => [x, y, z]),
    )
  }

  function carton(x: number, y: number, width: number, height: number, light = false) {
    box(root, [width, height, 0.43], [x, y + height / 2 + 0.024, 0], light ? lightCardboard : cardboard, 0.004)
    box(root, [0.045, 0.003, 0.43], [x, y + height + 0.026, 0], tape, 0.001)
    panel(root, width * 0.68, height * 0.46, [x, y + height * 0.58, 0.218], (ctx, w, h) => {
      ctx.fillStyle = '#f1ebd9'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3a493f'
      ctx.font = canvasFont(h * 0.24, 600)
      ctx.fillText(label, w * 0.09, h * 0.32)
      ctx.font = canvasFont(h * 0.14, 400)
      ctx.fillText('소복다방 · 매장 보관용', w * 0.09, h * 0.53)
      for (let i = 0; i < 32; i++) ctx.fillRect(w * (0.09 + i * 0.021), h * 0.65, w * (i % 3 ? 0.005 : 0.011), h * 0.25)
    })
  }
  for (const y of [0.2, 1.58, 2.04]) {
    carton(-0.44, y, 0.52, 0.31)
    carton(0.15, y, 0.51, 0.28, true)
    if (y < 2) carton(0.58, y, 0.25, 0.27)
  }
  for (let i = 0; i < 6; i++) {
    box(root, [0.16, 0.3, 0.17], [-0.62 + i * 0.24, 0.836, 0], i % 2 ? green : paper, 0.009)
    box(root, [0.1, 0.022, 0.12], [-0.62 + i * 0.24, 1.0, 0], paper)
  }
  for (let i = 0; i < 4; i++) {
    const sleeve = mesh(root, new THREE.CylinderGeometry(0.065, 0.054, 0.34, 16), paper, [
      -0.59 + i * 0.19,
      1.315,
      0.05,
    ])
    sleeve.rotation.z = 0.015 * i
  }
  carton(0.46, 1.12, 0.45, 0.28, true)
  return root
}
