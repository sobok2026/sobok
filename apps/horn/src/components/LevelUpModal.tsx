'use client'

import { KO } from '@/content/ko'
import type { UpgradeChoice, UpgradeId } from '@/game/types'

export default function LevelUpModal({
  choices,
  level,
  onChoose,
}: {
  choices: UpgradeChoice[]
  level: number
  onChoose: (id: UpgradeId) => void
}) {
  return (
    <div
      aria-label={KO.a11y.levelup}
      aria-modal="true"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/60 px-5 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <div className="text-center">
        <div className="text-3xl font-black text-accent-warm drop-shadow [text-shadow:0_0_16px_rgba(255,214,107,0.6)]">
          {KO.levelup.title}
        </div>
        <div className="mt-1 text-sm font-semibold text-white/70">
          {KO.levelup.levelTag}
          {level} · {KO.levelup.subtitle}
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        {choices.map((c, i) => {
          const info = KO.upgrades[c.id]
          return (
            <button
              autoFocus={i === 0}
              className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/15 transition-transform hover:bg-white/15 active:scale-[0.98]"
              key={c.id}
              onClick={() => onChoose(c.id)}
              type="button"
            >
              <span className="text-4xl leading-none">{info.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-base font-black text-white">{info.name}</span>
                  <span className="text-[11px] font-bold text-accent-cool">
                    {KO.levelup.levelTag}
                    {c.nextLevel}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-white/70">{info.desc}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
