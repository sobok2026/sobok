'use client'

import { track } from '@sobok/analytics/browser'
import clsx from 'clsx'
import moment from 'moment-timezone'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { signOfLon } from '@/chart/astrology'
import { GUARDIAN_DAILY_UI as copy } from '@/content/guardian-daily-ui'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  cacheGuardianDailyCard,
  clearGuardianPassSession,
  GuardianApiError,
  type GuardianDailyTone,
  type GuardianPassSession,
  type GuardianWeekResponse,
  guardianCollectionCacheScope,
  guardianPassPaths,
  readGuardianPassSession,
  readGuardianToneIntent,
  readGuardianWeek,
  readOrCreateGuardianViewerId,
  requestGuardianDailyCard,
  storeGuardianToneIntent,
} from '@/lib/guardian-daily'
import GuardianCardReading from './GuardianCardReading'
import GuardianDailySection, { GuardianAccountSave } from './GuardianDailySection'
import { computeSkyToday } from './sky'
import type { DailyReading } from './useDailyReading'

type Week = Extract<GuardianWeekResponse, { status: 'ready' }>
type State = { kind: 'loading' | 'none' | 'error' } | { kind: 'ready'; week: Week }

export default function GuardianWeekSection({ reading, shared }: { reading: DailyReading; shared: boolean }) {
  const locale = useLocale()
  const { data: accountSession } = stellaAuthClient.useSession()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [selectedDateKey, setSelectedDateKey] = useState(reading.dateKey)
  const [tones, setTones] = useState<Record<string, GuardianDailyTone | null>>({})
  const [passSession, setPassSession] = useState<GuardianPassSession | null>(null)
  const [openingDateKey, setOpeningDateKey] = useState<string | null>(null)
  const [errorDateKey, setErrorDateKey] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const epoch = useRef(0)
  const viewed = useRef(new Set<string>())
  const paths = guardianPassPaths(locale)

  useEffect(() => {
    if (locale !== 'ko' || shared) return
    const currentEpoch = ++epoch.current
    let cancelled = false
    setState({ kind: 'loading' })
    setOpeningDateKey(null)
    setErrorDateKey(null)

    async function load() {
      let session = readGuardianPassSession()

      try {
        let result: GuardianWeekResponse

        try {
          result = await readGuardianWeek(session?.accessToken)
        } catch (error) {
          if (!(error instanceof GuardianApiError) || error.status !== 403 || !session?.accessToken) throw error
          clearGuardianPassSession()
          session = null
          result = await readGuardianWeek()
        }

        if (cancelled || currentEpoch !== epoch.current) return
        setPassSession(session)
        if (result.status === 'none') {
          setState({ kind: 'none' })
          return
        }

        setSelectedDateKey((selected) => {
          if (result.days.some(({ dateKey }) => dateKey === selected)) return selected
          const next = result.days.find(({ dateKey }) => dateKey >= reading.dateKey) ?? result.days[0]
          return next?.dateKey ?? reading.dateKey
        })
        setTones(Object.fromEntries(result.days.map(({ dateKey }) => [dateKey, readGuardianToneIntent(dateKey)])))
        setState({ kind: 'ready', week: result })
      } catch {
        if (!cancelled && currentEpoch === epoch.current) setState({ kind: 'error' })
      }
    }

    void load()

    return () => {
      cancelled = true
      epoch.current += 1
    }
  }, [accountSession?.user.id, locale, reading.dateKey, retry, shared])

  const week = state.kind === 'ready' ? state.week : null
  const day = week?.days.find(({ dateKey }) => dateKey === selectedDateKey)
  const tone = tones[selectedDateKey] ?? null

  useEffect(() => {
    if (!week || !day?.card) return
    const key = `${week.collectionPublicId}:${day.dateKey}`
    if (viewed.current.has(key)) return
    viewed.current.add(key)
    track('guardian_daily_card_view', {
      surface: 'week',
      date_key: day.dateKey,
      personalized: day.card.basis === 'natal_sun',
      tone: day.card.tone,
      theme: day.card.theme,
      rarity: day.card.rarity,
      archived: true,
    })
  }, [day, week])

  async function openCard() {
    if (!week || !day || day.card || !tone || !week.access.active || openingDateKey) return
    const currentEpoch = epoch.current
    const dateKey = day.dateKey
    setOpeningDateKey(dateKey)
    setErrorDateKey(null)

    try {
      const sky = await computeSkyToday(moment.tz(`${dateKey} 12:00`, 'YYYY-MM-DD HH:mm', week.timeZone).toDate())
      const sun = reading.natal?.planets.find(({ id }) => id === 'sun')
      const session = readGuardianPassSession()
      const result = await requestGuardianDailyCard({
        surface: 'week',
        dateKey,
        timeZone: week.timeZone,
        basis: sun ? 'natal_sun' : 'daily_moon',
        sign: sun ? signOfLon(sun.lon) : sky.moonSign,
        skySign: sky.moonSign,
        tone,
        viewerId: readOrCreateGuardianViewerId(),
        accessToken: session?.accessToken,
      })
      if (currentEpoch !== epoch.current) return
      if (result.status !== 'ready' || result.collectionPublicId !== week.collectionPublicId) {
        setRetry((value) => value + 1)
        return
      }

      try {
        storeGuardianToneIntent(dateKey, result.card.tone)
        cacheGuardianDailyCard(guardianCollectionCacheScope(week.collectionPublicId), result.card, true)
      } catch {
        // The server snapshot remains available when optional browser storage is blocked.
      }

      setState((current) => {
        if (current.kind !== 'ready' || current.week.collectionPublicId !== week.collectionPublicId) return current

        return {
          kind: 'ready',
          week: {
            ...current.week,
            access: result.access,
            days: current.week.days.map((item) => (item.dateKey === dateKey ? { ...item, card: result.card } : item)),
          },
        }
      })
      track('guardian_week_reveal_selected', { date_key: dateKey, tone, theme: result.card.theme })
    } catch {
      if (currentEpoch === epoch.current) setErrorDateKey(dateKey)
    } finally {
      if (currentEpoch === epoch.current) setOpeningDateKey(null)
    }
  }

  if (locale !== 'ko' || shared) return null
  if (state.kind === 'none') return <GuardianDailySection reading={reading} shared={shared} surface="tomorrow" />

  if (state.kind === 'loading') {
    return <p className="py-8 text-center text-sm text-foreground-muted">{copy.states.loading}</p>
  }

  if (state.kind === 'error' || !week || !day) {
    return (
      <div className="rounded-3xl border border-white/10 bg-surface-2 p-6 text-center">
        <p className="text-sm text-foreground-muted">{copy.states.error}</p>
        <button
          className="mt-4 min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm text-foreground-secondary"
          onClick={() => setRetry((value) => value + 1)}
          type="button"
        >
          {copy.states.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="guardian-week-heading" className="px-1 sm:px-3">
        <p className="text-xs font-medium text-accent">{copy.week.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl" id="guardian-week-heading">
          {copy.week.title}
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">{copy.week.intro}</p>
        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <p className="text-foreground-secondary">{formatRange(week.days[0]?.dateKey, week.days.at(-1)?.dateKey)}</p>
          <p className="text-xs text-foreground-subtle">
            {copy.week.opened(week.days.filter(({ card }) => card).length)}
          </p>
        </div>
        <fieldset className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          <legend className="sr-only">{copy.week.dates}</legend>
          {week.days.map((item) => (
            <button
              aria-label={`${formatDate(item.dateKey, true)} · ${copy.card.themes[item.theme]} · ${dayStatus(item.card !== null)}`}
              aria-pressed={item.dateKey === selectedDateKey}
              className={clsx(
                'flex min-h-20 w-full flex-col items-center justify-center gap-1 px-2 py-2',
                'rounded-2xl border text-foreground-secondary transition-colors',
                'hover:border-pink-200/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                'motion-reduce:transition-none',
                item.dateKey === selectedDateKey ? 'border-pink-200/50 bg-pink-100/12' : 'border-white/8 bg-surface-2',
              )}
              key={item.dateKey}
              onClick={() => setSelectedDateKey(item.dateKey)}
              type="button"
            >
              <span className="text-xs text-foreground-subtle">{formatWeekday(item.dateKey)}</span>
              <span className="text-lg font-semibold text-white">{Number(item.dateKey.slice(-2))}</span>
              <span aria-hidden className={clsx('size-1.5 rounded-full', item.card ? 'bg-positive' : 'bg-white/20')} />
            </button>
          ))}
        </fieldset>
      </section>

      <div aria-live="polite">
        {day.card && (
          <GuardianCardReading
            accessExpiresAt={week.access.active ? week.access.expiresAt : null}
            accessTimeZone={week.timeZone}
            archived
            card={day.card}
            surface="week"
          />
        )}
        {!day.card && week.access.active && (
          <section className="rounded-[2rem] border border-pink-200/20 bg-surface-2 px-5 py-6 sm:px-7">
            <p className="text-center text-xs font-medium text-accent">{formatDate(day.dateKey, true)}</p>
            <h3 className="mt-2 text-center text-xl font-bold text-white">
              {copy.week.themeTitle(copy.card.themes[day.theme])}
            </h3>
            <fieldset className="mt-7">
              <legend className="text-base font-semibold text-white">{copy.week.choose}</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(copy.tone.options).map(([value, option]) => (
                  <button
                    aria-pressed={value === tone}
                    className={clsx(
                      'min-h-20 px-3 py-3 text-left',
                      'rounded-2xl border transition-colors',
                      'hover:border-pink-200/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      'motion-reduce:transition-none',
                      value === tone ? 'border-pink-200/50 bg-pink-100/12' : 'border-white/10 bg-white/3',
                    )}
                    disabled={openingDateKey === day.dateKey}
                    key={value}
                    onClick={() => setTones((current) => ({ ...current, [day.dateKey]: value as GuardianDailyTone }))}
                    type="button"
                  >
                    <span className="block text-sm font-semibold text-white">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-foreground-subtle">{option.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              className={clsx(
                'mt-5 min-h-12 w-full px-5 py-3',
                'rounded-2xl bg-pink-100 text-sm font-bold text-[#24142e] transition-opacity',
                'hover:opacity-90 disabled:opacity-40 motion-reduce:transition-none',
              )}
              disabled={!tone || openingDateKey !== null}
              onClick={() => void openCard()}
              type="button"
            >
              {openingDateKey === day.dateKey ? copy.week.opening : copy.week.open(formatDate(day.dateKey))}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-foreground-subtle">{copy.week.chooseNote}</p>
            {errorDateKey === day.dateKey && (
              <p className="mt-3 text-center text-xs text-danger">{copy.states.error}</p>
            )}
          </section>
        )}
        {!day.card && !week.access.active && (
          <div className="rounded-3xl border border-white/10 bg-surface-2 p-6 text-center">
            <p className="text-sm leading-6 text-foreground-muted">{copy.week.expired}</p>
          </div>
        )}
      </div>

      {!week.access.active && (
        <Link
          className="block rounded-2xl bg-pink-100 px-5 py-3 text-center text-sm font-bold text-[#24142e]"
          href={paths.checkout}
        >
          {copy.week.nextWeek}
        </Link>
      )}
      {day.card && passSession && !passSession.claimed && (
        <GuardianAccountSave onClaimed={setPassSession} passSession={passSession} surface="tomorrow" />
      )}
    </div>
  )
}

function formatDate(dateKey: string, weekday = false): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    ...(weekday ? { weekday: 'long' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`))
}

function formatWeekday(dateKey: string): string {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T12:00:00Z`),
  )
}

function formatRange(first?: string, last?: string): string {
  if (!first || !last) return ''
  return `${formatDate(first)} — ${formatDate(last)}`
}

function dayStatus(opened: boolean): string {
  if (opened) return copy.week.dayReady
  return copy.week.dayUnopened
}
