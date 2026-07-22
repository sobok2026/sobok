import { Locale } from '@sobok/domain/locale'

import { BUSINESS } from './business'

// Pre-purchase transaction-terms disclosure for the paid 딥타입 정밀 감정서, required by 전자상거래법 제13조 and
// the 상품정보제공고시 (디지털콘텐츠 category: 공급자, 이용조건·기간, 제공방식, 최소 이용환경, 청약철회·환불,
// 소비자상담 연락처). Rendered on the deep-type landing (visible in the static HTML at the audit URL) and, in a
// compact form, at checkout — so price and terms are reachable without completing the funnel.
//
// The price label MUST stay in sync with the server-authoritative amount in worker/lib/pricing.ts (SKU
// "report" = 5900 KRW) and the paywall copy in deep-type/_content/*. Displayed as a VAT-inclusive total per
// the 총액표시 rule.
export const DEEPTYPE_PRICE = {
  amount: 5900,
  label: '5,900',
  listLabel: '9,900',
  currency: 'KRW',
} as const

export type CommerceRow = { label: string; value: string }

export type CommerceContent = {
  heading: string
  // Short line under the heading.
  intro: string
  rows: CommerceRow[]
  policyLinksLabel: string
}

export const COMMERCE = {
  [Locale.KO]: {
    heading: '상품 · 거래 조건 안내',
    intro: '결제 전 꼭 확인해 주세요.',
    rows: [
      { label: '상품', value: '딥타입 정밀 감정서 (디지털 콘텐츠)' },
      { label: '판매가격', value: '5,900원 (부가가치세 포함)' },
      { label: '결제수단', value: '신용·체크카드 (토스페이먼츠·포트원 연동)' },
      { label: '제공 시기', value: '결제 후 심화 24문항 제출이 끝나면 생성하며 잠시 걸릴 수 있어요.' },
      { label: '제공 방식', value: '웹 브라우저 열람 · 구매 이메일로 15분 일회용 재열람 링크 발송' },
      { label: '이용 기간', value: '결제일부터 1년' },
      { label: '이용 연령', value: '만 14세 이상' },
      { label: '이용 환경', value: '인터넷에 연결된 최신 웹 브라우저' },
      {
        label: '청약철회 · 환불',
        value:
          '감정서를 열람하기 전에는 전액 환불돼요. 열람한 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한돼요(표시·광고와 다른 경우는 예외).',
      },
      { label: '판매자', value: `${BUSINESS.legalName} (대표 ${BUSINESS.representative})` },
      { label: '소비자상담', value: `${BUSINESS.email} · ${BUSINESS.phone}` },
    ],
    policyLinksLabel: '자세한 조건',
  },
  [Locale.EN]: {
    heading: 'Product & terms of sale',
    intro: 'Please review before you pay.',
    rows: [
      { label: 'Product', value: 'DeepType in-depth report (digital content)' },
      { label: 'Price', value: 'KRW 5,900 (VAT included)' },
      {
        label: 'Payment',
        value:
          'International card via Toss Payments and PortOne; charged in KRW, with issuer exchange rates or cross-border fees possible',
      },
      {
        label: 'Delivery',
        value: 'Generated after payment and submission of the 24 refinement questions; this may take a moment.',
      },
      {
        label: 'How it is delivered',
        value: 'Viewed in your browser; 15-minute one-time access links are sent to the purchase email.',
      },
      { label: 'Access period', value: '1 year from payment' },
      { label: 'Minimum age', value: '14 or older' },
      { label: 'Requirements', value: 'A modern web browser with an internet connection' },
      {
        label: 'Withdrawal & refund',
        value:
          'Fully refundable before you open the report. After you open it, withdrawal is restricted as digital content (except when it differs from what was advertised).',
      },
      { label: 'Seller', value: `${BUSINESS.legalName} (rep. ${BUSINESS.representative})` },
      { label: 'Customer support', value: `${BUSINESS.email} · ${BUSINESS.phone}` },
    ],
    policyLinksLabel: 'Full terms',
  },
  [Locale.JA]: {
    heading: '商品・取引条件のご案内',
    intro: 'お支払いの前にご確認ください。',
    rows: [
      { label: '商品', value: 'ディープタイプ精密鑑定書（デジタルコンテンツ）' },
      { label: '販売価格', value: '5,900ウォン（消費税込み）' },
      {
        label: '決済手段',
        value:
          'PortOne経由のToss Payments海外カード（KRW決済。発行会社の為替レート・海外利用手数料が適用される場合があります）',
      },
      { label: '提供時期', value: '決済後、24問の精密設問を送信すると生成します。少し時間がかかる場合があります。' },
      { label: '提供方法', value: 'ブラウザで閲覧し、購入メールへ15分有効のワンタイムリンクを送信します。' },
      { label: '利用期間', value: '決済日から1年間' },
      { label: '利用年齢', value: '14歳以上' },
      { label: '利用環境', value: 'インターネットに接続された最新のウェブブラウザ' },
      {
        label: '申込撤回・返金',
        value:
          '鑑定書を閲覧する前は全額返金されます。閲覧後はデジタルコンテンツの性質上、申込撤回が制限されます（表示・広告と異なる場合は除く）。',
      },
      { label: '販売者', value: `${BUSINESS.legalName}（代表 ${BUSINESS.representative}）` },
      { label: 'お客様相談', value: `${BUSINESS.email} · ${BUSINESS.phone}` },
    ],
    policyLinksLabel: '詳しい条件',
  },
  [Locale.ZH]: {
    heading: '商品与交易条件说明',
    intro: '付款前请务必确认。',
    rows: [
      { label: '商品', value: 'DeepType 精密分析报告（数字内容）' },
      { label: '销售价格', value: '5,900韩元（含增值税）' },
      {
        label: '支付方式',
        value: '通过PortOne连接Toss Payments的境外银行卡（以KRW结算，发卡机构可能采用其汇率并收取跨境手续费）',
      },
      { label: '提供时间', value: '付款并提交24道精密题目后生成，可能需要片刻。' },
      { label: '提供方式', value: '在浏览器查看；向购买邮箱发送15分钟有效的一次性链接。' },
      { label: '使用期限', value: '自付款之日起1年' },
      { label: '最低年龄', value: '年满14周岁' },
      { label: '使用环境', value: '连接互联网的最新网页浏览器' },
      {
        label: '撤回·退款',
        value: '在查看报告前可全额退款。查看后因数字内容性质，撤回受到限制（与展示·广告不符的情况除外）。',
      },
      { label: '销售者', value: `${BUSINESS.legalName}（代表 ${BUSINESS.representative}）` },
      { label: '客户咨询', value: `${BUSINESS.email} · ${BUSINESS.phone}` },
    ],
    policyLinksLabel: '详细条件',
  },
} satisfies Record<Locale, CommerceContent>
