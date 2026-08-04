'use client'

import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { authenticationReturnURL, pendingAuthorizationURL } from '@/lib/authorization-flow'
import { TurnstileField } from './TurnstileField'

type SignInMode = 'password' | 'magic-link'

function currentCallbackURL(): string {
  return window.location.search ? `${window.location.pathname}${window.location.search}` : '/account'
}

function redirectFrom(data: unknown): void {
  if (data && typeof data === 'object' && 'url' in data && typeof data.url === 'string') {
    window.location.assign(data.url)
    return
  }
  window.location.assign('/account')
}

export function SignInPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [mode, setMode] = useState<SignInMode>('password')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [twoFactorStep, setTwoFactorStep] = useState(false)
  const [backupCode, setBackupCode] = useState(false)
  const [signUpHref, setSignUpHref] = useState('/sign-up')
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    const authorizationURL = pendingAuthorizationURL()
    if (!sessionPending && session && authorizationURL) {
      window.location.replace(authorizationURL)
      return
    }
    setSignUpHref(`/sign-up${window.location.search}`)
    if (sessionPending || session) return
    authClient
      .oneTap({
        callbackURL: authenticationReturnURL(),
        context: 'signin',
        autoSelect: false,
        cancelOnTapOutside: true,
      })
      .catch(() => undefined)
  }, [session, sessionPending])

  function resetChallenge() {
    setTurnstileToken('')
    turnstile.current?.reset()
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!turnstileToken) {
      setError('보안 확인을 완료해 주세요.')
      return
    }

    const fields = new FormData(event.currentTarget)
    const identifier = String(fields.get('identifier') ?? '').trim()
    const password = String(fields.get('password') ?? '')
    const rememberMe = fields.get('remember') === 'on'
    const fetchOptions = { headers: { 'x-captcha-response': turnstileToken } }

    setPending(true)
    const response = identifier.includes('@')
      ? await authClient.signIn.email({
          email: identifier,
          password,
          rememberMe,
          callbackURL: authenticationReturnURL(),
          fetchOptions,
        })
      : await authClient.signIn.username({
          username: identifier,
          password,
          rememberMe,
          callbackURL: authenticationReturnURL(),
          fetchOptions,
        })
    setPending(false)

    if (response.error) {
      setError(response.error.message || '로그인하지 못했어요. 입력 내용을 다시 확인해 주세요.')
      resetChallenge()
      return
    }
    if ('twoFactorRedirect' in response.data && response.data.twoFactorRedirect) {
      setTwoFactorStep(true)
      return
    }
    redirectFrom(response.data)
  }

  async function submitMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!turnstileToken) {
      setError('보안 확인을 완료해 주세요.')
      return
    }

    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    setPending(true)
    const { error: requestError } = await authClient.signIn.magicLink({
      email,
      callbackURL: authenticationReturnURL(),
      fetchOptions: { headers: { 'x-captcha-response': turnstileToken } },
    })
    setPending(false)
    resetChallenge()

    if (requestError) {
      setError(requestError.message || '로그인 링크를 보내지 못했어요.')
      return
    }
    setNotice('입력한 이메일로 로그인 링크를 보냈어요.')
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const code = String(form.get('code') ?? '').trim()
    setPending(true)
    setError('')
    const response = backupCode
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: form.get('trust') === 'on' })
    setPending(false)
    if (response.error) {
      setError(response.error.message || '인증 코드를 확인해 주세요.')
      return
    }
    redirectFrom(response.data)
  }

  async function social(provider: 'google' | 'kakao') {
    setPending(true)
    setError('')
    const { error: socialError } = await authClient.signIn.social({ provider, callbackURL: currentCallbackURL() })
    if (socialError) {
      setPending(false)
      setError(socialError.message || '로그인을 시작하지 못했어요.')
    }
  }

  async function passkey() {
    setPending(true)
    setError('')
    const response = await authClient.signIn.passkey()
    setPending(false)
    if (response.error) {
      setError(response.error.message || '패스키를 확인하지 못했어요.')
      return
    }
    redirectFrom(response.data)
  }

  if (twoFactorStep) {
    return (
      <>
        <div className="title-block">
          <h1>2단계 인증</h1>
          <p className="subtitle">
            {backupCode ? '보관해 둔 백업 코드를 입력해 주세요.' : '인증 앱의 6자리 코드를 입력해 주세요.'}
          </p>
        </div>
        <form className="stack" onSubmit={verifyTwoFactor}>
          <div className="field">
            <label htmlFor="two-factor-code">인증 코드</label>
            <input
              id="two-factor-code"
              name="code"
              autoComplete={backupCode ? 'off' : 'one-time-code'}
              autoFocus
              inputMode={backupCode ? 'text' : 'numeric'}
              required
            />
          </div>
          {!backupCode && (
            <label className="helper">
              <input name="trust" type="checkbox" /> 이 브라우저 기억하기
            </label>
          )}
          {error && <p className="message">{error}</p>}
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? '확인 중…' : '확인'}
          </button>
          <div className="row-between">
            <button className="button button-text" onClick={() => setBackupCode((value) => !value)} type="button">
              {backupCode ? '인증 앱 코드 사용' : '백업 코드 사용'}
            </button>
            <button
              className="button button-text"
              onClick={() => {
                setTwoFactorStep(false)
                resetChallenge()
              }}
              type="button"
            >
              취소
            </button>
          </div>
        </form>
      </>
    )
  }

  return (
    <>
      <div className="title-block">
        <h1>다시 만나서 반가워요</h1>
        <p className="subtitle">소복 계정으로 이어서 이용하세요.</p>
      </div>

      <div className="stack">
        <div className="social-grid">
          <button className="button button-secondary" disabled={pending} onClick={() => social('google')} type="button">
            Google
          </button>
          <button className="button button-secondary" disabled={pending} onClick={() => social('kakao')} type="button">
            Kakao
          </button>
        </div>
        <button className="button button-secondary" disabled={pending} onClick={passkey} type="button">
          패스키로 로그인
        </button>
        <div className="divider">또는</div>

        {mode === 'password' ? (
          <form className="stack" onSubmit={submitPassword}>
            <div className="field">
              <label htmlFor="identifier">이메일 또는 아이디</label>
              <input
                id="identifier"
                name="identifier"
                autoCapitalize="off"
                autoComplete="username webauthn"
                autoCorrect="off"
                maxLength={254}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                maxLength={64}
                required
                type="password"
              />
            </div>
            <div className="row-between helper">
              <label>
                <input defaultChecked name="remember" type="checkbox" /> 로그인 유지
              </label>
              <a href="/forgot-password">비밀번호 찾기</a>
            </div>
            <TurnstileField instanceRef={turnstile} onToken={setTurnstileToken} />
            {error && <p className="message">{error}</p>}
            {notice && <p className="message message-success">{notice}</p>}
            <button className="button button-primary" disabled={pending || !turnstileToken} type="submit">
              {pending ? '로그인 중…' : '로그인'}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={submitMagicLink}>
            <div className="field">
              <label htmlFor="magic-email">이메일</label>
              <input id="magic-email" name="email" autoComplete="email" required type="email" />
            </div>
            <TurnstileField instanceRef={turnstile} onToken={setTurnstileToken} />
            {error && <p className="message">{error}</p>}
            {notice && <p className="message message-success">{notice}</p>}
            <button className="button button-primary" disabled={pending || !turnstileToken} type="submit">
              {pending ? '보내는 중…' : '이메일로 로그인 링크 받기'}
            </button>
          </form>
        )}

        <button
          className="button button-text"
          onClick={() => {
            setMode((value) => (value === 'password' ? 'magic-link' : 'password'))
            setError('')
            setNotice('')
            resetChallenge()
          }}
          type="button"
        >
          {mode === 'password' ? '비밀번호 없이 이메일로 로그인' : '아이디·비밀번호로 로그인'}
        </button>
      </div>
      <div className="center-links">
        <span>처음이신가요?</span>
        <a href={signUpHref}>계정 만들기</a>
      </div>
    </>
  )
}
