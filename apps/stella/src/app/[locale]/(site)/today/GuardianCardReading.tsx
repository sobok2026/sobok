'use client'

import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { GUARDIAN_DAILY_UI as copy } from '@/content/guardian-daily-ui'
import type { GuardianDailyCardView } from '@/lib/guardian-daily'

type Props = {
  card: GuardianDailyCardView
  surface: 'today' | 'tomorrow' | 'week'
  archived: boolean
  accessExpiresAt: string | null
  accessTimeZone?: string
  tomorrowHref?: string
  onTomorrowPreview?: () => void
}

export default function GuardianCardReading({
  card,
  surface,
  archived,
  accessExpiresAt,
  accessTimeZone,
  tomorrowHref,
  onTomorrowPreview,
}: Props) {
  const guardianNames = card.guardians.split(' · ').join('와 ')
  const basis = cardBasis(card.basis, surface)
  const title = readingTitle(surface, card.dateKey)
  const prompts = [
    { label: copy.card.action, text: card.action },
    { label: copy.card.reflection, text: card.reflection },
  ]

  return (
    <section
      aria-labelledby={`guardian-${surface}-title`}
      className={clsx(
        'overflow-hidden px-5 py-6',
        'rounded-[2rem] border border-pink-200/20 bg-linear-to-br from-[#25182f] to-background-deep shadow-2xl',
        'sm:px-7',
      )}
    >
      <header className="text-center">
        <p className="text-xs font-medium text-accent">
          {title} · {copy.card.themes[card.theme]}
        </p>
        <h2 className="mt-2 text-lg font-bold text-white sm:text-xl" id={`guardian-${surface}-title`}>
          <span className="whitespace-nowrap">{guardianNames}</span>
          {copy.card.messageSuffix}
        </h2>
      </header>

      <figure className="mx-auto mt-6 w-full max-w-md">
        <div className="relative mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-3xl bg-surface-2">
          <Image
            alt={card.artworkAlt}
            className="object-cover object-top"
            fill
            priority
            sizes="(max-width: 320px) 70vw, 16rem"
            src={card.artworkPath}
          />
        </div>
        <div
          className={clsx(
            'relative -mt-4 px-5 py-6',
            'rounded-2xl border border-pink-200/20 bg-[#23162e] shadow-lg',
            'sm:px-6',
          )}
        >
          <blockquote>
            <p
              className={clsx(
                'mx-auto max-w-72',
                'text-center text-base font-semibold leading-7 text-balance text-pink-50',
                'sm:text-lg sm:leading-8',
              )}
            >
              {card.oneLine}
            </p>
          </blockquote>

          <dl className="mt-5 divide-y divide-white/10">
            {prompts.map(({ label, text }) => (
              <div
                className={clsx(
                  'grid gap-2 py-4',
                  'first:border-t first:border-white/10 last:pb-0',
                  'sm:grid-cols-[5rem_1fr]',
                )}
                key={label}
              >
                <dt className="text-xs font-semibold leading-6 text-accent">{label}</dt>
                <dd className="text-sm leading-6 text-foreground-secondary">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figcaption className="mt-4 text-center text-xs leading-6 text-foreground-subtle">{card.title}</figcaption>
      </figure>

      <div className="mx-auto mt-5 flex w-full max-w-md items-start gap-4 border-t border-white/10 pt-3">
        <details className="group min-w-0 flex-1">
          <summary
            className={clsx(
              'flex min-h-11 w-fit cursor-pointer list-none items-center gap-2',
              'text-xs font-medium text-foreground-subtle',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            {copy.card.info}
            <span aria-hidden className="transition-transform group-open:rotate-180 motion-reduce:transition-none">
              ⌄
            </span>
          </summary>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 pb-2 text-xs leading-5">
            <dt className="text-foreground-subtle">{copy.card.theme}</dt>
            <dd className="text-foreground-secondary">{copy.themes[card.theme]}</dd>
            <dt className="text-foreground-subtle">{copy.card.tone}</dt>
            <dd className="text-foreground-secondary">{copy.tone.options[card.tone].label}</dd>
            <dt className="text-foreground-subtle">{copy.card.basis}</dt>
            <dd className="text-foreground-secondary">{basis}</dd>
          </dl>
        </details>
        {archived && (
          <p className="shrink-0 py-3 text-xs font-medium text-positive">
            <span aria-hidden>✓ </span>
            {copy.card.archived}
          </p>
        )}
      </div>

      {(surface === 'today' || accessExpiresAt) && (
        <footer className="mx-auto mt-5 w-full max-w-md">
          {surface === 'today' && tomorrowHref && (
            <Link
              className={clsx(
                'flex min-h-12 items-center justify-center gap-2 px-4 py-3',
                'rounded-2xl border border-pink-200/25 bg-pink-100/10 text-sm font-semibold text-pink-50 transition-colors',
                'hover:bg-pink-100/15 motion-reduce:transition-none',
              )}
              href={tomorrowHref}
              onClick={onTomorrowPreview}
            >
              {copy.today.cta}
              <span aria-hidden>→</span>
            </Link>
          )}
          {accessExpiresAt && (
            <p className="mt-3 text-center text-xs leading-5 text-foreground-subtle">
              {surface === 'week'
                ? copy.week.accessUntil(formatLocalDateTime(accessExpiresAt, accessTimeZone))
                : copy.card.accessUntil(formatLocalDateTime(accessExpiresAt))}
            </p>
          )}
        </footer>
      )}
    </section>
  )
}

function cardBasis(basis: GuardianDailyCardView['basis'], surface: Props['surface']): string {
  if (basis === 'natal_sun') return copy.card.natalBasis
  if (surface === 'week') return copy.week.collectiveBasis
  if (surface === 'tomorrow') return copy.card.collectiveBasisTomorrow
  return copy.card.collectiveBasisToday
}

function readingTitle(surface: Props['surface'], dateKey: string): string {
  if (surface !== 'week') return copy[surface].title

  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T12:00:00Z`),
  )
}

function formatLocalDateTime(value: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))
}
