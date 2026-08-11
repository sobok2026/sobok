import { constantTimeEqual } from 'better-auth/crypto'

export const SOBOK_OAUTH_CLIENT_SECRET_PREFIX = 'sobok_cs_'

export async function hashSobokOAuthClientSecret(clientSecret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientSecret))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

export async function verifySobokOAuthClientSecret(clientSecret: string, storedHash: string): Promise<boolean> {
  return constantTimeEqual(await hashSobokOAuthClientSecret(clientSecret), storedHash)
}
