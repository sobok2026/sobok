import { describe, expect, test } from 'bun:test'
import { SECTION_CLAIMS } from './claims'
import { acceptNarrative, requestedNarrativeKeys } from './claude'
import type { NarrativeSection, ReportSection } from './section-data'
import { NARRATED_SECTION_KEYS, type NarratedSectionKey, REPORT_SECTION_CONTRACT } from './section-keys'

// The narration pass is exercised through its pure half. `generateNarrative` adds one fetch and one retry on
// top of `acceptNarrative`, and every rule §4.3 states about partial acceptance and the claim gate lives here.

/**
 * A stand-in engine section. Only `key` matters to this module — `requestedNarrativeKeys` asks which sections
 * exist and the prompt serializes whatever it is given — so the data is deliberately not a real section: what
 * is being tested is that narration is requested for what the engine produced, not what it produced.
 */
function engineSection(key: string): ReportSection {
  return { data: {}, intro: `${key} 안내`, key, title: key } as unknown as ReportSection
}

// Everything the engine produced for a reader who declared four letters. All five narrated keys are here
// because the engine writes all five — `openingRead` and `reflectionQuestions` are composed sections now, not
// the model's to invent.
const ENGINE_WRITTEN = [
  'worldJob',
  'strengthCards',
  'contextShift',
  'threePaths',
  'fitAndFriction',
  'openingRead',
  'reflectionQuestions',
].map(engineSection)

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
  const accepted = new Map<NarratedSectionKey, NarrativeSection>()
  const dropped = acceptNarrative(JSON.stringify({ sections }), requested, accepted)
  return { accepted, dropped }
}

describe('requestedNarrativeKeys', () => {
  test('a section is narrated only where the engine wrote one', () => {
    const keys = requestedNarrativeKeys(ENGINE_WRITTEN)
    expect(keys).toContain('contextShift')

    const withoutContextShift = requestedNarrativeKeys(
      ENGINE_WRITTEN.filter((section) => section.key !== 'contextShift'),
    )
    // `contextShift` is omitted for a reader who declared nothing, and narrating a section the reader will
    // never see is how a report ends up describing a contrast that is not on screen.
    expect(withoutContextShift).not.toContain('contextShift')
    expect(withoutContextShift).toContain('openingRead')
    expect(withoutContextShift).toContain('reflectionQuestions')
  })

  // Nothing is requested off a bare vocabulary list any more. If the engine produced no section under a key,
  // there is nothing for a narration to sit under and asking for one spends tokens on text nobody renders.
  test('an engine that wrote nothing is narrated not at all', () => {
    expect(requestedNarrativeKeys([])).toEqual([])
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
    const accepted = new Map<NarratedSectionKey, NarrativeSection>()

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
    const accepted = new Map<NarratedSectionKey, NarrativeSection>()
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
