import { FREE_DELIVERABLES_KO } from '@deep-type/free-deliverables'
import { DEEP_TYPE_REPORT_OFFER, majorUnits, PRODUCT_NAME } from '@deep-type/offer'
import type { Locale } from '@sobok/domain/locale'

// The contract states the price and the product name, so it reads them from the same constants the checkout
// charges and the PortOne 결제창 prints. 전자상거래법 제13조 제2항 제2호·제3호 make both pre-contract disclosures,
// and a literal here would be a second copy free to drift from the one the buyer is actually charged.
//
// Each locale discloses in ITS OWN settlement currency — `ko` charges KRW and the overseas locales charge
// what PayPal settles (`en`/`zh` USD, `ja` JPY) — so the number a contract names is the number the statement
// shows, with no issuer FX between them.
const PRICE_KO = `${DEEP_TYPE_REPORT_OFFER.ko.amount.toLocaleString('ko-KR')}원`
const PRICE_EN = `USD ${majorUnits('USD', DEEP_TYPE_REPORT_OFFER.en.amount).toFixed(2)}`
const PRICE_JA = `${DEEP_TYPE_REPORT_OFFER.ja.amount.toLocaleString('ja-JP')}円`
const PRICE_ZH = `${majorUnits('USD', DEEP_TYPE_REPORT_OFFER.zh.amount).toFixed(2)}美元`

// Contact shown on the legal pages. Keep this a mailbox that is actually
// monitored (or swap it) — AdSense reviewers and users may write to it.
export const LEGAL_CONTACT_EMAIL = 'sobok2026@gmail.com'

export type LegalSection = {
  id?: string
  heading: string
  body: string[]
}

export type LegalDoc = {
  title: string
  description: string
  effectiveDate?: string
  updatedDate: string
  version?: string
  sections: LegalSection[]
}

export type LegalNav = {
  privacy: string
  terms: string
  refund: string
}

export type LegalContent = {
  updatedLabel: string
  effectiveLabel: string
  versionLabel: string
  contentsLabel: string
  contactLabel: string
  nav: LegalNav
  privacy: LegalDoc
  terms: LegalDoc
  refund: LegalDoc
}

