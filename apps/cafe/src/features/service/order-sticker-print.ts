import type { OrderSticker } from './order-sticker'

export const STICKER_WIDTH = 320
export const STICKER_FONT = 'Arial, sans-serif'
export const STICKER_COLORS = { paper: '#f9f9f3', band: '#c6d9ae', ink: '#252723', rule: '#81867b' }

type PrintText = { value: string; x: number; y: number; size: number; anchor: 'start' | 'middle'; inverted?: boolean }
type PrintBox = { x: number; y: number; width: number; height: number; solid?: boolean }

/** The same typesetting is used by the HUD's SVG and the printer/cup canvas textures. */
export function orderStickerPrint(sticker: OrderSticker) {
  const texts: PrintText[] = []
  const boxes: PrintBox[] = []

  function lines(values: string[], x: number, top: number, width: number, size: number, centered = false) {
    const rows = values.flatMap((value) => wrapPrint(value, width, size))

    rows.forEach((value, index) => {
      texts.push({ value, x, y: top + size + index * size * 1.15, size, anchor: centered ? 'middle' : 'start' })
    })

    return rows.length * size * 1.15
  }

  const titleHeight = lines([sticker.name], 237, 8, 142, 14, true)
  const headerHeight = Math.max(48, titleHeight + 16)
  const orderSize = Math.min(30, 142 / (sticker.order.length * 0.61))
  lines([sticker.order], 14, (headerHeight - orderSize) / 2 - 2, 144, orderSize)
  const top = headerHeight + 13

  function field(label: string, values: string[], x: number, y: number, width: number, minimum: number) {
    lines([label], x, y, width, 14)
    const centered = label !== 'Custom'
    const contentHeight = lines(values, centered ? x + width / 2 : x + 5, y + 23, width - 10, 21, centered)
    const height = Math.max(minimum, contentHeight + 12)
    boxes.push({ x, y: y + 21, width, height })
    return y + 21 + height
  }

  const decafEnd = field('Decaf', [sticker.decaf], 12, top, 83, 42)
  const shotsEnd = field('Shots', [sticker.shots], 103, top, 83, 42)
  const syrupEnd = field('Syrup', sticker.syrup, 12, Math.max(decafEnd, shotsEnd) + 8, 174, 43)
  const milkEnd = field('Milk', [sticker.milk], 12, syrupEnd + 8, 174, 43)
  const customEnd = field('Custom', sticker.custom, 12, milkEnd + 8, 174, 116)
  const summaryHeight = lines(sticker.summary, 209, top + 16, 99, 19)
  const bodyEnd = Math.max(customEnd, top + 16 + summaryHeight + 38)
  const customBox = boxes.at(-1)!
  customBox.height += bodyEnd - customEnd
  lines([sticker.time], 209, bodyEnd - 25, 99, 17)
  const beverageHeight = lines([sticker.beverage], 12, bodyEnd + 13, 296, 30)
  const footer = bodyEnd + 13 + beverageHeight + 7
  lines([sticker.sequence], 12, footer, 296, 18)
  const badgeWidth = 52
  const badgeY = footer + 31
  boxes.push({ x: 256, y: badgeY, width: badgeWidth, height: 25, solid: true })
  texts.push({ value: sticker.service, x: 282, y: badgeY + 18, size: 16, anchor: 'middle', inverted: true })

  return { width: STICKER_WIDTH, height: badgeY + 40, headerHeight, bodyTop: top + 21, bodyEnd, texts, boxes }
}

/** Reserve generous Latin widths and a full em for Korean so both renderers wrap without ellipses. */
function wrapPrint(text: string, width: number, size: number) {
  if (!text.trim()) return []
  const rows: string[] = []
  const advance = (character: string) => size * (character.charCodeAt(0) > 255 ? 1 : 0.61)
  let row = ''
  let used = 0

  for (const word of text.trim().split(/\s+/)) {
    const wordWidth = [...word].reduce((sum, character) => sum + advance(character), 0)

    if (row && used + advance(' ') + wordWidth <= width) {
      row += ` ${word}`
      used += advance(' ') + wordWidth
      continue
    }

    if (row) {
      rows.push(row)
      row = ''
      used = 0
    }

    for (const character of word) {
      const characterWidth = advance(character)

      if (row && used + characterWidth > width) {
        rows.push(row)
        row = ''
        used = 0
      }

      row += character
      used += characterWidth
    }
  }

  if (row) rows.push(row)
  return rows
}
