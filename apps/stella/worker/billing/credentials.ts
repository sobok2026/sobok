import type { Bindings } from '../env'
import type { PortOnePaymentCredentials } from './portone'

export async function guardianPortOnePaymentCredentials(env: Bindings): Promise<PortOnePaymentCredentials> {
  const apiSecret = await env.STELLA_PORTONE_API_SECRET.get()
  if (!apiSecret || !env.STELLA_PORTONE_STORE_ID) {
    throw new Error('Stella PortOne payment credentials are not configured')
  }
  return { apiSecret, storeId: env.STELLA_PORTONE_STORE_ID }
}

export async function guardianPortOneWebhookSecret(env: Bindings): Promise<string> {
  const secret = await env.STELLA_PORTONE_WEBHOOK_SECRET.get()
  if (!secret) {
    throw new Error('Stella PortOne webhook secret is not configured')
  }
  return secret
}
