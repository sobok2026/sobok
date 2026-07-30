import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { LOCALES } from '@sobok/domain/locale'
import ts from 'typescript'

import { LEGAL } from '../src/content/legal'
import { FREE_DELIVERABLES_KO } from './free-deliverables'
import { PRODUCT_NAME } from './offer'

const VIBE_ROOT = resolve(dirname(import.meta.path), '..')

/**
 * The two invariants `free-deliverables.ts` declares, which until now it only declared.
 *
 * They exist because the withdrawal-right limitation in the refund policy is not self-supporting. 전자상거래법
 * 제17조 제6항 lets a seller keep the limitation for digital content only if it did two things before the sale,
 * one of which is handing over a trial of the goods. The refund policy claims that trial by naming four
 * deliverables. If the free result stops producing exactly those four, the claim becomes false and the
 * limitation falls away — and nothing about that failure is visible on any screen. It is a legal defect with no
 * user-visible symptom, which is the kind a test has to catch.
 */
describe('free deliverable invariant', () => {
  // Invariant 1: the terms name what the free run hands over, in the constant's own words.
  test('the ko withdrawal-limitation paragraph names the four deliverables verbatim', () => {
    const section = LEGAL.ko.refund.sections.find((entry) => entry.heading === '디지털 콘텐츠의 청약철회 제한')
    const joined = FREE_DELIVERABLES_KO.join(' · ')

    expect(section).toBeDefined()
    expect(section?.body.filter((paragraph) => paragraph.includes(joined)).length).toBe(1)
  })

  // The invariant is worth nothing if the paragraph could satisfy it while saying something else, so the
  // sentence around the join is pinned too: this is the '시용 상품 제공' claim, not a list of features.
  test('the paragraph makes the pre-payment trial claim, not merely a list', () => {
    const body = LEGAL.ko.refund.sections.flatMap((entry) => entry.body).join('\n')

    expect(body).toContain('결제 전에 무료 검사 결과로')
    expect(body).toContain('무료 검사는 결제 없이 언제든 다시 받을 수 있습니다')
  })

  /**
   * Invariant 2: the free result screen takes its four block headings from the same constant.
   *
   * Asserted over the source rather than a render, because the failure being prevented is someone inlining the
   * words — a rendered screen looks identical either way, and would keep looking identical after the constant
   * moved on.
   */
  test('the free result screen injects the headings instead of spelling them', () => {
    const file = 'src/app/[locale]/deep-type/_components/free-result-view.tsx'
    const source = readFileSync(join(VIBE_ROOT, file), 'utf8')
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const literals: string[] = []

    function walk(node: ts.Node): void {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        literals.push(node.text)
        return
      }
      node.forEachChild(walk)
    }
    walk(tree)

    expect(source).toContain('FREE_DELIVERABLES_KO')
    for (const deliverable of FREE_DELIVERABLES_KO) {
      expect(`${deliverable}: ${literals.includes(deliverable)}`).toBe(`${deliverable}: false`)
    }
  })

  // Array order is the heading order on that screen (N8: the job card sits above the drain block), and the
  // terms read as a list in the same order. A reorder is legible in a diff only if something objects to it.
  test('pins the declared order', () => {
    expect(FREE_DELIVERABLES_KO).toEqual(['속유형 네 글자', '마음의 코어 네 글자', '세계관 직업', '지치는 조건 신호'])
  })
})

/**
 * One SKU, one name, everywhere the buyer can read it. 전자상거래법 제13조 제2항 제2호 makes the '재화등의 명칭' a
 * pre-contract disclosure, and before `PRODUCT_NAME` this one product carried seven different strings across
 * four locales — including a PortOne 결제창 label that matched no contract in any language.
 */
describe('product name invariant', () => {
  test('every locale states the name the contract uses', () => {
    for (const locale of LOCALES) {
      const documents = [LEGAL[locale].terms, LEGAL[locale].refund]
      const text = documents.flatMap((doc) => [doc.description, ...doc.sections.flatMap((entry) => entry.body)])

      expect(`${locale}: ${text.some((paragraph) => paragraph.includes(PRODUCT_NAME[locale]))}`).toBe(`${locale}: true`)
    }
  })

  // The names the pivot retired. A find-replace that misses one leaves a document naming a product that is not
  // for sale, and the ko pair is what the pre-pivot terms and the pre-pivot 결제창 respectively called it.
  test('no document still carries a retired name', () => {
    const retired = ['겉속유형 정밀 감정서', '겉속유형 심층 감정서', 'DeepType精密鑑定書', '精密分析报告']

    for (const locale of LOCALES) {
      const content = LEGAL[locale]
      const text = [content.privacy, content.terms, content.refund]
        .flatMap((doc) => [doc.title, doc.description, ...doc.sections.flatMap((entry) => entry.body)])
        .join('\n')

      for (const name of retired) {
        expect(`${locale}/${name}: ${text.includes(name)}`).toBe(`${locale}/${name}: false`)
      }
    }
  })
})
