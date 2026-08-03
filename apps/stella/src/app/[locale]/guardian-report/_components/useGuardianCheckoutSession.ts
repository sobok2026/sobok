'use client'

import type { Locale } from '@sobok/domain/locale'
import { useEffect, useState } from 'react'

import type { GuardianCheckoutSession } from '@/lib/guardian-paid'
import { readGuardianCheckoutSession } from '@/lib/guardian-paid'

export function useGuardianCheckoutSession(locale: Locale): GuardianCheckoutSession | null | undefined {
  const [session, setSession] = useState<GuardianCheckoutSession | null | undefined>(undefined)

  useEffect(() => {
    const stored = readGuardianCheckoutSession()
    setSession(stored?.locale === locale ? stored : null)
  }, [locale])

  return session
}
