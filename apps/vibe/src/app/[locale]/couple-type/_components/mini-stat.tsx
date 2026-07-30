/**
 * The one-number card the landing and the quiz's side panel both show. Extracted when the landing appeared,
 * because the alternative was two copies that look the same until someone edits one of them.
 */
export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-page-border bg-page-surface p-5 shadow-[0_18px_55px_rgba(36,22,23,0.07)]">
      <p className="font-bold text-page-ink/48 text-sm">{label}</p>
      <p className="mt-2 font-black text-2xl">{value}</p>
    </div>
  )
}
