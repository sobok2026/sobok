import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_REPORT_NAME, GUARDIAN_REPORT_PRICE } from '../../../worker/guardian/offer'

// The contract names the product and the price, so it reads both from the constants the checkout charges and
// the PortOne 결제창 prints. 전자상거래법 제13조 제2항 제2호·제3호 make each a pre-contract disclosure, and a
// literal here would be a second copy free to drift from the number the buyer is actually charged.
// The report settles in KRW in every locale — there is one market — so a non-Korean contract has to name the
// same KRW figure rather than a converted one the buyer will never be charged.
const NAME_KO = GUARDIAN_REPORT_NAME.ko
const PRICE_KO = `${GUARDIAN_REPORT_PRICE.toLocaleString('ko-KR')}원`
const PRICE_INTL = `KRW ${GUARDIAN_REPORT_PRICE.toLocaleString('en-US')}`

export const TERMS: Record<Locale, LegalDoc> = {
  ko: {
    title: '이용약관',
    description: `로빈리뷰가 운영하는 별무리 서비스와 ${NAME_KO} 이용에 적용되는 약관입니다.`,
    effectiveDate: '2026년 8월 10일',
    updatedDate: '2026년 8월 3일',
    version: '2.0',
    sections: [
      {
        heading: '서비스 소개',
        body: [
          `별무리는 생년월일 등 이용자가 입력한 정보를 바탕으로 별자리와 운세 해석을 무료로 제공하고 ${NAME_KO}를 유료로 함께 제공하는 서비스이며 ${BUSINESS.legalName}이 운영합니다.`,
          '무료 해석은 브라우저에서 계산해 바로 보여 주는 참고용 도구입니다. 유료 리포트는 출생 차트와 이용자의 답변을 함께 읽어 네 장의 카드와 본문을 만들어 주는 디지털 콘텐츠입니다.',
        ],
      },
      {
        heading: '용어와 계약의 성립',
        body: [
          '서비스는 stella.sobok.cc에서 제공하는 무료 도구와 유료 리포트 기능을 뜻하고 리포트는 결제 후 만들어지는 디지털 콘텐츠를 뜻합니다.',
          '이용자가 결제 화면에서 상품명과 가격과 제공 방식과 청약철회 조건을 확인하고 필수 동의를 마친 뒤 결제를 완료하면 리포트 이용 계약이 성립합니다.',
          '회원가입 절차는 없습니다. 구매에 사용한 이메일과 서버가 발급한 접근 권한으로 리포트를 제공합니다. 정기결제나 자동 갱신 상품이 아닙니다.',
        ],
      },
      {
        heading: '유료 서비스와 결제',
        body: [
          `${NAME_KO}는 ${PRICE_KO}(부가가치세 포함)의 유료 디지털 콘텐츠입니다. 결제수단은 PortOne을 통해 연결되는 토스페이 간편결제이며 이용자는 승인 전 화면에 표시된 최종 금액을 확인해야 합니다.`,
          '결제 통화는 KRW입니다. 해외에서 발급한 결제수단의 사용 가능 여부는 발급사와 결제대행사의 정책에 따라 달라질 수 있고 발급사가 환율과 해외 결제 수수료를 적용할 수 있습니다.',
        ],
      },
      {
        heading: '리포트의 제공',
        body: [
          '결제를 마치면 핵심 12문항과 답변에 따라 이어지는 4~8문항의 맞춤 질문이 제공됩니다. 답변은 한 문항씩 저장되므로 중간에 나갔다가 이어서 답할 수 있습니다.',
          '모든 답이 모이면 회사는 출생 차트와 답변을 함께 읽어 네 장의 카드와 본문을 만듭니다. 사랑 카드에는 정해진 확률에 따라 네 희귀도 중 하나가 적용되며 카드의 희귀도는 본문의 분량이나 내용을 바꾸지 않습니다.',
          '리포트는 내려받는 파일이 아니라 웹 화면으로 제공합니다. 자바스크립트를 켠 최신 브라우저가 필요하고 따로 설치할 프로그램은 없습니다.',
          '리포트와 이메일 재열람은 결제일부터 1년 동안 제공합니다. 구매 이메일을 입력하면 15분 동안 한 번만 쓸 수 있는 링크를 보내 드립니다. 1년이 지나면 리포트와 답변과 접근 권한을 삭제하므로 그 뒤의 복구는 보장하지 않습니다.',
        ],
      },
      {
        heading: '청약철회와 환불',
        body: [
          '청약철회와 환불에 관한 사항은 별도의 청약철회·환불 정책에서 정합니다. 요약하면 완성된 리포트를 열기 전에는 언제든 전액 환불되고 리포트를 연 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한됩니다.',
          '다만 표시·광고와 다르게 이행된 경우에는 리포트를 연 뒤에도 법령에 따라 청약철회를 할 수 있습니다.',
        ],
      },
      {
        heading: '구매 자격과 연령 확인',
        body: [
          '무료 서비스는 연령 확인 없이 이용할 수 있습니다. 유료 리포트는 만 14세 이상만 구매할 수 있으며 이용자가 결제 화면에서 직접 확인해야 합니다. 회사는 이 과정에서 생년월일을 수집하지 않습니다.',
          '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있습니다. 회사는 전자상거래법 제13조 제3항에 따라 이 사실을 결제 화면에서도 안내합니다.',
        ],
      },
      {
        heading: '이용자의 의무',
        body: [
          '이용자는 본인이 받을 수 있는 정확한 이메일을 사용하고 재열람 링크와 접근 권한을 다른 사람에게 공개하지 않아야 합니다.',
          '다른 사람의 이메일이나 결제수단을 무단으로 사용하거나 자동화된 요청과 우회와 역공학으로 서비스를 방해하거나 리포트를 무단으로 재판매해서는 안 됩니다.',
        ],
      },
      {
        heading: '오락·참고 목적',
        body: [
          '무료 해석과 유료 리포트를 포함해 별무리가 제공하는 모든 결과는 오락과 자기 이해를 돕기 위한 참고 정보이며 의학·법률·재무 등 전문적인 조언을 대신하지 않습니다.',
          '유료 리포트의 카드와 본문은 출생 차트와 이용자의 답변을 규칙에 따라 해석한 결과이며 미래의 사실을 예측하거나 보장하지 않습니다.',
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
          '별무리의 무료 화면에는 제3자 광고가 표시될 수 있습니다. 유료 리포트의 구매 화면과 리포트 화면에는 광고를 표시하지 않습니다.',
          '광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
        ],
      },
      {
        heading: '지식재산권',
        body: [
          `서비스에 포함된 텍스트와 디자인과 로고와 수호령 카드 이미지와 리포트 본문에 대한 권리는 ${BUSINESS.legalName} 또는 정당한 권리자에게 있으며 무단 복제와 배포를 금지합니다.`,
          '이용자는 자신의 리포트와 카드를 개인적인 감상과 공유의 범위에서 이용할 수 있습니다.',
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
    description: `The terms that apply to Stella and to the guardian report, operated by ${BUSINESS.legalName}.`,
    effectiveDate: 'August 10, 2026',
    updatedDate: 'August 3, 2026',
    version: '2.0',
    sections: [
      {
        heading: 'About the service',
        body: [
          `Stella provides free astrological interpretations based on information you enter, such as your birth date, alongside a paid guardian report. It is operated by ${BUSINESS.legalName}.`,
          'The free interpretations are a reference tool computed in your browser. The paid report is digital content that reads your birth chart together with your answers to produce four cards and a written report.',
        ],
      },
      {
        heading: 'Definitions and formation of the contract',
        body: [
          'The service means the free tools and paid report features offered at stella.sobok.cc. The report means the digital content produced after payment.',
          'The contract for a report is formed when you confirm the product name, price, delivery method and withdrawal terms on the checkout screen, give the required consents, and complete payment.',
          'There is no account registration. The report is delivered through the email used for the purchase and an access grant issued by the server. This is not a subscription or an auto-renewing product.',
        ],
      },
      {
        heading: 'Paid service and payment',
        body: [
          `The guardian report is paid digital content priced at ${PRICE_INTL} including VAT. Payment is taken by Toss Pay through PortOne, and you should confirm the final amount shown before approving.`,
          'Payment is settled in KRW. Whether a payment method issued outside Korea can be used depends on the issuer’s and payment processor’s policies, and the issuer may apply its own exchange rate and cross-border fees.',
        ],
      },
      {
        heading: 'Delivery of the report',
        body: [
          'After payment you are given 12 core questions and a further 4–8 tailored to your answers. Each answer is saved as you give it, so you can leave and continue later.',
          'Once every answer is in, we read your birth chart together with those answers and produce four cards and the written report. The love card is assigned one of four rarities according to published odds; rarity does not change the length or the substance of the report.',
          'The report is delivered as a web page, not a downloadable file. It needs a current browser with JavaScript enabled, and nothing to install.',
          'The report and email-based reopening are available for one year from the payment date. Entering the purchase email sends a link usable once within 15 minutes. After one year the report, the answers and the access grant are deleted, and recovery beyond that point is not guaranteed.',
        ],
      },
      {
        heading: 'Withdrawal and refunds',
        body: [
          'Withdrawal and refunds are governed by the separate Withdrawal & Refund Policy. In short, a full refund is available at any time before you open the finished report, and after you open it the right of withdrawal is limited because the content has been delivered.',
          'Where the report differs from how it was described or advertised, you may withdraw even after opening it, as provided by law.',
        ],
      },
      {
        heading: 'Eligibility and age confirmation',
        body: [
          'The free service can be used without age confirmation. The paid report may be purchased only by people aged 14 or over, confirmed by you at checkout. We do not collect a date of birth for this purpose.',
          'A contract a minor entered into without their legal guardian’s consent may be cancelled by the minor or by the guardian. We also state this at checkout, as required by Article 13(3) of the Act on Consumer Protection in Electronic Commerce.',
        ],
      },
      {
        heading: 'Your obligations',
        body: [
          'Use an email address you can actually receive mail at, and do not disclose reopen links or access grants to others.',
          'Do not use another person’s email or payment method without authorization, interfere with the service through automated requests, circumvention or reverse engineering, or resell a report without authorization.',
        ],
      },
      {
        heading: 'For entertainment and reference',
        body: [
          'Everything Stella produces, free interpretations and paid reports alike, is reference material for entertainment and self-reflection, and is not a substitute for professional medical, legal or financial advice.',
          'The cards and text in a paid report are a rule-based reading of your birth chart and your answers. They do not predict or guarantee future facts.',
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
          'Third-party ads may appear on Stella’s free screens. No ads are shown on the purchase screens or on the report itself.',
          'External sites reached through those ads are responsible for their own content and transactions.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          `Rights to the text, design, logos, guardian card artwork and report content belong to ${BUSINESS.legalName} or their rightful owners, and unauthorized reproduction or distribution is prohibited.`,
          'You may use your own report and cards for personal enjoyment and sharing.',
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
    description: `${BUSINESS.legalName}が運営する星屑サービスおよび星座守護霊レポートの利用に適用される規約です。`,
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '2.0',
    sections: [
      {
        heading: 'サービスについて',
        body: [
          `星屑は生年月日など利用者が入力した情報をもとに星座と運勢の解釈を無料で提供し、あわせて星座守護霊レポートを有料で提供するサービスであり、${BUSINESS.legalName}が運営します。`,
          '無料の解釈はブラウザ内で計算してその場に表示する参考用ツールです。有料レポートは出生チャートと利用者の回答をあわせて読み、4枚のカードと本文を作成するデジタルコンテンツです。',
        ],
      },
      {
        heading: '用語と契約の成立',
        body: [
          'サービスとは stella.sobok.cc で提供する無料ツールと有料レポート機能を指し、レポートとは決済後に作成されるデジタルコンテンツを指します。',
          '利用者が決済画面で商品名・価格・提供方法・契約解除の条件を確認し、必要な同意を行ったうえで決済を完了した時点で、レポート利用契約が成立します。',
          '会員登録の手続きはありません。購入に使用したメールアドレスとサーバーが発行するアクセス権によりレポートを提供します。定期決済や自動更新の商品ではありません。',
        ],
      },
      {
        heading: '有料サービスと決済',
        body: [
          `星座守護霊レポートは ${PRICE_INTL}（付加価値税込み）の有料デジタルコンテンツです。決済手段は PortOne を通じて接続されるトスペイ簡単決済であり、利用者は承認前に画面に表示される最終金額を確認してください。`,
          '決済通貨は KRW です。海外で発行された決済手段の利用可否は発行会社と決済代行会社の方針により異なり、発行会社が独自の為替レートと海外決済手数料を適用する場合があります。',
        ],
      },
      {
        heading: 'レポートの提供',
        body: [
          '決済が完了すると、共通の12問と回答に応じて続く4〜8問の個別質問が提供されます。回答は1問ごとに保存されるため、途中で離れても続きから回答できます。',
          'すべての回答が揃うと、当社は出生チャートと回答をあわせて読み、4枚のカードと本文を作成します。ラブカードには公開された確率に従って4段階のレア度のいずれかが適用されますが、レア度が本文の分量や内容を変えることはありません。',
          'レポートはダウンロードするファイルではなくウェブ画面として提供します。JavaScript を有効にした最新のブラウザが必要で、別途インストールするプログラムはありません。',
          'レポートとメールによる再閲覧は決済日から1年間提供します。購入時のメールアドレスを入力すると、15分間に1回だけ使用できるリンクをお送りします。1年を過ぎるとレポート・回答・アクセス権を削除するため、それ以降の復旧は保証しません。',
        ],
      },
      {
        heading: '契約解除と返金',
        body: [
          '契約解除と返金に関する事項は別途の契約解除・返金ポリシーで定めます。要約すると、完成したレポートを開く前はいつでも全額返金され、レポートを開いた後はデジタルコンテンツの性質上、契約解除が制限されます。',
          'ただし表示・広告と異なって履行された場合は、レポートを開いた後でも法令に従い契約解除ができます。',
        ],
      },
      {
        heading: '購入資格と年齢確認',
        body: [
          '無料サービスは年齢確認なしで利用できます。有料レポートは満14歳以上のみ購入でき、利用者が決済画面で自ら確認します。当社はこの過程で生年月日を収集しません。',
          '未成年者が法定代理人の同意なく結んだ契約は、未成年者本人または法定代理人が取り消すことができます。当社は韓国電子商取引法第13条第3項に従い、この事実を決済画面でも案内します。',
        ],
      },
      {
        heading: '利用者の義務',
        body: [
          '利用者は本人が受信できる正確なメールアドレスを使用し、再閲覧リンクとアクセス権を第三者に公開しないでください。',
          '他人のメールアドレスや決済手段を無断で使用したり、自動化されたリクエスト・迂回・リバースエンジニアリングによりサービスを妨害したり、レポートを無断で再販売してはなりません。',
        ],
      },
      {
        heading: '娯楽・参考目的',
        body: [
          '無料の解釈と有料レポートを含め、星屑が提供するすべての結果は娯楽と自己理解を助けるための参考情報であり、医学・法律・財務などの専門的助言に代わるものではありません。',
          '有料レポートのカードと本文は出生チャートと利用者の回答を規則に従って解釈した結果であり、将来の事実を予測または保証するものではありません。',
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
          '星屑の無料画面には第三者の広告が表示されることがあります。有料レポートの購入画面とレポート画面には広告を表示しません。',
          '広告を通じて接続される外部サイトのコンテンツと取引に関する責任は、当該サイトにあります。',
        ],
      },
      {
        heading: '知的財産権',
        body: [
          `サービスに含まれるテキスト・デザイン・ロゴ・守護霊カード画像・レポート本文に関する権利は ${BUSINESS.legalName} または正当な権利者に帰属し、無断複製と配布を禁止します。`,
          '利用者は自身のレポートとカードを個人的な鑑賞と共有の範囲で利用できます。',
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
    description: `适用于 ${BUSINESS.legalName} 运营的星黛洛服务及星座守护灵报告的条款。`,
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '2.0',
    sections: [
      {
        heading: '关于服务',
        body: [
          `星黛洛根据用户输入的出生日期等信息免费提供星座与运势解读，同时以付费方式提供星座守护灵报告，由 ${BUSINESS.legalName} 运营。`,
          '免费解读是在浏览器内计算并即时显示的参考工具。付费报告是结合出生星盘与用户答案生成四张卡片与正文的数字内容。',
        ],
      },
      {
        heading: '定义与合同的成立',
        body: [
          '服务指 stella.sobok.cc 提供的免费工具与付费报告功能；报告指付款后生成的数字内容。',
          '用户在结算页面确认商品名称、价格、提供方式与撤回条件，完成必要同意并付款后，报告使用合同即告成立。',
          '无需注册会员。报告通过购买所用邮箱与服务器签发的访问权限提供。本商品并非定期付款或自动续费商品。',
        ],
      },
      {
        heading: '付费服务与结算',
        body: [
          `星座守护灵报告为价格 ${PRICE_INTL}（含增值税）的付费数字内容。支付方式为通过 PortOne 接入的 Toss Pay 便捷支付，用户应在授权前确认页面显示的最终金额。`,
          '结算币种为 KRW。境外签发的支付方式能否使用取决于发卡机构与支付代理机构的政策，发卡机构可能适用其汇率与跨境手续费。',
        ],
      },
      {
        heading: '报告的提供',
        body: [
          '付款完成后会提供 12 道核心问题，以及根据答案继续的 4~8 道个性化问题。答案逐题保存，中途离开也可继续作答。',
          '全部答案齐备后，本公司结合出生星盘与答案生成四张卡片与正文。爱情卡片按公示概率获得四种稀有度之一，稀有度不会改变正文的篇幅或内容。',
          '报告以网页形式提供，并非可下载的文件。需要启用 JavaScript 的最新浏览器，无需另行安装程序。',
          '报告与邮箱重新开启服务自付款之日起提供一年。输入购买邮箱后会发送 15 分钟内仅可使用一次的链接。满一年后将删除报告、答案与访问权限，此后不保证恢复。',
        ],
      },
      {
        heading: '撤回与退款',
        body: [
          '撤回与退款事项由单独的《撤回与退款政策》规定。概要而言，在打开已完成的报告之前可随时全额退款；打开报告之后，因数字内容的性质，撤回权受到限制。',
          '但若履行与标示·广告不符，用户在打开报告后仍可依法撤回。',
        ],
      },
      {
        heading: '购买资格与年龄确认',
        body: [
          '免费服务无需年龄确认即可使用。付费报告仅限年满 14 周岁者购买，由用户在结算页面自行确认。本公司在此过程中不收集出生日期。',
          '未成年人未经法定代理人同意订立的合同，未成年人本人或其法定代理人可以撤销。依据韩国《电子商务消费者保护法》第 13 条第 3 款，本公司亦在结算页面告知该事项。',
        ],
      },
      {
        heading: '用户义务',
        body: [
          '用户应使用本人可以接收的准确邮箱，且不得向他人公开重新开启链接与访问权限。',
          '不得未经授权使用他人邮箱或支付方式，不得以自动化请求、绕过、逆向工程等方式妨碍服务，亦不得擅自转售报告。',
        ],
      },
      {
        heading: '娱乐与参考目的',
        body: [
          '包括免费解读与付费报告在内，星黛洛提供的所有结果均为帮助娱乐与自我理解的参考信息，不能替代医学、法律、财务等专业建议。',
          '付费报告的卡片与正文是依据规则对出生星盘与用户答案所作的解读，不预测亦不保证未来事实。',
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
          '星黛洛的免费页面可能展示第三方广告。付费报告的购买页面与报告页面不展示广告。',
          '通过广告链接至的外部网站，其内容与交易由该网站负责。',
        ],
      },
      {
        heading: '知识产权',
        body: [
          `服务所含文本、设计、标识、守护灵卡片图像与报告正文的权利归 ${BUSINESS.legalName} 或正当权利人所有，禁止擅自复制与分发。`,
          '用户可在个人欣赏与分享的范围内使用自己的报告与卡片。',
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
