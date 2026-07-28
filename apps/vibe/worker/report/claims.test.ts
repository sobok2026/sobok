import { describe, expect, test } from 'bun:test'

import {
  assertClaims,
  CLAIMABLE_EVIDENCE_IDS,
  ClaimBoundaryError,
  checkClaims,
  EVIDENCE_CLAIM_BOUNDARY,
  EVIDENCE_RESULT_IDS,
  INTERPRETATION_BOUNDARY,
  SECTION_CLAIMS,
} from './claims'
import { REPORT_SECTION_KEYS } from './section-keys'

describe('evidence claim boundary', () => {
  test('carries all nine results from the evidence matrix', () => {
    expect(EVIDENCE_RESULT_IDS).toHaveLength(9)
    expect(Object.keys(EVIDENCE_CLAIM_BOUNDARY).sort()).toEqual([...EVIDENCE_RESULT_IDS].sort())
  })

  test('every result carries both halves of its boundary', () => {
    for (const id of EVIDENCE_RESULT_IDS) {
      expect(EVIDENCE_CLAIM_BOUNDARY[id].allowed.length).toBeGreaterThan(0)
      expect(EVIDENCE_CLAIM_BOUNDARY[id].forbidden.length).toBeGreaterThan(0)
    }
  })

  test('rarity_and_percentile is withdrawn and unclaimable', () => {
    expect(EVIDENCE_CLAIM_BOUNDARY.rarity_and_percentile.status).toBe('withdrawn')
    expect(CLAIMABLE_EVIDENCE_IDS as readonly string[]).not.toContain('rarity_and_percentile')
  })

  // D13 left nothing that measures the four letters, so the quick screen has no result to make a claim about.
  test('persona_quick_screen is withdrawn with the measured persona', () => {
    expect(EVIDENCE_CLAIM_BOUNDARY.persona_quick_screen.status).toBe('withdrawn')
    expect(CLAIMABLE_EVIDENCE_IDS as readonly string[]).not.toContain('persona_quick_screen')
  })
})

describe('section claim declarations', () => {
  test('every section declares its evidence and nothing extra declares any', () => {
    expect(Object.keys(SECTION_CLAIMS).sort()).toEqual([...REPORT_SECTION_KEYS].sort())
  })

  test('every section rests on at least one live claim', () => {
    for (const key of REPORT_SECTION_KEYS) {
      expect(SECTION_CLAIMS[key].length).toBeGreaterThan(0)
    }
  })

  // The type system already forbids this — `ClaimableEvidenceId` excludes the withdrawn ids — so this is the
  // runtime mirror that survives a stray `as` cast in a future edit.
  test('no section declares a withdrawn result', () => {
    const withdrawn = EVIDENCE_RESULT_IDS.filter((id) => EVIDENCE_CLAIM_BOUNDARY[id].status === 'withdrawn')
    expect(withdrawn.length).toBeGreaterThan(0)

    for (const key of REPORT_SECTION_KEYS) {
      for (const claim of SECTION_CLAIMS[key] as readonly string[]) {
        expect(withdrawn as readonly string[]).not.toContain(claim)
      }
    }
  })
})

describe('checkClaims', () => {
  test('accepts what the section declared', () => {
    expect(checkClaims('worldJob', SECTION_CLAIMS.worldJob)).toEqual([])
  })

  test('rejects a percentile claim as withdrawn, whatever the section', () => {
    const [violation] = checkClaims('strengthCards', ['rarity_and_percentile'])
    expect(violation?.kind).toBe('withdrawn')
    expect(violation?.claim).toBe('rarity_and_percentile')
  })

  // Live evidence the section did not declare is a different failure from evidence that no longer exists, and
  // the narration gate treats them differently: one is a mis-scoped section, the other is a retracted claim.
  test('separates undeclared live evidence from unknown ids', () => {
    expect(checkClaims('reflectionQuestions', ['world_role_card'])[0]?.kind).toBe('undeclared')
    expect(checkClaims('reflectionQuestions', ['made_up_id'])[0]?.kind).toBe('unknown')
  })

  test('reports every violation rather than the first', () => {
    expect(checkClaims('drainSignature', ['rarity_and_percentile', 'made_up_id', 'llm_report'])).toHaveLength(3)
  })
})

describe('assertClaims', () => {
  test('passes a declared set', () => {
    expect(() => assertClaims('weekQuest', ['life_work_profile'])).not.toThrow()
  })

  test('throws with the violations attached', () => {
    try {
      assertClaims('weekQuest', ['rarity_and_percentile'])
      throw new Error('assertClaims did not throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ClaimBoundaryError)
      expect((error as ClaimBoundaryError).violations).toHaveLength(1)
    }
  })
})

describe('interpretation boundary', () => {
  // §4.3: the sentence outlives the percentile block it used to sit beside.
  test('is carried verbatim', () => {
    expect(INTERPRETATION_BOUNDARY).toBe(
      '자료는 문항 설계와 해석 범위를 다듬는 근거예요. DeepType 자체의 신뢰도, 타당도, 인구 규준을 검증한 결과는 아니에요.',
    )
  })
})
