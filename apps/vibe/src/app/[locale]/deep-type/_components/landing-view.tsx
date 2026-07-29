'use client'

import { FREE_DELIVERABLES_KO } from '@deep-type/free-deliverables'
import { ArrowRight } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { cn } from '@/utils/cn'

import heroArtwork from '../_assets/hero/landing.webp'
import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent } from '../_lib/types'

type LandingViewProps = {
  content: DeepTypeContent
  locale: Locale
  onStart?: () => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

/**
 * The landing, laid out as an ad destination rather than a product page.
 *
 * Most visitors arrive from a paid click and decide inside one screen, so the order is fixed: what this is, the
 * three numbers that decide whether it is worth a try, what the free run hands back, the questions the reader
 * already has, how long it takes, and only then the ask. The structure is ported from the reference build's
 * conversion layer. Its vocabulary is not — that layer sells a persona-versus-inner comparison, and this
 * product sells the conditions your work energy runs on.
 *
 * The deliverable titles come from `FREE_DELIVERABLES_KO`, the same constant the refund policy names and the
 * result screen injects. A landing that promised a fifth thing would break the trial-provision claim as surely
 * as a result screen that delivered only three.
 */
export function LandingView({ content, locale, onStart }: LandingViewProps) {
  const { landing, ui } = content
  const keepBreak = locale === 'ko' ? 'break-keep' : undefined

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe pt-10 pb-32 text-page-ink" id="main-content">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-black text-page-ink/72 text-sm tracking-tight">{DEEP_TYPE_BRAND_NAME[locale]}</p>

        <header className="mt-8">
          <span className="font-bold text-page-accent text-sm">{landing.kicker}</span>
          <h1 className={cn('mt-3 text-balance font-black text-4xl leading-tight sm:text-5xl', keepBreak)}>
            {ui.landingTitle}
          </h1>
          <p className={cn('mt-5 text-page-ink/66 leading-8', keepBreak)}>{ui.landingSubtitle}</p>
        </header>

        <figure className="mt-8 overflow-hidden rounded-4xl border border-page-border bg-page-soft">
          <Image
            alt=""
            className="h-auto w-full object-cover"
            draggable={false}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            src={heroArtwork}
          />
        </figure>

        <dl className="mt-6 grid grid-cols-3 gap-2">
          {landing.facts.map((fact) => (
            <div
              className="rounded-3xl border border-page-border bg-page-surface px-3 py-4 text-center"
              key={fact.label}
            >
              <dt className="text-page-ink/48 text-xs">{fact.label}</dt>
              <dd className="mt-1 break-keep font-black text-base">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <CtaBlock
          className="mt-8"
          keepBreak={keepBreak}
          label={ui.landingCta}
          locale={locale}
          meta={landing.ctaMeta}
          onStart={onStart}
          ctaRole="hero"
        />

        <Section title={landing.getsTitle}>
          <ol className="mt-5 grid gap-3">
            {FREE_DELIVERABLES_KO.map((deliverable, index) => (
              <li className="flex gap-4 rounded-3xl border border-page-border bg-page-surface p-5" key={deliverable}>
                <span className="shrink-0 font-black text-page-accent text-sm tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-black">{deliverable}</p>
                  <p className={cn('mt-1 text-page-ink/58 text-sm leading-6', keepBreak)}>
                    {landing.getsBodies[index]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <section className="mt-14 grid gap-3">
          {landing.asks.map((ask) => (
            <div className="rounded-3xl border border-page-border bg-page-soft/60 p-5" key={ask.question}>
              <h2 className={cn('font-black text-lg leading-8', keepBreak)}>{ask.question}</h2>
              <p className={cn('mt-2 text-page-ink/62 text-sm leading-7', keepBreak)}>{ask.body}</p>
            </div>
          ))}
        </section>

        <Section title={landing.stepsTitle}>
          <ol className="mt-5 grid gap-2">
            {landing.steps.map((step, index) => (
              <li
                className="flex items-center justify-between gap-4 rounded-3xl border border-page-border bg-page-surface px-5 py-4"
                key={step.title}
              >
                <p className={cn('flex gap-3 font-bold text-sm', keepBreak)}>
                  <span className="text-page-accent tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  {step.title}
                </p>
                <span className="shrink-0 text-page-ink/48 text-xs">{step.duration}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* The closing CTA carries the full offer line, not a second reassurance. The hero button already said
            free and no-signup, and repeating it here put two lines of the same promise under one button while
            the price — the one thing a reader still needs before committing — sat below both. */}
        <CtaBlock
          className="mt-12"
          ctaRole="closing"
          keepBreak={keepBreak}
          label={ui.landingCta}
          locale={locale}
          meta={ui.landingNote}
          onStart={onStart}
        />

        <Link
          className={cn(
            'mx-auto mt-4 flex w-fit items-center rounded-full p-3 text-center font-bold text-page-ink/58 text-xs underline underline-offset-4 hover:text-page-ink',
            focusClassName,
          )}
          href={`/${locale}/deep-type/reopen`}
        >
          {ui.reopenCta}
        </Link>

        <div className="mt-10 border-page-border border-t pt-6">
          <p className={cn('text-page-ink/44 text-xs leading-6', keepBreak)}>{landing.legal}</p>
        </div>
      </div>

      <StickyCta content={content} locale={locale} onStart={onStart} />
    </main>
  )
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-14">
      <h2 className="break-keep font-black text-2xl leading-tight">{title}</h2>
      {children}
    </section>
  )
}

function CtaBlock({
  className,
  ctaRole,
  keepBreak,
  label,
  locale,
  meta,
  onStart,
}: {
  className?: string
  /** Not an ARIA role — the marker the sticky bar's observer watches. */
  ctaRole: string
  /** `break-keep` for ko. Without it the browser breaks inside a word and '원할 때' splits after '원'. */
  keepBreak?: string
  label: string
  locale: Locale
  meta: string
  onStart?: () => void
}) {
  return (
    <div className={className}>
      <Link
        className={cn(
          'flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-page-accent py-4 font-black text-base text-white shadow-[0_24px_80px_var(--page-accent-glow)] transition-colors hover:bg-page-accent/92 sm:mx-auto sm:max-w-sm',
          focusClassName,
        )}
        data-cta-role={ctaRole}
        href={`/${locale}/deep-type/test`}
        onClick={onStart}
      >
        {label}
        <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
      </Link>
      <p className={cn('mt-3 text-balance text-center text-page-ink/48 text-sm leading-6', keepBreak)}>{meta}</p>
    </div>
  )
}

/**
 * A persistent CTA that steps aside whenever a real one is on screen.
 *
 * An island rather than a bar, and deliberately so. `BottomNav` is already a floating pill and it hides itself
 * on this route, so this is the single layer that owns the bottom edge — a full-bleed bar would have been a
 * second visual language on the same screen and would have pushed permanent chrome past a sixth of the viewport.
 * It inherits the nav's `bottom` offset for the reason recorded there: iOS 26 Safari tints its bottom chin from
 * any fixed element within ~3px of the edge, and a translucent one falls back to black.
 *
 * No caption under the label. The three facts and the closing CTA already carry the free/no-signup promise, and
 * a second line here buys nothing while making the island tall enough to matter.
 *
 * Without the observer the island covers the inline buttons and the reader taps the wrong one; with it, the
 * island is present only when there is nothing else to tap. The intersecting targets are held in a set rather
 * than a boolean because two inline CTAs can be visible at once, and a boolean loses the second one's exit.
 */
function StickyCta({ content, locale, onStart }: LandingViewProps) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const targets = document.querySelectorAll('[data-cta-role="hero"],[data-cta-role="closing"]')

    // Fail open. The island starts hidden so it never flashes over the hero button on first paint, which means
    // every path that leaves the observer unable to report has to reveal it explicitly — otherwise a browser
    // without IntersectionObserver, or a render where the inline CTAs are missing, gets a landing with no
    // persistent CTA at all and no error to show for it. A conversion element must degrade to present.
    if (targets.length === 0 || !('IntersectionObserver' in window)) {
      setHidden(false)
      return
    }

    const seen = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            seen.add(entry.target)
          } else {
            seen.delete(entry.target)
          }
        }
        setHidden(seen.size > 0)
      },
      { rootMargin: '0px 0px -92px 0px', threshold: 0.02 },
    )

    for (const target of targets) {
      observer.observe(target)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-[max(0.5rem,var(--safe-area-bottom))] z-40 px-3 transition-opacity duration-200',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <div className="mx-auto w-full max-w-xs">
        <Link
          className={cn(
            'flex w-full touch-manipulation items-center justify-center gap-2 rounded-full bg-page-accent py-3.5 font-black text-sm text-white shadow-[0_16px_40px_var(--page-accent-glow)] transition-colors hover:bg-page-accent/92',
            focusClassName,
          )}
          href={`/${locale}/deep-type/test`}
          onClick={onStart}
        >
          {content.landing.stickyCta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </Link>
      </div>
    </div>
  )
}
