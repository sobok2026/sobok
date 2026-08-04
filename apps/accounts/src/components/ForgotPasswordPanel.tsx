'use client'

import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { type FormEvent, useRef, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { TurnstileField } from './TurnstileField'

export function ForgotPasswordPanel() {
  const [turnstileToken, setTurnstileToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const turnstile = useRef<TurnstileInstance>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!turnstileToken) return
    setPending(true)
    setError('')
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    const response = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
      fetchOptions: { headers: { 'x-captcha-response': turnstileToken } },
    })
    setPending(false)
    setTurnstileToken('')
    turnstile.current?.reset()
    if (response.error) {
      setError(response.error.message || '요청을 처리하지 못했어요.')
      return
    }
    setSent(true)
  }

  return (
    <>
      <div className="title-block">
        <h1>비밀번호 재설정</h1>
        <p className="subtitle">가입한 이메일로 안전한 재설정 링크를 보내드릴게요.</p>
      </div>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="recovery-email">이메일</label>
          <input id="recovery-email" name="email" autoComplete="email" required type="email" />
        </div>
        <TurnstileField instanceRef={turnstile} onToken={setTurnstileToken} />
        {error && <p className="message">{error}</p>}
        {sent && (
          <p className="message message-success">
            계정이 있다면 재설정 이메일을 보냈어요. 받은 편지함을 확인해 주세요.
          </p>
        )}
        <button className="button button-primary" disabled={pending || !turnstileToken} type="submit">
          {pending ? '보내는 중…' : '재설정 링크 받기'}
        </button>
      </form>
      <div className="center-links">
        <a href="/sign-in">로그인으로 돌아가기</a>
      </div>
    </>
  )
}
