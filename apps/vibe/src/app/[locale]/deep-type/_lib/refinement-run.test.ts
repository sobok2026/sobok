import { describe, expect, test } from 'bun:test'
import type { ItemAnswer, WorkAnswer } from '@deep-type/model'
import { FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, PAID_WORK_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'

import { PAID_RUN } from './paid-run'
import { isFreeWork, isRunComplete, paidCount, resumeWorkAnswers } from './refinement-run'

const FREE_WORK: readonly WorkAnswer[] = FREE_WORK_ITEMS.map((item) => ({ itemId: item.id, optionIndex: 0 }))
const PAID_WORK: readonly WorkAnswer[] = PAID_WORK_ITEMS.map((item) => ({ itemId: item.id, optionIndex: 1 }))
const PAID_LIKERT: readonly ItemAnswer[] = PAID_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: 3 }))

describe('paid run position', () => {
  test('the free drain block rides in the work buffer without advancing the run', () => {
    expect(paidCount([], FREE_WORK)).toBe(0)
    expect(isFreeWork(FREE_WORK[0] as WorkAnswer)).toBe(true)
    expect(isFreeWork(PAID_WORK[0] as WorkAnswer)).toBe(false)
  })

  test('a full buffer sits exactly at the end of the run', () => {
    expect(paidCount(PAID_LIKERT, [...FREE_WORK, ...PAID_WORK])).toBe(PAID_RUN.length)
    expect(isRunComplete(PAID_LIKERT, [...FREE_WORK, ...PAID_WORK])).toBe(true)
    expect(isRunComplete(PAID_LIKERT, [...FREE_WORK, ...PAID_WORK.slice(0, -1)])).toBe(false)
  })

  /**
   * The submit sends all twenty-four forced choices while the run walks twenty-one of them. Reading the
   * position off the raw work length is therefore off by the free three at every step, which is what made the
   * completed run land one index past the last question.
   */
  test('a complete run carries three more forced choices than it asked', () => {
    const work = [...FREE_WORK, ...PAID_WORK]
    expect(work).toHaveLength(WORK_ITEMS.length)
    expect(work.length - PAID_WORK_ITEMS.length).toBe(FREE_WORK_ITEMS.length)
  })
})

describe('resuming the work buffer', () => {
  test('the parked buffer wins for the free block when it carries one', () => {
    const parkedFree: readonly WorkAnswer[] = FREE_WORK.map((answer) => ({ ...answer, optionIndex: 2 }))
    const resumed = resumeWorkAnswers({
      parked: [...parkedFree, ...PAID_WORK.slice(0, 2)],
      server: FREE_WORK,
      sitting: [],
    })
    expect(resumed.filter(isFreeWork)).toEqual([...parkedFree])
    expect(resumed.filter((answer) => !isFreeWork(answer))).toEqual([...PAID_WORK.slice(0, 2)])
  })

  /**
   * The case the whole server field exists for. A buyer who pays, closes the tab at the intro and opens the
   * re-open e-mail somewhere else has no sitting, and every answer from there parks a buffer that is non-empty
   * and free-less — so the old "parked wins whole" rule kept a twenty-one-item set and the submit refused it.
   */
  test('the server free block fills a buffer parked in another browser', () => {
    const parkedPaid = [...PAID_WORK]
    const resumed = resumeWorkAnswers({ parked: parkedPaid, server: FREE_WORK, sitting: [] })

    expect(resumed).toHaveLength(WORK_ITEMS.length)
    expect(resumed.slice(0, FREE_WORK.length)).toEqual([...FREE_WORK])
    expect(isRunComplete(PAID_LIKERT, resumed)).toBe(true)
  })

  test('this tab’s sitting is the last resort, for rows written before the column existed', () => {
    expect(resumeWorkAnswers({ parked: [], server: [], sitting: FREE_WORK })).toEqual([...FREE_WORK])
    expect(resumeWorkAnswers({ parked: [], server: FREE_WORK, sitting: [] })).toEqual([...FREE_WORK])
    expect(resumeWorkAnswers({ parked: [], server: [], sitting: [] })).toEqual([])
  })

  // `back()` drops the last element of the buffer, so the paid picks have to stay last and in answer order.
  test('the free block keeps its leading position', () => {
    const parked = [...FREE_WORK, ...PAID_WORK.slice(0, 3)]
    const resumed = resumeWorkAnswers({ parked, server: FREE_WORK, sitting: FREE_WORK })
    expect(resumed).toEqual(parked)
    expect(resumed.at(-1)).toEqual(PAID_WORK[2] as WorkAnswer)
  })
})
