'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { SOBOK_AUTH_TURNSTILE_ACTION } from '@sobok/auth/contracts'
import type { RefObject } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/public-env'

export function TurnstileField({
  instanceRef,
  onToken,
}: {
  instanceRef: RefObject<TurnstileInstance | null>
  onToken: (token: string) => void
}) {
  return (
    <div className="turnstile-field">
      <Turnstile
        onError={() => onToken('')}
        onExpire={() => onToken('')}
        onSuccess={onToken}
        options={{ action: SOBOK_AUTH_TURNSTILE_ACTION, responseField: false, size: 'flexible' }}
        ref={instanceRef}
        siteKey={TURNSTILE_SITE_KEY}
      />
    </div>
  )
}
