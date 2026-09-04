'use client'

import { useLocale, useTranslations } from 'next-intl'

import cardStyles from '@/components/card.module.css'
import { PersonalizeCard } from '@/components/PersonalizeCard'
import { ReadingActions } from '@/components/ReadingActions'

import DailyPageShell from '../today/DailyPageShell'
import GuardianDailySection from '../today/GuardianDailySection'
import LuckySection from '../today/LuckySection'
import { useDailyReading } from '../today/useDailyReading'
import { useDailyShare } from '../today/useDailyShare'

export default function TomorrowFlow() {
  const { failed, invalid, reading, shared } = useDailyReading('tomorrow')
  const share = useDailyShare('tomorrow', reading)
  const t = useTranslations('Tomorrow')
  const locale = useLocale()

  const homeHref = `/${locale}`

  return (
    <DailyPageShell
      dateKey={reading?.dateKey}
      failed={failed}
      invalid={invalid}
      loading={!reading}
      namespace="Tomorrow"
      shared={shared}
    >
      {reading && (
        <div className="w-full space-y-3 sm:space-y-5">
          <LuckySection lucky={reading.lucky} namespace="Tomorrow" sky={reading.sky} />

          <GuardianDailySection reading={reading} shared={shared} surface="tomorrow" />

          <p className="text-center text-[11px] leading-relaxed text-foreground-faint">{t('note')}</p>

          {!reading.birth && (
            <section
              className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 text-center backdrop-blur sm:p-5`}
            >
              <PersonalizeCard
                cta={t('personalize.cta')}
                hint={t('personalize.hint')}
                homeHref={homeHref}
                title={t('personalize.title')}
              />
            </section>
          )}

          <ReadingActions
            homeHref={homeHref}
            onShare={share}
            shareLabel={t('share.button')}
            shared={shared}
            showPrivacy={reading.birth !== null}
          />
        </div>
      )}
    </DailyPageShell>
  )
}
