'use client'

import { track } from '@sobok/analytics/browser'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI, type GuardianReportPaidContent } from '@/content/guardian-report-ui'
import {
  acknowledgeGuardianMilestone,
  clearGuardianCheckoutSession,
  confirmGuardianPurchase,
  GuardianApiError,
  type GuardianCheckoutSession,
  type GuardianQuestionnaireClientStep,
  type GuardianReportView,
  getGuardianQuestion,
  getGuardianReport,
  putGuardianAnswer,
} from '@/lib/guardian-paid'

import styles from './paid-report.module.css'

type FulfilledReport = Extract<GuardianReportView, { status: 'fulfilled' }>
type ActiveQuestionnaireStep = Exclude<GuardianQuestionnaireClientStep, { status: 'complete' }>
type QuestionStep = Exclude<ActiveQuestionnaireStep, { status: 'milestone' }>
type MilestoneStep = Extract<ActiveQuestionnaireStep, { status: 'milestone' }>
type TerminalStatus = 'failed' | 'cancelled' | 'refunded'

type FlowState =
  | { kind: 'verifying' }
  | { kind: 'pending' }
  | { kind: 'questionnaire'; step: ActiveQuestionnaireStep }
  | { kind: 'fulfilling' }
  | { kind: 'fulfilled'; report: FulfilledReport }
  | { kind: 'terminal'; status: TerminalStatus }
  | { kind: 'error'; message: string }

