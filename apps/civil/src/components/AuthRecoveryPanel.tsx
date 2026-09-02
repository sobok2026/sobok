'use client'

import { useEffect, useRef, useState } from 'react'
import { civilAuthClient } from '@/lib/auth-client'
import {
  claimCivilAuthRecovery,
  clearCivilAuthRecovery,
  pendingCivilAuthReturnURL,
  startCivilSignIn,
} from '@/lib/auth-flow'

type RecoveryStatus = 'checking' | 'retrying' | 'failed'

export default function AuthRecoveryPanel() {
  const { data: session, isPending } = civilAuthClient.useSession()
  const started = useRef(false)
  const [status, setStatus] = useState<RecoveryStatus>('checking')
  const [errorCode, setErrorCode] = useState('')

  useEffect(() => {
    if (isPending || started.current) return
    started.current = true

    const returnURL = pendingCivilAuthReturnURL()
    const code = new URLSearchParams(window.location.search).get('error') ?? ''
    setErrorCode(code)

    if (session) {
      clearCivilAuthRecovery()
      window.location.replace(returnURL)
      return
    }

    if (code !== 'state_mismatch' || !claimCivilAuthRecovery()) {
      setStatus('failed')
      return
    }

    setStatus('retrying')
    void startCivilSignIn(returnURL, '/auth/error')
      .then((result) => {
        if (result.error) setStatus('failed')
      })
      .catch(() => setStatus('failed'))
  }, [isPending, session])

  async function retry() {
    setStatus('retrying')
    const result = await startCivilSignIn(pendingCivilAuthReturnURL(), '/auth/error').catch(() => null)
    if (!result || result.error) setStatus('failed')
  }

  const title = status === 'failed' ? '로그인을 완료하지 못했어요.' : 'Civil 로그인을 연결하고 있어요.'
  const description =
    status === 'checking'
      ? '현재 로그인 상태를 확인하고 있어요.'
      : status === 'retrying'
        ? '회원가입 중 만료된 연결을 새 요청으로 안전하게 이어가고 있어요.'
        : '회원가입은 완료되었을 수 있어요. 아래 버튼을 눌러 소복 계정과 Civil을 다시 연결해 주세요.'

  return (
    <section className="workspace-page">
      <div className="empty-panel workspace-route-error">
        <strong>{title}</strong>
        <p>{description}</p>
        {status === 'failed' ? (
          <button className="button button-dark" onClick={() => void retry()} type="button">
            소복 계정으로 다시 로그인
          </button>
        ) : null}
        {status === 'failed' && errorCode ? <p className="muted">오류 코드: {errorCode}</p> : null}
      </div>
    </section>
  )
}
