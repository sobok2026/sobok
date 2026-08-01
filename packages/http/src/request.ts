type HeaderSource = Pick<Headers, 'get'>

export function getRequestIp(headers: HeaderSource): string {
  return (
    getHeaderValue(headers, 'CF-Connecting-IP') ||
    getHeaderValue(headers, 'x-real-ip') ||
    getForwardedIp(headers.get('x-forwarded-for')) ||
    'unknown'
  )
}

export function getRequestUserAgent(headers: HeaderSource): string {
  return getHeaderValue(headers, 'user-agent') || getHeaderValue(headers, 'sec-ch-ua') || 'unknown'
}

function getForwardedIp(value: string | null) {
  return value
    ?.split(',')
    .map((part) => part.trim())
    .find(Boolean)
}

function getHeaderValue(headers: HeaderSource, name: string) {
  const value = headers.get(name)?.trim()
  return value ? value : undefined
}
