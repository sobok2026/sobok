import type { ReportSectionKey } from './section-keys'

// The claim boundary the instrument was documented against — `results` in
// research/13_item_result_evidence_matrix.json (scoringVersion 60), carried here verbatim so the boundary
// travels with the code that has to honour it. Server-only: the free bundle renders results, it does not
// audit them, and shipping this table would put the paid report's justification in the browser.
//
// The strings are provenance, not copy. `mind_axis_and_gem` still says 보석 and `inner_axis_profile` still
// frames Inner as the low-pressure scene; both predate the career pivot. They are not edited here because an
// edited boundary is no longer the boundary the research file recorded. Rendered copy is authored elsewhere.

export const EVIDENCE_RESULT_IDS = [
  'persona_quick_screen',
  'inner_axis_profile',
  'persona_inner_gap',
  'mind_axis_and_gem',
  'ability_card_ranking',
  'rarity_and_percentile',
  'life_work_profile',
  'world_role_card',
  'llm_report',
] as const

export type EvidenceResultId = (typeof EVIDENCE_RESULT_IDS)[number]

export type EvidenceClaimBoundary =
  | { allowed: string; forbidden: string; status: 'claimable' }
  | { allowed: string; forbidden: string; status: 'withdrawn'; withdrawnBecause: string }

export const EVIDENCE_CLAIM_BOUNDARY = {
  // D13 retired the measured persona: the four letters are offered by the respondent and nothing scores them,
  // so there is no screen left to make this claim about.
  persona_quick_screen: {
    allowed: 'Persona를 모를 때 현재 응답에서 어느 쪽 신호가 더 많이 나왔는지 보여줘요.',
    forbidden: '한 사람의 고정된 성격이나 임상 상태를 확정하지 않아요.',
    status: 'withdrawn',
    withdrawnBecause: 'D13 removed the measured persona; the declaration is offered, never scored.',
  },
  inner_axis_profile: {
    allowed: '혼자 있거나 부담이 적은 장면에서 선택한 경향을 Inner로 설명해요.',
    forbidden: 'Inner를 숨겨진 진짜 자아나 과학적으로 확정된 유형으로 부르지 않아요.',
    status: 'claimable',
  },
  persona_inner_gap: {
    allowed: '두 결과가 다를 때 반복될 가능성이 있는 행동 차이를 제안해요.',
    forbidden: '사용자가 선택한 Persona를 실제 행동으로 관찰했다고 말하지 않아요.',
    status: 'claimable',
  },
  mind_axis_and_gem: {
    allowed: '네 축의 합산 결과와 DeepType 내부 코드를 기억하기 쉬운 보석 이름으로 보여줘요.',
    forbidden: '보석 이름 자체를 학술 분류나 진단 척도라고 말하지 않아요.',
    status: 'claimable',
  },
  ability_card_ranking: {
    allowed: '응답에서 상대적으로 두드러진 힘과 잘 쓰이는 장면을 보여줘요.',
    forbidden: '실제 업무 능력, 성과, 자격을 검증했다고 말하지 않아요.',
    status: 'claimable',
  },
  // The one entry that must never become claimable. Its allowed clause is a percentile claim resting on a
  // simulation table whose chi-square lands at p ~ 0.71 — the distribution it compares against carries no
  // information. `ClaimableEvidenceId` is derived from this `status`, so flipping it is the only way to make a
  // percentile expressible, and that edit cannot happen by accident in a section table.
  rarity_and_percentile: {
    allowed: 'DeepType 응답 시뮬레이션 기준 상위 구간이라고 표시해요.',
    forbidden: '한국인 또는 전체 인구의 실제 비율이나 실측 규준으로 표현하지 않아요.',
    status: 'withdrawn',
    withdrawnBecause: 'Simulation tables carry no information (chi-square p ~ 0.71); percentiles are retired.',
  },
  life_work_profile: {
    allowed: '덜 지치는 조건과 반복해서 확인해볼 행동 가설을 제안해요.',
    forbidden: '직업 적성 진단, 채용 판단, 치료 또는 투자 조언으로 쓰지 않아요.',
    status: 'claimable',
  },
  world_role_card: {
    allowed: '잘 쓰는 방식과 어울리는 장면을 재미있는 결과 카드로 보여줘요.',
    forbidden: '현실 직업을 정답처럼 지시하거나 학술 직업 분류라고 말하지 않아요.',
    status: 'claimable',
  },
  llm_report: {
    allowed: '응답 결과에서 확인 가능한 범위와 확인해볼 질문을 함께 제시해요.',
    forbidden: '사용자가 고르지 않은 행동을 지어내거나 원문 문항 답변이 외부로 전송된다고 암시하지 않아요.',
    status: 'claimable',
  },
} as const satisfies Record<EvidenceResultId, EvidenceClaimBoundary>

/**
 * Everything the matrix still stands behind. Derived from `status` rather than written out, so a section table
 * cannot name a withdrawn result: `rarity_and_percentile` is not a member of this type, and declaring it is a
 * compile error at the declaration site rather than a lint somewhere downstream.
 */
