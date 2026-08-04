'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

function isAuthorizationReturn(): boolean {
  return new URLSearchParams(window.location.search).has('sig')
}

export function CompleteProfilePanel() {
  const { data: session, isPending } = authClient.useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPending && !session) window.location.replace(`/sign-in${window.location.search}`)
  }, [isPending, session])

  async function continueAuthorization() {
    if (!isAuthorizationReturn()) {
      window.location.assign('/account')
      return
    }
    const continued = await authClient.oauth2.continue({ postLogin: true })
    if (continued.error || !continued.data.url) {
      throw new Error('OAuth authorization could not continue')
    }
    window.location.assign(continued.data.url)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const username = String(new FormData(event.currentTarget).get('username') ?? '').trim()
    const response = await authClient.updateUser({ username, displayUsername: username })
    if (response.error) {
      setPending(false)
      setError(response.error.message || '이 아이디를 사용할 수 없어요. 다른 아이디를 입력해 주세요.')
      return
    }
    try {
      await continueAuthorization()
    } catch {
      setPending(false)
      setError('로그인을 이어가지 못했어요. 잠시 뒤 다시 시도해 주세요.')
    }
  }

  async function finish() {
    setPending(true)
    setError('')
    try {
      await continueAuthorization()
    } catch {
      setPending(false)
      setError('로그인을 이어가지 못했어요. 잠시 뒤 다시 시도해 주세요.')
    }
  }

  if (isPending || !session) return <p className="helper">계정을 불러오는 중…</p>

  const user = session.user as typeof session.user & { username?: string | null }
  if (user.username) {
    return (
      <div className="stack">
        <div className="title-block">
          <h1>계정 준비가 끝났어요</h1>
          <p className="subtitle">전역 로그인 아이디는 {user.username}이에요.</p>
        </div>
        <button className="button button-primary" disabled={pending} onClick={finish} type="button">
          {pending ? '이어가는 중…' : '계속하기'}
        </button>
        {error && <p className="message">{error}</p>}
      </div>
    )
  }

  return (
    <>
      <div className="title-block">
        <h1>마지막으로 로그인 아이디를 정해 주세요</h1>
        <p className="subtitle">Stella·Vibe·ZWDS를 포함한 모든 Sobok 서비스에서 함께 사용할 아이디예요.</p>
      </div>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="complete-username">전역 로그인 아이디</label>
          <input
            autoCapitalize="off"
            autoComplete="username"
            autoCorrect="off"
            id="complete-username"
            maxLength={30}
            minLength={3}
            name="username"
            pattern="[A-Za-z0-9_.]+"
            required
          />
          <p className="helper">영문, 숫자, 밑줄, 마침표만 사용할 수 있어요. 공개 닉네임은 앱마다 따로 정해요.</p>
        </div>
        {error && <p className="message">{error}</p>}
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? '저장하는 중…' : '아이디 저장하고 계속하기'}
        </button>
      </form>
    </>
  )
}
