'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import cardStyles from '@/components/card.module.css'

import DailyPageShell from '../today/DailyPageShell'
import LuckySection from '../today/LuckySection'
import { useDailyReading } from '../today/useDailyReading'
import { useDailyShare } from '../today/useDailyShare'

export default function TomorrowFlow() {
  const locale = useLocale()
  const t = useTranslations('Tomorrow')
  const ts = useTranslations('Shared')
  const { failed, invalid, reading, shared } = useDailyReading('tomorrow')
  const share = useDailyShare('tomorrow', reading)

  const homeHref = `/${locale}`

  return (
    <DailyPageShell failed={failed} invalid={invalid} reading={reading} shared={shared} surface="tomorrow">
      {reading && (
        <div className="w-full space-y-3 sm:space-y-5">
          <LuckySection lucky={reading.lucky} namespace="Tomorrow" sky={reading.sky} />

          <p className="text-center text-[11px] leading-relaxed text-foreground-faint">{t('note')}</p>

          {!reading.birth && (
            <section
              className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 text-center backdrop-blur sm:p-5`}
            >
              <p className="text-sm font-semibold text-foreground-secondary">{t('personalize.title')}</p>
              <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{t('personalize.hint')}</p>
              <Link
                className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
                href={homeHref}
              >
                {t('personalize.cta')}
              </Link>
            </section>
          )}

          <div className="flex flex-col items-center gap-3 pt-1">
            {shared ? (
              <a
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                href={homeHref}
              >
                {ts('createOwn')}
              </a>
            ) : (
              <>
                <button
                  className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
                  onClick={share}
                  type="button"
                >
                  {t('share.button')}
                </button>
                {reading.birth && (
                  <p className="text-center text-[11px] leading-relaxed text-foreground-faint">{ts('privacy')}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DailyPageShell>
  )
}
