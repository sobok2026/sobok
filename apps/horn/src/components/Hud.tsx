import { KO } from '@/content/ko'
import type { HudSnapshot } from '@/game/types'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Hud({ hud }: { hud: HudSnapshot }) {
  const xpFrac = hud.xpToNext > 0 ? hud.xp / hud.xpToNext : 0
  const hpFrac = hud.maxHp > 0 ? hud.hp / hud.maxHp : 0
  const lowHp = hpFrac < 0.35

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1.5 bg-black/40">
        <div
          className="h-full bg-accent-cool transition-[width] duration-150 ease-linear"
          style={{ width: `${Math.max(0, Math.min(100, xpFrac * 100))}%` }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1.5 z-20 flex items-start justify-between gap-3 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pl-[calc(env(safe-area-inset-left)+1rem)] pr-[calc(env(safe-area-inset-right)+1rem)]">
        <div className="rounded-2xl bg-black/35 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-white/60">{KO.hud.population}</span>
            <span className="rounded-full bg-accent-cool/25 px-1.5 text-[10px] font-black text-accent-cool">
              {KO.hud.level} {hud.level}
            </span>
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-3xl font-black leading-none text-white drop-shadow">{hud.score}</span>
            <span className="text-sm font-bold text-white/70">{KO.result.unit}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] leading-none">❤️</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ease-out ${lowHp ? 'bg-danger' : 'bg-positive'}`}
                style={{ width: `${Math.max(0, Math.min(100, hpFrac * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {hud.combo >= 2 && (
          <div className="flex flex-col items-center">
            {hud.multiplier > 1 && (
              <div className="text-2xl font-black text-brand drop-shadow [text-shadow:0_0_12px_rgba(255,138,190,0.7)]">
                ×{hud.multiplier}
              </div>
            )}
            <div className="text-[11px] font-bold text-white/70">
              {hud.combo} {KO.hud.combo}
            </div>
            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-100 ease-linear"
                style={{ width: `${Math.round(hud.comboFrac * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-black/35 px-4 py-2 text-right backdrop-blur-md">
          <div className="text-[11px] font-semibold tracking-wide text-white/60">{KO.hud.time}</div>
          <div className="text-2xl font-black leading-tight tabular-nums text-white drop-shadow">
            {formatTime(hud.elapsed)}
          </div>
        </div>
      </div>
    </>
  )
}