export const LEGAL = {
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
    },
    privacy: {
      title: '개인정보처리방침',
      description: '로빈리뷰가 결타레 서비스에서 이용자의 정보를 어떻게 다루는지 안내합니다.',
      effectiveDate: '2026년 8월 1일',
      updatedDate: '2026년 7월 30일',
      version: '1.0',
      sections: [
        {
          heading: '무료 테스트와 유료 리포트의 구분',
          body: [
            '결지수 테스트와 대화 유형 테스트의 답변은 이용자의 브라우저 안에서만 계산되며 서버로 전송되거나 저장되지 않습니다. 이 테스트는 회원가입이 필요하지 않습니다.',
            '겉속유형 무료 결과는 브라우저에서 계산됩니다. 이용자가 유료 리포트 결제를 시작하면 결과 코드와 답변이 구매·리포트 제공을 위해 서버로 전송됩니다. 구매로 이어지지 않거나 결제가 실패·대기 상태로 끝난 데이터는 생성 또는 결제 시도 후 30일에 파기합니다.',
          ],
        },
        {
          heading: '수집하는 개인정보 항목',
          body: [
            '유료 리포트 이용 시 이메일 주소와 조회용 해시값, 무료 검사와 심층 검사의 문항 답변, 이용자가 직접 고른 자가선언 코드와 그 제공 여부, 서버가 산출한 결과 코드와 축별 선명도 및 리포트, 결제 정보(결제수단·승인 및 거래 식별자·금액·동의 시각·만 14세 이상 확인 시각), 접속·이용 정보(IP 주소·기기 및 브라우저 정보·봇 방지 토큰)를 처리합니다.',
            'Google 도구가 켜진 페이지에서는 동의 상태, 방문 페이지, 기기·브라우저 정보, 광고·분석 식별자가 처리될 수 있습니다. 저장형 광고·분석 식별자는 이용자의 선택에 따르며, 고급 동의 모드에서는 선택 전이나 거부 상태에도 쿠키 없는 동의 상태·측정 신호가 Google로 전송될 수 있습니다.',
            '겉속유형 무료 검사에서는 결제 전에도 답변한 문항 수와 진행 구간 및 자가선언 코드 제공 여부가 이용 통계 이벤트로 Google에 전송될 수 있습니다. 답변 내용 자체는 전송하지 않습니다.',
            '카드번호 같은 민감한 결제수단 정보는 결제대행사가 직접 처리하며 회사는 보관하지 않습니다.',
          ],
        },
        {
          heading: '개인정보의 처리 목적',
          body: [
            '리포트를 생성해 제공하고 이메일로 재열람할 수 있도록 하기 위해, 결제와 환불 및 거래 기록을 관리하기 위해, 부정 이용과 자동화 봇을 차단하기 위해, 문의에 응대하고 서비스를 개선하기 위한 통계에 개인정보를 이용합니다.',
          ],
        },
        {
          heading: '보유 및 이용 기간',
          body: [
            '구매로 이어지지 않은 결과와 pending·failed 구매 시도는 30일 보관합니다. 리포트가 생성된 뒤 무료·심층 답변과 중간 저장 초안은 3개월 보관하고 결과 코드·서버 산출 프로필·리포트·구매 이메일·재열람 권한은 결제일부터 1년 보관합니다. 재열람용 원본 링크 토큰은 저장하지 않고 해시만 저장하며 15분 만료 또는 1회 사용 뒤 다음 정기 삭제에서 파기합니다.',
            '결제한 뒤 심층 문항을 끝내지 않아 리포트가 생성되지 않은 경우 답변과 중간 저장 초안은 결제일부터 90일 보관하고 그 뒤 삭제합니다. 이때 서버가 산출한 프로필은 남아 있어 결과 열람은 유지됩니다.',
            'PortOne 원본 웹훅은 90일, 접속·보안 로그는 최대 3개월 보관합니다. 결제·계약·환불 증빙에 필요한 최소 거래 기록은 5년 보관하며 소비자 문의·분쟁 기록은 해당 처리 목적에 필요한 기간 동안 최대 3년 보관합니다. 1년이 지나면 이메일, 접근 토큰, 결과·리포트 데이터는 거래 기록과 분리해 삭제하고 5년이 지나면 최소 거래 기록도 삭제합니다.',
          ],
        },
        {
          heading: '개인정보 처리의 위탁',
          body: [
            '회사는 서비스 제공을 위해 아래와 같이 처리를 맡깁니다. PortOne과 Toss Payments는 카드 결제·환불과 결제 연동을, Anthropic PBC는 리포트 서술을, Plus Five Five, Inc.(Resend)는 재열람용 트랜잭션 이메일 발송을, Cloudflare, Inc.는 웹 호스팅·콘텐츠 전송·접속 로그와 봇 차단(Turnstile)을, Supabase는 데이터 보관(서울 리전)을, Google은 동의 관리·이용 통계와 광고를 담당합니다.',
            '위탁 계약을 체결할 때 개인정보가 안전하게 관리되도록 필요한 사항을 정하고 수탁자를 감독합니다.',
          ],
        },
        {
          heading: '개인정보의 국외 이전',
          body: [
            '회사는 계약의 이행을 위한 처리위탁과 보관 목적으로 아래와 같이 개인정보를 국외로 이전합니다(개인정보보호법 제28조의8 제1항 제3호). 별도의 동의 없이 본 방침의 공개로 갈음합니다.',
            'Anthropic PBC(미국)에 리포트 서술 시 전송합니다. 이전 항목은 서버가 산출한 유형 코드와 축 이름·양극 라벨·선명도 문구, 세계관 직업, 지치는 조건 라벨, 규칙 엔진이 이미 작성한 리포트 본문입니다. 이메일과 문항별 답변 및 축별 점수는 전송하지 않습니다. 이전 방법은 HTTPS 암호화 전송이고 연락처는 privacy@anthropic.com 입니다. Anthropic은 상용 API 입력·출력을 기본적으로 모델 학습에 사용하지 않으며 별도 약정이나 정책 집행 등 예외가 없으면 30일 안에 삭제한다고 안내합니다. 회사가 받은 서술은 자체 보존 기준에 따라 1년 보관합니다.',
            'Plus Five Five, Inc.(Resend, 미국)에 수신 이메일 주소, 구매일, 15분 일회용 재열람 URL, 메일 본문과 발송 메타데이터를 요청 시 전송합니다. 유형 코드나 리포트 본문은 보내지 않습니다. 이전 방법은 HTTPS 암호화 전송이고 연락처는 privacy@resend.com 입니다. 표준 요금제의 이메일 데이터 보존 기간은 30일이며 링크 클릭·오픈 추적은 사용하지 않습니다.',
            'Cloudflare, Inc.(미국)에 이전합니다. 이전 항목은 접속 정보(IP 주소·기기 정보)와 봇 방지 토큰이며 서비스 이용 시점에 전송하고 웹 호스팅과 콘텐츠 전송 및 보안 목적으로 서비스 제공 기간 동안 처리됩니다. 봇 검증에서는 접속 IP 주소와 위젯 토큰을 Cloudflare Turnstile 검증 엔드포인트로 보냅니다. 이전 방법은 HTTPS 암호화 전송이고 연락처는 privacyquestions@cloudflare.com 입니다.',
            'Google 및 그 광고·분석 파트너의 처리 위치는 이용 지역과 공급자 인프라에 따라 달라질 수 있습니다. 동의 상태, 쿠키 없는 측정 신호 또는 동의한 광고·분석 데이터가 서비스 이용 시 전송되며 Google의 설정과 보존 정책에 따라 처리됩니다. 결제가 확정되면 회사 서버가 거래 식별자와 결제 금액·통화·상품 정보 및 브라우저에서 수집한 분석 식별자를 Google로 직접 전송합니다. 이 전송은 이용자의 브라우저가 닫힌 뒤에도 발생할 수 있습니다. 연락처는 https://support.google.com/policies 에서 확인할 수 있습니다.',
            '리포트 서술과 결제를 위한 이전은 리포트를 구매하지 않으면 발생하지 않습니다. 광고·분석 목적의 이전은 푸터의 개인정보·쿠키 설정에서 거부할 수 있습니다. 보안과 봇 차단을 위한 이전은 서비스 제공에 필요한 최소 범위로 이루어지며 이를 거부하면 서비스를 이용할 수 없습니다. 거부 의사는 문의처로도 전달할 수 있습니다.',
          ],
        },
        {
          heading: '정보주체의 권리와 행사 방법',
          body: [
            '이용자는 자신의 개인정보에 대해 열람과 정정 및 삭제, 처리정지를 요구할 수 있습니다. 비회원은 구매에 사용한 이메일로 본인임을 확인한 뒤 아래 문의처를 통해 권리를 행사할 수 있으며, 회사는 요청을 지체 없이 처리합니다.',
          ],
        },
        {
          id: 'cookies-and-advertising',
          heading: '쿠키와 광고',
          body: [
            'Google AdSense, Google Tag Manager와 분석 도구를 사용합니다. 페이지의 Google 태그보다 먼저 Consent Mode v2의 광고 저장·분석 저장·광고 사용자 데이터·광고 개인화 신호를 denied로 초기화하고, Google Privacy & Messaging이 지원 지역에서 받은 선택에 따라 갱신합니다. 거부하면 광고·분석 쿠키를 새로 저장하지 않지만 고급 동의 모드의 쿠키 없는 신호는 전송될 수 있습니다.',
            '푸터의 개인정보·쿠키 설정에서 선택을 다시 열 수 있습니다. Google 광고 설정(https://adssettings.google.com)에서도 개인화 설정을 관리할 수 있습니다. 원본 재열람 토큰이나 결제 식별자가 있을 수 있는 /deep-type/reopen 및 /deep-type/checkout-return 페이지에는 AdSense를 로드하지 않습니다.',
          ],
        },
        {
          heading: '개인정보의 파기',
          body: [
            '보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.',
          ],
        },
        {
          heading: '안전성 확보 조치',
          body: [
            '데이터베이스 접근 권한을 최소한으로 제한하고 전송 구간을 암호화합니다. 결제수단 정보는 결제대행사가 처리합니다. 재열람 링크는 15분·1회용이며 원본 토큰 대신 SHA-256 해시만 저장하고, 토큰은 URL fragment로 전달해 서버 접근 로그와 리퍼러에 남지 않도록 합니다. 이메일 발송 서비스의 클릭·오픈 추적은 끕니다.',
            '모바일 결제 복귀용 접근 토큰은 URL에 넣지 않고 해당 탭의 sessionStorage에 저장합니다. 복귀 시 생성 후 1시간이 지난 값은 삭제하며, 탭을 닫으면 브라우저가 제거합니다.',
            '무료 결과의 공유 텍스트에는 유형 코드와 결과 요약이 포함됩니다. 공개 게시 전에 공유 대상과 포함된 내용을 확인해 주세요.',
          ],
        },
        {
          heading: '개인정보 보호책임자',
          body: [
            '개인정보 보호책임자는 대표자 곽태욱이며 연락처는 sobok2026@gmail.com, 010-9203-2837 입니다. 개인정보 침해에 관한 상담과 신고는 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972), 대검찰청 사이버수사과, 경찰청 사이버수사국에 하실 수 있습니다.',
          ],
        },
        {
          heading: '아동의 개인정보',
          body: [
            '무료 서비스는 연령 확인 없이 이용할 수 있습니다. 유료 리포트는 만 14세 이상만 구매할 수 있으며 생년월일은 수집하지 않고 결제 시 만 14세 이상 확인 시각만 저장합니다.',
          ],
        },
        {
          heading: '방침의 변경',
          body: [
            '서비스나 처리 방식이 바뀌면 변경 이유, 변경 전·후 내용과 시행일을 이 페이지에 공개합니다. 일반 변경은 시행 7일 전, 이용자 권리에 중대한 불리함이 있는 변경은 30일 전에 서비스의 눈에 띄는 위치에서 안내합니다. 각 버전과 시행일, 이전 버전 링크를 이 페이지에 유지합니다.',
          ],
        },
      ],
    },
    terms: {
      title: '이용약관',
      description: '로빈리뷰가 운영하는 결타레 서비스 이용에 적용되는 약관입니다.',
      effectiveDate: '2026년 8월 1일',
      updatedDate: '2026년 7월 30일',
      version: '1.0',
      sections: [
        {
          heading: '서비스 소개',
          body: [
            `결타레는 결지수 테스트와 대화 유형 테스트를 무료로 제공하고 일에서의 자기 이해를 돕는 유료 리포트(${PRODUCT_NAME.ko})를 함께 제공하는 서비스이며 로빈리뷰가 운영합니다.`,
            '무료 두 테스트는 커플의 케미를 가볍게 확인하는 도구입니다. 유료 리포트는 일에서 힘이 붙는 조건과 힘이 새는 조건을 정리해 주는 자기이해 콘텐츠이며 커플 궁합과는 관련이 없습니다.',
            '상품명의 「심층」은 측정 정밀도가 아니라 산출 범위를 뜻합니다. 결제 후 이어지는 문항은 무료 결과에서 이미 나온 여덟 글자를 바꾸지 않고 각 축이 얼마나 선명한지와 서술 범위만 넓힙니다.',
          ],
        },
        {
          heading: '용어와 계약의 성립',
          body: [
            '서비스는 vibe.sobok.cc에서 제공되는 무료 테스트와 겉속유형 기능을, 리포트는 결제 후 생성되는 디지털 콘텐츠를 뜻합니다. 이용자는 결제 화면에서 상품·가격·제공 기간·필수 동의를 확인하고 카드 결제를 완료하면 리포트 이용 계약을 맺습니다.',
            '회원가입은 없으며 구매 이메일과 서버가 발급한 접근 권한으로 리포트를 제공합니다. 정기결제나 자동 갱신 상품이 아닙니다.',
          ],
        },
        {
          heading: '유료 서비스와 결제',
          body: [
            `${PRODUCT_NAME.ko}는 ${PRICE_KO}(VAT 포함)의 유료 디지털 콘텐츠입니다. 현재 결제수단은 PortOne을 통해 연결되는 Toss Payments 카드 결제입니다. 승인 전 화면에 표시된 최종 금액을 확인해야 합니다.`,
            '해외 발급 카드의 사용 가능 여부는 카드사와 결제대행사 정책에 따라 달라질 수 있습니다. 결제 통화는 KRW이며 카드사가 환율과 해외 결제 수수료를 적용할 수 있습니다.',
          ],
        },
        {
          heading: '콘텐츠의 제공',
          body: [
            '리포트는 결제 후 이어지는 심층 문항의 답을 서버가 채점해 만듭니다. 심층 문항은 무료 결과에서 이미 나온 여덟 글자를 다시 정하지 않고 각 축의 선명도를 확정합니다.',
            '리포트는 두 단계로 제공됩니다. 회사의 규칙 엔진이 쓴 본문이 먼저 올라오고 서술 문단이 이어서 붙습니다. 서술이 끝나기 전까지는 리포트를 아직 제공하지 않은 것으로 보며 이 시점에는 청약철회가 제한되지 않습니다. 서술 생성이 재시도 한도를 넘겨 실패하면 자동 취소 기능이나 고객센터를 통해 전액 환불을 요청할 수 있습니다.',
            '리포트는 내려받는 파일이 아니라 웹 화면으로 제공합니다. 자바스크립트를 켠 최신 브라우저가 필요하고 따로 설치할 프로그램은 없습니다. 재열람은 구매에 사용한 이메일을 받을 수 있어야 가능합니다.',
            '리포트와 이메일 재열람은 결제일부터 1년 동안 제공합니다. 구매 이메일을 입력하면 15분 동안 한 번만 쓸 수 있는 링크를 보내며 링크에서 이용자가 열기 버튼을 누른 뒤 리포트를 표시합니다. 1년 뒤에는 리포트·결과·이메일과 접근 권한을 삭제하므로 별도 복구를 보장하지 않습니다.',
          ],
        },
        {
          heading: '청약철회와 환불',
          body: [
            '청약철회와 환불에 관한 사항은 별도의 청약철회·환불 정책에서 정합니다. 요약하면 리포트를 열람하기 전에는 전액 환불되며 열람한 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한됩니다. 다만 표시·광고와 다르게 이행된 경우에는 열람 후에도 법령에 따라 청약철회를 할 수 있습니다.',
          ],
        },
        {
          heading: '구매 자격과 연령 확인',
          body: [
            '무료 서비스는 연령 확인 없이 이용할 수 있습니다. 유료 리포트는 만 14세 이상만 구매할 수 있으며 결제 시 직접 확인해야 합니다. 생년월일은 수집하지 않습니다.',
            '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있습니다. 회사는 전자상거래법 제13조 제3항에 따라 이 사실을 결제 화면에서도 안내합니다.',
          ],
        },
        {
          heading: '이용자의 의무',
          body: [
            '이용자는 본인이 접근할 수 있는 정확한 이메일을 사용하고 결제·재열람 토큰과 링크를 다른 사람에게 공개하지 않아야 합니다. 다른 사람의 이메일·결제수단을 무단 사용하거나 자동화 요청·우회·역공학·서비스 방해·리포트의 무단 재판매를 해서는 안 됩니다.',
            '공유 기능으로 만든 텍스트에는 유형 코드와 결과 요약이 포함되므로 이용자가 공개 전에 공유 대상과 포함된 내용을 확인해야 합니다.',
          ],
        },
        {
          heading: '오락·참고 목적',
          body: [
            '리포트를 포함해 결타레가 제공하는 모든 결과는 자기 이해와 오락을 돕기 위한 참고 정보이며 의학적·심리적 진단이나 전문 상담을 대신하지 않습니다.',
            '리포트는 직업소개나 취업알선 서비스가 아니고 직업적성검사나 채용 도구도 아닙니다. 결과에 나오는 세계관 직업은 실제 채용 직무가 아니라 지금의 답에 가장 가까운 역할을 보여주는 표현이며 이직이나 퇴사 또는 창업을 권하는 조언이 아닙니다.',
            '이용자는 서비스의 내용을 중요한 의사결정의 유일한 근거로 삼지 않아야 하며 서비스 이용에 따른 판단과 책임은 이용자 본인에게 있습니다.',
          ],
        },
        {
          heading: '서비스의 중단',
          body: [
            '회사는 보안 대응, 시스템 점검, 공급자 장애나 부득이한 사유가 있을 때 서비스 제공을 일시 중단할 수 있습니다. 가능한 경우 사전에 안내하고, 긴급 상황은 사후 안내할 수 있습니다. 서비스를 종료하면 합리적인 기간 전에 알리고 아직 제공되지 않은 유료 콘텐츠는 환불합니다.',
          ],
        },
        {
          heading: '광고',
          body: [
            '결타레에는 제3자 광고가 표시될 수 있습니다. 광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
          ],
        },
        {
          heading: '지식재산권',
          body: [
            '서비스에 포함된 텍스트, 디자인, 로고, 리포트 콘텐츠에 대한 권리는 로빈리뷰 또는 정당한 권리자에게 있으며 무단 복제·배포를 금지합니다.',
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
            '약관을 바꾸면 변경 이유, 변경 전·후 내용과 시행일을 공개합니다. 일반 변경은 시행 7일 전, 이용자에게 중대하게 불리한 변경은 30일 전에 서비스의 눈에 띄는 위치에서 안내합니다. 변경 약관은 시행일 이후의 이용에 적용하며 각 버전과 이전 문서 링크를 유지합니다.',
          ],
        },
        {
          heading: '준거법과 관할',
          body: [
            '본 약관은 대한민국 법령에 따라 해석되고 적용되며, 서비스 이용으로 발생한 분쟁의 관할은 관련 법령이 정하는 바에 따릅니다.',
          ],
        },
      ],
    },
    refund: {
      title: '청약철회·환불 정책',
      description: `${PRODUCT_NAME.ko}의 청약철회와 환불에 관한 사항을 안내합니다.`,
      effectiveDate: '2026년 8월 1일',
      updatedDate: '2026년 7월 30일',
      version: '1.0',
      sections: [
        {
          heading: '청약철회 기간',
          body: ['이용자는 계약 내용에 관한 안내를 받은 날부터 7일 이내에 청약철회를 할 수 있습니다.'],
        },
        {
          heading: '디지털 콘텐츠의 청약철회 제한',
          body: [
            `${PRODUCT_NAME.ko}는 디지털 콘텐츠입니다. 전자상거래법 제17조 제2항에 따라 콘텐츠의 제공이 개시되면 청약철회가 제한될 수 있습니다.`,
            // The four deliverables come from the constant, not from a second copy of the words. This paragraph is
            // the only thing that supports the 시용 상품 제공 limb of 제17조 제6항, so if the free run ever hands over
            // something different from what this sentence promises, the limitation itself falls away.
            `회사는 이 제한이 적용된다는 사실을 결제 화면에 명확히 표시합니다. 회사는 결제 전에 무료 검사 결과로 ${FREE_DELIVERABLES_KO.join(' · ')}를 제공해 이용자가 상품의 성격을 미리 확인할 수 있도록 합니다. 무료 검사는 결제 없이 언제든 다시 받을 수 있습니다.`,
          ],
        },
        {
          heading: '열람 전 전액 환불',
          body: [
            '결제한 뒤에도 리포트를 아직 열람하지 않았다면 언제든 전액 환불받을 수 있습니다. 리포트 화면의 환불 요청 기능으로 즉시 처리하거나 아래 문의처로 요청할 수 있습니다.',
            '리포트는 규칙 엔진이 쓴 본문이 먼저 올라오고 서술 문단이 이어서 붙습니다. 서술이 끝나기 전까지는 콘텐츠 제공이 개시되지 않은 것으로 보므로 이 시점에는 청약철회가 제한되지 않습니다.',
            '리포트의 1년 재열람 기간은 환불 가능 기간을 늘리거나 이미 시작된 콘텐츠 제공을 되돌리는 의미가 아닙니다. 다만 리포트 생성이 최종 실패했거나 회사가 제공하지 못한 경우에는 전액 환불합니다.',
          ],
        },
        {
          heading: '표시·광고와 다르게 이행된 경우',
          body: [
            '제공된 리포트가 표시·광고 내용과 다르거나 계약과 다르게 이행된 경우에는 열람한 뒤에도 공급받은 날부터 3개월 이내, 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 청약철회를 할 수 있습니다.',
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
            '환불은 결제한 수단으로 이루어집니다. 회사는 청약철회 접수일부터 3영업일 이내에 환불을 처리하며, 처리가 지연되는 경우 지연 기간에 대해 연 15%의 지연배상금을 더해 드립니다.',
          ],
        },
        {
          heading: '연령 제한',
          body: [
            '만 14세 미만은 유료 리포트를 구매할 수 없습니다. 연령을 잘못 확인하고 결제한 사실을 알게 되면 구매 이메일과 함께 문의해 주세요.',
            '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있습니다. 취소를 원하면 구매 이메일과 함께 아래 문의처로 연락해 주세요.',
          ],
        },
        {
          heading: '환불 문의',
          body: ['청약철회와 환불에 관한 문의는 sobok2026@gmail.com 또는 010-9203-2837 로 연락해 주세요.'],
        },
      ],
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
      refund: 'Withdrawal & Refund Policy',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'How Robin Review handles your information in vibe (DeepType).',
      effectiveDate: 'August 1, 2026',
      updatedDate: 'July 30, 2026',
      version: '1.0',
      sections: [
        {
          heading: 'Free quizzes vs. the paid report',
          body: [
            'Answers to the Compatibility and Talk Type quizzes are calculated entirely in your browser and are never sent to or stored on our server. These quizzes require no sign-up.',
            'Your free DeepType result is calculated in the browser. When you start purchasing a paid report, result codes and answers are sent to our server to process the purchase and deliver the report. Data that does not lead to a purchase, or is left in pending or failed payment status, is deleted 30 days after creation or the payment attempt.',
          ],
        },
        {
          heading: 'Personal data we collect',
          body: [
            'For paid reports we process your email address and a lookup hash; your answers to the forced-choice items in the free and in-depth runs; the self-declared code you picked and whether you provided one; the server-computed result codes, per-axis clarity, and the generated report; payment data (method, approval and transaction identifiers, amount, consent timestamps, and the timestamp of your 14+ confirmation); and access and usage data (IP address, device and browser information, and anti-bot token).',
            'On pages where Google tools are enabled, consent state, page viewed, device and browser data, and advertising or analytics identifiers may be processed. Stored advertising and analytics identifiers follow your choices. In advanced consent mode, cookieless consent-state and measurement signals may still be sent to Google before a choice or after a refusal.',
            'In the free DeepType run, the number of items answered, the segment you have reached, and whether you provided a self-declared code may be sent to Google as usage-statistics events even before payment. The answers themselves are not sent.',
            'Sensitive payment details such as card numbers are handled directly by the payment provider and are not stored by us.',
          ],
        },
        {
          heading: 'Purposes of processing',
          body: [
            'We use personal data to generate and deliver your report and let you re-open it by email, to manage payments, refunds, and transaction records, to prevent abuse and automated bots, to respond to inquiries, and for statistics that improve the service.',
          ],
        },
        {
          heading: 'Retention period',
          body: [
            'Unpurchased results and pending or failed purchase attempts are kept for 30 days. Answers from the free and in-depth runs, together with saved drafts, are kept for 3 months after report generation. Result codes, the server-computed profile, report, purchase email, and report-access credential are kept for 1 year from payment. We do not store the raw email-link token; only its hash is kept and deleted by the next scheduled purge after it expires in 15 minutes or is used once.',
            'If you paid but never finished the in-depth items and no report was generated, your answers and saved drafts are kept for 90 days from payment and then deleted. The server-computed profile remains, so you can still open your result.',
            'Raw PortOne webhooks are kept for 90 days and access or security logs for up to 3 months. Minimal payment, contract, and refund evidence is kept for 5 years, and inquiry or dispute records for the period needed for that purpose, up to 3 years. After 1 year we delete the email, access credential, result, and report separately from the minimal transaction record; after 5 years the minimal record is deleted too.',
          ],
        },
        {
          heading: 'Processing entrusted to others',
          body: [
            'We use PortOne and Toss Payments for card payments, refunds, and payment integration; Anthropic PBC for report narration; Plus Five Five, Inc. (Resend) for transactional report-access email; Cloudflare, Inc. for hosting, content delivery, access logs, and bot mitigation (Turnstile); Supabase for database storage in Seoul; and Google for consent management, analytics, and advertising.',
            'We set the terms needed to keep personal data safe in each contract and supervise our processors.',
          ],
        },
        {
          heading: 'Transfer of personal data overseas',
          body: [
            'For the purpose of entrusted processing and storage needed to perform the contract, we transfer personal data overseas as follows, disclosed here in lieu of separate consent (Article 28-8(1)3 of the Personal Information Protection Act).',
            'To Anthropic PBC (United States), when a report is narrated: the server-computed type codes; the axis names, pole labels, and clarity wording; the world-job; the drain-condition labels; and the report body the rules engine has already written. Your email, your per-item answers, and your per-axis scores are not sent. The transfer is made over encrypted HTTPS, and the contact is privacy@anthropic.com. Anthropic states that commercial API inputs and outputs are not used for model training by default and are deleted within 30 days unless an agreed or policy-enforcement exception applies. We keep the narration we receive under our own 1-year schedule.',
            'To Plus Five Five, Inc. (Resend, United States), when you request access: the recipient email, purchase date, 15-minute one-time URL, message content, and sending metadata. We do not include type codes or report text. The transfer is made over encrypted HTTPS, and the contact is privacy@resend.com. Standard-plan email data is retained for 30 days, and we disable click and open tracking.',
            'To Cloudflare, Inc. (United States): the transferred items are access data (IP address, device information) and an anti-bot token, sent when you use the service and processed for hosting, content delivery, and security for as long as the service is provided. For bot verification we send your access IP address and the widget token to the Cloudflare Turnstile verification endpoint. The transfer is made over encrypted HTTPS, and the contact is privacyquestions@cloudflare.com.',
            'Google and its advertising or analytics partners may process data in locations that depend on your region and their infrastructure. Consent state, cookieless measurement signals, or consented advertising and analytics data is sent when you use the service and processed under Google settings and retention policies. Once a payment is confirmed, our server sends the transaction identifier, the payment amount, currency, and item information, together with the analytics identifier collected in your browser, directly to Google. This transmission can happen after your browser is closed. The contact can be found at https://support.google.com/policies.',
            'Transfers for report narration and for payment do not happen unless you purchase a report. You can refuse transfers for advertising and analytics from “Privacy & cookie choices” in the footer. Transfers for security and bot mitigation are limited to the minimum needed to provide the service, and the service cannot be used if you refuse them. You may also send your objection to our contact address.',
          ],
        },
        {
          heading: 'Your rights and how to exercise them',
          body: [
            'You may request access to, correction of, deletion of, or suspension of processing of your personal data. As a non-member you can verify your identity with the email used for purchase and exercise these rights through the contact below, and we will act on the request without delay.',
          ],
        },
        {
          id: 'cookies-and-advertising',
          heading: 'Cookies and advertising',
          body: [
            'We use Google AdSense, Google Tag Manager, and analytics tools. Before any Google tag, Consent Mode v2 initializes ad storage, analytics storage, ad user data, and ad personalization as denied. Google Privacy & Messaging updates those states from choices collected in supported regions. Refusing prevents new advertising or analytics cookies from being stored, but advanced consent mode may still send cookieless signals.',
            'You can reopen your choices from “Privacy & cookie choices” in the footer and manage Google personalization at https://adssettings.google.com. AdSense is not loaded on /deep-type/reopen or /deep-type/checkout-return, where a raw access token or payment identifier may be present.',
          ],
        },
        {
          heading: 'Destruction of personal data',
          body: [
            'Personal data whose retention period has ended or whose purpose is fulfilled is destroyed without delay. Electronic files are deleted in a way that cannot be recovered.',
          ],
        },
        {
          heading: 'Security measures',
          body: [
            'We restrict database access and encrypt data in transit. Payment details are handled by the payment provider. Report-access links work once for 15 minutes; only a SHA-256 token hash is stored, and the raw token is placed in the URL fragment so it is not sent in server access logs or referrers. Email click and open tracking is disabled.',
            'The access token used to resume after mobile payment is kept out of the URL and stored in that tab’s sessionStorage. Values older than one hour are removed on return, and the browser removes them when the tab is closed.',
            'The free-result share action includes type codes and a result summary in the shared text. Review the audience and included content before posting it publicly.',
          ],
        },
        {
          heading: 'Privacy officer',
          body: [
            'The privacy officer is the representative, Kwak Tae-uk, reachable at sobok2026@gmail.com and +82 10-9203-2837. For privacy-related consultation or reports in Korea you may contact the Personal Information Infringement Report Center (118), the Personal Information Dispute Mediation Committee (1833-6972), and the cyber units of the Supreme Prosecutors’ Office and the National Police Agency.',
          ],
        },
        {
          heading: "Children's privacy",
          body: [
            'The free service is available without age confirmation. Paid reports may be purchased only by people aged 14 or older. We do not collect dates of birth; we store only the 14+ confirmation timestamp submitted at checkout.',
          ],
        },
        {
          heading: 'Changes to this policy',
          body: [
            'If the service or processing changes, we will publish the reason, before-and-after details, and effective date. We give 7 days’ notice for ordinary changes and 30 days for changes materially adverse to users, using a prominent service notice. This page keeps each version, effective date, and links to earlier versions.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      description: 'The terms that apply to using vibe (DeepType), operated by Robin Review.',
      effectiveDate: 'August 1, 2026',
      updatedDate: 'July 30, 2026',
      version: '1.0',
      sections: [
        {
          heading: 'About the service',
          body: [
            `vibe offers the Compatibility and Talk Type quizzes for free, together with a paid report (the ${PRODUCT_NAME.en}) that supports self-understanding at work. It is operated by Robin Review.`,
            'The two free quizzes are a light-hearted way to check couple chemistry. The paid report is self-understanding content that sets out the conditions under which you gain energy at work and the conditions under which you lose it, and it has nothing to do with couple compatibility.',
            '“In-depth” in the product name refers to the range of what is produced, not to measurement precision. The items that follow payment do not change the eight letters your free result already gave you; they only settle how clear each axis is and widen the range of the narration.',
          ],
        },
        {
          heading: 'Definitions and formation of purchase',
          body: [
            '“Service” means the free quizzes and DeepType features provided at vibe.sobok.cc, and “report” means the digital report generated after payment. A report purchase is formed when you review the item, price, access period, and required confirmations on the checkout screen and complete card payment.',
            'There is no account registration. We deliver the report using the purchase email and a server-issued access credential. This is a one-time purchase, not a subscription or automatic renewal.',
          ],
        },
        {
          heading: 'Paid service and payment',
          body: [
            `The ${PRODUCT_NAME.en} is paid digital content priced at ${PRICE_EN} including VAT. The current payment method is a Toss Payments card transaction connected through PortOne. Review the final amount shown before authorizing payment.`,
            'Availability of cards issued outside Korea depends on the issuer and payment provider. The charge is in KRW, and your issuer may apply its own exchange rate and cross-border fees.',
          ],
        },
        {
          heading: 'Delivery of content',
          body: [
            'The report is built by the server from your answers to the in-depth items that follow payment. Those items do not set the eight letters of your free result a second time; they settle how clear each axis is.',
            'The report is delivered in two stages. The body written by our rules engine appears first, and the narrative paragraphs are added after it. Until the narration settles, the report is treated as not yet delivered, and withdrawal is not restricted at that point. If narration reaches the retry limit without succeeding, you can request a full refund through the automatic cancellation control or support.',
            'The report is delivered as a web page, not as a file to download. It requires a modern browser with JavaScript enabled, and there is no program to install. Re-opening it requires that you can receive mail at the address used for the purchase.',
            'The report and email reopening are available for 1 year from payment. Entering the purchase email sends a link that works once for 15 minutes; the report opens after you explicitly select the open button. After 1 year, the report, results, email, and access credential are deleted and recovery is not guaranteed.',
          ],
        },
        {
          heading: 'Withdrawal and refund',
          body: [
            'Withdrawal and refunds are governed by our separate Withdrawal & Refund Policy. In short, the report is fully refundable before you open it, and after you open it withdrawal is restricted as digital content. If it was performed differently from what was advertised, you may still withdraw after opening it as permitted by law.',
          ],
        },
        {
          heading: 'Purchase eligibility and age confirmation',
          body: [
            'The free service is available without age confirmation. Paid reports may be purchased only by people aged 14 or older, who must self-confirm at checkout. We do not collect dates of birth.',
            'A contract entered into by a minor without the consent of their legal representative may be cancelled by the minor or by that representative. Under Article 13(3) of the Korean Act on Consumer Protection in Electronic Commerce, we also state this on the payment screen.',
          ],
        },
        {
          heading: 'Your responsibilities',
          body: [
            'Use an accurate email address you can access, and do not disclose payment or report-access tokens and links. You must not use another person’s email or payment method without permission, automate or bypass requests, reverse engineer or disrupt the service, or resell reports without authorization.',
            'Shared text can contain type codes and a result summary. You decide the audience and should review the included content before posting publicly.',
          ],
        },
        {
          heading: 'For entertainment and reference',
          body: [
            'All results, including the report, are reference information for self-understanding and entertainment and are not a substitute for medical or psychological diagnosis or professional counseling.',
            'The report is not a job placement or employment referral service, and it is not a vocational aptitude test or a hiring tool. The world-job shown in your result is not an actual job on offer; it is a way of showing the role closest to your current answers, and it is not advice to change jobs, quit, or start a business.',
            'You should not rely on the service as the sole basis for important decisions; any decisions and responsibility arising from your use of the service are your own.',
          ],
        },
        {
          heading: 'Suspension of the service',
          body: [
            'We may temporarily suspend the service for security response, maintenance, provider outages, or unavoidable reasons. We will give advance notice where practical and may notify afterward in emergencies. If the service ends, we will provide reasonable advance notice and refund paid content that was not delivered.',
          ],
        },
        {
          heading: 'Advertising',
          body: [
            'vibe may display third-party ads. External sites reached through those ads are responsible for their own content and transactions.',
          ],
        },
        {
          heading: 'Intellectual property',
          body: [
            'Rights to the text, design, logos, and report content belong to Robin Review or their rightful owners, and unauthorized reproduction or distribution is prohibited.',
          ],
        },
        {
          heading: 'Limitation of liability',
          body: [
            'The service is provided “as is,” and to the extent permitted by law our liability for damages arising from your use of, or inability to use, the service is limited. This does not exclude liability for damages caused by our intent or gross negligence.',
          ],
        },
        {
          heading: 'Dispute resolution',
          body: [
            'If a dispute arises, we and the user will make good-faith efforts to resolve it. Where that is difficult, mediation by the Content Dispute Resolution Committee or the Consumer Dispute Settlement Commission is available.',
          ],
        },
        {
          heading: 'Changes to these terms',
          body: [
            'When changing these terms, we publish the reason, before-and-after details, and effective date. We give 7 days’ advance notice for ordinary changes and 30 days for materially adverse changes through a prominent service notice. Revised terms apply to use after the effective date, and this page keeps version and archive links.',
          ],
        },
        {
          heading: 'Governing law and jurisdiction',
          body: [
            'These terms are governed by and interpreted under the laws of the Republic of Korea, and jurisdiction over disputes follows the applicable law.',
          ],
        },
      ],
    },
    refund: {
      title: 'Withdrawal & Refund Policy',
      description: `How withdrawal and refunds work for the ${PRODUCT_NAME.en}.`,
      effectiveDate: 'August 1, 2026',
      updatedDate: 'July 30, 2026',
      version: '1.0',
      sections: [
        {
          heading: 'Withdrawal period',
          body: ['You may withdraw your purchase within 7 days of receiving information about the contract.'],
        },
        {
          heading: 'Withdrawal limits for digital content',
          body: [
            `The ${PRODUCT_NAME.en} is digital content. Under Article 17(2) of the Korean Act on Consumer Protection in Electronic Commerce, withdrawal may be restricted once delivery of the content has begun.`,
            'We clearly indicate on the payment screen that this restriction applies. Before payment, the free run gives you the four letters of your inner type, the four letters of your mind core, your world-job, and your drain-condition signals, so you can see in advance what kind of product this is. The free run can be taken again at any time without payment.',
          ],
        },
        {
          heading: 'Full refund before opening',
          body: [
            'Even after payment, if you have not yet opened the report you can get a full refund at any time. Use the refund request on the report screen for immediate processing, or contact us below.',
            'In the report, the body written by the rules engine appears first and the narrative paragraphs are added after it. Until the narration settles, delivery of the content is treated as not yet begun, so withdrawal is not restricted at that point.',
            'The 1-year reopening period does not extend the refund period or reverse delivery that has already started. We do provide a full refund if final report generation fails or we cannot deliver the paid content.',
          ],
        },
        {
          heading: 'When it differs from what was advertised',
          body: [
            'If the delivered report differs from what was advertised or was performed differently from the contract, you may withdraw even after opening it, within 3 months of delivery or within 30 days of when you learned or could have learned of the fact.',
            'If a defect in the report causes you harm, we compensate for that harm under Article 28(2) of the Korean Content Industry Promotion Act.',
          ],
        },
        {
          heading: 'Refund of overcharges',
          body: [
            'If a payment error or a fault on our side results in a charge greater than the amount actually due, we refund the excess in full at your request. If the overcharge arose for reasons that are not our responsibility, we return the excess less the costs actually incurred in making the refund.',
            'Overcharge refunds are issued to the original payment method.',
          ],
        },
        {
          heading: 'Refund method and timing',
          body: [
            'Refunds are issued to the original payment method. We process refunds within 3 business days of receiving the withdrawal, and if processing is delayed we add delay compensation at 15% per year for the delay period.',
          ],
        },
        {
          heading: 'Age restriction',
          body: [
            'Anyone under 14 may not purchase a paid report. If you learn that a payment was made after an incorrect age confirmation, contact us with the purchase email.',
            'A contract entered into by a minor without the consent of their legal representative may be cancelled by the minor or by that representative. If you want to cancel, contact us below with the purchase email.',
          ],
        },
        {
          heading: 'Refund inquiries',
          body: ['For withdrawal and refund inquiries, contact sobok2026@gmail.com or +82 10-9203-2837.'],
        },
      ],
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
      refund: '申込撤回・返金ポリシー',
    },
    privacy: {
      title: 'プライバシーポリシー',
      description: 'Robin Review が vibe（DeepType）で利用者の情報をどのように扱うかについてご案内します。',
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: '無料診断と有料レポートの区別',
          body: [
            '相性診断・会話タイプ診断の回答は利用者のブラウザ内でのみ計算され、サーバーへ送信・保存されることはありません。これらの診断に会員登録は不要です。',
            'DeepTypeの無料結果はブラウザ内で計算されます。利用者が有料レポートの決済を開始すると、購入処理とレポート提供のために結果コードと回答がサーバーへ送信されます。購入に至らないデータ、pendingまたはfailedで終了した決済試行は、作成または決済試行から30日後に削除します。',
          ],
        },
        {
          heading: '収集する個人情報の項目',
          body: [
            '有料レポートでは、メールアドレスと照会用ハッシュ、無料診断と詳細診断の回答、利用者ご自身が選んだ自己申告コードとその提供の有無、サーバーが算出した結果コードと軸ごとの明瞭度およびレポート、決済情報（手段・承認および取引識別子・金額・同意時刻・14歳以上確認時刻）、接続・利用情報（IPアドレス・端末・ブラウザ情報・ボット防止トークン）を処理します。',
            'Googleツールが有効なページでは、同意状態、閲覧ページ、端末・ブラウザ情報、広告・分析識別子が処理される場合があります。保存型の広告・分析識別子は利用者の選択に従います。高度な同意モードでは、選択前または拒否後にもCookieを使わない同意状態・測定信号がGoogleへ送信される場合があります。',
            'DeepTypeの無料診断では、決済前でも回答した設問数と進行状況、自己申告コードを提供したかどうかが、利用統計イベントとしてGoogleへ送信される場合があります。回答の内容そのものは送信しません。',
            'カード番号などの機微な決済手段情報は決済代行会社が直接処理し、当社は保管しません。',
          ],
        },
        {
          heading: '処理の目的',
          body: [
            'レポートを生成して提供しメールで再閲覧できるようにするため、決済・返金および取引記録を管理するため、不正利用や自動ボットを遮断するため、お問い合わせに対応しサービスを改善する統計のために個人情報を利用します。',
          ],
        },
        {
          heading: '保有および利用期間',
          body: [
            '未購入の結果とpending・failedの購入試行は30日間保管します。レポートの生成後、無料診断と詳細診断の回答および途中保存の下書きは3か月、結果コード・サーバー算出プロファイル・レポート・購入メール・閲覧権限は決済日から1年間保管します。メールリンクの生トークンは保存せずハッシュのみを保存し、15分の期限切れまたは1回使用後の次回定期削除で破棄します。',
            '決済後に詳細設問を終えず、レポートが生成されなかった場合、回答と途中保存の下書きは決済日から90日間保管し、その後削除します。この場合もサーバーが算出したプロファイルは残るため、結果の閲覧は維持されます。',
            'PortOneの元Webhookは90日、接続・セキュリティログは最大3か月保管します。決済・契約・返金の証憑に必要な最小取引記録は5年、問い合わせ・紛争記録は目的に必要な期間、最大3年保管します。1年後にメール・アクセストークン・結果・レポートを最小取引記録から分離して削除し、5年後に最小記録も削除します。',
          ],
        },
        {
          heading: '個人情報処理の委託',
          body: [
            'PortOneとToss Paymentsにカード決済・返金・決済連携を、Anthropic PBCにレポートの記述を、Plus Five Five, Inc.（Resend）に再閲覧用トランザクションメール送信を、Cloudflare, Inc.にホスティング・コンテンツ配信・接続ログ・ボット遮断（Turnstile）を、Supabaseにソウルリージョンでのデータ保管を、Googleに同意管理・分析・広告を委託します。',
            '委託契約の締結にあたり個人情報が安全に管理されるよう必要な事項を定め、受託者を監督します。',
          ],
        },
        {
          heading: '個人情報の国外移転',
          body: [
            '当社は契約の履行に必要な処理委託と保管の目的で、以下のとおり個人情報を国外へ移転します（個人情報保護法第28条の8第1項第3号）。別途の同意に代えて本ポリシーで公開します。',
            'Anthropic PBC（米国）へ、レポートの記述時に送信します。移転する項目は、サーバーが算出したタイプコードと軸の名称・両極のラベル・明瞭度の文言、世界観の職業、消耗する条件のラベル、ルールエンジンがすでに作成したレポート本文です。メールアドレス、設問ごとの回答、軸ごとのスコアは送信しません。移転方法はHTTPSによる暗号化通信で、連絡先は privacy@anthropic.com です。Anthropicは商用APIの入力・出力を既定でモデル学習に使用せず、別途合意やポリシー執行等の例外がなければ30日以内に削除すると案内しています。当社が受け取った記述は当社基準で1年間保管します。',
            'Plus Five Five, Inc.（Resend、米国）へ、再閲覧依頼時に宛先メール、購入日、15分のワンタイムURL、メール本文、送信メタデータを送信します。タイプコードとレポート本文は含めません。移転方法はHTTPSによる暗号化通信で、連絡先は privacy@resend.com です。標準プランのメールデータ保持は30日で、クリック・開封トラッキングは無効にします。',
            'Cloudflare, Inc.（米国）へ移転します。移転する項目は接続情報（IPアドレス・端末情報）とボット防止トークンで、サービス利用時に送信し、ホスティング、コンテンツ配信およびセキュリティの目的でサービス提供期間中に処理されます。ボット検証では、接続元のIPアドレスとウィジェットトークンをCloudflare Turnstileの検証エンドポイント（siteverify）へ送信します。移転方法はHTTPSによる暗号化通信で、連絡先は privacyquestions@cloudflare.com です。',
            'Googleおよび広告・分析パートナーの処理場所は利用地域と提供者インフラにより異なります。同意状態、Cookieを使わない測定信号、または同意した広告・分析データが利用時に送信され、Googleの設定と保持方針に従って処理されます。決済が確定すると、当社のサーバーが取引識別子と決済金額・通貨・商品情報、およびブラウザで収集した分析識別子をGoogleへ直接送信します。この送信は利用者のブラウザを閉じた後に行われる場合があります。連絡先は https://support.google.com/policies でご確認いただけます。',
            'レポートの記述と決済のための移転は、レポートを購入しなければ発生しません。広告・分析を目的とする移転は、フッターの「プライバシー・Cookie設定」から拒否できます。セキュリティとボット遮断のための移転はサービス提供に必要な最小限の範囲で行われ、これを拒否するとサービスをご利用いただけません。拒否の意思はお問い合わせ先にお伝えいただくこともできます。',
          ],
        },
        {
          heading: '情報主体の権利と行使方法',
          body: [
            '利用者は自身の個人情報について、閲覧・訂正・削除・処理停止を求めることができます。非会員は購入に使用したメールで本人確認を行った上で、下記のお問い合わせ先を通じて権利を行使でき、当社は請求を遅滞なく処理します。',
          ],
        },
        {
          id: 'cookies-and-advertising',
          heading: 'Cookieと広告',
          body: [
            'Google AdSense、Google Tag Manager、分析ツールを使用します。Googleタグより前にConsent Mode v2の広告保存・分析保存・広告ユーザーデータ・広告パーソナライズをdeniedで初期化し、対応地域ではGoogle Privacy & Messagingの選択に応じて更新します。拒否すると新しい広告・分析Cookieは保存されませんが、高度な同意モードのCookieを使わない信号は送信される場合があります。',
            'フッターの「プライバシー・Cookie設定」から選択を開き直せます。Google広告設定（https://adssettings.google.com）でも管理できます。元の再閲覧トークンまたは決済識別子があり得る/deep-type/reopenと/deep-type/checkout-returnではAdSenseを読み込みません。',
          ],
        },
        {
          heading: '個人情報の破棄',
          body: [
            '保有期間が過ぎるか処理目的が達成された個人情報は遅滞なく破棄します。電子的ファイルは復元できない方法で削除します。',
          ],
        },
        {
          heading: '安全性確保のための措置',
          body: [
            'データベースアクセスを制限し、通信を暗号化します。決済情報は決済代行会社が処理します。再閲覧リンクは15分・1回限りで、SHA-256トークンハッシュのみを保存します。元トークンはURL fragmentに置き、サーバー接続ログやリファラーに送信されないようにします。メールのクリック・開封トラッキングは無効です。',
            'モバイル決済から戻るためのアクセストークンはURLに含めず、そのタブのsessionStorageに保存します。復帰時に生成から1時間を超えた値を削除し、タブを閉じるとブラウザが削除します。',
            '無料結果の共有テキストにはタイプコードと結果の要約が含まれます。公開前に共有相手と内容をご確認ください。',
          ],
        },
        {
          heading: '個人情報保護責任者',
          body: [
            '個人情報保護責任者は代表者の郭泰旭（クァク・テウク）で、連絡先は sobok2026@gmail.com、+82 10-9203-2837 です。個人情報の侵害に関する相談・申告は、韓国の個人情報侵害申告センター（局番なし118）、個人情報紛争調停委員会（1833-6972）、最高検察庁および警察庁のサイバー担当部署にお問い合わせいただけます。',
          ],
        },
        {
          heading: '子どものプライバシー',
          body: [
            '無料サービスは年齢確認なしで利用できます。有料レポートは14歳以上の方のみ購入でき、生年月日は収集せず、決済時の14歳以上確認時刻のみを保存します。',
          ],
        },
        {
          heading: 'ポリシーの変更',
          body: [
            'サービスまたは処理方法を変更する場合、理由、変更前後の内容、施行日を公開します。通常の変更は7日前、利用者に重大な不利益となる変更は30日前に目立つ場所で案内します。本ページに各バージョン、施行日、過去版リンクを維持します。',
          ],
        },
      ],
    },
    terms: {
      title: '利用規約',
      description: 'Robin Review が運営する vibe（DeepType）のご利用に適用される規約です。',
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: 'サービスについて',
          body: [
            `vibeは相性診断と会話タイプ診断を無料で提供し、仕事における自己理解を助ける有料レポート（${PRODUCT_NAME.ja}）を併せて提供するサービスで、Robin Reviewが運営しています。`,
            '無料の2つの診断は、カップルのケミストリーを気軽に確認するためのツールです。有料レポートは、仕事で力が湧く条件と力が失われる条件を整理する自己理解のためのコンテンツで、カップルの相性とは関係ありません。',
            '商品名の「詳細」は測定の精度ではなく算出の範囲を意味します。決済後に続く設問は、無料結果ですでに出た八文字を変えることはなく、各軸がどれだけ明瞭かを確定し、記述の範囲を広げるだけです。',
          ],
        },
        {
          heading: '用語と購入契約の成立',
          body: [
            '「サービス」はvibe.sobok.ccで提供する無料診断とDeepType機能を、「レポート」は決済後に生成するデジタルコンテンツを指します。決済画面で商品・価格・提供期間・必須の同意事項を確認し、カード決済を完了するとレポートの利用契約が成立します。',
            '会員登録はなく、購入メールとサーバー発行の閲覧権限でレポートを提供します。定期購入や自動更新ではありません。',
          ],
        },
        {
          heading: '有料サービスと決済',
          body: [
            `${PRODUCT_NAME.ja}は${PRICE_JA}（税込）の有料デジタルコンテンツです。現在の決済手段はPortOne経由のToss Paymentsカード決済です。承認前に表示された最終金額をご確認ください。`,
            '韓国以外で発行されたカードの利用可否は発行会社と決済代行会社の方針によります。決済通貨はKRWで、カード会社が為替レートや海外利用手数料を適用する場合があります。',
          ],
        },
        {
          heading: 'コンテンツの提供',
          body: [
            'レポートは、決済後に続く詳細設問の回答をサーバーが採点して作成します。詳細設問は、無料結果ですでに出た八文字を決め直すことはなく、各軸の明瞭度を確定します。',
            'レポートは2段階で提供します。当社のルールエンジンが書いた本文が先に表示され、記述の段落が後から加わります。記述が終わるまではレポートをまだ提供していないものとみなし、この時点では申込撤回は制限されません。記述の生成が再試行の上限を超えて失敗した場合は、自動キャンセル機能またはサポートから全額返金を依頼できます。',
            'レポートは、ダウンロードするファイルではなくウェブ画面で提供します。JavaScriptを有効にした最新のブラウザが必要で、別途インストールするプログラムはありません。再閲覧は、購入に使用したメールを受け取れることが条件となります。',
            'レポートとメールによる再閲覧は決済日から1年間利用できます。購入メールを入力すると15分以内に1回だけ使えるリンクを送り、利用者が開くボタンを選択した後に表示します。1年後はレポート・結果・メール・閲覧権限を削除し、復旧は保証しません。',
          ],
        },
        {
          heading: '申込撤回と返金',
          body: [
            '申込撤回と返金に関する事項は別途の申込撤回・返金ポリシーで定めます。要約すると、レポートを閲覧する前は全額返金され、閲覧後はデジタルコンテンツの性質上、申込撤回が制限されます。ただし表示・広告と異なる形で履行された場合は、閲覧後も法令に従って申込撤回ができます。',
          ],
        },
        {
          heading: '購入資格と年齢確認',
          body: [
            '無料サービスは年齢確認なしで利用できます。有料レポートは14歳以上の方のみ購入でき、決済時に直接確認する必要があります。生年月日は収集しません。',
            '未成年者が法定代理人の同意なく結んだ契約は、未成年者本人または法定代理人が取り消すことができます。当社は電子商取引法第13条第3項に基づき、この事実を決済画面でもご案内します。',
          ],
        },
        {
          heading: '利用者の責任',
          body: [
            '本人が利用できる正確なメールを使用し、決済・再閲覧トークンやリンクを他人に公開しないでください。他人のメール・決済手段の無断使用、自動化や回避、リバースエンジニアリング、サービス妨害、レポートの無断再販売を行ってはなりません。',
            '共有テキストにはタイプコードと結果の要約が含まれます。公開前に、共有相手と内容をご確認ください。',
          ],
        },
        {
          heading: '娯楽・参考目的',
          body: [
            'レポートを含め、vibeが提供するすべての結果は自己理解と娯楽のための参考情報であり、医学的・心理的な診断や専門的なカウンセリングに代わるものではありません。',
            'レポートは職業紹介や就職斡旋のサービスではなく、職業適性検査や採用のツールでもありません。結果に表示される世界観の職業は実際の採用職種ではなく、いまの回答にもっとも近い役割を示す表現であり、転職や退職または起業を勧める助言ではありません。',
            '利用者は本サービスの内容を重要な意思決定の唯一の根拠とすべきではなく、サービス利用に伴う判断と責任は利用者ご自身にあります。',
          ],
        },
        {
          heading: 'サービスの中断',
          body: [
            'セキュリティ対応、保守、提供会社の障害、やむを得ない事由により一時中断する場合があります。可能な場合は事前に、緊急時は事後に案内します。サービス終了時は合理的な期間を置いて案内し、未提供の有料コンテンツを返金します。',
          ],
        },
        {
          heading: '広告',
          body: [
            'vibeには第三者の広告が表示される場合があります。広告を通じて遷移する外部サイトのコンテンツや取引については当該サイトが責任を負います。',
          ],
        },
        {
          heading: '知的財産権',
          body: [
            'サービスに含まれるテキスト・デザイン・ロゴ・レポートのコンテンツに関する権利はRobin Reviewまたは正当な権利者に帰属し、無断での複製・配布を禁じます。',
          ],
        },
        {
          heading: '責任の制限',
          body: [
            '本サービスは「現状有姿」で提供され、法令が認める範囲において、サービスの利用または利用不能によって生じた損害についての責任を制限します。ただし当社の故意または重大な過失による損害についての責任は排除しません。',
          ],
        },
        {
          heading: '紛争の解決',
          body: [
            'サービス利用に関して紛争が生じた場合、当社と利用者は誠実に協議して解決します。協議が難しい場合はコンテンツ紛争調停委員会や消費者紛争調停委員会の調停を利用できます。',
          ],
        },
        {
          heading: '規約の変更',
          body: [
            '規約変更時は理由、変更前後の内容、施行日を公開します。通常の変更は7日前、利用者に重大な不利益となる変更は30日前に目立つ場所で案内します。改定規約は施行日以降の利用に適用し、バージョンと過去版リンクを維持します。',
          ],
        },
        {
          heading: '準拠法と管轄',
          body: [
            '本規約は大韓民国の法令に従って解釈・適用され、サービス利用によって生じた紛争の管轄は関連法令の定めるところによります。',
          ],
        },
      ],
    },
    refund: {
      title: '申込撤回・返金ポリシー',
      description: `${PRODUCT_NAME.ja}の申込撤回と返金に関する事項をご案内します。`,
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: '申込撤回の期間',
          body: ['利用者は契約内容に関する案内を受けた日から7日以内に申込撤回ができます。'],
        },
        {
          heading: 'デジタルコンテンツの申込撤回制限',
          body: [
            `${PRODUCT_NAME.ja}はデジタルコンテンツです。電子商取引法第17条第2項に基づき、コンテンツの提供が開始されると申込撤回が制限される場合があります。`,
            '当社はこの制限が適用される事実を決済画面に明確に表示します。当社は決済前に、無料診断の結果として内タイプの四文字・心のコアの四文字・世界観の職業・消耗する条件のサインを提供し、利用者が商品の性格を事前に確認できるようにします。無料診断は決済なしでいつでも受け直せます。',
          ],
        },
        {
          heading: '閲覧前の全額返金',
          body: [
            '決済後でもレポートをまだ閲覧していなければ、いつでも全額返金を受けられます。レポート画面の返金リクエスト機能で即時に処理するか、下記のお問い合わせ先までご連絡ください。',
            'レポートは、ルールエンジンが書いた本文が先に表示され、記述の段落が後から加わります。記述が終わるまではコンテンツの提供が開始されていないものとみなすため、この時点では申込撤回は制限されません。',
            '1年間の再閲覧期間は返金可能期間を延長したり、すでに始まった提供を取り消したりするものではありません。ただしレポートの生成が最終的に失敗した場合、または当社が提供できない場合は全額返金します。',
          ],
        },
        {
          heading: '表示・広告と異なる場合',
          body: [
            '提供されたレポートが表示・広告の内容と異なる、または契約と異なる形で履行された場合は、閲覧後でも供給を受けた日から3か月以内、その事実を知った日または知り得た日から30日以内に申込撤回ができます。',
            'レポートに欠陥があり利用者に被害が生じた場合、当社はコンテンツ産業振興法第28条第2項に基づきその被害を補償します。',
          ],
        },
        {
          heading: '過誤金の返金',
          body: [
            '決済の誤りや当社の過失により、実際のご利用金額より多く決済された金額は、利用者からのご請求により全額返金します。当社の責めに帰さない事由で過誤金が生じた場合は、返金に実際にかかる費用を差し引いた金額をお返しします。',
            '過誤金の返金は決済した手段で処理します。',
          ],
        },
        {
          heading: '返金の方法と処理期間',
          body: [
            '返金は決済した手段で行われます。当社は申込撤回の受付日から3営業日以内に返金を処理し、処理が遅延する場合は遅延期間について年15%の遅延賠償金を加えてお支払いします。',
          ],
        },
        {
          heading: '年齢制限',
          body: [
            '14歳未満の方は有料レポートを購入できません。年齢を誤って確認して決済したことが判明した場合は、購入メールを添えてお問い合わせください。',
            '未成年者が法定代理人の同意なく結んだ契約は、未成年者本人または法定代理人が取り消すことができます。取消しをご希望の場合は、購入メールを添えて下記のお問い合わせ先までご連絡ください。',
          ],
        },
        {
          heading: '返金のお問い合わせ',
          body: [
            '申込撤回と返金に関するお問い合わせは sobok2026@gmail.com または +82 10-9203-2837 までご連絡ください。',
          ],
        },
      ],
    },
  },
  zh: {
    updatedLabel: '最后更新',
    effectiveLabel: '生效日期',
    versionLabel: '版本',
    contentsLabel: '目录',
    contactLabel: '联系方式',
    nav: {
      privacy: '隐私政策',
      terms: '服务条款',
      refund: '撤回·退款政策',
    },
    privacy: {
      title: '隐私政策',
      description: '说明 Robin Review 在 vibe（DeepType）中如何处理您的信息。',
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: '免费测试与付费报告的区分',
          body: [
            '默契指数测试和对话类型测试的答案仅在您的浏览器内计算，不会发送或保存到我们的服务器。这些测试无需注册。',
            'DeepType 免费结果在浏览器内计算。当您开始购买付费报告时，结果代码与答案会发送至服务器，用于处理购买并提供报告。未完成购买，或最终处于 pending、failed 状态的数据，会在创建或支付尝试30天后删除。',
          ],
        },
        {
          heading: '收集的个人信息项目',
          body: [
            '使用付费报告时，我们会处理以下信息：电子邮箱及查询哈希，免费测验与深度测验的题目答案，您自行选择的自我申报代码及是否提供该代码，服务器计算的结果代码、各轴清晰度与报告，支付信息（方式、授权及交易标识、金额、同意时间、14周岁以上确认时间），以及访问和使用信息（IP地址、设备、浏览器信息、防机器人令牌）。',
            '在启用Google工具的页面中，可能会处理同意状态、访问页面、设备和浏览器信息、广告或分析标识符。存储型广告与分析标识符遵循您的选择。在高级同意模式下，即使尚未选择或拒绝后，也可能向Google发送不使用Cookie的同意状态与测量信号。',
            '在DeepType免费测验中，即使在支付之前，已作答的题目数量、进行到的阶段以及是否提供自我申报代码，也可能作为使用统计事件发送至Google。答案内容本身不会发送。',
            '卡号等敏感的支付方式信息由支付代理公司直接处理，我们不予保存。',
          ],
        },
        {
          heading: '处理目的',
          body: [
            '我们将个人信息用于生成并提供报告、通过邮箱重新查看，用于管理支付、退款与交易记录，用于阻断滥用与自动机器人，用于回复咨询以及改进服务的统计。',
          ],
        },
        {
          heading: '保存及使用期限',
          body: [
            '未购买结果以及pending、failed购买尝试保存30天。报告生成后，免费与深度答案及中途保存的草稿保存3个月；结果代码、服务器计算档案、报告、购买邮箱和访问凭证自付款之日起保存1年。我们不保存邮件链接的原始令牌，只保存哈希；链接15分钟失效或使用一次后，在下一次定期清理时删除。',
            '若您已付款但未完成深度题目，导致报告尚未生成，则答案与中途保存的草稿自付款之日起保存90天，之后删除。此时服务器计算的档案仍会保留，您仍可查看结果。',
            'PortOne原始Webhook保存90天，访问与安全日志最多保存3个月。支付、合同与退款所需的最小交易记录保存5年；咨询或纠纷记录按处理目的所需期限保存，最长3年。1年后，邮箱、访问凭证、结果和报告与最小交易记录分离删除；5年后最小交易记录也会删除。',
          ],
        },
        {
          heading: '个人信息处理的委托',
          body: [
            '我们使用PortOne与Toss Payments处理银行卡支付、退款及支付对接；Anthropic PBC负责报告叙述文字的生成；Plus Five Five, Inc.（Resend）发送重新查看用的事务邮件；Cloudflare, Inc.负责托管、内容分发、访问日志及机器人拦截（Turnstile）；Supabase在首尔区域保存数据库；Google负责同意管理、分析与广告。',
            '在签订委托合同时，我们会约定使个人信息得到安全管理的必要事项，并对受托方进行监督。',
          ],
        },
        {
          heading: '个人信息的跨境转移',
          body: [
            '为履行合同所需的处理委托与保存目的，我们按如下方式将个人信息转移至境外，并以本政策的公开代替单独同意（《个人信息保护法》第28条之8第1款第3项）。',
            '生成报告的叙述文字时转移至 Anthropic PBC（美国）。转移项目为服务器计算的类型代码、各轴名称与两极标签、清晰度表述、世界观职业、容易感到疲惫的条件标签，以及规则引擎已经写好的报告正文。邮箱、逐题答案与各轴分数不会发送。转移方式为HTTPS加密传输，联系方式为 privacy@anthropic.com。Anthropic说明，商业API输入与输出默认不用于模型训练；除另有约定或政策执行等例外外，会在30天内删除。我们收到的叙述文字按本公司的1年期限保存。',
            '申请重新查看时向 Plus Five Five, Inc.（Resend，美国）发送收件邮箱、购买日期、15分钟一次性URL、邮件正文和发送元数据。不包含类型代码或报告正文。转移方式为HTTPS加密传输，联系方式为 privacy@resend.com。标准套餐的邮件数据保存30天，并关闭点击与打开跟踪。',
            '转移至 Cloudflare, Inc.（美国）。转移项目为访问信息（IP 地址·设备信息）与防机器人令牌，在您使用服务时发送，用于托管、内容分发与安全目的，在服务提供期间处理。进行机器人验证时，我们会将访问IP地址与小组件令牌发送至 Cloudflare Turnstile 的验证端点。转移方式为HTTPS加密传输，联系方式为 privacyquestions@cloudflare.com。',
            'Google及其广告或分析合作方的处理地点取决于您的地区和供应商基础设施。同意状态、不使用Cookie的测量信号，或经您同意的广告与分析数据，会在使用服务时发送，并按Google设置与保存政策处理。支付确认后，我们的服务器会将交易标识、支付金额、币种、商品信息以及浏览器收集的分析标识符直接发送至Google。该发送也可能在您关闭浏览器之后发生。联系方式可在 https://support.google.com/policies 确认。',
            '不购买报告时，不会发生为生成报告叙述与处理支付而进行的转移。以广告与分析为目的的转移，可通过页脚的“隐私与Cookie设置”拒绝。为安全与拦截机器人而进行的转移限于提供服务所必需的最小范围，若您拒绝，将无法使用本服务。您也可以通过联系方式表达拒绝的意愿。',
          ],
        },
        {
          heading: '信息主体的权利与行使方式',
          body: [
            '您可以就自己的个人信息要求查阅、更正、删除及停止处理。非会员可用购买时使用的邮箱完成身份确认后，通过下方联系方式行使这些权利，我们会立即处理请求。',
          ],
        },
        {
          id: 'cookies-and-advertising',
          heading: 'Cookie 与广告',
          body: [
            '我们使用Google AdSense、Google跟踪代码管理器和分析工具。在任何Google标签之前，Consent Mode v2会将广告存储、分析存储、广告用户数据与广告个性化初始化为denied；Google Privacy & Messaging会根据支持地区内收集的选择更新状态。拒绝后不会新建广告或分析Cookie，但高级同意模式仍可能发送不使用Cookie的信号。',
            '可通过页脚的“隐私与Cookie设置”重新打开选择，也可在Google广告设置（https://adssettings.google.com）管理个性化。可能包含原始重新查看令牌或支付标识的/deep-type/reopen与/deep-type/checkout-return页面不会加载AdSense。',
          ],
        },
        {
          heading: '个人信息的销毁',
          body: ['保存期限届满或处理目的达成的个人信息将立即销毁。电子文件以无法恢复的方式删除。'],
        },
        {
          heading: '安全保障措施',
          body: [
            '我们限制数据库访问并加密传输。支付信息由支付代理公司处理。重新查看链接15分钟内仅可使用一次，只保存SHA-256令牌哈希；原始令牌放在URL fragment中，避免发送到服务器访问日志或来源页面。邮件点击与打开跟踪已关闭。',
            '移动支付返回所需的访问令牌不会放入URL，而是保存在该标签页的sessionStorage中。返回时会删除创建超过1小时的值，关闭标签页后由浏览器清除。',
            '免费结果的分享文本包含类型代码与结果摘要。公开发布前请确认分享对象与所含内容。',
          ],
        },
        {
          heading: '个人信息保护负责人',
          body: [
            '个人信息保护负责人为代表人郭泰旭，联系方式为 sobok2026@gmail.com、+82 10-9203-2837。有关个人信息侵害的咨询与举报，可联系韩国个人信息侵害举报中心（免区号118）、个人信息纠纷调解委员会（1833-6972）、最高检察厅与警察厅的网络部门。',
          ],
        },
        {
          heading: '儿童隐私',
          body: [
            '免费服务无需年龄确认即可使用。付费报告仅限年满14周岁的用户购买。我们不收集出生日期，只保存结账时提交的14周岁以上确认时间。',
          ],
        },
        {
          heading: '政策变更',
          body: [
            '如服务或处理方式发生变化，我们会公布原因、变更前后内容及生效日期。普通变更提前7天，可能对用户造成重大不利影响的变更提前30天，在服务显著位置通知。本页面保留各版本、生效日期及历史版本链接。',
          ],
        },
      ],
    },
    terms: {
      title: '服务条款',
      description: '适用于使用由 Robin Review 运营的 vibe（DeepType）的条款。',
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: '关于服务',
          body: [
            `vibe 免费提供默契指数测试与对话类型测试，并提供帮助您在工作中了解自己的付费报告（${PRODUCT_NAME.zh}），由 Robin Review 运营。`,
            '两项免费测试是轻松确认情侣默契的工具。付费报告是一份自我了解内容，梳理您在工作中什么条件下更有干劲、什么条件下会被消耗，与情侣合拍度无关。',
            '商品名称中的“深度”指的是产出范围，而不是测量精度。付款后继续作答的题目不会改变免费结果中已经得出的八个字母，只会确定各轴的清晰程度，并扩大叙述范围。',
          ],
        },
        {
          heading: '术语与购买成立',
          body: [
            '“服务”指vibe.sobok.cc提供的免费测试与DeepType功能；“报告”指付款后生成的数字内容。您在结账页面确认商品、价格、访问期限及必需确认，并完成银行卡支付后，报告购买成立。',
            '无需注册账号。我们通过购买邮箱与服务器签发的访问凭证提供报告。本商品为一次性购买，不是订阅，也不会自动续费。',
          ],
        },
        {
          heading: '付费服务与支付',
          body: [
            `${PRODUCT_NAME.zh}为含VAT的${PRICE_ZH}付费数字内容。目前仅支持通过PortOne连接的Toss Payments银行卡支付。授权付款前请确认页面显示的最终金额。`,
            '韩国境外发行的银行卡是否可用取决于发卡机构和支付服务商。结算币种为KRW，发卡机构可能采用其汇率并收取跨境手续费。',
          ],
        },
        {
          heading: '内容的提供',
          body: [
            '报告由服务器对付款后继续作答的深度题目进行评分后生成。深度题目不会重新决定免费结果中已经得出的八个字母，只确定各轴的清晰度。',
            '报告分两个阶段提供。我们的规则引擎所写的正文先行显示，随后附上叙述段落。在叙述完成之前，视为报告尚未提供，此时撤回不受限制。若叙述生成达到重试上限仍失败，可通过自动取消功能或客服申请全额退款。',
            '报告以网页形式提供，不是可下载的文件。需要启用JavaScript的现代浏览器，无需另行安装任何程序。重新查看需要您能够收取购买时使用的邮箱。',
            '报告与邮件重新查看服务自付款之日起提供1年。输入购买邮箱后会发送15分钟内仅可使用一次的链接；您明确点击打开按钮后才会显示报告。1年后将删除报告、结果、邮箱和访问凭证，不保证恢复。',
          ],
        },
        {
          heading: '撤回与退款',
          body: [
            '撤回与退款事宜由单独的《撤回·退款政策》规定。简言之，在查看报告前可全额退款，查看后因数字内容性质撤回受到限制。但若履行方式与展示·广告不符，查看后仍可依法撤回。',
          ],
        },
        {
          heading: '购买资格与年龄确认',
          body: [
            '免费服务无需年龄确认即可使用。付费报告仅限年满14周岁的用户购买，并须在结账时自行确认。我们不收集出生日期。',
            '未成年人未经法定代理人同意订立的合同，未成年人本人或其法定代理人可以撤销。依据《电子商务法》第13条第3款，我们也会在支付页面告知这一事实。',
          ],
        },
        {
          heading: '用户责任',
          body: [
            '请使用本人可访问的准确邮箱，不得向他人泄露支付或报告访问令牌及链接。不得擅自使用他人的邮箱或支付方式，不得自动化请求、绕过限制、反向工程、干扰服务或未经许可转售报告。',
            '分享文本可能包含类型代码与结果摘要。公开发布前，请确认分享对象与所含内容。',
          ],
        },
        {
          heading: '娱乐与参考目的',
          body: [
            '包括报告在内，vibe 提供的所有结果均为自我了解与娱乐的参考信息，不能替代医学或心理诊断或专业咨询。',
            '报告不是职业介绍或就业中介服务，也不是职业适性测验或招聘工具。结果中出现的世界观职业并非实际的招聘岗位，只是用来呈现与您当前答案最接近的角色，也不构成建议您跳槽、离职或创业。',
            '您不应将本服务作为重要决策的唯一依据；因使用本服务而做出的判断与责任由您自行承担。',
          ],
        },
        {
          heading: '服务的中断',
          body: [
            '因安全响应、维护、供应商故障或其他不可避免的原因，我们可能暂时中断服务。可行时会事先通知，紧急情况可事后通知。若终止服务，我们会提前合理期限通知，并退还已付款但未提供的内容。',
          ],
        },
        {
          heading: '广告',
          body: ['vibe 可能会展示第三方广告。通过广告跳转的外部网站，其内容与交易由该网站负责。'],
        },
        {
          heading: '知识产权',
          body: [
            '服务中包含的文本、设计、徽标、报告内容的权利归 Robin Review 或合法权利人所有，禁止未经授权的复制或传播。',
          ],
        },
        {
          heading: '责任限制',
          body: [
            '本服务按“现状”提供，在法律允许的范围内，对因使用或无法使用本服务而产生的损失，我们的责任受到限制。但不排除因我们的故意或重大过失造成损害的责任。',
          ],
        },
        {
          heading: '纠纷的解决',
          body: [
            '如就服务使用发生纠纷，我们与用户将本着诚意协商解决。协商困难时，可利用内容纠纷调解委员会或消费者纠纷调解委员会的调解。',
          ],
        },
        {
          heading: '条款变更',
          body: [
            '变更条款时，我们会公布原因、变更前后内容及生效日期。普通变更提前7天，可能对用户造成重大不利影响的变更提前30天，在服务显著位置通知。修订条款适用于生效日后的使用，并保留版本及历史链接。',
          ],
        },
        {
          heading: '适用法律与管辖',
          body: ['本条款受大韩民国法律管辖并据其解释，因使用服务而产生纠纷的管辖依相关法律的规定。'],
        },
      ],
    },
    refund: {
      title: '撤回·退款政策',
      description: `说明 ${PRODUCT_NAME.zh}的撤回与退款事宜。`,
      effectiveDate: '2026年8月1日',
      updatedDate: '2026年7月30日',
      version: '1.0',
      sections: [
        {
          heading: '撤回期限',
          body: ['用户可在收到有关合同内容的说明之日起7日内进行撤回。'],
        },
        {
          heading: '数字内容的撤回限制',
          body: [
            `${PRODUCT_NAME.zh}为数字内容。依据《电子商务法》第17条第2款，内容的提供一旦开始，撤回可能受到限制。`,
            '我们会在支付页面明确标示适用该限制的事实。在支付之前，我们会通过免费测验的结果提供内在类型的四个字母、内心核心的四个字母、世界观职业以及容易感到疲惫的条件信号，使您可以预先确认商品的性质。免费测验无需付款，可随时重新进行。',
          ],
        },
        {
          heading: '查看前全额退款',
          body: [
            '即使已支付，只要尚未查看报告，随时可获得全额退款。可通过报告页面的退款申请功能即时处理，或联系下方联系方式。',
            '报告先显示规则引擎所写的正文，随后附上叙述段落。在叙述完成之前，视为内容的提供尚未开始，因此撤回不受限制。',
            '1年的重新查看期限不会延长退款期限，也不会撤回已经开始的内容提供。但若报告最终生成失败，或我们无法提供已付款内容，将全额退款。',
          ],
        },
        {
          heading: '与展示·广告不符的情况',
          body: [
            '若所提供的报告与展示·广告内容不符，或以与合同不同的方式履行，则查看后仍可在收到供应之日起3个月内、或在知道或应当知道该事实之日起30日内进行撤回。',
            '若报告存在缺陷并因此给您造成损害，我们将依据《内容产业振兴法》第28条第2款对该损害予以赔偿。',
          ],
        },
        {
          heading: '多收款项的退还',
          body: [
            '因支付错误或我们的过失，收取了多于实际使用金额的款项时，经您申请将全额退还。若多收款项因非我方责任的原因产生，我们将扣除退款实际发生的费用后退还。',
            '多收款项的退还以原支付方式处理。',
          ],
        },
        {
          heading: '退款方式与处理期限',
          body: [
            '退款将以原支付方式进行。我们在收到撤回之日起3个工作日内处理退款，若处理延迟，将就延迟期间按年15%加付延迟赔偿金。',
          ],
        },
        {
          heading: '年龄限制',
          body: [
            '未满14周岁的用户不能购买付费报告。如发现有人错误确认年龄并完成支付，请提供购买邮箱并联系我们。',
            '未成年人未经法定代理人同意订立的合同，未成年人本人或其法定代理人可以撤销。如需撤销，请提供购买邮箱并通过下方联系方式与我们联系。',
          ],
        },
        {
          heading: '退款咨询',
          body: ['有关撤回与退款的咨询，请联系 sobok2026@gmail.com 或 +82 10-9203-2837。'],
        },
      ],
    },
  },
} satisfies Record<Locale, LegalContent>
