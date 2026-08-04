'use client'

import { track, trackEcommerce } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI, type GuardianReportPaidContent } from '@/content/guardian-report-ui'
import {
  acknowledgeGuardianMilestone,
  clearGuardianCheckoutSession,
  confirmGuardianPurchase,
  GUARDIAN_CURRENCY,
  GUARDIAN_REPORT_ITEM,
  GUARDIAN_REPORT_PRICE,
  GuardianApiError,
  type GuardianCheckoutSession,
  type GuardianQuestionnaireClientStep,
  getGuardianQuestion,
  getGuardianReport,
  guardianReportPaths,
  putGuardianAnswer,
} from '@/lib/guardian-paid'

import styles from '../paid-report.module.css'
import GuardianMissingSession from './GuardianMissingSession'
import { useGuardianCheckoutSession } from './useGuardianCheckoutSession'

type ActiveQuestionnaireStep = Exclude<GuardianQuestionnaireClientStep, { status: 'complete' }>
type QuestionStep = Exclude<ActiveQuestionnaireStep, { status: 'milestone' }>
type MilestoneStep = Extract<ActiveQuestionnaireStep, { status: 'milestone' }>
type TerminalStatus = 'failed' | 'cancelled' | 'refunded'

type FlowState =
  | { kind: 'verifying' }
  | { kind: 'pending' }
  | { kind: 'questionnaire'; step: ActiveQuestionnaireStep }
  | { kind: 'fulfilling' }
  | { kind: 'terminal'; status: TerminalStatus }
  | { kind: 'error'; message: string }

export default function GuardianPaidQuestions({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].paid
  const session = useGuardianCheckoutSession(locale)

  if (session === undefined) {
    return <LoadingPage copy={content.status.verifyingTitle} />
  }

  if (!session) {
    return <GuardianMissingSession locale={locale} />
  }

  return <GuardianQuestionnaireFlow session={session} />
}

function GuardianQuestionnaireFlow({ session }: { session: GuardianCheckoutSession }) {
  const content = GUARDIAN_REPORT_UI[session.locale].paid
  const paths = guardianReportPaths(session.locale)
  const router = useRouter()
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
    void openQuestionnaire()
  }, [])

  async function openQuestionnaire() {
    setState({ kind: 'verifying' })
    setAnswerError(null)
    try {
      await loadQuestionnaire()
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
      // The only place a payment is known to have succeeded. Safe to reach twice — this screen is where the
      // PG redirect lands, so a reload re-runs it — because GA4 deduplicates `purchase` by transaction_id.
      trackEcommerce('purchase', {
        currency: GUARDIAN_CURRENCY,
        items: [GUARDIAN_REPORT_ITEM],
        transaction_id: session.paymentId,
        value: GUARDIAN_REPORT_PRICE,
      })
      await loadQuestionnaire()
    } catch (error) {
      setState({ kind: 'error', message: reportErrorMessage(error, content) })
    }
  }

  async function loadQuestionnaire() {
    const report = await getGuardianReport(session)
    if (report.status === 'fulfilled') {
      track('guardian_report_fulfilled', { card_count: report.cards.length, locale: report.locale })
      router.replace(paths.result)
      return
    }

    const step = await getGuardianQuestion(session)
    if (step.status === 'complete') {
      await finishQuestionnaire()
      return
    }
    setState({ kind: 'questionnaire', step })
  }

  async function finishQuestionnaire() {
    setState({ kind: 'fulfilling' })
    const report = await getGuardianReport(session)
    if (report.status !== 'fulfilled') {
      throw new Error('Guardian report did not fulfill after its questionnaire completed')
    }
    track('guardian_report_fulfilled', { card_count: report.cards.length, locale: report.locale })
    router.replace(paths.result)
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
      try {
        await finishQuestionnaire()
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
    router.replace(paths.landing)
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
                  href={paths.freeResult}
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
                <Link
                  className="mt-6 block w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  href={paths.landing}
                >
                  {content.status.returnToPreview}
                </Link>
              </>
            )}

            {state.kind === 'error' && (
              <>
                <StatusIcon>⋆</StatusIcon>
                <h1 className="mt-4 text-xl font-bold text-white">{content.status.errorTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{state.message}</p>
                <button
                  className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  onClick={openQuestionnaire}
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

function LoadingPage({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <div className="text-center">
        <span aria-hidden className="text-3xl">
          ✦
        </span>
        <p className="mt-3 animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
      </div>
    </main>
  )
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
