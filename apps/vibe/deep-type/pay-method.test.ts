import { describe, expect, test } from 'bun:test'

import { PAY_TIERS, type PayMethod, payMethodsFor } from './pay-method'

const LOCALES = ['ko', 'en', 'ja', 'zh'] as const

/**
 * The menu each deployment sells, pinned per tier × locale. `payMethodsFor` is the one computation both the
 * paywall and `/checkout` trust, and no type reaches it (pay-method.ts explains why), so the deploy rule lives
 * here as data: the day an approval lands, `SELLABLE_CHANNELS` and this table are edited in the same commit.
 *
 * The empty `live` rows are declared, not overlooked. PayPal is the only rail the non-Korean locales sell
 * through and its 원천사 심사 has not landed, so a live deployment offers en/ja/zh nothing and the paywall's
 * `methods[0]` is undefined there — the module's own rule is that such a deployment must look broken rather
 * than quietly sell nothing. Pinning the emptiness keeps it a decision: a channel edit that silently empties
 * a locale's menu fails here, while the intended emptiness passes because it is written down.
 *
 * Order is load-bearing — the picker renders in this order and defaults to the first entry.
 */
const EXPECTED_MENU = {
  live: {
    ko: ['tosspay'],
    en: [],
    ja: [],
    zh: [],
  },
  test: {
    ko: ['kakaopay', 'tosspay', 'card', 'transfer', 'mobile'],
    en: ['paypal'],
    ja: ['paypal'],
    zh: ['paypal'],
  },
} as const satisfies Record<(typeof PAY_TIERS)[number], Record<(typeof LOCALES)[number], readonly PayMethod[]>>

describe('payMethodsFor', () => {
  for (const tier of PAY_TIERS) {
    for (const locale of LOCALES) {
      test(`${tier} × ${locale} sells exactly the pinned menu, in order`, () => {
        expect(payMethodsFor(locale, tier)).toEqual([...EXPECTED_MENU[tier][locale]])
      })
    }
  }

  // The pin above is data and can be edited into anything, so the one menu that must never be empty is also a
  // rule: ko is the market every tier charges in, and an empty ko menu is a paywall that cannot open at all.
  test('ko is never left without a method on any tier', () => {
    for (const tier of PAY_TIERS) {
      expect(payMethodsFor('ko', tier).length).toBeGreaterThan(0)
    }
  })
})