export default function GuardianPaidFlow({ session }: { session: GuardianCheckoutSession }) {
  const content = GUARDIAN_REPORT_UI[session.locale].paid
  const [state, setState] = useState<FlowState>({ kind: 'verifying' })
  const [saving, setSaving] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true
    void openReport()
  }, [])

  async function openReport() {
    setState({ kind: 'verifying' })
    setAnswerError(null)
    try {
      await loadReport()
    } catch (error) {
      if (error instanceof GuardianApiError && error.slug === 'payment-required') {
        await reconcilePayment()
        return
      }
      setState({ kind: 'error', message: reportErrorMessage(error, content) })
    }
  }

  async function reconcilePayment() {
    setState({ kind: 'verifying' })
    setAnswerError(null)
    try {
      const confirmation = await confirmGuardianPurchase(session)
      if (confirmation.status === 'pending') {
        setState({ kind: 'pending' })
        return
      }
      if (confirmation.status !== 'paid') {
        setState({ kind: 'terminal', status: confirmation.status })
        return
      }
      track('guardian_payment_confirmed', { locale: session.locale })
      await loadReport()
    } catch (error) {
      setState({ kind: 'error', message: reportErrorMessage(error, content) })
    }
  }

  async function loadReport() {
    const report = await getGuardianReport(session)
    if (report.status === 'fulfilled') {
      setState({ kind: 'fulfilled', report })
      track('guardian_report_fulfilled', { card_count: report.cards.length, locale: report.locale })
      return
    }

    const step = await getGuardianQuestion(session)
    if (step.status === 'complete') {
      setState({ kind: 'fulfilling' })
      const fulfilled = await getGuardianReport(session)
      if (fulfilled.status !== 'fulfilled') {
        throw new Error('Guardian report did not fulfill after its questionnaire completed')
      }
      setState({ kind: 'fulfilled', report: fulfilled })
      track('guardian_report_fulfilled', { card_count: fulfilled.cards.length, locale: fulfilled.locale })
      return
    }
    setState({ kind: 'questionnaire', step })
  }

  async function saveChoice(questionId: string, optionId: string) {
    if (saving) {
      return
    }
    setSaving(true)
    setAnswerError(null)
    try {
      const step = await putGuardianAnswer(session, questionId, { type: 'option', optionId })
      track('guardian_question_answered', { locale: session.locale, phase: 'question', question_id: questionId })
      await advance(step)
    } catch (error) {
      await handleProgressError(error)
    } finally {
      setSaving(false)
    }
  }

  async function saveNote(text: string | null) {
    if (saving || state.kind !== 'questionnaire' || state.step.status !== 'optional-note') {
      return
    }
    setSaving(true)
    setAnswerError(null)
    try {
      const step = await putGuardianAnswer(session, state.step.note.id, { type: 'text', text })
      track('guardian_question_answered', {
        locale: session.locale,
        phase: 'note',
        question_id: state.step.note.id,
      })
      await advance(step)
    } catch (error) {
      await handleProgressError(error)
    } finally {
      setSaving(false)
    }
  }

  async function continueFromMilestone(milestoneId: string) {
    if (saving) {
      return
    }
    setSaving(true)
    setAnswerError(null)
    try {
      const step = await acknowledgeGuardianMilestone(session, milestoneId)
      track('guardian_questionnaire_milestone_completed', { locale: session.locale, milestone_id: milestoneId })
      await advance(step)
    } catch (error) {
      await handleProgressError(error)
    } finally {
      setSaving(false)
    }
  }

  async function handleProgressError(error: unknown) {
    if (
      error instanceof GuardianApiError &&
      (error.slug === 'question-conflict' || error.slug === 'milestone-conflict')
    ) {
      const latest = await getGuardianQuestion(session).catch(() => null)
      if (latest && latest.status !== 'complete') {
        setState({ kind: 'questionnaire', step: latest })
        setAnswerError(
          error.slug === 'milestone-conflict' ? content.errors.milestoneConflict : content.errors.questionConflict,
        )
        return
      }
    }
    setAnswerError(answerErrorMessage(error, content))
  }

  async function advance(step: GuardianQuestionnaireClientStep) {
    if (step.status === 'complete') {
      setState({ kind: 'fulfilling' })
      try {
        await loadReport()
      } catch (error) {
        setState({ kind: 'error', message: reportErrorMessage(error, content) })
      }
      return
    }
    setState({ kind: 'questionnaire', step })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function forgetAndReturn() {
    clearGuardianCheckoutSession()
    window.location.assign(`/${session.locale}/guardian-report`)
  }

  if (state.kind === 'fulfilled') {
    return <GuardianReportExperience content={content} report={state.report} />
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(4rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <div className="relative z-10 mx-auto w-full max-w-xl">
        {state.kind === 'questionnaire' ? (
          state.step.status === 'milestone' ? (
            <QuestionnaireMilestone
              answerError={answerError}
              copy={content.questionnaire}
              onContinue={continueFromMilestone}
              saving={saving}
              step={state.step}
            />
          ) : (
            <Questionnaire
              answerError={answerError}
              content={content}
              note={note}
              onNoteChange={setNote}
              onSaveChoice={saveChoice}
              onSaveNote={saveNote}
              saving={saving}
              step={state.step}
            />
          )
        ) : (
          <StatusCard>
            {state.kind === 'verifying' && (
              <>
                <StatusIcon>✦</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.verifyingTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.status.verifyingBody}</p>
                <LoadingDots />
              </>
            )}

            {state.kind === 'pending' && (
              <>
                <StatusIcon>☾</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.pendingTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.status.pendingBody}</p>
                <button
                  className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  onClick={reconcilePayment}
                  type="button"
                >
                  {content.status.retry}
                </button>
                <Link
                  className="mt-3 block text-xs text-foreground-subtle underline-offset-4 hover:underline"
                  href={`/${session.locale}/guardian-report`}
                >
                  {content.status.returnToPreview}
                </Link>
              </>
            )}

            {state.kind === 'fulfilling' && (
              <>
                <StatusIcon>✧</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.fulfillingTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.status.fulfillingBody}</p>
                <LoadingDots />
              </>
            )}

            {state.kind === 'terminal' && (
              <>
                <StatusIcon>☁</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.terminalTitles[state.status]}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.status.terminalBody}</p>
                <button
                  className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  onClick={() => window.location.assign(`/${session.locale}/guardian-report`)}
                  type="button"
                >
                  {content.status.returnToPreview}
                </button>
              </>
            )}

            {state.kind === 'error' && (
              <>
                <StatusIcon>⋆</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.errorTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{state.message}</p>
                <button
                  className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  onClick={openReport}
                  type="button"
                >
                  {content.status.retryLoad}
                </button>
                <button
                  className="mt-3 text-xs text-foreground-faint underline-offset-4 hover:text-foreground-muted hover:underline"
                  onClick={forgetAndReturn}
                  type="button"
                >
                  {content.status.forget}
                </button>
              </>
            )}
          </StatusCard>
        )}
      </div>
    </main>
  )
}

