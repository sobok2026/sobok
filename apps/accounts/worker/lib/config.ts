import { SOBOK_AUTH_TURNSTILE_ACTION } from '@sobok/auth/contracts'
import type { Bindings } from '../env'

function commaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function absoluteOrigin(value: string): string {
  const url = new URL(value)
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('ACCOUNTS_PUBLIC_ORIGIN must contain only scheme and host')
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('ACCOUNTS_PUBLIC_ORIGIN must use HTTPS')
  }
  return url.origin
}

function required(value: string, name: string): string {
  if (!value.trim()) {
    throw new Error(`${name} is empty`)
  }
  return value
}

export function accountRuntimeConfig(env: Bindings) {
  const origin = absoluteOrigin(env.ACCOUNTS_PUBLIC_ORIGIN)
  const allowedHostnames = commaSeparated(env.ACCOUNTS_ALLOWED_HOSTNAMES)
  if (allowedHostnames.length === 0 || !allowedHostnames.includes(new URL(origin).hostname)) {
    throw new Error('ACCOUNTS_ALLOWED_HOSTNAMES must include the canonical account hostname')
  }

  return {
    origin,
    allowedHostnames,
    firstPartyClientIds: commaSeparated(env.ACCOUNTS_FIRST_PARTY_CLIENT_IDS),
    googleClientId: required(env.ACCOUNTS_GOOGLE_CLIENT_ID, 'ACCOUNTS_GOOGLE_CLIENT_ID'),
    kakaoClientId: required(env.ACCOUNTS_KAKAO_CLIENT_ID, 'ACCOUNTS_KAKAO_CLIENT_ID'),
    bbatonClientId: required(env.ACCOUNTS_BBATON_CLIENT_ID, 'ACCOUNTS_BBATON_CLIENT_ID'),
    turnstileAction: SOBOK_AUTH_TURNSTILE_ACTION,
  }
}
