import type { ReportSectionKey } from '../../worker/report/section-keys'
import type { TypeAxisId } from '../model'

// Paid content. Every heading and every under-heading line of the paid report.
//
// The key union is imported rather than restated. `section-keys.ts` is dependency-free for exactly this kind
// of import and the type is erased at compile time, so this costs nothing at runtime and buys the one property
// that matters: a new section key does not compile until it has a title and an intro, which is the moment
// someone has to decide what the section is called rather than discovering later that it shipped untitled.

export const SECTION_TITLES_KO = {
  worldJob: '세계관 직업',
  strengthCards: '강점 카드',
  drainSignature: '지치는 조건',
  happinessConditions: '오래 일하게 하는 조건',
  interestProfile: '끌리는 일의 결',
  roleFamilies: '살펴볼 만한 역할군',
  weekQuest: '7일 퀘스트',
  contextShift: '고른 네 글자와 이번 답',
  threePaths: '세 갈래 경로',
  fitAndFriction: '맞물리는 지점과 부딪히는 지점',
  openingRead: '먼저 읽는 자리',
  reflectionQuestions: '들고 갈 세 가지 질문',
} as const satisfies Record<ReportSectionKey, string>

/**
 * One line under each heading, saying what the section is for before the reader meets its contents. Authored
 * per section and identical for every reader — a per-reader intro would be a finding stated twice, once here
 * and once in the block below it.
 *
 * Several of these carry the section's own limit ('확인은 직접 해야 해요', '가리는 자리가 아니에요'). Those
 * sentences are load-bearing: they are where a section says what it is not, at the top rather than in a note
 * under the fold, and a shorter intro is not a reason to drop one.
 */
export const SECTION_INTROS_KO = {
  worldJob: '여덟 글자가 만나면 이름 하나가 나와요. 이름보다 그 아래의 방식과 힘을 읽어 주세요.',
  strengthCards: '힘을 덜 들여도 잘되는 쪽에 이름을 붙였어요. 순서는 없고 묶음만 있어요.',
  drainSignature: '무엇이 힘을 빼는지는 일의 양보다 조건에서 갈려요. 앞에 놓인 조건부터 봐요.',
  happinessConditions: '오래 하려면 잘하는 것만으로는 모자라요. 갖춰져 있어야 힘이 덜 빠지는 조건을 봐요.',
  interestProfile: '관심은 잘한다는 뜻이 아니에요. 손이 먼저 가는 쪽을 말해요.',
  roleFamilies: '직업 이름이 아니라 살펴볼 만한 방향이에요. 확인은 직접 해야 해요.',
  weekQuest: '읽고 끝나지 않도록 이번 주에 해 볼 일곱 가지를 놓았어요. 하루 30분을 넘지 않고 돈이 들지 않아요.',
  contextShift: '스스로 고른 네 글자와 이번 답의 네 글자를 나란히 놓았어요. 어느 쪽이 맞는지 가리는 자리가 아니에요.',
  threePaths: '지금 자리에서 넓히기와 옆으로 옮기기와 새로 시험하기를 같은 무게로 놓았어요.',
  fitAndFriction: '이번 답에서 읽은 조건이에요. 실제 자리와 맞춰 보는 건 직접 해야 해요.',
  openingRead: '이번 답에서 뚜렷하게 나온 것부터 읽었어요.',
  reflectionQuestions: '결과를 덮기 전에 세 가지만 들고 가요.',
} as const satisfies Record<ReportSectionKey, string>

/**
 * The self-declaration contrast, one line per type axis in each of its two readings.
 *
 * `matched` may not read as confirmation and `split` may not read as correction. D13 removed the measured
 * persona precisely so that neither of the two four-letter codes is evidence about the other: one is what the
 * reader says about themselves and the other is what they picked today. So `split` names a situation in which
 * the two could honestly differ, which is a reason to keep both rather than a verdict on either.
 */
