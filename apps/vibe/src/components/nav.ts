import { Locale } from '@sobok/domain/locale'

export type NavItem = {
  // Path segment after the locale, e.g. 'couple-gyeol' → /{locale}/couple-gyeol.
  segment: string
  label: string
}

export const PRIMARY_NAV = {
  [Locale.KO]: [
    { segment: 'couple-gyeol', label: '결지수' },
    { segment: 'couple-type', label: '대화유형' },
  ],
  [Locale.EN]: [
    { segment: 'couple-gyeol', label: 'Compatibility' },
    { segment: 'couple-type', label: 'Talk Type' },
  ],
  [Locale.JA]: [
    { segment: 'couple-gyeol', label: '相性スコア' },
    { segment: 'couple-type', label: '会話タイプ' },
  ],
  [Locale.ZH]: [
    { segment: 'couple-gyeol', label: '默契指数' },
    { segment: 'couple-type', label: '对话类型' },
  ],
} satisfies Record<Locale, NavItem[]>
