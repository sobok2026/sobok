'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { computeChart } from '@/chart/compute'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import type { StoredBirth } from '@/lib/birth-storage'
import BirthForm from './BirthForm'
import ChartGrid from './ChartGrid'
import PalaceDetail from './PalaceDetail'
import ReportSection from './ReportSection'
import ZwdsActions from './ZwdsActions'

export default function ZwdsHome() {
  const t = useTranslations('Zwds.hero')
  const tChart = useTranslations('Zwds.chart')
  const profile = useBirthProfile()
  const [editing, setEditing] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const birth = profile.hydrated ? profile.birth : null

  const chart = useMemo(() => {
    if (!birth) {
      return null
    }

    return computeChart({
      date: birth.date,
      time: birth.time,
      gender: birth.gender,
      longitude: birth.place.longitude,
      timeZone: birth.place.timeZone,
    })
  }, [birth])

  function handleSubmit(nextBirth: StoredBirth, persistent: boolean) {
    profile.save(nextBirth, persistent)
    setEditing(false)
    setSelectedBranch(null)
  }

  const selectedPalace =
    chart && selectedBranch ? chart.palaces.find((palace) => palace.branch === selectedBranch) : null

  return (
    <main className="bg-night-palace flex min-h-dvh flex-col items-center px-4 pt-[max(2.5rem,var(--safe-area-top))] pb-[max(2.5rem,var(--safe-area-bottom))]">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">{t('eyebrow')}</p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-subtle">{t('subtitle')}</p>
      </header>

      {chart && !editing ? (
        <div className="flex w-full flex-col items-center gap-6">
          <ChartGrid
            chart={chart}
            onSelectPalace={(branch) => setSelectedBranch(branch === selectedBranch ? null : branch)}
            selectedBranch={selectedBranch}
          />
          {!selectedPalace && <p className="text-xs text-foreground-faint">{tChart('palaceHint')}</p>}
          {selectedPalace && (
            <PalaceDetail chart={chart} onClose={() => setSelectedBranch(null)} palace={selectedPalace} />
          )}
          <ZwdsActions chart={chart} />
          <ReportSection chart={chart} />
          <button
            className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold text-foreground-secondary transition hover:bg-surface-3 active:scale-[0.98] motion-reduce:active:scale-100"
            onClick={() => setEditing(true)}
            type="button"
          >
            {t('reopenCta')}
          </button>
        </div>
      ) : (
        <BirthForm onSubmit={handleSubmit} />
      )}
    </main>
  )
}