export type ClaimableEvidenceId = {
  [Id in EvidenceResultId]: (typeof EVIDENCE_CLAIM_BOUNDARY)[Id]['status'] extends 'claimable' ? Id : never
}[EvidenceResultId]

export type WithdrawnEvidenceId = Exclude<EvidenceResultId, ClaimableEvidenceId>

export const CLAIMABLE_EVIDENCE_IDS = EVIDENCE_RESULT_IDS.filter(
  (id): id is ClaimableEvidenceId => EVIDENCE_CLAIM_BOUNDARY[id].status === 'claimable',
)

/**
 * What each v2 section is allowed to rest on. Exhaustive over the vocabulary by construction, so a new section
 * key does not compile until someone decides what evidence it stands on — which is the moment to notice that
 * the honest answer is "none".
 */
export const SECTION_CLAIMS = {
  worldJob: ['inner_axis_profile', 'mind_axis_and_gem', 'world_role_card'],
  strengthCards: ['inner_axis_profile', 'mind_axis_and_gem', 'ability_card_ranking'],
  drainSignature: ['life_work_profile'],
  happinessConditions: ['life_work_profile'],
  interestProfile: ['life_work_profile'],
  roleFamilies: ['life_work_profile', 'world_role_card'],
  weekQuest: ['life_work_profile', 'ability_card_ranking'],
  contextShift: ['persona_inner_gap', 'inner_axis_profile'],
  threePaths: ['life_work_profile', 'world_role_card'],
  fitAndFriction: ['life_work_profile', 'mind_axis_and_gem'],
  openingRead: ['llm_report', 'inner_axis_profile', 'mind_axis_and_gem'],
  reflectionQuestions: ['llm_report'],
} as const satisfies Record<ReportSectionKey, readonly ClaimableEvidenceId[]>

/**
 * §4.3 requires this sentence to survive the removal of the percentile block: it is what the percentile used to
 * stand in for. Verbatim `interpretationBoundary` from the same research file.
 */
export const INTERPRETATION_BOUNDARY =
  '자료는 문항 설계와 해석 범위를 다듬는 근거예요. DeepType 자체의 신뢰도, 타당도, 인구 규준을 검증한 결과는 아니에요.'

/** The matrix's own privacy clause on `llm_report`. `ReportProfile` is the type-level form of this sentence. */
export const LLM_EVIDENCE_PRIVACY_BOUNDARY =
  '문항별 로컬 근거는 동의 설계가 끝나기 전까지 브라우저 밖으로 보내지 않아요.'

export type ClaimViolation =
  | { claim: string; kind: 'undeclared'; section: ReportSectionKey }
  | { claim: string; kind: 'withdrawn'; section: ReportSectionKey; withdrawnBecause: string }
  | { claim: string; kind: 'unknown'; section: ReportSectionKey }

/**
 * Total: returns what is wrong instead of throwing, because the narration gate drops offending sections and
 * keeps the engine body. The engine itself never reaches a violation — its claims are the table above.
 */
export function checkClaims(section: ReportSectionKey, claims: readonly string[]): readonly ClaimViolation[] {
  const declared = new Set<string>(SECTION_CLAIMS[section])
  const violations: ClaimViolation[] = []

  for (const claim of claims) {
    if (declared.has(claim)) {
      continue
    }
    if (!(EVIDENCE_RESULT_IDS as readonly string[]).includes(claim)) {
      violations.push({ claim, kind: 'unknown', section })
      continue
    }
    const boundary = EVIDENCE_CLAIM_BOUNDARY[claim as EvidenceResultId]
    if (boundary.status === 'withdrawn') {
      violations.push({ claim, kind: 'withdrawn', section, withdrawnBecause: boundary.withdrawnBecause })
      continue
    }
    violations.push({ claim, kind: 'undeclared', section })
  }

  return violations
}

export class ClaimBoundaryError extends Error {
  readonly violations: readonly ClaimViolation[]

  constructor(violations: readonly ClaimViolation[]) {
    super(
      `report section claims out of bounds: ${violations.map((v) => `${v.section}/${v.claim} (${v.kind})`).join(', ')}`,
    )
    this.violations = violations
  }
}

/**
 * Narrowing form for call sites that treat a boundary breach as a defect rather than as degraded output — the
 * engine's own tests, and anything that assembles a section from a claim list it built itself.
 */
export function assertClaims(
  section: ReportSectionKey,
  claims: readonly string[],
): asserts claims is readonly ClaimableEvidenceId[] {
  const violations = checkClaims(section, claims)
  if (violations.length > 0) {
    throw new ClaimBoundaryError(violations)
  }
}

type SectionsClaimingNothing = {
  [Key in ReportSectionKey]: (typeof SECTION_CLAIMS)[Key]['length'] extends 0 ? Key : never
}[ReportSectionKey]

/**
 * A section resting on no evidence is a section that should not ship. Checked at compile time rather than at
 * run time: the declarations above are literal tuples, so their lengths are known and a runtime loop over them
 * is unreachable code pretending to be a guard.
 */
export type EverySectionClaimsSomething = [SectionsClaimingNothing] extends [never] ? true : never
