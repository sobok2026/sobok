'use client'

import type { AssessmentProfile } from '@deep-type/model'
import { Refresh, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useState } from 'react'

import { cn } from '@/utils/cn'

import type { ReportSection } from '../_lib/api'
import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent } from '../_lib/types'
import { GemArtwork } from './gem-artwork'
import { WorldJobHero } from './world-job-hero'

type ReportViewProps = {
  content: DeepTypeContent
  locale: Locale
  /** True while the narration is still being written. Delivery is not stamped yet and the poll keeps running. */
  narrativePending?: boolean
  /** The LLM pass. Always optional: the engine sections below are the finished report on their own. */
  narrativeSections?: readonly ReportSection[]
  onRestart: () => void
  profile: AssessmentProfile
  sections: readonly ReportSection[]
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

type RenderedSection = {
  body: string
  key: string
  /** Narration written over this section, or null where the engine body stands alone. */
  narrative: string | null
  title: string
}

// Engine order first, because that is the report. A narration for a section the engine wrote sits under its
// body; the two LLM-only sections have no engine body and come after, in the order they were generated.
function renderedSections(
  engine: readonly ReportSection[],
  narrative: readonly ReportSection[] = [],
): RenderedSection[] {
  const byKey = new Map(narrative.map((section) => [section.key, section]))
  const written = new Set(engine.map((section) => section.key))

  return [
    ...engine.map((section) => ({
      body: section.body,
      key: section.key,
      narrative: byKey.get(section.key)?.body ?? null,
      title: section.title,
    })),
    ...narrative
      .filter((section) => !written.has(section.key))
      .map((section) => ({ body: section.body, key: section.key, narrative: null, title: section.title })),
  ]
}

/**
 * The paid report: the hero, then whatever sections the server delivered, in the order it delivered them.
 *
 * There is no loading state for the narration and no placeholder where it will land. The engine body is the
 * finished report — that is the delivery contract, not a fallback — so the reader gets the whole thing at once,
 * and narration appears under the sections it was written over as it arrives. `narrativePending` says so in one
 * line rather than by greying anything out.
 */
export function ReportView({
  content,
  locale,
  narrativePending = false,
  narrativeSections,
  onRestart,
  profile,
  sections,
}: ReportViewProps) {
  const [shareFeedback, setShareFeedback] = useState('')
  const gemName = content.gemNames[profile.gem.code]
  const shareText = content.ui.reportShareText
    .replace('{inner}', profile.inner.code)
    .replace('{gem}', `${gemName} (${profile.gem.code})`)

  async function share() {
    const shareData = { text: shareText, title: content.metadata.title, url: window.location.href }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${DEEP_TYPE_BRAND_NAME[locale]}`)
      setShareFeedback(content.ui.reportShareCopied)
    } catch {
      // Older/in-app browsers may expose neither a share sheet nor clipboard access.
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14" id="main-content">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <WorldJobHero content={content} gem={profile.gem.code} inner={profile.inner.code} />

        <div className="rounded-3xl border border-page-border bg-page-surface p-4 text-center">
          <GemArtwork gemCode={profile.gem.code} />
          <p className="mt-4 font-black text-lg">{gemName}</p>
          <p className="mt-1 text-page-ink/56 text-sm">{content.ui.layerGem}</p>
        </div>

        {narrativePending ? (
          <p className="rounded-3xl bg-page-soft px-5 py-4 text-page-ink/60 text-xs leading-6">
            {content.paywall.narrativePendingNote}
          </p>
        ) : null}

        {renderedSections(sections, narrativeSections).map((section) => (
          <section
            className="rounded-3xl border border-page-border bg-page-surface p-4 sm:rounded-4xl sm:p-6"
            key={section.key}
          >
            <h2 className="break-keep font-black text-lg">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line break-keep text-page-ink/76 leading-8">{section.body}</p>
            {section.narrative ? (
              <p className="mt-4 whitespace-pre-line break-keep border-page-border border-t pt-4 text-page-ink/68 leading-8">
                {section.narrative}
              </p>
            ) : null}
          </section>
        ))}

        <section className="rounded-3xl border border-page-border bg-page-surface p-4 sm:rounded-4xl sm:p-6">
          <h2 className="font-black text-lg">{content.ui.methodologyNoteTitle}</h2>
          <p className="mt-2 text-page-ink/64 text-sm leading-7">{content.ui.methodologyNoteBody}</p>
          <Link
            className={cn(
              'mt-4 inline-flex min-h-11 items-center font-bold text-page-accent text-sm underline underline-offset-4',
              focusClassName,
            )}
            href={`/${locale}/deep-type/methodology`}
          >
            {content.ui.methodologyCta}
          </Link>
        </section>

        <div className="mt-2 grid gap-3">
          <button
            className={cn(
              'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
              focusClassName,
            )}
            onClick={share}
            type="button"
          >
            <Share aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportShareCta}
          </button>
          {shareFeedback ? <p className="text-center text-page-ink/56 text-sm">{shareFeedback}</p> : null}
          <button
            className={cn(
              'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-page-border bg-white px-6 font-bold text-page-ink/70 text-sm transition-colors hover:text-page-ink',
              focusClassName,
            )}
            onClick={onRestart}
            type="button"
          >
            <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportRestartCta}
          </button>
        </div>

        <p className="mt-4 text-center text-page-ink/40 text-xs leading-6">{content.ui.reportDisclaimer}</p>
      </div>
    </main>
  )
}
