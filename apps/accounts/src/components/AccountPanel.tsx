'use client'

import QRCode from 'qrcode'
import { type FormEvent, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

type TwoFactorSetup = {
  totpURI: string
  qrCode: string
  backupCodes: string[]
}

export function AccountPanel() {
  const { data: session, isPending: sessionPending, refetch } = authClient.useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [recentBackupCodes, setRecentBackupCodes] = useState<string[]>([])

  useEffect(() => {
    if (!sessionPending && !session) {
      window.location.replace('/sign-in')
    }
  }, [session, sessionPending])

  async function addPasskey() {
    setPending(true)
    setError('')
    setNotice('')
    const response = await authClient.passkey.addPasskey({ name: '내 패스키' })
    setPending(false)
    if (response.error) {
      setError(response.error.message || '패스키를 등록하지 못했어요.')
      return
    }
    setNotice('패스키를 등록했어요. 다음 로그인부터 사용할 수 있어요.')
  }

  async function beginTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    const response = await authClient.twoFactor.enable({ ...(password ? { password } : {}) })
    if (response.error) {
      setPending(false)
      setError(response.error.message || '2단계 인증 설정을 시작하지 못했어요.')
      return
    }
    const qrCode = await QRCode.toDataURL(response.data.totpURI, { margin: 1, width: 220 })
    setPending(false)
    setTwoFactorSetup({ ...response.data, qrCode })
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim()
    const response = await authClient.twoFactor.verifyTotp({ code })
    setPending(false)
    if (response.error) {
      setError(response.error.message || '인증 코드를 확인해 주세요.')
      return
    }
    setRecentBackupCodes(twoFactorSetup?.backupCodes ?? [])
    setTwoFactorSetup(null)
    setNotice('2단계 인증을 켰어요. 백업 코드는 안전한 곳에 보관해 주세요.')
    await refetch()
  }

  async function disableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    const response = await authClient.twoFactor.disable({ ...(password ? { password } : {}) })
    setPending(false)
    if (response.error) {
      setError(response.error.message || '2단계 인증을 끄지 못했어요.')
      return
    }
    setRecentBackupCodes([])
    setNotice('2단계 인증을 껐어요.')
    await refetch()
  }

  async function verifyAdult() {
    setPending(true)
    setError('')
    const response = await authClient.oauth2.link({ providerId: 'bbaton', callbackURL: '/account' })
    if (response.error) {
      setPending(false)
      setError(response.error.message || '성인 인증을 시작하지 못했어요.')
    }
  }

  async function signOut() {
    setPending(true)
    await authClient.signOut()
    window.location.replace('/sign-in')
  }

  if (sessionPending || !session) {
    return <p className="helper">계정을 불러오는 중…</p>
  }

  const user = session.user as typeof session.user & {
    isAdult?: boolean
    twoFactorEnabled?: boolean
    username?: string | null
  }

  return (
    <>
      <div className="title-block">
        <h1>{user.name}님의 소복 계정</h1>
        <p className="subtitle">로그인과 보안 수단은 여기에서 관리하고, 공개 닉네임은 각 앱에서 따로 정해요.</p>
      </div>

      <div className="stack">
        <div className="stack-tight">
          <div className="row-between">
            <span className="helper">전역 로그인 아이디</span>
            <strong>{user.username || '설정되지 않음'}</strong>
          </div>
          <div className="row-between">
            <span className="helper">이메일</span>
            <strong>{user.email}</strong>
          </div>
        </div>

        {!user.username && (
          <section className="section stack-tight">
            <div>
              <h2>전역 로그인 아이디를 정해 주세요</h2>
              <p className="helper">모든 Sobok 서비스에서 아이디·비밀번호 로그인에 함께 사용해요.</p>
            </div>
            <a className="button button-primary" href="/complete-profile">
              로그인 아이디 설정
            </a>
          </section>
        )}

        {error && <p className="message">{error}</p>}
        {notice && <p className="message message-success">{notice}</p>}

        <section className="section stack-tight">
          <div>
            <h2>패스키</h2>
            <p className="helper">기기의 생체 인증이나 화면 잠금으로 빠르고 안전하게 로그인해요.</p>
          </div>
          <button className="button button-secondary" disabled={pending} onClick={addPasskey} type="button">
            이 기기에 패스키 등록
          </button>
        </section>

        <section className="section stack">
          <div>
            <h2>2단계 인증</h2>
            <p className="helper">
              아이디·비밀번호 로그인에만 인증 앱 코드를 추가로 확인해요. Google, Kakao, 이메일 링크, 패스키 로그인에는
              중복 적용하지 않아요.
            </p>
          </div>
          {user.twoFactorEnabled ? (
            <div className="stack">
              <p className="message message-success">2단계 인증이 켜져 있어요.</p>
              {recentBackupCodes.length > 0 && (
                <div>
                  <p className="helper">아래 백업 코드는 지금 한 번만 확인할 수 있어요.</p>
                  <div className="code-box">{recentBackupCodes.join('\n')}</div>
                </div>
              )}
              <form className="stack-tight" onSubmit={disableTwoFactor}>
                <div className="field">
                  <label htmlFor="disable-two-factor-password">현재 비밀번호</label>
                  <input
                    id="disable-two-factor-password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                  />
                  <p className="helper">비밀번호가 없는 소셜 계정은 비워 두어도 돼요.</p>
                </div>
                <button className="button button-secondary" disabled={pending} type="submit">
                  2단계 인증 끄기
                </button>
              </form>
            </div>
          ) : twoFactorSetup ? (
            <div className="stack">
              {/* Better Auth generates the secret locally on the authority and only this one-time setup response exposes it. */}
              <img
                alt="인증 앱 등록 QR 코드"
                height={220}
                src={twoFactorSetup.qrCode}
                width={220}
                style={{ margin: '0 auto' }}
              />
              <p className="helper">QR 코드를 인증 앱으로 읽은 뒤, 표시되는 6자리 코드를 입력하세요.</p>
              <form className="stack-tight" onSubmit={verifyTwoFactor}>
                <div className="field">
                  <label htmlFor="totp-code">인증 코드</label>
                  <input
                    id="totp-code"
                    name="code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    required
                  />
                </div>
                <button className="button button-primary" disabled={pending} type="submit">
                  설정 완료
                </button>
              </form>
              <div>
                <p className="helper">아래 백업 코드는 지금 한 번만 확인할 수 있어요.</p>
                <div className="code-box">{twoFactorSetup.backupCodes.join('\n')}</div>
              </div>
            </div>
          ) : (
            <form className="stack-tight" onSubmit={beginTwoFactor}>
              <div className="field">
                <label htmlFor="two-factor-password">현재 비밀번호</label>
                <input id="two-factor-password" name="password" autoComplete="current-password" type="password" />
                <p className="helper">비밀번호가 없는 소셜 계정은 비워 두어도 돼요.</p>
              </div>
              <button className="button button-secondary" disabled={pending} type="submit">
                인증 앱 연결
              </button>
            </form>
          )}
        </section>

        <section className="section stack-tight">
          <div>
            <h2>성인 인증</h2>
            <p className="helper">
              BBaton은 필요한 서비스의 성인 여부 확인에만 연결하며 로그인 수단으로 사용하지 않아요.
            </p>
          </div>
          {user.isAdult ? (
            <p className="message message-success">성인 인증이 완료되어 있어요.</p>
          ) : (
            <button className="button button-secondary" disabled={pending} onClick={verifyAdult} type="button">
              BBaton으로 성인 인증
            </button>
          )}
        </section>

        <section className="section stack-tight">
          <button className="button button-secondary" disabled={pending} onClick={signOut} type="button">
            로그아웃
          </button>
        </section>
      </div>
    </>
  )
}
