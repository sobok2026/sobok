import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_REPORT_NAME } from '../../../worker/guardian/offer'

const NAME_KO = GUARDIAN_REPORT_NAME.ko

/**
 * 개인정보처리방침.
 *
 * The paid report changed what this document has to say. The free tools genuinely never send birth details
 * anywhere — the chart is computed in the browser — and the previous revision said so flatly. That sentence
 * became false the moment a purchase existed: checkout posts the *computed* chart (planet longitudes, angles,
 * house cusps) to the server, because the report is written from it. The raw birth date, time and place still
 * never leave the browser, so the distinction is real and worth stating precisely rather than blurring.
 */
export const PRIVACY: Record<Locale, LegalDoc> = {
  ko: {
    title: '개인정보처리방침',
    description: '별무리(소복)가 이용자의 정보를 어떻게 다루는지 안내합니다.',
    effectiveDate: '2026년 8월 10일',
    updatedDate: '2026년 8월 3일',
    version: '2.0',
    sections: [
      {
        heading: '출생 정보와 브라우저 처리',
        body: [
          '별무리는 별자리 계산을 위해 이용자가 입력한 생년월일, 태어난 시각, 출생지 정보를 사용합니다. 계산은 이용자의 브라우저 안에서 이루어지며, 별무리는 입력 폼의 출생 정보를 별무리 서버에 직접 제출받거나 계정에 저장하지 않습니다.',
          '“이 브라우저에 출생 정보 저장”을 선택하면 출생 정보가 브라우저의 로컬 저장소에 보관됩니다. 선택하지 않으면 현재 탭에서 결과를 이어 보기 위해 세션 저장소에 임시 보관됩니다.',
          `${NAME_KO}를 구매하는 경우는 예외입니다. 리포트를 서버에서 만들어야 하므로 브라우저가 계산한 차트의 결과값이 전송됩니다. 자세한 항목은 아래 “유료 리포트 구매 시 처리하는 정보”에서 안내합니다.`,
        ],
      },
      {
        heading: '유료 리포트 구매 시 처리하는 정보',
        body: [
          `${NAME_KO}를 구매하면 다음 정보가 별무리 서버에 저장됩니다. 구매·재열람용 이메일, 결제대행사가 발급한 결제 식별자와 승인 결과, 브라우저가 계산한 출생 차트의 결과값, 무료 검사와 맞춤 질문의 답변, 이용자가 남긴 선택 메모, 그리고 완성된 카드와 리포트 본문입니다.`,
          '출생 차트의 결과값은 행성의 황경과 역행 여부, 상승점과 중천, 하우스 경계, 태어난 시각을 모르는 경우의 달 황경 범위입니다. 생년월일과 태어난 시각과 출생지 자체는 이 과정에서도 전송되지 않습니다.',
          '처리 목적은 결제 승인과 리포트 생성 그리고 구매 이메일을 통한 재열람 제공입니다. 구매 이메일은 마케팅 발송에 사용하지 않습니다.',
          '결제와 재열람 요청에는 도배와 부정 사용을 막기 위해 접속 IP의 비가역 해시값을 함께 사용합니다. 원본 IP 주소는 저장하지 않습니다.',
        ],
      },
      {
        heading: '유료 리포트 정보의 보관 기간',
        body: [
          '리포트와 답변과 접근 권한은 결제일부터 1년 동안 보관하고 그 뒤에 삭제합니다. 이 기간은 이용자가 구매 이메일로 리포트를 다시 열 수 있는 기간과 같습니다.',
          '재열람 링크는 발송 후 15분 동안 한 번만 사용할 수 있고 사용되거나 만료되면 무효가 됩니다.',
          '전자상거래법에 따라 계약 또는 청약철회 등에 관한 기록은 5년, 대금 결제 및 재화 등의 공급에 관한 기록은 5년, 소비자 불만 또는 분쟁 처리에 관한 기록은 3년 동안 보관합니다.',
          '접속 IP의 해시값은 마지막 활동일로부터 90일이 지나면 삭제합니다.',
        ],
      },
      {
        heading: '개인정보 처리의 위탁',
        body: [
          '별무리는 서비스 제공에 필요한 범위에서 다음과 같이 처리를 위탁합니다. 결제 연동과 승인은 PortOne과 결제대행사에, 데이터베이스는 Supabase에, 서버와 엣지 인프라는 Cloudflare에, 재열람 안내 메일 발송은 Resend에 위탁합니다.',
          '수탁자는 위탁받은 업무 범위에서만 정보를 처리하며, 위탁 내용이 바뀌면 본 방침을 통해 알립니다.',
          '위 수탁자 가운데 일부는 국외에 서버를 두고 있습니다. Cloudflare와 Resend는 미국에, Supabase의 데이터베이스는 대한민국(서울) 리전에 위치합니다. 이전되는 항목과 목적은 위 문단과 같으며 서비스 제공 기간 동안 보유합니다.',
        ],
      },
      {
        heading: '쿠키와 광고',
        body: [
          '별무리는 무료 화면에서 Google AdSense를 통해 광고를 게재합니다. 유료 리포트의 구매 화면과 리포트 화면에는 광고를 게재하지 않습니다.',
          'Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 관심사 기반 광고를 제공할 수 있습니다.',
          '이용자는 https://adssettings.google.com 에서 맞춤 광고를 해제할 수 있으며, https://www.aboutads.info 에서 제3자 사업자의 광고 쿠키를 관리할 수 있습니다. Google의 광고 데이터 처리에 대한 자세한 내용은 https://policies.google.com/technologies/ads 에서 확인할 수 있습니다.',
        ],
      },
      {
        heading: '이용 통계 및 분석',
        body: [
          '별무리는 서비스 개선을 위해 Google 태그 매니저 및 분석 도구를 사용할 수 있습니다. 이 과정에서 방문 페이지, 기기·브라우저 정보, 서비스 내 상호작용, 쿠키 또는 온라인 식별자 등이 각 도구 제공자의 정책에 따라 처리될 수 있습니다.',
          '별무리가 직접 구성하는 분석 이벤트에는 생년월일, 태어난 시각, 출생지를 별도 항목으로 넣지 않습니다. 구매 관련 이벤트에도 구매 이메일을 넣지 않습니다. 다만 공유 결과 URL에는 출생 정보가 포함되며, 아래의 “결과 공유”에 설명한 범위에서 처리될 수 있습니다.',
        ],
      },
      {
        heading: '결과 공유',
        body: [
          '이용자가 링크 공유를 선택하면 결과 재현에 필요한 생년월일, 태어난 시각 또는 시각 미상 여부, 출생지 식별 정보가 URL의 “#” 뒤 프래그먼트에 인코딩되어 포함됩니다. 인코딩은 암호화가 아닙니다.',
          'URI 표준상 프래그먼트는 일반적인 페이지 요청에서 웹 서버로 전송되지 않습니다. 그러나 전체 링크는 이용자가 선택한 공유 대상과 링크를 받은 사람에게 전달되고, 공유 결과 페이지에서 실행되는 스크립트가 접근할 수 있습니다. 공유 대상과 분석·광고 도구는 각자의 정책에 따라 URL을 처리할 수 있습니다.',
          '공유 링크에는 만료나 철회 기능이 없습니다. 신뢰할 수 있는 상대에게만 공유해 주세요. 이미지 공유를 선택하면 생성된 결과 이미지와 공유 문구가 이용자가 선택한 대상으로 전달됩니다.',
        ],
      },
      {
        heading: '브라우저에 저장된 정보의 삭제',
        body: [
          '브라우저에 저장된 출생 정보는 서비스의 “정보 지우기” 기능을 사용하거나 해당 사이트의 저장 데이터를 삭제하면 제거됩니다. 세션 저장소의 임시 정보는 현재 탭의 세션이 끝나면 제거됩니다.',
          '기기에 저장된 정보를 삭제해도 이미 공유한 링크는 무효화되지 않으며, 별무리는 공유 대상이나 링크를 받은 사람이 보관한 사본을 삭제할 수 없습니다.',
        ],
      },
      {
        heading: '익명 댓글 게시판',
        body: [
          '별무리의 별자리별 댓글 게시판은 로그인 없이 이용할 수 있습니다. 게시판을 이용하면 이용자가 입력한 닉네임(선택)과 댓글 내용, 그리고 악용·스팸 방지에만 쓰이는 접속 IP의 비가역 해시값이 별무리 서버에 저장됩니다. 원본 IP 주소는 저장하지 않으며, 생년월일·태어난 시각·출생지 같은 출생 정보는 게시판에 저장되지 않습니다.',
          '수집 목적은 게시판 운영과 도배·스팸·악용 방지입니다. IP 해시값은 마지막 활동일로부터 90일이 지나면 삭제하고, 이용자가 삭제하거나 신고로 숨김 처리된 댓글은 30일이 지나면 완전히 파기합니다.',
          '작성한 댓글은 브라우저에 저장된 삭제 키로 직접 수정하거나 삭제할 수 있습니다. 삭제 키를 잃어버린 경우 문의 이메일로 요청하면 관리자가 삭제를 도와드립니다.',
        ],
      },
      {
        heading: '정보주체의 권리와 행사 방법',
        body: [
          `이용자는 자신의 개인정보에 대해 열람과 정정과 삭제와 처리정지를 요구할 수 있습니다. 구매한 리포트에 관한 요청은 구매에 사용한 이메일과 함께 ${BUSINESS.email} 으로 보내 주세요.`,
          '리포트 삭제를 요청하면 재열람도 함께 중단됩니다. 다만 법령이 보관을 요구하는 결제 기록은 해당 기간 동안 보관합니다.',
        ],
      },
      {
        heading: '개인정보 보호책임자',
        body: [
          `개인정보 보호책임자: ${BUSINESS.privacyOfficer} · ${BUSINESS.email} · ${BUSINESS.phone}`,
          '개인정보 침해에 관한 상담이 필요하면 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118)나 개인정보 분쟁조정위원회(kopico.go.kr, 1833-6972)에 문의할 수 있습니다.',
        ],
      },
      {
        heading: '아동의 개인정보',
        body: [
          '별무리는 특정 연령을 대상으로 개인정보를 수집하기 위한 서비스가 아닙니다. 보호자의 동의가 필요한 경우 관련 법령을 따릅니다.',
          '유료 리포트는 만 14세 이상만 구매할 수 있습니다. 만 14세 미만의 결제 사실을 알게 되면 결제를 취소하고 관련 정보를 삭제합니다.',
        ],
      },
      {
        heading: '방침의 변경',
        body: ['본 방침은 법령이나 서비스 변경에 따라 개정될 수 있으며, 변경 시 본 페이지를 통해 안내합니다.'],
      },
    ],
  },

  en: {
    title: 'Privacy Policy',
    description: 'How Stella (sobok) handles your information.',
    effectiveDate: 'August 10, 2026',
    updatedDate: 'August 3, 2026',
    version: '2.0',
    sections: [
      {
        heading: 'Birth information and in-browser processing',
        body: [
          'Stella uses the birth date, time, and place you enter to calculate your astrological chart. The calculation runs in your browser. Stella does not directly submit the birth details from the form to its server or save them to an account.',
          'If you select “Save details in this browser,” your birth details are kept in the browser’s local storage. Otherwise, they are held temporarily in session storage so you can continue viewing your result in the current tab.',
          'Buying the guardian report is the exception. The report has to be produced on the server, so the values your browser computed from the chart are sent there. The exact fields are listed under “Information processed when you buy the report” below.',
        ],
      },
      {
        heading: 'Information processed when you buy the report',
        body: [
          'When you buy the guardian report, the following is stored on Stella’s server: the email used for purchase and reopening, the payment identifier and approval result issued by the payment processor, the computed values of your birth chart, your answers to the free and tailored questions, any optional note you leave, and the finished cards and report text.',
          'The computed chart values are planetary longitudes and retrograde flags, the ascendant and midheaven, house cusps, and — where the birth time is unknown — the range the Moon moved through. Your birth date, birth time and birthplace themselves are still not transmitted.',
          'This is processed to take payment, produce the report, and let you reopen it from the purchase email. The purchase email is not used for marketing.',
          'Checkout and reopen requests also use a one-way hash of your connecting IP address to prevent flooding and abuse. The raw IP address is not stored.',
        ],
      },
      {
        heading: 'Retention of purchase data',
        body: [
          'The report, your answers and the access grant are retained for one year from the payment date and then deleted. That is the same period during which you can reopen the report from the purchase email.',
          'A reopen link is usable once within 15 minutes of being sent, and is void once used or expired.',
          'Under Korean e-commerce law we retain records of contracts and withdrawals for 5 years, records of payment and supply for 5 years, and records of consumer complaints or disputes for 3 years.',
          'IP address hashes are deleted 90 days after the last activity.',
        ],
      },
      {
        heading: 'Processing entrusted to others',
        body: [
          'Stella entrusts processing to the following, only as far as running the service requires: PortOne and its payment processor for payment integration and approval, Supabase for the database, Cloudflare for server and edge infrastructure, and Resend for reopen notification email.',
          'Each processes data only within the scope entrusted to it, and we announce any change to these arrangements in this policy.',
          'Some of these operate servers outside Korea: Cloudflare and Resend in the United States, while the Supabase database is in the Korea (Seoul) region. The categories and purposes transferred are those described above, retained for as long as the service is provided.',
        ],
      },
      {
        heading: 'Cookies and advertising',
        body: [
          'Stella shows ads through Google AdSense on its free screens. No ads are shown on the purchase screens or on the report itself.',
          'Third-party vendors, including Google, may use cookies to serve interest-based ads based on your prior visits to this and other sites.',
          'You can opt out of personalized advertising at https://adssettings.google.com, and manage third-party advertising cookies at https://www.aboutads.info. Learn more about how Google uses advertising data at https://policies.google.com/technologies/ads.',
        ],
      },
      {
        heading: 'Usage analytics',
        body: [
          'Stella may use Google Tag Manager and analytics tools to improve the service. Pages viewed, device and browser information, interactions within the service, cookies, or online identifiers may be processed under each provider’s policy.',
          'The custom analytics events configured by Stella do not add your birth date, birth time, or birthplace as separate event fields, and purchase events do not carry the purchase email. A shared-result URL does contain birth details and may be processed as described under “Sharing results” below.',
        ],
      },
      {
        heading: 'Sharing results',
        body: [
          'When you choose link sharing, the birth date, birth time or unknown-time status, and birthplace identifier needed to reproduce the result are encoded in the URL fragment after “#”. Encoding is not encryption.',
          'Under the URI standard, a fragment is not sent to the web server in a normal page request. The complete link is still delivered to the share target you choose and to anyone who receives it, and scripts running on the shared-result page can access it. Share targets and analytics or advertising tools may process the URL under their own policies.',
          'Shared links do not expire and cannot be revoked. Share only with people or services you trust. If you choose image sharing, the generated result image and accompanying share text are delivered to the target you select.',
        ],
      },
      {
        heading: 'Deleting data held in your browser',
        body: [
          'Birth details saved in the browser are removed when you use “Delete saved” in the service or clear the site’s stored data. Temporary session-storage details are removed when the current tab session ends.',
          'Deleting details from your device does not invalidate links you already shared, and Stella cannot delete copies retained by a share target or recipient.',
        ],
      },
      {
        heading: 'Anonymous comment board',
        body: [
          'Stella’s per-placement comment boards can be used without an account. When you post, the nickname you choose (optional) and the comment text are stored on Stella’s server, together with a one-way hash of your connecting IP address used only to prevent spam and abuse. The raw IP address is not stored, and birth details (date, time, place) are never stored with a comment.',
          'This data is collected to run the board and to prevent flooding, spam, and abuse. The IP hash is deleted 90 days after your last activity, and comments you delete — or that are hidden after reports — are permanently removed 30 days later.',
          'You can edit or delete your own comments with a delete key kept in your browser. If you lose it, contact us and an operator can remove the comment for you.',
        ],
      },
      {
        heading: 'Your rights and how to exercise them',
        body: [
          `You may request access to, correction of, deletion of, or suspension of processing of your personal data. For anything concerning a purchased report, write to ${BUSINESS.email} from or quoting the email used for the purchase.`,
          'Deleting a report also ends the ability to reopen it. Payment records that law requires us to keep are retained for the applicable period.',
        ],
      },
      {
        heading: 'Privacy officer',
        body: [
          `Privacy officer: ${BUSINESS.privacyOfficer} · ${BUSINESS.email} · ${BUSINESS.phone}`,
          'For advice on a privacy complaint you may also contact the Korea Internet & Security Agency’s privacy centre (privacy.kisa.or.kr, 118) or the Personal Information Dispute Mediation Committee (kopico.go.kr, 1833-6972).',
        ],
      },
      {
        heading: "Children's privacy",
        body: [
          'Stella is not directed at collecting personal information from any specific age group. Where guardian consent is required, we follow applicable law.',
          'The paid report may be purchased only by people aged 14 or over. If we learn of a purchase by someone under 14, we cancel the payment and delete the associated data.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: [
          'We may update this policy to reflect changes in law or the service, and will post any changes on this page.',
        ],
      },
    ],
  },

  ja: {
    title: 'プライバシーポリシー',
    description: '星屑（sobok）が利用者の情報をどのように扱うかについてご案内します。',
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '2.0',
    sections: [
      {
        heading: '出生情報とブラウザ内での処理',
        body: [
          '星屑は星座を計算するために、利用者が入力した生年月日・出生時刻・出生地の情報を使用します。計算は利用者のブラウザ内で行われ、星屑は入力フォームの出生情報を星屑のサーバーへ直接送信したり、アカウントに保存したりしません。',
          '「このブラウザに出生情報を保存」を選ぶと、出生情報はブラウザのローカルストレージに保存されます。選ばない場合は、現在のタブで結果を続けて表示するため、セッションストレージに一時保存されます。',
          '星座守護霊レポートを購入する場合は例外です。レポートをサーバーで作成する必要があるため、ブラウザが計算したチャートの結果値が送信されます。詳しい項目は下記「有料レポート購入時に処理する情報」でご案内します。',
        ],
      },
      {
        heading: '有料レポート購入時に処理する情報',
        body: [
          '星座守護霊レポートを購入すると、次の情報が星屑のサーバーに保存されます。購入・再閲覧用のメールアドレス、決済代行会社が発行した決済識別子と承認結果、ブラウザが計算した出生チャートの結果値、無料診断と個別質問の回答、利用者が残した任意のメモ、そして完成したカードとレポート本文です。',
          '出生チャートの結果値とは、惑星の黄経と逆行の有無、アセンダントとMC、ハウスの境界、出生時刻が不明な場合の月の黄経の範囲です。生年月日・出生時刻・出生地そのものは、この過程でも送信されません。',
          '処理の目的は、決済の承認、レポートの作成、購入時のメールアドレスによる再閲覧の提供です。購入時のメールアドレスをマーケティング配信に使用することはありません。',
          '決済と再閲覧のリクエストでは、荒らしや不正利用を防ぐために接続元IPアドレスの不可逆ハッシュ値を併用します。生のIPアドレスは保存しません。',
        ],
      },
      {
        heading: '購入情報の保存期間',
        body: [
          'レポート・回答・アクセス権は決済日から1年間保存し、その後削除します。この期間は、利用者が購入時のメールアドレスでレポートを再度開ける期間と同じです。',
          '再閲覧リンクは送信から15分間に1回だけ使用でき、使用済みまたは期限切れになると無効になります。',
          '韓国電子商取引法に基づき、契約または契約解除等に関する記録は5年、代金決済および財貨等の供給に関する記録は5年、消費者の苦情または紛争処理に関する記録は3年間保存します。',
          '接続元IPアドレスのハッシュ値は、最終利用日から90日を過ぎると削除します。',
        ],
      },
      {
        heading: '個人情報処理の委託',
        body: [
          '星屑はサービス提供に必要な範囲で次のとおり処理を委託します。決済連携と承認は PortOne および決済代行会社へ、データベースは Supabase へ、サーバーとエッジ基盤は Cloudflare へ、再閲覧案内メールの送信は Resend へ委託します。',
          '受託者は委託された業務の範囲でのみ情報を処理し、委託内容が変わる場合は本ポリシーでお知らせします。',
          '上記のうち一部は国外にサーバーを置いています。Cloudflare と Resend は米国、Supabase のデータベースは大韓民国（ソウル）リージョンに所在します。移転される項目と目的は上記の段落のとおりで、サービス提供期間中保有します。',
        ],
      },
      {
        heading: 'Cookieと広告',
        body: [
          '星屑は無料画面において Google AdSense を通じて広告を表示します。有料レポートの購入画面とレポート画面には広告を表示しません。',
          'Googleを含む第三者配信事業者は、Cookieを使用して、利用者の過去の閲覧履歴に基づく関心に応じた広告を配信することがあります。',
          '利用者は https://adssettings.google.com でパーソナライズ広告を無効にでき、https://www.aboutads.info で第三者事業者の広告Cookieを管理できます。Googleによる広告データの利用について詳しくは https://policies.google.com/technologies/ads をご覧ください。',
        ],
      },
      {
        heading: '利用状況の分析',
        body: [
          '星屑はサービス改善のためにGoogleタグマネージャーおよび分析ツールを使用することがあります。この際、閲覧ページ、端末・ブラウザ情報、サービス内での操作、Cookieまたはオンライン識別子などが、各提供者のポリシーに従って処理される場合があります。',
          '星屑が独自に設定する分析イベントには、生年月日・出生時刻・出生地を個別の項目として追加せず、購入関連のイベントにも購入時のメールアドレスを含めません。ただし共有結果のURLには出生情報が含まれ、下記「結果の共有」に記載する範囲で処理される場合があります。',
        ],
      },
      {
        heading: '結果の共有',
        body: [
          'リンク共有を選ぶと、結果の再現に必要な生年月日、出生時刻または時刻不明の状態、出生地の識別情報がURLの「#」以降のフラグメントにエンコードされます。エンコードは暗号化ではありません。',
          'URI標準上、フラグメントは通常のページリクエストでウェブサーバーへ送信されません。ただし完全なリンクは選択した共有先とリンクを受け取った人へ渡り、共有結果ページで動作するスクリプトからもアクセスできます。共有先や分析・広告ツールは、それぞれのポリシーに従ってURLを処理する場合があります。',
          '共有リンクに有効期限や取り消し機能はありません。信頼できる相手やサービスにのみ共有してください。画像共有を選ぶと、生成された結果画像と共有文が選択した共有先へ渡ります。',
        ],
      },
      {
        heading: 'ブラウザに保存された情報の削除',
        body: [
          'ブラウザに保存された出生情報は、サービスの「情報を削除」を使うか、このサイトの保存データを削除すると消去されます。セッションストレージの一時情報は、現在のタブのセッションが終了すると消去されます。',
          '端末上の情報を削除しても、すでに共有したリンクは無効になりません。星屑は、共有先や受信者が保持するコピーを削除できません。',
        ],
      },
      {
        heading: '匿名コメント掲示板',
        body: [
          '星屑の星位ごとのコメント掲示板は、ログインなしで利用できます。投稿すると、任意で入力したニックネームとコメント本文、そして不正利用の防止のみに用いる接続元IPアドレスの不可逆ハッシュ値がサーバーに保存されます。生のIPアドレスは保存せず、生年月日・出生時刻・出生地などの出生情報は掲示板に保存されません。',
          '収集の目的は、掲示板の運営と、荒らし・スパム・不正利用の防止です。IPハッシュ値は最終利用日から90日を過ぎると削除し、利用者が削除したコメントや通報により非表示となったコメントは、30日を過ぎると完全に消去します。',
          '投稿したコメントは、ブラウザに保存された削除キーで自分で編集・削除できます。削除キーを紛失した場合は、お問い合わせ先へご連絡いただければ運営者が削除に対応します。',
        ],
      },
      {
        heading: '情報主体の権利と行使方法',
        body: [
          `利用者は自身の個人情報について、閲覧・訂正・削除・処理停止を求めることができます。購入したレポートに関するご請求は、購入に使用したメールアドレスとともに ${BUSINESS.email} へお送りください。`,
          'レポートの削除を請求すると再閲覧も停止します。ただし法令が保存を求める決済記録は、当該期間中保存します。',
        ],
      },
      {
        heading: '個人情報保護責任者',
        body: [
          `個人情報保護責任者: ${BUSINESS.privacyOfficer} · ${BUSINESS.email} · ${BUSINESS.phone}`,
          '個人情報の侵害に関する相談が必要な場合は、個人情報侵害申告センター（privacy.kisa.or.kr、局番なし118）または個人情報紛争調停委員会（kopico.go.kr、1833-6972）にお問い合わせいただけます。',
        ],
      },
      {
        heading: '子どものプライバシー',
        body: [
          '星屑は特定の年齢層から個人情報を収集することを目的としたサービスではありません。保護者の同意が必要な場合は関連法令に従います。',
          '有料レポートは満14歳以上のみ購入できます。満14歳未満による決済を把握した場合は、決済を取り消し、関連情報を削除します。',
        ],
      },
      {
        heading: 'ポリシーの変更',
        body: ['本ポリシーは法令やサービスの変更に応じて改定されることがあり、変更時は本ページでお知らせします。'],
      },
    ],
  },

  zh: {
    title: '隐私政策',
    description: '说明 星黛洛（sobok）如何处理您的信息。',
    effectiveDate: '2026年8月10日',
    updatedDate: '2026年8月3日',
    version: '2.0',
    sections: [
      {
        heading: '出生信息与浏览器内处理',
        body: [
          '星黛洛使用您输入的出生日期、出生时间和出生地点来计算星盘。计算在您的浏览器内完成；星黛洛不会把输入表单中的出生信息直接提交到星黛洛的服务器，也不会将其保存到账号中。',
          '如果选择“在此浏览器保存出生信息”，出生信息会保存在浏览器的本地存储中；如果不选择，则会临时保存在会话存储中，以便您在当前标签页继续查看结果。',
          '购买星座守护灵报告属于例外。报告需要在服务器端生成，因此浏览器计算出的星盘结果值会被发送到服务器。具体项目见下文“购买付费报告时处理的信息”。',
        ],
      },
      {
        heading: '购买付费报告时处理的信息',
        body: [
          '购买星座守护灵报告后，以下信息会保存在星黛洛的服务器上：用于购买与重新开启的邮箱、支付代理机构签发的支付标识与授权结果、浏览器计算出的出生星盘结果值、免费测试与个性化问题的答案、您留下的可选备注，以及生成的卡片与报告正文。',
          '出生星盘的结果值指行星黄经与逆行状态、上升点与中天、宫位分界，以及出生时间未知时月亮所处的黄经区间。出生日期、出生时间与出生地点本身在此过程中同样不会被发送。',
          '处理目的为完成支付授权、生成报告，以及通过购买邮箱提供重新开启功能。购买邮箱不用于营销发送。',
          '支付与重新开启请求会同时使用连接 IP 的不可逆哈希值，以防止刷屏与滥用。原始 IP 地址不会被保存。',
        ],
      },
      {
        heading: '购买信息的保存期限',
        body: [
          '报告、答案与访问权限自付款之日起保存一年，此后删除。该期限与您可凭购买邮箱重新打开报告的期限相同。',
          '重新开启链接自发送起 15 分钟内仅可使用一次，使用后或过期即失效。',
          '依据韩国电子商务法，合同或撤回等相关记录保存 5 年，货款结算与商品供应相关记录保存 5 年，消费者投诉或纠纷处理记录保存 3 年。',
          '连接 IP 的哈希值在最后活动日起 90 天后删除。',
        ],
      },
      {
        heading: '个人信息处理的委托',
        body: [
          '星黛洛在提供服务所必需的范围内委托如下处理：支付对接与授权委托 PortOne 及支付代理机构，数据库委托 Supabase，服务器与边缘基础设施委托 Cloudflare，重新开启通知邮件的发送委托 Resend。',
          '受托方仅在受托业务范围内处理信息；委托内容变更时将通过本政策告知。',
          '上述部分受托方的服务器位于境外：Cloudflare 与 Resend 位于美国，Supabase 数据库位于大韩民国（首尔）区域。转移的项目与目的同上述段落，在服务提供期间保有。',
        ],
      },
      {
        heading: 'Cookie 与广告',
        body: [
          '星黛洛在免费页面通过 Google AdSense 展示广告。付费报告的购买页面与报告页面不展示广告。',
          '包括 Google 在内的第三方供应商可能会使用 Cookie，根据您以往的访问记录投放基于兴趣的广告。',
          '您可以在 https://adssettings.google.com 关闭个性化广告，并在 https://www.aboutads.info 管理第三方供应商的广告 Cookie。有关 Google 如何使用广告数据的更多信息，请访问 https://policies.google.com/technologies/ads。',
        ],
      },
      {
        heading: '使用分析',
        body: [
          '星黛洛可能使用 Google 跟踪代码管理器和分析工具来改进服务。访问页面、设备与浏览器信息、服务内操作、Cookie 或在线标识符等，可能会按照各工具提供方的政策进行处理。',
          '星黛洛自行配置的分析事件不会把出生日期、出生时间或出生地点作为单独的事件字段加入，购买相关事件中也不包含购买邮箱。不过，共享结果的 URL 中包含出生信息，并可能按下文“结果分享”所述方式被处理。',
        ],
      },
      {
        heading: '结果分享',
        body: [
          '选择链接分享时，重现结果所需的出生日期、出生时间或时间未知状态，以及出生地点标识信息，会被编码在 URL 中“#”之后的片段里。编码不等于加密。',
          '根据 URI 标准，片段不会在普通页面请求中发送给网页服务器。但完整链接仍会传递给您选择的分享目标和收到链接的人，并且共享结果页面中运行的脚本也可以访问它。分享目标以及分析或广告工具可能会按照各自的政策处理该 URL。',
          '共享链接不会过期，也无法撤回。请只分享给您信任的人或服务。选择图片分享时，生成的结果图片和分享文案会传递给您选择的分享目标。',
        ],
      },
      {
        heading: '浏览器内信息的删除',
        body: [
          '浏览器内保存的出生信息会在您使用服务中的“删除信息”功能，或清除本网站的存储数据时被移除。会话存储中的临时信息会在当前标签页会话结束时被移除。',
          '删除设备上的信息不会使已分享的链接失效；星黛洛也无法删除分享目标或收件人保留的副本。',
        ],
      },
      {
        heading: '匿名评论板',
        body: [
          '星黛洛的各星位评论板无需登录即可使用。发布时，您填写的昵称（可选）和评论内容，以及仅用于防止滥用与垃圾信息的连接 IP 的不可逆哈希值，会保存在星黛洛的服务器上。原始 IP 地址不会被保存，出生日期、出生时间、出生地点等出生信息也不会随评论一起保存。',
          '收集目的为运营评论板并防止刷屏、垃圾信息与滥用。IP 哈希值会在最后活动日起 90 天后删除；您删除的评论，或因举报而被隐藏的评论，将在 30 天后被永久清除。',
          '您可以使用保存在浏览器中的删除密钥自行编辑或删除自己的评论。若丢失该密钥，可通过联系邮箱请求管理员协助删除。',
        ],
      },
      {
        heading: '信息主体的权利与行使方式',
        body: [
          `用户可就本人的个人信息请求查阅、更正、删除与停止处理。与已购报告相关的请求，请附购买所用邮箱发送至 ${BUSINESS.email}。`,
          '请求删除报告的同时也会终止重新开启功能。但法令要求保存的支付记录，将在相应期限内保存。',
        ],
      },
      {
        heading: '个人信息保护负责人',
        body: [
          `个人信息保护负责人：${BUSINESS.privacyOfficer} · ${BUSINESS.email} · ${BUSINESS.phone}`,
          '如需就个人信息侵害进行咨询，可联系个人信息侵害举报中心（privacy.kisa.or.kr，免区号 118）或个人信息纠纷调解委员会（kopico.go.kr，1833-6972）。',
        ],
      },
      {
        heading: '儿童隐私',
        body: [
          '星黛洛并非旨在面向特定年龄群体收集个人信息。在需要监护人同意的情况下，我们将遵守适用法律。',
          '付费报告仅限年满 14 周岁者购买。如获悉未满 14 周岁者完成付款，我们将取消该笔支付并删除相关信息。',
        ],
      },
      {
        heading: '政策变更',
        body: ['我们可能会根据法律或服务的变化更新本政策，并在本页面公布任何变更。'],
      },
    ],
  },
}
