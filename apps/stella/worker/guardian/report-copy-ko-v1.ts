import { GUARDIAN_REPORT_SLOTS, type GuardianCardEdition, type GuardianReportSlot } from './manifest'
import type {
  GuardianQuestionnaireContent,
  GuardianQuestionnaireSignalSnapshot,
  GuardianSingleChoiceQuestion,
} from './questionnaire'
import type {
  GuardianReportNarrativeInput,
  GuardianReportNarrativeSection,
  GuardianReportNarrativeSnapshot,
  GuardianReportPlacement,
  GuardianReportPlacementBody,
  GuardianZodiacSign,
} from './report-contract'
import { GUARDIAN_REPORT_NARRATIVE_SCHEMA_VERSION, GUARDIAN_ZODIAC_SIGNS } from './report-contract'

export const GUARDIAN_REPORT_COPY_KO_V1 = 'guardian-report-copy-ko-v1' as const
const QUESTIONNAIRE_VERSION = 'guardian-paid-ko-mvp-v1' as const
const ANSWER_TOKEN = '{answer}'

interface QuestionFrame {
  slot: GuardianReportSlot
  title: string
  template: string
}

interface FocusCopy {
  focus: string
  oneLine: string
}

interface SelectedQuestionAnswer {
  question: GuardianSingleChoiceQuestion
  option: GuardianSingleChoiceQuestion['options'][number]
}

