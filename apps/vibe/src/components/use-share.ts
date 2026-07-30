'use client'

import { useState } from 'react'

/**
 * Web Share with a clipboard fallback, and the feedback line the fallback needs.
 *
 * Three screens had this verbatim — the free result, the paid report and 결타레's result — including the same
 * `AbortError` branch and the same swallowed clipboard failure. The AbortError check is the part that must not
 * drift: `navigator.share` rejects when the user dismisses the sheet, and treating that as a failure copies to
 * the clipboard behind their back and tells them it worked.
 *
 * `copiedMessage` is what the caller wants shown after a clipboard write; nothing is shown after a successful
 * share sheet, because the sheet is its own confirmation.
 */
export function useShare({ copiedMessage }: { copiedMessage: string }) {
  const [feedback, setFeedback] = useState('')

  /**
   * `copy` is what the clipboard gets when there is no share sheet, and it is separate from `text` because the
   * two screens want different things there: the result screens copy the sentence plus the brand, while 결타레
   * copies the deep link that carries the result. `url` defaults to the current page.
   */
  async function share({ copy, text, title, url }: { copy?: string; text: string; title: string; url?: string }) {
    const target = url ?? window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ text, title, url: target })
        return
      } catch (error) {
        // Dismissing the sheet is not a failure, so it must not fall through to the clipboard.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(copy ?? text)
      setFeedback(copiedMessage)
    } catch {
      // Older/in-app browsers may expose neither a share sheet nor clipboard access.
    }
  }

  return { feedback, share }
}
