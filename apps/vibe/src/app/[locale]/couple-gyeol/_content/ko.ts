import type { GyeolContent } from '../_lib/types'

export const rarityContent = {
  axes: {
    affection: {
      description: '서로에게 애정이 닿고 확인되는 방식',
      label: '애정 온도',
    },
    balance: {
      description: '닮음과 다름을 관계 안에서 맞추는 힘',
      label: '관계 균형',
    },
    recovery: {
      description: '서운함 뒤에 다시 가까워지는 힘',
      label: '회복력',
    },
    tempo: {
      description: '각자의 일상 속도를 함께 맞추는 감각',
      label: '생활 템포',
    },
  },
  grades: {
    1: {
      description:
        '결타레 모델에서 네 가지 축이 모두 선명하게 맞물린 조합이에요. 둘만의 기준이 강하고, 함께 있을 때 관계의 결이 또렷하게 드러나요.',
      label: '1등급',
      mountainLabel: '선명한 결',
    },
    2: {
      description:
        '애정, 템포, 균형, 회복 중 여러 축이 안정적으로 받쳐주는 조합이에요. 서로가 어떤 방식으로 편해지는지 꽤 잘 알고 있어요.',
      label: '2등급',
      mountainLabel: '단단한 결',
    },
    3: {
      description:
        '한두 축에서 개성이 뚜렷하게 보이는 조합이에요. 닮은 부분과 다른 부분이 적당히 섞여, 둘만의 방식이 잘 만들어져 있어요.',
      label: '3등급',
      mountainLabel: '개성 있는 결',
    },
    4: {
      description:
        '크게 튀기보다 균형이 좋은 조합이에요. 서로의 속도와 표현을 맞춰가며 편안한 기반을 만들어가는 쪽에 가까워요.',
      label: '4등급',
      mountainLabel: '균형 잡힌 결',
    },
    5: {
      description:
        '많은 커플이 공감할 만한 편안한 조합이에요. 특별한 방식보다 일상에서 반복되는 안정감이 관계를 붙잡아줘요.',
      label: '5등급',
      mountainLabel: '편안한 결',
    },
    6: {
      description:
        '아직 더 맞춰볼 여지가 있는 조합이에요. 서로에게 잘 통하는 방식과 조금 어긋나는 방식을 함께 알아가는 단계에 가까워요.',
      label: '6등급',
      mountainLabel: '맞춰가는 결',
    },
    7: {
      description:
        '지금은 결이 선명하다기보다 탐색이 더 큰 조합이에요. 부담 없이 작은 기준부터 맞춰가면 둘만의 방식이 조금씩 잡혀요.',
      label: '7등급',
      mountainLabel: '새로 짓는 결',
    },
  },
  metadata: {
    description: '16문항으로 애정 온도, 생활 템포, 관계 균형, 회복력을 살펴보는 비임상 커플 성향 테스트예요.',
    title: '커플 결 지수 테스트',
  },
  questions: [
    {
      id: 'duration',
      options: [
        { id: 'duration-new', label: '아직 서로의 기준을 조심스럽게 맞춰가는 중' },
        { id: 'duration-seasonal', label: '계절이 몇 번 지나며 자연스러운 규칙이 생김' },
        { id: 'duration-long', label: '오래 쌓인 경험과 기준이 꽤 많음' },
      ],
      question: '서로의 생활 기준을 맞추는 방식은?',
    },
    {
      id: 'frequency',
      options: [
        { id: 'frequency-daily', label: '매일 작은 접점이 있어야 마음이 놓임' },
        { id: 'frequency-steady', label: '각자 시간을 지켜도 흐름이 흔들리지 않음' },
        { id: 'frequency-event', label: '평소엔 각자 있다가 중요한 순간에 확 가까워짐' },
      ],
      question: '함께 보내는 일상의 밀도는?',
    },
    {
      id: 'replyRhythm',
      options: [
        { id: 'reply-fast', label: '생각나면 바로 정하고 움직이는 편' },
        { id: 'reply-slow', label: '충분히 살핀 뒤 안정적으로 맞추는 편' },
        { id: 'reply-asymmetric', label: '한쪽은 먼저 끌고, 한쪽은 깊게 받아주는 편' },
      ],
      question: '약속이나 계획을 정할 때 둘의 템포는?',
    },
    {
      id: 'planning',
      options: [
        { id: 'plans-flexible', label: '즉흥과 계획을 상황에 맞게 섞는 편' },
        { id: 'plans-planned', label: '일정과 컨디션을 미리 맞춰야 편함' },
        { id: 'plans-drifting', label: '그때그때 흘러가다 종종 엇갈림' },
      ],
      question: '데이트나 쉬는 날을 잡는 방식은?',
    },
    {
      id: 'changeResponse',
      options: [
        { id: 'change-fast', label: '변수가 생기면 바로 방향을 바꿈' },
        { id: 'change-cautious', label: '조금 살핀 뒤 천천히 바꾸는 편' },
        { id: 'change-role-split', label: '한쪽은 움직이고 한쪽은 정리하며 맞춤' },
      ],
      question: '갑자기 계획이 바뀌면 둘은?',
    },
    {
      id: 'expression',
      options: [
        { id: 'expression-direct', label: '좋으면 좋다고 비교적 선명하게 표현함' },
        { id: 'expression-subtle', label: '분위기, 행동, 타이밍으로 먼저 보여줌' },
        { id: 'expression-mixed', label: '직접 표현과 둘만 아는 신호를 섞는 편' },
      ],
      question: '애정을 느끼고 보여주는 방식은?',
    },
    {
      id: 'reassurance',
      options: [
        { id: 'reassurance-clear', label: '필요한 말은 확실히 해줘야 안정됨' },
        { id: 'reassurance-subtle', label: '작은 행동과 분위기로도 충분히 느껴짐' },
        { id: 'reassurance-awkward', label: '마음은 있는데 표현 타이밍을 놓칠 때가 있음' },
      ],
      question: '확인이 필요할 때 가장 잘 통하는 방식은?',
    },
    {
      id: 'support',
      options: [
        { id: 'support-listen', label: '끝까지 들어주고 마음을 짚어주면 힘이 남' },
        { id: 'support-practical', label: '도움이 되는 행동을 바로 해줄 때 든든함' },
        { id: 'support-light', label: '가벼운 장난이나 전환으로 숨통이 트임' },
      ],
      question: '힘든 날 서로에게 가장 필요한 반응은?',
    },
    {
      id: 'repair',
      options: [
        { id: 'repair-fast', label: '빨리 확인해야 마음이 놓임' },
        { id: 'repair-cooldown', label: '조금 식힌 뒤 차분히 다시 맞춤' },
        { id: 'repair-comeback', label: '잠깐 멀어져도 결국 다시 붙는 힘이 있음' },
      ],
      question: '서운함이 생기면 어떻게 돌아오나요?',
    },
    {
      id: 'apology',
      options: [
        { id: 'apology-fast', label: '짧게라도 빨리 미안하다고 해야 풀림' },
        { id: 'apology-action', label: '말보다 달라진 행동이 보여야 믿음이 감' },
        { id: 'apology-miss', label: '타이밍을 놓쳐 나중에 어색해질 때가 있음' },
      ],
      question: '미안함을 다루는 방식은?',
    },
    {
      id: 'stress',
      options: [
        { id: 'stress-share', label: '힘든 일을 서로에게 비교적 잘 꺼냄' },
        { id: 'stress-quiet', label: '각자 정리한 뒤 필요한 만큼만 나눔' },
        { id: 'stress-bounce', label: '무거워지기 전에 분위기를 바꿔 넘김' },
      ],
      question: '스트레스가 커질 때 둘의 거리는?',
    },
    {
      id: 'privateSignals',
      options: [
        { id: 'signals-many', label: '별명, 밈, 습관처럼 둘만의 신호가 많음' },
        { id: 'signals-some', label: '가끔 바로 알아보는 장난이나 표정이 있음' },
        { id: 'signals-few', label: '암호보다 편한 일상감이 더 잘 맞음' },
      ],
      question: '둘만 아는 작은 신호가 있나요?',
    },
    {
      id: 'memory',
      options: [
        { id: 'memory-exact', label: '전환점이 된 순간을 꽤 정확히 기억함' },
        { id: 'memory-vibe', label: '날짜보다 그때의 분위기와 감정이 오래 남음' },
        { id: 'memory-now', label: '지난 일보다 지금의 안정감이 더 중요함' },
      ],
      question: '흔들린 뒤 다시 가까워진 순간은 어떻게 남나요?',
    },
    {
      id: 'balance',
      options: [
        { id: 'balance-similar', label: '취향과 속도가 점점 닮아가는 느낌' },
        { id: 'balance-complementary', label: '달라서 오히려 빈 곳을 채워주는 느낌' },
        { id: 'balance-volatile', label: '좋을 때와 어긋날 때의 온도 차가 큰 느낌' },
      ],
      question: '우리의 관계 균형은 어떤 모습인가요?',
    },
    {
      id: 'decision',
      options: [
        { id: 'decision-together', label: '중요한 선택은 같이 기준을 맞춰 정함' },
        { id: 'decision-alternate', label: '상황에 따라 자연스럽게 번갈아 주도함' },
        { id: 'decision-one-sided', label: '한쪽이 더 많이 정하고 다른 한쪽은 따라가는 편' },
      ],
      question: '중요한 선택을 할 때 균형은?',
    },
    {
      id: 'space',
      options: [
        { id: 'space-close', label: '자주 붙어 있어야 관계가 편안해짐' },
        { id: 'space-respecting', label: '각자의 시간도 존중될 때 더 단단해짐' },
        { id: 'space-uneven', label: '원하는 거리가 달라 조율이 필요할 때가 있음' },
      ],
      question: '각자의 시간을 두는 방식은?',
    },
  ],
  results: {
    archive: {
      mission: '오늘 오래 기억나는 장면 하나를 꺼내보세요. 그때 좋았던 이유까지 짧게 붙이면 더 좋아요.',
      nickname: '장면 보관형',
      reasons: [
        '관계의 중요한 순간을 오래 붙잡는 힘이 있어요.',
        '지나간 경험이 지금의 안정감을 받쳐줘요.',
        '둘만의 기준이 시간 속에서 천천히 쌓였어요.',
      ],
      summary:
        '우리의 결은 지나간 순간을 그냥 흘려보내지 않는 쪽이에요. 오래 남은 장면이 쌓일수록 둘 사이의 기준도 더 선명해져요.',
    },
    harbor: {
      mission: '오늘은 결론을 서두르기보다, 서로에게 편했던 방식 하나를 먼저 나눠보세요.',
      nickname: '안심 정박형',
      reasons: [
        '빠른 자극보다 돌아올 수 있는 안정감이 커요.',
        '각자의 속도가 달라도 관계가 쉽게 흔들리지 않아요.',
        '차이를 불안보다 역할로 받아들이는 편이에요.',
      ],
      summary:
        '우리의 결은 크게 흔들리기보다 돌아올 자리를 잘 만드는 쪽이에요. 드라마틱한 순간보다 다시 편해지는 방식이 강점이에요.',
    },
    orbit: {
      mission: '오늘 자주 반복되는 습관 하나를 골라보세요. 언제부터 우리 것이 됐는지 같이 떠올려보면 좋아요.',
      nickname: '일상 궤도형',
      reasons: [
        '작은 반복이 둘의 리듬을 만들어요.',
        '큰 이벤트보다 일상 속 접점이 자주 살아나요.',
        '점점 닮아가는 습관이 편안한 신호로 남아요.',
      ],
      summary:
        '우리의 결은 매일의 작은 반복으로 가까워지는 편이에요. 특별한 한 번보다 꾸준히 돌아오는 습관이 매력인 조합이에요.',
    },
    rare: {
      mission: '오늘 둘만 아는 신호 하나에 진짜 마음 한 줄을 붙여보세요. 가볍지만 선명하게요.',
      nickname: '결이 선명한 고유형',
      reasons: [
        '네 가지 축에서 강한 신호가 함께 잡혔어요.',
        '애정, 템포, 균형, 회복이 한 방향으로 맞물려요.',
        '흔한 커플 공식 하나로 설명하기 어려운 조합이에요.',
      ],
      summary:
        '우리의 결은 결타레 모델 기준으로 꽤 선명한 조합이에요. 남들이 보면 평범한 순간도, 둘 사이에서는 바로 통하는 기준처럼 작동해요.',
    },
    reconnect: {
      mission: '최근 어긋났다가 다시 가까워진 순간을 떠올려보세요. 그때 도움이 된 행동 하나를 오늘 다시 해봐도 좋아요.',
      nickname: '다시 맞추는 회복형',
      reasons: [
        '끊긴 흐름을 다시 붙이는 힘이 보여요.',
        '서운함을 오래 방치하기보다 확인하거나 돌아오는 편이에요.',
        '서로 다른 속도도 회복의 재료로 바꿀 수 있어요.',
      ],
      summary:
        '우리의 결은 늘 매끈하진 않아도 다시 맞춰지는 힘이 있어요. 중요한 건 어긋남 자체보다, 다시 가까워지는 방식이에요.',
    },
    signal: {
      mission: '둘만 바로 알아보는 신호 하나를 골라보세요. 오늘은 그 뜻을 조금 더 다정하게 풀어줘도 좋아요.',
      nickname: '둘만의 신호형',
      reasons: [
        '직접 설명하지 않아도 통하는 신호가 많아요.',
        '표정, 행동, 장난이 애정의 표시로 작동해요.',
        '겉으로는 가벼워도 안쪽 의미가 진한 편이에요.',
      ],
      summary:
        '우리의 결은 남들이 보면 평범해도 서로에게는 선명한 신호가 많아요. 둘만의 해석이 관계를 더 단단하게 만들어줘요.',
    },
    spark: {
      mission: '갑자기 떠오른 마음을 하나 전해보세요. 대신 상대가 편하게 받아들일 여백도 같이 남겨두면 좋아요.',
      nickname: '순간 점화형',
      reasons: [
        '생각난 순간 관계가 살아나는 힘이 있어요.',
        '큰 계획보다 작은 선택이 둘 사이를 움직여요.',
        '지금의 감정과 반응이 관계의 중심에 가까워요.',
      ],
      summary:
        '우리의 결은 오래 준비한 이벤트보다 순간의 불씨로 살아나요. 가벼운 시작이 의외로 긴 장면으로 이어지는 조합이에요.',
    },
  },
  ui: {
    answeredCount: '{count}/{total} 응답',
    axisScoresTitle: '네 가지 결',
    backButton: '이전',
    copyFallbackButton: '링크 복사',
    copiedFeedback: '공유 링크를 복사했어요.',
    emptyResultDescription: '공유 링크 형식이 맞지 않아요. 16문항만 다시 고르면 새 결과 카드를 만들 수 있어요.',
    emptyResultTitle: '결과 카드를 다시 만들어볼까요?',
    gradeTitle: '우리 결 등급',
    heroCta: '커플 결 지수 보기',
    heroDescription: '16문항으로 애정 온도, 생활 템포, 관계 균형, 회복력을 가볍게 살펴봐요.',
    heroEyebrow: '16문항, 약 2분이면 충분해요',
    heroSecondaryCta: '무엇을 보나요?',
    heroTitle: '우리 사이의 결은 몇 점일까?',
    indexLabel: '커플 결 지수',
    introNote: '로그인 없이 바로 시작할 수 있어요.',
    missionTitle: '오늘 해볼 작은 미션',
    modelStepGradeBody: '선택 조합을 결타레 모델 기준으로 읽고, 1등급부터 7등급까지의 위치를 보여줘요.',
    modelStepGradeTitle: '등급 확인',
    modelStepInputBody: '애정 온도, 생활 템포, 관계 균형, 회복력처럼 바로 고를 수 있는 질문만 묻습니다.',
    modelStepInputTitle: '16문항',
    modelStepShareBody: '점수, 등급, 별칭, 한 줄 요약을 묶어 캡처하고 보내기 좋은 카드로 정리해요.',
    modelStepShareTitle: '공유 카드',
    modelNotice: '정답을 맞히는 검사가 아니라, 답변 조합을 결타레 모델 기준으로 읽은 결과예요.',
    nextButton: '다음 문항',
    questionEyebrow: '16문항 테스트',
    reasonsTitle: '이렇게 읽힌 이유',
    resultButton: '결과 보기',
    resultEyebrow: '우리 결 카드',
    restartButton: '다시 하기',
    resultCardBody: '민감한 정보 없이 점수와 별칭만 가볍게 보여줄 수 있게 정리했어요.',
    resultCardTitle: '바로 보내기 좋은 결과 카드',
    shareButton: '결과 링크 보내기',
    shareFallbackBody: '{grade} · {nickname} · 결 지수 {index}',
    shareLead: '결타레 모델 기준',
    shareTitle: '우리 커플 결 지수 카드',
  },
} as const satisfies GyeolContent
