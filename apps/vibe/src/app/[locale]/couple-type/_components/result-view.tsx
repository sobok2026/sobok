import { ArrowLeft, HeartWaves, MessageDots, Refresh } from '@mynaui/icons-react'
import Image from 'next/image'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import { axisOrder, getAxisOption } from '../_lib/model'
import type { AxisValue, CoupleTypeContent, CoupleTypeResult } from '../_lib/types'

type ResultViewProps = {
  answerCount: number
  axisDefinitions: CoupleTypeContent['axisDefinitions']
  onEdit: () => void
  onRestart: () => void
  result: CoupleTypeResult
  ui: CoupleTypeContent['ui']
}

export function ResultView({ answerCount, axisDefinitions, onEdit, onRestart, result, ui }: ResultViewProps) {
  const codeLetters = result.code.split('') as AxisValue[]
  const resultImageSrc = `/image/${result.code}.png`

  return (
    <section className="px-safe py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="rounded-3xl sm:rounded-4xl bg-foreground p-6 text-white shadow-[0_36px_120px_rgba(36,22,23,0.2)] sm:p-8 lg:sticky lg:top-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-sm text-white/78">
            <HeartWaves aria-hidden="true" className="h-4 w-4 text-accent" stroke={1.8} />
            {ui.resultEyebrow}
          </p>
          <div className="mt-7 overflow-hidden rounded-3xl sm:rounded-4xl border border-white/10 bg-white/8">
            <Image
              alt={result.title}
              className="aspect-square w-full object-cover"
              height={1254}
              sizes="(min-width: 1280px) 432px, (min-width: 1024px) 36vw, calc(100vw - 5rem)"
              src={resultImageSrc}
              width={1254}
            />
          </div>
          <h1 className="mt-7 font-black text-4xl leading-tight sm:text-6xl">{result.title}</h1>
          <p className="mt-5 font-black text-2xl text-accent">{result.displayCode}</p>
          <p className="mt-5 text-white/70 leading-8">{result.summary}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 font-black text-sm text-white transition-colors hover:bg-accent/92',
                FOCUS_CLASS_NAME,
              )}
              onClick={onEdit}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
              {ui.editButton}
            </button>
            <button
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 font-black text-sm text-white transition-colors hover:bg-white/14',
                FOCUS_CLASS_NAME,
              )}
              onClick={onRestart}
              type="button"
            >
              <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
              {ui.restartButton}
            </button>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-3xl sm:rounded-4xl border border-border bg-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
            <h2 className="font-black text-2xl">{ui.rhythmsTitle}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {axisOrder.map((axisKey, index) => {
                const letter = codeLetters[index]
                const axis = axisDefinitions[axisKey]
                const option = getAxisOption({ axis: axisKey, axisDefinitions, value: letter })

                return (
                  <article className="rounded-3xl bg-surface-2 p-5" key={axisKey}>
                    <p className="font-bold text-accent text-sm">{axis.label}</p>
                    <h3 className="mt-3 font-black text-xl">{option.label}</h3>
                    <p className="mt-3 text-foreground-secondary text-sm leading-6">{option.body}</p>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="rounded-3xl sm:rounded-4xl border border-border bg-white p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
            <h2 className="font-black text-2xl">{ui.strengthsTitle}</h2>
            <ul className="mt-5 grid gap-3">
              {result.strengths.map((strength) => (
                <li
                  className="flex gap-3 rounded-2xl bg-[#f4fbf7] px-4 py-3 text-foreground-secondary leading-7"
                  key={strength}
                >
                  <MessageDots aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-positive" stroke={1.8} />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl sm:rounded-4xl bg-[#fff3f0] p-6 sm:p-8">
              <h2 className="font-black text-2xl">{ui.watchOutTitle}</h2>
              <p className="mt-4 text-foreground-secondary leading-8">{result.watchOut}</p>
            </article>
            <article className="rounded-3xl sm:rounded-4xl bg-[#eef7ff] p-6 sm:p-8">
              <h2 className="font-black text-2xl">{ui.dateMissionTitle}</h2>
              <p className="mt-4 text-foreground-secondary leading-8">{result.dateMission}</p>
            </article>
          </section>

          <p className="text-foreground-muted text-sm">{formatText(ui.privacyNotice, { count: answerCount })}</p>
        </div>
      </div>
    </section>
  )
}

function formatText(template: string, values: Record<string, number | string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
