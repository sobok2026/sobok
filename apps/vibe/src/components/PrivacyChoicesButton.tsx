'use client'

import type { Locale } from '@sobok/domain/locale'

import { PRIVACY_CHOICES_LABEL } from '@/content/privacy-choices'

type GoogleFundingChoices = {
  callbackQueue?: Array<() => void>
  showRevocationMessage?: () => void
}

declare global {
  interface Window {
    googlefc?: GoogleFundingChoices
  }
}

export default function PrivacyChoicesButton({ locale }: { locale: Locale }) {
  function openChoices() {
    const googlefc = window.googlefc
    if (googlefc?.showRevocationMessage) {
      googlefc.callbackQueue ??= []
      googlefc.callbackQueue.push(googlefc.showRevocationMessage)
      return
    }

    window.location.assign(`/${locale}/privacy#cookies-and-advertising`)
  }

  return (
    <button className="hover:text-page-ink" onClick={openChoices} type="button">
      {PRIVACY_CHOICES_LABEL[locale]}
    </button>
  )
}
