import { PAY_METHOD_SPEC, type PayMethod } from '@deep-type/pay-method'

import type { Bindings } from '~/env'

// Both hops a checkout needs — method → channel → key — so no handler performs one of them by hand.
//
// `undefined` means this deployment holds no key for that channel, which for a method the menu offered is a
// deploy mistake and not a buyer's. The caller has to answer for it before any row is written; see
// `checkout/POST`.
export function channelKeyFor(env: Bindings, method: PayMethod): string | undefined {
  return env.DEEPTYPE_PORTONE_CHANNELS[PAY_METHOD_SPEC[method].channel]
}
