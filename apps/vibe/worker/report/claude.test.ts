import { describe, expect, test } from 'bun:test'
import { SECTION_CLAIMS } from './claims'
import { acceptNarrative, requestedNarrativeKeys } from './claude'
import {
  NARRATED_SECTION_KEYS,
  type NarratedSectionKey,
  REPORT_SECTION_CONTRACT,
  type ReportSection,
  type StoredReportSection,
} from './section-keys'

// The narration pass is exercised through its pure half. `generateNarrative` adds one fetch and one retry on
// top of `acceptNarrative`, and every rule §4.3 states about partial acceptance and the claim gate lives here.

function engineSection(key: string): StoredReportSection {
  return { body: `${key} 본문`, key: key as StoredReportSection['key'], title: key }
}

const ENGINE_WRITTEN = ['worldJob', 'strengthCards', 'contextShift', 'threePaths', 'fitAndFriction'].map(engineSection)

function narrated(key: NarratedSectionKey, overrides: Record<string, unknown> = {}) {
  return {
    key,
    title: `${key} 제목`,
    body: `${key} 서술이에요. 답에서 확인된 범위만 적어요. 더 살펴볼 질문도 함께 둬요.`,
    claims: [...SECTION_CLAIMS[key]],
    ...overrides,
  }
}

function accept(sections: readonly unknown[], requested: readonly NarratedSectionKey[]) {
  const accepted = new Map<NarratedSectionKey, ReportSection>()
  const dropped = acceptNarrative(JSON.stringify({ sections }), requested, accepted)
  return { accepted, dropped }
}

describe('requestedNarrativeKeys', () => {
  test('a HYBRID section is narrated only where the engine wrote one', () => {
    const keys = requestedNarrativeKeys(ENGINE_WRITTEN)
    expect(keys).toContain('contextShift')

    const withoutContextShift = requestedNarrativeKeys(
      ENGINE_WRITTEN.filter((section) => section.key !== 'contextShift'),
    )
    expect(withoutContextShift).not.toContain('contextShift')
    // LLM-only sections have no engine body by definition, so their absence proves nothing about them.
    expect(withoutContextShift).toContain('openingRead')
    expect(withoutContextShift).toContain('reflectionQuestions')
  })

  test('nothing outside the narrated vocabulary is ever requested', () => {
    for (const key of requestedNarrativeKeys(ENGINE_WRITTEN)) {
      expect(REPORT_SECTION_CONTRACT[key].generator).not.toBe('ENGINE')
    }
    expect(requestedNarrativeKeys(ENGINE_WRITTEN).length).toBeLessThanOrEqual(NARRATED_SECTION_KEYS.length)
  })
})

describe('partial acceptance', () => {
  test('a response missing most sections keeps the ones it did send', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { accepted, dropped } = accept([narrated('openingRead')], requested)

    expect([...accepted.keys()]).toEqual(['openingRead'])
    expect(dropped).toEqual([])
  })

  test('a regeneration merges into the first pass instead of replacing it', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const accepted = new Map<NarratedSectionKey, ReportSection>()

    acceptNarrative(JSON.stringify({ sections: [narrated('openingRead')] }), requested, accepted)
    const missing = requested.filter((key) => !accepted.has(key))
    acceptNarrative(JSON.stringify({ sections: [narrated('reflectionQuestions')] }), missing, accepted)

    expect([...accepted.keys()].sort()).toEqual(['openingRead', 'reflectionQuestions'])
  })

  test('a second copy of an accepted section is dropped, not swapped in', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const first = narrated('openingRead')
    const { accepted, dropped } = accept([first, narrated('openingRead', { body: '나중에 온 본문' })], requested)

    expect(accepted.get('openingRead')?.body).toBe(first.body)
    expect(dropped).toEqual([{ key: 'openingRead', reason: 'duplicate' }])
  })

  test('garbage in place of JSON accepts nothing and throws nothing', () => {
    const accepted = new Map<NarratedSectionKey, ReportSection>()
    expect(acceptNarrative('sorry, no', requestedNarrativeKeys(ENGINE_WRITTEN), accepted)).toEqual([])
    expect(acceptNarrative('{ not json', requestedNarrativeKeys(ENGINE_WRITTEN), accepted)).toEqual([])
    expect(accepted.size).toBe(0)
  })
})

describe('the claim gate', () => {
  test('a withdrawn claim drops that section only', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { accepted, dropped } = accept(
      [narrated('openingRead', { claims: ['rarity_and_percentile'] }), narrated('reflectionQuestions')],
      requested,
    )

    expect(dropped).toEqual([{ key: 'openingRead', reason: 'claims' }])
    expect([...accepted.keys()]).toEqual(['reflectionQuestions'])
  })

  test('evidence that is claimable elsewhere is still a violation in the wrong section', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { accepted, dropped } = accept([narrated('reflectionQuestions', { claims: ['world_role_card'] })], requested)

    expect(dropped).toEqual([{ key: 'reflectionQuestions', reason: 'claims' }])
    expect(accepted.size).toBe(0)
  })

  test('an evidence id the matrix does not know is dropped', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { dropped } = accept([narrated('openingRead', { claims: ['made_up_evidence'] })], requested)
    expect(dropped).toEqual([{ key: 'openingRead', reason: 'claims' }])
  })

  // The gate reports violations among the ids a section declares, so declaring none clears it. Without this
  // the cheapest way past the whole claim system is to omit the field, and the schema's `minItems: 1` is a
  // request the wire can ignore — a hand-rolled or degraded response still has to be refused here.
  test('a section that declares nothing at all is dropped', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)

    expect(accept([narrated('openingRead', { claims: [] })], requested).dropped).toEqual([
      { key: 'openingRead', reason: 'claims' },
    ])
    expect(accept([narrated('openingRead', { claims: undefined })], requested).dropped).toEqual([
      { key: 'openingRead', reason: 'claims' },
    ])
  })
})

describe('shape checks', () => {
  test('an unrequested key is dropped', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN.filter((section) => section.key !== 'contextShift'))
    const { accepted, dropped } = accept(
      [narrated('contextShift'), { key: 'worldJob', title: 'x', body: 'y' }],
      requested,
    )

    expect(dropped).toEqual([
      { key: 'contextShift', reason: 'unrequested' },
      { key: 'worldJob', reason: 'unrequested' },
    ])
    expect(accepted.size).toBe(0)
  })

  test('a blank body or title is dropped', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { dropped } = accept(
      [narrated('openingRead', { body: '   ' }), narrated('reflectionQuestions', { title: '' })],
      requested,
    )
    expect(dropped).toEqual([
      { key: 'openingRead', reason: 'empty' },
      { key: 'reflectionQuestions', reason: 'empty' },
    ])
  })

  test('em dashes are replaced and long bodies are clamped', () => {
    const requested = requestedNarrativeKeys(ENGINE_WRITTEN)
    const { accepted } = accept([narrated('openingRead', { body: `앞—뒤${'가'.repeat(2000)}` })], requested)
    const body = accepted.get('openingRead')?.body ?? ''

    expect(body).not.toContain('—')
    expect(body.length).toBe(1200)
  })
})
