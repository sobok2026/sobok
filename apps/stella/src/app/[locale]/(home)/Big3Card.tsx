'use client'

import { isAstrologyGlyph } from '@/chart/astrology-glyph-paths'
import AstroGlyph from '@/components/AstroGlyph'
import styles from '@/components/card.module.css'

export interface Big3CardProps {
  delay: number
  glyph: string
  hint: string
  label: string
  onClick?: () => void
  value: string
}

/** One of the Sun / Moon / Rising summary cards above the wheel. */
export default function Big3Card({ delay, glyph, hint, label, onClick, value }: Big3CardProps) {
  return (
    <button
      className={`${styles.card} flex flex-col items-center gap-1 rounded-2xl border bg-surface-2 p-2.5 text-center backdrop-blur transition enabled:hover:border-border-strong enabled:hover:bg-surface-3 enabled:active:scale-95 motion-reduce:enabled:active:scale-100 disabled:cursor-default sm:p-3`}
      disabled={!onClick}
      onClick={onClick}
      style={{ animationDelay: `${delay}s` }}
      type="button"
    >
      <span className="text-lg text-brand">{isAstrologyGlyph(glyph) ? <AstroGlyph glyph={glyph} /> : glyph}</span>
      <span className="text-[10px] uppercase tracking-widest text-foreground-subtle">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="break-keep text-[10px] leading-tight text-foreground-faint wrap-anywhere">{hint}</span>
    </button>
  )
}
