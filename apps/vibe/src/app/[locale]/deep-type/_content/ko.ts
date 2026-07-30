import { koAxisContent } from '@deep-type/content/axes.ko'
import { FREE_EFFORT, PAID_EFFORT } from '@deep-type/effort'
import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'

import { createDeepTypeContent } from './create-content'
import { koFreeQuestionOptions } from './question-options/ko.free'
import { koFreeQuestionPrompts } from './question-prompts/ko.free'

// ko is the canonical locale. en/ja/zh carry the same keys as empty strings until a human writes them.
//
// Two counts about the instrument reach a screen and only two (MIGRATION §8.1): `paywall.effortNote`, where the
// reader is already deciding whether to pay, and `methodology.scoringBody`, which is the design document.
// Everywhere else says how long it takes and what comes out — a count on a landing page is a cost quoted before
// anything has been bought. Counts and minutes are interpolated from constants; a literal here would outlive the
// next change to the instrument and become a false claim.
const PRICE_KO = `${DEEP_TYPE_REPORT_OFFER.ko.amount.toLocaleString('ko-KR')}원`

export const deepTypeContent = createDeepTypeContent({
  metadata: {
    title: '겉속유형 무료 검사 · 내 힘이 오래 가는 일의 조건',
    description:
      '왜 이 일에서 유독 지치는지 무료 검사로 확인해요. 속유형 네 글자와 마음의 코어 네 글자에서 내 세계관 직업과 지치는 조건이 나와요.',
  },
  ui: {
    aiGeneratedLabel: '인공지능이 쓴 문단',
    analyzingBody: '고른 답을 같은 기준으로 채점하고 있어요. 곧 내 세계관 직업이 나와요.',
    analyzingTitle: '거의 다 왔어요',
    backCta: '이전 문항',
    closestAnswerHint: '딱 맞는 답이 없으면 가장 가까운 쪽을 골라요.',
    declareBody:
      '평소 나를 소개할 때 써 온 네 글자를 골라요. 채점에는 넣지 않고 검사에서 나온 글자와 어디서 갈리는지 볼 때만 써요.',
    declareTitle: '알고 있는 네 글자가 있나요?',
    declareUnknownHint: '네 문항이면 같이 찾을 수 있어요',
    declareUnknownLabel: '모르겠어요',
    landingCta: '무료로 내 세계관 직업 보기',
    landingNote: `답만 고르면 돼요. 약 ${FREE_EFFORT.minMinutes}~${FREE_EFFORT.maxMinutes}분이면 내 세계관 직업이 나와요.`,
    landingSubtitle:
      '같은 일을 해도 힘이 붙는 자리는 사람마다 달라요. 답을 고르면 속유형 네 글자와 마음의 코어 네 글자를 읽어 내 세계관 직업과 지치는 조건에 이름을 붙여 줘요.',
    landingTitle: '내 힘이 오래 가는 자리는 따로 있어요',
    layerGem: '마음의 코어',
    layerInner: '속유형',
    methodologyCta: '설계 원칙 보기',
    methodologyNoteBody:
      '네 글자 옆에 붙은 선명도와 지치는 신호까지 같이 읽으면 어떤 자리에서 힘이 오래 가는지 보여요.',
    methodologyNoteTitle: '이 결과를 제대로 쓰는 법',
    reopenCta: '구매한 리포트 다시 열기',
    // R4 and R5 of MIGRATION §5.4. R5 names the two moves this product may not push; the career gate reads the
    // negation that follows and lets the sentence stand.
    reportDisclaimer:
      '겉속유형은 자기 이해를 돕는 엔터테인먼트 콘텐츠예요. 심리 진단이나 의료 서비스가 아니고 전문 상담을 대신하지 않아요. 결과는 지금의 답에서 가장 가까운 역할을 보여줘요. 이직이나 퇴사를 권하는 조언이 아니에요.',
    reportRestartCta: '처음부터 다시 풀기',
    reportShareCopied: '결과 문구를 복사했어요.',
    reportShareCta: '내 세계관 직업 공유',
    reportShareText: '내 세계관 직업은 {job} · 속유형 {inner} · 마음의 코어 {gem}',
    revealBody:
      '남은 문항은 무엇이 나를 움직이는지 물어요. 마음의 코어 네 글자가 채워지면 내 세계관 직업과 지치는 조건이 함께 나와요.',
    revealTemplate: '{inner}',
    revealTitle: '속유형 네 글자가 방금 정해졌어요',
    segmentCoreLabel: '나를 움직이는 힘',
    segmentDrainLabel: '지치는 신호',
    segmentTypeLabel: '일하는 방식',
    strengthCardsTitle: '뚜렷하게 나온 강점',
    summaryTemplate: '속유형 {inner} · 마음의 코어 {gem}',
    worldJobCoreLabel: '나를 움직이는 힘',
    worldJobFamilyLabel: '내가 서는 자리',
  },
  paywall: {
    ageConfirmation: '만 14세 이상입니다. 생년월일은 받지 않고 확인 시각만 남겨요.',
    benefits: [
      '나를 깎는 조건과 그 조건을 줄이는 다음 한 걸음',
      '오래 일하게 하는 조건과 끌리는 일의 결이 겹치는 자리',
      '지금 자리에서 넓히기 · 옆으로 한 칸 옮겨 보기 · 새 분야를 작게 시험하기 세 갈래 비교',
    ],
    body: '무료 결과는 무엇이 나를 깎는지까지 읽었어요. 심층 리포트는 어떤 일이 당기는지와 무엇이 있어야 힘이 나는지를 더 물어 지금 하는 일과 연결해요. 답은 그대로 이어지고 다루는 범위가 넓어져요.',
    closeCta: '무료 결과 다시 보기',
    consentPrivacy:
      '이메일 하나로 리포트를 1년 동안 다시 열 수 있어요. 리포트 결제·저장·재열람에 필요한 개인정보 수집·이용에 동의합니다.',
    consentWithdrawal:
      '리포트를 열기 전에는 언제든 전액 환불받을 수 있어요. 완성된 리포트가 열려 제공이 개시된 뒤에는 전자상거래법에 따라 청약철회를 할 수 없다는 점에 동의합니다.',
    cta: '결제하고 심층 리포트 받기',
    methodLabel: '결제 수단',
    methodLabels: {
      card: '카드',
      kakaopay: '카카오페이',
      mobile: '휴대폰',
      paypal: 'PayPal',
      tosspay: '토스페이',
      transfer: '계좌이체',
    },
    minorNotice:
      '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있어요. 구매한 이메일과 함께 알려 주시면 취소를 처리해 드려요.',
    discountTemplate: '{discount}% 할인',
    effortNote: `결제하면 심화 문항 ${PAID_EFFORT.count}개가 이어져요. 약 ${PAID_EFFORT.minMinutes}~${PAID_EFFORT.maxMinutes}분이면 끝나고 답은 중간에 저장되니 오늘 다 못 풀어도 이어서 풀어요.`,
    emailLabel: '리포트를 1년 동안 다시 열 이메일',
    emailPlaceholder: 'you@example.com',
    errorGeneric: '결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorUnavailable: '보안 확인 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
    errorVerificationExpired: '보안 확인이 만료됐어요. 아래에서 한 번 더 확인하고 결제해 주세요.',
    errorVerificationFailed: '보안 확인을 통과하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    fallbackNote: '리포트를 만들지 못했어요. 무료 결과는 그대로 있고 결제한 금액은 전액 돌려받을 수 있어요.',
    generatingBody:
      '고른 답을 오래 일하게 하는 조건과 나를 깎는 조건으로 가른 뒤 이번 주에 시험할 7일 퀘스트까지 붙이고 있어요.',
    generatingTitle: '내 리포트를 쓰고 있어요',
    narrativePendingNote: '읽을 내용은 아래에 이미 다 나왔어요. 다듬은 문장이 잠시 뒤 같은 화면에 붙어요.',
    notice: '한 번만 결제하고 정기결제는 없어요. 완성된 리포트는 입력한 이메일로 1년 동안 다시 열 수 있어요.',
    paypalCancel: '입력으로 돌아가기',
    paypalHint: '아래 PayPal 버튼을 눌러 결제를 마무리해 주세요.',
    processing: '결제를 준비하고 있어요...',
    refinementFailedBody: '고른 답은 여기 그대로 있어요. 연결을 확인하고 다시 보내 주세요.',
    refinementFailedTitle: '답을 보내지 못했어요',
    refinementIntroBody:
      '여기서 답한 내용으로 오래 일하게 하는 조건과 끌리는 일의 결 그리고 살펴볼 만한 역할군이 채워져요. 이미 나온 여덟 글자는 그대로 두고 축마다 얼마나 선명한지와 리포트가 다루는 범위를 정해요. 앞선 답에 맞출 필요 없이 실제 모습대로 고르면 돼요.',
    refinementIntroCta: '이어서 답하기',
    refinementIntroHint: '멋있어 보이는 답 말고 지난 몇 주의 나에 가까운 쪽을 골라요.',
    refinementIntroTitle: '이제 리포트가 다룰 범위를 넓혀요',
    refinementRetryCta: '다시 보내기',
    refinementStepLabel: '심화 문항',
    refinementSubmitting: '답을 모으고 있어요...',
    refundCta: '결제 취소 요청',
    refundDone: '결제가 취소됐어요.',
    refundFailed: '자동 취소를 완료하지 못했어요. 고객센터에 문의해 주세요.',
    refundPending: '취소를 처리하고 있어요...',
    resumeNote: '지난번에 답한 곳까지 그대로 있어요. 다음 문항부터 이어 풀어요.',
    title: '이번 주에 뭘 바꿀지까지 정해서 받아요',
    unknownPersonaNote:
      '나머지는 그대로 다 나와요. 앞에서 네 글자를 모르겠어요로 골랐다면 알던 글자와 비교하는 대목만 빠져요.',
    unlockCta: '심층 리포트로 이어가기',
    workDimensions: {
      drain: '무엇이 나를 깎는지',
      environment: '어떤 환경에서 오래 가는지',
      interest: '어떤 일이 당기는지',
      need: '무엇이 있어야 힘이 나는지',
      purpose: '어떤 순간에 의미가 생기는지',
    },
    workStepLabel: '일과 행복',
  },
  axes: koAxisContent,
  // The ad-landing block. Ported from the reference build's conversion layer, with its Persona/MBTI framing
  // replaced by the career framing this product actually delivers — the structure is what carried the value,
  // not the vocabulary. Counts of sections or cards stay out of `ui.landing*` and out of here: the copy gate
  // reads these keys and D5 does not let the page promise a number of deliverables.
  landing: {
    kicker: '퇴근길마다 방전되는 이유가 있어요',
    facts: [
      { label: '검사 비용', value: '무료' },
      { label: '걸리는 시간', value: `약 ${FREE_EFFORT.minMinutes}~${FREE_EFFORT.maxMinutes}분` },
      { label: '결과 확인', value: '바로' },
    ],
    ctaMeta: '가입이나 결제 없이 바로 시작해요.',
    getsTitle: '결제 없이 여기까지 바로 나와요.',
    getsBodies: [
      '에너지 방향 · 정보 초점 · 판단 기준 · 실행 방식 네 축이 어느 쪽으로 기울었는지 글자로 나와요.',
      '인정의 자리 · 조율의 폭 · 감정 처리 · 목표 초점 네 축으로 무엇이 나를 움직이는지 읽어요.',
      '두 코드가 만나 내 세계관 직업 하나에 이름이 붙어요.',
      '어떤 조건에서 힘이 빠지는지 그 신호에 이름을 붙여 짚어 줘요.',
    ],
    asks: [
      {
        question: '왜 퇴근하면 아무것도 하기 싫을까?',
        body: '일의 양인지 사람인지 내 방식대로 못 하는 것인지 갈라서 이름을 붙여요.',
      },
      {
        question: '나는 뭘 잘하고 어떤 일을 해야 행복할까?',
        body: '힘을 덜 들여도 잘되는 강점에 이름을 붙이고 그 강점이 살아나는 조건까지 같이 봐요.',
      },
      {
        question: '왜 같은 일인데 자리마다 다를까?',
        body: '자리가 바뀌면 같은 사람도 다르게 굴러가요. 내 힘이 붙는 조건을 먼저 이름으로 확인해요.',
      },
    ],
    stepsTitle: '결과까지 세 단계예요.',
    steps: [
      { title: '평소 나를 소개할 때 쓰던 네 글자를 골라요.', duration: '10초' },
      {
        title: '일할 때 실제로 어떻게 하는지 묻는 문항에 답해요.',
        duration: `약 ${FREE_EFFORT.minMinutes}~${FREE_EFFORT.maxMinutes}분`,
      },
      { title: '내 세계관 직업과 지치는 조건을 바로 받아요.', duration: '바로 확인' },
    ],
    stickyCta: '무료로 내 세계관 직업 보기',
    offerNote: `무료 검사 결과는 결제 없이 다 볼 수 있어요. 일과 연결한 심층 리포트는 원할 때 고르는 ${PRICE_KO} 유료 상품이고 정기결제는 없어요.`,
  },
  selfImage: {
    segmentLabel: '알던 네 글자',
    title: '네 글자를 같이 찾아볼까요?',
    body: '네 문항이면 돼요. 실제로 어떻게 했는지가 아니라 스스로 어떤 사람이라고 생각하는지만 고르면 돼요.',
    items: [
      {
        prompt: '사람들 사이에 있을 때 나는 어떤 사람이라고 생각해요?',
        options: ['먼저 말을 꺼내는 편이에요', '듣고 있다가 필요할 때 꺼내는 편이에요'],
      },
      {
        prompt: '무언가를 설명할 때 나는 어떤 사람이라고 생각해요?',
        options: ['실제로 있었던 일부터 말하는 편이에요', '그래서 무슨 뜻인지부터 말하는 편이에요'],
      },
      {
        prompt: '결정을 내릴 때 나는 어떤 사람이라고 생각해요?',
        options: ['기준이 맞는지 먼저 보는 편이에요', '사람들이 어떻게 받아들일지 먼저 보는 편이에요'],
      },
      {
        prompt: '일을 시작할 때 나는 어떤 사람이라고 생각해요?',
        options: ['먼저 정해 두고 움직이는 편이에요', '해 보면서 맞춰 가는 편이에요'],
      },
    ],
  },
  gemNames: {
    ROVU: '루비',
    ROVO: '호박',
    ROHU: '가넷',
    ROHO: '옥',
    RAVU: '터키석',
    RAVO: '아쿠아마린',
    RAHU: '흑요석',
    RAHO: '다이아몬드',
    MOVU: '토파즈',
    MOVO: '로즈쿼츠',
    MOHU: '문스톤',
    MOHO: '진주',
    MAVU: '오팔',
    MAVO: '페리도트',
    MAHU: '사파이어',
    MAHO: '스모키쿼츠',
  },
  methodology: {
    title: '설계 원칙과 연구 배경',
    intro:
      '겉속유형은 일에서 내 힘이 어디서 붙고 어디서 새는지 읽도록 만든 자기탐구 도구예요. 연구를 참고해 문항과 결과 문장의 기준을 잡았어요.',
    modelTitle: '두 네 글자와 세계관 직업',
    modelBody:
      '속유형은 일할 때의 판단과 실행을 네 축으로 읽고 마음의 코어는 무엇이 나를 움직이는지 네 축으로 읽어요. 두 코드가 만나 하나의 세계관 직업으로 이어져요. 일과행복 문항은 코드에 넣지 않고 따로 집계해 지치는 조건과 힘이 오래 가는 조건을 봐요.',
    scoringTitle: '문항과 채점',
    scoringBody: `무료 단계는 ${FREE_EFFORT.count}문항이고 결제 후에는 여덟 축과 일과행복을 더 깊이 확인하는 심화 ${PAID_EFFORT.count}문항이 이어져요. 각 문항은 의미가 구체적인 네 선택지 중 가장 가까운 답을 고르며 역문항을 함께 넣었어요. 서버가 문항 ID·중복·누락·응답 범위를 확인한 뒤 축별 점수를 계산해요.`,
    evidenceTitle: '이론적 출발점',
    evidenceBody:
      '일하는 방식 네 축은 상황별 성향 표현 연구를 참고했어요. 마음의 코어 네 축은 자기가치의 조건과 자율성·조율, 정서 조절, 조절 초점 연구를 참고했어요. 일과행복 문항은 흥미 유형과 기본 심리욕구 그리고 직무요구-자원 연구를 참고했어요.',
    principlesTitle: '결과를 읽는 원칙',
    principles: [
      '네 글자만 보지 않고 축마다 붙은 선명도를 같이 읽어요.',
      '세계관 직업은 직업 안내가 아니라 지금 답이 모인 자리에 붙인 이름이에요.',
      '어느 방향에나 잘 맞는 자리와 깎이는 자리가 같이 있어요.',
      '리포트의 질문과 작은 실험을 일주일 단위로 해 보며 내게 맞는 쓰임을 찾아요.',
    ],
    sourcesTitle: '참고 연구와 표준',
    // R7 of MIGRATION §5.4. The full list stays withheld because it exposes item design, so the sentence says
    // why and to whom it is available instead of leaving the omission unexplained.
    sourcesIntro:
      '아래 문헌은 축을 설계할 때 직접 인용한 기준 문헌이에요. 확인한 자료 전체 목록은 문항 설계가 드러나서 공개하지 않고 관계기관이 요청하면 실증자료로 제출해요.',
    backCta: '검사로 돌아가기',
  },
  questionOptions: koFreeQuestionOptions,
  questionPrompts: koFreeQuestionPrompts,
})
