'use client'

import { useEffect, useRef } from 'react'

import { TURNSTILE_SITE_KEY } from '@/constants'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// Renders the Cloudflare Turnstile widget and hands the solved token up via onVerify. Pass a STABLE
// onVerify (e.g. a useState setter) so the widget isn't re-rendered every parent render.
//
// Turnstile tokens are SINGLE-USE (the server consumes one per /checkout). Bump `resetSignal` after a
// consumed-token attempt (payment cancel/fail) to re-challenge the widget and emit a fresh token via
// onVerify — otherwise a retry re-sends the spent token and the server rejects it.
export function Turnstile({ onVerify, resetSignal = 0 }: { onVerify: (token: string) => void; resetSignal?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    function render() {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        callback: onVerify,
        sitekey: TURNSTILE_SITE_KEY,
      })
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
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [onVerify])

  // Re-challenge on demand (skips the initial 0). reset() issues a fresh token through onVerify.
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  return <div className="mt-4 flex justify-center" ref={containerRef} />
}
