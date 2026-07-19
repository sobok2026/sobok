import { GEM_COLORS } from '../_lib/gem-colors'
import type { GemCode } from '../_lib/types'

type GemBadgeProps = {
  gemCode: GemCode
  size?: number
}

export function GemBadge({ gemCode, size = 88 }: GemBadgeProps) {
  const [start, end] = GEM_COLORS[gemCode]

  return (
    <div
      aria-hidden="true"
      className="mx-auto rounded-[28%]"
      style={{
        background: `linear-gradient(160deg, ${start}, ${end})`,
        boxShadow: `0 0 ${Math.round(size / 3)}px ${start}66`,
        height: size,
        width: size,
      }}
    />
  )
}
