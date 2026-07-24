// Pseudonymous IP hashing for rate-limit + report-dedup (가명정보, PIPA). The raw IP is NEVER stored.
//
// Two deliberate choices the abuse model depends on:
//  1. The salt is STATIC per purpose (a single Secrets Store value), NOT rotating — every anti-abuse
//     control (fixed-window rate limit, one-report-per-reporter dedup) needs the hash to be stable for a
//     given network. It is minimized instead by NULLing ipHash columns after 90 days (retention cron).
//  2. The IP is normalized to its NETWORK before hashing, so a single actor can't mint unbounded distinct
//     hashes: IPv6 → /64 prefix (the smallest block reliably assigned to one subscriber), IPv4 → the full
//     /32. Without this an IPv6 /64 holder gets 2^64 identities and defeats every per-ipHash limit.
//
// The source IP is Cloudflare's `CF-Connecting-IP` (set by the edge, not spoofable by the client) — never
// the client-supplied X-Forwarded-For.
function networkOf(ip: string): string {
  if (!ip.includes(':')) {
    return ip // IPv4 → /32 (the address itself)
  }

  // IPv6 → /64: expand a single "::" run, then keep the first four hextets.
  const [head, tail = ''] = ip.split('::')
  const headGroups = head ? head.split(':') : []
  const tailGroups = tail ? tail.split(':') : []
  const missing = Math.max(0, 8 - headGroups.length - tailGroups.length)
  const full = [...headGroups, ...Array(missing).fill('0'), ...tailGroups]
  return `${full
    .slice(0, 4)
    .map((group) => (group || '0').padStart(4, '0'))
    .join(':')}::/64`
}

export async function hashIp(ip: string | null, salt: string): Promise<string | null> {
  if (!ip || !salt) {
    return null
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(networkOf(ip)))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
