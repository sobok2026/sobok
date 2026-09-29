import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { equipmentBox as box, equipmentMaterial as material } from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { waitingOrderStickers } from './order-sticker'
import { createOrderStickerTexture } from './order-sticker-texture'

const SHOWN_STICKERS = 4

export function createStickerPrinter(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Order sticker printer'
  root.position.set(STATIONS.printer.x, 1.064, -1.5)
  scene.add(root)
  const body = material({ color: '#2b2f2e', roughness: 0.55 })
  const slot = material({ color: '#111413', roughness: 0.8 })
  box(root, [0.13, 0.085, 0.16], [0, 0.043, 0], body, 0.012)
  box(root, [0.09, 0.006, 0.006], [0, 0.07, -0.081], slot, 0.002)
  const stickers = Array.from({ length: SHOWN_STICKERS }, (_, index) => {
    const texture = createOrderStickerTexture()
    const paper = new THREE.MeshBasicMaterial({
      map: texture.map,
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), paper)
    sticker.visible = false
    sticker.rotation.set(-Math.PI / 2, 0, (index - 1.5) * 0.06)
    root.add(sticker)
    return { sticker, texture }
  })

  return {
    update(state: GameState) {
      const waiting = waitingOrderStickers(state, SHOWN_STICKERS)
      stickers.forEach(({ sticker, texture }, index) => {
        const label = waiting[index]
        sticker.visible = !!label
        if (!label) return
        const aspect = texture.update(label)
        const height = Math.min(0.14, 0.07 / aspect)
        sticker.scale.set(height * aspect, height, 1)
        sticker.position.set(0.004 * index, 0.002 + index * 0.0008, -0.095 - height / 2 - index * 0.014)
      })
    },
  }
}