export const SELF_REPORT_AXIS_NOTES = {
  EI: {
    matched: '스스로 아는 모습과 이번 답이 같은 쪽을 가리켰어요.',
    split:
      '스스로 아는 모습과 이번 답이 다른 쪽을 가리켰어요. 사람이 많은 자리와 적은 자리에서 다르게 나오기 쉬운 축이에요.',
  },
  SN: {
    matched: '무엇부터 보는지에 대해 두 답이 같았어요.',
    split: '무엇부터 보는지가 갈렸어요. 익숙한 일과 낯선 일에서 다르게 나오기 쉬운 축이에요.',
  },
  TF: {
    matched: '무엇을 먼저 따지는지에 대해 두 답이 같았어요.',
    split: '무엇을 먼저 따지는지가 갈렸어요. 일에서 쓰는 기준과 사람 사이에서 쓰는 기준이 다를 수 있어요.',
  },
  JP: {
    matched: '어떻게 움직이는지에 대해 두 답이 같았어요.',
    split: '어떻게 움직이는지가 갈렸어요. 내 일정을 잡을 때와 남의 일정에 맞출 때 다르게 나오기 쉬운 축이에요.',
  },
} as const satisfies Record<TypeAxisId, { matched: string; split: string }>

export const SELF_REPORT_CLOSING =
  '두 결과가 다르다고 한쪽이 틀린 건 아니에요. 고른 네 글자는 스스로 본 모습이고 이번 네 글자는 오늘 고른 답이에요.'

/**
 * Every remaining Korean string the paid report puts on screen: block headings, field labels, and the notes
 * that belong to a block rather than to the section.
 *
 * They live here rather than in the renderer for one reason. `copy-policy.test.ts` scans `KO_COPY_SOURCES`,
 * which is a list of content modules — a component is not on it and could not usefully be, since the gates
 * walk string literals and a React tree is full of class names. So the invariant is that a component holds no
 * Korean at all: every visible string arrives through the section's data, out of a module the gate reads.
 */
export const BLOCK_NOTES_KO = {
  bandMovementHeading: '문항을 더한 뒤의 선명도',
  evidenceSplitLabel: '양쪽 답이 섞인 축',
  noEvidenceSplit: '양쪽으로 갈린 축은 없었어요.',
  strengthDistinct: '뚜렷하게 나온 강점',
  strengthModerate: '한쪽으로 기운 강점',
  strengthComboPrefix: '조합 강점',
  // Reachable: |S3| lands on {1,3,5,7,9} and every axis can sit at 1, so a reader whose answers split evenly on
  // all eight axes gets no card. That is an empty set, not a failure — the section still ships.
  strengthEmpty: '이번 답은 여덟 축 모두 양쪽에 비슷하게 놓였어요. 그래서 강점 카드를 뽑지 않았어요.',
  drainFreeShown: '무료에서 본 조건',
  drainAdded: '새로 앞에 온 조건',
  drainDropped: '뒤로 물러난 조건',
  happinessNeeds: '답에서 함께 앞에 놓인 조건',
  happinessEnvironments: '일하는 자리 쪽에서 앞에 놓인 것',
  happinessMeaning: '이 조건이 갖춰진 자리에서 힘이 덜 빠져요. 조건이 빠진 자리에서는 같은 일도 더 무겁게 느껴져요.',
  interestInterests: '고른 답에서 앞에 놓인 관심',
  interestPurposes: '일이 의미 있게 느껴진 순간',
  interestMeaning: '관심은 잘한다는 뜻이 아니에요. 손이 먼저 가는 쪽을 말해요.',
  roleDailyWork: '자주 하는 업무',
  roleCheckPoints: '확인이 필요한 부분',
  roleWhyFit: '잘 맞을 가능성이 있는 이유',
  roleEnvironment: '필요한 자리',
  roleExperiment: '돈을 쓰기 전 해 볼 작은 실험',
  roleCarryOver: '가져갈 경험',
  roleExamples: '예시 직무',
  questMinutesLabel: '걸리는 시간',
  questMinutesUnit: '분',
  questQuestionLabel: '오늘의 질문',
  questDoneLabel: '끝난 기준',
  questDayUnit: '일차',
  pathGuardrailsHeading: '세 갈래에 함께 걸린 선',
  fitHeading: '맞물리는 지점',
  frictionHeading: '부딪히는 지점',
  fitConditionsHeading: '이 힘이 살아나는 자리',
  fitEvidenceLabel: '이번 답',
  fitBetterUseLabel: '더 잘 쓰는 방법',
  frictionCheckLabel: '확인할 질문',
  frictionAdjustLabel: '작은 조정',
  confidenceLabel: '신뢰 수준',
  selfReportDeclared: '고른 네 글자',
  selfReportMeasured: '이번 답의 네 글자',
} as const
