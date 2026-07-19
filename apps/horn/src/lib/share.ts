export type ShareOutcome = 'shared' | 'copied' | 'failed'

/** Web Share API where available, clipboard as the static-friendly fallback. */
export async function shareResult(opts: { title: string; text: string; url: string }): Promise<ShareOutcome> {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  if (nav?.share) {
    try {
      await nav.share({ title: opts.title, text: opts.text, url: opts.url })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'failed'
      // Otherwise fall through to clipboard.
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(`${opts.text} ${opts.url}`)
      return 'copied'
    } catch {
      // ignore
    }
  }
  return 'failed'
}
