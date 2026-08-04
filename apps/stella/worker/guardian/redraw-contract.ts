import type { Locale } from '@sobok/domain/locale'
import type { GuardianLoveRedrawProductSku, GuardianRarity } from './manifest'

export const GUARDIAN_CARD_PRESENTATION_SCHEMA_VERSION = 1 as const

/**
 * Locale-rendered card copy is captured when the card is acquired. A later catalog or copy edit therefore
 * cannot silently change something a buyer already revealed, while the edition id still identifies the
 * collectible artwork across reports and accounts.
 */
export interface GuardianCardPresentationSnapshot {
  schemaVersion: typeof GUARDIAN_CARD_PRESENTATION_SCHEMA_VERSION
  locale: Locale
  cardEditionId: string
  familyId: string
  slot: 'self' | 'love' | 'work' | 'choice'
  rarity: GuardianRarity | null
  artworkPath: string
  title: string
  guardians: string
  artworkAlt: string
  oneLine: string
}

export interface GuardianLoveCardView extends GuardianCardPresentationSnapshot {
  acquisitionPublicId: string
  acquisitionCount: number
  equipped: boolean
}

export interface GuardianLoveRedrawProductView {
  sku: GuardianLoveRedrawProductSku
  credits: number
  orderName: string
  price: {
    amount: number
    market: string
    currency: string
  }
}

export interface GuardianLoveRedrawState {
  reportPublicId: string
  locale: Locale
  equippedCard: GuardianLoveCardView
  cards: GuardianLoveCardView[]
  credits: {
    available: number
  }
  guarantee: {
    ruleVersion: string
    interval: number
    paidDrawsInCycle: number
    paidDrawsUntilGuarantee: number
  }
  odds: {
    rarity: GuardianRarity
    weight: number
    weightScale: number
  }[]
  products: GuardianLoveRedrawProductView[]
}

export interface GuardianLoveRedrawResult {
  acquisition: GuardianLoveCardView
  duplicate: boolean
  guaranteeDue: boolean
  guaranteedUnowned: boolean
  created: boolean
  state: GuardianLoveRedrawState
}
