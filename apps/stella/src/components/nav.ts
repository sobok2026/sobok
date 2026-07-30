import type { Locale } from '@sobok/domain/locale'

export type NavItem = {
  // Path segment after the locale, e.g. 'today' → /{locale}/today.
  segment: string
  label: string
}

// Primary product navigation shown in the header, in order. Home is the brand
// wordmark, so it is not repeated here. Add forecast verticals (금전 등) to this
// list as they ship — the header degrades to a horizontal scroll strip.
export const PRIMARY_NAV = {
  ko: [
    { segment: 'today', label: '오늘' },
    { segment: 'love', label: '연애' },
  ],
  en: [
    { segment: 'today', label: 'Today' },
    { segment: 'love', label: 'Love' },
  ],
  ja: [
    { segment: 'today', label: '今日' },
    { segment: 'love', label: '恋愛' },
  ],
  zh: [
    { segment: 'today', label: '今日' },
    { segment: 'love', label: '恋爱' },
  ],
} satisfies Record<Locale, NavItem[]>
