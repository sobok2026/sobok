import type { Locale } from '@sobok/domain/locale'

export const GUARDIAN_DAILY_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
export const GUARDIAN_DAILY_THEMES = ['self', 'love', 'work', 'choice'] as const
export const GUARDIAN_DAILY_BASES = ['natal_sun', 'daily_moon'] as const
export const GUARDIAN_DAILY_RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const

export type GuardianDailyTone = (typeof GUARDIAN_DAILY_TONES)[number]
export type GuardianDailyTheme = (typeof GUARDIAN_DAILY_THEMES)[number]
export type GuardianDailyBasis = (typeof GUARDIAN_DAILY_BASES)[number]
export type GuardianDailyRarity = (typeof GUARDIAN_DAILY_RARITIES)[number]

export interface GuardianDailyCardSnapshot {
  locale: Locale
  dateKey: string
  timeZone: string
  basis: GuardianDailyBasis
  sign: GuardianZodiacSign
  skySign: GuardianZodiacSign
  theme: GuardianDailyTheme
  tone: GuardianDailyTone
  rarity: GuardianDailyRarity | null
  familyId: string
  editionId: string
  artworkObjectKey: string
  title: string
  guardians: string
  artworkAlt: string
  oneLine: string
  action: string
  reflection: string
}

export interface GuardianDailyCardView extends Omit<GuardianDailyCardSnapshot, 'artworkObjectKey'> {
  artworkPath: string
  source: 'today_free' | 'tomorrow_pass'
}

export interface GuardianDailyAccessView {
  active: boolean
  expiresAt: string | null
}

export type GuardianDailyCardResponse =
  | {
      status: 'ready'
      collectionPublicId: string | null
      card: GuardianDailyCardView
      access: GuardianDailyAccessView
      archived: boolean
    }
  | {
      status: 'locked'
      theme: GuardianDailyTheme
      access: GuardianDailyAccessView
    }
  | {
      status: 'tone_required'
      theme: GuardianDailyTheme
      access: GuardianDailyAccessView & { active: true; expiresAt: string }
    }

export interface GuardianDailySummary {
  cardCount: number
  fromDateKey: string
  toDateKey: string
  dominantTheme: GuardianDailyTheme
  dominantTone: GuardianDailyTone
  title: string
  body: string
}

export const GUARDIAN_ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const

export type GuardianZodiacSign = (typeof GUARDIAN_ZODIAC_SIGNS)[number]
