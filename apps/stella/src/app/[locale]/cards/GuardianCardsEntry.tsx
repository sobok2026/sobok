'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import type { GuardianCheckoutSession } from '@/lib/guardian-paid'
import { readGuardianCheckoutSession } from '@/lib/guardian-paid'

import GuardianPaidFlow from './GuardianPaidFlow'

export default function GuardianCardsEntry({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].paid
  const [session, setSession] = useState<GuardianCheckoutSession | null | undefined>(undefined)

  useEffect(() => {
    const stored = readGuardianCheckoutSession()
    setSession(stored?.locale === locale ? stored : null)
  }, [locale])

  if (session === undefined) {
    return (
      <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
        <div className="text-center">
          <span aria-hidden className="text-3xl">
            ✦
          </span>
          <p className="mt-3 animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">
            {content.status.verifyingTitle}
          </p>
        </div>
      </main>
    )
  }

  if (session) {
    return <GuardianPaidFlow session={session} />
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-night-sky px-4 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <section className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center shadow-2xl backdrop-blur">
        <span
          aria-hidden
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pink-100/10 text-2xl text-pink-100"
        >
          ☾
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">{content.missing.title}</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.missing.body}</p>
        <Link
          className="mt-6 block rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
          href={`/${locale}/guardian-report`}
        >
          {content.missing.cta}
        </Link>
      </section>
    </main>
  )
}
