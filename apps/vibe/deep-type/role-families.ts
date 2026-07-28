import { type EnvironmentFacet, type InterestFacet, WORK_FACETS, type WorkFacetTally } from './model'

// Paid content. `deep-type/rules/free.ts` must never import this file — the CI rule in MIGRATION §4.2 lists it
// by name among the banned imports. It sits in `deep-type/` rather than `worker/` only because the paid rule
// engine and the 8 role-family SEO pages (Phase 8-A) are the two consumers and both need the same table.
//
// Seed: `09_현실직업_AI대화_DeepType.md` §6.2 (eight families, their one-line "주로 하는 일", their example
// roles) and §6.3 (the eight card fields, and the three-step confidence ladder that replaces fit percentages).
// The eight names and the `exampleRoles` triples are carried over verbatim; everything else here is new
// authoring and still needs a human pass — see the per-family mapping notes below.
//
// What this file must never grow: a percentile, a rarity, a frequency, a match rate. §6.3 rules those out and
// the underlying table was discarded for carrying no information. The confidence ladder is the whole vocabulary.

export const ROLE_FAMILY_IDS = [
  'ANALYSIS',
  'PLANNING',
  'COORDINATION',
  'PERSUASION',
  'CRAFT',
  'OPERATION',
  'SUPPORT',
  'EXPERIMENT',
] as const

export type RoleFamilyId = (typeof ROLE_FAMILY_IDS)[number]

/** §6.3: "신뢰 수준은 가짜 확률로 표시하지 않는다." Three rungs, no numbers, ever. */
export type ConfidenceLevel = 'sufficient' | 'needsCheck' | 'needsMoreInput'

export const CONFIDENCE_LABELS = {
  sufficient: '근거 충분',
  needsCheck: '확인 필요',
  needsMoreInput: '입력이 더 필요함',
} as const satisfies Record<ConfidenceLevel, string>

// D3: v1 collects no `careerContext`, so the '현재 경험에서 가져갈 수 있는 부분' field has no input at all. The
// literal type — not a default value — is what keeps a later renderer from upgrading it: assigning any other
// rung to `carryOver.confidence` is a type error, so the lock survives refactors that never read this comment.
export const ROLE_FAMILY_CARRY_OVER = {
  confidence: 'needsMoreInput',
  text: '지금 어떤 일을 하고 있는지는 묻지 않았어요. 그래서 가져갈 경험은 이 결과만으로 말할 수 없어요.',
} as const satisfies { confidence: Extract<ConfidenceLevel, 'needsMoreInput'>; text: string }

/** §6.2 closing line. Renders with every card that shows `exampleRoles`. */
export const EXAMPLE_ROLE_NOTICE = '예시 직무는 이름일 뿐이고 채용 가능성이나 자격을 보장하지 않아요.'

export type RoleFamily = {
  /** §6.3 '확인이 필요한 부분'. Questions the reader asks a real workplace, not claims about the reader. */
  checkPoints: readonly string[]
  /** §6.3 '자주 하는 업무'. */
  dailyWork: readonly string[]
  /** §6.3 '필요한 환경'. */
  environment: string
  /** §6.2 예시. Job titles only — the notice above always travels with them. */
  exampleRoles: readonly string[]
  /** §6.3 '돈을 쓰기 전 해볼 작은 실험'. Must fit inside a week and cost nothing. */
  experiment: string
  name: string
  /** §6.2 '주로 하는 일', one line. */
  summary: string
  /** §6.3 '잘 맞을 가능성이 있는 이유'. Points at the answers, never at a trait the reader was assigned. */
  whyFit: string
}

