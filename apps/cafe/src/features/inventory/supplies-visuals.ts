import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import { CONDIMENT_COUNTER_Y } from '../../shared/visuals/condiment-bar'
import {
  equipmentBasin,
  equipmentBox,
  equipmentMaterial,
  equipmentPanel,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { SUPPLIES, SUPPLY_CAPACITY, supplyIds } from './supplies'

export function createSupplyVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const display = new THREE.Group()
  display.position.set(STATIONS.supplies.x, 0, STATIONS.supplies.z)
  display.rotation.y = Math.PI / 2
  scene.add(display)
  const tray = equipmentMaterial({ color: '#2c302b', roughness: 0.65 })
  const supplies = supplyIds.map((id, index) => {
    const x = (index - 1) * 0.34
    const baseY = CONDIMENT_COUNTER_Y + 0.025
    const holderHeight = id === 'straws' ? 0.14 : 0.055
    const holder = equipmentBasin(display, 0.29, 0.3, holderHeight, tray, 0.016)
    holder.position.set(x, CONDIMENT_COUNTER_Y, 0)

    if (id === 'napkins') {
      equipmentBox(display, [0.29, 0.12, 0.025], [x, baseY + 0.075, -0.14], tray, 0.006)
    }

    equipmentPanel(display, 0.23, 0.042, [x, CONDIMENT_COUNTER_Y + 0.03, 0.169], (context, w, h) => {
      context.fillStyle = '#f0eadc'
      context.font = canvasFont(h * 0.72, 500)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(SUPPLIES[id].name, w / 2, h / 2, w * 0.9)
    })

    const material = new THREE.MeshStandardMaterial({
      color: id === 'straws' ? '#f1ecdf' : SUPPLIES[id].color,
      roughness: 0.9,
    })
    const items = Array.from({ length: 12 }, (_, i) => {
      const mesh = new THREE.Mesh(
        id === 'straws'
          ? new THREE.BoxGeometry(0.012, 0.25, 0.005)
          : new THREE.BoxGeometry(
              id === 'napkins' ? 0.23 : 0.085,
              id === 'napkins' ? 0.005 : 0.09,
              id === 'napkins' ? 0.21 : 0.008,
            ),
        material,
      )
      if (id === 'napkins') {
        mesh.position.set(x, baseY + i * 0.005, 0)
      } else if (id === 'straws') {
        mesh.position.set(x - 0.075 + (i % 4) * 0.05, baseY + 0.125, -0.07 + Math.floor(i / 4) * 0.055)
        mesh.rotation.z = ((i % 3) - 1) * 0.1
      } else {
        mesh.position.set(x - 0.05 + (i % 2) * 0.1, baseY + 0.047, -0.08 + Math.floor(i / 2) * 0.025)
        mesh.rotation.x = -0.22
      }
      display.add(mesh)
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
          mesh.visible = i < Math.ceil((state.supplies[supply.id].bar / SUPPLY_CAPACITY) * supply.items.length)
        })

      held.visible = !!state.supplyDelivery
      if (state.supplyDelivery) {
        labelMaterial.color.set(SUPPLIES[state.supplyDelivery.supply].color)
      }
    },
  }
}