const QUESTION_FRAMES = {
  'core.self.current-scene': {
    slot: 'self',
    title: '지금의 장면',
    template:
      '지금의 너를 가장 닮은 장면은 “{answer}” 쪽이야. 이 시기에는 속도를 평가하기보다 현재의 에너지를 정확히 알아보는 일이 먼저야.',
  },
  'core.self.hidden-need': {
    slot: 'self',
    title: '마음이 먼저 원하는 것',
    template:
      '아무도 재촉하지 않을 때 마음은 “{answer}” 쪽을 향해. 이 바람을 사소하게 미루지 않을수록 해야 할 일과 진짜 원하는 일을 더 또렷하게 구분할 수 있어.',
  },
  'core.self.inner-voice': {
    slot: 'self',
    title: '실수 뒤에 들리는 목소리',
    template:
      '실수한 뒤 가장 먼저 나오는 목소리는 “{answer}”에 가까워. 그 목소리는 네가 다시 균형을 찾는 방식인 동시에, 지쳤을 때 반복하기 쉬운 습관도 보여 줘.',
  },
  'core.love.current-scene': {
    slot: 'love',
    title: '지금 사랑의 장면',
    template:
      '지금 사랑의 풍경은 “{answer}”에 가까워. 관계의 이름을 서둘러 정하기보다 현재 마음이 실제로 머무는 자리를 인정하는 데서 다음 장면이 시작돼.',
  },
  'core.love.pace': {
    slot: 'love',
    title: '마음을 건네는 속도',
    template:
      '마음이 가는 사람 앞에서 택하는 속도는 “{answer}”에 가까워. 이 보폭은 애정 표현의 장점이지만, 상대도 같은 신호로 알아듣는지는 말로 확인할 필요가 있어.',
  },
  'core.love.deepest-wish': {
    slot: 'love',
    title: '사랑에서 바라는 선물',
    template:
      '지금 사랑에서 가장 받고 싶은 선물은 “{answer}” 쪽에 가까워. 이 바람을 숨긴 채 상대의 마음만 읽으려 하면 작은 모호함도 크게 느껴질 수 있어.',
  },
  'core.work.current-rhythm': {
    slot: 'work',
    title: '요즘의 일 리듬',
    template:
      '요즘 일과 생활의 리듬은 “{answer}” 쪽이야. 지금 필요한 전략은 이상적인 속도가 아니라, 실제 에너지와 일정이 감당할 수 있는 속도에서 시작해야 해.',
  },
  'core.work.friction': {
    slot: 'work',
    title: '일을 무겁게 하는 것',
    template:
      '지금 일을 가장 무겁게 만드는 이유는 “{answer}” 쪽에 가까워. 의지만 더 보태기 전에 이 마찰을 구체적인 문제 하나로 좁히면 쓸 수 있는 힘이 돌아와.',
  },
  'core.work.reward': {
    slot: 'work',
    title: '노력이 향하는 열매',
    template:
      '지금의 노력에서 바라는 열매는 “{answer}”에 가까워. 목표를 세울 때 이 보상을 빼놓으면 열심히 움직여도 내 일이 아니라는 느낌이 남을 수 있어.',
  },
  'core.choice.current-stage': {
    slot: 'choice',
    title: '결정이 머무는 단계',
    template:
      '지금 결정이 머무는 단계는 “{answer}” 쪽이야. 아직 결론이 나지 않았다는 사실보다, 이 단계에서 무엇을 확인해야 다음으로 넘어갈 수 있는지가 중요해.',
  },
  'core.choice.deepest-fear': {
    slot: 'choice',
    title: '선택이 두려운 이유',
    template:
      '선택 앞에서 가장 피하고 싶은 장면은 네 답처럼 “{answer}”에 가까워. 이 두려움은 없애야 할 약점이 아니라, 결정 안에서 반드시 보호해야 할 가치를 알려 주는 표지야.',
  },
  'core.choice.main-blocker': {
    slot: 'choice',
    title: '결정을 막는 중심축',
    template:
      '지금 결정을 가장 어렵게 만드는 중심축은 “{answer}” 쪽에 있어. 다른 걱정을 한꺼번에 풀기보다 이 축을 먼저 다뤄야 판단의 소음이 줄어들어.',
  },
  'adaptive.inner.competing-voice': {
    slot: 'self',
    title: '가장 크게 들리는 마음',
    template:
      '여러 마음이 겹칠 때 가장 크게 들리는 말은 “{answer}”에 가까워. 그 목소리를 곧바로 정답으로 삼기보다, 누구의 기대에서 왔는지 한 번 구분해 보면 네 진짜 바람이 선명해져.',
  },
  'adaptive.inner.authentic-moment': {
    slot: 'self',
    title: '나다움을 느끼는 순간',
    template:
      '너는 “{answer}”라고 느끼는 순간에 가장 너다워져. 중요한 선택을 검토할 때도 그 장면에 가까워지는지 살피면 오래 믿을 수 있는 기준이 돼.',
  },
  'adaptive.inner.love-protection': {
    slot: 'love',
    title: '가까워질수록 지키는 것',
    template:
      '마음이 가까워질수록 지키고 싶은 것은 “{answer}” 쪽에 가까워. 그것을 숨기지 않고 관계의 조건으로 말할 수 있을 때 방어는 벽이 아니라 건강한 경계가 돼.',
  },
  'adaptive.inner.love-reassurance': {
    slot: 'love',
    title: '마음을 안심시키는 신호',
    template:
      '관계에서 가장 안심되는 신호는 “{answer}”에 가까워. 상대가 알아서 맞혀 주기를 기다리기보다 이 신호를 서로의 언어로 정하면 불필요한 추측이 줄어들어.',
  },
  'adaptive.inner.work-pressure': {
    slot: 'work',
    title: '기준과 기대가 부딪히는 곳',
    template:
      '내 기준과 주변의 기대가 엇갈릴 때 가장 신경 쓰이는 것은 “{answer}” 쪽이야. 무엇을 만족시켜야 완료인지 먼저 정하지 않으면 끝난 일도 계속 미완성처럼 느껴질 수 있어.',
  },
  'adaptive.inner.work-energy': {
    slot: 'work',
    title: '먼저 되찾아야 할 힘',
    template:
      '지금 일에서 가장 먼저 되찾고 싶은 힘은 “{answer}”에 가까워. 새로운 목표를 더하기 전에 이 힘이 돌아올 조건부터 만드는 편이 원하는 결과에도 더 빠르게 닿아.',
  },
  'adaptive.inner.choice-promise': {
    slot: 'choice',
    title: '결정 뒤의 자기 약속',
    template:
      '결정한 뒤 스스로에게 건네고 싶은 약속을 네 답은 “{answer}”라고 표현해. 이 문장을 선택의 안전장치로 두면 완벽한 확신이 없어도 다음 한 걸음을 시작할 수 있어.',
  },
  'adaptive.relationship.current-distance': {
    slot: 'love',
    title: '두 마음 사이의 거리',
    template:
      '중요한 사람과의 현재 거리는 “{answer}”에 가까워. 원하는 결말보다 지금 실제로 가능한 대화의 깊이를 기준으로 삼는 편이 관계를 덜 다치게 해.',
  },
  'adaptive.relationship.unsaid': {
    slot: 'love',
    title: '아직 전하지 못한 말',
    template:
      '아직 다 전하지 못한 말은 “{answer}”에 가까워. 완벽하게 정리된 문장보다 이 마음이 있다는 사실부터 짧고 분명하게 꺼내는 것이 좋아.',
  },
  'adaptive.relationship.self-reaction': {
    slot: 'self',
    title: '반응이 두려울 때의 습관',
    template:
      '상대의 반응이 걱정될 때는 “{answer}”에 가까운 쪽으로 기울기 쉬워. 이 습관은 관계를 지키려는 다정함에서 왔지만, 네 의도와 한계를 함께 말해야 오해가 줄어들어.',
  },
  'adaptive.relationship.self-boundary': {
    slot: 'self',
    title: '결과보다 먼저 지킬 기준',
    template:
      '관계의 결과와 상관없이 꼭 지키고 싶은 기준은 “{answer}”에 가까워. 이 기준을 미리 알고 있으면 상대를 배려하면서도 나중에 자신을 원망하지 않는 선택을 할 수 있어.',
  },
  'adaptive.relationship.work-role': {
    slot: 'work',
    title: '사람 사이에서 맡는 역할',
    template:
      '사람이 얽힌 일에서 주로 맡는 역할은 “{answer}”에 가까워. 익숙하게 잘하는 역할일수록 자동으로 떠안기 쉬우니, 이번에도 정말 네 몫인지 확인해 봐.',
  },
  'adaptive.relationship.work-clarity': {
    slot: 'work',
    title: '협업에 필요한 선명함',
    template:
      '함께하는 일을 편하게 만들려면 먼저 분명해져야 할 것은 “{answer}” 쪽이야. 이 한 가지를 합의하면 감정 문제처럼 보이던 마찰도 실제 업무 문제로 풀 수 있어.',
  },
  'adaptive.relationship.choice-delivery': {
    slot: 'choice',
    title: '결정을 전하는 방식',
    template:
      '중요한 사람에게 결정을 전할 때 가장 너다운 방식은 “{answer}” 쪽이야. 내용만큼 대화의 속도와 자리를 설계하면 선택을 숨기지 않으면서 관계도 존중할 수 있어.',
  },
  'adaptive.reality.heaviest-condition': {
    slot: 'work',
    title: '가장 무거운 현실 조건',
    template:
      '지금 가장 무겁게 느껴지는 현실 조건은 “{answer}” 쪽이야. 막연한 부담으로 두지 말고 수치나 일정, 책임의 범위로 바꾸면 조정 가능한 부분이 보여.',
  },
  'adaptive.reality.available-resource': {
    slot: 'work',
    title: '이미 가진 자원',
    template:
      '반대로 지금 가장 믿고 쓸 수 있는 자원은 “{answer}” 쪽에 가까워. 부족한 것만 채우려 하기보다 이 자원을 첫 계획의 중심에 놓을 때 실행 가능성이 높아져.',
  },
  'adaptive.reality.missed-signal': {
    slot: 'self',
    title: '계산 밖에서 오는 신호',
    template:
      '조건을 꼼꼼히 볼수록 놓치기 쉬운 내면의 신호는 “{answer}” 쪽이야. 숫자와 근거를 확인한 뒤에도 이 감각이 반복되는지 마지막 항목으로 꼭 살펴봐.',
  },
  'adaptive.reality.nonnegotiable': {
    slot: 'self',
    title: '현실 속에서도 남길 것',
    template:
      '아무리 현실적인 계획이어도 꼭 남겨 두고 싶은 것은 “{answer}”에 가까워. 이것이 빠진 계획은 효율적이어도 오래 이어지기 어려우니 처음부터 조건에 포함하는 편이 좋아.',
  },
  'adaptive.reality.love-adjustment': {
    slot: 'love',
    title: '사랑과 일상이 만나는 곳',
    template:
      '사랑을 일상에 들일 때 가장 조정이 필요한 부분은 “{answer}” 쪽이야. 감정의 크기와 별개로 이 현실을 구체적으로 이야기해야 관계가 무리 없이 자리를 잡아.',
  },
  'adaptive.reality.love-cooperation': {
    slot: 'love',
    title: '현실을 함께 푸는 방식',
    template:
      '현실적인 문제를 함께 풀고 싶은 방식은 “{answer}” 쪽이야. 서로 잘하는 방식이 다를 수 있으니 원하는 협력의 모양을 먼저 설명해 주는 것이 좋아.',
  },
  'adaptive.reality.choice-test': {
    slot: 'choice',
    title: '결정 전의 작은 검증',
    template:
      '큰 결정을 내리기 전에 먼저 해보고 싶은 검증은 “{answer}” 쪽이야. 이 작은 검증은 결정을 미루는 일이 아니라, 추측을 실제 정보로 바꾸는 단계야.',
  },
  'adaptive.timing.ready-signal': {
    slot: 'choice',
    title: '움직여도 된다는 신호',
    template:
      '너는 “{answer}”에 가까워져야 움직여도 된다고 느껴. 그 신호를 기다리되, 충분함의 기준을 미리 정해야 끝없는 확인으로 바뀌지 않아.',
  },
  'adaptive.timing.waiting-state': {
    slot: 'self',
    title: '기다리는 동안의 모습',
    template:
      '기다리는 동안의 모습은 “{answer}” 쪽에 가까워. 이 시간이 회복과 준비인지, 두려움을 피하는 지연인지 구분하면 기다림의 끝도 정할 수 있어.',
  },
  'adaptive.timing.waiting-gain': {
    slot: 'self',
    title: '기다림에서 얻고 싶은 것',
    template:
      '조금 더 기다려서 얻고 싶은 것은 “{answer}”에 가까워. 그 변화가 실제로 생기고 있는지 확인할 작은 표지를 하나 정해 두면 시간이 네 편이 돼.',
  },
  'adaptive.timing.love-timing': {
    slot: 'love',
    title: '지금 사랑의 계절',
    template:
      '지금 사랑의 시기를 네 답은 “{answer}”라고 표현해. 다른 사람의 속도보다 이 계절에 맞는 행동을 택할 때 관계를 억지로 앞당기거나 붙잡지 않게 돼.',
  },
  'adaptive.timing.love-speed': {
    slot: 'love',
    title: '서로 다른 속도를 맞추는 법',
    template:
      '마음의 속도가 다를 때 택하고 싶은 방식은 “{answer}”에 가까워. 어느 한쪽이 계속 참는 합의가 되지 않도록 각자 편안한 범위를 말로 확인해 봐.',
  },
  'adaptive.timing.work-signal': {
    slot: 'work',
    title: '일에서 때를 알려 주는 신호',
    template:
      '일에서 움직일 때를 알려 주는 가장 믿을 만한 신호는 “{answer}” 쪽이야. 이 신호를 계획 안에서 확인할 수 있는 기준으로 넣으면 기분에 따라 시작일이 계속 밀리지 않아.',
  },
  'adaptive.timing.work-preparation': {
    slot: 'work',
    title: '이번 주의 한 가지 준비',
    template:
      '이번 주에 가장 도움이 될 준비는 “{answer}” 쪽이야. 준비를 여러 개 벌이기보다 이것 하나가 끝나면 다음 단계로 넘어간다는 기준을 세워 봐.',
  },
  'adaptive.inner.choice-compass': {
    slot: 'choice',
    title: '다시 흔들릴 때의 나침반',
    template:
      '생각이 다시 엇갈릴 때 돌아오고 싶은 기준은 “{answer}”에 가까워. 이 기준을 한 문장으로 적어 두면 새로운 정보와 불안한 상상을 구분하기 쉬워져.',
  },
  'adaptive.relationship.choice-aftercare': {
    slot: 'choice',
    title: '결정 뒤 관계에 남길 것',
    template:
      '결정을 전한 뒤 관계에 남기고 싶은 것은 “{answer}”에 가까워. 상대의 즉각적인 반응까지 통제하려 하기보다 네가 지킬 태도를 먼저 정해 두는 것이 좋아.',
  },
  'adaptive.reality.choice-safety-net': {
    slot: 'choice',
    title: '마음을 놓게 하는 안전망',
    template:
      '현실적인 결정을 더 안심하고 내리는 데 필요한 안전망은 “{answer}” 쪽이야. 안전망은 실패를 예상하는 일이 아니라, 시도할 수 있는 범위를 넓혀 주는 장치야.',
  },
  'adaptive.timing.choice-boundary': {
    slot: 'choice',
    title: '기다림을 끝낼 기준',
    template:
      '계속 기다리기만 하지 않도록 미리 두고 싶은 기준은 “{answer}”에 가까워. 그 기준이 충족됐을 때 무엇을 할지도 함께 정해 두면 결정이 다시 처음으로 돌아가지 않아.',
  },
} as const satisfies Record<string, QuestionFrame>