export const ROLE_FAMILIES = {
  // Receives 4 cells: ANALYZE × FOCUS_ENV·FREEDOM_ENV·CLEAR_ENV, ORDER × FOCUS_ENV. Cause-finding interest plus
  // any environment that buys uninterrupted checking time. CLEAR_ENV belongs here because quality checking is
  // the version of this work that has a stated finish line. ORDER × FOCUS_ENV lands here rather than in
  // OPERATION because alone-time turns standard-setting into verification.
  ANALYSIS: {
    checkPoints: [
      '결론이 늦어질 때 기다려 주는 팀인지 봐야 해요.',
      '원자료를 직접 열어볼 수 있는 자리인지 물어봐야 해요.',
    ],
    dailyWork: [
      '흩어진 자료를 한곳에 모아 같은 기준으로 정리해요.',
      '기록끼리 어긋나는 지점을 찾아 원인을 적어요.',
      '확인한 내용을 다음 선택에 쓸 수 있는 형태로 넘겨요.',
    ],
    environment: '중간에 끊기지 않는 확인 시간과 원자료를 볼 권한이 있어야 해요.',
    exampleRoles: ['리서치 지원', '데이터 운영', '품질 확인'],
    experiment: '이번 주에 쓰는 자료 하나를 골라 어긋난 항목을 찾고 한 장으로 정리해 봐요.',
    name: '탐색·분석',
    summary: '자료를 찾고 흩어진 내용에서 의미를 정리해요.',
    whyFit: '먼저 확인하고 근거를 갖춘 다음 움직이는 답이 이어졌어요.',
  },

  // Receives 5 cells: ANALYZE × TOGETHER_ENV·VISIBLE_ENV, LEAD × FOCUS_ENV, ORDER × FREEDOM_ENV·VARIETY_ENV.
  // The shared shape is a reading of the situation that has to become someone else's order of work. ANALYZE
  // moves here when the environment supplies an audience; LEAD moves here when it supplies solitude instead;
  // ORDER moves here when the sequence is the reader's to write.
  PLANNING: {
    checkPoints: [
      '정한 순서를 도중에 바꿀 수 있는 구조인지 봐야 해요.',
      '설계까지 맡는지 실행까지 맡는지 확인해야 해요.',
    ],
    dailyWork: [
      '목표를 단계로 쪼개고 순서와 담당을 정해요.',
      '빠진 준비물과 막힐 지점을 미리 적어 둬요.',
      '진행 상황을 한 장으로 정리해 나눠요.',
    ],
    environment: '결정 권한이 어디에 있는지 보이고 일정 변경을 미리 알 수 있어야 해요.',
    exampleRoles: ['서비스 기획 지원', '교육 기획', '프로젝트 운영'],
    experiment: '지금 하는 일 하나를 골라 시작부터 끝까지 순서를 적고 빠진 단계를 표시해 봐요.',
    name: '구조·기획',
    summary: '목표를 정하고 일이 지나갈 순서를 설계해요.',
    whyFit: '해야 할 일을 순서로 바꿔 놓을 때 힘이 붙는 답이 이어졌어요.',
  },

  // Receives 4 cells: HELP × TOGETHER_ENV·VARIETY_ENV, LEAD × TOGETHER_ENV, ORDER × TOGETHER_ENV. TOGETHER_ENV
  // is the strongest single pull in the table — reaching people directly is what separates connecting from
  // helping. HELP × VARIETY_ENV lands here instead of EXPERIMENT because a stream of new people and new
  // situations is still relationship work, and routing a caring answer into new-business scouting would be a
  // stretch the reader did not ask for.
  COORDINATION: {
    checkPoints: [
      '조율한 결과를 실제로 밀어붙일 권한이 있는지 봐야 해요.',
      '연락이 몰리는 시간대를 감당할 수 있는지 확인해야 해요.',
    ],
    dailyWork: [
      '서로 다른 팀의 요청을 정리해 순서를 맞춰요.',
      '오간 이야기를 기록으로 남겨 다음 사람이 찾게 해요.',
      '막힌 곳을 찾아 필요한 사람을 이어요.',
    ],
    environment: '이야기할 상대에게 바로 닿을 수 있고 결정 과정이 열려 있어야 해요.',
    exampleRoles: ['고객 성공', '파트너 운영', '커뮤니티 운영'],
    experiment: '요즘 자주 어긋나는 일 하나를 골라 관련된 사람을 한자리에 모으고 30분만 맞춰 봐요.',
    name: '관계·조율',
    summary: '사람과 정보를 이어 서로 다른 쪽이 같은 그림을 보게 해요.',
    whyFit: '사람 사이에서 정보가 막힐 때 먼저 움직이는 답이 이어졌어요.',
  },

  // Receives 4 cells: CREATE × TOGETHER_ENV·VISIBLE_ENV, HELP × VISIBLE_ENV, LEAD × VISIBLE_ENV. VISIBLE_ENV
  // is the second strong pull: wanting to see what the work did to someone turns making, helping and leading
  // into telling. HELP × VISIBLE_ENV is §6.2's own '교육 진행' example.
  PERSUASION: {
    checkPoints: ['전할 내용을 스스로 정할 수 있는지 봐야 해요.', '성과를 사람 수로만 보는 자리인지 확인해야 해요.'],
    dailyWork: [
      '어려운 자료를 짧은 말과 예시로 다시 써요.',
      '상대가 걸릴 지점을 미리 찾아 답을 준비해요.',
      '전한 뒤 반응을 모아 다음 설명을 고쳐요.',
    ],
    environment: '전할 상대가 분명하고 반응을 바로 볼 수 있어야 해요.',
    exampleRoles: ['콘텐츠 기획', '영업 지원', '교육 진행'],
    experiment: '요즘 알게 된 것 하나를 다섯 문장으로 줄여 한 사람에게 설명하고 어디서 막히는지 적어 봐요.',
    name: '설명·설득',
    summary: '복잡한 내용을 상대가 알아듣는 말로 바꿔 전해요.',
    whyFit: '알게 된 것을 다른 사람이 쓰게 만드는 쪽으로 답이 이어졌어요.',
  },

  // Receives 6 cells: MAKE × FOCUS_ENV·FREEDOM_ENV·VISIBLE_ENV, CREATE × FOCUS_ENV·FREEDOM_ENV·CLEAR_ENV. The
  // widest family, and deliberately so: MAKE and CREATE are the two interests whose output is an object, and
  // three of six environments leave that object in the reader's hands. CREATE × CLEAR_ENV is design operations
  // — a defined brief is still a made thing — while MAKE × CLEAR_ENV goes to OPERATION, where a defined brief
  // means a repeating one.
  CRAFT: {
    checkPoints: [
      '고칠 범위를 스스로 정할 수 있는지 봐야 해요.',
      '만든 뒤 반응이 돌아오는 데 걸리는 시간을 확인해야 해요.',
    ],
    dailyWork: [
      '필요한 것을 직접 만들어 내놓아요.',
      '쓰는 사람이 걸리는 부분을 찾아 고쳐요.',
      '고친 내용을 남겨 다음에 다시 쓰게 해요.',
    ],
    environment: '손댈 수 있는 대상이 있고 고친 결과를 확인할 수 있어야 해요.',
    exampleRoles: ['디자인 운영', '콘텐츠 제작', '제품 개선 지원'],
    experiment: '평소 불편했던 것 하나를 하루 안에 고칠 수 있는 크기로 줄여 만들어 봐요.',
    name: '제작·개선',
    summary: '결과물을 직접 만들고 쓰이는 모습을 보며 고쳐요.',
    whyFit: '말로 정리하기보다 만들어 놓고 고치는 쪽으로 답이 이어졌어요.',
  },

  // Receives 5 cells: MAKE × TOGETHER_ENV·CLEAR_ENV, LEAD × CLEAR_ENV, ORDER × CLEAR_ENV·VISIBLE_ENV.
  // CLEAR_ENV is the third strong pull — a stated finish line is what turns work into a cycle that has to land
  // the same way twice. MAKE × TOGETHER_ENV sits here because hands-on work shared with a standing team is
  // running something, not crafting alone.
  OPERATION: {
    checkPoints: [
      '갑작스러운 변경이 얼마나 자주 오는지 봐야 해요.',
      '절차를 직접 고칠 수 있는 권한이 있는지 확인해야 해요.',
    ],
    dailyWork: [
      '일정과 준비물을 챙겨 빠진 것을 미리 채워요.',
      '같은 일이 매번 같게 끝나도록 절차를 다듬어요.',
      '문제가 생긴 자리를 기록해 다음 회차에 반영해요.',
    ],
    environment: '해야 할 범위와 끝나는 기준이 미리 정해져 있어야 해요.',
    exampleRoles: ['사업 운영', '행사 운영', '물류·일정 관리'],
    experiment: '자주 하는 일 하나를 골라 순서를 적고 두 번 그대로 해 보며 어긋나는 곳을 표시해 봐요.',
    name: '실행·운영',
    summary: '반복되는 일이 같은 품질로 끝나게 만들어요.',
    whyFit: '정한 기준을 지키며 끝까지 가져가는 쪽으로 답이 이어졌어요.',
  },

  // Receives 3 cells: HELP × FOCUS_ENV·FREEDOM_ENV·CLEAR_ENV. The narrowest family, and that is honest — HELP
  // is the only interest whose object is a person, so nothing else routes in, and HELP leaves only when the
  // environment adds an audience (VISIBLE_ENV) or a stream of new counterparts (TOGETHER_ENV, VARIETY_ENV).
  SUPPORT: {
    checkPoints: [
      '감정을 많이 쓰는 자리라 쉬는 방식이 있는지 봐야 해요.',
      '한 사람이 맡는 인원이 어느 정도인지 확인해야 해요.',
    ],
    dailyWork: [
      '상대의 상황을 듣고 필요한 것을 정리해요.',
      '바로 도울 것과 넘길 것을 나눠요.',
      '도운 뒤에 어떻게 됐는지 확인해요.',
    ],
    environment: '한 사람에게 쓸 시간이 확보되고 도울 범위가 정해져 있어야 해요.',
    exampleRoles: ['교육 지원', '고객 지원', '조직 지원'],
    experiment: '주변에서 같은 곳에 막힌 사람을 한 명 찾아 30분 도와 보고 무엇이 실제로 필요했는지 적어 봐요.',
    name: '지원·돌봄',
    summary: '사람에게 지금 필요한 것을 살피고 이어서 도와요.',
    whyFit: '막힌 사람이 보이면 그 사람부터 살피는 답이 이어졌어요.',
  },

  // Receives 5 cells: MAKE·ANALYZE·CREATE·LEAD × VARIETY_ENV, plus LEAD × FREEDOM_ENV. VARIETY_ENV routes here
  // for every interest whose object is a thing or a plan, because meeting a new problem each time is what §6.2
  // calls 탐험·실험. It does not route here from HELP or ORDER: for those two the same environment reads as new
  // people and new rules to write, not as an untested bet. LEAD × FREEDOM_ENV joins because deciding both the
  // direction and the order of one's own work is where a first small venture starts.
  EXPERIMENT: {
    checkPoints: ['시험에 쓸 수 있는 시간과 비용이 정해져 있는지 봐야 해요.', '접는 결정을 누가 하는지 확인해야 해요.'],
    dailyWork: [
      '확인하고 싶은 것을 한 문장으로 적고 작게 시험해요.',
      '결과를 남겨 이어갈지 접을지 정해요.',
      '되는 것을 찾으면 다른 사람이 이어받게 정리해요.',
    ],
    environment: '접은 시도를 기록으로 받아 주고 작게 시작할 여지가 있어야 해요.',
    exampleRoles: ['신사업 지원', '캠페인 실험', '초기 프로젝트'],
    experiment: '궁금한 것 하나를 이번 주에 끝나는 크기로 줄여 해 보고 결과를 세 줄로 남겨 봐요.',
    name: '탐험·실험',
    summary: '아직 답이 없는 자리에서 작게 시험하고 다음을 정해요.',
    whyFit: '처음 해 보는 쪽을 고르고 해 보며 알아내는 답이 이어졌어요.',
  },
} as const satisfies Record<RoleFamilyId, RoleFamily>

