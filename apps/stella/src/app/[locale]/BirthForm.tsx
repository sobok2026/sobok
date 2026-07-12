'use client'

import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useState } from 'react'

import { loadBirth, saveBirth } from './birth-storage'
import { CITY_GROUPS, DEFAULT_CITY_KEY, findCity } from './cities'
import type { BirthInput } from './ephemeris'

const fieldClass =
  'w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-base text-slate-100 outline-none transition [color-scheme:dark] focus:border-[#f5bcff]/60 focus:bg-white/10 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-300'

export default function BirthForm({
  computing,
  onSubmit,
}: {
  computing: boolean
  onSubmit: (input: BirthInput) => void
}) {
  const t = useTranslations('Constellation.form')
  const [date, setDate] = useState('2000-01-01')
  const [time, setTime] = useState('12:00')
  const [timeUnknown, setTimeUnknown] = useState(false)
  const [cityKey, setCityKey] = useState(DEFAULT_CITY_KEY)
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

    saveBirth({
      date,
      time,
      timeKnown: !timeUnknown,
      cityKey,
    })

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
    }
  }, [])

  return (
    <form
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5"
      onSubmit={submit}
    >
      <h2 className="mb-4 text-center text-base font-bold text-slate-100">{t('title')}</h2>

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
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <input
              checked={timeUnknown}
              className="h-4 w-4 accent-brand"
              onChange={(e) => setTimeUnknown(e.target.checked)}
              type="checkbox"
            />
            {t('timeUnknown')}
          </label>
        </div>

        <div>
          <label className={labelClass} htmlFor="birth-city">
            {t('cityLabel')}
          </label>
          <div className="relative">
            <select
              className={`${fieldClass} pr-9`}
              id="birth-city"
              onChange={(e) => setCityKey(e.target.value)}
              value={cityKey}
            >
              {CITY_GROUPS.map((group) => (
                <optgroup key={group.iso2} label={group.country}>
                  {group.cities.map((city) => (
                    <option className="bg-[#12091f] text-slate-100" key={city.key} value={city.key}>
                      {city.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {/* appearance-none removes the native dropdown arrow, so draw our own. */}
            <svg
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {timeUnknown && <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{t('timeUnknownHint')}</p>}
      {error && <p className="mt-3 text-xs text-[#fb7185]">{error}</p>}

      <button
        className="mt-5 w-full rounded-full bg-linear-to-r from-[#7cc4ff] to-brand px-6 py-3 text-sm font-bold text-[#0a0618] shadow-[0_0_36px_rgba(245,188,255,0.45)] transition active:scale-[0.98] disabled:opacity-70"
        disabled={computing}
        type="submit"
      >
        {computing ? t('computing') : t('submit')}
      </button>
    </form>
  )
}
