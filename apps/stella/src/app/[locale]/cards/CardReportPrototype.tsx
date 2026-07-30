'use client'

import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import cardStyles from '@/components/card.module.css'
import { HeroTitle } from '@/components/HeroTitle'
import Starfield from '@/components/Starfield'
import { shareLink } from '@/lib/share'

import styles from './cards.module.css'
import { type CardReportContent, RARITY_IDS, type RarityId, REPORT_SLOTS, type ReportSlot } from './content'

const COLLECTION_KEY = 'stella.guardianCards.v1'

const FIXED_IMAGES: Record<Exclude<ReportSlot, 'love'>, string> = {
  self: '/images/zodiac-guardians/cancer-self.webp',
  work: '/images/zodiac-guardians/taurus-work.webp',
  choice: '/images/zodiac-guardians/libra-choice.webp',
}

const LOVE_IMAGES: Record<RarityId, string> = {
  orbit: '/images/zodiac-guardians/aries-love-orbit.webp',
  nebula: '/images/zodiac-guardians/aries-love-nebula.webp',
  eclipse: '/images/zodiac-guardians/aries-love-eclipse.webp',
  stella: '/images/zodiac-guardians/aries-love-stella.webp',
}

const RARITY_ARTWORK_CLASS: Record<RarityId, string> = {
  orbit: styles.rarityOrbit,
  nebula: styles.rarityNebula,
  eclipse: styles.rarityEclipse,
  stella: styles.rarityStella,
}

const RARITY_BADGE_CLASS: Record<RarityId, string> = {
  orbit: 'border-violet-200/25 bg-violet-300/15 text-violet-100',
  nebula: 'border-sky-200/30 bg-sky-300/15 text-sky-100',
  eclipse: 'border-pink-200/30 bg-pink-300/15 text-pink-100',
  stella: 'border-amber-200/40 bg-amber-200/20 text-amber-50',
}

type Phase = 'report' | 'reveal' | 'sealed'
type QuestionId = CardReportContent['questions'][number]['id']

type Props = {
  content: CardReportContent
  locale: Locale
}

