import { PAY_METHOD_SPEC, type PayMethod } from '@deep-type/pay-method'

import type { Bindings } from '~/env'

// Both hops a checkout needs — method → channel → key — so no handler performs one of them by hand.
export function channelKeyFor(env: Bindings, method: PayMethod): string {
  return env.DEEPTYPE_PORTONE_CHANNELS[PAY_METHOD_SPEC[method].channel]
}
