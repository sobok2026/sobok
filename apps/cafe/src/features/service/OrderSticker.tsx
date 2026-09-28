import type { OrderSticker as Sticker } from './order-sticker'
import { orderStickerPrint, STICKER_COLORS, STICKER_FONT } from './order-sticker-print'

export default function OrderSticker({ sticker }: { sticker: Sticker }) {
  const print = orderStickerPrint(sticker)

  return (
    <svg
      className="mx-auto block w-96 max-w-full rounded-sm shadow-sm"
      viewBox={`0 0 ${print.width} ${print.height}`}
      role="img"
      aria-label={sticker.description}
      fontFamily={STICKER_FONT}
      fill={STICKER_COLORS.ink}
    >
      <rect width={print.width} height={print.height} rx="5" fill={STICKER_COLORS.paper} />
      <path d={`M5 0H315Q320 0 320 5V${print.headerHeight}H0V5Q0 0 5 0Z`} fill={STICKER_COLORS.band} />
      {print.boxes.map((box, index) => (
        <rect
          key={index}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={box.solid ? STICKER_COLORS.ink : 'none'}
          stroke={box.solid ? 'none' : STICKER_COLORS.rule}
        />
      ))}
      <path d={`M198 ${print.bodyTop}V${print.bodyEnd}`} stroke={STICKER_COLORS.rule} />
      {print.texts.map((text, index) => (
        <text
          key={index}
          x={text.x}
          y={text.y}
          fontSize={text.size}
          textAnchor={text.anchor}
          fill={text.inverted ? STICKER_COLORS.paper : STICKER_COLORS.ink}
        >
          {text.value}
        </text>
      ))}
    </svg>
  )
}
