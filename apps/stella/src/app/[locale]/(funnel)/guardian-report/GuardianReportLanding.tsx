'use client'

import { track, trackEcommerce } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import {
  GUARDIAN_CURRENCY,
  GUARDIAN_REPORT_ITEM,
  GUARDIAN_REPORT_PRICE,
  type GuardianCheckoutSession,
  guardianReportPaths,
  readGuardianCheckoutSession,
  readGuardianPreviewSession,
} from '@/lib/guardian-paid'

import styles from './guardian-report.module.css'

type LandingContent = (typeof GUARDIAN_REPORT_UI)[Locale]['landing']

export default function GuardianReportLanding({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)
  const price = formatPrice(locale)
  const [existingSession, setExistingSession] = useState<GuardianCheckoutSession | null>(null)
  const [hasPreview, setHasPreview] = useState(false)
  const heroCta = useRef<HTMLAnchorElement>(null)
  const [heroCtaHidden, setHeroCtaHidden] = useState(false)

  useEffect(() => {
    const session = readGuardianCheckoutSession()
    setExistingSession(session?.locale === locale ? session : null)
    setHasPreview(readGuardianPreviewSession(locale) !== null)

    track('guardian_landing_view', { locale })
    trackEcommerce('view_item', {
      currency: GUARDIAN_CURRENCY,
      value: GUARDIAN_REPORT_PRICE,
      items: [GUARDIAN_REPORT_ITEM],
    })
  }, [locale])

  // The bar exists to stand in for the hero's call to action, so it appears exactly when that one leaves.
  useEffect(() => {
    const cta = heroCta.current
    if (!cta) {
      return
    }

    const observer = new IntersectionObserver(([entry]) => setHeroCtaHidden(!entry.isIntersecting))
    observer.observe(cta)
    return () => observer.disconnect()
  }, [])

  const startHref = hasPreview ? paths.freeResult : paths.free

  return (
    <main
      className={`${styles.page} relative min-h-dvh bg-night-sky px-3 pb-14 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4`}
    >
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="flex justify-end">
          <Link
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-white hover:underline"
            href={paths.reopen}
          >
            {content.navigation.reopen}
          </Link>
        </div>

        {existingSession && (
          <section className="mx-auto mt-4 max-w-3xl rounded-3xl border border-accent/20 bg-accent/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
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

        <section className="grid items-center gap-7 pb-12 pt-6 lg:grid-cols-[1fr_0.88fr] lg:gap-12 lg:pb-20 lg:pt-12">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{content.hero.eyebrow}</p>
            <h1 className="mt-3 whitespace-pre-line text-balance text-[2rem] font-black leading-[1.15] text-white sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-8 lg:mx-0">
              {content.hero.body}
            </p>

            {/* Below `lg` the cards sit between the promise and the button. A page selling illustrated cards
                should not ask for a scroll before showing one. */}
            <div className="mt-6 lg:hidden">
              <HeroCards content={content} />
            </div>

            <div className="mt-6">
              <Link
                className="block rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-6 py-4 text-center text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.2)] transition hover:-translate-y-0.5"
                href={startHref}
                onClick={() => track('guardian_preview_cta_selected', { locale, source: 'landing_hero' })}
                ref={heroCta}
              >
                {content.hero.cta}
              </Link>
              <p className="mt-3 text-xs leading-5 text-foreground-subtle">{content.hero.offerNote(price)}</p>
            </div>

            <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-foreground-subtle lg:justify-start">
              {content.hero.trustItems.map((item) => (
                <li className="before:mr-1.5 before:text-pink-200 before:content-['✓']" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <HeroCards content={content} />
          </div>
        </section>

        <SampleReport content={content} locale={locale} />

        <section className="border-t border-white/8 py-14 sm:py-20">
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

        <section className="border-t border-white/8 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              {content.process.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.process.title}</h2>
          </div>
          <ol className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {content.process.steps.map((step) => (
              <li className="rounded-3xl border border-white/9 bg-[#120b24]/76 p-5" key={step.number}>
                <p className="text-[10px] font-bold tracking-[0.2em] text-pink-200/75">{step.number}</p>
                <h3 className="mt-2 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <PurchaseDetails content={content} locale={locale} price={price} startHref={startHref} />
      </div>

      <StickyCta content={content} locale={locale} price={price} startHref={startHref} visible={heroCtaHidden} />
    </main>
  )
}

function HeroCards({ content }: { content: LandingContent }) {
  return (
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
      <span className="absolute bottom-[2%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#211431]/90 px-3 py-1.5 text-[10px] font-semibold text-pink-100 shadow-xl backdrop-blur">
        {content.hero.sampleLabel}
      </span>
    </div>
  )
}

/**
 * One page of the report, laid out the way the report lays it out — the same label, one-line, chart-clue,
 * guidance and reflection blocks in the same order, reading the labels from the paid screen's own content so
 * the two cannot drift apart. Every other section on this page describes the prose; this one shows it.
 */
function SampleReport({ content, locale }: { content: LandingContent; locale: Locale }) {
  const labels = GUARDIAN_REPORT_UI[locale].paid.report
  const { section } = content.sample

  return (
    <section className="border-t border-white/8 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.sample.eyebrow}</p>
        <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.sample.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.sample.body}</p>
      </div>

      <figure className="mx-auto mt-8 max-w-3xl">
        <article className="rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl backdrop-blur sm:p-7">
          <div className="grid items-start gap-5 sm:grid-cols-[8rem_1fr]">
            <Image
              alt=""
              className="mx-auto aspect-[3/4] w-28 rounded-2xl object-cover shadow-xl sm:w-32"
              height={480}
              src="/images/zodiac-guardians/cancer-self.webp"
              width={360}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</p>
              <h3 className="mt-2 text-xl font-bold leading-7 text-white">{section.title}</h3>
              <p className="mt-1 text-xs text-pink-200/80">{section.guardians}</p>
              <p className="mt-4 text-sm font-semibold leading-6 text-pink-50">{section.oneLine}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/4 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              {labels.chartClues}
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{section.chartSummary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {section.placements.map((placement) => (
                <span
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-foreground-subtle"
                  key={placement}
                >
                  {placement}
                </span>
              ))}
            </div>
          </div>

          <section className="mt-6">
            <h4 className="text-sm font-bold text-white">{section.detail.title}</h4>
            <p className="mt-2 text-sm leading-7 text-foreground-muted">{section.detail.body}</p>
          </section>

          <aside className="mt-6 rounded-2xl border border-accent/15 bg-accent/8 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{labels.guidance}</p>
            <h4 className="mt-1 text-sm font-bold text-white">{section.guidance.title}</h4>
            <p className="mt-2 text-sm leading-7 text-foreground-muted">{section.guidance.body}</p>
          </aside>

          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              {labels.reflection}
            </p>
            <p className="mt-2 text-sm italic leading-7 text-foreground-secondary">{section.reflection}</p>
          </div>
        </article>
        <figcaption className="mt-4 text-center text-[11px] leading-5 text-foreground-subtle">
          {content.sample.caption} · {content.sample.continues}
        </figcaption>
      </figure>
    </section>
  )
}

function PurchaseDetails({
  content,
  locale,
  price,
  startHref,
}: {
  content: LandingContent
  locale: Locale
  price: string
  startHref: string
}) {
  return (
    <section className="border-t border-white/8 py-14 sm:py-20">
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
            <p className="text-2xl font-black text-white">{price}</p>
          </div>
          <p className="pt-5 text-[11px] leading-5 text-foreground-subtle">
            {content.purchase.refundNote}{' '}
            <Link className="underline underline-offset-2 hover:text-white" href={`/${locale}/refund`}>
              {content.purchase.refundLink}
            </Link>
          </p>
          <Link
            className="mt-5 block w-full rounded-2xl bg-primary px-5 py-4 text-center text-sm font-bold text-primary-foreground"
            href={startHref}
            onClick={() => track('guardian_preview_cta_selected', { locale, source: 'landing_offer' })}
          >
            {content.purchase.cta}
          </Link>
        </aside>
      </div>
    </section>
  )
}

/**
 * Below `sm` the page runs several screens, and without this the only places to act are its first screen and
 * its last. The funnel layout reserves the band this sits in, so it never covers the footer.
 */
function StickyCta({
  content,
  locale,
  price,
  startHref,
  visible,
}: {
  content: LandingContent
  locale: Locale
  price: string
  startHref: string
  visible: boolean
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0618]/92 px-3 pb-[calc(0.6rem+var(--safe-area-bottom))] pt-2.5 backdrop-blur transition-[opacity,translate] duration-200 motion-reduce:transition-none sm:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-[11px] text-foreground-subtle">{content.stickyCta.label(price)}</p>
        <Link
          className="shrink-0 rounded-full bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-2.5 text-xs font-bold text-[#24142e]"
          href={startHref}
          onClick={() => track('guardian_preview_cta_selected', { locale, source: 'landing_sticky' })}
          tabIndex={visible ? undefined : -1}
        >
          {content.stickyCta.cta}
        </Link>
      </div>
    </div>
  )
}

function formatPrice(locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency: GUARDIAN_CURRENCY,
    maximumFractionDigits: 0,
  }).format(GUARDIAN_REPORT_PRICE)
}
