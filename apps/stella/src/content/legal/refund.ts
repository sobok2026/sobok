import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_FREE_DELIVERABLES_KO, GUARDIAN_REPORT_NAME } from '../../../worker/guardian/offer'

const NAME_KO = GUARDIAN_REPORT_NAME.ko

/**
 * 청약철회·환불 정책. Its own document because 전자상거래법 제13조 제2항 제5호 makes the withdrawal terms a disclosure
 * a buyer has to be able to read on their own before agreeing, and because it is revised on its own clock —
 * a refund-policy change should not carry the privacy policy's diff along with it.
 *
 * The whole document rests on one product fact: when the content is 제공 개시된. For this report that is not
 * the moment of payment — a buyer pays, then answers 16–20 questions, and only then is a report written. So
 * everything up to the first opening of a finished report is refundable, and the policy says so plainly.
 */
export const REFUND: Record<Locale, LegalDoc> = {
  ko: {
    title: '청약철회·환불 정책',
    description: `${NAME_KO}의 청약철회와 환불에 관한 사항을 안내합니다.`,
    effectiveDate: '2026년 8월 10일',
    updatedDate: '2026년 8월 3일',
    version: '1.0',
    sections: [
      {
        heading: '청약철회 기간',
        body: ['이용자는 계약 내용에 관한 안내를 받은 날부터 7일 이내에 청약철회를 할 수 있습니다.'],
      },
      {
        heading: '콘텐츠 제공이 개시되는 시점',
        body: [
          `${NAME_KO}는 디지털 콘텐츠입니다. 전자상거래법 제17조 제2항에 따라 콘텐츠의 제공이 개시되면 청약철회가 제한될 수 있습니다.`,
          '이 리포트는 결제 뒤에 맞춤 질문이 이어지고 그 답이 모두 모인 뒤에야 카드와 본문이 만들어집니다. 그래서 제공이 개시되는 시점은 완성된 리포트를 이용자가 처음 연 때입니다. 결제만 마친 상태와 질문에 답하는 중과 답을 중단한 상태는 모두 제공이 개시되지 않은 것으로 봅니다.',
          `회사는 이 제한이 적용된다는 사실을 결제 화면에 표시하고 이용자의 동의를 받습니다. 회사는 결제 전에 무료 검사 결과로 ${GUARDIAN_FREE_DELIVERABLES_KO.join(' · ')}를 제공해 이용자가 상품의 성격을 미리 확인할 수 있도록 합니다. 무료 검사는 결제 없이 언제든 다시 받을 수 있습니다.`,
        ],
      },
      {
        heading: '리포트를 열기 전 전액 환불',
        body: [
          '결제한 뒤에도 완성된 리포트를 아직 열지 않았다면 언제든 전액 환불받을 수 있습니다. 맞춤 질문을 푸는 중이거나 질문을 중단한 상태도 여기에 해당합니다.',
          '리포트가 끝내 만들어지지 못했거나 회사가 리포트를 제공하지 못한 경우에도 전액 환불합니다.',
          '리포트를 1년 동안 다시 열 수 있다는 점은 환불 가능 기간을 늘리거나 이미 개시된 제공을 되돌린다는 뜻이 아닙니다.',
        ],
      },
      {
        heading: '표시·광고와 다르게 이행된 경우',
        body: [
          '제공된 리포트가 표시·광고 내용과 다르거나 계약과 다르게 이행된 경우에는 리포트를 연 뒤에도 청약철회를 할 수 있습니다. 이때 기간은 공급받은 날부터 3개월 이내이면서 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내입니다.',
          '리포트에 결함이 있어 이용자에게 피해가 생긴 경우 회사는 콘텐츠산업진흥법 제28조 제2항에 따라 그 피해를 보상합니다.',
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
    description: 'How withdrawal and refunds work for the Stella guardian report.',
    effectiveDate: 'August 10, 2026',
    updatedDate: 'August 3, 2026',
    version: '1.0',
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
          'The guardian report is digital content. Under Article 17(2) of that Act, the right of withdrawal may be limited once delivery of the content has begun.',
          'For this report, payment comes first, a set of 16–20 tailored questions follows, and only after those answers are complete are the cards and the written report produced. Delivery therefore begins when you first open the finished report. Having paid, being partway through the questions, and having stopped partway through all count as delivery not yet begun.',
          'We state this limitation on the checkout screen and ask you to agree to it there. Before any payment, the free run gives you a personalized line, the four-theme card layout, and the report’s contents with sample passages, so you can judge what the product is. The free run can be repeated at any time without paying.',
        ],
      },
      {
        heading: 'Full refund before you open the report',
        body: [
          'If you have paid but not yet opened the finished report, you can have a full refund at any time. That includes being partway through the tailored questions, or having stopped partway.',
          'If the report ultimately fails to be produced, or we fail to deliver it, we refund in full.',
          'The fact that a report can be reopened for one year does not extend the refund window or reverse delivery that has already begun.',
        ],
      },
      {
        heading: 'If the report differs from what was advertised',
        body: [
          'If the report as delivered differs from how it was described or advertised, or the contract is otherwise not performed as agreed, you may withdraw even after opening it — within 3 months of delivery and within 30 days of the date you knew or could have known of the discrepancy.',
          'Where a defect in the report causes you harm, we compensate that harm under Article 28(2) of the Content Industry Promotion Act.',
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
          'The guardian report cannot be purchased by anyone under 14. If you learn that an age was confirmed incorrectly at checkout, contact us with the purchase email.',
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
    description: '星屑の星座守護霊レポートに関する契約解除と返金についてご案内します。',
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '1.0',
    sections: [
      {
        heading: '契約解除の期間',
        body: ['利用者は契約内容に関する案内を受けた日から7日以内に契約解除を行うことができます。'],
      },
      {
        heading: 'コンテンツの提供が開始される時点',
        body: [
          '星座守護霊レポートはデジタルコンテンツです。韓国電子商取引法第17条第2項により、コンテンツの提供が開始されると契約解除が制限される場合があります。',
          'このレポートは決済の後に個別質問が続き、その回答がすべて揃ってからカードと本文が作られます。したがって提供が開始される時点は、完成したレポートを利用者が初めて開いた時です。決済のみを終えた状態、質問に回答している途中、回答を中断した状態は、いずれも提供が開始されていないものとみなします。',
          '当社はこの制限が適用されることを決済画面に表示し、利用者の同意を得ます。決済前の無料診断では、パーソナライズされた一文、四つのテーマに分かれたカード構成、レポートの目次と文章の抜粋をお渡しし、商品の性格を事前に確認できるようにしています。無料診断は決済なしでいつでも受け直せます。',
        ],
      },
      {
        heading: 'レポートを開く前の全額返金',
        body: [
          '決済後でも完成したレポートをまだ開いていなければ、いつでも全額返金を受けられます。個別質問に回答している途中や中断した状態もこれに含まれます。',
          'レポートが最終的に作成されなかった場合や、当社が提供できなかった場合も全額返金します。',
          'レポートを1年間再度開けることは、返金可能期間を延ばしたり、すでに開始された提供を取り消したりする意味ではありません。',
        ],
      },
      {
        heading: '表示・広告と異なって履行された場合',
        body: [
          '提供されたレポートが表示・広告の内容と異なる場合や契約と異なって履行された場合は、レポートを開いた後でも契約解除ができます。この場合の期間は、供給を受けた日から3か月以内かつその事実を知った日または知り得た日から30日以内です。',
          'レポートの欠陥により利用者に被害が生じた場合、当社はコンテンツ産業振興法第28条第2項に従いその被害を補償します。',
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
          '満14歳未満は星座守護霊レポートを購入できません。年齢を誤って確認して決済したことが判明した場合は、購入時のメールアドレスとともにお問い合わせください。',
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
    description: '说明星黛洛星座守护灵报告的撤回与退款事项。',
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '1.0',
    sections: [
      {
        heading: '撤回期限',
        body: ['用户可自收到合同内容告知之日起 7 日内撤回订购。'],
      },
      {
        heading: '内容开始提供的时点',
        body: [
          '星座守护灵报告属于数字内容。依据韩国《电子商务消费者保护法》第 17 条第 2 款，内容开始提供后撤回权可能受到限制。',
          '本报告在付款后会继续进行个性化提问，只有在全部作答完成后才生成卡片与正文。因此提供开始的时点是用户首次打开已完成报告之时。仅完成付款、正在作答、中途停止作答，均视为尚未开始提供。',
          '本公司在结算页面明示该限制并取得用户同意。付款前的免费测试会提供一句个性化解读、按四个主题划分的卡片结构，以及报告目录与文段摘录，使用户能够事先了解商品性质。免费测试无需付款，可随时重新进行。',
        ],
      },
      {
        heading: '打开报告前的全额退款',
        body: [
          '付款后若尚未打开已完成的报告，可随时获得全额退款。正在作答个性化问题或中途停止作答均属此列。',
          '若报告最终未能生成，或本公司未能提供报告，同样全额退款。',
          '报告可在一年内重新打开，并不意味着延长退款期限或撤销已经开始的提供。',
        ],
      },
      {
        heading: '与标示·广告不符的履行',
        body: [
          '若所提供的报告与标示·广告内容不符，或未按合同履行，用户在打开报告后仍可撤回。期限为自收到供货之日起 3 个月内，且自知悉或应当知悉该事实之日起 30 日内。',
          '因报告存在缺陷致使用户受到损害的，本公司依据《内容产业振兴法》第 28 条第 2 款予以赔偿。',
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
          '未满 14 周岁不得购买星座守护灵报告。如发现年龄确认有误仍完成付款，请附购买邮箱与我们联系。',
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
