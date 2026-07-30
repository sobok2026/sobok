import type {
  Axis,
  AxisDefinition,
  CoupleTypeCode,
  CoupleTypeContent,
  CoupleTypeQuestion,
  CoupleTypeResult,
} from '../_lib/types'

export const axisDefinitions = {
  bond: {
    label: '연결 방식',
    options: {
      D: {
        body: '진심, 의미, 긴 대화로 가까워지는 흐름',
        label: '진심 연결형',
      },
      P: {
        body: '장난, 밈, 농담으로 분위기를 먼저 여는 흐름',
        label: '장난 연결형',
      },
    },
    values: ['P', 'D'],
  },
  expression: {
    label: '표현 방식',
    options: {
      N: {
        body: '말 사이의 뉘앙스와 작은 신호를 더 크게 읽는 흐름',
        label: '은근 표현형',
      },
      O: {
        body: '좋고 싫음을 비교적 분명한 말로 꺼내는 흐름',
        label: '직접 표현형',
      },
    },
    values: ['O', 'N'],
  },
  pace: {
    label: '대화 속도',
    options: {
      H: {
        body: '천천히 안정감을 쌓고 오래 머무는 흐름',
        label: '안정 정박형',
      },
      S: {
        body: '생각난 순간 바로 말을 걸며 불씨를 살리는 흐름',
        label: '즉흥 점화형',
      },
    },
    values: ['S', 'H'],
  },
  repair: {
    label: '회복 리듬',
    options: {
      L: {
        body: '감정을 정리한 뒤 차분히 다시 맞추는 흐름',
        label: '천천히 정리형',
      },
      Q: {
        body: '불편함이 생기면 빨리 확인하고 다시 붙는 흐름',
        label: '바로 회복형',
      },
    },
    values: ['Q', 'L'],
  },
} as const satisfies Record<Axis, AxisDefinition>

export const coupleTypeQuestions = [
  {
    axis: 'pace',
    id: 'pace-start',
    options: [
      { label: '생각나면 바로 톡을 보내고 흐름을 만든다', value: 'S' },
      { label: '조금 모아두었다가 편한 타이밍에 이어간다', value: 'H' },
    ],
    question: '둘 사이 대화가 가장 자연스럽게 시작되는 순간은?',
  },
  {
    axis: 'expression',
    id: 'expression-like',
    options: [
      { label: '좋으면 좋다고 비교적 선명하게 말한다', value: 'O' },
      { label: '말보다 분위기와 행동으로 먼저 보여준다', value: 'N' },
    ],
    question: '애정 표현은 보통 어떤 쪽에 더 가까워요?',
  },
  {
    axis: 'repair',
    id: 'repair-conflict',
    options: [
      { label: '불편한 건 빨리 확인하고 풀어야 마음이 놓인다', value: 'Q' },
      { label: '일단 각자 식힌 뒤 정리해서 말하는 편이다', value: 'L' },
    ],
    question: '작은 오해가 생겼을 때 우리의 기본 리듬은?',
  },
  {
    axis: 'bond',
    id: 'bond-mood',
    options: [
      { label: '장난과 농담으로 먼저 분위기를 부드럽게 만든다', value: 'P' },
      { label: '진심 어린 말로 서로의 마음을 확인한다', value: 'D' },
    ],
    question: '둘이 다시 가까워지는 데 가장 잘 통하는 방식은?',
  },
  {
    axis: 'pace',
    id: 'pace-date',
    options: [
      { label: '갑자기 정해도 재미있으면 바로 움직인다', value: 'S' },
      { label: '일정과 컨디션을 맞춰 안정적으로 잡는다', value: 'H' },
    ],
    question: '데이트 약속을 잡을 때 우리의 온도는?',
  },
  {
    axis: 'expression',
    id: 'expression-care',
    options: [
      { label: '필요한 부탁이나 서운함을 말로 꺼내는 편이다', value: 'O' },
      { label: '상대가 알아차릴 수 있게 작은 신호를 남긴다', value: 'N' },
    ],
    question: '배려가 필요할 때 주로 어떻게 알려요?',
  },
  {
    axis: 'repair',
    id: 'repair-silence',
    options: [
      { label: '침묵이 길어지기 전에 먼저 확인 메시지를 보낸다', value: 'Q' },
      { label: '침묵도 정리 시간으로 두고 천천히 다시 연다', value: 'L' },
    ],
    question: '답장이 늦어지는 날, 둘은 보통 어떻게 맞춰가나요?',
  },
  {
    axis: 'bond',
    id: 'bond-memory',
    options: [
      { label: '웃긴 사진, 별명, 밈 같은 사소한 암호가 많다', value: 'P' },
      { label: '그날의 감정과 의미를 오래 기억하는 편이다', value: 'D' },
    ],
    question: '둘만의 추억은 어떤 재료로 더 많이 남아 있어요?',
  },
  {
    axis: 'pace',
    id: 'pace-night',
    options: [
      { label: '밤에 갑자기 대화가 불붙는 일이 잦다', value: 'S' },
      { label: '하루의 루틴 안에서 꾸준히 이어지는 편이다', value: 'H' },
    ],
    question: '대화가 길어지는 날의 시작점은?',
  },
  {
    axis: 'expression',
    id: 'expression-check',
    options: [
      { label: '확실히 말해줘야 오해가 줄어든다고 느낀다', value: 'O' },
      { label: '너무 설명하기보다 맥락을 봐주길 바란다', value: 'N' },
    ],
    question: '마음을 확인하는 방식에서 더 중요한 건?',
  },
  {
    axis: 'repair',
    id: 'repair-apology',
    options: [
      { label: '짧게라도 먼저 사과하고 대화의 문을 연다', value: 'Q' },
      { label: '왜 그랬는지 충분히 이해한 뒤 다시 말한다', value: 'L' },
    ],
    question: '미안하다는 말을 꺼내는 타이밍은?',
  },
  {
    axis: 'bond',
    id: 'bond-support',
    options: [
      { label: '가벼운 농담으로 기분을 돌려주는 게 잘 먹힌다', value: 'P' },
      { label: '조용히 들어주고 진짜 마음을 짚어주는 게 좋다', value: 'D' },
    ],
    question: '상대가 힘든 날, 가장 힘이 되는 반응은?',
  },
] as const satisfies readonly CoupleTypeQuestion[]

