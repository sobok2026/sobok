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

import GuardianStickyCta from './_components/GuardianStickyCta'
import styles from './guardian-report.module.css'

type LandingContent = (typeof GUARDIAN_REPORT_UI)[Locale]['landing']

/** Keyed off the reveal screen's own labels, so a new tier cannot be added there and forgotten here. */
type Rarity = keyof (typeof GUARDIAN_REPORT_UI)[Locale]['paid']['reveal']['rarityLabels']

/**
 * The four love editions the manifest actually ships, in ascending order. The section shows the artwork
 * rather than describing it — four words under four pictures say more about what varies than a paragraph
 * claiming that something varies.
 */
const RARITY_LADDER: readonly { id: Rarity; artwork: string }[] = [
  { id: 'orbit', artwork: '/images/zodiac-guardians/aries-love-orbit.webp' },
  { id: 'nebula', artwork: '/images/zodiac-guardians/aries-love-nebula.webp' },
  { id: 'eclipse', artwork: '/images/zodiac-guardians/aries-love-eclipse.webp' },
  { id: 'stella', artwork: '/images/zodiac-guardians/aries-love-stella.webp' },
]

const SECTION = `${styles.reveal} py-14 sm:py-20`
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.25em] text-accent'
const HEADING = 'mt-3 whitespace-pre-line text-balance text-2xl font-black text-white sm:text-3xl'

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

      {/* Chrome, not content: a returning buyer's shortcut sits in the header band beside the wordmark
          rather than above the promise, where it used to spend a whole row of the first screen. */}
      <Link
        className="absolute right-[max(0.75rem,var(--safe-area-right))] top-[calc(1.1rem+var(--safe-area-top))] z-30 text-xs text-foreground-subtle underline-offset-4 transition hover:text-white hover:underline"
        href={paths.reopen}
      >
        {content.navigation.reopen}
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {existingSession && (
          <section className="mx-auto max-w-3xl rounded-3xl border border-accent/20 bg-accent/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                {content.resume.eyebrow}
              </p>
              <h2 className="mt-1 text-base font-bold text-white">{content.resume.title}</h2>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">{content.resume.body}</p>
            </div>
            <Link
              className="mt-4 block shrink-0 rounded-full cta bg-primary px-4 py-2 text-center text-xs font-bold text-primary-foreground sm:mt-0"
              href={paths.questions}
            >
              {content.resume.reportCta}
            </Link>
          </section>
        )}

        <section className="grid items-center gap-7 pb-10 pt-4 lg:grid-cols-[1fr_0.88fr] lg:gap-12 lg:pb-14 lg:pt-10">
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
                className="block rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-6 py-4 text-center text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.2)] cta"
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

        <ProofBand content={content} />

        <SampleReport content={content} locale={locale} />

        <InlineCta content={content} href={startHref} locale={locale} price={price} source="landing_sample" />

        <ProductSection content={content} />

        <RarityLadder content={content} locale={locale} />

        <InlineCta content={content} href={startHref} locale={locale} price={price} source="landing_rarity" />

        <ProcessSection content={content} />

        <PurchaseDetails content={content} locale={locale} price={price} startHref={startHref} />

        <p
          className={`${styles.reveal} whitespace-pre-line pt-14 text-center text-xl font-black leading-[1.4] text-white/85 sm:pt-20 sm:text-2xl`}
        >
          {content.hero.title}
        </p>
      </div>

      <GuardianStickyCta
        cta={content.stickyCta.cta}
        href={startHref}
        note={content.stickyCta.note}
        persistent
        price={price}
        onSelect={() => track('guardian_preview_cta_selected', { locale, source: 'landing_sticky' })}
        visible={heroCtaHidden}
      />
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
 * Four numerals directly under the promise. The figures are all stated elsewhere in sentences, but a reader
 * deciding in the first screen whether to keep scrolling reads numerals and headlines and nothing else — so
 * the size of the thing is given once in a form that survives being skimmed.
 */
