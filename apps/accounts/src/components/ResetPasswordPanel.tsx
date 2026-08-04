'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function ResetPasswordPanel() {
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '')
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password') ?? '')
    if (password !== String(fields.get('password-confirm') ?? '')) {
      setError('비밀번호가 서로 같지 않아요.')
      return
    }
    if (!token) {
      setError('재설정 링크가 올바르지 않거나 만료되었어요.')
      return
    }
    setPending(true)
    const response = await authClient.resetPassword({ newPassword: password, token })
    setPending(false)
    if (response.error) {
      setError(
        response.error.code === 'PASSWORD_COMPROMISED'
          ? '유출 이력이 있는 비밀번호예요. 다른 비밀번호를 사용해 주세요.'
          : response.error.message || '비밀번호를 재설정하지 못했어요.',
      )
      return
    }
    setComplete(true)
  }

  if (complete) {
    return (
      <div className="stack">
        <div className="title-block">
          <h1>비밀번호를 바꿨어요</h1>
          <p className="subtitle">새 비밀번호로 로그인할 수 있어요.</p>
        </div>
        <a className="button button-primary button-link" href="/sign-in">
          로그인
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="title-block">
        <h1>새 비밀번호 정하기</h1>
        <p className="subtitle">다른 곳에서 사용하지 않는 비밀번호를 권장해요.</p>
      </div>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="new-password">새 비밀번호</label>
          <input
            id="new-password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={64}
            required
            type="password"
          />
        </div>
        <div className="field">
          <label htmlFor="new-password-confirm">새 비밀번호 확인</label>
          <input
            id="new-password-confirm"
            name="password-confirm"
            autoComplete="new-password"
            minLength={8}
            maxLength={64}
            required
            type="password"
          />
        </div>
        {error && <p className="message">{error}</p>}
        <button className="button button-primary" disabled={pending || !token} type="submit">
          {pending ? '바꾸는 중…' : '비밀번호 바꾸기'}
        </button>
      </form>
    </>
  )
}
