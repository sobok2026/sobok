'use client'

import { useLocale } from 'next-intl'

import DailyPageShell from './DailyPageShell'
import TodayBody from './TodayBody'
import { useDailyReading } from './useDailyReading'
import { useDailyShare } from './useDailyShare'

export default function TodayFlow() {
  const locale = useLocale()
  const { failed, invalid, reading, shared, teaserFood } = useDailyReading('today')
  const share = useDailyShare('today', reading)

  return (
    <DailyPageShell
      dateKey={reading?.dateKey}
      failed={failed}
      invalid={invalid}
      loading={!reading}
      namespace="Today"
      shared={shared}
    >
      {reading && (
        <TodayBody
          data={{ ...reading, tomorrowFood: teaserFood }}
          homeHref={`/${locale}`}
          onShare={share}
          shared={shared}
        />
      )}
    </DailyPageShell>
  )
}
