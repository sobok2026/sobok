'use client'

import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import { useState } from 'react'
import { civilAuthClient } from '@/lib/auth-client'

export default function AccountControls() {
  const { data: session, isPending } = civilAuthClient.useSession()
  const [signingIn, setSigningIn] = useState(false)

  async function signIn() {
    setSigningIn(true)
    const returnURL = `${window.location.pathname}${window.location.search}`
    try {
      const result = await civilAuthClient.signIn.oauth2({
        providerId: SOBOK_OIDC_PROVIDER_ID,
        callbackURL: returnURL,
        errorCallbackURL: returnURL,
      })
      if (result.error) setSigningIn(false)
    } catch {
      setSigningIn(false)
    }
  }

  return (
    <div className="account-area">
      {session ? (
        <>
          <span className="account-name">{session.user.name}</span>
          <button className="button button-quiet" onClick={() => void civilAuthClient.signOut()} type="button">
            로그아웃
          </button>
        </>
      ) : (
        <button className="button button-dark" disabled={signingIn || isPending} onClick={signIn} type="button">
          {signingIn ? '계정으로 이동 중…' : '소복 계정으로 로그인'}
        </button>
      )}
    </div>
  )
}
