'use client'

import { SOBOK_ACCOUNT_LABELS, SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import type { Locale } from '@sobok/domain/locale'
import { useState } from 'react'

import Starfield from '@/components/Starfield'
import { stellaAuthClient } from '@/lib/auth-client'

const COPY = {
  ko: {
    title: '소복 계정으로 보관한 리포트예요',
    body: '이 리포트를 보관한 계정으로 로그인하면 카드와 전체 내용을 다시 볼 수 있어요.',
    cta: '소복 계정으로 계속하기',
    loading: '계정 페이지를 여는 중…',
    error: '계정 페이지를 열지 못했어요. 잠시 뒤 다시 시도해주세요.',
  },
  en: { title: '', body: '', cta: '', loading: '', error: '' },
  ja: { title: '', body: '', cta: '', loading: '', error: '' },
  zh: { title: '', body: '', cta: '', loading: '', error: '' },
} as const

export default function GuardianAccountRequired({ locale }: { locale: Locale }) {
  const content = COPY[locale]
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setSubmitting(true)
    setError('')
    const callbackURL = `${window.location.pathname}${window.location.search}`
    const result = await stellaAuthClient.signIn.oauth2({
      providerId: SOBOK_OIDC_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: callbackURL,
    })
    if (result.error) {
      setError(content.error)
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />
      <section className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/90 p-6 text-center shadow-2xl sm:p-8">
        <span aria-hidden className="text-3xl text-pink-100">
          ✦
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">{content.title}</h1>
        <p className="mt-3 text-sm leading-7 text-foreground-muted">{content.body}</p>
        <button
          className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          disabled={submitting}
          onClick={signIn}
          type="button"
        >
          {submitting ? content.loading : content.cta || SOBOK_ACCOUNT_LABELS[locale]}
        </button>
        {error && (
          <p aria-live="polite" className="mt-3 text-xs leading-5 text-pink-200">
            {error}
          </p>
        )}
      </section>
    </main>
  )
}
