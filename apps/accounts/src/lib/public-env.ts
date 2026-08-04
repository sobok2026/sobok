function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required at build time`)
  }
  return value
}

export const TURNSTILE_SITE_KEY = required(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY')

export const GOOGLE_CLIENT_ID = required(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, 'NEXT_PUBLIC_GOOGLE_CLIENT_ID')
