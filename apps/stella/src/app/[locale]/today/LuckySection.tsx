import { track } from '@sobok/analytics/browser'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { ELEMENT_COLORS } from '@/chart/data'
import type { ElementId } from '@/chart/types'
import cardStyles from '@/components/card.module.css'
import { buildFoodMapLink } from './food-map'
import type { LuckyRecommendations } from './recommendations/types'
import type { SkyToday } from './sky'
import styles from './today.module.css'

const LUCKY_GLYPHS: Record<ElementId, string> = {
  fire: '✦',
  earth: '◆',
  air: '◇',
  water: '≈',
}

/** The two daily surfaces sharing this section — each brings its own copy under the same keys. */
export type LuckyNamespace = 'Today' | 'Tomorrow'

/** Exhaustive by construction — a new surface fails to compile until it names its analytics slice. */
const CONTENT_TYPES: Record<LuckyNamespace, string> = {
  Today: 'today_lucky',
  Tomorrow: 'tomorrow_lucky',
}

type LuckySectionProps = {
  lucky: LuckyRecommendations
  namespace: LuckyNamespace
  sky: SkyToday
}

export default function LuckySection({ lucky, namespace, sky }: LuckySectionProps) {
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const tc = useTranslations('Constellation')
  const t = useTranslations(namespace)
  const locale = useLocale()

  const foodColor = ELEMENT_COLORS[lucky.food.element]
  const foodMap = buildFoodMapLink(locale, lucky.food.name)
  const contentType = CONTENT_TYPES[namespace]

  const basisKey = lucky.personalized
    ? lucky.usesNatalMoon
      ? 'lucky.personalBasis'
      : 'lucky.personalBasisWithoutMoon'
    : 'lucky.collectiveBasis'

  const basis = t(basisKey, {
    sign: tc(`signs.${sky.moonSign}`),
    phase: tc(`phases.${sky.phase}`),
  })

  function handleFoodMapOpen() {
    track('open_lucky_food_map', {
      content_type: contentType,
      provider: foodMap.provider,
      lucky_food_id: lucky.food.id,
    })
  }

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
          content_type: contentType,
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
  }, [contentType, lucky.color.id, lucky.food.id, lucky.personalized])

  return (
    <section
      aria-labelledby="lucky-title"
      className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}
      ref={sectionRef}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground" id="lucky-title">
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
          <a
            aria-label={t('lucky.mapCtaA11y', { food: lucky.food.name })}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            href={foodMap.href}
            onClick={handleFoodMapOpen}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>{t('lucky.mapCta', { food: lucky.food.name })}</span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M15 4h5v5" />
              <path d="m20 4-9 9" />
              <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
            </svg>
          </a>
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
