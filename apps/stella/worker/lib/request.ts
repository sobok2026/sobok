type HeaderReader = { req: { header(name: string): string | undefined } }

export function clientIp(c: HeaderReader): string | null {
  return c.req.header('cf-connecting-ip') ?? null
}

export function bearerToken(c: HeaderReader): string | null {
  return c.req.header('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null
}
