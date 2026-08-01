import type { Locale } from '@sobok/domain/locale'

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
 * Adding a method is one row in `PAY_METHOD_SPEC`, one entry per locale below, one entry in
 * `SELLABLE_CHANNELS` for every tier that may charge on it, one key in the central payments Worker's
 * `PORTONE_CHANNELS` map for that environment, one label per locale in `_content`, and — only if the PG
 * requires one — one line in the bypass table in `use-checkout`. Nothing else: no binding, no resolver, no
 * branch.
 *
 * Why the buyer picks at all: PortOne V2 has no window that spans channels — `loadPaymentUI` covers PayPal SPB
 * alone — so the paywall asks first and `/checkout` hands back the single key that choice earned.
 *
 * Two SDK shapes, told apart by `open` on the spec. `'window'` methods go through `requestPayment`, which
 * opens the PG's page when our button is pressed. PayPal is `'ui'`: SPB renders PayPal's own button via
 * `loadPaymentUI` and OUR button cannot open it, so the paywall runs `/checkout` first and then mounts the
 * PayPal button with the approved paymentId — the two-step flow in `paywall-view`.
 *
 * The catalogue is source and not configuration on purpose. The menu changes when we deploy, never between
 * two requests, so a deployment-time constant is the honest shape and both halves of the app read the same
 * one. It lives in `deep-type/` rather than under `src/` because the Worker enforces it and the paywall
 * renders it: two copies would let the screen offer a method the server refuses, or — the direction that
 * actually matters — let a caller pick a channel the locale was never offered.
 *
 * What a deployment can actually charge on is the second half of that: the catalogue says what we sell and
 * `SELLABLE_CHANNELS` says what this tier's contracts have been approved for. The menu is the intersection and
 * it is computed here alone, so the picker and `/checkout` cannot come to different conclusions about it.
 *
 * Typed structurally rather than against `Locale`: this module is compiled into the Worker, whose tsconfig
 * maps only `@deep-type/*` and `~/*`, so `@sobok/domain/locale` does not resolve there (same as `offer.ts`).
 */
/**
 * A tuple and not a union, so the wire schema in `/checkout` can be `z.enum(PAY_METHODS)` instead of restating
 * the list. One declaration, and a method added below cannot be missing from validation.
 */
export const PAY_METHODS = ['card', 'kakaopay', 'mobile', 'paypal', 'tosspay', 'transfer'] as const

export type PayMethod = (typeof PAY_METHODS)[number]

/**
 * PortOne's own pgProvider identifiers, verbatim. The console prints these under `PG Provider`, the browser
 * SDK keys `bypass` by them, and the central `PORTONE_CHANNELS` map is keyed by them — one spelling for one thing, so
 * a channel key can never be traced to the wrong contract.
 */
export type PortOneChannel = 'kakaopay' | 'kcp_v2' | 'paypal_v2' | 'tosspay_v2' | 'tosspayments'

/**
 * PortOne's two 설정 모드, verbatim again: `live` is 실연동 and `test` is 테스트. This is the ONLY axis any
 * deployment difference in this module rides on, and it names the contract set a deployment holds rather than
 * the branch that built it — payment code must never branch on an environment name, because the moment it can
 * it can be talked into taking the other branch in production.
 */
export const PAY_TIERS = ['live', 'test'] as const

export type PayTier = (typeof PAY_TIERS)[number]

/** Guards the build-time `NEXT_PUBLIC_DEEPTYPE_PAY_TIER`, which arrives as an unnarrowed string. */
export function isPayTier(value: string): value is PayTier {
  return (PAY_TIERS as readonly string[]).includes(value)
}

/**
 * Discriminated on `open`, because the two shapes are called differently and neither degrades into the other:
 * a `'window'` method needs the `payMethod` enum `requestPayment` takes, and a `'ui'` method needs the
 * `uiType` that `loadPaymentUI` renders. One union means adding a UI-type method cannot forget to say which
 * UI, and a window method cannot be handed to the button loader.
 */
export type PayMethodSpec =
  | {
      channel: PortOneChannel
      open: 'window'
      /** The `payMethod` the browser SDK is called with. 간편결제 channels all take `EASY_PAY`. */
      sdkPayMethod: 'CARD' | 'EASY_PAY' | 'MOBILE' | 'TRANSFER'
    }
  | { channel: PortOneChannel; open: 'ui'; uiType: 'PAYPAL_SPB' }

// `kcp_v2` backing two rows is the shape this table exists for: NHN KCP is a full PG and one channel key
// serves 계좌이체 and 휴대폰 소액결제 both. Card stays on `tosspayments`, which is a separate contract — the
// choice of which PG takes cards is a settlement decision and lives here, not in any branch.
export const PAY_METHOD_SPEC = {
  card: { channel: 'tosspayments', open: 'window', sdkPayMethod: 'CARD' },
  kakaopay: { channel: 'kakaopay', open: 'window', sdkPayMethod: 'EASY_PAY' },
  mobile: { channel: 'kcp_v2', open: 'window', sdkPayMethod: 'MOBILE' },
  paypal: { channel: 'paypal_v2', open: 'ui', uiType: 'PAYPAL_SPB' },
  tosspay: { channel: 'tosspay_v2', open: 'window', sdkPayMethod: 'EASY_PAY' },
  transfer: { channel: 'kcp_v2', open: 'window', sdkPayMethod: 'TRANSFER' },
} as const satisfies Record<PayMethod, PayMethodSpec>

