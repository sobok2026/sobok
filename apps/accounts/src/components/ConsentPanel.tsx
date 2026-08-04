'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

type ClientSummary = {
  client_name?: string
  client_uri?: string
  logo_uri?: string
}

const scopeCopy: Record<string, { title: string; body: string }> = {
  openid: { title: '계정 식별', body: '이 서비스에서 같은 소복 계정임을 안전하게 확인합니다.' },
  profile: { title: '기본 프로필', body: '계정 이름과 전역 로그인 아이디를 확인합니다.' },
  email: { title: '이메일', body: '확인된 이메일 주소를 계정 연결과 복구에 사용합니다.' },
}

export function ConsentPanel() {
  const [client, setClient] = useState<ClientSummary | null>(null)
  const [scopes, setScopes] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const clientId = query.get('client_id')
    setScopes((query.get('scope') ?? '').split(' ').filter(Boolean))
    if (!clientId) {
      setError('연결 요청이 올바르지 않아요.')
      return
    }
    fetch(`/api/auth/oauth2/public-client?client_id=${encodeURIComponent(clientId)}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('client lookup failed')
        setClient((await response.json()) as ClientSummary)
      })
      .catch(() => setError('연결할 서비스를 확인하지 못했어요.'))
  }, [])

  async function decide(accept: boolean) {
    setPending(true)
    setError('')
    const response = await authClient.$fetch<{ redirect_uri: string }>('/oauth2/consent', {
      method: 'POST',
      body: { accept },
    })
    setPending(false)
    if (response.error || !response.data?.redirect_uri) {
      setError(response.error?.message || '연결 요청을 처리하지 못했어요.')
      return
    }
    window.location.assign(response.data.redirect_uri)
  }

  const clientName = client?.client_name || 'Sobok 서비스'

  return (
    <>
      <div className="title-block">
        <h1>{clientName}에 연결할까요?</h1>
        <p className="subtitle">현재 소복 계정으로 안전하게 로그인합니다.</p>
      </div>
      <ul className="scope-list">
        {scopes.map((scope) => {
          const item = scopeCopy[scope]
          if (!item) return null
          return (
            <li key={scope}>
              <strong>{item.title}</strong>
              <br />
              <span className="helper">{item.body}</span>
            </li>
          )
        })}
      </ul>
      {error && (
        <p className="message" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}
      <div className="stack-tight" style={{ marginTop: 20 }}>
        <button
          className="button button-primary"
          disabled={pending || !client}
          onClick={() => decide(true)}
          type="button"
        >
          {pending ? '연결 중…' : '동의하고 계속'}
        </button>
        <button
          className="button button-secondary"
          disabled={pending || !client}
          onClick={() => decide(false)}
          type="button"
        >
          취소
        </button>
      </div>
      <p className="helper" style={{ marginTop: 16 }}>
        비밀번호와 패스키는 연결하는 서비스에 공유되지 않아요.
      </p>
    </>
  )
}
