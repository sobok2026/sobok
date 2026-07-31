'use client'

import { useEffect } from 'react'

type AnalyzingViewProps = {
  body: string
  onDone: () => void
  title: string
}

// A brief composed pause between the last answer and the report — long enough to feel like the three
// layers are being read together, short enough not to stall. onDone advances to the report.
export function AnalyzingView({ body, onDone, title }: AnalyzingViewProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1700)

    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent motion-reduce:animate-none"
        role="status"
      />
      <h1 className="mt-8 font-black text-2xl leading-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-page-ink-soft leading-7">{body}</p>
    </main>
  )
}
