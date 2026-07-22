import { Locale } from '@sobok/domain/locale'

export const PRIVACY_CHOICES_LABEL = {
  [Locale.KO]: '개인정보·쿠키 설정',
  [Locale.EN]: 'Privacy & cookie choices',
  [Locale.JA]: 'プライバシー・Cookie設定',
  [Locale.ZH]: '隐私与 Cookie 设置',
} satisfies Record<Locale, string>
