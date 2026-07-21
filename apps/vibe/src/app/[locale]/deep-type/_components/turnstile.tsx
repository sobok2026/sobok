'use client'

import { useEffect, useRef } from 'react'

// Public sitekey for the shared "sobok" Turnstile widget. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY at build for
// prod (the account-turnstile `turnstile_sitekey` output); the default is Cloudflare's always-pass test key.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// Renders the Cloudflare Turnstile widget and hands the solved token up via onVerify. Pass a STABLE
// onVerify (e.g. a useState setter) so the widget isn't re-rendered every parent render.
export function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false

    function render() {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return
      }
      widgetId = window.turnstile.render(containerRef.current, { callback: onVerify, sitekey: SITE_KEY })
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
      if (existing) {
        existing.addEventListener('load', render)
      } else {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.dataset.turnstile = 'true'
        script.addEventListener('load', render)
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [onVerify])

  return <div className="mt-4 flex justify-center" ref={containerRef} />
}
