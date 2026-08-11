import { hashClientIp } from '@sobok/edge/ip'

export async function hashIp(ip: string | null, salt: string): Promise<string | null> {
  return hashClientIp(ip, salt, 'stella-abuse-controls-v1')
}
