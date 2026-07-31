import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

type ReadingActionsProps = {
  /** Destination for the "create your own" link on shared views. */
  homeHref: string
  onShare: () => void
  /** Share button copy. */
  shareLabel: string
  /** Whether the privacy note renders under the share button. */
  showPrivacy: boolean
  /** Whether a shared view is showing (renders the "create your own" link instead). */
  shared: boolean
  /** Extra line under the actions on shared views (today's tomorrow teaser). */
  sharedFootnote?: ReactNode
}

/** The closing actions every reading page wears: share or, on a shared view, create your own. */
export function ReadingActions({
  homeHref,
  onShare,
  shareLabel,
  showPrivacy,
  shared,
  sharedFootnote,
}: ReadingActionsProps) {
  const ts = useTranslations('Shared')

  return (
    <div className="flex flex-col items-center gap-3 pt-1">
      {shared ? (
        <>
          <a
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
            href={homeHref}
          >
            {ts('createOwn')}
          </a>
          {sharedFootnote && <p className="mt-1 text-xs text-foreground-faint">{sharedFootnote}</p>}
        </>
      ) : (
        <>
          <button
            className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
            onClick={onShare}
            type="button"
          >
            {shareLabel}
          </button>
          {showPrivacy && (
            <p className="text-center text-[11px] leading-relaxed text-foreground-faint">{ts('privacy')}</p>
          )}
        </>
      )}
    </div>
  )
}