export const coupleTypeResults = {
  HNLD: {
    code: 'HNLD',
    dateMission: '둘이 좋아하는 조용한 장소에서 오늘 고마웠던 장면을 하나씩만 말해보세요.',
    displayCode: 'LOVE',
    strengths: [
      '서두르지 않아도 관계의 온도가 오래 유지돼요.',
      '말보다 태도와 꾸준함으로 신뢰가 쌓여요.',
      '큰 감정을 안전하게 풀어낼 여백이 있어요.',
    ],
    summary:
      '서로를 급하게 밀어붙이지 않고 천천히 깊어지는 커플이에요. 작은 신호를 오래 기억하고, 감정이 정리된 뒤 진심을 꺼낼 때 가장 선명하게 가까워져요.',
    title: '오래 데워지는 깊은 항구형',
    watchOut: '서로 배려하느라 필요한 말을 너무 오래 미루면 상대가 힌트를 놓칠 수 있어요.',
  },
  HNLP: {
    code: 'HNLP',
    dateMission: '오늘의 암호 같은 농담 하나와 진짜 마음 하나를 함께 남겨보세요.',
    displayCode: 'SLOW',
    strengths: [
      '은근한 장난으로 어색함을 부드럽게 녹여요.',
      '속도는 느려도 둘만의 리듬이 단단해요.',
      '갈등 뒤에도 분위기를 천천히 되살리는 힘이 있어요.',
    ],
    summary:
      '조심스럽게 다가가지만 장난의 힘을 잘 아는 커플이에요. 말은 아껴도 둘만 아는 신호가 많고, 시간이 지나며 편안한 웃음으로 회복해요.',
    title: '느린 농담의 비밀기지형',
    watchOut: '농담이 진심을 대신하는 시간이 길어지면 중요한 마음이 흐릿해질 수 있어요.',
  },
  HNQD: {
    code: 'HNQD',
    dateMission: '서로에게 편안했던 순간을 하나 고르고, 그 이유를 한 문장으로 직접 말해보세요.',
    displayCode: 'DEEP',
    strengths: [
      '안정적인 흐름 안에서도 오해는 오래 두지 않아요.',
      '상대의 작은 표정과 말투 변화를 잘 읽어요.',
      '중요한 순간에는 깊은 확인으로 관계를 다져요.',
    ],
    summary:
      '평소에는 잔잔하지만 필요한 순간엔 바로 손을 내미는 커플이에요. 은근한 신호를 잘 감지하고, 마음이 흔들릴 땐 진심으로 빠르게 다시 맞춰요.',
    title: '잔잔한 레이더 회복형',
    watchOut: '상대가 알아차릴 거라는 기대만으로는 부족할 수 있어요. 중요한 건 짧게라도 말로 확인해보세요.',
  },
  HNQP: {
    code: 'HNQP',
    dateMission: '요즘 둘이 자주 쓰는 말투나 이모지를 골라 작은 별명을 붙여보세요.',
    displayCode: 'BABE',
    strengths: [
      '편안한 루틴 안에서 작은 재미를 잘 찾아요.',
      '불편함을 오래 쌓기 전에 분위기를 바꿔요.',
      '둘만의 신호가 많아 일상 대화가 가볍게 이어져요.',
    ],
    summary:
      '안정적인 일상 위에 가벼운 장난을 자주 올리는 커플이에요. 큰 말보다 작은 반응으로 마음을 읽고, 어색함이 생기면 부드럽게 먼저 풀어내요.',
    title: '잔잔한 장난 회복형',
    watchOut: '분위기를 살리는 능력이 좋지만, 필요한 설명까지 웃음으로 넘기지는 않는 게 좋아요.',
  },
  HOLD: {
    code: 'HOLD',
    dateMission: '다음 데이트 전에 각자 바라는 한 가지를 미리 말하고 만나보세요.',
    displayCode: 'SOUL',
    strengths: [
      '서로에게 필요한 말을 안정적으로 전달해요.',
      '감정을 정리한 뒤 깊은 대화로 다시 연결돼요.',
      '관계의 규칙과 약속을 잘 지켜 신뢰가 생겨요.',
    ],
    summary:
      '분명한 표현과 안정적인 속도를 함께 가진 커플이에요. 당장 결론을 내리기보다 충분히 생각하고, 중요한 말은 놓치지 않고 직접 꺼내요.',
    title: '차분한 약속 설계형',
    watchOut: '정리된 말만 기다리다 보면 따뜻한 즉흥성이 부족해질 수 있어요.',
  },
  HOLP: {
    code: 'HOLP',
    dateMission: '서운했던 일 하나를 아주 작게 말하고, 바로 가벼운 산책이나 간식으로 분위기를 바꿔보세요.',
    displayCode: 'VIBE',
    strengths: [
      '말은 분명하게 하되 분위기는 무겁게만 두지 않아요.',
      '천천히 정리한 감정을 장난으로 부드럽게 풀어요.',
      '관계의 안정감과 유쾌함이 함께 있어요.',
    ],
    summary:
      '안정적인 흐름 속에서 직접 말하고 가볍게 회복하는 커플이에요. 서운함을 숨기지 않지만, 장난과 일상감으로 다시 편안하게 돌아오는 힘이 좋아요.',
    title: '다정한 룰메이트 유쾌형',
    watchOut: '장난스럽게 풀어도 상대가 정말 이해했는지는 한 번 더 확인해보면 좋아요.',
  },
  HOQD: {
    code: 'HOQD',
    dateMission: '오늘 필요한 말을 하나만 바로 말하고, 상대의 답을 끊지 않고 끝까지 들어보세요.',
    displayCode: 'REAL',
    strengths: [
      '오해를 빠르게 확인해 관계의 흔들림을 줄여요.',
      '직접적인 표현 덕분에 기대가 비교적 명확해요.',
      '안정적인 애정과 깊은 대화가 균형을 이뤄요.',
    ],
    summary:
      '차분하지만 필요한 말은 미루지 않는 커플이에요. 감정의 불씨를 오래 방치하지 않고, 서로의 마음을 직접 확인하며 안정감을 회복해요.',
    title: '따뜻한 바로잡기형',
    watchOut: '빨리 확인하려는 마음이 상대에게 압박으로 느껴지지 않게 말의 온도를 조절해보세요.',
  },
  HOQP: {
    code: 'HOQP',
    dateMission: '오늘 대화 중 가장 웃겼던 순간을 캡처 대신 한 문장으로 다시 재현해보세요.',
    displayCode: 'KISS',
    strengths: [
      '직접 말하면서도 분위기를 가볍게 만들어요.',
      '오해가 생기면 빠르게 풀고 일상으로 돌아와요.',
      '안정적인 루틴 속에 즐거운 티키타카가 살아 있어요.',
    ],
    summary:
      '편안한 기반 위에서 솔직하고 유쾌하게 이어지는 커플이에요. 필요한 말은 바로 하고, 무거워질 때는 장난으로 공기를 바꾸는 감각이 좋아요.',
    title: '안정형 티키타카 수리공',
    watchOut: '빠른 수습이 늘 충분한 회복은 아닐 수 있어요. 가끔은 감정의 뒷부분까지 들어주세요.',
  },
  SNLD: {
    code: 'SNLD',
    dateMission: '갑자기 떠오른 마음을 짧게 보내고, 나중에 차분히 이유를 덧붙여보세요.',
    displayCode: 'LUST',
    strengths: [
      '순간의 감정과 깊은 의미를 모두 소중히 여겨요.',
      '은근한 표현 안에 강한 몰입감이 있어요.',
      '정리 시간이 지나면 오래 남는 대화를 만들어요.',
    ],
    summary:
      '감정의 불꽃은 빠르게 켜지지만 마음을 꺼내는 방식은 섬세한 커플이에요. 갑작스러운 끌림과 깊은 여운이 함께 있어, 둘만의 장면이 진하게 남아요.',
    title: '불꽃과 여운의 소설형',
    watchOut: '강한 감정을 은근한 신호로만 남기면 상대가 방향을 헷갈릴 수 있어요.',
  },
  SNLP: {
    code: 'SNLP',
    dateMission: '즉흥적인 짧은 만남이나 통화를 잡고, 끝에는 오늘 좋았던 점을 하나만 말해보세요.',
    displayCode: 'KINK',
    strengths: [
      '순간적인 재미를 만들고 오래 기억해요.',
      '둘만의 암호와 장난이 관계를 생생하게 해요.',
      '감정 정리 후 다시 웃는 회복력이 있어요.',
    ],
    summary:
      '즉흥적인 끌림과 은근한 장난이 섞인 커플이에요. 빠르게 불붙지만 속마음은 천천히 열고, 시간이 지난 뒤 다시 웃으며 가까워지는 리듬이 있어요.',
    title: '번쩍이는 비밀 장난형',
    watchOut: '재미있는 순간이 많을수록 중요한 감정도 가볍게 흘러가지 않게 붙잡아주세요.',
  },
  SNQD: {
    code: 'SNQD',
    dateMission: '지금 바로 안부를 묻되, 마지막에는 상대가 편하게 답할 여백을 남겨보세요.',
    displayCode: 'SEXY',
    strengths: [
      '감정 변화에 빠르게 반응하고 깊게 확인해요.',
      '작은 신호를 놓치지 않아 재연결이 빨라요.',
      '즉흥성과 진심이 함께 움직여 관계가 생동감 있어요.',
    ],
    summary:
      '순간의 신호를 잘 잡고 빠르게 진심으로 연결되는 커플이에요. 표현은 은근해도 감정의 속도는 빠르고, 흔들림이 보이면 깊게 확인하려는 힘이 있어요.',
    title: '섬세한 불꽃 레이더형',
    watchOut: '상대의 작은 변화에 너무 많은 뜻을 싣기보다 직접 확인하는 문장을 곁들이면 좋아요.',
  },
  SNQP: {
    code: 'SNQP',
    dateMission: '오늘 떠오른 장난 하나를 보내고, 바로 이어서 진짜 안부를 물어보세요.',
    displayCode: 'FOOL',
    strengths: [
      '빠른 반응과 장난으로 대화가 쉽게 살아나요.',
      '작은 신호를 민감하게 읽고 분위기를 바꿔요.',
      '오해가 생겨도 가볍게 다시 말을 걸 수 있어요.',
    ],
    summary:
      '번뜩이는 장난과 섬세한 감지가 함께 있는 커플이에요. 즉흥적으로 톡을 보내고, 작은 뉘앙스를 읽으며 분위기를 빠르게 되살리는 감각이 좋아요.',
    title: '번개 같은 장난 레이더형',
    watchOut: '재빠른 반응이 상대의 속도보다 앞설 때가 있어요. 한 박자 쉬는 것도 연결의 일부예요.',
  },
  SOLD: {
    code: 'SOLD',
    dateMission: '즉흥 데이트를 하나 제안하고, 그 제안에 담긴 마음도 함께 말해보세요.',
    displayCode: 'BURN',
    strengths: [
      '마음이 움직인 순간을 놓치지 않아요.',
      '솔직한 표현과 깊은 대화가 강하게 연결돼요.',
      '정리 후에는 관계를 더 단단하게 만드는 말을 해요.',
    ],
    summary:
      '빠르게 타오르지만 마음은 깊게 남기는 커플이에요. 하고 싶은 말을 비교적 직접 꺼내고, 감정이 커진 뒤에는 진지한 대화로 관계의 의미를 다시 세워요.',
    title: '직진하는 여운 설계형',
    watchOut: '즉흥적인 표현이 강할수록 상대가 따라올 시간을 남겨두면 더 안정적이에요.',
  },
  SOLP: {
    code: 'SOLP',
    dateMission: '장난스럽게 시작한 이야기를 하나 골라, 끝에는 진짜 바라는 점을 가볍게 붙여보세요.',
    displayCode: 'WILD',
    strengths: [
      '솔직함과 유쾌함이 함께 있어 답답함이 적어요.',
      '감정 정리 뒤에도 분위기를 무겁게만 두지 않아요.',
      '즉흥적인 제안으로 관계에 활기를 만들어요.',
    ],
    summary:
      '즉흥적으로 다가가고 솔직하게 말하지만 회복은 천천히 웃으며 하는 커플이에요. 농담과 직접 표현을 오가며 둘만의 활기를 만들어가요.',
    title: '솔직한 즉흥 코미디형',
    watchOut: '웃기게 말한 진심이 진짜 요청이었다면, 상대가 알아듣도록 한 번 더 분명히 말해주세요.',
  },
  SOQD: {
    code: 'SOQD',
    dateMission: '오늘 바로 고마운 점 하나와 바라는 점 하나를 같은 온도로 말해보세요.',
    displayCode: 'FIRE',
    strengths: [
      '바로 말하고 바로 확인해 오해가 오래 쌓이지 않아요.',
      '진심을 분명하게 전달해 관계의 방향이 선명해요.',
      '빠른 회복 뒤에도 의미 있는 대화를 남겨요.',
    ],
    summary:
      '감정의 속도와 표현의 선명함이 모두 빠른 커플이에요. 좋으면 좋다고 말하고, 불편하면 오래 묻어두지 않으며 진심으로 다시 맞추는 힘이 있어요.',
    title: '직진 불꽃 회복형',
    watchOut: '빠른 솔직함이 날카롭게 들리지 않도록, 먼저 애정의 전제를 깔아두면 좋아요.',
  },
  SOQP: {
    code: 'SOQP',
    dateMission: '둘만의 짧은 콜사인을 정하고, 오늘 안에 한 번 먼저 보내보세요.',
    displayCode: 'FUXK',
    strengths: [
      '대화가 멈춰도 금방 다시 불을 붙여요.',
      '솔직한 말과 장난이 섞여 답답함이 적어요.',
      '작은 오해를 빠르게 풀고 일상의 리듬으로 돌아와요.',
    ],
    summary:
      '생각난 순간 바로 말을 걸고, 솔직한 표현과 장난으로 빠르게 가까워지는 커플이에요. 무거워질 틈을 오래 두지 않고 둘만의 티키타카로 다시 연결돼요.',
    title: '불꽃 티키타카 회복형',
    watchOut: '가볍게 풀리는 만큼, 상대가 정말 괜찮아졌는지 한 번 더 확인하면 관계가 더 안정돼요.',
  },
} as const satisfies Record<CoupleTypeCode, CoupleTypeResult>

