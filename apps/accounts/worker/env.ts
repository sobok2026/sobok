import type { SobokAuthorityEmail } from '@sobok/auth/authority'

type AccountEmailBinding = {
  ACCOUNTS_EMAIL_QUEUE: Queue<SobokAuthorityEmail>
}

// Wrangler owns the binding surface. Only the Queue payload is refined from its generated `unknown` body.
export type Bindings = Omit<CloudflareBindings, keyof AccountEmailBinding> & AccountEmailBinding

export type AppEnv = { Bindings: Bindings }
