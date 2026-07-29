'use client'

import type { PersonaCode } from '@deep-type/model'
import { SELF_IMAGE_AXES, type SelfImagePick, selfImageCode } from '@deep-type/self-image'
import { useState } from 'react'

import type { DeepTypeSelfImageContent, DeepTypeUiText } from '../_lib/types'
import { QuizView } from './quiz-view'

type SelfImageViewProps = {
  content: DeepTypeSelfImageContent
  onDone: (code: PersonaCode) => void
  ui: DeepTypeUiText
}

/**
 * The branch for someone who does not know their four letters, so that '모르겠어요' stops being a dead end. Four
 * binary questions, one per type axis, and the answers concatenate into a code the rest of the run treats
 * exactly like a typed one.
 *
 * Every prompt asks what the reader believes about themselves rather than what they did — see `self-image.ts`
 * for why that line matters. Nothing here is scored and nothing here reaches the instrument.
 *
 * It renders through `QuizView` rather than its own markup. This sits between the picker and a 27-item run in
 * the same sitting, so it has to feel like the same screen: same progress rail, same card, same back button. A
 * lookalike built beside it would have been identical on the day it shipped and drifted on the next edit.
 */
export function SelfImageView({ content, onDone, ui }: SelfImageViewProps) {
  const [picks, setPicks] = useState<readonly SelfImagePick[]>([])
  const index = picks.length
  const item = content.items[index]

  function answer(optionIndex: number) {
    const next = [...picks, optionIndex as SelfImagePick]

    if (next.length === SELF_IMAGE_AXES.length) {
      onDone(selfImageCode(next))
      return
    }

    setPicks(next)
  }

  if (!item) {
    return null
  }

  return (
    <QuizView
      backLabel={ui.backCta}
      // Why these four questions are being asked, said once and then out of the way. Repeating it on every
      // screen would push the question itself below the fold on a phone.
      banner={
        index === 0 ? (
          <div className="mt-6 rounded-3xl bg-page-soft px-5 py-4">
            <p className="break-keep font-black">{content.title}</p>
            <p className="mt-1 break-keep text-page-ink/62 text-sm leading-6">{content.body}</p>
          </div>
        ) : undefined
      }
      key={index}
      onAnswer={answer}
      onBack={index > 0 ? () => setPicks(picks.slice(0, -1)) : undefined}
      progress={{ answered: index, segments: [{ count: content.items.length, label: content.segmentLabel }] }}
      question={item}
    />
  )
}
