import * as THREE from 'three'
import type { GameState } from '../../simulation/state'
import { SUPPLIES, SUPPLY_CAPACITY, supplyIds } from './supplies'

export function createSupplyVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const tray = new THREE.MeshStandardMaterial({ color: '#57634c', roughness: 0.8 })
  const supplies = supplyIds.map((id, index) => {
    const x = (index - 1) * 0.56
    const holder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.23), tray)
    holder.position.set(x, 1.1, 5.42)
    scene.add(holder)
    const material = new THREE.MeshStandardMaterial({ color: SUPPLIES[id].color, roughness: 0.9 })
    const items = Array.from({ length: 5 }, (_, i) => {
      const mesh = new THREE.Mesh(
        id === 'straws'
          ? new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8)
          : new THREE.BoxGeometry(id === 'napkins' ? 0.26 : 0.075, 0.013, id === 'napkins' ? 0.16 : 0.14),
        material,
      )
      mesh.position.set(
        x + (id === 'napkins' ? 0 : (i - 2) * 0.065),
        1.15 + (id === 'straws' ? 0.06 : 0) + (id === 'napkins' ? i * 0.017 : 0),
        5.42,
      )
      if (id === 'sugar') mesh.rotation.z = 0.25
      scene.add(mesh)
      return mesh
    })
    return { id, items }
  })
  const held = new THREE.Group()
  held.position.set(0.2, -0.32, -0.64)
  camera.add(held)
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.21, 0.22),
    new THREE.MeshStandardMaterial({ color: '#bca17b', roughness: 0.9 }),
  )
  held.add(box)
  const labelMaterial = new THREE.MeshStandardMaterial({ color: '#f0e5cf', roughness: 0.9 })
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.006), labelMaterial)
  label.position.set(0, 0, 0.113)
  held.add(label)

  return {
    update(state: GameState) {
      for (const supply of supplies)
        supply.items.forEach((mesh, i) => {
          mesh.visible = i < Math.ceil((state.supplies[supply.id].bar / SUPPLY_CAPACITY) * 5)
        })

      held.visible = !!state.supplyDelivery
      if (state.supplyDelivery) labelMaterial.color.set(SUPPLIES[state.supplyDelivery.supply].color)
    },
  }
}
