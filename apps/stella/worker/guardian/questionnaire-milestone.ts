import type { Locale } from '@sobok/domain/locale'
import type { GuardianReportSlot } from './manifest'
import type { GuardianQuestionnaireSignalSnapshot } from './questionnaire'

export const GUARDIAN_CORE_MILESTONE_ID = 'core-reflection-v1' as const

export interface GuardianQuestionnaireMilestoneView {
  id: typeof GUARDIAN_CORE_MILESTONE_ID
  eyebrow: string
  title: string
  body: string
  themes: readonly {
    slot: GuardianReportSlot
    label: string
    glyph: string
    title: string
    body: string
  }[]
  bridge: {
    eyebrow: string
    title: string
    body: string
    cta: string
  }
}

type InsightCopy = { title: string; body: string }

const SELF_STATE_KEYS = [
  'self.state.beginning',
  'self.state.enduring',
  'self.state.recovering',
  'self.state.reflecting',
] as const
const LOVE_CONTEXT_KEYS = [
  'love.context.connected',
  'love.context.curious',
  'love.context.recovering',
  'love.context.solo',
] as const
const WORK_ENERGY_KEYS = [
  'work.energy.blocked',
  'work.energy.overloaded',
  'work.energy.resetting',
  'work.energy.sustainable',
] as const
const CHOICE_STAGE_KEYS = [
  'choice.stage.comparing',
  'choice.stage.hesitating',
  'choice.stage.second_guessing',
  'choice.stage.waiting',
] as const
const REPORT_PATH_KEYS = [
  'report.path.inner',
  'report.path.reality',
  'report.path.relationship',
  'report.path.timing',
] as const

type MilestoneCopy = {
  eyebrow: string
  title: string
  body: string
  themes: Record<
    GuardianReportSlot,
    {
      label: string
      glyph: string
      insights: Record<string, InsightCopy>
    }
  >
  bridges: Record<(typeof REPORT_PATH_KEYS)[number], { eyebrow: string; title: string; body: string; cta: string }>
}

const KO_COPY: MilestoneCopy = {
  eyebrow: 'FIRST CONSTELLATION',
  title: '열두 답이 만든 첫 번째 마음 지도',
  body: '아직 최종 카드가 정해진 것은 아니에요. 지금까지의 답에서 네 주제를 움직이는 흐름을 먼저 정리했어요.',
  themes: {
    self: {
      label: '나',
      glyph: '☾',
      insights: {
        'self.state.beginning': {
          title: '새 흐름을 시작할 힘이 올라오고 있어요',
          body: '완벽한 준비보다 내 마음이 움직였다는 사실을 먼저 믿을 때예요.',
        },
        'self.state.enduring': {
          title: '잘 버텨 온 만큼 내 한계도 살펴야 해요',
          body: '참는 힘은 충분해요. 이제는 무엇을 계속 지킬지 고르는 일이 중요해 보여요.',
        },
        'self.state.recovering': {
          title: '속도보다 회복의 리듬이 먼저예요',
          body: '멈춘 것이 아니라 다시 오래 움직일 수 있는 힘을 모으는 중이에요.',
        },
        'self.state.reflecting': {
          title: '생각이 깊어진 만큼 내 목소리를 구분할 때예요',
          body: '여러 가능성을 살피되 다른 사람의 기준과 내 감각을 분리해 볼 필요가 있어요.',
        },
      },
    },
    love: {
      label: '사랑',
      glyph: '♡',
      insights: {
        'love.context.connected': {
          title: '관계 안의 온도를 더 선명하게 읽고 있어요',
          body: '마음의 크기뿐 아니라 서로가 실제로 주고받는 방식이 중요한 시기예요.',
        },
        'love.context.curious': {
          title: '아직 이름 붙지 않은 가능성이 열려 있어요',
          body: '서두른 결론보다 호기심이 어디로 향하는지 지켜보는 편이 좋아요.',
        },
        'love.context.recovering': {
          title: '다시 믿기 전에 안전함을 확인하고 싶어 해요',
          body: '조심스러움은 약함이 아니에요. 내 속도를 존중하는 관계가 필요해 보여요.',
        },
        'love.context.solo': {
          title: '누군가보다 나와의 관계를 먼저 세우고 있어요',
          body: '혼자인 지금도 사랑의 공백이 아니라 원하는 관계를 알아가는 시간이 될 수 있어요.',
        },
      },
    },
    work: {
      label: '일',
      glyph: '✦',
      insights: {
        'work.energy.blocked': {
          title: '의지보다 막혀 있는 조건을 먼저 찾아야 해요',
          body: '더 밀어붙이는 것보다 시작을 어렵게 만드는 한 가지 마찰을 줄이는 편이 효과적이에요.',
        },
        'work.energy.overloaded': {
          title: '성취보다 에너지의 누수를 점검할 때예요',
          body: '할 수 있는 일과 지금 맡아야 하는 일을 분리하면 중요한 힘을 지킬 수 있어요.',
        },
        'work.energy.resetting': {
          title: '새 리듬을 만드는 전환점에 가까워요',
          body: '예전 방식으로 돌아가기보다 지금의 조건에 맞는 일의 순서를 다시 세워보세요.',
        },
        'work.energy.sustainable': {
          title: '꾸준함을 더 큰 결과로 연결할 기반이 있어요',
          body: '속도를 높이기보다 잘 작동하는 리듬을 반복 가능한 구조로 만드는 일이 중요해요.',
        },
      },
    },
    choice: {
      label: '선택',
      glyph: '◇',
      insights: {
        'choice.stage.comparing': {
          title: '정보는 충분해지고 있지만 기준이 더 필요해요',
          body: '선택지를 더 모으기보다 무엇을 가장 지키고 싶은지 한 줄로 정해보세요.',
        },
        'choice.stage.hesitating': {
          title: '결정 자체보다 결정 뒤의 책임을 생각하고 있어요',
          body: '두려움이 사라질 때까지 기다리기보다 감당 가능한 첫 단계부터 정하는 편이 좋아요.',
        },
        'choice.stage.second_guessing': {
          title: '이미 내린 판단을 계속 다시 확인하고 있어요',
          body: '새로운 근거가 생긴 것인지, 불안이 같은 질문을 반복하는 것인지 구분해 볼 때예요.',
        },
        'choice.stage.waiting': {
          title: '기다림이 준비인지 미룸인지 확인해야 해요',
          body: '무엇이 채워지면 움직일지 구체적으로 정하면 기다림도 선택이 될 수 있어요.',
        },
      },
    },
  },
  bridges: {
    'report.path.inner': {
      eyebrow: 'NEXT: INNER COMPASS',
      title: '다음 질문은 내면의 목소리를 더 선명하게 가려낼 거예요',
      body: '내 기준과 불안의 목소리가 어디서 갈리는지 살펴본 뒤 최종 카드의 방향을 정해요.',
      cta: '맞춤 질문 이어가기',
    },
    'report.path.reality': {
      eyebrow: 'NEXT: REAL CONDITIONS',
      title: '다음 질문은 현실 조건과 쓸 수 있는 자원을 더 살펴볼 거예요',
      body: '마음만으로 밀어붙이지 않고 실제로 움직일 수 있는 크기와 순서를 찾아요.',
      cta: '맞춤 질문 이어가기',
    },
    'report.path.relationship': {
      eyebrow: 'NEXT: RELATIONSHIP',
      title: '다음 질문은 나와 타인의 경계에서 생기는 망설임을 더 살펴볼 거예요',
      body: '관계를 지키면서도 내 마음을 잃지 않는 표현과 선택의 방식을 찾아요.',
      cta: '맞춤 질문 이어가기',
    },
    'report.path.timing': {
      eyebrow: 'NEXT: TIMING',
      title: '다음 질문은 기다릴 때와 움직일 때의 신호를 더 살펴볼 거예요',
      body: '막연한 때를 기다리지 않고 지금 확인할 수 있는 준비 신호를 찾아요.',
      cta: '맞춤 질문 이어가기',
    },
  },
}