function Questionnaire({
  answerError,
  content,
  note,
  onNoteChange,
  onSaveChoice,
  onSaveNote,
  saving,
  step,
}: {
  answerError: string | null
  content: GuardianReportPaidContent
  note: string
  onNoteChange: (value: string) => void
  onSaveChoice: (questionId: string, optionId: string) => void
  onSaveNote: (text: string | null) => void
  saving: boolean
  step: QuestionStep
}) {
  const progress = step.progress
  const current = Math.min(progress.answered + 1, progress.maximumTotal)
  const percentage = Math.round((progress.answered / progress.maximumTotal) * 100)
  const copy = content.questionnaire

  return (
    <section
      aria-labelledby="guardian-question-title"
      className="rounded-[2rem] border border-white/10 bg-[#120b24]/85 p-5 shadow-2xl backdrop-blur sm:p-7"
    >
      <header>
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-foreground-subtle">
          <span>
            {step.status === 'question'
              ? `${copy.slotLabels[step.question.slot]} · ${step.question.phase === 'core' ? copy.core : copy.adaptive}`
              : copy.notePhase}
          </span>
          <span>{step.status === 'question' ? copy.position(current, progress.maximumTotal) : copy.optional}</span>
        </div>
        <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ffc1d6,#c9a8ff)] transition-[width] duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-foreground-faint">
          {copy.range(progress.minimumTotal, progress.maximumTotal)}
        </p>
      </header>

      {step.status === 'question' ? (
        <div className="mt-8">
          <p className="text-xs font-semibold text-pink-200/80">{copy.promptEyebrow}</p>
          <h1 className="mt-2 text-balance text-xl font-bold leading-8 text-white" id="guardian-question-title">
            {step.question.prompt}
          </h1>
          {step.question.supportingText && (
            <p className="mt-3 text-sm leading-6 text-foreground-muted">{step.question.supportingText}</p>
          )}
          <div className="mt-6 grid gap-2.5">
            {step.question.options.map((option) => (
              <button
                className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3.5 text-left text-sm leading-6 text-foreground-secondary transition hover:border-pink-200/40 hover:bg-pink-100/8 hover:text-white disabled:cursor-wait disabled:opacity-45"
                disabled={saving}
                key={option.id}
                onClick={() => onSaveChoice(step.question.id, option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-xs font-semibold text-pink-200/80">{copy.noteEyebrow}</p>
          <h1 className="mt-2 text-balance text-xl font-bold leading-8 text-white" id="guardian-question-title">
            {step.note.prompt}
          </h1>
          {step.note.supportingText && (
            <p className="mt-3 text-sm leading-6 text-foreground-muted">{step.note.supportingText}</p>
          )}
          <textarea
            className="mt-5 min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-foreground-faint focus:border-pink-200/40 focus:ring-2 focus:ring-pink-200/10"
            maxLength={step.note.maxLength}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={copy.notePlaceholder}
            value={note}
          />
          <div className="mt-1 flex justify-end text-[11px] text-foreground-faint">
            {copy.noteLength(note.length, step.note.maxLength)}
          </div>
          <button
            className="mt-4 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-45"
            disabled={saving}
            onClick={() => onSaveNote(note.trim() || null)}
            type="button"
          >
            {saving ? copy.noteSubmitting : note.trim() ? copy.noteSubmitWithText : copy.noteSubmit}
          </button>
        </div>
      )}

      {answerError && <InlineError>{answerError}</InlineError>}
      <p className="mt-6 text-center text-[11px] leading-5 text-foreground-faint">{copy.autosave}</p>
    </section>
  )
}

function QuestionnaireMilestone({
  answerError,
  copy,
  onContinue,
  saving,
  step,
}: {
  answerError: string | null
  copy: GuardianReportPaidContent['questionnaire']
  onContinue: (milestoneId: string) => void
  saving: boolean
  step: MilestoneStep
}) {
  const { milestone, progress } = step

  return (
    <section className="rounded-[2rem] border border-pink-200/15 bg-[#120b24]/90 p-5 shadow-2xl backdrop-blur sm:p-7">
      <header className="text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
          <span className="text-accent">{milestone.eyebrow}</span>
          <span className="rounded-full border border-pink-200/15 bg-pink-100/8 px-2.5 py-1 text-pink-100">
            {copy.milestonePosition(progress.answered)}
          </span>
        </div>
        <h1 className="mt-7 text-balance text-2xl font-black leading-9 text-white">{milestone.title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-muted">{milestone.body}</p>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {milestone.themes.map((theme) => (
          <article
            className={`${styles.milestoneTheme} rounded-3xl border border-white/9 bg-white/4 p-4`}
            key={theme.slot}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-pink-100/10 text-sm text-pink-100">
                {theme.glyph}
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                {theme.label}
              </p>
            </div>
            <h2 className="relative z-10 mt-3 text-sm font-bold leading-6 text-white">{theme.title}</h2>
            <p className="relative z-10 mt-2 text-xs leading-6 text-foreground-muted">{theme.body}</p>
          </article>
        ))}
      </div>

      <aside className="mt-6 rounded-3xl border border-accent/18 bg-accent/8 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{milestone.bridge.eyebrow}</p>
        <h2 className="mt-2 text-base font-bold leading-6 text-white">{milestone.bridge.title}</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{milestone.bridge.body}</p>
      </aside>

      {answerError && <InlineError>{answerError}</InlineError>}
      <button
        className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-45"
        disabled={saving}
        onClick={() => onContinue(milestone.id)}
        type="button"
      >
        {milestone.bridge.cta}
      </button>
    </section>
  )
}

function GuardianReportExperience({
  content,
  report,
}: {
  content: GuardianReportPaidContent
  report: FulfilledReport
}) {
  const [view, setView] = useState<'reveal' | 'report'>('reveal')

  useEffect(() => {
    if (view === 'report') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [view])

  function openReport() {
    setView('report')
    track('guardian_report_opened', { locale: report.locale })
  }

  if (view === 'reveal') {
    return <CardReveal content={content} onComplete={openReport} report={report} />
  }
  return <GuardianReport content={content} report={report} />
}

function CardReveal({
  content,
  onComplete,
  report,
}: {
  content: GuardianReportPaidContent
  onComplete: () => void
  report: FulfilledReport
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const revealedDetailsRef = useRef<HTMLDivElement>(null)
  const card = report.cards[index]
  const section = report.narrative.sections.find(({ slot }) => slot === card.slot)
  const isLast = index === report.cards.length - 1

  useEffect(() => {
    if (flipped) {
      revealedDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [flipped])

  function reveal() {
    if (flipped) {
      return
    }
    setFlipped(true)
    track('guardian_card_revealed', { index, locale: report.locale, slot: card.slot })
  }

  function next() {
    if (isLast) {
      track('guardian_card_reveal_complete', { locale: report.locale })
      onComplete()
      return
    }
    setIndex((current) => current + 1)
    setFlipped(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-65" />
      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.reveal.eyebrow}</p>
        <h1 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.reveal.title}</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.reveal.body}</p>
        <div
          aria-label={`${index + 1} / ${report.cards.length}`}
          aria-valuemax={report.cards.length}
          aria-valuemin={1}
          aria-valuenow={index + 1}
          className="mt-3 flex justify-center gap-1.5"
          role="progressbar"
        >
          {report.cards.map((item, itemIndex) => (
            <span
              className={`h-1.5 rounded-full transition-all ${itemIndex <= index ? 'w-7 bg-pink-200' : 'w-3 bg-white/10'}`}
              key={item.cardEditionId}
            />
          ))}
        </div>

        <button
          className="mt-3 text-xs text-foreground-faint underline-offset-4 hover:text-foreground-muted hover:underline"
          onClick={onComplete}
          type="button"
        >
          {content.reveal.skip}
        </button>

        <div className={`${styles.revealStage} mt-4`}>
          <button
            aria-label={flipped ? section?.artworkAlt : content.reveal.tap}
            className={styles.revealButton}
            onClick={reveal}
            type="button"
          >
            <span className={`${styles.revealInner} ${flipped ? styles.revealFlipped : ''}`}>
              <span className={`${styles.revealFace} ${styles.revealBack}`}>
                <span className="relative z-10 text-5xl">✦</span>
                <span className="absolute bottom-8 z-10 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  {content.questionnaire.slotLabels[card.slot]}
                </span>
              </span>
              <span className={`${styles.revealFace} ${styles.revealFront}`}>
                <Image
                  alt={section?.artworkAlt ?? ''}
                  className="h-full w-full object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 82vw, 21rem"
                  src={card.artworkPath}
                />
              </span>
            </span>
          </button>
        </div>

        {!flipped ? (
          <p className="mt-5 animate-pulse text-xs font-semibold text-pink-100 motion-reduce:animate-none">
            {content.reveal.tap}
          </p>
        ) : (
          <div className="mx-auto mt-5 max-w-md scroll-mb-24" ref={revealedDetailsRef}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              {content.questionnaire.slotLabels[card.slot]} ·{' '}
              {card.rarity ? content.reveal.rarityLabels[card.rarity] : content.reveal.signatureRarity}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">{section?.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{section?.oneLine}</p>
            <button
              className="mt-5 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
              onClick={next}
              type="button"
            >
              {isLast ? content.reveal.read : content.reveal.next}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function GuardianReport({ content, report }: { content: GuardianReportPaidContent; report: FulfilledReport }) {
  const { narrative } = report
  const placements = placementSummary(narrative.sections)
  const closingRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const closing = closingRef.current
    if (!closing) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        track('guardian_report_complete', { card_count: report.cards.length, locale: report.locale })
        observer.disconnect()
      },
      { threshold: 0.5 },
    )

    observer.observe(closing)
    return () => observer.disconnect()
  }, [report.cards.length, report.locale])

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <header className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{narrative.hero.eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight text-white sm:text-4xl">
            {narrative.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-foreground-muted">{narrative.hero.introduction}</p>
          <p className="mx-auto mt-5 rounded-2xl border border-pink-200/15 bg-pink-100/8 px-4 py-3 text-sm font-semibold leading-6 text-pink-50">
            {narrative.hero.oneLine}
          </p>
          {narrative.hero.chartNote && (
            <p className="mt-3 text-xs leading-5 text-foreground-subtle">{narrative.hero.chartNote}</p>
          )}
        </header>

        <section aria-label={content.report.cardsLabel} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {report.cards.map((card) => (
            <figure className="rounded-2xl border border-white/10 bg-white/4 p-2 shadow-xl" key={card.cardEditionId}>
              <Image
                alt={narrative.sections.find(({ slot }) => slot === card.slot)?.artworkAlt ?? ''}
                className="aspect-[3/4] w-full rounded-xl object-cover"
                height={480}
                priority
                src={card.artworkPath}
                width={360}
              />
              <figcaption className="flex items-center justify-between gap-2 px-1 pb-1 pt-2 text-[10px]">
                <span className="font-semibold text-white">{content.questionnaire.slotLabels[card.slot]}</span>
                <span className="text-foreground-subtle">
                  {card.rarity ? content.reveal.rarityLabels[card.rarity] : content.reveal.signatureRarity}
                </span>
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="mt-9 rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.mapEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.mapTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.report.mapBody}</p>
          <div className={`${styles.themeMap} mt-6 grid gap-3 sm:grid-cols-2`}>
            {narrative.sections.map((section) => (
              <article className="relative z-10 rounded-2xl border border-white/8 bg-[#1b1230] p-4" key={section.slot}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-200/75">
                  {section.label}
                </p>
                <h3 className="mt-1 text-sm font-bold text-white">{section.title}</h3>
                <p className="mt-2 text-xs leading-5 text-foreground-muted">{section.oneLine}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-accent/15 bg-accent/7 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.placementsEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.placementsTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.report.placementsBody}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {placements.map((placement) => (
              <span
                className="rounded-full border border-white/10 bg-black/12 px-3 py-1.5 text-[11px] text-foreground-secondary"
                key={placement.label}
              >
                {placement.label}
                {placement.count > 1 && <strong className="ml-1.5 text-pink-200">×{placement.count}</strong>}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-8">
          {narrative.sections.map((section) => {
            const card = report.cards.find(({ slot }) => slot === section.slot)
            return (
              <article
                className="rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl backdrop-blur sm:p-7"
                key={section.slot}
              >
                <div className="grid items-start gap-5 sm:grid-cols-[8rem_1fr]">
                  {card && (
                    <Image
                      alt={section.artworkAlt}
                      className="mx-auto aspect-[3/4] w-32 rounded-2xl object-cover shadow-xl"
                      height={480}
                      src={card.artworkPath}
                      width={360}
                    />
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</p>
                    <h2 className="mt-2 text-xl font-bold leading-7 text-white">{section.title}</h2>
                    <p className="mt-1 text-xs text-pink-200/80">{section.guardians}</p>
                    <p className="mt-4 text-sm font-semibold leading-6 text-pink-50">{section.oneLine}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white/4 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {content.report.chartClues}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{section.chart.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {section.chart.placements.map((placement) => (
                      <span
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-foreground-subtle"
                        key={placement.body}
                      >
                        {placement.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {section.details.map((detail) => (
                    <section key={detail.title}>
                      <h3 className="text-sm font-bold text-white">{detail.title}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground-muted">{detail.body}</p>
                    </section>
                  ))}
                </div>

                <aside className="mt-6 rounded-2xl border border-accent/15 bg-accent/8 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    {content.report.guidance}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-white">{section.guidance.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground-muted">
                    {section.guidance.body}
                  </p>
                </aside>
                <div className="mt-5 border-t border-white/8 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {content.report.reflection}
                  </p>
                  <p className="mt-2 text-sm italic leading-7 text-foreground-secondary">{section.reflection}</p>
                </div>
              </article>
            )
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/4 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.actionEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.actionTitle}</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {narrative.sections.map((section, index) => (
              <li className="rounded-2xl border border-white/8 bg-black/12 p-4" key={section.slot}>
                <span className="text-[10px] font-bold text-pink-200">0{index + 1}</span>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">{section.reflection}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mt-8 rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,193,214,0.1),rgba(201,168,255,0.08))] p-6 text-center sm:p-8"
          ref={closingRef}
        >
          <p aria-hidden className="text-2xl">
            {content.report.closingGlyph}
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">{narrative.closing.title}</h2>
          {narrative.closing.body.map((paragraph) => (
            <p className="mt-3 text-sm leading-7 text-foreground-muted" key={paragraph}>
              {paragraph}
            </p>
          ))}
          {narrative.closing.personalNote && (
            <blockquote className="mt-5 rounded-2xl bg-black/15 px-4 py-4 text-left">
              <p className="text-[11px] font-semibold text-pink-200">{narrative.closing.personalNote.label}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground-secondary">
                {narrative.closing.personalNote.body}
              </p>
            </blockquote>
          )}
          <p className="mt-6 text-sm font-bold text-pink-50">{narrative.closing.action}</p>
        </section>
      </div>
    </main>
  )
}

function placementSummary(sections: FulfilledReport['narrative']['sections']): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const section of sections) {
    for (const placement of section.chart.placements) {
      counts.set(placement.label, (counts.get(placement.label) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-[12vh] max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-6 text-center shadow-2xl backdrop-blur sm:p-8">
      {children}
    </section>
  )
}

function StatusIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-pink-200/20 bg-pink-100/10 text-2xl text-pink-100"
    >
      {children}
    </span>
  )
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-5 text-pink-200">
      {children}
    </p>
  )
}

function LoadingDots() {
  return (
    <span
      aria-hidden
      className="mx-auto mt-6 block w-fit animate-pulse text-lg tracking-[0.35em] text-accent motion-reduce:animate-none"
    >
      •••
    </span>
  )
}

function reportErrorMessage(error: unknown, content: GuardianReportPaidContent): string {
  if (error instanceof GuardianApiError) {
    if (error.slug === 'payment-required') {
      return content.errors.paymentRequired
    }
    if (error.slug === 'forbidden' || error.slug === 'report-not-found') {
      return content.errors.reportUnavailable
    }
    if (error.slug === 'service-unavailable') {
      return content.errors.serviceUnavailable
    }
  }
  return content.errors.genericReport
}

function answerErrorMessage(error: unknown, content: GuardianReportPaidContent): string {
  if (error instanceof GuardianApiError && error.slug === 'invalid-answer') {
    return content.errors.invalidAnswer
  }
  return content.errors.genericAnswer
}