function ProofBand({ content }: { content: LandingContent }) {
  return (
    <dl
      className={`${styles.proof} ${styles.reveal} grid grid-cols-2 gap-px overflow-hidden rounded-3xl sm:grid-cols-4`}
    >
      {content.proof.items.map((item) => (
        <div className="bg-[#120b24]/76 px-4 py-5 text-center sm:px-3 sm:py-6" key={item.label}>
          <dt className="text-xl font-black tabular-nums text-white sm:text-2xl">{item.value}</dt>
          <dd className="mt-1.5 text-[11px] leading-4 text-foreground-subtle">{item.label}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The same offer as the hero's, in the same words, at the two points where a reader has just been given a
 * reason to want it — after the sample and after the rarity ladder. One action deserves one label: a button
 * that renames itself down the page reads as a different button and has to be re-understood each time.
 */
function InlineCta({
  content,
  href,
  locale,
  price,
  source,
}: {
  content: LandingContent
  href: string
  locale: Locale
  price: string
  source: string
}) {
  // Bound to the section above by spacing alone, now that no rule does it: the gap below is the larger one,
  // so the button reads as the end of what was just shown rather than the start of what comes next.
  return (
    <div className={`${styles.reveal} pb-6 text-center sm:pb-10`}>
      <Link
        className="mx-auto block max-w-md rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-6 py-4 text-center text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.2)] cta"
        href={href}
        onClick={() => track('guardian_preview_cta_selected', { locale, source })}
      >
        {content.hero.cta}
      </Link>
      <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-foreground-subtle">{content.hero.offerNote(price)}</p>
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
    <section className={SECTION}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={EYEBROW}>{content.sample.eyebrow}</p>
        <h2 className={HEADING}>{content.sample.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.sample.body}</p>
      </div>

      <figure className="mx-auto mt-8 max-w-3xl">
        <article className="rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl backdrop-blur sm:p-7">
          <div className="grid items-start gap-5 sm:grid-cols-[8rem_1fr]">
            <div className={`${styles.sealStage} mx-auto w-28 sm:w-32`}>
              <Image
                alt=""
                className={`${styles.sealSubject} aspect-[3/4] w-full rounded-2xl object-cover shadow-xl`}
                height={480}
                src="/images/zodiac-guardians/cancer-self.webp"
                width={360}
              />
              <span aria-hidden className={styles.sealFlare} />
              {/* The same sealed face the paywall uses for a card that has not been opened, so the two
                  screens speak about an unopened card in one visual language. */}
              <span aria-hidden className={`${styles.sealedCard} ${styles.seal}`}>
                <SealSigil />
              </span>
            </div>
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

/** The mark on the seal — an outline so it reads as stamped rather than printed. */
function SealSigil() {
  return (
    <svg aria-hidden className="relative z-10 h-6 w-6 opacity-80" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1.6c.28 3.1 1.02 5.3 2.22 6.6 1.2 1.28 3.24 2.02 6.12 2.2v3.2c-2.88.18-4.92.92-6.12 2.2-1.2 1.3-1.94 3.5-2.22 6.6h-1.9c-.28-3.1-1.02-5.3-2.22-6.6-1.2-1.28-3.24-2.02-6.12-2.2v-3.2c2.88-.18 4.92-.92 6.12-2.2C9.08 6.9 9.82 4.7 10.1 1.6z" />
    </svg>
  )
}

function ProductSection({ content }: { content: LandingContent }) {
  return (
    <section className={SECTION}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={EYEBROW}>{content.product.eyebrow}</p>
        <h2 className={HEADING}>{content.product.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.product.body}</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
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
  )
}

/**
 * The love card's four editions, as the four artworks themselves.
 *
 * This used to be the fourth cell of a four-cell grid, one sentence long — the most collectible thing on
 * offer, described in the same voice as the page count. It is a section now because it is the one part of
 * the product that varies between buyers, and because a row of four pictures answers "how different?" in a
 * way no sentence about rarity can. The odds are deliberately absent: they belong in the FAQ, where someone
 * goes looking for them, rather than in the part of the page that is asking for money.
 */
function RarityLadder({ content, locale }: { content: LandingContent; locale: Locale }) {
  const rarityLabels = GUARDIAN_REPORT_UI[locale].paid.reveal.rarityLabels

  return (
    <section className={SECTION}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={EYEBROW}>{content.rarity.eyebrow}</p>
        <h2 className={HEADING}>{content.rarity.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.rarity.body}</p>
      </div>

      <ol className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {RARITY_LADDER.map(({ artwork, id }) => (
          <li key={id}>
            <Image
              alt={rarityLabels[id]}
              className="aspect-[3/4] w-full rounded-2xl border border-white/12 object-cover shadow-xl"
              height={480}
              src={artwork}
              width={360}
            />
            <p className="mt-2.5 text-center text-xs font-bold text-white">{rarityLabels[id]}</p>
          </li>
        ))}
      </ol>

      <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 text-foreground-subtle">
        {content.rarity.footnote}
      </p>
    </section>
  )
}

function ProcessSection({ content }: { content: LandingContent }) {
  return (
    <section className={SECTION}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={EYEBROW}>{content.process.eyebrow}</p>
        <h2 className={HEADING}>{content.process.title}</h2>
      </div>
      <ol className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {content.process.steps.map((step) => (
          /* The paid step carries the accent so the answer to "when do I pay?" is legible at a glance
             rather than buried in the third card's second sentence. */
          <li
            className={`rounded-3xl border p-5 ${
              step.paid ? 'border-accent/30 bg-accent/8' : 'border-white/9 bg-[#120b24]/76'
            }`}
            key={step.number}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-pink-200/75">{step.number}</p>
              {step.paid && (
                <p className="rounded-full border border-accent/30 bg-accent/12 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {content.process.payLabel}
                </p>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.body}</p>
          </li>
        ))}
      </ol>
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
    <section className={SECTION}>
      <div className="grid gap-8 lg:grid-cols-[1fr_0.86fr] lg:items-start lg:gap-12">
        <div>
          <p className={EYEBROW}>{content.purchase.eyebrow}</p>
          <h2 className={HEADING}>{content.purchase.title}</h2>
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
            className="mt-5 block w-full rounded-2xl cta bg-primary px-5 py-4 text-center text-sm font-bold text-primary-foreground"
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

function formatPrice(locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency: GUARDIAN_CURRENCY,
    maximumFractionDigits: 0,
  }).format(GUARDIAN_REPORT_PRICE)
}
