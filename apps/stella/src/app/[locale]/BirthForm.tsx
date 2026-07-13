'use client'

import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useState } from 'react'

import { clearBirth, loadBirth, saveBirth } from './birth-storage'
import CityCombobox from './CityCombobox'
import { DEFAULT_CITY_KEY, findCity } from './cities'
import type { BirthInput } from './ephemeris'

const fieldClass =
  'w-full appearance-none rounded-xl border border-border-2 bg-surface-2 px-3 py-2.5 text-base text-foreground outline-none transition [color-scheme:dark] focus:border-brand/60 focus:bg-surface-3 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-muted'

type Props = {
  computing: boolean
  onSubmit: (input: BirthInput) => void
}

export default function BirthForm({ computing, onSubmit }: Props) {
  const t = useTranslations('Constellation.form')
  const [date, setDate] = useState('2000-01-01')
  const [time, setTime] = useState('12:00')
  const [timeUnknown, setTimeUnknown] = useState(false)
  const [cityKey, setCityKey] = useState(DEFAULT_CITY_KEY)
  const [save, setSave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: SubmitEvent) {
    e.preventDefault()
    const [year, month, day] = date.split('-').map(Number)

    if (!year || !month || !day) {
      setError(t('invalidDate'))
      return
    }

    const [hour, minute] = timeUnknown ? [12, 0] : time.split(':').map(Number)
    const city = findCity(cityKey)
    setError(null)

    if (save) {
      saveBirth({
        date,
        time,
        timeKnown: !timeUnknown,
        cityKey,
      })
    } else {
      clearBirth()
    }

    onSubmit({
      year,
      month,
      day,
      hour: hour ?? 12,
      minute: minute ?? 0,
      latitude: city.latitude,
      longitude: city.longitude,
      timeZone: city.timeZone,
      timeKnown: !timeUnknown,
    })
  }

  // Prefill from the device-local copy after mount
  useEffect(() => {
    const stored = loadBirth()

    if (stored) {
      setDate(stored.date)
      setTime(stored.time)
      setTimeUnknown(!stored.timeKnown)
      setCityKey(stored.cityKey)
      setSave(true)
    }
  }, [])

  return (
    <form className="w-full rounded-3xl border bg-surface-2 p-4 backdrop-blur-xl sm:p-5" onSubmit={submit}>
      <h2 className="mb-4 text-center text-base font-bold text-foreground">{t('title')}</h2>

      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="birth-date">
            {t('dateLabel')}
          </label>
          <input
            className={fieldClass}
            id="birth-date"
            max="2030-12-31"
            min="1900-01-01"
            onChange={(e) => setDate(e.target.value)}
            required
            type="date"
            value={date}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="birth-time">
            {t('timeLabel')}
          </label>
          <input
            className={`${fieldClass} disabled:opacity-40`}
            disabled={timeUnknown}
            id="birth-time"
            onChange={(e) => setTime(e.target.value)}
            type="time"
            value={time}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-foreground-subtle">
            <input
              checked={timeUnknown}
              className="h-4 w-4"
              onChange={(e) => setTimeUnknown(e.target.checked)}
              type="checkbox"
            />
            {t('timeUnknown')}
          </label>
          {timeUnknown && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-faint">{t('timeUnknownHint')}</p>
          )}
        </div>

        <CityCombobox cityKey={cityKey} onSelect={setCityKey} />
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-xs text-foreground-muted">
          <input checked={save} className="h-4 w-4" onChange={(e) => setSave(e.target.checked)} type="checkbox" />
          {t('saveLabel')}
        </label>
        <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-faint">{t('saveHint')}</p>
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <button
        className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] disabled:opacity-70"
        disabled={computing}
        type="submit"
      >
        {computing ? t('computing') : t('submit')}
      </button>
    </form>
  )
}
