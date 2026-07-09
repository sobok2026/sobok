import type { ReactNode } from 'react'

export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}
