'use client'

import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { authenticationReturnURL, pendingAuthorizationURL } from '@/lib/authorization-flow'
import { TurnstileField } from './TurnstileField'

function callbackURL(): string {
  return window.location.search ? `${window.location.pathname}${window.location.search}` : '/account'
}

export function SignUpPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [pending, setPending] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [signInHref, setSignInHref] = useState('/sign-in')
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    const authorizationURL = pendingAuthorizationURL()
    if (!sessionPending && session && authorizationURL) {
      window.location.replace(authorizationURL)
      return
    }
    setSignInHref(`/sign-in${window.location.search}`)
  }, [session, sessionPending])

  function resetChallenge() {
    setTurnstileToken('')
    turnstile.current?.reset()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!turnstileToken) {
      setError('보안 확인을 완료해 주세요.')
      return
    }

    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password') ?? '')
    if (password !== String(fields.get('password-confirm') ?? '')) {
      setError('비밀번호가 서로 같지 않아요.')
      return
    }

    setPending(true)
    const response = await authClient.signUp.email({
      name: String(fields.get('name') ?? '').trim(),
      username: String(fields.get('username') ?? '').trim(),
      displayUsername: String(fields.get('username') ?? '').trim(),
      email: String(fields.get('email') ?? '').trim(),
      password,
      callbackURL: authenticationReturnURL(),
      fetchOptions: { headers: { 'x-captcha-response': turnstileToken } },
    })
    setPending(false)
    resetChallenge()

    if (response.error) {
      setError(
        response.error.code === 'PASSWORD_COMPROMISED'
          ? '유출 이력이 있는 비밀번호예요. 다른 비밀번호를 사용해 주세요.'
          : response.error.message || '계정을 만들지 못했어요. 입력 내용을 다시 확인해 주세요.',
      )
      return
    }
    setNotice('확인 이메일을 보냈어요. 이메일을 확인하면 계정 만들기가 완료돼요.')
  }

  async function social(provider: 'google' | 'kakao') {
    setPending(true)
    setError('')
    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: callbackURL(),
      requestSignUp: true,
    })
    if (socialError) {
      setPending(false)
      setError(socialError.message || '계정 만들기를 시작하지 못했어요.')
    }
  }

  return (
    <>
      <div className="title-block">
        <h1>소복 계정 만들기</h1>
        <p className="subtitle">어느 Sobok 서비스에서도 같은 아이디로 로그인할 수 있어요.</p>
      </div>
      <div className="stack">
        <div className="social-grid">
          <button className="button button-secondary" disabled={pending} onClick={() => social('google')} type="button">
            Google로 시작
          </button>
          <button className="button button-secondary" disabled={pending} onClick={() => social('kakao')} type="button">
            Kakao로 시작
          </button>
        </div>
        <div className="divider">또는</div>
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="name">이름</label>
            <input id="name" name="name" autoComplete="name" maxLength={50} required />
            <p className="helper">계정 화면과 이메일에서 사용할 이름이에요. 앱별 공개 닉네임과는 달라요.</p>
          </div>
          <div className="field">
            <label htmlFor="username">전역 로그인 아이디</label>
            <input
              id="username"
              name="username"
              autoCapitalize="off"
              autoComplete="username"
              autoCorrect="off"
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_.]+"
              required
            />
            <p className="helper">영문, 숫자, 밑줄, 마침표만 사용할 수 있어요.</p>
          </div>
          <div className="field">
            <label htmlFor="signup-email">이메일</label>
            <input id="signup-email" name="email" autoComplete="email" maxLength={254} required type="email" />
          </div>
          <div className="field">
            <label htmlFor="signup-password">비밀번호</label>
            <input
              id="signup-password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              type="password"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-password-confirm">비밀번호 확인</label>
            <input
              id="signup-password-confirm"
              name="password-confirm"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              type="password"
            />
          </div>
          <TurnstileField instanceRef={turnstile} onToken={setTurnstileToken} />
          {error && <p className="message">{error}</p>}
          {notice && <p className="message message-success">{notice}</p>}
          <button className="button button-primary" disabled={pending || !turnstileToken} type="submit">
            {pending ? '만드는 중…' : '계정 만들기'}
          </button>
        </form>
      </div>
      <div className="center-links">
        <span>이미 계정이 있나요?</span>
        <a href={signInHref}>로그인</a>
      </div>
    </>
  )
}
