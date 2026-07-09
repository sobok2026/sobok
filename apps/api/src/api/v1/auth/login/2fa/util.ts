import { JWTType, signJWT } from '@sobok/auth/jwt'
import { CookieKey } from '@sobok/http/cookie'
import { sec } from '@sobok/std'

type SignTrustedBrowserTokenInput = {
  browserId: string
  fingerprint: string
  userId: number
}

export const TRUSTED_BROWSER_EXPIRY_DAYS = 30

export function getTrustedBrowserCookieConfig(token: string) {
  return {
    key: CookieKey.TRUSTED_BROWSER_TOKEN,
    value: token,
    options: {
      httpOnly: true,
      maxAge: sec(`${TRUSTED_BROWSER_EXPIRY_DAYS} days`),
      path: '/',
      sameSite: 'strict' as const,
      secure: true,
    },
  }
}

export async function signTrustedBrowserToken({ browserId, fingerprint, userId }: SignTrustedBrowserTokenInput) {
  return await signJWT({ sub: browserId, userId: String(userId), fingerprint }, JWTType.TRUSTED_BROWSER)
}
