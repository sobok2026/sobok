import type { CheckoutConfig } from '@sobok/payments'
import type { Bindings } from '~/env'
import { GUARDIAN_PAY_METHOD_SPEC, type GuardianPayMethod } from '~/guardian/pay-method'

export function guardianPaymentConfigFor(env: Bindings, method: GuardianPayMethod): Promise<CheckoutConfig | null> {
  return env.PAYMENTS.checkoutConfig(GUARDIAN_PAY_METHOD_SPEC[method].channel)
}
