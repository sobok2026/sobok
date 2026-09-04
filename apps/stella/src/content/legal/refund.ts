import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_PASS_NAME, GUARDIAN_PASS_REFUND_VERSION } from '../../../worker/guardian/offer'

const NAME_KO = GUARDIAN_PASS_NAME.ko

/**
 * 청약철회·환불 정책. Its own document because 전자상거래법 제13조 제2항 제5호 makes the withdrawal terms a disclosure
 * a buyer has to be able to read on their own before agreeing, and because it is revised on its own clock —
 * a refund-policy change should not carry the privacy policy's diff along with it.
 *
 * The whole document rests on one product fact: delivery starts when the buyer first opens tomorrow's card,
 * not merely when payment is approved. The purchase row records that first use for customer support.
 */
export const REFUND: Record<Locale, LegalDoc> = {
  ko: {
    title: '청약철회·환불 정책',
    description: `${NAME_KO}의 청약철회와 환불에 관한 사항을 안내합니다.`,
    effectiveDate: '2026년 9월 4일',
    updatedDate: '2026년 9월 4일',
    version: GUARDIAN_PASS_REFUND_VERSION,
    sections: [
      {
        heading: '청약철회 기간',
        body: ['이용자는 계약 내용에 관한 안내를 받은 날부터 7일 이내에 청약철회를 할 수 있습니다.'],
      },
      {
        heading: '콘텐츠 제공이 개시되는 시점',
        body: [
          `${NAME_KO}는 디지털 콘텐츠입니다. 전자상거래법 제17조 제2항에 따라 콘텐츠의 제공이 개시되면 청약철회가 제한될 수 있습니다.`,
          '콘텐츠 제공은 이용자가 선공개되는 내일의 수호령 카드를 처음 연 때 시작됩니다. 결제만 마치고 내일 카드를 아직 열지 않은 상태는 제공이 시작되지 않은 것으로 봅니다.',
          '회사는 이 제한을 결제 화면에 표시하고 동의를 받습니다. 결제 전에도 오늘의 수호령 카드와 해석 및 행동 문장을 무료로 제공해 상품의 성격을 확인할 수 있게 합니다.',
        ],
      },
      {
        heading: '첫 선공개 카드를 열기 전 환불',
        body: [
          '청약철회 기간 안에 결제만 마치고 내일 카드를 한 번도 열지 않았다면 전액 환불을 요청할 수 있습니다.',
          '회사의 사유로 선공개권을 제공하지 못한 경우에도 전액 환불합니다.',
          '카드 보관함을 다시 열 수 있다는 점은 이미 시작된 콘텐츠 제공을 되돌린다는 뜻이 아닙니다.',
        ],
      },
      {
        heading: '표시·광고와 다르게 이행된 경우',
        body: [
          '제공된 선공개권이나 카드가 표시·광고 내용과 다르거나 계약과 다르게 이행된 경우에는 카드를 연 뒤에도 청약철회를 할 수 있습니다. 이때 기간은 공급받은 날부터 3개월 이내이면서 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내입니다.',
          '콘텐츠에 결함이 있어 이용자에게 피해가 생긴 경우 회사는 콘텐츠산업진흥법 제28조 제2항에 따라 그 피해를 보상합니다.',
        ],
      },
      {
        heading: '과오금의 환불',
        body: [
          '결제 오류나 회사의 잘못으로 실제 이용 금액보다 많이 결제된 금액은 이용자가 요청하면 전액 환불합니다. 회사의 책임이 아닌 사유로 과오금이 생긴 경우에는 환불에 실제로 드는 비용을 뺀 금액을 돌려드립니다.',
          '과오금 환불은 결제한 수단으로 처리합니다.',
        ],
      },
      {
        heading: '환불 방법과 처리 기간',
        body: [
          '환불은 결제한 수단으로 이루어집니다. 회사는 청약철회 접수일부터 3영업일 이내에 환불을 처리하며 처리가 늦어지면 지연 기간에 대해 연 15%의 지연배상금을 더해 드립니다.',
        ],
      },
      {
        heading: '연령 제한',
        body: [
          `만 14세 미만은 ${NAME_KO}를 구매할 수 없습니다. 연령을 잘못 확인하고 결제한 사실을 알게 되면 구매 이메일과 함께 문의해 주세요.`,
          '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있습니다. 취소를 원하면 구매 이메일과 함께 아래 문의처로 연락해 주세요.',
        ],
      },
      {
        heading: '환불 문의',
        body: [`청약철회와 환불에 관한 문의는 ${BUSINESS.email} 또는 ${BUSINESS.phone} 로 연락해 주세요.`],
      },
    ],
  },

  en: {
    title: 'Withdrawal & Refund Policy',
    description: 'How withdrawal and refunds work for the Stella guardian early-access pass.',
    effectiveDate: 'September 4, 2026',
    updatedDate: 'September 4, 2026',
    version: GUARDIAN_PASS_REFUND_VERSION,
    sections: [
      {
        heading: 'Withdrawal period',
        body: [
          'You may withdraw from the purchase within 7 days of receiving notice of the contract terms, under the Korean Act on Consumer Protection in Electronic Commerce.',
        ],
      },
      {
        heading: 'When delivery of the content begins',
        body: [
          'The guardian early-access pass is digital content. Under Article 17(2) of that Act, withdrawal may be limited once delivery begins.',
          'Delivery begins when you first open tomorrow’s guardian card. Payment alone, before any early card is opened, does not count as delivery having begun.',
          'We disclose this at checkout. Before payment, today’s full guardian card, interpretation and action are available free so you can judge the product.',
        ],
      },
      {
        heading: 'Refund before the first early card is opened',
        body: [
          'Within the withdrawal period, you may request a full refund if you have paid but never opened an early card.',
          'We also refund in full if our failure prevents delivery of the pass.',
          'Archive recovery does not reverse delivery that has already begun.',
        ],
      },
      {
        heading: 'If the service differs from what was advertised',
        body: [
          'If the pass or cards differ from how they were described or advertised, or the contract is not performed as agreed, statutory withdrawal rights remain available.',
          'Where defective content causes harm, we compensate under Article 28(2) of the Content Industry Promotion Act.',
        ],
      },
      {
        heading: 'Overcharges',
        body: [
          'Any amount charged above what you actually owed because of a payment error or our fault is refunded in full on request. Where the overcharge arose for reasons not attributable to us, we refund the amount less the costs actually incurred in refunding it.',
          'Overcharges are refunded to the payment method used.',
        ],
      },
      {
        heading: 'Refund method and processing time',
        body: [
          'Refunds are issued to the payment method used. We process a withdrawal within 3 business days of receiving it; where processing is delayed, we add interest at 15% per year for the period of delay.',
        ],
      },
      {
        heading: 'Age limit',
        body: [
          'The guardian early-access pass cannot be purchased by anyone under 14. If age was confirmed incorrectly, contact us with the purchase email.',
          'A contract a minor entered into without their legal guardian’s consent may be cancelled by the minor or by the guardian. To cancel, contact us with the purchase email.',
        ],
      },
      {
        heading: 'Refund contact',
        body: [`For withdrawal and refund enquiries, contact ${BUSINESS.email} or ${BUSINESS.phone}.`],
      },
    ],
  },

  ja: {
    title: '契約解除・返金ポリシー',
    description: '星屑の守護霊カード先行公開パスに関する契約解除と返金についてご案内します。',
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_REFUND_VERSION,
    sections: [
      {
        heading: '契約解除の期間',
        body: ['利用者は契約内容に関する案内を受けた日から7日以内に契約解除を行うことができます。'],
      },
      {
        heading: 'コンテンツの提供が開始される時点',
        body: [
          '守護霊カード先行公開パスはデジタルコンテンツであり、提供開始後は契約解除が制限される場合があります。',
          '提供は利用者が先行公開された明日のカードを初めて開いた時に開始します。決済のみでカードをまだ開いていない状態は提供開始前です。',
          'この制限は決済画面で案内します。決済前に今日のカード・解釈・行動文を無料で確認できます。',
        ],
      },
      {
        heading: '最初の先行カードを開く前の返金',
        body: [
          '契約解除期間内に、決済後一度も先行カードを開いていなければ全額返金を申請できます。',
          '当社の事情でパスを提供できなかった場合も全額返金します。',
          'カード保管箱の復旧は、すでに開始した提供を取り消す意味ではありません。',
        ],
      },
      {
        heading: '表示・広告と異なって履行された場合',
        body: [
          '先行公開パスまたはカードが表示・広告と異なる場合、法令に定める契約解除の権利は維持されます。',
          'コンテンツの欠陥により被害が生じた場合、コンテンツ産業振興法第28条第2項に従い補償します。',
        ],
      },
      {
        heading: '過誤金の返金',
        body: [
          '決済エラーや当社の過失により実際の利用金額より多く決済された金額は、利用者の請求により全額返金します。当社の責によらない事由で過誤金が生じた場合は、返金に実際に要する費用を差し引いた金額をお返しします。',
          '過誤金の返金は決済した手段で処理します。',
        ],
      },
      {
        heading: '返金方法と処理期間',
        body: [
          '返金は決済した手段で行います。当社は契約解除の受付日から3営業日以内に返金を処理し、処理が遅れる場合は遅延期間について年15%の遅延賠償金を加算します。',
        ],
      },
      {
        heading: '年齢制限',
        body: [
          '満14歳未満は守護霊カード先行公開パスを購入できません。年齢確認に誤りがあった場合は購入メールとともにお問い合わせください。',
          '未成年者が法定代理人の同意なく結んだ契約は、未成年者本人または法定代理人が取り消すことができます。取消しをご希望の場合は、購入時のメールアドレスとともに下記の窓口へご連絡ください。',
        ],
      },
      {
        heading: '返金のお問い合わせ',
        body: [`契約解除と返金に関するお問い合わせは ${BUSINESS.email} または ${BUSINESS.phone} までご連絡ください。`],
      },
    ],
  },

  zh: {
    title: '撤回与退款政策',
    description: '说明星黛洛守护灵卡片提前查看通行证的撤回与退款事项。',
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_REFUND_VERSION,
    sections: [
      {
        heading: '撤回期限',
        body: ['用户可自收到合同内容告知之日起 7 日内撤回订购。'],
      },
      {
        heading: '内容开始提供的时点',
        body: [
          '守护灵卡片提前查看通行证属于数字内容，内容开始提供后撤回权可能受到限制。',
          '用户首次打开提前公开的明日卡片时，内容开始提供。仅完成付款而尚未打开卡片时，视为尚未开始提供。',
          '结算页面会明确说明该限制。付款前可免费查看完整的今日卡片、解读与行动建议。',
        ],
      },
      {
        heading: '打开第一张提前卡片前的退款',
        body: [
          '在撤回期限内，付款后若从未打开提前卡片，可申请全额退款。',
          '因本公司原因无法提供通行证时也将全额退款。',
          '恢复卡片收藏并不撤销已经开始的内容提供。',
        ],
      },
      {
        heading: '与标示·广告不符的履行',
        body: [
          '若通行证或卡片与标示、广告不符，用户依法享有的撤回与救济权利仍然有效。',
          '因内容缺陷造成损害时，本公司依据《内容产业振兴法》第28条第2款予以赔偿。',
        ],
      },
      {
        heading: '多收款项的退还',
        body: [
          '因结算错误或本公司过失导致实际支付金额高于应付金额的，经用户请求全额退还。因非本公司责任事由产生多收款项的，退还金额可扣除退款实际发生的费用。',
          '多收款项按原支付方式退还。',
        ],
      },
      {
        heading: '退款方式与处理时限',
        body: [
          '退款按原支付方式办理。本公司自受理撤回之日起 3 个工作日内处理退款；处理迟延的，就迟延期间按年利率 15% 加付迟延赔偿金。',
        ],
      },
      {
        heading: '年龄限制',
        body: [
          '未满14周岁不得购买守护灵卡片提前查看通行证。如年龄确认有误，请附购买邮箱联系我们。',
          '未成年人未经法定代理人同意订立的合同，未成年人本人或其法定代理人可以撤销。如需撤销，请附购买邮箱联系下列窗口。',
        ],
      },
      {
        heading: '退款咨询',
        body: [`有关撤回与退款的咨询，请联系 ${BUSINESS.email} 或 ${BUSINESS.phone}。`],
      },
    ],
  },
}