const SELF_FOCUS = {
  'self.need.rest': {
    focus: '회복할 여백',
    oneLine: '지금은 더 잘해내는 것보다 아무것도 증명하지 않고 쉬는 시간이 너를 다시 반짝이게 해.',
  },
  'self.need.expression': {
    focus: '숨기지 않는 표현',
    oneLine: '마음속 생각을 작게라도 밖으로 꺼낼 때 네가 원하는 방향도 함께 선명해져.',
  },
  'self.need.connection': {
    focus: '따뜻한 연결',
    oneLine: '혼자 단단해지려 애쓰기보다 믿을 수 있는 한 사람 곁에서 마음을 내려놓아도 괜찮아.',
  },
  'self.need.growth': {
    focus: '새로운 성장',
    oneLine: '완벽히 준비된 다음이 아니라 궁금함이 살아나는 작은 경험에서 다음의 네가 시작돼.',
  },
} as const satisfies Record<string, FocusCopy>

const LOVE_FOCUS = {
  'love.need.certainty': {
    focus: '분명한 확신',
    oneLine: '추측으로 마음을 채우지 말고, 관계의 이름과 방향을 다정하지만 분명하게 확인해 봐.',
  },
  'love.need.spark': {
    focus: '살아 있는 설렘',
    oneLine: '안전한 익숙함만 지키기보다 둘의 마음이 다시 뛰는 작은 장면을 먼저 만들어 봐.',
  },
  'love.need.honesty': {
    focus: '솔직한 대화',
    oneLine: '좋은 말만 고르기보다 진짜 마음을 짧고 정확하게 나눌 때 사랑이 숨을 쉬어.',
  },
  'love.need.trust': {
    focus: '오래 기대는 믿음',
    oneLine: '큰 약속 한 번보다 반복해서 지켜지는 작은 행동이 네 사랑을 가장 편안하게 해.',
  },
} as const satisfies Record<string, FocusCopy>

