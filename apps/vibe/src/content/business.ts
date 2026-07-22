import { Locale } from '@sobok/domain/locale'

import { LEGAL_CONTACT_EMAIL } from './legal'

// Single source of truth for the seller-identity disclosure required by 전자상거래법 제10조 (전자상거래 등에서의
// 소비자보호에 관한 법률). Every value here MUST match the PG (토스페이먼츠) merchant application and the
// 사업자등록증 exactly — a mismatch is a common PG-review rejection reason. "로빈리뷰" is an 개인사업자
// (개인 과세사업자): the middle two digits of the 사업자등록번호 (373-03-02023 → "03") mark it individual, not a 법인.
export const BUSINESS = {
  legalName: '로빈리뷰',
  representative: '곽태욱',
  registrationNumber: '373-03-02023',
  mailOrderNumber: '제2026-서울강동-1089',
  address: '서울특별시 강동구 상암로 111, 102동 302호',
  phone: '010-9203-2837',
  email: LEGAL_CONTACT_EMAIL,
  // 호스팅 사업자 상호 (전자상거래법 시행규칙 §7).
  hostingProvider: 'Cloudflare, Inc.',
  // 개인정보 보호책임자 (개인정보보호법 §31). 소규모 개인사업자이므로 대표자가 겸임한다.
  privacyOfficer: '곽태욱',
} as const

// 공정거래위원회 통신판매사업자 정보공개 팝업. 신고번호 옆에 "사업자정보확인" 링크로 노출하는 것이 표준이다.
export const BUSINESS_INFO_LOOKUP_URL = `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${BUSINESS.registrationNumber.replace(
  /-/g,
  '',
)}`

// Which BUSINESS keys render as a labelled row, in display order. `mailOrderNumber` is rendered with the
// FTC lookup link appended.
export const BUSINESS_FIELD_ORDER = [
  'legalName',
  'representative',
  'registrationNumber',
  'mailOrderNumber',
  'address',
  'phone',
  'email',
  'hostingProvider',
  'privacyOfficer',
] as const

export type BusinessField = (typeof BUSINESS_FIELD_ORDER)[number]

export type BusinessLabels = {
  heading: string
  description: string
  lookupLabel: string
  fields: Record<BusinessField, string>
}

// Field values stay in Korean on every locale (they mirror the legal registration); only the labels and the
// section chrome are localized. This is standard for a Korean 통신판매업자 disclosure.
export const BUSINESS_LABELS = {
  [Locale.KO]: {
    heading: '사업자 정보',
    description: '전자상거래법에 따라 판매자 정보를 안내합니다.',
    lookupLabel: '사업자정보확인',
    fields: {
      legalName: '상호',
      representative: '대표자',
      registrationNumber: '사업자등록번호',
      mailOrderNumber: '통신판매업신고번호',
      address: '사업장 소재지',
      phone: '전화번호',
      email: '전자우편',
      hostingProvider: '호스팅 제공자',
      privacyOfficer: '개인정보보호책임자',
    },
  },
  [Locale.EN]: {
    heading: 'Business information',
    description: 'Seller information disclosed under the Korean Act on Consumer Protection in Electronic Commerce.',
    lookupLabel: 'Verify registration',
    fields: {
      legalName: 'Business name',
      representative: 'Representative',
      registrationNumber: 'Business registration no.',
      mailOrderNumber: 'Mail-order sales registration no.',
      address: 'Business address',
      phone: 'Phone',
      email: 'Email',
      hostingProvider: 'Hosting provider',
      privacyOfficer: 'Privacy officer',
    },
  },
  [Locale.JA]: {
    heading: '事業者情報',
    description: '韓国の電子商取引法に基づき、販売者情報をご案内します。',
    lookupLabel: '事業者情報の確認',
    fields: {
      legalName: '商号',
      representative: '代表者',
      registrationNumber: '事業者登録番号',
      mailOrderNumber: '通信販売業申告番号',
      address: '所在地',
      phone: '電話番号',
      email: 'メール',
      hostingProvider: 'ホスティング提供者',
      privacyOfficer: '個人情報保護責任者',
    },
  },
  [Locale.ZH]: {
    heading: '经营者信息',
    description: '依据韩国《电子商务消费者保护法》公示销售者信息。',
    lookupLabel: '经营者信息查询',
    fields: {
      legalName: '商号',
      representative: '代表人',
      registrationNumber: '营业执照号',
      mailOrderNumber: '通信销售业申报号',
      address: '营业场所地址',
      phone: '电话',
      email: '电子邮件',
      hostingProvider: '托管服务商',
      privacyOfficer: '个人信息保护负责人',
    },
  },
} satisfies Record<Locale, BusinessLabels>
