import { Sparkles } from '@mynaui/icons-react'

type MicroRevealProps = {
  body: string
  code: string
  template: string
  title: string
}

/**
 * The one interruption in the free run, and it interrupts nothing: it rides above the next question on the same
 * screen. A full-screen reveal here would be a fourth screen transition in a run whose whole design is that it
 * has none, and it would need a "continue" tap to leave — a tap that buys the reader nothing and costs the funnel
 * a step at exactly the halfway point where people quit.
 *
 * It fires once, where the four type letters are settled. `code` is those letters; the remaining fifteen items
 * cannot move them, so the sentence is a result and not a preview.
 */
export function MicroReveal({ body, code, template, title }: MicroRevealProps) {
  return (
    <aside className="mt-4 rounded-3xl border border-page-accent/35 bg-page-accent/8 p-5">
      <p className="flex items-center gap-2 font-black text-page-accent-strong text-xs">
        <Sparkles aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        {title}
      </p>
      <p className="mt-2 font-black text-lg leading-snug">{template.replace('{inner}', code)}</p>
      <p className="mt-1 text-page-ink-soft text-sm leading-6">{body}</p>
    </aside>
  )
}
