import { ArrowRight, ChartNoAxesColumnIncreasing, HeartWaves } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import coupleGyeolRidgeImage from '../../../../../public/image/rarity/ridge.png'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import type { GyeolContent } from '../_lib/types'

type IntroViewProps = {
  content: GyeolContent
  hasInvalidSharedResult: boolean
  locale: Locale
}

export function IntroView({ content, hasInvalidSharedResult, locale }: IntroViewProps) {
  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-page-bg text-page-ink" id="main-content">
      <section className="px-safe py-10 sm:py-14 lg:py-18">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 sm:px-6 lg:grid-cols-2">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-page-ink px-4 py-2 font-bold text-sm text-white">
              <HeartWaves aria-hidden="true" className="h-4 w-4 text-page-accent-strong" stroke={1.8} />
              {content.ui.heroEyebrow}
            </p>
            <h1 className="mt-6 text-balance font-black text-5xl leading-tight tracking-tight sm:text-6xl xl:text-7xl">
              {content.ui.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-page-ink-soft leading-8 sm:text-xl">
              {content.ui.heroDescription}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(
                  'inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-page-accent-strong px-6 font-black text-base text-white shadow-[0_24px_80px_var(--page-accent-glow)] transition-colors hover:bg-page-accent-strong/92',
                  FOCUS_CLASS_NAME,
                )}
                href={`/${locale}/couple-gyeol/quiz`}
              >
                {content.ui.heroCta}
                <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
              </Link>
              <a
                className={cn(
                  'inline-flex min-h-14 touch-manipulation items-center justify-center rounded-2xl border border-page-border bg-white px-6 font-bold text-base text-page-ink transition-colors hover:border-page-accent/50',
                  FOCUS_CLASS_NAME,
                )}
                href="#rarity-model"
              >
                {content.ui.heroSecondaryCta}
              </a>
            </div>
            <p className="mt-5 text-page-ink-muted text-sm leading-7">{content.ui.introNote}</p>
            {hasInvalidSharedResult && (
              <div className="mt-6 rounded-3xl border border-page-accent/24 bg-[#fff3f0] p-5">
                <p className="font-black text-page-ink">{content.ui.emptyResultTitle}</p>
                <p className="mt-2 text-page-ink-soft text-sm leading-6">{content.ui.emptyResultDescription}</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-page-border bg-page-surface p-4 shadow-[0_32px_110px_rgba(36,22,23,0.11)] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-page-accent-strong text-sm">{content.ui.gradeTitle}</p>
                <p className="mt-1 font-bold text-page-ink-muted text-sm">{content.grades[1].description}</p>
              </div>
              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-page-soft px-4 py-2 font-black text-page-ink text-sm">
                <ChartNoAxesColumnIncreasing
                  aria-hidden="true"
                  className="h-4 w-4 text-page-accent-strong"
                  stroke={1.8}
                />
                {content.ui.indexLabel}
              </div>
            </div>
            <Image
              alt=""
              className="-mx-5 mt-6 -mb-5 block aspect-1672/941 w-[calc(100%+2.5rem)] max-w-none object-cover sm:-mx-7 sm:-mb-7 sm:w-[calc(100%+3.5rem)]"
              draggable={false}
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 44vw, calc(100vw - 48px)"
              src={coupleGyeolRidgeImage}
            />
          </div>
        </div>
      </section>

      <section className="px-safe pb-16 sm:pb-24" id="rarity-model">
        <div className="mx-auto grid max-w-7xl gap-5 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="rounded-3xl sm:rounded-4xl bg-[#fff7e8] p-7">
            <p className="font-bold text-page-accent-strong text-sm">01</p>
            <h2 className="mt-6 font-black text-2xl tracking-[-0.03em]">{content.ui.modelStepInputTitle}</h2>
            <p className="mt-4 text-page-ink-soft leading-7">{content.ui.modelStepInputBody}</p>
          </article>
          <article className="rounded-3xl sm:rounded-4xl bg-[#fff1ee] p-7">
            <p className="font-bold text-page-accent-strong text-sm">02</p>
            <h2 className="mt-6 font-black text-2xl tracking-[-0.03em]">{content.ui.modelStepGradeTitle}</h2>
            <p className="mt-4 text-page-ink-soft leading-7">{content.ui.modelStepGradeBody}</p>
          </article>
          <article className="rounded-3xl sm:rounded-4xl bg-page-soft p-7">
            <p className="font-bold text-page-accent-strong text-sm">03</p>
            <h2 className="mt-6 font-black text-2xl tracking-[-0.03em]">{content.ui.modelStepShareTitle}</h2>
            <p className="mt-4 text-page-ink-soft leading-7">{content.ui.modelStepShareBody}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