// 36 cells = 6 interest facets × 6 environment facets, and the nested Record type is what makes an empty cell
// impossible to ship. MIGRATION §4.1 lists the section input as "interest top2 × environment top1" while its
// evidence column and §5.1 both say 36 cells; only 6×6 is 36 (an unordered interest pair keyed against one
// environment facet would be C(6,2)×6 = 90, an ordered pair 180). The two are reconciled by reading top2 as a
// second lookup into this same table, not as a second key dimension — which is also the only reading that
// survives the tally arithmetic, since an ordered interest pair would depend on a first-versus-second tie-break
// that carries no measurement meaning.
export const ROLE_FAMILY_BY_INTEREST_AND_ENVIRONMENT = {
  MAKE: {
    FOCUS_ENV: 'CRAFT',
    TOGETHER_ENV: 'OPERATION',
    FREEDOM_ENV: 'CRAFT',
    CLEAR_ENV: 'OPERATION',
    VARIETY_ENV: 'EXPERIMENT',
    VISIBLE_ENV: 'CRAFT',
  },
  ANALYZE: {
    FOCUS_ENV: 'ANALYSIS',
    TOGETHER_ENV: 'PLANNING',
    FREEDOM_ENV: 'ANALYSIS',
    CLEAR_ENV: 'ANALYSIS',
    VARIETY_ENV: 'EXPERIMENT',
    VISIBLE_ENV: 'PLANNING',
  },
  CREATE: {
    FOCUS_ENV: 'CRAFT',
    TOGETHER_ENV: 'PERSUASION',
    FREEDOM_ENV: 'CRAFT',
    CLEAR_ENV: 'CRAFT',
    VARIETY_ENV: 'EXPERIMENT',
    VISIBLE_ENV: 'PERSUASION',
  },
  HELP: {
    FOCUS_ENV: 'SUPPORT',
    TOGETHER_ENV: 'COORDINATION',
    FREEDOM_ENV: 'SUPPORT',
    CLEAR_ENV: 'SUPPORT',
    VARIETY_ENV: 'COORDINATION',
    VISIBLE_ENV: 'PERSUASION',
  },
  LEAD: {
    FOCUS_ENV: 'PLANNING',
    TOGETHER_ENV: 'COORDINATION',
    FREEDOM_ENV: 'EXPERIMENT',
    CLEAR_ENV: 'OPERATION',
    VARIETY_ENV: 'EXPERIMENT',
    VISIBLE_ENV: 'PERSUASION',
  },
  ORDER: {
    FOCUS_ENV: 'ANALYSIS',
    TOGETHER_ENV: 'COORDINATION',
    FREEDOM_ENV: 'PLANNING',
    CLEAR_ENV: 'OPERATION',
    VARIETY_ENV: 'PLANNING',
    VISIBLE_ENV: 'OPERATION',
  },
} as const satisfies Record<InterestFacet, Record<EnvironmentFacet, RoleFamilyId>>

