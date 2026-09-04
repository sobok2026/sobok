'use client'

import { track, trackEcommerce } from '@sobok/analytics/browser'
import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { signOfLon } from '@/chart/astrology'
import cardStyles from '@/components/card.module.css'
import { GUARDIAN_DAILY_UI as copy } from '@/content/guardian-daily-ui'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  browserTimeZone,
  cacheGuardianDailyCard,
  claimGuardianCollection,
  clearGuardianPassSession,
  GUARDIAN_CLAIM_INTENT_KEY,
  GUARDIAN_CURRENCY,
  GUARDIAN_DAILY_THEMES,
  GUARDIAN_DAILY_TONES,
  GUARDIAN_PASS_ITEM,
  GUARDIAN_PASS_PRICE,
  GuardianApiError,
  type GuardianDailyBasis,
  type GuardianDailyCardResponse,
  type GuardianDailyCardView,
  type GuardianDailyTheme,
  type GuardianDailyTone,
  type GuardianPassSession,
  guardianCollectionCacheScope,
  guardianPassPaths,
  guardianViewerCacheScope,
  listGuardianCards,
  readArchivedGuardianCards,
  readCachedGuardianCard,
  readGuardianPassSession,
  readGuardianToneIntent,
  readOrCreateGuardianViewerId,
  requestGuardianDailyCard,
  storeGuardianPassSession,
  storeGuardianToneIntent,
} from '@/lib/guardian-daily'
import type { DailyReading } from './useDailyReading'

type Props = {
  reading: DailyReading
  shared: boolean
  surface: 'today' | 'tomorrow'
}

type CardState =
  | { kind: 'loading' }
  | { kind: 'ready'; result: Extract<GuardianDailyCardResponse, { status: 'ready' }> }
  | { kind: 'locked'; theme: GuardianDailyTheme }
  | {
      kind: 'tone_required'
      theme: GuardianDailyTheme
      access: Extract<GuardianDailyCardResponse, { status: 'tone_required' }>['access']
    }
  | { kind: 'error' }

