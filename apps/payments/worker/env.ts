import type { PaymentEvent, PaymentScope } from '@sobok/payments'

export interface PortOneChannelConfig {
  channelKey: string
  mode: 'live' | 'test'
  scopes: PaymentScope[]
}

export interface Bindings {
  PORTONE_STORE_ID: string
  PORTONE_CHANNELS: Record<string, PortOneChannelConfig>
  CORE_PAYMENT_EVENTS_URL: string

  PORTONE_API_SECRET: SecretsStoreSecret
  PORTONE_WEBHOOK_SECRET: SecretsStoreSecret
  PAYMENTS_CORE_CLIENT_TOKEN: SecretsStoreSecret
  CORE_PAYMENT_EVENTS_TOKEN: SecretsStoreSecret

  STELLA_PAYMENT_EVENTS: Queue<PaymentEvent>
  VIBE_PAYMENT_EVENTS: Queue<PaymentEvent>
  CORE_PAYMENT_EVENTS: Queue<PaymentEvent>
}

export type AppEnv = { Bindings: Bindings }
