import * as THREE from 'three'
import {
  equipmentBox as box,
  equipmentMaterial as material,
  equipmentMesh as mesh,
} from '../../shared/visuals/equipment-geometry'

/**
 * Wire shelving for room-temperature packs, cup sleeves and condiment refills. It stands against the right wall
 * beside the fridge so chilled and dry storage read as two different places.
 */
export function createDryStorage(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Dry storage shelving'
  root.position.set(6.34, 0, -3.3)
  root.rotation.y = -Math.PI / 2
  scene.add(root)
  const chrome = material({ color: '#b9bcbd', metalness: 0.82, roughness: 0.42 })
  const wire = material({ color: '#c9cccd', metalness: 0.78, roughness: 0.45 })
  const cardboard = material({ color: '#b8905f', roughness: 0.86 })
  const lightCardboard = material({ color: '#cfae80', roughness: 0.86 })
  const paper = material({ color: '#efe9dc', roughness: 0.8 })
  const green = material({ color: '#2f5a47', roughness: 0.7 })
  const shelfHeights = [0.18, 0.62, 1.06, 1.5]

  for (const x of [-0.78, 0.78])
    for (const z of [-0.2, 0.2]) {
      mesh(root, new THREE.CylinderGeometry(0.014, 0.014, 1.86, 12), chrome, [x, 0.93, z])
    }

  for (const y of shelfHeights) {
    box(root, [1.6, 0.018, 0.44], [0, y, 0], wire, 0.004)
  }

  // Sealed packs and backstock, arranged so each tier reads at a glance from the aisle.
  box(root, [0.42, 0.3, 0.34], [-0.5, 0.34, 0], cardboard)
  box(root, [0.42, 0.26, 0.34], [0.02, 0.32, 0], lightCardboard)
  box(root, [0.36, 0.32, 0.34], [0.52, 0.35, 0], cardboard)

  for (let i = 0; i < 4; i++) {
    box(root, [0.12, 0.26, 0.12], [-0.62 + i * 0.15, 0.76, 0.02], i % 2 ? green : paper, 0.02)
  }

  box(root, [0.5, 0.2, 0.3], [0.38, 0.73, 0], lightCardboard)

  for (let i = 0; i < 3; i++) {
    mesh(root, new THREE.CylinderGeometry(0.075, 0.06, 0.34, 20), paper, [-0.5 + i * 0.2, 1.24, 0])
  }

  box(root, [0.44, 0.16, 0.3], [0.44, 1.15, 0], cardboard)
  box(root, [0.62, 0.24, 0.34], [-0.28, 1.63, 0], lightCardboard)
  box(root, [0.4, 0.22, 0.32], [0.46, 1.62, 0], cardboard)
}