/**
 * Which channels actually take money on each tier, and the one line that gets edited the day an approval lands.
 *
 * A 실연동 channel does not charge because a key exists. 계약 → MID/CID 발급 → 원천사 심사 all have to finish
 * first, and before they do the window opens and the approval simply never comes — so "we hold a key" and "we
 * can sell" are different facts and this table is where the second one is recorded. A key is pasted into
 * the central `PORTONE_CHANNELS` map and a channel is added here in the same release, never earlier: a half-filled slot
 * looks configured, which is why no channel is ever listed with an empty or placeholder key instead.
 *
 * This is the build-time copy of each central payments Worker environment's `PORTONE_CHANNELS` key set and has to
 * stay equal to it. A copy exists because the paywall is a static export: it cannot read a Worker var, and the
 * menu is settled once per deployment rather than per request, so source is where the constant belongs.
 * `GET /api/deep-type/config` compares the two and names the difference, so a divergence is one request away
 * rather than a payment window that opens and dies.
 */
const SELLABLE_CHANNELS = {
  // 원천사 심사(페이팔은 본인 비즈니스 계정 연결)가 끝난 채널만. 나머지는 승인이 떨어지는 날 여기와 wrangler
  // 실연동 맵에 한 줄씩 함께 추가한다.
  live: ['tosspay_v2'],
  // 테스트 채널은 심사가 없으므로 상점에 붙은 다섯 모두가 곧바로 결제된다. 스테이징이 카탈로그 전체를 파는
  // 유일한 배포이고, 그래서 새 결제수단의 QA는 여기서만 가능하다.
  test: ['kakaopay', 'kcp_v2', 'paypal_v2', 'tosspay_v2', 'tosspayments'],
} as const satisfies Record<PayTier, readonly PortOneChannel[]>

export function sellableChannels(tier: PayTier): readonly PortOneChannel[] {
  return SELLABLE_CHANNELS[tier]
}

/**
 * The split is domestic vs overseas. Everything on the `ko` list needs Korea — the wallets need a Korean app,
 * 계좌이체·휴대폰 소액결제 need a Korean bank or carrier line, and the card channel is a domestic-acquiring
 * contract — so the non-Korean locales sell through PayPal alone: one rail that reaches every country PayPal
 * does, prices in the locale's own currency (PayPal takes no KRW), and carries card buyers too via its guest
 * checkout. PayPal is not offered to `ko` in return — Korean consumer PayPal accounts are rare and every
 * domestic method refunds better.
 *
 * Order is the order the picker renders in, and the first entry is what it selects by default. 계좌이체 and
 * 휴대폰 sit last on purpose: both refund worse than the rest (about three months for 계좌이체, and 휴대폰 can
 * only be cancelled inside the month it was charged), so neither should be what an undecided buyer lands on.
 */
const PAY_METHODS_BY_LOCALE = {
  ko: ['kakaopay', 'tosspay', 'card', 'transfer', 'mobile'],
  en: ['paypal'],
  ja: ['paypal'],
  zh: ['paypal'],
  // Non-empty by type, which keeps the CATALOGUE from ever offering a locale nothing. Whether a deployment can
  // actually sell to that locale is `SELLABLE_CHANNELS`'s answer and no type reaches it, so it is a deploy rule
  // instead: every tier's channel list must leave every locale with at least one method. `GET /config` prints
  // the resulting menu per locale for exactly that check, and the paywall takes `methods[0]` with no fallback
  // written on purpose — a deployment that broke the rule must look broken rather than quietly sell nothing.
} as const satisfies Record<Locale, readonly [PayMethod, ...PayMethod[]]>

/**
 * The menu: 카탈로그 ∩ 능력. Both halves of the app call this — the paywall to render the picker, `/checkout` to
 * validate what came back — so the screen cannot offer a method the server would refuse.
 */
export function payMethodsFor(locale: Locale, tier: PayTier): readonly PayMethod[] {
  const sellable = SELLABLE_CHANNELS[tier] as readonly string[]
  return PAY_METHODS_BY_LOCALE[locale].filter((method) => sellable.includes(PAY_METHOD_SPEC[method].channel))
}

/**
 * The server-side half. Takes an unnarrowed string because it guards a request body, and returns a type
 * predicate so the handler that passes it can go on to index the catalogue with it.
 */
export function isPayMethodAllowed(locale: Locale, tier: PayTier, method: string): method is PayMethod {
  return (payMethodsFor(locale, tier) as readonly string[]).includes(method)
}
