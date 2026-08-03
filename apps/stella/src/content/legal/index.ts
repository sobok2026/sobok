import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc, LegalDocLabels } from '@sobok/site-chrome/legal-doc-article'
import { PRIVACY } from './privacy'
import { REFUND } from './refund'
import { TERMS } from './terms'

export type { LegalDoc, LegalSection } from '@sobok/site-chrome/legal-doc-article'

export type LegalNav = {
  privacy: string
  terms: string
  refund: string
  business: string
}

export type LegalContent = LegalDocLabels & {
  nav: LegalNav
  privacy: LegalDoc
  terms: LegalDoc
  refund: LegalDoc
}

// One document per file, assembled here. They are revised on separate clocks — a refund-policy change should
// not drag the privacy policy through the same diff — and each carries its own version and effective date.
const LABELS = {
  ko: {
    updatedLabel: '최종 업데이트',
    effectiveLabel: '시행일',
    versionLabel: '버전',
    contentsLabel: '목차',
    contactLabel: '문의',
    nav: {
      privacy: '개인정보처리방침',
      terms: '이용약관',
      refund: '청약철회·환불 정책',
      business: '사업자 정보',
    },
  },
  en: {
    updatedLabel: 'Last updated',
    effectiveLabel: 'Effective',
    versionLabel: 'Version',
    contentsLabel: 'Contents',
    contactLabel: 'Contact',
    nav: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      refund: 'Withdrawal & Refund',
      business: 'Business info',
    },
  },
  ja: {
    updatedLabel: '最終更新',
    effectiveLabel: '施行日',
    versionLabel: 'バージョン',
    contentsLabel: '目次',
    contactLabel: 'お問い合わせ',
    nav: {
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
      refund: '契約解除・返金',
      business: '事業者情報',
    },
  },
  zh: {
    updatedLabel: '最后更新',
    effectiveLabel: '施行日期',
    versionLabel: '版本',
    contentsLabel: '目录',
    contactLabel: '联系方式',
    nav: {
      privacy: '隐私政策',
      terms: '服务条款',
      refund: '撤回与退款',
      business: '经营者信息',
    },
  },
} satisfies Record<Locale, LegalDocLabels & { nav: LegalNav }>

export const LEGAL = Object.fromEntries(
  Object.entries(LABELS).map(([locale, labels]) => [
    locale,
    { ...labels, privacy: PRIVACY[locale as Locale], refund: REFUND[locale as Locale], terms: TERMS[locale as Locale] },
  ]),
) as Record<Locale, LegalContent>
