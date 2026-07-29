/**
 * The payment-method catalogue: what a buyer may pay with, what each one is made of, and which locales are
 * offered it.
 *
 * Two vocabularies meet here and the whole point of this module is that they stay apart:
 *
 *   • a PAY METHOD is what the buyer picks and what our copy names — 카드, 카카오페이, 토스페이.
 *   • a CHANNEL is a PortOne contract with one PG. It is what a channel key identifies, and one channel can
 *     serve several PortOne `payMethod` values: the `tosspayments` channel would take VIRTUAL_ACCOUNT on the
 *     same key it takes CARD on, and it already backs two of our methods depending on the locale.
 *
 * Adding a method is one row in `PAY_METHOD_SPEC`, one entry per locale below, one key in the
 * `DEEPTYPE_PORTONE_CHANNELS` var of each wrangler environment, one label per locale in `_content`, and — only
 * if the PG requires one — one line in the bypass table in `use-checkout`. Nothing else: no binding, no
 * resolver, no branch.
 *
 * Why the buyer picks at all: PortOne V2 has no window that spans channels — `loadPaymentUI` covers PayPal SPB
 * alone — so the paywall asks first and `/checkout` hands back the single key that choice earned.
 *
 * The catalogue is source and not configuration on purpose. The menu changes when we deploy, never between
 * two requests, so a deployment-time constant is the honest shape and both halves of the app read the same
 * one. It lives in `deep-type/` rather than under `src/` because the Worker enforces it and the paywall
 * renders it: two copies would let the screen offer a method the server refuses, or — the direction that
 * actually matters — let a caller pick a channel the locale was never offered.
 *
 * Typed structurally rather than against `Locale`: this module is compiled into the Worker, whose tsconfig
 * maps only `@deep-type/*` and `~/*`, so `@sobok/domain/locale` does not resolve there (same as `offer.ts`).
 */
/**
 * A tuple and not a union, so the wire schema in `/checkout` can be `z.enum(PAY_METHODS)` instead of restating
 * the list. One declaration, and a method added below cannot be missing from validation.
 */
export const PAY_METHODS = ['card', 'kakaopay', 'mobile', 'tosspay', 'transfer'] as const

export type PayMethod = (typeof PAY_METHODS)[number]

/**
 * PortOne's own pgProvider identifiers, verbatim. The console prints these under `PG Provider`, the browser
 * SDK keys `bypass` by them, and `DEEPTYPE_PORTONE_CHANNELS` is keyed by them — one spelling for one thing, so
 * a channel key can never be traced to the wrong contract.
 */
export type PortOneChannel = 'kakaopay' | 'kcp_v2' | 'tosspay_v2' | 'tosspayments'

export type PayMethodSpec = {
  channel: PortOneChannel
  /** The `payMethod` the browser SDK is called with. 간편결제 channels all take `EASY_PAY`. */
  sdkPayMethod: 'CARD' | 'EASY_PAY' | 'MOBILE' | 'TRANSFER'
}

// `kcp_v2` backing two rows is the shape this table exists for: NHN KCP is a full PG and one channel key
// serves 계좌이체 and 휴대폰 소액결제 both. Card stays on `tosspayments`, which is a separate contract — the
// choice of which PG takes cards is a settlement decision and lives here, not in any branch.
export const PAY_METHOD_SPEC = {
  card: { channel: 'tosspayments', sdkPayMethod: 'CARD' },
  kakaopay: { channel: 'kakaopay', sdkPayMethod: 'EASY_PAY' },
  mobile: { channel: 'kcp_v2', sdkPayMethod: 'MOBILE' },
  tosspay: { channel: 'tosspay_v2', sdkPayMethod: 'EASY_PAY' },
  transfer: { channel: 'kcp_v2', sdkPayMethod: 'TRANSFER' },
} as const satisfies Record<PayMethod, PayMethodSpec>

type Locale = 'ko' | 'en' | 'ja' | 'zh'

/**
 * Everything but `card` is domestic — the wallets need a Korean app, and 계좌이체·휴대폰 소액결제 need a Korean
 * bank or carrier line — so the non-Korean locales get the card channel alone, opened as a foreign-card window
 * by the bypass in `use-checkout`.
 *
 * Order is the order the picker renders in, and the first entry is what it selects by default. 계좌이체 and
 * 휴대폰 sit last on purpose: both refund worse than the rest (about three months for 계좌이체, and 휴대폰 can
 * only be cancelled inside the month it was charged), so neither should be what an undecided buyer lands on.
 */
const PAY_METHODS_BY_LOCALE = {
  ko: ['kakaopay', 'tosspay', 'card', 'transfer', 'mobile'],
  en: ['card'],
  ja: ['card'],
  zh: ['card'],
  // Non-empty by type: a locale with no way to pay is a paywall that opens and cannot sell, and making that
  // a compile error is what lets the paywall default to `methods[0]` with no fallback to write.
} as const satisfies Record<Locale, readonly [PayMethod, ...PayMethod[]]>

export function payMethodsFor(locale: Locale): readonly [PayMethod, ...PayMethod[]] {
  return PAY_METHODS_BY_LOCALE[locale]
}

/**
 * The server-side half. Takes an unnarrowed string because it guards a request body, and returns a type
 * predicate so the handler that passes it can go on to index the catalogue with it.
 */
export function isPayMethodAllowed(locale: Locale, method: string): method is PayMethod {
  return (PAY_METHODS_BY_LOCALE[locale] as readonly string[]).includes(method)
}
