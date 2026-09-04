import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_PASS_NAME, GUARDIAN_PASS_PRICE, GUARDIAN_PASS_TERMS_VERSION } from '../../../worker/guardian/offer'

// The contract names the product and the price, so it reads both from the constants the checkout charges and
// the PortOne 결제창 prints. 전자상거래법 제13조 제2항 제2호·제3호 make each a pre-contract disclosure, and a
// literal here would be a second copy free to drift from the number the buyer is actually charged.
// The pass settles in KRW in every locale — there is one market — so a non-Korean contract has to name the
// same KRW figure rather than a converted one the buyer will never be charged.
const NAME_KO = GUARDIAN_PASS_NAME.ko
const PRICE_KO = `${GUARDIAN_PASS_PRICE.toLocaleString('ko-KR')}원`
const PRICE_INTL = `KRW ${GUARDIAN_PASS_PRICE.toLocaleString('en-US')}`

export const TERMS: Record<Locale, LegalDoc> = {
  ko: {
    title: '이용약관',
    description: `로빈리뷰가 운영하는 별무리 서비스와 ${NAME_KO} 이용에 적용되는 약관입니다.`,
    effectiveDate: '2026년 9월 4일',
    updatedDate: '2026년 9월 4일',
    version: GUARDIAN_PASS_TERMS_VERSION,
    sections: [
      {
        heading: '서비스 소개',
        body: [
          `별무리는 생년월일 등 이용자가 입력한 정보를 바탕으로 별자리와 운세 해석을 무료로 제공하고 ${NAME_KO}를 유료로 함께 제공하는 서비스이며 ${BUSINESS.legalName}이 운영합니다.`,
          '오늘의 수호령 카드는 무료입니다. 유료 선공개권은 결제 시점부터 168시간 동안 내일의 수호령 카드를 현지 날짜보다 하루 먼저 열어 볼 수 있는 기간제 디지털 콘텐츠입니다.',
        ],
      },
      {
        heading: '용어와 계약의 성립',
        body: [
          '서비스는 stella.sobok.cc에서 제공하는 무료 도구와 유료 선공개권 기능을 뜻합니다.',
          '이용자가 결제 화면에서 상품명과 가격, 이용 기간, 제공 방식, 청약철회 조건을 확인하고 필수 동의를 마친 뒤 결제를 완료하면 선공개권 이용 계약이 성립합니다.',
          '회원가입 없이 구매할 수 있으며 구매 이메일과 서버가 발급한 접근 권한으로 이용합니다. 정기결제나 자동 갱신 상품이 아닙니다.',
        ],
      },
      {
        heading: '유료 서비스와 결제',
        body: [
          `${NAME_KO}는 ${PRICE_KO}(부가가치세 포함)의 유료 디지털 콘텐츠입니다. 결제수단은 PortOne을 통해 연결되는 토스페이 또는 신용·체크카드이며 이용자는 승인 전 화면에 표시된 최종 금액을 확인해야 합니다.`,
          '결제 통화는 KRW입니다. 해외에서 발급한 결제수단의 사용 가능 여부는 발급사와 결제대행사의 정책에 따라 달라질 수 있고 발급사가 환율과 해외 결제 수수료를 적용할 수 있습니다.',
        ],
      },
      {
        heading: '선공개권과 카드의 제공',
        body: [
          '선공개권은 결제가 승인된 절대 시각부터 168시간 동안 유효합니다. 화면에는 이용자의 현지 시각으로 만료 시각을 표시하며 시간대를 바꾸어도 권한의 실제 길이는 달라지지 않습니다.',
          '오늘과 내일의 날짜 전환은 이용자의 현지 자정을 기준으로 합니다. 내일 카드도 자정이 지나 오늘 카드가 되면 무료로 공개됩니다.',
          '출생 차트가 있으면 태양 별자리와 그날의 하늘을 조합하고, 없으면 그날 달 별자리를 기준으로 카드를 선택합니다. 출생 원본 정보는 카드 선택을 위해 서버로 보내지 않습니다.',
          '자기이해·사랑·일·결정 테마는 사용자별 순서로 순환합니다. 사랑 카드의 그림 버전은 고정 가중치로 선택되지만 해석 분량이나 이용권 가치에는 차이가 없고, 별도 결제로 재추첨할 수 없습니다.',
          '선공개권이 유효할 때 본 카드는 보관함에 저장됩니다. 게스트 보관함과 이메일 복구는 결제일부터 1년 동안 제공하고, 소복 계정에 귀속한 카드는 이용자가 삭제를 요청하거나 계정을 삭제할 때까지 제공합니다.',
        ],
      },
      {
        heading: '청약철회와 환불',
        body: [
          '청약철회와 환불에 관한 사항은 별도의 청약철회·환불 정책에서 정합니다. 내일 카드를 처음 열기 전에는 청약철회를 요청할 수 있고, 처음 연 뒤에는 디지털 콘텐츠 제공이 시작되어 청약철회가 제한될 수 있습니다.',
          '다만 표시·광고와 다르게 이행된 경우에는 카드를 연 뒤에도 법령에 따라 청약철회를 할 수 있습니다.',
        ],
      },
      {
        heading: '구매 자격과 연령 확인',
        body: [
          '무료 서비스는 연령 확인 없이 이용할 수 있습니다. 유료 선공개권은 만 14세 이상만 구매할 수 있으며 이용자가 결제 화면에서 직접 확인해야 합니다. 회사는 이 과정에서 생년월일을 수집하지 않습니다.',
          '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있습니다. 회사는 전자상거래법 제13조 제3항에 따라 이 사실을 결제 화면에서도 안내합니다.',
        ],
      },
      {
        heading: '이용자의 의무',
        body: [
          '이용자는 본인이 받을 수 있는 정확한 이메일을 사용하고 재열람 링크와 접근 권한을 다른 사람에게 공개하지 않아야 합니다.',
          '다른 사람의 이메일이나 결제수단을 무단으로 사용하거나 자동화된 요청과 우회와 역공학으로 서비스를 방해하거나 카드와 이용권을 무단으로 재판매해서는 안 됩니다.',
        ],
      },
      {
        heading: '오락·참고 목적',
        body: [
          '무료 해석과 수호령 카드를 포함해 별무리가 제공하는 모든 결과는 오락과 자기 이해를 돕기 위한 참고 정보이며 의학·법률·재무 등 전문적인 조언을 대신하지 않습니다.',
          '수호령 카드와 문구는 별자리와 날짜를 규칙에 따라 조합한 결과이며 미래의 사실을 예측하거나 보장하지 않습니다.',
          '이용자는 서비스의 내용을 중요한 의사결정의 유일한 근거로 삼지 않아야 하며 서비스 이용에 따른 판단과 책임은 이용자 본인에게 있습니다.',
        ],
      },
      {
        heading: '서비스의 중단',
        body: [
          '회사는 보안 대응과 시스템 점검과 공급자 장애 등 부득이한 사유가 있을 때 서비스 제공을 일시 중단할 수 있습니다. 가능한 경우 미리 안내하고 긴급한 상황은 사후에 안내할 수 있습니다.',
          '서비스를 종료할 때는 합리적인 기간 전에 알리고 아직 제공되지 않은 유료 콘텐츠는 환불합니다.',
        ],
      },
      {
        heading: '광고',
        body: [
          '별무리의 무료 화면에는 제3자 광고가 표시될 수 있습니다. 선공개권 결제와 복구 화면에는 광고를 표시하지 않습니다.',
          '광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
        ],
      },
      {
        heading: '지식재산권',
        body: [
          `서비스에 포함된 텍스트와 디자인과 로고와 수호령 카드 이미지에 대한 권리는 ${BUSINESS.legalName} 또는 정당한 권리자에게 있으며 무단 복제와 배포를 금지합니다.`,
          '이용자는 자신에게 공개된 카드를 개인적인 감상과 공유의 범위에서 이용할 수 있습니다.',
        ],
      },
      {
        heading: '책임의 제한',
        body: [
          "서비스는 '있는 그대로' 제공되며 서비스 이용 또는 이용 불가로 발생한 손해에 대해 관련 법령이 허용하는 범위에서 책임을 제한합니다. 다만 회사의 고의 또는 중대한 과실로 인한 손해에 대한 책임은 배제하지 않습니다.",
        ],
      },
      {
        heading: '분쟁의 해결',
        body: [
          '서비스 이용과 관련해 분쟁이 발생하면 회사와 이용자는 성실히 협의해 해결합니다. 협의가 어려운 경우 콘텐츠분쟁조정위원회나 소비자분쟁조정위원회의 조정을 이용할 수 있습니다.',
        ],
      },
      {
        heading: '약관의 변경',
        body: [
          '약관을 바꾸면 변경 이유와 변경 전후의 내용과 시행일을 공개합니다. 일반 변경은 시행 7일 전에 알리고 이용자에게 중대하게 불리한 변경은 시행 30일 전에 서비스의 눈에 띄는 위치에서 알립니다.',
          '변경된 약관은 시행일 이후의 이용에 적용합니다.',
        ],
      },
      {
        heading: '준거법과 관할',
        body: [
          '본 약관은 대한민국 법령에 따라 해석되고 적용되며 서비스 이용으로 발생한 분쟁의 관할은 관련 법령이 정하는 바에 따릅니다.',
        ],
      },
    ],
  },

  en: {
    title: 'Terms of Service',
    description: `The terms that apply to Stella and its guardian early-access pass, operated by ${BUSINESS.legalName}.`,
    effectiveDate: 'September 4, 2026',
    updatedDate: 'September 4, 2026',
    version: GUARDIAN_PASS_TERMS_VERSION,
    sections: [
      {
        heading: 'About the service',
        body: [
          `Stella, operated by ${BUSINESS.legalName}, provides free astrological interpretations and a paid seven-day early-access pass for tomorrow’s guardian card.`,
          'Today’s guardian card is free. The paid pass provides tomorrow’s card one local calendar day early for 168 hours after payment.',
        ],
      },
      {
        heading: 'Definitions and formation of the contract',
        body: [
          'The service means the free tools and paid early-access features offered at stella.sobok.cc.',
          'The contract is formed when you confirm the product name, price, 168-hour duration, delivery method and withdrawal terms, give the required consents, and complete payment.',
          'You may buy without an account. Access is recovered through the purchase email and a server-issued capability. This is not a subscription and does not auto-renew.',
        ],
      },
      {
        heading: 'Paid service and payment',
        body: [
          `The guardian early-access pass is paid digital content priced at ${PRICE_INTL} including VAT. Payment is handled through PortOne using Toss Pay or a credit/debit card.`,
          'Payment is settled in KRW. Whether a payment method issued outside Korea can be used depends on the issuer’s and payment processor’s policies, and the issuer may apply its own exchange rate and cross-border fees.',
        ],
      },
      {
        heading: 'Delivery of the pass and cards',
        body: [
          'The pass lasts exactly 168 hours from the instant payment is approved. Dates and the displayed expiry use your local time; changing time zone does not change the entitlement length.',
          'A card becomes today’s free card at local midnight. Cards viewed while the pass is active are saved to the archive.',
          'With a birth chart we use the Sun sign plus the day’s sky; without one we use the day’s Moon sign. Raw birth details are not sent to the server for card selection.',
          'Self, love, work and choice themes rotate in a user-specific order. Love-card artwork variants use fixed weights, but do not change the amount or value of the interpretation and cannot be redrawn through a separate purchase.',
          'Guest archive recovery is available for one year after payment. Cards claimed into a Sobok account remain until you request deletion or delete the account.',
        ],
      },
      {
        heading: 'Withdrawal and refunds',
        body: [
          'Withdrawal and refunds are governed by the separate Withdrawal & Refund Policy. You may request withdrawal before opening the first early card; after opening it, withdrawal may be limited because delivery of digital content has begun.',
          'Where the service differs from how it was described or advertised, statutory remedies remain available.',
        ],
      },
      {
        heading: 'Eligibility and age confirmation',
        body: [
          'The free service can be used without age confirmation. The paid pass may be purchased only by people aged 14 or over, confirmed by you at checkout. We do not collect a date of birth for this purpose.',
          'A contract a minor entered into without their legal guardian’s consent may be cancelled by the minor or by the guardian. We also state this at checkout, as required by Article 13(3) of the Act on Consumer Protection in Electronic Commerce.',
        ],
      },
      {
        heading: 'Your obligations',
        body: [
          'Use an email address you can actually receive mail at, and do not disclose reopen links or access grants to others.',
          'Do not use another person’s email or payment method without authorization, interfere with the service through automated requests, circumvention or reverse engineering, or resell cards or access.',
        ],
      },
      {
        heading: 'For entertainment and reference',
        body: [
          'Everything Stella produces is reference material for entertainment and self-reflection, and is not a substitute for professional medical, legal or financial advice.',
          'Guardian cards and their text are rule-based combinations of zodiac and calendar context. They do not predict or guarantee future facts.',
          'You should not rely on the service as the sole basis for important decisions; any decisions and responsibility arising from your use of the service are your own.',
        ],
      },
      {
        heading: 'Suspension of the service',
        body: [
          'We may suspend the service temporarily for security response, maintenance, supplier outages or other unavoidable reasons. We give notice in advance where possible and afterwards in urgent cases.',
          'If the service is discontinued we give reasonable advance notice and refund any paid content not yet delivered.',
        ],
      },
      {
        heading: 'Advertising',
        body: [
          'Third-party ads may appear on Stella’s free screens. No ads are shown on pass checkout or recovery screens.',
          'External sites reached through those ads are responsible for their own content and transactions.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          `Rights to the text, design, logos and guardian card artwork belong to ${BUSINESS.legalName} or their rightful owners, and unauthorized reproduction or distribution is prohibited.`,
          'You may use cards revealed to you for personal enjoyment and sharing.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'The service is provided “as is,” and to the extent permitted by law we limit our liability for damages arising from your use of, or inability to use, the service. This does not exclude liability for damage caused by our willful misconduct or gross negligence.',
        ],
      },
      {
        heading: 'Dispute resolution',
        body: [
          'If a dispute arises we will work with you in good faith to resolve it. Where agreement cannot be reached, mediation is available through the Content Dispute Resolution Committee or the Consumer Dispute Settlement Commission.',
        ],
      },
      {
        heading: 'Changes to these terms',
        body: [
          'When we change these terms we publish the reason, the before-and-after text and the effective date. Ordinary changes are announced 7 days before they take effect, and changes materially disadvantageous to users 30 days before, in a prominent place in the service.',
          'Changed terms apply to use of the service on and after the effective date.',
        ],
      },
      {
        heading: 'Governing law and jurisdiction',
        body: [
          'These terms are governed by and interpreted under the laws of the Republic of Korea, and jurisdiction over disputes arising from use of the service follows applicable law.',
        ],
      },
    ],
  },

  ja: {
    title: '利用規約',
    description: `${BUSINESS.legalName}が運営する星屑サービスおよび守護霊カード先行公開パスに適用される規約です。`,
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_TERMS_VERSION,
    sections: [
      {
        heading: 'サービスについて',
        body: [
          `星屑は無料の占星術解釈と、明日の守護霊カードを一日早く見られる7日間の有料パスを提供し、${BUSINESS.legalName}が運営します。`,
          '今日の守護霊カードは無料です。有料パスは決済時点から168時間、現地日付で明日のカードを先行公開するデジタルコンテンツです。',
        ],
      },
      {
        heading: '用語と契約の成立',
        body: [
          'サービスとは stella.sobok.cc で提供する無料ツールと有料の先行公開機能を指します。',
          '商品名・価格・168時間の利用期間・提供方法・契約解除条件を確認し、必要な同意と決済を完了した時点で契約が成立します。',
          '会員登録なしで購入でき、購入メールとサーバー発行のアクセス権で利用します。定期決済や自動更新の商品ではありません。',
        ],
      },
      {
        heading: '有料サービスと決済',
        body: [
          `守護霊カード先行公開パスは ${PRICE_INTL}（付加価値税込み）の有料デジタルコンテンツです。PortOneを通じたToss Payまたはクレジット・デビットカードで決済します。`,
          '決済通貨は KRW です。海外で発行された決済手段の利用可否は発行会社と決済代行会社の方針により異なり、発行会社が独自の為替レートと海外決済手数料を適用する場合があります。',
        ],
      },
      {
        heading: 'パスとカードの提供',
        body: [
          'パスは決済承認時点から正確に168時間有効です。日付と表示上の満了時刻は利用者の現地時刻を使用し、タイムゾーンを変更しても権利の長さは変わりません。',
          'カードは現地の深夜0時を過ぎて今日のカードになると無料公開されます。パス利用中に見たカードは保管箱に保存されます。',
          '出生チャートがあれば太陽星座と当日の空を、なければ当日の月星座を基準に選びます。出生情報そのものはカード選択のためサーバーへ送信しません。',
          '自己理解・恋愛・仕事・選択のテーマは利用者ごとの順序で循環します。恋愛カードの絵柄は固定ウェイトで選ばれますが、解釈の分量や利用権の価値に差はなく、別途購入して引き直すことはできません。',
          'ゲスト保管箱のメール復旧は決済から1年間、Sobokアカウントに帰属したカードは削除要請またはアカウント削除まで提供します。',
        ],
      },
      {
        heading: '契約解除と返金',
        body: [
          '契約解除と返金は別途のポリシーで定めます。最初の先行カードを開く前は契約解除を申し込めますが、開いた後はデジタルコンテンツの提供開始により制限されることがあります。',
          '表示・広告と異なって履行された場合の法定の権利は維持されます。',
        ],
      },
      {
        heading: '購入資格と年齢確認',
        body: [
          '無料サービスは年齢確認なしで利用できます。有料パスは満14歳以上のみ購入でき、利用者が決済画面で確認します。当社はこの目的で生年月日を収集しません。',
          '未成年者が法定代理人の同意なく結んだ契約は、未成年者本人または法定代理人が取り消すことができます。当社は韓国電子商取引法第13条第3項に従い、この事実を決済画面でも案内します。',
        ],
      },
      {
        heading: '利用者の義務',
        body: [
          '利用者は本人が受信できる正確なメールアドレスを使用し、再閲覧リンクとアクセス権を第三者に公開しないでください。',
          '他人のメールアドレスや決済手段を無断で使用したり、自動化されたリクエスト・迂回・リバースエンジニアリングによりサービスを妨害したり、カードやアクセス権を無断で再販売してはなりません。',
        ],
      },
      {
        heading: '娯楽・参考目的',
        body: [
          '星屑が提供するすべての結果は娯楽と自己理解のための参考情報であり、医学・法律・財務などの専門的助言に代わるものではありません。',
          '守護霊カードと文言は星座と日付を規則により組み合わせたもので、将来の事実を予測または保証しません。',
          '利用者はサービスの内容を重要な意思決定の唯一の根拠としてはならず、サービス利用に伴う判断と責任は利用者本人にあります。',
        ],
      },
      {
        heading: 'サービスの中断',
        body: [
          '当社はセキュリティ対応・システム点検・提供者の障害などやむを得ない事由がある場合、サービスの提供を一時中断することがあります。可能な場合は事前に案内し、緊急時は事後に案内することがあります。',
          'サービスを終了する際は合理的な期間の前に告知し、まだ提供されていない有料コンテンツは返金します。',
        ],
      },
      {
        heading: '広告',
        body: [
          '星屑の無料画面には第三者広告が表示されることがあります。パスの決済・復旧画面には広告を表示しません。',
          '広告を通じて接続される外部サイトのコンテンツと取引に関する責任は、当該サイトにあります。',
        ],
      },
      {
        heading: '知的財産権',
        body: [
          `サービスに含まれるテキスト・デザイン・ロゴ・守護霊カード画像の権利は ${BUSINESS.legalName} または正当な権利者に帰属します。`,
          '利用者は自分に公開されたカードを個人的な鑑賞と共有の範囲で利用できます。',
        ],
      },
      {
        heading: '責任の制限',
        body: [
          'サービスは「現状のまま」提供され、サービスの利用または利用不能により生じた損害について、関係法令が許容する範囲で責任を制限します。ただし当社の故意または重大な過失による損害についての責任は排除しません。',
        ],
      },
      {
        heading: '紛争の解決',
        body: [
          'サービス利用に関して紛争が生じた場合、当社と利用者は誠実に協議して解決します。協議が困難な場合は、コンテンツ紛争調停委員会または消費者紛争調停委員会の調停を利用できます。',
        ],
      },
      {
        heading: '規約の変更',
        body: [
          '規約を変更する場合は、変更理由・変更前後の内容・施行日を公開します。通常の変更は施行7日前に、利用者に重大に不利な変更は施行30日前に、サービスの目立つ位置で告知します。',
          '変更後の規約は施行日以降の利用に適用します。',
        ],
      },
      {
        heading: '準拠法と管轄',
        body: [
          '本規約は大韓民国の法令に従って解釈され適用され、サービス利用により生じた紛争の管轄は関係法令の定めによります。',
        ],
      },
    ],
  },

  zh: {
    title: '服务条款',
    description: `适用于 ${BUSINESS.legalName} 运营的星黛洛服务及守护灵卡片提前查看通行证的条款。`,
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_TERMS_VERSION,
    sections: [
      {
        heading: '关于服务',
        body: [
          `星黛洛提供免费占星解读，以及可提前一天查看明日守护灵卡片的7天付费通行证，由 ${BUSINESS.legalName} 运营。`,
          '今日守护灵卡片免费。付费通行证自付款起168小时内，按用户当地日期提前展示明日卡片。',
        ],
      },
      {
        heading: '定义与合同的成立',
        body: [
          '服务指 stella.sobok.cc 提供的免费工具与付费提前查看功能。',
          '用户确认商品名称、价格、168小时期限、提供方式与撤回条件并完成必要同意和付款后，合同成立。',
          '无需注册即可购买，通过购买邮箱与服务器签发的访问权限使用。本商品不是订阅，也不会自动续费。',
        ],
      },
      {
        heading: '付费服务与结算',
        body: [
          `守护灵卡片提前查看通行证为 ${PRICE_INTL}（含增值税）的数字内容，通过 PortOne 使用 Toss Pay 或信用卡、借记卡付款。`,
          '结算币种为 KRW。境外签发的支付方式能否使用取决于发卡机构与支付代理机构的政策，发卡机构可能适用其汇率与跨境手续费。',
        ],
      },
      {
        heading: '通行证与卡片的提供',
        body: [
          '通行证自付款获批的绝对时点起准确持续168小时。日期与显示的到期时刻采用用户当地时间；更改时区不会改变权益长度。',
          '明日卡片在当地午夜成为今日卡片后免费公开。通行证有效期间查看的卡片会保存到收藏。',
          '有出生星盘时结合太阳星座与当天星空，没有时按当天月亮星座选卡。出生原始信息不会为选卡而发送至服务器。',
          '自我、爱情、工作与选择主题会按每位用户各自的顺序循环。爱情卡片的画面版本按固定权重选择，但不会改变解读篇幅或通行证价值，也不能通过另行付费重新抽取。',
          '访客收藏可在付款后一年内通过邮箱恢复；归属 Sobok 账户的卡片保留至用户申请删除或删除账户。',
        ],
      },
      {
        heading: '撤回与退款',
        body: [
          '撤回与退款由单独政策规定。打开第一张提前公开卡片前可申请撤回；打开后因数字内容已开始提供，撤回权可能受到限制。',
          '若服务与标示或广告不符，法定救济权利不受影响。',
        ],
      },
      {
        heading: '购买资格与年龄确认',
        body: [
          '免费服务无需年龄确认。付费通行证仅限年满14周岁者购买，由用户在结算页面确认。本公司不会为此收集出生日期。',
          '未成年人未经法定代理人同意订立的合同，未成年人本人或其法定代理人可以撤销。依据韩国《电子商务消费者保护法》第 13 条第 3 款，本公司亦在结算页面告知该事项。',
        ],
      },
      {
        heading: '用户义务',
        body: [
          '用户应使用本人可以接收的准确邮箱，且不得向他人公开重新开启链接与访问权限。',
          '不得未经授权使用他人邮箱或支付方式，不得以自动化请求、绕过、逆向工程等方式妨碍服务，亦不得擅自转售卡片或访问权限。',
        ],
      },
      {
        heading: '娱乐与参考目的',
        body: [
          '星黛洛提供的所有结果均为娱乐与自我理解的参考信息，不能替代医学、法律、财务等专业建议。',
          '守护灵卡片与文字是依据规则组合星座和日期的结果，不预测或保证未来事实。',
          '用户不应将服务内容作为重要决策的唯一依据；因使用服务而产生的判断与责任由用户本人承担。',
        ],
      },
      {
        heading: '服务的中断',
        body: [
          '因安全应对、系统维护、供应商故障等不可避免的事由，本公司可临时中断服务提供。可能时事先告知，紧急情况可事后告知。',
          '终止服务时将在合理期限之前告知，并对尚未提供的付费内容予以退款。',
        ],
      },
      {
        heading: '广告',
        body: [
          '星黛洛的免费页面可能展示第三方广告。通行证结算与恢复页面不展示广告。',
          '通过广告链接至的外部网站，其内容与交易由该网站负责。',
        ],
      },
      {
        heading: '知识产权',
        body: [
          `服务所含文本、设计、标识与守护灵卡片图像的权利归 ${BUSINESS.legalName} 或正当权利人所有。`,
          '用户可在个人欣赏与分享范围内使用向自己公开的卡片。',
        ],
      },
      {
        heading: '责任限制',
        body: [
          '服务按“现状”提供，对因使用或无法使用服务而产生的损害，在相关法令允许的范围内限制责任。但不排除因本公司故意或重大过失造成损害的责任。',
        ],
      },
      {
        heading: '争议解决',
        body: [
          '因使用服务发生争议时，本公司与用户应诚信协商解决。协商不成的，可申请内容纠纷调解委员会或消费者纠纷调解委员会调解。',
        ],
      },
      {
        heading: '条款变更',
        body: [
          '变更条款时将公开变更理由、变更前后内容与施行日期。一般变更于施行 7 日前告知，对用户重大不利的变更于施行 30 日前在服务显著位置告知。',
          '变更后的条款适用于施行日之后的使用。',
        ],
      },
      {
        heading: '适用法律与管辖',
        body: ['本条款依据大韩民国法令解释与适用，因使用服务产生争议的管辖依相关法令确定。'],
      },
    ],
  },
}
