import { norm360 } from '@/chart/astrology'

const R = 42
const C = 50

/**
 * Lit-region path for a phase angle in degrees (0 = new, 90 = first quarter,
 * 180 = full, 270 = last quarter). Waxing light grows on the right, matching
 * the northern-hemisphere evening sky.
 */
function litPath(phaseAngle: number): string | null {
  const angle = norm360(phaseAngle)

  if (angle < 1 || angle > 359) {
    return null // new moon — nothing lit
  }

  const waxing = angle <= 180
  const rx = Math.abs(Math.cos((angle * Math.PI) / 180)) * R

  // Whether the terminator bulges toward the lit limb (crescent) or away (gibbous).
  const crescent = waxing ? angle < 90 : angle > 270

  const top = `${C} ${C - R}`
  const bottom = `${C} ${C + R}`

  // Limb semicircle on the lit side, then the terminator ellipse back up.
  // Bottom→top with sweep 0 passes the right side, sweep 1 the left; the
  // terminator must sit toward the lit limb for a crescent, away for a gibbous.
  const limbSweep = waxing ? 1 : 0
  const terminatorSweep = waxing !== crescent ? 1 : 0

  return `M ${top} A ${R} ${R} 0 0 ${limbSweep} ${bottom} A ${rx.toFixed(2)} ${R} 0 0 ${terminatorSweep} ${top} Z`
}

export default function MoonPhase({ className, phaseAngle }: { className?: string; phaseAngle: number }) {
  const lit = litPath(phaseAngle)

  return (
    <svg aria-hidden className={className} viewBox="0 0 100 100">
      <circle cx={C} cy={C} fill="rgba(255,255,255,0.07)" r={R} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
      {lit && (
        <>
          <path d={lit} fill="#f2ead8" opacity={0.28} style={{ filter: 'blur(6px)' }} />
          <path d={lit} fill="#f2ead8" />
        </>
      )}
    </svg>
  )
}
