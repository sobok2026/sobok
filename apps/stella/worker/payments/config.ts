import type { CheckoutConfig } from '@sobok/payments'
import type { Bindings } from '@stella-worker/env'
import { GUARDIAN_PAY_METHOD_SPEC, type GuardianPayMethod } from '@stella-worker/guardian/pay-method'

export function guardianPaymentConfigFor(env: Bindings, method: GuardianPayMethod): Promise<CheckoutConfig | null> {
  return env.STELLA_PAYMENTS.checkoutConfig(GUARDIAN_PAY_METHOD_SPEC[method].channel)
}
