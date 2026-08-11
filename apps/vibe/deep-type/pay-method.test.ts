import { describe, expect, test } from 'bun:test'

import { PAY_PROFILES, type PayMethod, payMethodsFor } from './pay-method'

const LOCALES = ['ko', 'en', 'ja', 'zh'] as const

/**
 * The menu each deployment sells, pinned per profile × locale. `payMethodsFor` is the one computation both the
 * paywall and `/checkout` trust, and no type reaches it (pay-method.ts explains why), so the deploy rule lives
 * here as data: the day an approval lands, `SELLABLE_CHANNELS` and this table are edited in the same commit.
 *
 * The empty production rows are declared, not overlooked. PayPal is the only rail the non-Korean locales sell
 * through and its 원천사 심사 has not landed, so production offers en/ja/zh nothing and the paywall's
 * `methods[0]` is undefined there — the module's own rule is that such a deployment must look broken rather
 * than quietly sell nothing. Pinning the emptiness keeps it a decision: a channel edit that silently empties
 * a locale's menu fails here, while the intended emptiness passes because it is written down.
 *
 * Order is load-bearing — the picker renders in this order and defaults to the first entry.
 */
const EXPECTED_MENU = {
  production: {
    ko: ['tosspay', 'card'],
    en: [],
    ja: [],
    zh: [],
  },
  staging: {
    ko: ['kakaopay', 'tosspay', 'card', 'transfer', 'mobile'],
    en: ['paypal'],
    ja: ['paypal'],
    zh: ['paypal'],
  },
} as const satisfies Record<(typeof PAY_PROFILES)[number], Record<(typeof LOCALES)[number], readonly PayMethod[]>>

describe('payMethodsFor', () => {
  for (const profile of PAY_PROFILES) {
    for (const locale of LOCALES) {
      test(`${profile} × ${locale} sells exactly the pinned menu, in order`, () => {
        expect(payMethodsFor(locale, profile)).toEqual([...EXPECTED_MENU[profile][locale]])
      })
    }
  }

  // The pin above is data and can be edited into anything, so the one menu that must never be empty is also a
  // rule: ko is the market every profile charges in, and an empty ko menu is a paywall that cannot open at all.
  test('ko is never left without a method on any profile', () => {
    for (const profile of PAY_PROFILES) {
      expect(payMethodsFor('ko', profile).length).toBeGreaterThan(0)
    }
  })
})