const WORK_FOCUS = {
  'work.value.achievement': {
    focus: '눈에 보이는 성과',
    oneLine: '완료의 기준을 먼저 정하면 흩어지던 힘이 해냈다고 말할 수 있는 한 점으로 모여.',
  },
  'work.value.stability': {
    focus: '흔들리지 않는 기반',
    oneLine: '빠른 도약보다 수입과 일상을 지키는 구조를 먼저 만들 때 오래 달릴 힘이 생겨.',
  },
  'work.value.autonomy': {
    focus: '내 방식의 자유',
    oneLine: '성과만큼 네 속도와 방법을 선택할 여지가 있어야 이 일이 오래 너다운 일이 돼.',
  },
  'work.value.meaning': {
    focus: '의미 있는 기여',
    oneLine: '왜 하는지 다시 연결되는 순간, 멈춰 있던 집중력도 제자리를 찾아오기 시작해.',
  },
} as const satisfies Record<string, FocusCopy>

const CHOICE_FOCUS = {
  'choice.need.criteria': {
    focus: '비교할 기준',
    oneLine: '선택지를 더 모으기 전에 무엇을 지키면 좋은 결정인지 세 가지 기준부터 정해 봐.',
  },
  'choice.need.courage': {
    focus: '움직일 용기',
    oneLine: '확신이 모두 찰 때까지 기다리기보다 되돌릴 수 있는 가장 작은 한 걸음을 골라 봐.',
  },
  'choice.need.trust': {
    focus: '내 선택에 대한 신뢰',
    oneLine: '이미 움직였다면 새 증거가 생기기 전까지는 그때의 네가 고른 이유를 믿어 줘.',
  },
  'choice.need.timing': {
    focus: '기다림의 기준',
    oneLine: '좋은 때를 막연히 기다리지 말고 날짜나 정보처럼 확인할 수 있는 신호를 정해 둬.',
  },
} as const satisfies Record<string, FocusCopy>

const GUIDANCE = {
  self: {
    'self.coping.compassion':
      '실수한 오늘의 너에게도 친구에게 하듯 말해 줘. 회복된 뒤 고칠 일과 지금 당장 자책할 일을 분리하는 것이 먼저야.',
    'self.coping.analysis':
      '원인을 찾을 때는 바꿀 수 있는 조건 하나까지만 좁혀 봐. 분석이 설명에 머물지 않고 다음 행동으로 이어져.',
    'self.coping.action':
      '고치려는 힘은 충분해. 다만 급한 수습 전에 숨을 한 번 고르고, 정말 필요한 수정 한 가지만 정해 봐.',
    'self.coping.withdrawal':
      '숨고 싶은 마음을 다그치지 마. 안전한 곳에서 감정을 이름 붙인 뒤 믿을 수 있는 사람 한 명에게 짧게 알려 줘.',
  },
  love: {
    'love.pace.approach':
      '먼저 다가가는 용기는 네 장점이야. 이번에는 마음을 전한 뒤 상대가 한 걸음 다가올 공간도 함께 남겨 둬.',
    'love.pace.observe': '천천히 보는 감각을 믿되, 관찰만으로 상대의 뜻을 확정하지는 마. 궁금한 한 가지는 직접 물어봐.',
    'love.pace.care': '작은 행동은 다정한 사랑의 언어야. 상대가 그 행동을 마음으로 알아듣는지 말 한마디도 곁들여 줘.',
    'love.pace.distance':
      '물러나는 것이 마음을 지키는 데 필요할 수 있어. 다만 침묵으로 사라지기보다 필요한 거리와 이유를 알려 줘.',
  },
  work: {
    'work.need.structure':
      '오늘 할 일 전체가 아니라 끝내야 할 한 가지와 완료 조건을 적어 봐. 우선순위는 줄이는 순간 힘을 발휘해.',
    'work.need.mastery': '자신감이 생긴 뒤 시작하려 하지 말고, 실력을 확인할 수 있는 작은 결과물을 먼저 만들어 봐.',
    'work.need.alignment':
      '사람의 태도를 해석하기 전에 역할·기한·결정권 중 하나를 문장으로 합의해 봐. 관계의 마찰이 일의 언어로 바뀌어.',
    'work.need.recovery':
      '집중력이 바닥난 상태에서는 계획도 과장돼 보여. 회복 시간을 일정에 먼저 넣고 남은 힘으로 범위를 다시 정해.',
  },
  choice: {
    'choice.protect.possibility':
      '모든 가능성을 남길 수는 없지만 작은 시험은 할 수 있어. 가장 궁금한 선택지를 되돌릴 수 있는 크기로 경험해 봐.',
    'choice.protect.relationship':
      '누군가를 배려하는 마음과 네 선택을 포기하는 일은 달라. 결정과 관계를 각각 한 문장으로 나눠 전해 봐.',
    'choice.protect.resources':
      '감당 가능한 손실의 상한을 먼저 정해. 돈과 시간을 어디까지 쓸지 알면 실패의 크기도 선택할 수 있어.',
    'choice.protect.identity':
      '남의 기대를 모두 지운 뒤에도 남는 방향을 적어 봐. 책임질 수 있는 선택은 대개 그 문장 가까이에 있어.',
  },
} as const satisfies Record<GuardianReportSlot, Record<string, string>>

const TONES = {
  'guidance.tone.gentle': {
    introduction: '조급하게 답을 정하지 않아도 괜찮아.',
    closing: '한 번에 다 바꾸지 않아도 돼. 마음이 편안해지는 쪽으로 아주 작게 움직여도 충분해.',
  },
  'guidance.tone.clear': {
    introduction: '지금 필요한 건 마음을 꾸미지 않고 정확히 바라보는 일이야.',
    closing: '모호한 걱정은 문장으로, 문장은 확인할 수 있는 기준으로 바꿔 봐. 그러면 다음 행동이 선명해져.',
  },
  'guidance.tone.practical': {
    introduction: '마음을 읽은 다음에는 오늘 할 수 있는 크기로 내려놓아 보자.',
    closing: '좋은 해석은 실제 하루를 바꿀 때 힘이 생겨. 이번 주 일정에 넣을 수 있는 한 가지부터 골라 봐.',
  },
  'guidance.tone.encouraging': {
    introduction: '네 안에는 이미 다음 장면을 시작할 작은 빛이 켜져 있어.',
    closing: '완벽한 확신보다 살아나는 마음을 믿어 봐. 작은 시도가 새로운 증거를 데려올 거야.',
  },
} as const

