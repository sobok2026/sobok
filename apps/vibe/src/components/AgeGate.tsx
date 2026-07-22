'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { type FormEvent, type ReactNode, useEffect, useState } from 'react'

import { AGE_GATE } from '@/content/age-gate'
import { cn } from '@/utils/cn'

const STORAGE_KEY = 'vibe.age-14-confirmed-at'
const CONFIRMATION_TTL_MS = 365 * 24 * 60 * 60 * 1000
const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export default function AgeGate({ children, locale }: { children: ReactNode; locale: Locale }) {
  const [state, setState] = useState<'checking' | 'required' | 'confirmed'>('checking')
  const content = AGE_GATE[locale]

  useEffect(() => {
    try {
      const confirmedAt = Number(window.localStorage.getItem(STORAGE_KEY))
      const isCurrent = Number.isFinite(confirmedAt) && Date.now() - confirmedAt < CONFIRMATION_TTL_MS
      setState(isCurrent ? 'confirmed' : 'required')
    } catch {
      setState('required')
    }
  }, [])

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      // Storage can be unavailable in privacy modes. Keep the confirmation for this page session.
    }
    setState('confirmed')
  }

  if (state === 'confirmed') {
    return children
  }

  if (state === 'checking') {
    return (
      <main
        aria-busy="true"
        className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-page-ink"
      >
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent"
        />
        <p className="sr-only">{content.checkingLabel}</p>
      </main>
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-12 text-page-ink" id="main-content">
      <form
        className="w-full max-w-lg rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8"
        onSubmit={confirm}
      >
        <h1 className="break-keep font-black text-2xl leading-snug">{content.title}</h1>
        <p className="mt-3 break-keep text-page-ink/66 leading-7">{content.body}</p>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-page-ink/78 text-sm leading-6">
          <input className="mt-0.5 h-5 w-5 shrink-0 accent-page-accent" required type="checkbox" />
          <span>{content.confirmation}</span>
        </label>
        <button
          className={cn(
            'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white transition-colors hover:bg-page-accent/92',
            focusClassName,
          )}
          type="submit"
        >
          {content.continueCta}
        </button>
        <Link
          className={cn(
            'mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full font-bold text-page-ink/56 text-sm hover:text-page-ink',
            focusClassName,
          )}
          href={`/${locale}`}
        >
          {content.leaveCta}
        </Link>
      </form>
    </main>
  )
}
