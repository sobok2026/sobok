/** Kicker label + body paragraph, the reading pages' basic unit; renders nothing without text. */
export default function Reading({ label, text }: { label: string; text: string }) {
  if (!text) {
    return null
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{text}</p>
    </div>
  )
}
