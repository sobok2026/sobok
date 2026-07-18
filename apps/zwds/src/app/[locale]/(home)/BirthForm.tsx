'use client'

import type { BirthplaceSnapshot } from '@sobok/domain/birthplace/model'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useState } from 'react'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import type { BirthGender, StoredBirth } from '@/lib/birth-storage'
import BirthplaceCombobox from './BirthplaceCombobox'

const fieldClass =
  'w-full appearance-none rounded-xl border border-border-2 bg-surface-2 px-3 py-2.5 text-base text-foreground outline-none transition [color-scheme:dark] focus:border-white/60 focus:bg-surface-3 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-muted'

type Props = {
  onSubmit: (birth: StoredBirth, persistent: boolean) => void
}

export default function BirthForm({ onSubmit }: Props) {
  const [date, setDate] = useState('2000-01-01')
  const [time, setTime] = useState('12:00')
  const [gender, setGender] = useState<BirthGender>('female')
  const [place, setPlace] = useState<BirthplaceSnapshot | null>(null)
  const [save, setSave] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const profile = useBirthProfile()
  const t = useTranslations('Zwds.form')

  function submit(e: SubmitEvent) {
    e.preventDefault()
    const [year, month, day] = date.split('-').map(Number)

    if (!year || !month || !day) {
      setError(t('invalidDate'))
      return
    }

    if (!place) {
      setError(t('cityRequired'))
      return
    }

    setError(null)
    onSubmit({ date, time, gender, place }, save)
  }

  // Forget the current profile and reset the form to a blank slate. Lives here —
  // where saving is managed — rather than shouting from the result view.
  function handleClear() {
    profile.clear()
    setDate('2000-01-01')
    setTime('12:00')
    setGender('female')
    setPlace(null)
    setSave(false)
    setError(null)
  }

  // Prefill from the stored copy after mount, restoring the checkbox to match
  // where the data actually lives (persistent device vs. this session only).
  useEffect(() => {
    if (profile.hydrated && profile.birth) {
      setDate(profile.birth.date)
      setTime(profile.birth.time)
      setGender(profile.birth.gender)
      setPlace(profile.birth.place)
      setSave(profile.persistent)
    }
  }, [profile.birth, profile.hydrated, profile.persistent])

  return (
    <form
      className="relative z-20 w-full max-w-lg rounded-3xl border bg-surface-2 p-4 backdrop-blur-xl sm:p-5"
      onSubmit={submit}
    >
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
            className={fieldClass}
            id="birth-time"
            onChange={(e) => setTime(e.target.value)}
            required
            type="time"
            value={time}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-faint">{t('timeHint')}</p>
        </div>

        <fieldset>
          <legend className={labelClass}>{t('genderLabel')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['female', 'male'] as const).map((value) => (
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${
                  gender === value
                    ? 'border-border-strong bg-surface-3 text-foreground'
                    : 'border-border-2 bg-surface-2 text-foreground-subtle hover:text-foreground-muted'
                }`}
                key={value}
              >
                <input
                  checked={gender === value}
                  className="sr-only"
                  name="birth-gender"
                  onChange={() => setGender(value)}
                  type="radio"
                  value={value}
                />
                {value === 'female' ? t('genderFemale') : t('genderMale')}
              </label>
            ))}
          </div>
        </fieldset>

        <BirthplaceCombobox onSelect={setPlace} value={place} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input checked={save} className="h-4 w-4" onChange={(e) => setSave(e.target.checked)} type="checkbox" />
            {t('saveLabel')}
          </label>
          {profile.persistent && (
            <button
              className="text-[11px] leading-4 text-foreground-subtle transition hover:text-foreground-secondary hover:underline"
              onClick={handleClear}
              type="button"
            >
              {t('clearSaved')}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-faint">{t('saveHint')}</p>
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <button
        className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
        type="submit"
      >
        {t('submit')}
      </button>
    </form>
  )
}
