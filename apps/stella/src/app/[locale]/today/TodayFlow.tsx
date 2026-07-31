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
    <DailyPageShell failed={failed} invalid={invalid} reading={reading} shared={shared} surface="today">
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
