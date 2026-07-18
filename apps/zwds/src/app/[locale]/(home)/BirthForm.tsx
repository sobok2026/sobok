'use client'

import type { BirthplaceSnapshot } from '@sobok/domain/birthplace/model'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import type { BirthGender, StoredBirth } from '@/lib/birth-storage'
import BirthplaceCombobox from './BirthplaceCombobox'

const fieldClass =
  'w-full appearance-none rounded-xl border border-outline bg-surface-2 px-3 py-2.5 text-base text-foreground outline-none transition [color-scheme:dark] focus:border-primary focus:bg-surface-3 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-muted'

type Props = {
  onCancel?: () => void
  onProfileCleared?: () => void
  onSubmit: (birth: StoredBirth, persistent: boolean) => void
}

export default function BirthForm({ onCancel, onProfileCleared, onSubmit }: Props) {
  // The form only mounts once the profile has hydrated (ZwdsHome gates it), so
  // seeding state lazily from the stored copy avoids a prefill effect — and the
  // one-frame flash of blank defaults it would cause.
  const profile = useBirthProfile()
  const seed = profile.birth
  const [date, setDate] = useState(seed?.date ?? '2000-01-01')
  const [time, setTime] = useState(seed?.time ?? '12:00')
  const [gender, setGender] = useState<BirthGender>(seed?.gender ?? 'male')
  const [place, setPlace] = useState<BirthplaceSnapshot | null>(seed?.place ?? null)
  const [save, setSave] = useState(profile.persistent)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const t = useTranslations('Zwds.form')
  const editing = onCancel !== undefined

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
    setGender('male')
    setPlace(null)
    setSave(false)
    setError(null)
    onProfileCleared?.()
  }

  useEffect(() => {
    if (editing) {
      headingRef.current?.focus()
    }
  }, [editing])

  return (
    <form
      className="relative z-20 w-full max-w-lg rounded-3xl border bg-surface-2 p-4 backdrop-blur-xl sm:p-5"
      onSubmit={submit}
    >
      <h2
        className="mb-4 text-center text-base font-bold text-foreground"
        ref={headingRef}
        tabIndex={editing ? -1 : undefined}
      >
        {editing ? t('editTitle') : t('title')}
      </h2>

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
            {(['male', 'female'] as const).map((value) => (
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${
                  gender === value
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-outline bg-surface-2 text-foreground-subtle hover:text-foreground-muted'
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
            <input
              checked={save}
              className="h-4 w-4 accent-accent"
              onChange={(e) => setSave(e.target.checked)}
              type="checkbox"
            />
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

      <div className={`mt-5 grid gap-2 ${editing ? 'grid-cols-2' : ''}`}>
        {onCancel && (
          <button
            className="min-h-11 rounded-full border border-border-strong px-5 text-sm font-semibold text-foreground-secondary transition hover:bg-surface-3 active:scale-[0.98] motion-reduce:active:scale-100"
            onClick={onCancel}
            type="button"
          >
            {t('cancel')}
          </button>
        )}
        <button
          className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98] motion-reduce:active:scale-100"
          type="submit"
        >
          {editing ? t('applyChanges') : t('submit')}
        </button>
      </div>
    </form>
  )
}
