'use client'

import { track } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import {
  type GuardianCheckoutSession,
  type GuardianProductCatalog,
  getGuardianProductCatalog,
  guardianReportPaths,
  readGuardianCheckoutSession,
  readGuardianPreviewSession,
} from '@/lib/guardian-paid'

import styles from './guardian-report.module.css'

export default function GuardianReportLanding({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)
  const [catalog, setCatalog] = useState<GuardianProductCatalog | null>(null)
  const [existingSession, setExistingSession] = useState<GuardianCheckoutSession | null | undefined>(undefined)
  const [hasPreview, setHasPreview] = useState(false)
  const productRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const session = readGuardianCheckoutSession()
    setExistingSession(session?.locale === locale ? session : null)
    setHasPreview(readGuardianPreviewSession(locale) !== null)
    track('guardian_landing_view', { locale })

    void getGuardianProductCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null))
  }, [locale])

  const fullReport = catalog?.products.find(({ kind }) => kind === 'full_report')
  const price = fullReport?.prices.find(({ market, currency }) => market === 'KR' && currency === 'KRW')

  return (
    <main
      className={`${styles.page} relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4`}
    >
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-xs text-foreground-subtle transition hover:text-white"
            href={`/${locale}`}
          >
            <span aria-hidden>←</span>
            {content.back}
          </Link>
          <Link
            className="text-right text-xs text-foreground-subtle underline-offset-4 transition hover:text-white hover:underline"
            href={paths.reopen}
          >
            {content.navigation.reopen}
          </Link>
        </div>

        {existingSession && (
          <section className="mx-auto mt-5 max-w-3xl rounded-3xl border border-accent/20 bg-accent/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                {content.resume.eyebrow}
              </p>
              <h2 className="mt-1 text-base font-bold text-white">{content.resume.title}</h2>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">{content.resume.body}</p>
            </div>
            <Link
              className="mt-4 block shrink-0 rounded-full bg-primary px-4 py-2 text-center text-xs font-bold text-primary-foreground sm:mt-0"
              href={paths.questions}
            >
              {content.resume.reportCta}
            </Link>
          </section>
        )}

        <section className="grid items-center gap-6 pb-14 pt-9 lg:grid-cols-[1fr_0.88fr] lg:gap-12 lg:pb-24 lg:pt-16">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{content.hero.eyebrow}</p>
            <h1 className="mt-4 whitespace-pre-line text-balance text-4xl font-black leading-[1.13] text-white sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-foreground-muted sm:text-base sm:leading-8 lg:mx-0">
              {content.hero.body}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                className="rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-6 py-4 text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.2)] transition hover:-translate-y-0.5"
                href={hasPreview ? paths.freeResult : paths.free}
                onClick={() => track('guardian_preview_cta_selected', { locale, source: 'landing_hero' })}
              >
                {content.hero.cta}
              </Link>
              <button
                className="rounded-2xl border border-white/12 bg-white/4 px-6 py-4 text-sm font-semibold text-foreground-secondary transition hover:border-white/25 hover:text-white"
                onClick={() => productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                type="button"
              >
                {content.hero.secondaryCta}
              </button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-foreground-subtle lg:justify-start">
              {content.hero.trustItems.map((item) => (
                <li className="before:mr-1.5 before:text-pink-200 before:content-['✓']" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.heroCards}>
            <Image
              alt=""
              className={`${styles.heroCard} ${styles.heroCardLeft}`}
              height={640}
              loading="eager"
              src="/images/zodiac-guardians/cancer-self.webp"
              width={480}
            />
            <Image
              alt=""
              className={`${styles.heroCard} ${styles.heroCardRight}`}
              height={640}
              loading="eager"
              src="/images/zodiac-guardians/taurus-work.webp"
              width={480}
            />
            <Image
              alt={content.hero.sampleLabel}
              className={`${styles.heroCard} ${styles.heroCardFront}`}
              height={640}
              priority
              src="/images/zodiac-guardians/aries-love-stella.webp"
              width={480}
            />
            <span className="absolute bottom-[3%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#211431]/90 px-3 py-1.5 text-[10px] font-semibold text-pink-100 shadow-xl backdrop-blur">
              {content.hero.sampleLabel}
            </span>
          </div>
        </section>

        <section className="scroll-mt-24 border-y border-white/8 py-14 sm:py-20" ref={productRef}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              {content.product.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.product.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.product.body}</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {content.product.items.map((item) => (
              <article className="rounded-3xl border border-white/9 bg-white/4 p-5 sm:p-6" key={item.title}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-100/10 text-lg text-pink-100">
                  {item.glyph}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              {content.process.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.process.title}</h2>
          </div>
          <ol className="relative mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {content.process.steps.map((step) => (
              <li className="rounded-3xl border border-white/9 bg-[#120b24]/76 p-5" key={step.number}>
                <p className="text-[10px] font-bold tracking-[0.2em] text-pink-200/75">{step.number}</p>
                <h3 className="mt-2 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <PurchaseDetails catalog={catalog} content={content} locale={locale} price={price} />

        <section className="mx-auto max-w-3xl py-16 sm:py-24">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.faq.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{content.faq.title}</h2>
          </div>
          <div className="mt-7 divide-y divide-white/8 rounded-[2rem] border border-white/9 bg-white/3 px-5 sm:px-7">
            {content.faq.items.map((item) => (
              <details className="group py-5" key={item.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white marker:content-none">
                  {item.question}
                  <span aria-hidden className="text-accent transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 text-sm leading-7 text-foreground-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function PurchaseDetails({
  catalog,
  content,
  locale,
  price,
}: {
  catalog: GuardianProductCatalog | null
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']
  locale: Locale
  price: { market: string; currency: string; amountMinor: number } | undefined
}) {
  const paths = guardianReportPaths(locale)
  const loveOdds = catalog?.loveDraw.pools.at(0)?.rarities ?? []

  return (
    <section className="border-y border-white/8 py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.86fr] lg:items-start lg:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            {content.purchase.eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.purchase.title}</h2>
          <p className="mt-4 text-sm leading-7 text-foreground-muted">{content.purchase.body}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {content.purchase.includes.map((item) => (
              <li
                className="rounded-2xl bg-white/4 px-4 py-3 text-xs font-semibold text-foreground-secondary"
                key={item}
              >
                <span className="mr-2 text-pink-200">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,193,214,0.1),rgba(201,168,255,0.06))] p-5 shadow-2xl sm:p-6">
          <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-5">
            <p className="text-xs text-foreground-subtle">{content.purchase.priceSuffix}</p>
            <p className="text-2xl font-black text-white">
              {price ? formatPrice(price.amountMinor, price.currency, locale) : content.purchase.priceLoading}
            </p>
          </div>
          {loveOdds.length > 0 && (
            <div className="pt-5">
              <h3 className="text-xs font-bold text-white">{content.purchase.oddsTitle}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {loveOdds.map((odd) => (
                  <div
                    className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-2 text-[11px]"
                    key={odd.rarity}
                  >
                    <dt className="text-foreground-subtle">{content.purchase.rarityLabels[odd.rarity]}</dt>
                    <dd className="font-semibold text-foreground-secondary">
                      {formatOdds(odd.weight, odd.weightScale)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {catalog && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-3 text-[11px] leading-5 text-foreground-subtle">
              <p>{content.purchase.guarantee(catalog.guarantee.paidDrawInterval)}</p>
              {!catalog.guarantee.initialReportCountsTowardProgress && (
                <p className="mt-1">{content.purchase.guaranteeInitial}</p>
              )}
            </div>
          )}
          <Link
            className="mt-5 block w-full rounded-2xl bg-primary px-5 py-4 text-center text-sm font-bold text-primary-foreground"
            href={paths.free}
            onClick={() => track('guardian_preview_cta_selected', { locale, source: 'landing_offer' })}
          >
            {content.purchase.cta}
          </Link>
        </aside>
      </div>
    </section>
  )
}

function formatPrice(amount: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatOdds(weight: number, weightScale: number): string {
  return `${(weight / weightScale) * 100}%`
}