export type RoleFamilyPlacement = 'leading' | 'secondary'

export type RoleFamilyPick = {
  carryOver: typeof ROLE_FAMILY_CARRY_OVER
  confidence: ConfidenceLevel
  environmentFacet: EnvironmentFacet
  familyId: RoleFamilyId
  interestFacet: InterestFacet
  placement: RoleFamilyPlacement
}

/**
 * Total function: every count vector yields at least one pick, so the section never needs a null branch.
 * Comparing counts inside `interest` is legitimate in a way that comparing `|lean|` across axes is not — the
 * six facets share one forced-choice dimension and each is offered exactly four times, so the picks are on one
 * scale by construction. The comparison still says nothing about other people, which is why nothing downstream
 * of this function may render a share.
 */
export function resolveRoleFamilies(
  interest: WorkFacetTally<InterestFacet>,
  environment: WorkFacetTally<EnvironmentFacet>,
): readonly RoleFamilyPick[] {
  const ranked = orderByCount(WORK_FACETS.interest, interest.counts)
  const anchor = orderByCount(WORK_FACETS.environment, environment.counts)[0] ?? WORK_FACETS.environment[0]
  const leadingFacet = ranked[0] ?? WORK_FACETS.interest[0]
  const secondaryFacet = ranked[1] ?? WORK_FACETS.interest[1]

  // Each card is judged by the gap that put it there: the leader against the runner-up, the runner-up against
  // whatever came third. Reading `interest.separation` for both would hand the second card the first's evidence.
  const countAt = (facet: InterestFacet | undefined) => (facet === undefined ? 0 : interest.counts[facet])
  const leadingGap = countAt(leadingFacet) - countAt(secondaryFacet)
  const secondaryGap = countAt(secondaryFacet) - countAt(ranked[2])

  const leading = buildPick(leadingFacet, anchor, 'leading', leadingGap, environment.separation)
  const secondary = buildPick(secondaryFacet, anchor, 'secondary', secondaryGap, environment.separation)

  // Two interest facets can share a cell target. Showing the same family twice would read as a doubled claim.
  return leading.familyId === secondary.familyId ? [leading] : [leading, secondary]
}

