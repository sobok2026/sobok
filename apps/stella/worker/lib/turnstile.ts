// Cloudflare Turnstile siteverify for the comment write paths (post + report) — the primary bot gate.
//
// Two checks beyond `success` that the shared-widget setup makes essential:
//  • hostname — the "sobok" widget covers every *.sobok.cc host, so a token solved on ANY sobok app would
//    otherwise be replayable here. We assert the solve happened on a stella host.
//  • action   — bound per endpoint ('comment_post' vs 'comment_report') so a token minted for one flow can't
//    be spent on the other.
// (Recommended follow-up: mint a stella-dedicated widget/sitekey instead of the shared one; this check works
// with either.)
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface VerifyOptions {
  allowedHostnames: readonly string[]
  expectedAction: string
}

interface SiteverifyResponse {
  success?: boolean
  hostname?: string
  action?: string
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
  opts: VerifyOptions,
): Promise<boolean> {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) {
    form.append('remoteip', ip)
  }

  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form })
    const data = (await res.json()) as SiteverifyResponse
    if (data.success !== true) {
      return false
    }
    if (data.hostname === undefined || !opts.allowedHostnames.includes(data.hostname)) {
      return false
    }
    return data.action === opts.expectedAction
  } catch {
    return false
  }
}
