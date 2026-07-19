import { cn } from '@/utils/cn'
import { interpolate } from '../_lib/template'
import type { DeepTypeContent, PersonaCode } from '../_lib/types'

type QuickIntroViewProps = {
  content: DeepTypeContent
  onStart: () => void
  outer: PersonaCode
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuickIntroView({ content, onStart, outer }: QuickIntroViewProps) {
  const tokens = { T: outer }

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl text-center">
        <h1 className="font-black text-2xl">{interpolate(content.ui.quickIntroTitle, tokens)}</h1>
        <p className="mt-4 text-page-ink/66 leading-7">{interpolate(content.ui.quickIntroBody, tokens)}</p>
        <button
          className={cn(
            'mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-page-accent px-8 font-black text-sm text-white transition-colors hover:bg-page-accent/92',
            focusClassName,
          )}
          onClick={onStart}
          type="button"
        >
          {content.ui.quickIntroCta}
        </button>
      </div>
    </main>
  )
}
