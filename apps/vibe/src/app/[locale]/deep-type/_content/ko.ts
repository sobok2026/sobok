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
const PRICE_KO = `${DEEP_TYPE_REPORT_OFFER.amount.toLocaleString('ko-KR')}원`

export const deepTypeContent = createDeepTypeContent({
  metadata: {
    title: '겉속유형 — 일에서 힘이 오래 가는 조건',
    description:
      '무료 검사로 속유형 네 글자와 마음의 코어 네 글자를 읽고 내 세계관 직업과 지치는 조건 신호를 확인해요.',
  },
  ui: {
    aiGeneratedLabel: '인공지능이 쓴 문단',
    analyzingBody: '지금까지 고른 답을 같은 기준으로 채점하고 있어요.',
    analyzingTitle: '답을 모으고 있어요',
    backCta: '이전 문항',
    closestAnswerHint: '딱 맞는 답이 없으면 가장 가까운 쪽을 골라요.',
    declareBody:
      '평소 나를 소개할 때 써 온 네 글자를 골라요. 채점에는 쓰지 않아요. 검사에서 나온 글자와 어디서 갈리는지 볼 때만 써요.',
    declareNotice: '모르겠어요를 고르면 심층 리포트에서 그 비교를 다루는 대목이 빠져요. 나머지는 그대로 나와요.',
    declareTitle: '알고 있는 네 글자가 있나요?',
    declareUnknownLabel: '모르겠어요',
    landingCta: '무료로 시작하기',
    landingNote: `무료 · 약 ${FREE_EFFORT.minMinutes}~${FREE_EFFORT.maxMinutes}분 · 완료 즉시 내 세계관 직업 확인 · 심층 결과 ${PRICE_KO} · 한 번 결제`,
    landingStepCoreDesc: '무엇이 나를 움직이는지 네 글자로 봐요.',
    landingStepJobDesc: '두 글자 묶음이 만나 내 세계관 직업 하나로 이어져요.',
    landingStepTypeDesc: '일할 때 판단과 실행이 어디로 기우는지 네 글자로 봐요.',
    landingSubtitle:
      '같은 일을 해도 힘이 붙는 자리는 사람마다 달라요. 답을 고르면 내가 일하는 방식과 나를 움직이는 힘을 읽어 그 조합에 붙는 세계관 직업을 보여줘요.',
    landingTitle: '어떤 일에서 내 힘이 오래 갈까?',
    layerGem: '마음의 코어',
    layerInner: '속유형',
    methodologyCta: '설계 원칙 보기',
    methodologyNoteBody:
      '네 글자만 보지 말고 옆에 붙은 선명도와 지치는 신호를 같이 읽어요. 그래야 어떤 자리에서 힘이 오래 가는지 보여요.',
    methodologyNoteTitle: '이 결과를 읽는 법',
    reopenCta: '구매한 리포트 다시 열기',
    // R4 and R5 of MIGRATION §5.4. R5 names the two moves this product may not push; the career gate reads the
    // negation that follows and lets the sentence stand.
    reportDisclaimer:
      '겉속유형은 자기 이해를 돕는 엔터테인먼트 콘텐츠예요. 심리 진단이나 의료 서비스가 아니고 전문 상담을 대신하지 않아요. 결과는 지금의 답에서 가장 가까운 역할을 보여줘요. 이직이나 퇴사를 권하는 조언이 아니에요.',
    reportRestartCta: '처음부터 다시 풀기',
    reportShareCopied: '결과 문구를 복사했어요.',
    reportShareCta: '결과 공유',
    reportShareText: '내 속유형은 {inner} · 마음의 코어는 {gem}이에요.',
    revealBody:
      '이어지는 문항은 무엇이 나를 움직이는지 물어요. 마음의 코어 네 글자가 채워지면 내 세계관 직업이 나와요.',
    revealTemplate: '{inner}',
    revealTitle: '속유형 네 글자가 나왔어요',
    segmentCoreLabel: '나를 움직이는 힘',
    segmentDrainLabel: '지치는 신호',
    segmentTypeLabel: '일하는 방식',
    strengthCardsTitle: '뚜렷하게 나온 강점',
    summaryTemplate: '속유형 {inner} · 마음의 코어 {gem}',
    worldJobCoreLabel: '나를 움직이는 힘',
    worldJobFamilyLabel: '내가 서는 자리',
  },
  paywall: {
    ageConfirmation: '만 14세 이상입니다.',
    benefits: [
      '내 세계관 직업이 살아나는 자리와 죽는 자리',
      '나를 깎는 조건과 그 조건을 줄이는 선택',
      '힘이 오래 가는 환경과 그 환경을 만드는 순서',
    ],
    body: '무료 결과에서 나온 세계관 직업과 지치는 신호를 실제 일과 연결해 무엇이 나를 지키고 무엇이 나를 깎는지 정리해요.',
    closeCta: '무료 결과로 돌아가기',
    consentPrivacy: '리포트 결제·저장·재열람을 위한 정보 이용에 동의합니다.',
    consentWithdrawal:
      '리포트 제공이 개시되면 전자상거래법에 따라 청약철회를 할 수 없다는 점에 동의합니다. 리포트를 열기 전에는 언제든 전액 환불받을 수 있어요.',
    cta: '심층 리포트 시작하기',
    minorNotice: '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있어요.',
    discountTemplate: '{discount}% 할인',
    effortNote: `결제하면 심화 문항 ${PAID_EFFORT.count}개가 이어져요. 약 ${PAID_EFFORT.minMinutes}~${PAID_EFFORT.maxMinutes}분 걸리고 중간에 저장되니 나중에 이어 풀어도 돼요.`,
    emailLabel: '리포트를 저장하고 다시 열 이메일',
    emailPlaceholder: 'you@example.com',
    errorGeneric: '결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorUnavailable: '보안 확인 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
    errorVerificationExpired: '보안 확인이 만료됐어요. 아래에서 한 번 더 확인하고 결제해 주세요.',
    errorVerificationFailed: '보안 확인을 통과하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    fallbackNote: '리포트를 만들지 못해 무료 결과를 보여드려요.',
    generatingBody: '지금까지 고른 답을 지치는 조건과 힘이 오래 가는 조건으로 정리하고 있어요.',
    generatingTitle: '리포트를 쓰고 있어요',
    narrativePendingNote: '읽을 내용은 아래에 다 나왔어요. 문장을 다듬은 판이 곧 붙어요.',
    notice: '1회 결제이며 정기결제가 아니에요. 완성된 리포트는 입력한 이메일로 다시 열 수 있어요.',
    processing: '결제를 준비하고 있어요...',
    refinementFailedBody: '고른 답은 여기 그대로 있어요. 연결을 확인하고 다시 보내 주세요.',
    refinementFailedTitle: '답을 보내지 못했어요',
    refinementIntroBody:
      '여덟 축을 더 깊이 확인하는 심화 문항이에요. 앞선 결과에 맞출 필요 없어요. 여기서 나온 답은 이미 나온 네 글자를 바꾸지 않고 그 글자가 얼마나 선명한지를 정해요.',
    refinementIntroCta: '심화 문항 시작',
    refinementIntroHint: '좋아 보이는 답보다 실제로 자주 나오는 모습에 가까운 쪽을 골라요.',
    refinementIntroTitle: '심화 문항으로 이어가요',
    refinementRetryCta: '다시 보내기',
    refinementStepLabel: '심화 문항',
    refinementSubmitting: '답을 모으고 있어요...',
    refundCta: '결제 취소 요청',
    refundDone: '결제가 취소됐어요.',
    refundFailed: '자동 취소를 완료하지 못했어요. 고객센터에 문의해 주세요.',
    refundPending: '취소를 처리하고 있어요...',
    resumeNote: '지난번에 답한 데까지 불러왔어요. 그다음 문항부터 이어 풀어요.',
    title: '이 결과가 실제 일에서 어떻게 작동하는지 봐요',
    unknownPersonaNote: '앞에서 네 글자를 모르겠어요로 골랐다면 그 비교를 다루는 대목은 빠져요. 나머지는 같아요.',
    unlockCta: '심층 결과 보기',
    workDimensions: {
      drain: '무엇이 나를 깎는지',
      environment: '어떤 환경에서 오래 가는지',
      interest: '어떤 일이 당기는지',
      need: '무엇이 있어야 힘이 나는지',
      purpose: '어떤 순간에 의미가 생기는지',
    },
    workStepLabel: '일과 행복',
  },
  axes: {
    EI: {
      name: '에너지 방향',
      description: '사람과 주고받을 때 힘이 붙는 쪽과 혼자 정리할 때 힘이 붙는 쪽을 봐요.',
      first: {
        label: '밖으로 꺼내기',
        description: '말하고 부딪히면서 생각이 자리를 잡는 편',
        reflection: '말로 꺼내야 풀리는 일과 혼자 봐야 풀리는 일을 나눠 봐요.',
      },
      second: {
        label: '안에서 고르기',
        description: '혼자 정리한 뒤에 꺼낼 때 말이 단단해지는 편',
        reflection: '혼자 보내는 시간이 회복인지 미루기인지 그날 기준으로 살펴봐요.',
      },
    },
    SN: {
      name: '정보 초점',
      description: '확인된 사실부터 보는 쪽과 연결과 가능성부터 보는 쪽을 봐요.',
      first: {
        label: '사실·적용',
        description: '지금 확인할 수 있는 것부터 짚는 편',
        reflection: '사실을 충분히 모았는지와 큰 그림을 놓치지 않았는지 같이 확인해 봐요.',
      },
      second: {
        label: '연결·가능성',
        description: '숨은 연결과 다음 수를 먼저 보는 편',
        reflection: '떠오른 가능성 중 이번 주에 확인할 하나를 골라 봐요.',
      },
    },
    TF: {
      name: '판단 기준',
      description: '기준의 일관성을 먼저 보는 쪽과 사람에게 갈 영향을 먼저 보는 쪽을 봐요.',
      first: {
        label: '기준·정합성',
        description: '같은 기준으로 설명되는지 먼저 보는 편',
        reflection: '기준이 맞는지와 그 결정이 사람에게 남길 자국을 같이 적어 봐요.',
      },
      second: {
        label: '사람·영향',
        description: '맥락과 사람에게 갈 영향을 먼저 보는 편',
        reflection: '배려하려는 마음과 지키고 싶은 기준을 한 문장씩 적어 봐요.',
      },
    },
    JP: {
      name: '실행 방식',
      description: '먼저 정하고 움직이는 쪽과 열어 두고 맞추는 쪽을 봐요.',
      first: {
        label: '구조·마감',
        description: '순서와 기한을 정해 흔들림을 줄이는 편',
        reflection: '계획이 통제감을 주는지 새 정보를 막는지 살펴봐요.',
      },
      second: {
        label: '유연·탐색',
        description: '선택지를 열어 두고 상황에 맞추는 편',
        reflection: '열어 둘 선택과 오늘 닫을 선택을 하나씩 정해 봐요.',
      },
    },
    RM: {
      name: '인정의 자리',
      description: '내 기준으로 값을 매기는 쪽과 남의 반응에 값이 따라 움직이는 쪽을 봐요.',
      first: {
        label: '내 기준',
        description: '피드백을 참고하되 내 판단을 들고 가는 편',
        reflection: '바깥 피드백을 놓치지 않으면서 내가 지키는 기준을 확인해 봐요.',
      },
      second: {
        label: '반응 살피기',
        description: '인정과 반응의 온도에 힘이 따라 움직이는 편',
        reflection: '지금 필요한 게 정보인지 인정인지 이름을 붙여 봐요.',
      },
    },
    OA: {
      name: '조율의 폭',
      description: '먼저 맞추고 움직이는 쪽과 내 범위를 잡고 움직이는 쪽을 봐요.',
      first: {
        label: '맞추고 가기',
        description: '움직이기 전에 관계된 사람과 먼저 맞추는 편',
        reflection: '어디까지 맞추면 충분한지 상대에게 말해 봐요.',
      },
      second: {
        label: '정하고 가기',
        description: '내 범위 안에서 정한 뒤에 알리는 편',
        reflection: '혼자 정할 범위와 미리 알릴 범위를 나눠 봐요.',
      },
    },
    VH: {
      name: '감정 처리',
      description: '말하면서 정리되는 쪽과 안에서 정리한 뒤 꺼내는 쪽을 봐요.',
      first: {
        label: '말하며 정리',
        description: '믿는 사람에게 말할 때 감정의 이름이 잡히는 편',
        reflection: '지금 필요한 게 해결인지 공감인지 먼저 알려 봐요.',
      },
      second: {
        label: '안에서 정리',
        description: '혼자 이해할 시간을 가진 뒤 꺼내는 편',
        reflection: '시간을 달라고 말하면서 다시 이야기할 때도 같이 정해 봐요.',
      },
    },
    UO: {
      name: '목표 초점',
      description: '얻을 것을 먼저 보는 쪽과 잃지 않을 것을 먼저 보는 쪽을 봐요.',
      first: {
        label: '성장 초점',
        description: '새 기회와 원하는 변화가 먼저 몸을 움직이는 편',
        reflection: '기대하는 것과 감당할 수 있는 손실을 같이 적어 봐요.',
      },
      second: {
        label: '보존 초점',
        description: '위험을 줄이고 가진 것을 지키는 쪽이 먼저 움직이는 편',
        reflection: '지킬 것과 시험해 볼 작은 범위를 따로 정해 봐요.',
      },
    },
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
