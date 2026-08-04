'use client'

import Link from 'next/link'

type Props = {
  /** Renders a link when a destination is given, a button when the action stays on the page. */
  href?: string
  /** What is being priced. Truncates first, because a clipped word costs less than a clipped number. */
  note: string
  price: string
  onSelect: () => void
  cta: string
  visible: boolean
}

/**
 * The funnel's pinned call to action, for the stretch of page where the real one is off screen.
 *
 * An island rather than an edge-to-edge bar, for two reasons that point the same way.
 *
 * The first is iOS. Safari 26 tints its bottom "chin" from whatever `position: fixed` element sits within a
 * few pixels of the bottom edge, and a partly transparent one resolves to black under `color-scheme: dark` —
 * so a bar pinned to `bottom-0` and padded down through the safe area paints the chin a colour that does not
 * match the page. `BottomNav` already met this and solved it by offsetting through `bottom` instead of
 * padding, which keeps the element out of the sample zone entirely; this does the same. Two consequences
 * follow: the drop shadow may not reach past the island either (hence an upward-cast one whose downward
 * reach is 4px, inside the 8px gap), and the show/hide animation may not translate the fixed box back into
 * that zone — so it rides scale and opacity on the island instead.
 *
 * The second is that every floating thing on this site is already an island: the header pill, the bottom
 * nav. A full-bleed bar with a hard top rule was the only exception, and it cut the starfield with a
 * straight line. Wide rather than compact, though — this one asks for money, and it should carry the weight
 * of the button it stands in for.
 */
export default function GuardianStickyCta({ cta, href, note, onSelect, price, visible }: Props) {
  const button =
    'cta shrink-0 rounded-full bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-2.5 text-xs font-bold text-[#24142e]'

  return (
    <div
      aria-hidden={!visible}
      className="fixed inset-x-0 bottom-[max(0.5rem,var(--safe-area-bottom))] z-40 px-3 sm:hidden"
    >
      <div
        className={`mx-auto flex items-center gap-3 rounded-full border border-white/12 bg-[#0b0618]/92 py-2 pl-5 pr-2 shadow-[0_-6px_20px_rgba(2,0,12,0.55)] backdrop-blur-md transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none ${
          visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[11px]">
          <span className="truncate text-foreground-subtle">{note}</span>
          <span className="shrink-0 font-bold text-white">{price}</span>
        </p>
        {href ? (
          <Link className={button} href={href} onClick={onSelect} tabIndex={visible ? undefined : -1}>
            {cta}
          </Link>
        ) : (
          <button className={button} onClick={onSelect} tabIndex={visible ? undefined : -1} type="button">
            {cta}
          </button>
        )}
      </div>
    </div>
  )
}
