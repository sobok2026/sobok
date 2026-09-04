import { BUSINESS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'
import type { LegalDoc } from '@sobok/site-chrome/legal-doc-article'
import { GUARDIAN_PASS_PRIVACY_VERSION } from '../../../worker/guardian/offer'

/**
 * 개인정보처리방침.
 *
 * Birth details stay browser-local. Daily-card requests send only the already-derived sign/basis, local date,
 * time zone, selected tone, and a random browser identifier; paid archive and payment data are documented
 * separately below.
 */
export const PRIVACY: Record<Locale, LegalDoc> = {
  ko: {
    title: '개인정보처리방침',
    description: '별무리(소복)가 이용자의 정보를 어떻게 다루는지 안내합니다.',
    effectiveDate: '2026년 9월 4일',
    updatedDate: '2026년 9월 4일',
    version: GUARDIAN_PASS_PRIVACY_VERSION,
    sections: [
      {
        heading: '출생 정보와 브라우저 처리',
        body: [
          '별무리는 별자리 계산을 위해 이용자가 입력한 생년월일, 태어난 시각, 출생지 정보를 사용합니다. 계산은 이용자의 브라우저 안에서 이루어지며, 별무리는 입력 폼의 출생 정보를 별무리 서버에 직접 제출받거나 계정에 저장하지 않습니다.',
          '“이 브라우저에 출생 정보 저장”을 선택하면 출생 정보가 브라우저의 로컬 저장소에 보관됩니다. 선택하지 않으면 현재 탭에서 결과를 이어 보기 위해 세션 저장소에 임시 보관됩니다.',
          '수호령 카드를 고를 때는 출생 정보 원본이 아니라 브라우저에서 이미 계산한 태양 별자리 또는 그날의 달 별자리, 개인화 여부, 현지 날짜와 시간대만 서버로 전송합니다.',
        ],
      },
      {
        heading: '수호령 카드와 7일권에서 처리하는 정보',
        body: [
          '무료 카드 요청에는 현지 날짜, 시간대, 태양 또는 달 별자리, 개인화 여부, 선택한 목소리, 브라우저에서 만든 무작위 식별자가 사용됩니다. 무작위 식별자는 해시한 뒤 카드가 같은 날 바뀌지 않게 하는 데 사용합니다.',
          '7일권을 구매하면 구매·복구용 이메일, 결제 식별자와 승인 결과, 이용권 시작·만료·첫 사용 시각, 무작위 식별자의 해시값, 이용권으로 열어 보관한 카드의 테마·그림 버전과 선택한 목소리가 서버에 저장됩니다.',
          '결제 전에 확인한 이용약관·개인정보처리방침·청약철회 및 환불 정책의 버전과 동의 시각도 구매 원장에 기록합니다.',
          '생년월일, 태어난 시각, 출생지, 행성 황경이나 하우스 같은 출생 차트 상세값은 수호령 카드 선택 또는 결제를 위해 서버로 전송하거나 저장하지 않습니다.',
          '구매 이메일은 결제 영수증과 보관함 복구에만 사용하며 마케팅 발송에 사용하지 않습니다.',
          '결제와 재열람 요청에는 도배와 부정 사용을 막기 위해 접속 IP의 비가역 해시값을 함께 사용합니다. 원본 IP 주소는 저장하지 않습니다.',
        ],
      },
      {
        heading: '구매와 카드 정보의 보관 기간',
        body: [
          '게스트 카드 보관함과 이메일 복구 권한은 결제일부터 1년 동안 보관합니다. 소복 계정에 귀속한 카드는 이용자가 삭제를 요청하거나 계정을 삭제할 때까지 보관합니다.',
          '재열람 링크는 발송 후 15분 동안 한 번만 사용할 수 있고 사용되거나 만료되면 무효가 됩니다.',
          '전자상거래법에 따라 계약 또는 청약철회 등에 관한 기록은 5년, 대금 결제 및 재화 등의 공급에 관한 기록은 5년, 소비자 불만 또는 분쟁 처리에 관한 기록은 3년 동안 보관합니다.',
          '결제와 복구 요청의 접속 IP는 원본을 저장하지 않고 단기 요청 제한을 위한 비가역 해시값만 사용합니다.',
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
          '별무리는 무료 화면에서 Google AdSense를 통해 광고를 게재합니다. 7일권 결제와 복구 화면에는 광고를 게재하지 않습니다.',
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
          '최근 수호령 카드와 게스트 이용권 연결 정보는 같은 브라우저의 로컬 저장소에 보관될 수 있으며, 사이트 저장 데이터를 삭제하면 함께 제거됩니다. 구매 이메일은 브라우저 로컬 저장소에 저장하지 않습니다.',
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
          `이용자는 자신의 개인정보에 대해 열람과 정정과 삭제와 처리정지를 요구할 수 있습니다. 7일권이나 카드 보관함에 관한 요청은 구매에 사용한 이메일과 함께 ${BUSINESS.email} 으로 보내 주세요.`,
          '카드 보관함 삭제를 요청하면 이메일 복구도 함께 중단됩니다. 다만 법령이 보관을 요구하는 결제 기록은 해당 기간 동안 보관합니다.',
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
          '유료 선공개권은 만 14세 이상만 구매할 수 있습니다. 만 14세 미만의 결제 사실을 알게 되면 결제를 취소하고 관련 정보를 삭제합니다.',
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
    effectiveDate: 'September 4, 2026',
    updatedDate: 'September 4, 2026',
    version: GUARDIAN_PASS_PRIVACY_VERSION,
    sections: [
      {
        heading: 'Birth information and in-browser processing',
        body: [
          'Stella uses the birth date, time, and place you enter to calculate your astrological chart. The calculation runs in your browser. Stella does not directly submit the birth details from the form to its server or save them to an account.',
          'If you select “Save details in this browser,” your birth details are kept in the browser’s local storage. Otherwise, they are held temporarily in session storage so you can continue viewing your result in the current tab.',
          'For guardian-card selection, the browser sends only an already-derived Sun sign or the day’s Moon sign, personalization basis, local date and time zone — not the original birth details.',
        ],
      },
      {
        heading: 'Information processed for guardian cards and the pass',
        body: [
          'A free-card request uses the local date, time zone, Sun or Moon sign, personalization basis, selected tone, and a random browser identifier. The identifier is hashed to keep the card stable for the day.',
          'A pass purchase stores the recovery email, payment identifier and result, entitlement start, expiry and first-use times, the random identifier hash, and the theme, artwork variation and selected tone of cards archived while the pass is active.',
          'The purchase ledger also records the versions of the Terms, Privacy Policy, and Withdrawal and Refund Policy shown before checkout, together with the consent time.',
          'Birth date, birth time, birthplace and detailed chart values such as planetary longitude and houses are not sent or stored for guardian-card selection or payment.',
          'The purchase email is used only for receipts and archive recovery, not marketing.',
          'Checkout and reopen requests also use a one-way hash of your connecting IP address to prevent flooding and abuse. The raw IP address is not stored.',
        ],
      },
      {
        heading: 'Retention of purchase data',
        body: [
          'A guest archive and email recovery are retained for one year after payment. Cards claimed into a Sobok account remain until you request deletion or delete the account.',
          'A reopen link is usable once within 15 minutes of being sent, and is void once used or expired.',
          'Under Korean e-commerce law we retain records of contracts and withdrawals for 5 years, records of payment and supply for 5 years, and records of consumer complaints or disputes for 3 years.',
          'Raw IP addresses are not stored for checkout or recovery; a one-way hash is used only for short-term rate limiting.',
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
          'Stella shows ads through Google AdSense on free screens. No ads are shown on pass checkout or recovery screens.',
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
          'Recent guardian cards and guest-pass connection details may be kept in local storage in the same browser and are removed when you clear this site’s stored data. The purchase email is not saved in browser local storage.',
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
          `You may request access to, correction of, deletion of, or suspension of processing of your personal data. For a pass or card archive, write to ${BUSINESS.email} quoting the purchase email.`,
          'Deleting an archive also ends email recovery. Payment records required by law remain for the applicable period.',
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
          'The paid early-access pass may be purchased only by people aged 14 or over. If we learn of a purchase by someone under 14, we cancel the payment and delete the associated data.',
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
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_PRIVACY_VERSION,
    sections: [
      {
        heading: '出生情報とブラウザ内での処理',
        body: [
          '星屑は星座を計算するために、利用者が入力した生年月日・出生時刻・出生地の情報を使用します。計算は利用者のブラウザ内で行われ、星屑は入力フォームの出生情報を星屑のサーバーへ直接送信したり、アカウントに保存したりしません。',
          '「このブラウザに出生情報を保存」を選ぶと、出生情報はブラウザのローカルストレージに保存されます。選ばない場合は、現在のタブで結果を続けて表示するため、セッションストレージに一時保存されます。',
          '守護霊カードの選択では、出生情報そのものではなく、ブラウザで算出済みの太陽星座または当日の月星座、個別化の区分、現地の日付とタイムゾーンのみを送信します。',
        ],
      },
      {
        heading: '守護霊カードとパスで処理する情報',
        body: [
          '無料カードのリクエストでは、現地の日付、タイムゾーン、太陽または月星座、個別化の区分、選んだトーン、ブラウザが作成したランダム識別子を使用します。識別子はハッシュ化して当日のカードを固定するために使います。',
          'パス購入時には、購入・復旧用メール、決済識別子と結果、権利の開始・満了・初回利用時刻、識別子のハッシュ、パス利用中に保存したカードのテーマ・絵柄と選択したトーンをサーバーに保存します。',
          '購入前に表示した利用規約、プライバシーポリシー、撤回・返金ポリシーの各バージョンと同意時刻も購入台帳に記録します。',
          '生年月日、出生時刻、出生地、惑星黄経やハウスなどの詳細チャート値は、カード選択や決済のために送信・保存しません。',
          '購入メールは領収と保管箱復旧のみに使用し、マーケティングには使用しません。',
          '決済と再閲覧のリクエストでは、荒らしや不正利用を防ぐために接続元IPアドレスの不可逆ハッシュ値を併用します。生のIPアドレスは保存しません。',
        ],
      },
      {
        heading: '購入情報の保存期間',
        body: [
          'ゲスト保管箱とメール復旧は決済から1年間保存します。Sobokアカウントに帰属したカードは削除要請またはアカウント削除まで保存します。',
          '再閲覧リンクは送信から15分間に1回だけ使用でき、使用済みまたは期限切れになると無効になります。',
          '韓国電子商取引法に基づき、契約または契約解除等に関する記録は5年、代金決済および財貨等の供給に関する記録は5年、消費者の苦情または紛争処理に関する記録は3年間保存します。',
          '決済と復旧では生のIPアドレスを保存せず、短期のリクエスト制限に不可逆ハッシュのみを使用します。',
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
          '星屑は無料画面に Google AdSense 広告を表示します。パスの決済・復旧画面には広告を表示しません。',
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
          '最近の守護霊カードとゲスト利用権の接続情報は、同じブラウザのローカルストレージに保存される場合があり、サイトデータを削除すると一緒に消去されます。購入メールアドレスはブラウザのローカルストレージには保存しません。',
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
          `利用者は自身の個人情報について閲覧・訂正・削除・処理停止を求められます。パスやカード保管箱については購入メールとともに ${BUSINESS.email} へご連絡ください。`,
          '保管箱を削除するとメール復旧も停止します。法令上必要な決済記録は所定期間保存します。',
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
          '有料の先行公開パスは満14歳以上のみ購入できます。満14歳未満による決済を把握した場合は取り消し、関連情報を削除します。',
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
    effectiveDate: '2026年9月4日',
    updatedDate: '2026年9月4日',
    version: GUARDIAN_PASS_PRIVACY_VERSION,
    sections: [
      {
        heading: '出生信息与浏览器内处理',
        body: [
          '星黛洛使用您输入的出生日期、出生时间和出生地点来计算星盘。计算在您的浏览器内完成；星黛洛不会把输入表单中的出生信息直接提交到星黛洛的服务器，也不会将其保存到账号中。',
          '如果选择“在此浏览器保存出生信息”，出生信息会保存在浏览器的本地存储中；如果不选择，则会临时保存在会话存储中，以便您在当前标签页继续查看结果。',
          '选择守护灵卡片时，只发送浏览器已经算出的太阳星座或当天月亮星座、个性化依据、当地日期与时区，不发送原始出生信息。',
        ],
      },
      {
        heading: '守护灵卡片与通行证处理的信息',
        body: [
          '免费卡片请求会使用当地日期、时区、太阳或月亮星座、个性化依据、所选语气以及浏览器生成的随机标识。标识经哈希后用于确保当天卡片保持不变。',
          '购买通行证时会保存购买与恢复邮箱、支付标识与结果、权益开始、到期与首次使用时间、随机标识哈希，以及通行证有效期间保存卡片的主题、画面版本和所选语气。',
          '购买记录还会保存结账前展示的《使用条款》《隐私政策》《撤回与退款政策》版本及同意时间。',
          '出生日期、出生时间、出生地点，以及行星黄经和宫位等详细星盘值，不会为卡片选择或支付而发送或保存。',
          '购买邮箱仅用于收据与收藏恢复，不用于营销。',
          '支付与重新开启请求会同时使用连接 IP 的不可逆哈希值，以防止刷屏与滥用。原始 IP 地址不会被保存。',
        ],
      },
      {
        heading: '购买信息的保存期限',
        body: [
          '访客卡片收藏与邮箱恢复自付款起保存一年。归属 Sobok 账户的卡片保留至用户申请删除或删除账户。',
          '重新开启链接自发送起 15 分钟内仅可使用一次，使用后或过期即失效。',
          '依据韩国电子商务法，合同或撤回等相关记录保存 5 年，货款结算与商品供应相关记录保存 5 年，消费者投诉或纠纷处理记录保存 3 年。',
          '支付与恢复请求不保存原始 IP，只使用不可逆哈希进行短期请求限制。',
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
          '星黛洛在免费页面通过 Google AdSense 展示广告。通行证结算与恢复页面不展示广告。',
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
          '最近的守护灵卡片和访客通行证连接信息可能保存在同一浏览器的本地存储中；清除本站存储数据时会一并删除。购买邮箱不会保存在浏览器的本地存储中。',
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
          `用户可请求查阅、更正、删除或停止处理个人信息。与通行证或卡片收藏有关的请求，请附购买邮箱发送至 ${BUSINESS.email}。`,
          '删除收藏也会终止邮箱恢复；法令要求保存的支付记录仍会保留相应期限。',
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
          '付费提前查看通行证仅限年满14周岁者购买。如获悉未满14周岁者付款，我们会取消支付并删除相关信息。',
        ],
      },
      {
        heading: '政策变更',
        body: ['我们可能会根据法律或服务的变化更新本政策，并在本页面公布任何变更。'],
      },
    ],
  },
}
