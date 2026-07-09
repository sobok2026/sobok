import { getRarityMetaByKey } from '../_lib/rarity'
import { FORTUNE_INTENSITIES, FORTUNE_ROLES, FORTUNE_STAT_META } from '../_lib/taste'
import type { Fortune } from '../_lib/types'

export function HeroCard({ fortune }: { fortune: Fortune }) {
  const rarity = getRarityMetaByKey(fortune.rarity)
  const role = FORTUNE_ROLES.find((option) => option.key === fortune.taste.role)
  const intensity = FORTUNE_INTENSITIES.find((option) => option.key === fortune.taste.intensity)

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
      style={{
        background: `
          radial-gradient(130% 130% at 15% 0%, color-mix(in oklab, ${rarity.accent} 30%, transparent) 0%, transparent 55%),
          radial-gradient(120% 120% at 100% 100%, color-mix(in oklab, ${rarity.accent} 18%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.05)
        `,
        border: `1px solid color-mix(in oklab, ${rarity.accent} 35%, rgba(255,255,255,0.12))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px -12px ${rarity.glow}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black tracking-wide"
              style={{
                color: rarity.accent,
                background: `color-mix(in oklab, ${rarity.accent} 16%, transparent)`,
                border: `1px solid color-mix(in oklab, ${rarity.accent} 45%, transparent)`,
              }}
            >
              {fortune.rarity} · {rarity.label}
            </span>
            {role && intensity && (
              <span className="text-xs text-foreground-muted">
                {role.emoji} {role.label} · {intensity.emoji} {intensity.label}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-5xl font-black tracking-tight text-foreground tabular-nums">{fortune.overall}</p>
            <span className="text-base font-medium text-foreground-secondary">점</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground">
            {fortune.keywords.map((keyword) => (
              <span className="rounded-full border border-border-strong bg-surface-2/50 px-2.5 py-1" key={keyword}>
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-border-2 bg-overlay/40 p-3 text-right">
          <p className="text-xs text-foreground-muted">분위기</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{fortune.vibe}</p>
          <p className="mt-2 text-xs text-foreground-muted">추천 시간</p>
          <p className="mt-1 text-xs text-foreground-secondary">{fortune.bestTime}</p>
          <p className="mt-2 text-xs text-foreground-muted">행운 컬러</p>
          <p className="mt-1 text-xs text-foreground-secondary">{fortune.luckyColor}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{fortune.message}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {FORTUNE_STAT_META.map((stat) => (
          <FortuneStat accent={rarity.accent} key={stat.key} label={stat.label} value={fortune.stats[stat.key]} />
        ))}
      </div>
    </div>
  )
}

function FortuneStat({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-overlay/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-foreground tabular-nums">{value}점</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-2">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, background: accent }} />
      </div>
    </div>
  )
}
