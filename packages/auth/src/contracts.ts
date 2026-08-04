export const SOBOK_ACCOUNT_TECHNICAL_NAME = 'Sobok'
export const SOBOK_AUTH_PATH = '/api/auth'
export const SOBOK_AUTH_TURNSTILE_ACTION = 'sobok-auth'
export const SOBOK_OIDC_PROVIDER_ID = 'sobok'
export const SOBOK_OIDC_SCOPES = ['openid', 'profile', 'email'] as const
export const SOBOK_USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/

export const SOBOK_ACCOUNT_LABELS = {
  ko: '소복 계정',
  en: 'Sobok Account',
  ja: 'Sobokアカウント',
  zh: 'Sobok 账号',
} as const

export type SobokAccountLocale = keyof typeof SOBOK_ACCOUNT_LABELS

export type SobokIdentity = {
  issuer: string
  subject: string
}

export function normalizeIssuer(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('Sobok OIDC issuer must use HTTPS')
  }
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

export function sobokDiscoveryUrl(issuer: string): string {
  return `${normalizeIssuer(issuer)}/.well-known/openid-configuration`
}
