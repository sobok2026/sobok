'use client'

import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import type { GuardianReportHomeContent } from '@/content/guardian-report-ui'

type Props = {
  content: GuardianReportHomeContent
  locale: Locale
}

export default function GuardianOffer({ content, locale }: Props) {
  const offerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const offer = offerRef.current
    if (!offer) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        track('guardian_offer_view', { locale })
        observer.disconnect()
      },
      { threshold: 0.5 },
    )

    observer.observe(offer)
    return () => observer.disconnect()
  }, [locale])

  return (
    <section
      aria-labelledby="guardian-offer-title"
      className="relative isolate overflow-hidden rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,221,236,0.12),rgba(147,112,219,0.08)_45%,rgba(10,6,24,0.82))] px-4 py-5 shadow-[0_24px_80px_rgba(8,3,22,0.45)] sm:px-6 sm:py-6"
      ref={offerRef}
    >
      <div aria-hidden className="absolute -right-12 -top-14 -z-10 h-44 w-44 rounded-full bg-pink-300/15 blur-3xl" />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-16 -z-10 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl"
      />

      <div className="grid items-center gap-5 sm:grid-cols-[1fr_10rem]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-pink-200/80">{content.eyebrow}</p>
          <h2 className="mt-2 text-balance text-xl font-bold leading-snug text-white" id="guardian-offer-title">
            {content.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">{content.body}</p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={content.badges.join(', ')}>
            {content.badges.map((badge) => (
              <li
                className="rounded-full border border-pink-100/15 bg-pink-100/10 px-2.5 py-1 text-[11px] text-pink-100/85"
                key={badge}
              >
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="relative mx-auto h-44 w-36">
          <Image
            alt=""
            className="absolute left-0 top-4 h-36 w-27 -rotate-6 rounded-2xl object-cover opacity-70 shadow-xl"
            height={480}
            src="/images/zodiac-guardians/cancer-self.webp"
            width={360}
          />
          <Image
            alt=""
            className="absolute right-0 top-0 h-40 w-30 rotate-6 rounded-2xl object-cover shadow-2xl ring-1 ring-pink-100/30"
            height={480}
            src="/images/zodiac-guardians/aries-love-nebula.webp"
            width={360}
          />
          <span className="absolute bottom-0 right-1 rounded-full border border-white/20 bg-[#231536]/90 px-2.5 py-1 text-[10px] font-semibold text-pink-100 shadow-lg">
            {content.sampleLabel}
          </span>
        </div>
      </div>

      <Link
        className="mt-5 block w-full rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-3.5 text-center text-sm font-bold text-[#24142e] shadow-[0_12px_35px_rgba(255,193,214,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,193,214,0.25)]"
        href={`/${locale}/guardian-report`}
        onClick={() => track('guardian_landing_open', { locale, source: 'home_card' })}
      >
        {content.cta}
      </Link>
    </section>
  )
}
