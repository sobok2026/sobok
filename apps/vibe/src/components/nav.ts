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
    { segment: 'deep-type', label: '겉속유형' },
  ],
  [Locale.EN]: [
    { segment: 'couple-gyeol', label: 'Compatibility' },
    { segment: 'couple-type', label: 'Talk Type' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
  [Locale.JA]: [
    { segment: 'couple-gyeol', label: '相性スコア' },
    { segment: 'couple-type', label: '会話タイプ' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
  [Locale.ZH]: [
    { segment: 'couple-gyeol', label: '默契指数' },
    { segment: 'couple-type', label: '对话类型' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
} satisfies Record<Locale, NavItem[]>
