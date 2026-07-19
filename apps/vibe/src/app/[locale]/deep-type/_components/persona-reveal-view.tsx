import { cn } from '@/utils/cn'

import type { DeepTypeContent, PersonaCode } from '../_lib/types'

type PersonaRevealViewProps = {
  content: DeepTypeContent
  onContinue: () => void
  outer: PersonaCode
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function PersonaRevealView({ content, onContinue, outer }: PersonaRevealViewProps) {
  const base = content.base[outer]

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="text-page-ink/56 text-sm">Persona 간단 측정 완료</p>
        <p className="mt-3 font-black text-4xl text-page-accent">{outer}</p>
        <p className="mt-2 text-page-ink/66">
          {base.noun} · {base.ident}
        </p>
        <p className="mt-6 text-page-ink/66 leading-7">
          사람들 앞에서의 당신은 이렇게 측정됐어요. 이제 이 {outer} 기준으로, 혼자일 때의 Inner를 재요.
        </p>
        <button
          className={cn(
            'mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-page-accent px-8 font-black text-sm text-white transition-colors hover:bg-page-accent/92',
            focusClassName,
          )}
          onClick={onContinue}
          type="button"
        >
          Inner 측정 시작
        </button>
      </div>
    </main>
  )
}