export default function CardReportPrototype({ content, locale }: Props) {
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>({})
  const [phase, setPhase] = useState<Phase>('sealed')
  const [rarity, setRarity] = useState<RarityId | null>(null)
  const [revealIndex, setRevealIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [saved, setSaved] = useState(false)
  const [readSlots, setReadSlots] = useState<ReportSlot[]>([])
  const reportRef = useRef<HTMLDivElement>(null)
  const completionTracked = useRef(false)

  const canOpen = content.questions.every((question) => Boolean(answers[question.id]))
  const currentSlot = REPORT_SLOTS[revealIndex]

  useEffect(() => {
    const sharedRarity = new URLSearchParams(window.location.search).get('rarity')
    if (!isRarity(sharedRarity)) {
      return
    }

    setRarity(sharedRarity)
    setPhase('report')
    track('view_reading', {
      content_type: 'guardian_report',
      rarity: sharedRarity,
      shared: true,
    })
  }, [])

  useEffect(() => {
    if (!rarity) {
      setSaved(false)
      return
    }

    setSaved(readCollection().includes(collectionId(rarity)))
  }, [rarity])

  useEffect(() => {
    if (phase !== 'report') {
      return
    }

    const frame = requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    const report = reportRef.current
    if (phase !== 'report' || !report) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          const slot = (entry.target as HTMLElement).dataset.reportSlot
          if (!isReportSlot(slot)) {
            continue
          }

          setReadSlots((current) => {
            if (current.includes(slot)) {
              return current
            }

            track('guardian_report_section_view', {
              content_type: 'guardian_report',
              rarity,
              slot,
            })
            return [...current, slot]
          })
        }
      },
      { rootMargin: '-18% 0px -35%', threshold: 0.12 },
    )

    const sections = report.querySelectorAll<HTMLElement>('[data-report-slot]')
    sections.forEach((section) => {
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [phase, rarity])

  useEffect(() => {
    if (readSlots.length !== REPORT_SLOTS.length || completionTracked.current) {
      return
    }

    completionTracked.current = true
    track('guardian_report_complete', {
      content_type: 'guardian_report',
      rarity,
    })
  }, [rarity, readSlots.length])

  function chooseAnswer(question: QuestionId, option: string) {
    setAnswers((current) => ({ ...current, [question]: option }))
  }

  function openPack() {
    if (!canOpen) {
      return
    }

    const drawnRarity = drawPrototypeRarity()
    setRarity(drawnRarity)
    setRevealIndex(0)
    setFlipped(false)
    setReadSlots([])
    completionTracked.current = false
    setPhase('reveal')

    track('guardian_report_start', {
      content_type: 'guardian_report',
      movement: answers.movement,
      prototype_equal_sampling: true,
      rarity: drawnRarity,
      tone: answers.tone,
    })
  }

  function flipCard() {
    if (flipped || !rarity) {
      return
    }

    setFlipped(true)
    track('guardian_card_reveal', {
      content_type: 'guardian_report',
      rarity: currentSlot === 'love' ? rarity : 'fixed',
      slot: currentSlot,
    })
  }

  function advanceReveal() {
    if (!flipped) {
      return
    }

    if (revealIndex < REPORT_SLOTS.length - 1) {
      setRevealIndex((current) => current + 1)
      setFlipped(false)
      return
    }

    setPhase('report')
    track('view_reading', {
      content_type: 'guardian_report',
      rarity,
      shared: false,
    })
  }

  function saveCard() {
    if (!rarity || saved) {
      return
    }

    const collection = new Set(readCollection())
    collection.add(collectionId(rarity))

    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify([...collection]))
    } catch {
      return
    }

    setSaved(true)
    toast.success(content.actions.saved)
    track('guardian_card_save', {
      card_id: 'aries.love',
      rarity,
    })
  }

  async function share() {
    if (!rarity) {
      return
    }

    const url = new URL(`/${locale}/cards`, window.location.origin)
    url.searchParams.set('rarity', rarity)

    const method = await shareLink({
      title: content.actions.shareTitle,
      text: content.actions.shareText,
      url: url.toString(),
    })

    if (method === 'clipboard') {
      toast.success(content.actions.shareCopied)
    } else if (method === 'failed') {
      toast.error(content.actions.shareFailed)
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', {
        content_type: 'guardian_report',
        method,
        rarity,
      })
    }
  }

  function resetPrototype() {
    window.history.replaceState(null, '', window.location.pathname)
    setAnswers({})
    setPhase('sealed')
    setRarity(null)
    setRevealIndex(0)
    setFlipped(false)
    setReadSlots([])
    completionTracked.current = false
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  return (
    <main
      className={`${styles.page} relative min-h-dvh bg-night-sky px-3 pb-24 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4`}
    >
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <header className="mb-7 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-accent sm:text-xs">
            {content.hero.eyebrow}
          </p>
          <HeroTitle tone="love">{content.hero.title}</HeroTitle>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted/90">{content.hero.subtitle}</p>
          <div
            className={`${styles.sampleChip} mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[11px]`}
          >
            <span className="text-foreground-faint">{content.hero.sampleLabel}</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span className="font-medium text-foreground-secondary">{content.hero.sampleValue}</span>
          </div>
        </header>

        {phase === 'sealed' && (
          <div className="space-y-4">
            <section className={`${cardStyles.card} rounded-3xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
              <div className="space-y-5">
                {content.questions.map((question, questionIndex) => (
                  <fieldset key={question.id}>
                    <legend className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 text-[10px] text-accent">
                        {questionIndex + 1}
                      </span>
                      {question.prompt}
                    </legend>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option.id

                        return (
                          <button
                            aria-pressed={selected}
                            className={`${styles.questionOption} ${
                              selected ? styles.questionOptionSelected : ''
                            } rounded-xl px-3 py-2 text-xs font-medium text-foreground-muted transition active:scale-[0.98] motion-reduce:active:scale-100`}
                            key={option.id}
                            onClick={() => chooseAnswer(question.id, option.id)}
                            type="button"
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>

            <section className={`${styles.pack} rounded-[2rem] px-5 py-7 text-center sm:px-7 sm:py-8`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-100/80">
                {content.pack.eyebrow}
              </p>
              <div aria-hidden="true" className={`${styles.packEmblem} mt-5`}>
                <span className="text-4xl">✦</span>
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-tight text-white">{content.pack.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{content.pack.body}</p>
              <div aria-hidden="true" className={styles.stackPreview}>
                <span />
                <span />
                <span />
              </div>
              <button
                className="mt-3 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-black/25 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:active:scale-100"
                disabled={!canOpen}
                onClick={openPack}
                type="button"
              >
                {content.pack.cta}
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-foreground-faint">
                {canOpen ? content.pack.prototypeOdds : content.pack.disabledHint}
              </p>
            </section>
          </div>
        )}

        {phase === 'reveal' && rarity && (
          <section className="flex flex-col items-center">
            <div className="mb-4 flex w-full items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
                  {content.reveal.found}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">{content.cards[currentSlot].label}</p>
              </div>
              <div
                aria-label={`${revealIndex + 1} / ${REPORT_SLOTS.length}`}
                aria-valuemax={REPORT_SLOTS.length}
                aria-valuemin={1}
                aria-valuenow={revealIndex + 1}
                className="flex items-center gap-1.5"
                role="progressbar"
              >
                {REPORT_SLOTS.map((slot, index) => (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 rounded-full transition-all ${
                      index === revealIndex
                        ? 'w-6 bg-brand'
                        : index < revealIndex
                          ? 'w-2 bg-accent/60'
                          : 'w-2 bg-white/15'
                    }`}
                    key={slot}
                  />
                ))}
              </div>
            </div>

            <FlipCard
              content={content}
              flipped={flipped}
              image={imageFor(currentSlot, rarity)}
              onFlip={flipCard}
              rarity={currentSlot === 'love' ? rarity : null}
              slot={currentSlot}
            />

            <p className={`mt-4 text-xs ${flipped ? 'text-foreground-muted' : 'animate-pulse text-accent'}`}>
              {flipped ? content.cards[currentSlot].summary : content.reveal.tap}
            </p>

            {flipped && (
              <button
                className="mt-4 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
                onClick={advanceReveal}
                type="button"
              >
                {revealIndex === REPORT_SLOTS.length - 1 ? content.reveal.readReport : content.reveal.next}
              </button>
            )}
          </section>
        )}

        {phase === 'report' && rarity && (
          <div className="space-y-4" id="report" ref={reportRef}>
            <header className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
                {content.report.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {content.report.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{content.report.intro}</p>
            </header>

            <div className="sticky top-[calc(0.75rem+var(--safe-area-top))] z-30 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-lg shadow-black/25 backdrop-blur-xl sm:top-16">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground-muted">{content.report.progress}</span>
                <span className="tabular-nums text-accent">
                  {readSlots.length} / {REPORT_SLOTS.length}
                </span>
              </div>
              <div className={`${styles.progressTrack} mt-2`}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(readSlots.length / REPORT_SLOTS.length) * 100}%` }}
                />
              </div>
            </div>

            {REPORT_SLOTS.map((slot, index) => (
              <ReportSection
                content={content}
                image={imageFor(slot, rarity)}
                index={index}
                key={slot}
                rarity={slot === 'love' ? rarity : null}
                slot={slot}
              />
            ))}

            {readSlots.length === REPORT_SLOTS.length && (
              <p className="rounded-2xl border border-positive/20 bg-positive/10 px-4 py-3 text-center text-sm font-semibold text-positive">
                ✦ {content.report.complete}
              </p>
            )}

            <section className={`${styles.actionPanel} rounded-3xl border border-border p-4 sm:p-5`}>
              <h2 className="text-base font-bold text-foreground">{content.actions.collectionTitle}</h2>
              <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">{content.actions.collectionBody}</p>
              <RarityShelf content={content} selected={rarity} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="rounded-full border border-border-2 bg-surface-2 px-3 py-3 text-xs font-bold text-foreground transition hover:bg-surface-3 active:scale-[0.98] disabled:opacity-70 motion-reduce:active:scale-100"
                  disabled={saved}
                  onClick={saveCard}
                  type="button"
                >
                  {saved ? content.actions.saved : content.actions.save}
                </button>
                <button
                  className="rounded-full bg-primary px-3 py-3 text-xs font-bold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
                  onClick={share}
                  type="button"
                >
                  {content.actions.share}
                </button>
              </div>
            </section>

            <section className={`${styles.actionPanel} rounded-3xl border border-border p-4 sm:p-5`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">COMMUNITY</p>
              <h2 className="mt-2 text-base font-bold text-foreground">{content.actions.commentTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{content.actions.commentBody}</p>
              <Link
                className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-white/25 hover:bg-surface-2"
                href={`/${locale}/talk/card-aries-love`}
                onClick={() => track('guardian_comment_open', { card_id: 'aries.love', rarity })}
              >
                <span>{content.actions.commentCta}</span>
                <span aria-hidden="true" className="text-accent">
                  →
                </span>
              </Link>
            </section>

            <section className={`${styles.tomorrowCard} rounded-3xl border border-border px-4 py-6 sm:px-5`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                {content.actions.returnEyebrow}
              </p>
              <h2 className="mt-2 text-lg font-bold text-foreground">{content.actions.returnTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{content.actions.returnBody}</p>
              <Link
                className="relative z-10 mt-4 inline-flex rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-3"
                href={`/${locale}/today`}
              >
                {content.actions.returnCta}
              </Link>
            </section>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
                onClick={resetPrototype}
                type="button"
              >
                {content.actions.reset}
              </button>
              <p className="text-center text-[10px] leading-relaxed text-foreground-faint">
                {content.actions.prototypeNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function FlipCard({
  content,
  flipped,
  image,
  onFlip,
  rarity,
  slot,
}: {
  content: CardReportContent
  flipped: boolean
  image: string
  onFlip: () => void
  rarity: RarityId | null
  slot: ReportSlot
}) {
  const copy = content.cards[slot]

  return (
    <div className={styles.cardStage}>
      <button
        aria-label={flipped ? `${copy.label}: ${copy.title}` : content.reveal.tap}
        className={styles.cardButton}
        onClick={onFlip}
        type="button"
      >
        <div className={`${styles.cardInner} ${flipped ? styles.cardFlipped : ''}`}>
          <div className={`${styles.cardFace} ${styles.cardBack}`}>
            <span aria-hidden="true" className={styles.backOrbit} />
            <span aria-hidden="true" className={styles.backStar}>
              ✦
            </span>
            <span className="absolute bottom-7 text-[10px] font-semibold uppercase tracking-[0.38em] text-amber-100/70">
              STELLA
            </span>
          </div>
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            <CardArtwork content={content} image={image} rarity={rarity} slot={slot} />
          </div>
        </div>
      </button>
    </div>
  )
}

function CardArtwork({
  content,
  image,
  rarity,
  slot,
}: {
  content: CardReportContent
  image: string
  rarity: RarityId | null
  slot: ReportSlot
}) {
  const copy = content.cards[slot]
  const rarityClass = rarity ? RARITY_ARTWORK_CLASS[rarity] : ''

  return (
    <div className={`${styles.artwork} ${rarityClass}`}>
      <Image
        alt={`${copy.guardians} — ${copy.title}`}
        className={styles.artworkImage}
        fill
        sizes="(max-width: 640px) 82vw, 22rem"
        src={image}
      />
      <div className={styles.artworkOverlay}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            {copy.label}
          </span>
          {rarity && (
            <span
              className={`${RARITY_BADGE_CLASS[rarity]} rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur`}
            >
              {content.rarity[rarity].label}
            </span>
          )}
        </div>
        <p className="truncate text-[11px] font-semibold text-white/75" title={copy.guardians}>
          {copy.guardians}
        </p>
        <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white">{copy.title}</h3>
      </div>
    </div>
  )
}

function ReportSection({
  content,
  image,
  index,
  rarity,
  slot,
}: {
  content: CardReportContent
  image: string
  index: number
  rarity: RarityId | null
  slot: ReportSlot
}) {
  const copy = content.cards[slot]

  return (
    <section
      className={`${styles.reportSection} ${cardStyles.card} rounded-[2rem] border bg-surface-2 p-3 backdrop-blur sm:p-4`}
      data-report-slot={slot}
    >
      <div className={styles.reportArtwork}>
        <CardArtwork content={content} image={image} rarity={rarity} slot={slot} />
      </div>
      <div className="px-1 pb-2 pt-5 sm:px-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
            0{index + 1} · {copy.label}
          </p>
          {rarity && (
            <span
              className={`${RARITY_BADGE_CLASS[rarity]} rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em]`}
            >
              {content.rarity[rarity].label}
            </span>
          )}
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">{copy.title}</h2>
        <p className="mt-1 truncate text-xs font-medium text-foreground-subtle" title={copy.guardians}>
          {copy.guardians}
        </p>

        {rarity && (
          <div className="mt-4 rounded-2xl border border-brand/15 bg-brand/8 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              {content.rarity[rarity].label} · {content.rarity[rarity].subtitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">{content.rarity[rarity].description}</p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
            {content.report.summaryLabel}
          </p>
          <p className="mt-1.5 text-base font-semibold leading-relaxed text-foreground-secondary">{copy.summary}</p>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.body}</p>
        </div>

        <blockquote className="mt-5 rounded-2xl border-l-2 border-accent bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            {content.report.reflectionLabel}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground-secondary">{copy.reflection}</p>
        </blockquote>
      </div>
    </section>
  )
}

function RarityShelf({ content, selected }: { content: CardReportContent; selected: RarityId }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {RARITY_IDS.map((rarity) => {
        const unlocked = rarity === selected

        return (
          <div className="min-w-0" key={rarity}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-[#170d32]">
              {unlocked ? (
                <Image
                  alt={`${content.rarity[rarity].label} ${content.cards.love.title}`}
                  className="object-cover"
                  fill
                  sizes="5rem"
                  src={LOVE_IMAGES[rarity]}
                />
              ) : (
                <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(124,89,174,0.35),transparent_45%)]">
                  <span aria-hidden="true" className="text-xl text-amber-200/45">
                    ✦
                  </span>
                  <span className="sr-only">Locked</span>
                </div>
              )}
              {!unlocked && <div className="absolute inset-0 bg-background/25 backdrop-blur-[1px]" />}
            </div>
            <p
              className={`mt-1.5 truncate text-center text-[9px] font-semibold uppercase tracking-wide ${
                unlocked ? 'text-accent' : 'text-foreground-faint'
              }`}
            >
              {content.rarity[rarity].label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function drawPrototypeRarity(): RarityId {
  const random = new Uint32Array(1)
  crypto.getRandomValues(random)
  return RARITY_IDS[random[0] % RARITY_IDS.length]
}

function imageFor(slot: ReportSlot, rarity: RarityId): string {
  return slot === 'love' ? LOVE_IMAGES[rarity] : FIXED_IMAGES[slot]
}

function isRarity(value: string | null): value is RarityId {
  return value !== null && RARITY_IDS.includes(value as RarityId)
}

function isReportSlot(value: string | undefined): value is ReportSlot {
  return value !== undefined && REPORT_SLOTS.includes(value as ReportSlot)
}

function collectionId(rarity: RarityId): string {
  return `aries.love:${rarity}`
}

function readCollection(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(COLLECTION_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
