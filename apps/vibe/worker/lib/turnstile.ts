// Cloudflare Turnstile verification for the paid checkout submit — keeps bots from minting pending
// purchases / probing the funnel. Server-side siteverify; the token is single-use.
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) {
    form.append('remoteip', ip)
  }

  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
