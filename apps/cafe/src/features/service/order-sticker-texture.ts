import * as THREE from 'three'
import { paintTexture } from '../../shared/visuals/canvas-text'
import type { OrderSticker } from './order-sticker'
import { orderStickerPrint, STICKER_COLORS, STICKER_FONT, STICKER_WIDTH } from './order-sticker-print'

export function createOrderStickerTexture() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  let printed = ''
  let aspect = 1

  function update(sticker: OrderSticker) {
    const key = JSON.stringify(sticker)
    if (key === printed) return aspect
    printed = key
    const print = orderStickerPrint(sticker)
    canvas.width = STICKER_WIDTH * 2
    canvas.height = print.height * 2
    aspect = print.width / print.height

    paintTexture(map, () => {
      context.save()
      context.scale(2, 2)
      context.beginPath()
      context.roundRect(0, 0, print.width, print.height, 5)
      context.clip()
      context.fillStyle = STICKER_COLORS.paper
      context.fillRect(0, 0, print.width, print.height)
      context.fillStyle = STICKER_COLORS.band
      context.fillRect(0, 0, print.width, print.headerHeight)
      context.strokeStyle = STICKER_COLORS.rule
      context.lineWidth = 1

      for (const box of print.boxes) {
        if (box.solid) {
          context.fillStyle = STICKER_COLORS.ink
          context.fillRect(box.x, box.y, box.width, box.height)
        } else {
          context.strokeRect(box.x, box.y, box.width, box.height)
        }
      }

      context.beginPath()
      context.moveTo(198, print.bodyTop)
      context.lineTo(198, print.bodyEnd)
      context.stroke()

      for (const text of print.texts) {
        context.font = `${text.size}px ${STICKER_FONT}`
        context.textAlign = text.anchor === 'middle' ? 'center' : 'left'
        context.fillStyle = text.inverted ? STICKER_COLORS.paper : STICKER_COLORS.ink
        context.fillText(text.value, text.x, text.y)
      }

      context.restore()
    })

    return aspect
  }

  return { map, update }
}
