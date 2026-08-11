const encoder = new TextEncoder()

function clientNetwork(ip: string): string | null {
  const value = ip.trim()
  if (!value || value.includes(',') || value.includes('%')) return null

  if (!value.includes(':')) {
    const octets = value.split('.')
    if (octets.length !== 4) return null
    const normalized = octets.map((octet) => {
      if (!/^\d{1,3}$/.test(octet)) return null
      const parsed = Number(octet)
      return Number.isInteger(parsed) && parsed >= 0 && parsed <= 255 ? String(parsed) : null
    })
    return normalized.every((octet): octet is string => octet !== null) ? normalized.join('.') : null
  }

  if (!/^[0-9a-f:]+$/i.test(value)) return null
  const halves = value.toLowerCase().split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves[1] ? halves[1].split(':') : []
  if (![...head, ...tail].every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null

  const compressed = halves.length === 2
  if ((!compressed && head.length !== 8) || (compressed && head.length + tail.length >= 8)) return null
  const groups = compressed ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head
  return `${groups
    .slice(0, 4)
    .map((group) => group.padStart(4, '0'))
    .join(':')}::/64`
}

async function clientNetworkDigest(ip: string, salt: string, purpose: string): Promise<Uint8Array | null> {
  const network = clientNetwork(ip)
  if (!network) return null
  if (!salt || !purpose) throw new Error('IP pseudonymization requires a salt and purpose')

  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${purpose}\0${network}`))
  return new Uint8Array(signature)
}

/** Stable, purpose-separated HMAC for abuse controls. The source address itself is never persisted. */
export async function hashClientIp(ip: string | null, salt: string, purpose: string): Promise<string | null> {
  if (!ip) return null
  const digest = await clientNetworkDigest(ip, salt, purpose)
  return digest ? [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('') : null
}

function digestAsPrivateIpv6(digest: Uint8Array): string {
  const bytes = digest.slice(0, 16)
  bytes[0] = 0xfd
  const groups: string[] = []
  for (let index = 0; index < bytes.length; index += 2) {
    groups.push(((bytes[index] ?? 0) * 256 + (bytes[index + 1] ?? 0)).toString(16))
  }
  return groups.join(':')
}

/**
 * Replaces any client-supplied internal header with a valid, HMAC-derived ULA address. Better Auth can then
 * use its standard IP limiter and session metadata without receiving or storing the Cloudflare source IP.
 */
export async function withPseudonymousClientIp(
  request: Request,
  salt: string,
  internalHeader: string,
): Promise<Request> {
  const headers = new Headers(request.headers)
  headers.delete(internalHeader)

  const url = new URL(request.url)
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  const sourceIp = request.headers.get('cf-connecting-ip') ?? (local ? '127.0.0.1' : null)
  const digest = sourceIp ? await clientNetworkDigest(sourceIp, salt, 'sobok-auth-client-ip-v1') : null
  if (!digest) throw new Error('A trusted Cloudflare client IP is required for authentication')

  headers.set(internalHeader, digestAsPrivateIpv6(digest))
  return new Request(request, { headers })
}