function buildPick(
  interestFacet: InterestFacet,
  environmentFacet: EnvironmentFacet,
  placement: RoleFamilyPlacement,
  interestSeparation: number,
  environmentSeparation: number,
): RoleFamilyPick {
  return {
    carryOver: ROLE_FAMILY_CARRY_OVER,
    confidence: resolveConfidence(interestSeparation, environmentSeparation, placement),
    environmentFacet,
    familyId: ROLE_FAMILY_BY_INTEREST_AND_ENVIRONMENT[interestFacet][environmentFacet],
    interestFacet,
    placement,
  }
}

/**
 * The ladder reads the two gaps that produced the cell, and nothing else.
 *
 * Interest spends six picks over six facets at four exposures each, so its gap runs 0 to 3 — a leader capped at
 * four leaves two picks that cannot all land on one runner-up. A gap of two is the point where one different
 * pick can no longer reverse the order, which is why it is the bar for the top rung. Environment spends three
 * picks at two exposures, so its count vector is only ever (2,1) or (1,1,1) and its gap is only ever 1 or 0 —
 * there is no middle rung to give it.
 *
 * `근거 충분` therefore needs a stable interest leader and an environment that actually chose. A secondary card
 * cannot reach it at all: it is the runner-up reading of the same six picks, so calling it well-evidenced
 * would double-count them.
 */
function resolveConfidence(
  interestSeparation: number,
  environmentSeparation: number,
  placement: RoleFamilyPlacement,
): ConfidenceLevel {
  if (interestSeparation <= 0) {
    return 'needsMoreInput'
  }
  if (environmentSeparation <= 0) {
    return placement === 'leading' && interestSeparation >= 2 ? 'needsCheck' : 'needsMoreInput'
  }
  if (placement === 'secondary') {
    return 'needsCheck'
  }
  return interestSeparation >= 2 ? 'sufficient' : 'needsCheck'
}

// Stable sort, so equal counts keep WORK_FACETS order. That order is an authoring sequence and carries no
// meaning — it is here to make ties resolve the same way twice, not to rank anything.
function orderByCount<Facet extends string>(
  facets: readonly Facet[],
  counts: Readonly<Record<Facet, number>>,
): readonly Facet[] {
  return [...facets].sort((a, b) => counts[b] - counts[a])
}
