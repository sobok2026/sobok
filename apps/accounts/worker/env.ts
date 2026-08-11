import type { SobokAuthorityEmail } from '@sobok/auth/authority'

export interface Bindings {
  HYPERDRIVE_FRESH: Hyperdrive
  ACCOUNTS_EMAIL_QUEUE: Queue<SobokAuthorityEmail>

  ACCOUNTS_AUTH_SECRET: SecretsStoreSecret
  ACCOUNTS_IP_HASH_SALT: SecretsStoreSecret
  ACCOUNTS_TURNSTILE_SECRET: SecretsStoreSecret
  ACCOUNTS_GOOGLE_CLIENT_SECRET: SecretsStoreSecret
  ACCOUNTS_KAKAO_CLIENT_SECRET: SecretsStoreSecret
  ACCOUNTS_BBATON_CLIENT_SECRET: SecretsStoreSecret
  ACCOUNTS_RESEND_API_KEY: SecretsStoreSecret

  ACCOUNTS_PUBLIC_ORIGIN: string
  ACCOUNTS_ALLOWED_HOSTNAMES: string
  ACCOUNTS_FIRST_PARTY_CLIENT_IDS: string
  ACCOUNTS_EMAIL_FROM: string
  ACCOUNTS_EMAIL_REPLY_TO: string
  ACCOUNTS_GOOGLE_CLIENT_ID: string
  ACCOUNTS_KAKAO_CLIENT_ID: string
  ACCOUNTS_BBATON_CLIENT_ID: string
}

export type AppEnv = { Bindings: Bindings }
