import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import { civilAuthClient } from './auth-client'

const AUTH_RETURN_URL_KEY = 'civil.auth.return-url'
const AUTH_RECOVERY_ATTEMPT_KEY = 'civil.auth.recovery-attempted'

function safeInternalURL(value: string): string {
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

function safeReturnURL(value: string): string {
  const url = safeInternalURL(value)
  return url.startsWith('/auth/error') ? '/' : url
}

export function currentCivilReturnURL(): string {
  return safeReturnURL(`${window.location.pathname}${window.location.search}${window.location.hash}`)
}

export function prepareCivilAuth(returnURL: string): string {
  const safeURL = safeReturnURL(returnURL)
  try {
    window.sessionStorage.setItem(AUTH_RETURN_URL_KEY, safeURL)
    window.sessionStorage.removeItem(AUTH_RECOVERY_ATTEMPT_KEY)
  } catch {
    // Some embedded browsers disable storage. The OAuth flow still works; only automatic recovery is skipped.
  }
  return safeURL
}

export function pendingCivilAuthReturnURL(): string {
  try {
    return safeReturnURL(window.sessionStorage.getItem(AUTH_RETURN_URL_KEY) ?? '/')
  } catch {
    return '/'
  }
}

export function claimCivilAuthRecovery(): boolean {
  try {
    if (window.sessionStorage.getItem(AUTH_RECOVERY_ATTEMPT_KEY) === '1') return false
    window.sessionStorage.setItem(AUTH_RECOVERY_ATTEMPT_KEY, '1')
    return true
  } catch {
    return false
  }
}

export function clearCivilAuthRecovery(): void {
  try {
    window.sessionStorage.removeItem(AUTH_RETURN_URL_KEY)
    window.sessionStorage.removeItem(AUTH_RECOVERY_ATTEMPT_KEY)
  } catch {
    // Storage is only a recovery aid, so an unavailable store needs no fallback cleanup.
  }
}

export function startCivilSignIn(returnURL: string, errorCallbackURL: string = returnURL) {
  return civilAuthClient.signIn.oauth2({
    providerId: SOBOK_OIDC_PROVIDER_ID,
    callbackURL: safeReturnURL(returnURL),
    errorCallbackURL: safeInternalURL(errorCallbackURL),
  })
}
