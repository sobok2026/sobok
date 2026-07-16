import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { ELEMENT_COLORS } from '@/chart/data'
import type { ElementId } from '@/chart/types'
import cardStyles from '@/components/card.module.css'
import { track } from '@/lib/analytics/browser'

import type { LuckyRecommendations } from './recommendations/types'
import type { SkyToday } from './sky'
import styles from './today.module.css'

const LUCKY_GLYPHS: Record<ElementId, string> = {
  fire: '✦',
  earth: '◆',
  air: '◇',
  water: '≈',
}

export default function LuckySection({ lucky, sky }: { lucky: LuckyRecommendations; sky: SkyToday }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  const t = useTranslations('Today')
  const tc = useTranslations('Constellation')
  const foodColor = ELEMENT_COLORS[lucky.food.element]

  const basisKey = lucky.personalized
    ? lucky.usesNatalMoon
      ? 'lucky.personalBasis'
      : 'lucky.personalBasisWithoutMoon'
    : 'lucky.collectiveBasis'

  const basis = t(basisKey, {
    sign: tc(`signs.${sky.moonSign}`),
    phase: t(`phases.${sky.phase}`),
  })

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return
    }

    let viewed = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || viewed) {
          return
        }

        viewed = true
        setRevealed(true)

        track('view_lucky_recommendation', {
          content_type: 'today_lucky',
          personalized: lucky.personalized,
          lucky_food_id: lucky.food.id,
          lucky_color_id: lucky.color.id,
        })
        observer.disconnect()
      },
      { threshold: 0.5 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [lucky.color.id, lucky.food.id, lucky.personalized])

  return (
    <section
      aria-labelledby="today-lucky-title"
      className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}
      ref={sectionRef}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground" id="today-lucky-title">
          {t('lucky.title')}
        </h2>
        {lucky.personalized && (
          <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
            {t('lucky.personalized')}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">{basis}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article
          className={`${styles.luckyItem} ${revealed ? styles.luckyItemVisible : ''} p-1 rounded-2xl sm:p-4 sm:bg-surface`}
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${foodColor}22`, color: foodColor }}
            >
              {LUCKY_GLYPHS[lucky.food.element]}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {t('lucky.foodLabel')}
              </p>
              <h3 className="mt-0.5 text-base font-bold text-foreground">{lucky.food.name}</h3>
              <p className="mt-0.5 text-[10px] leading-relaxed text-foreground-faint">{t('lucky.allergy')}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-foreground-secondary">{lucky.food.reason}</p>
          <p className="mt-3 text-[10px] font-semibold text-foreground-subtle">{t('lucky.actionLabel')}</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{lucky.food.action}</p>
        </article>

        <article
          className={`${styles.luckyItem} ${revealed ? styles.luckyItemVisible : ''} p-1 rounded-2xl sm:p-4 sm:bg-surface`}
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-label={t('lucky.colorA11y', { name: lucky.color.name, hex: lucky.color.hex })}
              className="h-10 w-10 shrink-0 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
              role="img"
              style={{ backgroundColor: lucky.color.hex }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {t('lucky.colorLabel')}
              </p>
              <h3 className="mt-0.5 text-base font-bold text-foreground">{lucky.color.name}</h3>
              <p className="mt-0.5 text-[10px] uppercase text-foreground-subtle">
                <span>{t('lucky.colorCode')}</span> <span className="font-mono tracking-wider">{lucky.color.hex}</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-foreground-secondary">{lucky.color.reason}</p>
          <p className="mt-3 text-[10px] font-semibold text-foreground-subtle">{t('lucky.actionLabel')}</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{lucky.color.action}</p>
        </article>
      </div>
    </section>
  )
}