function emptyCopy(): MilestoneCopy {
  const empty = ''
  const insights = (keys: readonly string[]) =>
    Object.fromEntries(keys.map((key) => [key, { title: empty, body: empty }]))
  const bridge = { eyebrow: empty, title: empty, body: empty, cta: empty }

  return {
    eyebrow: empty,
    title: empty,
    body: empty,
    themes: {
      self: { label: empty, glyph: empty, insights: insights(SELF_STATE_KEYS) },
      love: { label: empty, glyph: empty, insights: insights(LOVE_CONTEXT_KEYS) },
      work: { label: empty, glyph: empty, insights: insights(WORK_ENERGY_KEYS) },
      choice: { label: empty, glyph: empty, insights: insights(CHOICE_STAGE_KEYS) },
    },
    bridges: {
      'report.path.inner': bridge,
      'report.path.reality': bridge,
      'report.path.relationship': bridge,
      'report.path.timing': bridge,
    },
  }
}

const COPY = {
  ko: KO_COPY,
  en: emptyCopy(),
  ja: emptyCopy(),
  zh: emptyCopy(),
} satisfies Record<Locale, MilestoneCopy>

export function buildGuardianCoreMilestone(
  locale: Locale,
  signals: GuardianQuestionnaireSignalSnapshot,
): GuardianQuestionnaireMilestoneView {
  const copy = COPY[locale]
  const themes = [
    theme('self', SELF_STATE_KEYS, copy, signals),
    theme('love', LOVE_CONTEXT_KEYS, copy, signals),
    theme('work', WORK_ENERGY_KEYS, copy, signals),
    theme('choice', CHOICE_STAGE_KEYS, copy, signals),
  ]
  const bridgeKey = strongestSignal(REPORT_PATH_KEYS, signals)

  return {
    id: GUARDIAN_CORE_MILESTONE_ID,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    themes,
    bridge: copy.bridges[bridgeKey],
  }
}

function theme(
  slot: GuardianReportSlot,
  keys: readonly string[],
  copy: MilestoneCopy,
  signals: GuardianQuestionnaireSignalSnapshot,
): GuardianQuestionnaireMilestoneView['themes'][number] {
  const themeCopy = copy.themes[slot]
  const insight = themeCopy.insights[strongestSignal(keys, signals)]
  if (!insight) {
    throw new Error(`Guardian milestone copy is incomplete for ${slot}`)
  }
  return { slot, label: themeCopy.label, glyph: themeCopy.glyph, ...insight }
}

function strongestSignal<Key extends string>(keys: readonly Key[], signals: GuardianQuestionnaireSignalSnapshot): Key {
  let strongest = keys[0]
  if (!strongest) {
    throw new Error('Guardian milestone signal group is empty')
  }
  for (const key of keys.slice(1)) {
    if ((signals[key] ?? 0) > (signals[strongest] ?? 0)) {
      strongest = key
    }
  }
  return strongest
}
