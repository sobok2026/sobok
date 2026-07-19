'use client'

import { useState } from 'react'
import { cn } from '@/utils/cn'

import type { DeepTypeContent } from '../_lib/types'

type PersonaClaimViewProps = {
  content: DeepTypeContent
  onMeasure: () => void
  onSubmit: (code: string) => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

const LETTER_PAIRS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const satisfies readonly (readonly [string, string])[]

export function PersonaClaimView({ content, onMeasure, onSubmit }: PersonaClaimViewProps) {
  const [selected, setSelected] = useState<Partial<Record<number, string>>>({})

  const isComplete = Object.keys(selected).length === 4

  function pick(row: number, letter: string) {
    setSelected((current) => ({ ...current, [row]: letter }))
  }

  function submit() {
    if (!isComplete) {
      return
    }

    const code = [0, 1, 2, 3].map((row) => selected[row]).join('')
    onSubmit(code)
  }

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-center font-black text-2xl">{content.ui.claimTitle}</h1>
        <p className="mt-3 text-center text-page-ink/66 leading-7">{content.ui.claimSubtitle}</p>

        <div className="mt-8 grid gap-4">
          {LETTER_PAIRS.map((pair, row) => (
            <div className="flex justify-center gap-3" key={pair.join('')}>
              {pair.map((letter) => (
                <button
                  className={cn(
                    'flex h-16 w-20 items-center justify-center rounded-2xl border font-black text-xl transition-colors',
                    selected[row] === letter
                      ? 'border-page-accent bg-page-accent text-white'
                      : 'border-page-border bg-white text-page-ink hover:border-page-accent/50',
                    focusClassName,
                  )}
                  key={letter}
                  onClick={() => pick(row, letter)}
                  type="button"
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          className={cn(
            'mt-8 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors enabled:hover:bg-page-ink/92 disabled:cursor-not-allowed disabled:opacity-45',
            focusClassName,
          )}
          disabled={!isComplete}
          onClick={submit}
          type="button"
        >
          이게 내가 아는 나예요
        </button>
        <button
          className={cn(
            'mt-3 inline-flex min-h-13 w-full items-center justify-center rounded-full border border-page-border bg-white px-6 font-bold text-page-ink/66 text-sm transition-colors hover:text-page-ink',
            focusClassName,
          )}
          onClick={onMeasure}
          type="button"
        >
          잘 모르겠어요, 측정해 볼래요
        </button>
      </div>
    </main>
  )
}