const PATHS = {
  'report.path.inner': {
    title: '내 마음을 하나로 모으는 길',
    heroLine: '지금의 실마리는 바깥의 정답보다 네 안의 서로 다른 목소리를 구분하는 데 있어.',
    bridge: '네 가지 주제를 잇는 중심은 원하는 마음과 해야 한다는 마음을 구분하는 일이야.',
    action: '종이를 반으로 나눠 ‘내가 원하는 것’과 ‘내가 해야 한다고 느끼는 것’을 한 줄씩 적어 봐.',
  },
  'report.path.relationship': {
    title: '관계를 지키며 나를 잃지 않는 길',
    heroLine: '지금의 실마리는 상대의 반응을 미리 결정하기보다 네 마음과 경계를 분명히 전하는 데 있어.',
    bridge: '네 가지 주제를 잇는 중심은 관계를 소중히 여기면서도 네 기준을 지키는 일이야.',
    action: '중요한 사람에게 전할 말을 ‘내 마음’, ‘내가 바라는 것’, ‘존중할 여지’ 세 문장으로 적어 봐.',
  },
  'report.path.reality': {
    title: '현실을 작게 확인하며 움직이는 길',
    heroLine: '지금의 실마리는 막연한 부담을 숫자와 일정, 되돌릴 수 있는 작은 시험으로 바꾸는 데 있어.',
    bridge: '네 가지 주제를 잇는 중심은 마음의 방향을 지우지 않으면서 현실에서 가능한 크기를 찾는 일이야.',
    action: '가장 걱정되는 조건 하나를 골라 금액·시간·범위 중 확인할 수 있는 숫자로 바꿔 적어 봐.',
  },
  'report.path.timing': {
    title: '기다림에 기준을 세우는 길',
    heroLine: '지금의 실마리는 완벽한 때를 기다리기보다 움직일 신호와 기다림의 끝을 미리 정하는 데 있어.',
    bridge: '네 가지 주제를 잇는 중심은 서두르지 않되 끝없이 미루지도 않는 네 속도를 만드는 일이야.',
    action: '다시 판단할 날짜 하나와 그날까지 꼭 확인할 정보 하나를 달력에 적어 둬.',
  },
} as const

const MOVEMENTS = {
  start: '새로운 문 앞에 선 네 마음',
  continue: '이어갈 힘을 고르는 네 마음',
  recover: '다시 숨을 되찾는 네 마음',
  release: '가볍게 놓아줄 것을 찾는 네 마음',
} as const

const ZODIAC = {
  aries: { label: '양자리', quality: '먼저 움직이며 답을 찾는 힘' },
  taurus: { label: '황소자리', quality: '천천히 쌓아 오래 지키는 힘' },
  gemini: { label: '쌍둥이자리', quality: '질문하고 연결하며 가능성을 넓히는 감각' },
  cancer: { label: '게자리', quality: '마음을 살피고 안전한 자리를 만드는 힘' },
  leo: { label: '사자자리', quality: '진심을 당당하게 드러내고 온기를 나누는 힘' },
  virgo: { label: '처녀자리', quality: '작은 차이를 알아보고 삶을 정돈하는 감각' },
  libra: { label: '천칭자리', quality: '서로 다른 마음 사이에서 균형을 찾는 감각' },
  scorpio: { label: '전갈자리', quality: '겉보다 깊은 진실을 끝까지 바라보는 힘' },
  sagittarius: { label: '사수자리', quality: '더 넓은 세계를 향해 의미를 찾는 힘' },
  capricorn: { label: '염소자리', quality: '시간을 들여 책임 있는 결과를 만드는 힘' },
  aquarius: { label: '물병자리', quality: '익숙한 틀 밖에서 새로운 방식을 찾는 감각' },
  pisces: { label: '물고기자리', quality: '경계를 넘어 느끼고 상상하는 섬세함' },
} as const satisfies Record<GuardianZodiacSign, { label: string; quality: string }>

const BODY_LABELS = {
  sun: '태양',
  moon: '달',
  ascendant: '상승궁',
  venus: '금성',
  saturn: '토성',
  midheaven: '중천점',
  mercury: '수성',
  mars: '화성',
} as const satisfies Record<GuardianReportPlacementBody, string>

const SECTION_BASE = {
  self: {
    label: '자기이해',
    title: '마음이 쉬는 달집',
    guardians: '달콩이',
    artworkAlt: '달집 안에서 작은 우주 연못에 비친 자신의 표정을 바라보는 달콩이',
    reflection: '오늘 네가 가장 편안해지는 선택은 무엇인지 한 문장으로 남겨 봐.',
  },
  work: {
    label: '일',
    title: '너무 높은 별탑',
    guardians: '차곡이 · 새봄이',
    artworkAlt: '기울어진 별쿠키 탑을 함께 수습하는 차곡이와 새봄이',
    reflection: '이번 주에 덜어낼 일 하나와 끝낼 일 하나를 나란히 적어 봐.',
  },
  choice: {
    label: '결정',
    title: '먼저 반짝인 문',
    guardians: '고르미',
    artworkAlt: '저울을 내려놓고 먼저 반짝인 분홍 별 문손잡이를 잡는 고르미',
    reflection: '결과가 아니라 선택 과정에서 꼭 지키고 싶은 태도 하나를 적어 봐.',
  },
} as const

const LOVE_CARD_COPY = {
  orbit: {
    title: '먼저 달려간 하트',
    guardians: '몽실이',
    artworkAlt: '큰 하트를 혼자 달 우체통에 넣으려다 걸린 몽실이',
  },
  nebula: {
    title: '비를 견딘 하트',
    guardians: '몽실이',
    artworkAlt: '비옷을 입고 비를 맞으며 큰 하트를 감싸 지키는 몽실이',
  },
  eclipse: {
    title: '마주 잡은 하트',
    guardians: '몽실이 · 달콩이',
    artworkAlt: '달 우체통에 걸린 하트를 양쪽에서 함께 잡은 몽실이와 달콩이',
  },
  stella: {
    title: '별빛으로 열린 하트',
    guardians: '몽실이 · 달콩이',
    artworkAlt: '함께 연 하트에서 두 수호령을 잇는 별 지도가 피어나는 몽실이와 달콩이',
  },
} as const

const CARD_COPY_BY_EDITION = {
  'cancer.self.base': { slot: 'self', ...SECTION_BASE.self },
  'aries.love.orbit': {
    slot: 'love',
    label: '사랑',
    ...LOVE_CARD_COPY.orbit,
    reflection: '지금의 관계에서 추측 대신 직접 확인하고 싶은 마음 하나를 적어 봐.',
  },
  'aries.love.nebula': {
    slot: 'love',
    label: '사랑',
    ...LOVE_CARD_COPY.nebula,
    reflection: '지금의 관계에서 추측 대신 직접 확인하고 싶은 마음 하나를 적어 봐.',
  },
  'aries.love.eclipse': {
    slot: 'love',
    label: '사랑',
    ...LOVE_CARD_COPY.eclipse,
    reflection: '지금의 관계에서 추측 대신 직접 확인하고 싶은 마음 하나를 적어 봐.',
  },
  'aries.love.stella': {
    slot: 'love',
    label: '사랑',
    ...LOVE_CARD_COPY.stella,
    reflection: '지금의 관계에서 추측 대신 직접 확인하고 싶은 마음 하나를 적어 봐.',
  },
  'taurus.work.base': { slot: 'work', ...SECTION_BASE.work },
  'libra.choice.base': { slot: 'choice', ...SECTION_BASE.choice },
} as const

