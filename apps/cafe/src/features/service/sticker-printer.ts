import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { equipmentBox as box, equipmentMaterial as material } from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { pendingStickers } from './orders'

const SHOWN_STICKERS = 4

/**
 * The label printer beside the cup rack. Payment prints one sticker per drink, and the strip hanging from the slot
 * shows how many are waiting for a cup.
 */
export function createStickerPrinter(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Order sticker printer'
  root.position.set(STATIONS.printer.x, 1.064, -1.5)
  scene.add(root)
  const body = material({ color: '#2b2f2e', roughness: 0.55 })
  const slot = material({ color: '#111413', roughness: 0.8 })
  const paper = new THREE.MeshStandardMaterial({ color: '#fbfaf2', roughness: 0.9, side: THREE.DoubleSide })
  box(root, [0.13, 0.085, 0.16], [0, 0.043, 0], body, 0.012)
  box(root, [0.09, 0.006, 0.006], [0, 0.07, -0.081], slot, 0.002)
  const stickers = Array.from({ length: SHOWN_STICKERS }, (_, index) => {
    // Printed stickers lie on the counter in front of the slot, fanned toward the staff aisle.
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.045), paper)
    sticker.position.set(0.004 * index, 0.002 + index * 0.0008, -0.115 - index * 0.014)
    sticker.rotation.set(-Math.PI / 2, 0, (index - 1.5) * 0.06)
    root.add(sticker)
    return sticker
  })

  return {
    update(state: GameState) {
      const waiting = Math.min(SHOWN_STICKERS, pendingStickers(state))
      stickers.forEach((sticker, index) => {
        sticker.visible = index < waiting
      })
    },
  }
}
