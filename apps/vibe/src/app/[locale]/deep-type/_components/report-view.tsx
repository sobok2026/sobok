'use client'

import { resolveWorldJob } from '@deep-type/content/world-job'
import type { AssessmentProfile } from '@deep-type/model'
import { Printer, Refresh, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useShare } from '@/components/use-share'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import type { NarrativeSection, ReportSection } from '../_lib/api'
import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'

import { CARD_CLASS_NAME, REPORT_TYPE } from '../_lib/surface'
import type { DeepTypeContent } from '../_lib/types'
import { PurchaseReceipt, ReportAccessNote } from './report/access'
import { BackToTop } from './report/back-to-top'
import { PartDivider, ReportContents } from './report/contents'
import { ReportMasthead } from './report/masthead'
import { splitIntoParts } from './report/parts'
import { ReportSectionView } from './report/section-view'

type ReportViewProps = {
  content: DeepTypeContent
  locale: Locale
  /** True while the narration is still being written. Delivery is not stamped yet and the poll keeps running. */
  narrativePending?: boolean
  /** The LLM pass. Always optional: the engine sections below are the finished report on their own. */
  narrativeSections?: readonly NarrativeSection[]
  onRestart: () => void
  /** The payment this report was delivered for, on the two screens that know it. Absent everywhere else. */
  orderId?: string | null
  profile: AssessmentProfile
  sections: readonly ReportSection[]
}

/**
 * The paid report, as a document.
 *
 * It runs to about twenty thousand pixels at phone width. Twelve peer cards in one column is the wrong shape
 * for that: nothing said how much there was, nothing said where a section sat in the whole, and a reader who
 * wanted the week's quest back had to scroll for it. So the sections are numbered, divided into the three runs
 * they are actually read in (`parts.ts`), listed in a contents card that links to each one, and given a way
 * back to the top.
 *
 * The server still owns section ORDER (`REPORT_DISPLAY_ORDER`) — the opening first, the three questions last.
 * This component never re-sorts; it groups what it was handed, in the order it was handed it.
 *
 * There is no loading state for the narration and no placeholder where it will land. The engine's sections are
 * the finished report — that is the delivery contract, not a fallback — so the reader gets the whole thing at
 * once, and narration appears under the sections it was written over as it arrives. `narrativePending` says so
 * in one line rather than by greying anything out.
 */
export function ReportView({
  content,
  locale,
  narrativePending = false,
  narrativeSections,
  onRestart,
  orderId,
  profile,
  sections,
}: ReportViewProps) {
  const { feedback: shareFeedback, share } = useShare({ copiedMessage: content.ui.reportShareCopied })
  const gemName = content.gemNames[profile.gem.code]
  // The share text names the world job, so both screens have to fill the same token. The free screen already
  // did; leaving this one out shipped a literal '{job}' to the people who paid.
  const worldJobName = resolveWorldJob(profile.inner.code, profile.gem.code).name
  const shareText = content.ui.reportShareText
    .replace('{job}', worldJobName)
    .replace('{inner}', profile.inner.code)
    .replace('{gem}', `${gemName} (${profile.gem.code})`)
  const narrativeByKey = new Map((narrativeSections ?? []).map((section) => [section.key, section]))
  const parts = splitIntoParts(sections)

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14" id="main-content">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <ReportMasthead content={content} gem={profile.gem.code} inner={profile.inner.code} locale={locale} />

        {orderId ? <PurchaseReceipt content={content} locale={locale} orderId={orderId} /> : null}

        {narrativePending ? (
          <p className={cn('rounded-3xl bg-page-soft px-5 py-4', REPORT_TYPE.meta)}>
            {content.paywall.narrativePendingNote}
          </p>
        ) : null}

        <ReportContents content={content} parts={parts} />

        {parts.map((part) => (
          <div className="grid gap-4" key={part.id}>
            <PartDivider content={content} part={part} />
            {part.sections.map(({ number, section }) => (
              <ReportSectionView
                content={content}
                key={section.key}
                narrative={narrativeByKey.get(section.key)?.body ?? null}
                number={number}
                section={section}
              />
            ))}
          </div>
        ))}

        <section className={cn(CARD_CLASS_NAME, 'mt-2')}>
          <h2 className="break-keep font-black text-lg text-page-ink">{content.ui.methodologyNoteTitle}</h2>
          <p className={cn('mt-2', REPORT_TYPE.copy)}>{content.ui.methodologyNoteBody}</p>
          <Link
            className={cn(
              'mt-4 inline-flex min-h-11 items-center font-bold text-page-accent-strong text-sm underline underline-offset-4 print:hidden',
              FOCUS_CLASS_NAME,
            )}
            href={`/${locale}/deep-type/methodology`}
          >
            {content.ui.methodologyCta}
          </Link>
        </section>

        <ReportAccessNote content={content} locale={locale} />

        <div className="mt-2 grid gap-3 print:hidden">
          <button
            className={cn(
              'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-accent-strong px-6 font-black text-sm text-white shadow-[0_20px_60px_var(--page-accent-glow)] transition-colors hover:bg-page-accent-strong/92',
              FOCUS_CLASS_NAME,
            )}
            onClick={() =>
              share({
                copy: `${shareText} ${DEEP_TYPE_BRAND_NAME[locale]}`,
                text: shareText,
                title: content.metadata.title,
              })
            }
            type="button"
          >
            <Share aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportShareCta}
          </button>
          {shareFeedback ? <p className="text-center text-page-ink-muted text-sm">{shareFeedback}</p> : null}
          {/* The browser's own print dialogue is also its 'save as PDF', so one control covers both and there
              is no second rendering of the document to keep in step with this one. */}
          <button
            className={cn(
              'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-page-border bg-white px-6 font-bold text-page-ink-soft text-sm transition-colors hover:text-page-ink',
              FOCUS_CLASS_NAME,
            )}
            onClick={() => window.print()}
            type="button"
          >
            <Printer aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportPrintCta}
          </button>
          <button
            className={cn(
              'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-bold text-page-ink-muted text-sm transition-colors hover:text-page-ink',
              FOCUS_CLASS_NAME,
            )}
            onClick={onRestart}
            type="button"
          >
            <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportRestartCta}
          </button>
        </div>

        <p className={cn('mt-4 text-center', REPORT_TYPE.meta)}>{content.ui.reportDisclaimer}</p>
      </div>

      <BackToTop label={content.ui.reportBackToTop} />
    </main>
  )
}