const LOVE_CARD_ONE_LINE_BY_EDITION = {
  'aries.love.orbit': (focus: string) =>
    `지금 사랑에서 가장 밝게 보이는 말: “${focus}”. 먼저 궤도를 연 진심 뒤에 상대가 다가올 여백도 남겨 둬.`,
  'aries.love.nebula': (focus: string) =>
    `지금 사랑에서 가장 밝게 보이는 말: “${focus}”. 마음을 지키면서도 비가 그친 뒤 다시 문을 열 시점을 정해 둬.`,
  'aries.love.eclipse': (focus: string) =>
    `지금 사랑에서 가장 밝게 보이는 말: “${focus}”. 혼자 밀던 마음을 내려놓고 상대가 잡을 수 있는 자리를 보여 줘.`,
  'aries.love.stella': (focus: string) =>
    `지금 사랑에서 가장 밝게 보이는 말: “${focus}”. 둘만의 약속을 실제 일상에서 반복할 작은 행동으로 바꿔 봐.`,
} as const

export function validateGuardianReportCardsKoV1(editions: readonly GuardianCardEdition[]): void {
  const editionIds = new Set(editions.map(({ id }) => id))
  const editionById = new Map(editions.map((edition) => [edition.id, edition]))
  const issues: string[] = []
  for (const edition of editions) {
    const copy = CARD_COPY_BY_EDITION[edition.id as keyof typeof CARD_COPY_BY_EDITION]
    if (!copy || copy.slot !== edition.slot) {
      issues.push(`Report card copy is missing edition ${edition.id}`)
    }
    if (edition.slot === 'love' && !(edition.id in LOVE_CARD_ONE_LINE_BY_EDITION)) {
      issues.push(`Report love-card one-line is missing edition ${edition.id}`)
    }
  }
  for (const editionId of Object.keys(CARD_COPY_BY_EDITION)) {
    if (!editionIds.has(editionId)) {
      issues.push(`Report card copy references unknown edition ${editionId}`)
    }
  }
  for (const editionId of Object.keys(LOVE_CARD_ONE_LINE_BY_EDITION)) {
    if (editionById.get(editionId)?.slot !== 'love') {
      issues.push(`Report love-card one-line references a non-love or unknown edition ${editionId}`)
    }
  }
  if (issues.length > 0) {
    throw new Error(`Invalid guardian report card copy:\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
  }
}

export function validateGuardianReportCopyKoV1(questionnaire: GuardianQuestionnaireContent): void {
  const issues: string[] = []
  if (questionnaire.version !== QUESTIONNAIRE_VERSION) {
    issues.push(`Copy ${GUARDIAN_REPORT_COPY_KO_V1} requires questionnaire ${QUESTIONNAIRE_VERSION}`)
  }
  if (questionnaire.locale !== 'ko') {
    issues.push(`Copy ${GUARDIAN_REPORT_COPY_KO_V1} requires locale ko`)
  }

  const choiceQuestions = questionnaire.questions.filter(
    (question): question is GuardianSingleChoiceQuestion => question.kind === 'single_choice',
  )
  const questionIds = new Set(choiceQuestions.map(({ id }) => id))
  for (const question of choiceQuestions) {
    const frame = QUESTION_FRAMES[question.id as keyof typeof QUESTION_FRAMES]
    if (!frame) {
      issues.push(`Report copy is missing question ${question.id}`)
      continue
    }
    if (frame.slot !== question.slot) {
      issues.push(`Report copy question ${question.id} belongs to ${frame.slot}, expected ${question.slot}`)
    }
    if (!frame.template.includes(ANSWER_TOKEN)) {
      issues.push(`Report copy question ${question.id} does not interpolate the selected answer`)
    }
  }
  for (const questionId of Object.keys(QUESTION_FRAMES)) {
    if (!questionIds.has(questionId)) {
      issues.push(`Report copy references unknown question ${questionId}`)
    }
  }

  const producedSignals = new Set(
    choiceQuestions.flatMap((question) => question.options.flatMap((option) => Object.keys(option.signals))),
  )
  const consumedSignals = [
    ...Object.keys(SELF_FOCUS),
    ...Object.keys(LOVE_FOCUS),
    ...Object.keys(WORK_FOCUS),
    ...Object.keys(CHOICE_FOCUS),
    ...Object.values(GUIDANCE).flatMap((copy) => Object.keys(copy)),
    ...Object.keys(TONES),
    ...Object.keys(PATHS),
  ]
  for (const signal of consumedSignals) {
    if (!producedSignals.has(signal)) {
      issues.push(`Report copy selector references a signal no option produces: ${signal}`)
    }
  }

  const selectorContracts = [
    ['core.self.hidden-need', SELF_FOCUS],
    ['core.love.deepest-wish', LOVE_FOCUS],
    ['core.work.reward', WORK_FOCUS],
    ['core.choice.current-stage', CHOICE_FOCUS],
    ['core.self.inner-voice', GUIDANCE.self],
    ['core.love.pace', GUIDANCE.love],
    ['core.work.friction', GUIDANCE.work],
    ['core.choice.deepest-fear', GUIDANCE.choice],
    ['core.choice.main-blocker', PATHS],
  ] as const
  for (const [questionId, selector] of selectorContracts) {
    const question = choiceQuestions.find(({ id }) => id === questionId)
    if (!question) {
      issues.push(`Report copy selector question is missing: ${questionId}`)
      continue
    }
    for (const option of question.options) {
      const matchingSignals = Object.keys(option.signals).filter((signal) => signal in selector)
      if (matchingSignals.length !== 1) {
        issues.push(`Report copy selector ${questionId}/${option.id} must produce exactly one recognized signal`)
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Invalid guardian report copy:\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
  }
}

export function buildGuardianReportNarrativeKoV1(input: GuardianReportNarrativeInput): GuardianReportNarrativeSnapshot {
  validateGuardianReportCopyKoV1(input.questionnaire)
  const { answersBySlot, personalNote } = selectedAnswers(input)
  const cardsBySlot = selectedCards(input)

  const selfFocus = strongestSignalCopy(input.signalSnapshot, SELF_FOCUS)
  const loveFocus = strongestSignalCopy(input.signalSnapshot, LOVE_FOCUS)
  const workFocus = strongestSignalCopy(input.signalSnapshot, WORK_FOCUS)
  const choiceFocus = strongestSignalCopy(input.signalSnapshot, CHOICE_FOCUS)
  const focusBySlot = {
    self: selfFocus,
    love: loveFocus,
    work: workFocus,
    choice: choiceFocus,
  } as const

  const toneKey = strongestPreferredSignalKey(
    input.signalSnapshot,
    TONES,
    previewToneSignal(input.inputSnapshot.previewAnswers.tone),
  )
  const pathKey = strongestRequiredSignalKey(input.signalSnapshot, PATHS)
  const tone = TONES[toneKey]
  const path = PATHS[pathKey]

  const sections = GUARDIAN_REPORT_SLOTS.map((slot) =>
    buildSection(input, slot, answersBySlot[slot], cardsBySlot[slot], focusBySlot[slot]),
  )

  return {
    schemaVersion: GUARDIAN_REPORT_NARRATIVE_SCHEMA_VERSION,
    locale: 'ko',
    hero: {
      eyebrow: 'STELLA GUARDIAN REPORT',
      title: MOVEMENTS[input.inputSnapshot.previewAnswers.movement],
      introduction: `${tone.introduction} 네 차트의 바탕과 결제 후 남긴 답을 함께 놓고, 자기이해·사랑·일·결정이 이어지는 흐름을 읽었어.`,
      oneLine: path.heroLine,
      chartNote: input.inputSnapshot.chart.timeKnown
        ? null
        : '태어난 시각을 알 수 없어 상승궁·중천점·하우스는 본문에 쓰지 않았어. 달은 가능한 위치 범위가 한 별자리에 머물 때만 별자리 이름을 표시했어.',
    },
    sections,
    closing: {
      title: path.title,
      body: [
        `지금 리포트의 네 축을 이렇게 정리할 수 있어: 자기이해 “${selfFocus.focus}”, 사랑 “${loveFocus.focus}”, 일 “${workFocus.focus}”, 결정 “${choiceFocus.focus}”.`,
        `${path.bridge} ${tone.closing}`,
      ],
      action: path.action,
      personalNote: personalNote
        ? {
            label: '네가 직접 남긴 마음',
            body: personalNote,
          }
        : null,
    },
  }
}

function selectedAnswers(input: GuardianReportNarrativeInput): {
  answersBySlot: Record<GuardianReportSlot, SelectedQuestionAnswer[]>
  personalNote: string | null
} {
  const answersBySlot: Record<GuardianReportSlot, SelectedQuestionAnswer[]> = {
    self: [],
    love: [],
    work: [],
    choice: [],
  }
  const consumedAnswerIds = new Set<string>()
  let personalNote: string | null = null

  for (const question of input.questionnaire.questions) {
    const answer = input.answerSnapshot[question.id]
    if (!answer) {
      continue
    }
    consumedAnswerIds.add(question.id)
    if (question.kind === 'free_text') {
      if (answer.type !== 'text') {
        throw new Error(`Guardian report note ${question.id} has a non-text answer`)
      }
      personalNote = answer.text
      continue
    }
    if (answer.type !== 'option') {
      throw new Error(`Guardian report question ${question.id} has a non-option answer`)
    }
    const option = question.options.find(({ id }) => id === answer.optionId)
    if (!option) {
      throw new Error(`Guardian report question ${question.id} has unknown option ${answer.optionId}`)
    }
    answersBySlot[question.slot].push({ question, option })
  }

  const unknownAnswer = Object.keys(input.answerSnapshot).find((questionId) => !consumedAnswerIds.has(questionId))
  if (unknownAnswer) {
    throw new Error(`Guardian report answer snapshot contains unknown question ${unknownAnswer}`)
  }
  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const count = answersBySlot[slot].length
    if (count < 4 || count > 5) {
      throw new Error(`Guardian report ${slot} needs 4–5 selected answers, received ${count}`)
    }
  }

  return { answersBySlot, personalNote }
}

function selectedCards(input: GuardianReportNarrativeInput): Record<GuardianReportSlot, (typeof input.cards)[number]> {
  const cards = new Map(input.cards.map((card) => [card.slot, card]))
  if (cards.size !== GUARDIAN_REPORT_SLOTS.length || input.cards.length !== GUARDIAN_REPORT_SLOTS.length) {
    throw new Error('Guardian report narrative requires exactly one card for every slot')
  }
  return Object.fromEntries(
    GUARDIAN_REPORT_SLOTS.map((slot) => {
      const card = cards.get(slot)
      if (!card) {
        throw new Error(`Guardian report narrative is missing its ${slot} card`)
      }
      return [slot, card]
    }),
  ) as Record<GuardianReportSlot, (typeof input.cards)[number]>
}

function buildSection(
  input: GuardianReportNarrativeInput,
  slot: GuardianReportSlot,
  selected: readonly SelectedQuestionAnswer[],
  card: (typeof input.cards)[number],
  focus: FocusCopy,
): GuardianReportNarrativeSection {
  const frameDetails = selected.map(({ question, option }) => {
    const frame = QUESTION_FRAMES[question.id as keyof typeof QUESTION_FRAMES]
    if (!frame || frame.slot !== slot) {
      throw new Error(`Guardian report copy is missing selected question ${question.id}`)
    }
    return {
      title: frame.title,
      body: frame.template.replace(ANSWER_TOKEN, option.label),
    }
  })
  const guidance = strongestSignalValue(input.signalSnapshot, GUIDANCE[slot])
  const cardCopy = sectionCardCopy(card)
  const oneLine = slot === 'love' ? loveCardOneLine(card.editionId, focus.focus) : focus.oneLine

  return {
    ...cardCopy,
    oneLine,
    chart: chartCopy(input, slot),
    details: frameDetails,
    guidance: {
      title: '수호령이 건네는 다음 한 걸음',
      body: guidance,
    },
    reflection: cardCopy.reflection,
  }
}

function sectionCardCopy(card: GuardianReportNarrativeInput['cards'][number]) {
  const copy = CARD_COPY_BY_EDITION[card.editionId as keyof typeof CARD_COPY_BY_EDITION]
  if (!copy || copy.slot !== card.slot) {
    throw new Error(`Guardian report copy has no card metadata for ${card.editionId}`)
  }
  return copy
}

function loveCardOneLine(editionId: string, focus: string): string {
  const build = LOVE_CARD_ONE_LINE_BY_EDITION[editionId as keyof typeof LOVE_CARD_ONE_LINE_BY_EDITION]
  if (!build) {
    throw new Error(`Guardian report copy has no love-card one-line for ${editionId}`)
  }
  return build(focus)
}

function chartCopy(input: GuardianReportNarrativeInput, slot: GuardianReportSlot) {
  const chart = input.inputSnapshot.chart
  if (slot === 'self') {
    const sun = planetPlacement(input, 'sun', 'sun')
    const placements: GuardianReportPlacement[] = [sun]
    const moon = knownMoonPlacement(input)
    if (moon) {
      placements.push(moon)
    }
    if (chart.timeKnown && chart.ascendant !== null) {
      placements.push(anglePlacement('ascendant', chart.ascendant))
    }
    const supportingPlacements = placements.slice(1).map(({ label }) => label)
    const additions =
      supportingPlacements.length > 0 ? `마음의 표정에는 ${supportingPlacements.join('과 ')}의 결도 함께 스며들어.` : ''
    return {
      summary: `${sun.label}은 자기다움의 중심에 “${ZODIAC[sun.sign].quality}”을 두고 있어. ${additions}`.trim(),
      placements,
    }
  }
  if (slot === 'love') {
    const venus = planetPlacement(input, 'venus', 'venus')
    return {
      summary: `${venus.label}은 사랑을 주고받을 때 “${ZODIAC[venus.sign].quality}”이라는 결이 자연스럽게 드러난다고 말해.`,
      placements: [venus],
    }
  }
  if (slot === 'work') {
    const saturn = planetPlacement(input, 'saturn', 'saturn')
    const placements: GuardianReportPlacement[] = [saturn]
    if (chart.timeKnown && chart.midheaven !== null) {
      placements.push(anglePlacement('midheaven', chart.midheaven))
    }
    const midheaven = placements[1]
    return {
      summary: midheaven
        ? `${saturn.label}은 오래 쌓아야 할 과제를, ${midheaven.label}은 세상에서 향하는 방향을 보여 줘. 두 별자리의 결을 함께 써야 성취와 지속 가능성이 나란히 남아.`
        : `${saturn.label}은 일에서 오래 배우고 단단하게 만들 과제에 “${ZODIAC[saturn.sign].quality}”이라는 결이 필요하다고 말해.`,
      placements,
    }
  }

  const mercury = planetPlacement(input, 'mercury', 'mercury')
  const mars = planetPlacement(input, 'mars', 'mars')
  return {
    summary: `${mercury.label}은 생각을 정리하는 방식, ${mars.label}은 실제로 움직이는 방식을 보여 줘. 생각과 행동의 속도가 다를 때는 둘 중 하나를 억누르기보다 역할을 나누는 편이 좋아.`,
    placements: [mercury, mars],
  }
}

function knownMoonPlacement(input: GuardianReportNarrativeInput): GuardianReportPlacement | null {
  const chart = input.inputSnapshot.chart
  if (chart.timeKnown) {
    return planetPlacement(input, 'moon', 'moon')
  }
  if (!chart.moonLongitudeRange) {
    return null
  }
  const startSign = zodiacSign(chart.moonLongitudeRange[0])
  const endSign = zodiacSign(chart.moonLongitudeRange[1])
  return startSign === endSign ? placement('moon', startSign) : null
}

function planetPlacement(
  input: GuardianReportNarrativeInput,
  planetId: 'sun' | 'moon' | 'venus' | 'saturn' | 'mercury' | 'mars',
  body: GuardianReportPlacementBody,
): GuardianReportPlacement {
  const planet = input.inputSnapshot.chart.planets.find(({ id }) => id === planetId)
  if (!planet) {
    throw new Error(`Guardian report chart is missing ${planetId}`)
  }
  return placement(body, zodiacSign(planet.lon))
}

function anglePlacement(body: 'ascendant' | 'midheaven', longitude: number): GuardianReportPlacement {
  return placement(body, zodiacSign(longitude))
}

function placement(body: GuardianReportPlacementBody, sign: GuardianZodiacSign): GuardianReportPlacement {
  return {
    body,
    sign,
    label: `${ZODIAC[sign].label} ${BODY_LABELS[body]}`,
  }
}

function zodiacSign(longitude: number): GuardianZodiacSign {
  const normalized = ((longitude % 360) + 360) % 360
  const sign = GUARDIAN_ZODIAC_SIGNS[Math.floor(normalized / 30)]
  if (!sign) {
    throw new Error(`Guardian chart has invalid longitude ${longitude}`)
  }
  return sign
}

function strongestSignalCopy<T extends Record<string, FocusCopy>>(
  signals: GuardianQuestionnaireSignalSnapshot,
  choices: T,
): T[keyof T] {
  return choices[strongestRequiredSignalKey(signals, choices)]
}

function strongestSignalValue<T extends Record<string, string>>(
  signals: GuardianQuestionnaireSignalSnapshot,
  choices: T,
): T[keyof T] {
  return choices[strongestRequiredSignalKey(signals, choices)]
}

function strongestRequiredSignalKey<T extends Record<string, unknown>>(
  signals: GuardianQuestionnaireSignalSnapshot,
  choices: T,
): keyof T & string {
  let winner: (keyof T & string) | null = null
  let winnerScore = 0
  for (const signal of Object.keys(choices) as (keyof T & string)[]) {
    const score = signals[signal] ?? 0
    if (score > winnerScore) {
      winner = signal
      winnerScore = score
    }
  }
  if (!winner) {
    throw new Error('Guardian report answer signals do not select required copy')
  }
  return winner
}

function strongestPreferredSignalKey<T extends Record<string, unknown>>(
  signals: GuardianQuestionnaireSignalSnapshot,
  choices: T,
  preferred: keyof T & string,
): keyof T & string {
  let winner = preferred
  let winnerScore = signals[preferred] ?? 0
  for (const signal of Object.keys(choices) as (keyof T & string)[]) {
    const score = signals[signal] ?? 0
    if (score > winnerScore) {
      winner = signal
      winnerScore = score
    }
  }
  return winner
}

function previewToneSignal(tone: GuardianReportNarrativeInput['inputSnapshot']['previewAnswers']['tone']) {
  return {
    comfort: 'guidance.tone.gentle',
    honesty: 'guidance.tone.clear',
    action: 'guidance.tone.practical',
    possibility: 'guidance.tone.encouraging',
  }[tone] as keyof typeof TONES
}