export const coupleTypeContent = {
  axisDefinitions,
  metadata: {
    description:
      '12개의 질문으로 우리의 대화 속도, 표현 방식, 회복 리듬, 연결 방식을 살펴보는 비임상 연애 유형 테스트예요.',
    title: '커플 대화 유형',
  },
  questions: coupleTypeQuestions,
  results: coupleTypeResults,
  ui: {
    answeredCount: '{count}개 응답',
    dateMissionTitle: '오늘의 대화 미션',
    editButton: '응답 조정하기',
    heroDescription:
      '12개의 가벼운 선택으로 우리의 대화 속도, 표현 방식, 회복 리듬, 연결 방식을 살펴봐요. 사람을 단정하지 않고 지금의 패턴을 읽는 테스트예요.',
    heroEyebrow: '커플 대화 유형 16종',
    heroTitle: '우리의 대화는 어떤 리듬으로 가까워질까요?',
    homeLink: '홈으로',
    introCta: '대화 유형 알아보기',
    introNote: '12문항이라 2분이면 끝나요. 응답은 이 탭에만 남고 서버로 보내지 않아요.',
    navigationLabel: '커플 대화 유형 탐색',
    nextButton: '다음 문항',
    previousButton: '이전',
    privacyNotice: '응답 수 {count}개 · 결과는 서버에 저장되지 않고 탭을 닫으면 사라져요.',
    questionCountLabel: '문항',
    questionCountValue: '{count}개',
    resultButton: '결과 보기',
    resultCountLabel: '결과',
    resultCountValue: '16가지 유형',
    resultEyebrow: '커플 대화 유형 결과',
    restartButton: '다시 하기',
    rhythmsTitle: '우리의 네 가지 리듬',
    selectAnswerButton: '응답 선택하기',
    strengthsTitle: '잘 맞는 지점',
    watchOutTitle: '조심할 점',
  },
} as const satisfies CoupleTypeContent
