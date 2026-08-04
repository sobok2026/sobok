'use client'

import type { Locale } from '@sobok/domain/locale'
import { useEffect, useState } from 'react'

import { stellaAuthClient } from '@/lib/auth-client'
import type { GuardianCheckoutSession, GuardianReportAccess } from '@/lib/guardian-paid'
import { readGuardianCheckoutSession } from '@/lib/guardian-paid'

const REPORT_PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/

export type GuardianReportAccessState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'account-required'; reportPublicId: string }
  | {
      kind: 'ready'
      access: GuardianReportAccess
      checkout: GuardianCheckoutSession | null
      source: 'guest' | 'account'
    }

/**
 * A guest continues through the tab-scoped capability. An account owner can instead open the stable report
 * URL from their library; the host-local Stella session then proves ownership without recreating guest access.
 */
export function useGuardianReportAccess(locale: Locale): GuardianReportAccessState {
  const { data: accountSession, isPending: accountPending } = stellaAuthClient.useSession()
  const [browserState, setBrowserState] = useState<
    { checkout: GuardianCheckoutSession | null; requestedReport: string | null } | undefined
  >()

  useEffect(() => {
    const parameter = new URLSearchParams(window.location.search).get('report')
    setBrowserState({
      checkout: readGuardianCheckoutSession(),
      requestedReport: parameter && REPORT_PUBLIC_ID_PATTERN.test(parameter) ? parameter : null,
    })
  }, [])

  if (!browserState) return { kind: 'loading' }

  const checkout = browserState.checkout?.locale === locale ? browserState.checkout : null
  const requestedReport = browserState.requestedReport
  if (!requestedReport) {
    return checkout ? { kind: 'ready', access: checkout, checkout, source: 'guest' } : { kind: 'missing' }
  }

  if (checkout?.reportPublicId === requestedReport) {
    return { kind: 'ready', access: checkout, checkout, source: 'guest' }
  }
  if (accountPending) return { kind: 'loading' }
  if (!accountSession) return { kind: 'account-required', reportPublicId: requestedReport }

  return {
    kind: 'ready',
    access: {
      locale,
      reportPublicId: requestedReport,
      email: accountSession.user.email,
    },
    checkout: null,
    source: 'account',
  }
}