export default function GuardianDailySection({ reading, shared, surface }: Props) {
  const locale = useLocale()
  const [tone, setTone] = useState<GuardianDailyTone>('comfort')
  const [requestedTone, setRequestedTone] = useState<GuardianDailyTone | null>(null)
  const [hydratedDateKey, setHydratedDateKey] = useState<string | null>(null)
  const [passSession, setPassSession] = useState<GuardianPassSession | null>(null)
  const [state, setState] = useState<CardState>({ kind: 'loading' })
  const [archive, setArchive] = useState<GuardianDailyCardView[]>([])
  const [retry, setRetry] = useState(0)
  const toneRef = useRef<GuardianDailyTone>('comfort')
  const trackedDate = useRef<string | null>(null)
  const trackedPaywallDate = useRef<string | null>(null)

  const sun = reading.natal?.planets.find(({ id }) => id === 'sun')
  const sign = sun ? signOfLon(sun.lon) : reading.sky.moonSign
  const basis: GuardianDailyBasis = sun ? 'natal_sun' : 'daily_moon'
  const paths = guardianPassPaths(locale)

  useEffect(() => {
    if (locale !== 'ko' || shared) return
    const toneIntent = readGuardianToneIntent(reading.dateKey)
    const storedTone = toneIntent ?? 'comfort'
    toneRef.current = storedTone
    setTone(storedTone)
    setRequestedTone(surface === 'tomorrow' ? toneIntent : null)
    const session = readGuardianPassSession()
    setPassSession(session)
    try {
      const scope = session?.claimed
        ? null
        : session
          ? guardianCollectionCacheScope(session.collectionPublicId)
          : guardianViewerCacheScope(readOrCreateGuardianViewerId())
      setArchive(scope ? readArchivedGuardianCards(scope) : [])
    } catch {
      setArchive([])
    }
    setHydratedDateKey(reading.dateKey)
    if (session) {
      void listGuardianCards(session.accessToken)
        .then((library) => {
          for (const card of library.items) {
            cacheGuardianDailyCard(guardianCollectionCacheScope(card.collectionPublicId), card, true)
          }
          setArchive(library.items)
        })
        .catch(() => {
          // The current card still works if optional archive hydration fails.
        })
    }
  }, [locale, reading.dateKey, shared, surface])

  useEffect(() => {
    if (locale !== 'ko' || shared || hydratedDateKey !== reading.dateKey) return
    let cancelled = false

    async function load() {
      const session = readGuardianPassSession()
      let viewerId: string
      try {
        viewerId = readOrCreateGuardianViewerId()
      } catch {
        if (!cancelled) setState({ kind: 'error' })
        return
      }
      const cacheScope = session?.claimed
        ? null
        : session
          ? guardianCollectionCacheScope(session.collectionPublicId)
          : guardianViewerCacheScope(viewerId)
      const cached = cacheScope ? readCachedGuardianCard(cacheScope, reading.dateKey) : null
      if (cached && cacheScope) {
        setState({
          kind: 'ready',
          result: {
            status: 'ready',
            collectionPublicId: cacheScope.startsWith('collection:') ? cacheScope.slice('collection:'.length) : null,
            card: cached,
            access: {
              active: Boolean(session?.accessExpiresAt && new Date(session.accessExpiresAt) > new Date()),
              expiresAt: session?.accessExpiresAt ?? null,
            },
            archived: readArchivedGuardianCards(cacheScope).some(({ dateKey }) => dateKey === cached.dateKey),
          },
        })
      } else {
        setState({ kind: 'loading' })
      }

      const request = (accessToken?: string) =>
        requestGuardianDailyCard({
          surface,
          dateKey: reading.dateKey,
          timeZone: browserTimeZone(),
          basis,
          sign,
          skySign: reading.sky.moonSign,
          ...(surface === 'tomorrow' && requestedTone ? { tone: requestedTone } : {}),
          viewerId,
          accessToken,
        })

      try {
        let result: GuardianDailyCardResponse
        try {
          result = await request(session?.accessToken)
        } catch (error) {
          if (!(error instanceof GuardianApiError) || error.status !== 403 || !session?.accessToken) throw error
          clearGuardianPassSession()
          if (!cancelled) setPassSession(null)
          result = await request()
        }
        if (cancelled) return
        if (result.access.expiresAt && session) {
          const next = { ...session, accessExpiresAt: result.access.expiresAt }
          try {
            storeGuardianPassSession(next)
          } catch {
            // Server access remains authoritative when optional browser state cannot be refreshed.
          }
          setPassSession(next)
        }
        if (result.status === 'locked') {
          setState({ kind: 'locked', theme: result.theme })
          return
        }
        if (result.status === 'tone_required') {
          setState({ kind: 'tone_required', theme: result.theme, access: result.access })
          return
        }
        const resultScope = result.collectionPublicId
          ? guardianCollectionCacheScope(result.collectionPublicId)
          : guardianViewerCacheScope(viewerId)
        cacheGuardianDailyCard(resultScope, result.card, result.archived)
        if (result.archived) {
          setArchive((current) => [result.card, ...current.filter(({ dateKey }) => dateKey !== result.card.dateKey)])
        }
        setState({ kind: 'ready', result })
      } catch {
        if (cancelled) return
        setState({ kind: 'error' })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [basis, hydratedDateKey, locale, reading.dateKey, requestedTone, retry, shared, sign, surface])

  useEffect(() => {
    if (state.kind !== 'ready' || trackedDate.current === state.result.card.dateKey) return
    trackedDate.current = state.result.card.dateKey
    track('guardian_daily_card_view', {
      surface,
      date_key: state.result.card.dateKey,
      personalized: state.result.card.basis === 'natal_sun',
      tone: state.result.card.tone,
      theme: state.result.card.theme,
      rarity: state.result.card.rarity,
      archived: state.result.archived,
    })
  }, [state, surface])

  useEffect(() => {
    if (state.kind !== 'locked' || trackedPaywallDate.current === reading.dateKey) return
    trackedPaywallDate.current = reading.dateKey
    trackEcommerce(
      'view_item',
      {
        currency: GUARDIAN_CURRENCY,
        value: GUARDIAN_PASS_PRICE,
        items: [GUARDIAN_PASS_ITEM],
      },
      { surface: 'tomorrow', date_key: reading.dateKey, theme: state.theme },
    )
  }, [reading.dateKey, state])

  const summary = localSummary(archive)

  if (locale !== 'ko' || shared) return null

  if (hydratedDateKey !== reading.dateKey || state.kind === 'loading') {
    return (
      <section className={`${cardStyles.card} rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur`}>
        <p className="animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy.states.loading}</p>
      </section>
    )
  }

  if (state.kind === 'error') {
    return (
      <section className={`${cardStyles.card} rounded-3xl border bg-surface-2 p-5 text-center backdrop-blur`}>
        <p className="text-sm text-foreground-muted">{copy.states.error}</p>
        <button
          className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-foreground-secondary"
          onClick={() => setRetry((value) => value + 1)}
          type="button"
        >
          {copy.states.retry}
        </button>
      </section>
    )
  }

  if (state.kind === 'locked') {
    return (
      <section
        aria-labelledby="guardian-tomorrow-title"
        className="relative isolate overflow-hidden rounded-[2rem] border border-pink-200/20 bg-[linear-gradient(145deg,rgba(255,221,236,0.11),rgba(92,58,145,0.12)_48%,rgba(10,6,24,0.9))] p-5 shadow-2xl sm:p-6"
      >
        <div aria-hidden className="absolute -right-16 -top-16 -z-10 size-52 rounded-full bg-pink-300/15 blur-3xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-200/80">
          {copy.locked.kicker(copy.themes[state.theme])}
        </p>
        <div className="mt-4 grid items-center gap-5 sm:grid-cols-[9rem_1fr]">
          <div className="relative mx-auto aspect-[3/4] w-32 overflow-hidden rounded-2xl border border-pink-100/20 bg-[radial-gradient(circle_at_50%_42%,rgba(255,220,238,0.22),transparent_42%),linear-gradient(145deg,#29183f,#10091d)] shadow-[0_16px_45px_rgba(0,0,0,0.4)]">
            <span aria-hidden className="absolute inset-0 grid place-items-center text-4xl text-pink-100/80">
              {themeGlyph(state.theme)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" id="guardian-tomorrow-title">
              {copy.locked.title(copy.themes[state.theme])}
            </h2>
            <p className="mt-2 text-xs leading-6 text-foreground-muted">{copy.locked.body}</p>
            {state.theme === 'love' ? (
              <p className="mt-2 text-[10px] leading-5 text-foreground-faint">{copy.loveVariationNote}</p>
            ) : null}
          </div>
        </div>

        <GuardianToneChooser
          name="guardian-locked-tone"
          onChange={(nextTone) => {
            toneRef.current = nextTone
            setTone(nextTone)
          }}
          tone={tone}
        />

        <Link
          className="mt-5 block w-full rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-3.5 text-center text-sm font-bold text-[#24142e] shadow-[0_12px_35px_rgba(255,193,214,0.18)]"
          href={paths.checkout}
          onClick={() => {
            storeGuardianToneIntent(reading.dateKey, toneRef.current)
            track('guardian_pass_checkout_selected', {
              source: 'tomorrow_card',
              tone: toneRef.current,
              theme: state.theme,
            })
          }}
        >
          {copy.locked.cta}
        </Link>
        <p className="mt-2 text-center text-[10px] text-foreground-faint">{copy.locked.note}</p>
        <Link
          className="mt-3 block text-center text-[11px] text-foreground-subtle underline underline-offset-4"
          href={paths.reopen}
        >
          {copy.locked.reopen}
        </Link>
      </section>
    )
  }

  if (state.kind === 'tone_required') {
    return (
      <section
        aria-labelledby="guardian-tone-title"
        className="relative isolate overflow-hidden rounded-[2rem] border border-pink-200/20 bg-[linear-gradient(145deg,rgba(255,221,236,0.12),rgba(92,58,145,0.13)_48%,rgba(10,6,24,0.9))] p-5 shadow-2xl sm:p-6"
      >
        <div aria-hidden className="absolute -right-16 -top-16 -z-10 size-52 rounded-full bg-pink-300/15 blur-3xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-200/80">
          {copy.active.kicker(copy.themes[state.theme])}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-2xl border border-pink-100/20 bg-pink-100/10 text-3xl text-pink-100"
          >
            {themeGlyph(state.theme)}
          </span>
          <div>
            <h2 className="text-xl font-bold text-white" id="guardian-tone-title">
              {copy.active.title}
            </h2>
            <p className="mt-1 text-xs leading-6 text-foreground-muted">{copy.active.body}</p>
            {state.theme === 'love' ? (
              <p className="mt-2 text-[10px] leading-5 text-foreground-faint">{copy.loveVariationNote}</p>
            ) : null}
          </div>
        </div>

        <GuardianToneChooser
          name="guardian-active-tone"
          onChange={(nextTone) => {
            toneRef.current = nextTone
            setTone(nextTone)
          }}
          tone={tone}
        />

        <button
          className="mt-5 w-full rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-3.5 text-center text-sm font-bold text-[#24142e] shadow-[0_12px_35px_rgba(255,193,214,0.18)]"
          onClick={() => {
            storeGuardianToneIntent(reading.dateKey, toneRef.current)
            setRequestedTone(toneRef.current)
            track('guardian_tomorrow_reveal_selected', { tone: toneRef.current, theme: state.theme })
          }}
          type="button"
        >
          {copy.active.cta}
        </button>
        <p className="mt-3 text-center text-[10px] text-foreground-faint">
          {copy.card.accessUntil(formatLocalDateTime(state.access.expiresAt))}
        </p>
      </section>
    )
  }

  const { card, access, archived } = state.result
  return (
    <>
      <section
        aria-labelledby={`guardian-${surface}-title`}
        className="overflow-hidden rounded-[2rem] border border-pink-200/20 bg-[linear-gradient(145deg,rgba(255,221,236,0.1),rgba(87,58,135,0.08)_45%,rgba(10,6,24,0.88))] shadow-2xl"
      >
        <header className="px-5 pb-4 pt-5 text-center sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pink-200/80">
            {copy[surface].eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-black text-white" id={`guardian-${surface}-title`}>
            {copy[surface].title}
          </h2>
          <p className="mt-1 text-xs text-foreground-subtle">{copy[surface].intro}</p>
        </header>

        <figure className="mx-auto w-[min(78vw,21rem)] overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/20 shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
          <Image
            alt={card.artworkAlt}
            className="aspect-[3/4] h-auto w-full object-cover"
            height={720}
            priority
            sizes="(max-width: 640px) 78vw, 21rem"
            src={card.artworkPath}
            width={540}
          />
          <figcaption className="border-t border-white/10 bg-[#120b24]/95 px-4 py-4 text-center">
            <p className="text-[10px] font-bold tracking-[0.12em] text-pink-100">
              {copy.themes[card.theme]} · {copy.tone.options[card.tone].label}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              {card.basis === 'natal_sun'
                ? copy.card.natalBasis
                : surface === 'today'
                  ? copy.card.collectiveBasisToday
                  : copy.card.collectiveBasisTomorrow}
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">{card.title}</h3>
            <p className="mt-1 text-[11px] text-foreground-subtle">{card.guardians}</p>
          </figcaption>
        </figure>

        <div className="space-y-4 px-5 py-6 sm:px-7">
          <p className="text-center text-sm font-semibold leading-7 text-pink-50">{card.oneLine}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {surface === 'today' ? copy.card.action : copy.card.tomorrowAction}
              </p>
              <p className="mt-2 text-xs leading-6 text-foreground-secondary">{card.action}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {copy.card.reflection}
              </p>
              <p className="mt-2 text-xs leading-6 text-foreground-secondary">{card.reflection}</p>
            </div>
          </div>
          {archived && <p className="text-center text-[10px] font-semibold text-positive">✓ {copy.card.archived}</p>}
          {access.expiresAt && (
            <p className="text-center text-[10px] text-foreground-faint">
              {copy.card.accessUntil(formatLocalDateTime(access.expiresAt))}
            </p>
          )}
          {surface === 'today' && (
            <Link
              className="block rounded-2xl border border-pink-200/25 bg-pink-100/10 px-4 py-3 text-center text-xs font-bold text-pink-50 transition hover:bg-pink-100/15"
              href={paths.tomorrow}
              onClick={() =>
                track('guardian_tomorrow_preview_selected', { source: 'today_card', today_theme: card.theme })
              }
            >
              {copy.today.cta} →
            </Link>
          )}
        </div>
      </section>

      {archived && passSession && !passSession.claimed ? (
        <GuardianAccountSave onClaimed={setPassSession} passSession={passSession} surface={surface} />
      ) : null}

      {summary && (
        <section className={`${cardStyles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{copy.summary.eyebrow}</p>
          <h2 className="mt-2 text-base font-bold text-white">{copy.summary.title}</h2>
          <p className="mt-2 text-xs font-semibold text-pink-100">{copy.summary.count(summary.count)}</p>
          <p className="mt-2 text-xs leading-6 text-foreground-muted">{copy.summary.themes[summary.theme]}</p>
          <p className="mt-2 text-xs leading-6 text-foreground-muted">{copy.summary.tones[summary.tone]}</p>
          <Link
            className="mt-4 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline"
            href={paths.account}
          >
            {copy.summary.account} →
          </Link>
        </section>
      )}
    </>
  )
}

function GuardianToneChooser({
  name,
  onChange,
  tone,
}: {
  name: string
  onChange: (tone: GuardianDailyTone) => void
  tone: GuardianDailyTone
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-bold text-white">{copy.tone.label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(copy.tone.options).map(([value, option]) => {
          const optionTone = value as GuardianDailyTone
          return (
            <label
              className={`cursor-pointer rounded-2xl border p-3 transition ${
                tone === optionTone
                  ? 'border-pink-200/45 bg-pink-100/12 text-white'
                  : 'border-white/10 bg-white/3 text-foreground-secondary hover:border-white/20'
              }`}
              key={value}
            >
              <input
                checked={tone === optionTone}
                className="sr-only"
                name={name}
                onChange={() => onChange(optionTone)}
                type="radio"
                value={value}
              />
              <span className="block text-xs font-bold">{option.label}</span>
              <span className="mt-1 block text-[10px] leading-4 text-foreground-subtle">{option.description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function GuardianAccountSave({
  onClaimed,
  passSession,
  surface,
}: {
  onClaimed: (session: GuardianPassSession) => void
  passSession: GuardianPassSession
  surface: 'today' | 'tomorrow'
}) {
  const { data: accountSession } = stellaAuthClient.useSession()
  const [state, setState] = useState<'idle' | 'signing-in' | 'saving' | 'saved' | 'error'>('idle')

  const save = useCallback(async () => {
    const session = readGuardianPassSession()
    if (!session?.accessToken || session.claimed || state === 'saving' || state === 'signing-in') return

    if (!accountSession) {
      setState('signing-in')
      try {
        localStorage.setItem(GUARDIAN_CLAIM_INTENT_KEY, session.collectionPublicId)
      } catch {
        setState('error')
        return
      }
      const callbackURL = window.location.pathname
      const result = await stellaAuthClient.signIn.oauth2({
        providerId: SOBOK_OIDC_PROVIDER_ID,
        callbackURL,
        errorCallbackURL: callbackURL,
      })
      if (result.error) setState('error')
      return
    }

    setState('saving')
    try {
      await claimGuardianCollection(session)
      const claimed = { ...session, accessToken: undefined, claimed: true }
      try {
        storeGuardianPassSession(claimed)
      } catch {
        // Server ownership is authoritative even when optional browser state cannot be refreshed.
      }
      onClaimed(claimed)
      try {
        localStorage.removeItem(GUARDIAN_CLAIM_INTENT_KEY)
      } catch {
        // The claim already succeeded; a stale intent has no capability after guest access is revoked.
      }
      setState('saved')
      track('guardian_daily_collection_claimed', { surface })
    } catch {
      setState('error')
    }
  }, [accountSession, onClaimed, state, surface])

  useEffect(() => {
    if (!accountSession || !passSession.accessToken) return
    try {
      if (localStorage.getItem(GUARDIAN_CLAIM_INTENT_KEY) === passSession.collectionPublicId) {
        localStorage.removeItem(GUARDIAN_CLAIM_INTENT_KEY)
        void save()
      }
    } catch {
      // The explicit save button remains available if storage access is blocked.
    }
  }, [accountSession, passSession.accessToken, save])

  if (state === 'saved') return null

  return (
    <section className={`${cardStyles.card} rounded-3xl border bg-surface-2 p-5 text-center backdrop-blur`}>
      <h2 className="text-sm font-bold text-white">{copy.claim.title}</h2>
      <p className="mt-2 text-xs leading-6 text-foreground-muted">{copy.claim.body}</p>
      <button
        className="mt-4 w-full rounded-2xl border border-pink-200/25 bg-pink-100/10 px-4 py-3 text-xs font-bold text-pink-50 disabled:opacity-50"
        disabled={state === 'saving' || state === 'signing-in'}
        onClick={() => void save()}
        type="button"
      >
        {state === 'saving' || state === 'signing-in' ? copy.claim.saving : copy.claim.cta}
      </button>
      {state === 'error' ? <p className="mt-2 text-[11px] text-danger">{copy.claim.error}</p> : null}
    </section>
  )
}

function localSummary(
  cards: readonly GuardianDailyCardView[],
): { count: number; theme: GuardianDailyTheme; tone: GuardianDailyTone } | null {
  const recent = cards.slice(0, 7)
  if (recent.length < 2) return null
  return {
    count: recent.length,
    theme: dominantRecent(recent, GUARDIAN_DAILY_THEMES, (card) => card.theme),
    tone: dominantRecent(recent, GUARDIAN_DAILY_TONES, (card) => card.tone),
  }
}

function dominantRecent<Card, Value extends string>(
  cards: readonly Card[],
  values: readonly Value[],
  select: (card: Card) => Value,
): Value {
  const counts = new Map<Value, number>()
  for (const card of cards) {
    const value = select(card)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const max = Math.max(...values.map((value) => counts.get(value) ?? 0))
  const winner = cards.map(select).find((value) => (counts.get(value) ?? 0) === max)
  if (!winner) throw new Error('Guardian summary did not resolve')
  return winner
}

function themeGlyph(theme: GuardianDailyTheme): string {
  return { self: '✦', love: '♡', work: '⌁', choice: '◇' }[theme]
}

function formatLocalDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
