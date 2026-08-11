import { PAY_METHOD_SPEC, type PayMethod } from '@deep-type/pay-method'
import type { CheckoutConfig } from '@sobok/payments'

import type { Bindings } from '@vibe-worker/env'

// Method policy stays in Vibe; the corresponding public Store/channel identifiers come from the central
// payment service so no app can drift onto a different PortOne configuration.
export function paymentConfigFor(env: Bindings, method: PayMethod): Promise<CheckoutConfig | null> {
  return env.VIBE_PAYMENTS.checkoutConfig(PAY_METHOD_SPEC[method].channel)
}
