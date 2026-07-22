'use client'

import { type AssessmentProfile, AXIS_POLES, CONTEXT_AXES, GEM_AXES } from '@deep-type/model'
import { Refresh, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { ReportSection } from '../_lib/api'
import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent } from '../_lib/types'
import { AxisProfile } from './axis-profile'
import { ContextComparison } from './context-comparison'
import { ResultHero } from './result-hero'

type ReportViewProps = {
  content: DeepTypeContent
  locale: Locale
  onRestart: () => void
  onUnlock?: () => void
  paidSections?: readonly ReportSection[]
  profile: AssessmentProfile
  refined?: boolean
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function ReportView({
  content,
  locale,
  onRestart,
  onUnlock,
  paidSections,
  profile,
  refined = false,
}: ReportViewProps) {
  const [shareFeedback, setShareFeedback] = useState('')
  const gemName = content.gemNames[profile.gem.code]
  const shareText = content.ui.reportShareText
    .replace('{persona}', profile.persona.code)
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
        <ResultHero content={content} profile={profile} refined={refined} />

        {onUnlock ? (
          <section className="rounded-4xl border border-page-accent/40 bg-page-accent/8 p-6 text-center sm:p-7">
            <p className="break-keep font-black text-lg text-page-accent">{content.paywall.title}</p>
            <p className="mx-auto mt-2 max-w-md text-page-ink/68 text-sm leading-7">{content.paywall.body}</p>
            <button
              className={cn(
                'mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
                focusClassName,
              )}
              onClick={onUnlock}
              type="button"
            >
              {content.paywall.unlockCta}
            </button>
          </section>
        ) : null}

        <div className="rounded-3xl border border-page-border bg-page-soft/60 p-4">
          <p className="text-page-ink/60 text-xs leading-6">{content.ui.clarityNote}</p>
        </div>

        <AxisProfile
          axisIds={CONTEXT_AXES}
          content={content}
          scores={profile.persona.axes}
          title={`${content.ui.profileTitle} · ${content.ui.layerPersona}`}
        />
        <AxisProfile
          axisIds={CONTEXT_AXES}
          content={content}
          scores={profile.inner.axes}
          title={`${content.ui.profileTitle} · ${content.ui.layerInner}`}
        />
        <AxisProfile axisIds={GEM_AXES} content={content} scores={profile.gem.axes} title={content.ui.layerGem} />

        <ContextComparison content={content} profile={profile} />

        <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
          <h2 className="font-black text-lg">{content.ui.reflectionTitle}</h2>
          <p className="mt-2 text-page-ink/60 text-sm leading-6">{content.ui.reflectionBody}</p>
          <ul className="mt-4 grid gap-3">
            {GEM_AXES.map((axis) => {
              const copy = content.axes[axis]
              const reflection =
                profile.gem.axes[axis].pole === AXIS_POLES[axis][0] ? copy.first.reflection : copy.second.reflection
              return (
                <li className="rounded-3xl border border-page-border bg-white p-4" key={axis}>
                  <p className="font-black text-sm">{copy.name}</p>
                  <p className="mt-1 text-page-ink/68 text-sm leading-6">{reflection}</p>
                </li>
              )
            })}
          </ul>
        </section>

        {paidSections?.map((section) => (
          <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7" key={section.key}>
            <h2 className="break-keep font-black text-lg">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line break-keep text-page-ink/76 leading-8">{section.body}</p>
          </section>
        ))}

        <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
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
