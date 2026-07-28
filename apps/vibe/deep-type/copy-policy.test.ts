import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ts from 'typescript'

import { COPY_GATES, type CopyGateId, KO_COPY_SOURCES, NEGATION, TRADEMARK_SOURCES } from './copy-policy'

const VIBE_ROOT = resolve(dirname(import.meta.path), '..')

type Literal = {
  /** Dotted object key path, e.g. `paywall.effortNote`. Empty for a literal outside any property. */
  keyPath: string
  line: number
  text: string
}

/**
 * String and template literals with the object path they sit under. Comments never appear here, which is the
 * point: several content modules document the token they may not contain, and a text grep fails on the
 * documentation rather than on the copy.
 *
 * Import specifiers and property names are skipped — a module named `band-labels.paid` is not a claim, and a
 * key called `확정` would be caught by whatever renders it.
 */
function literalsOf(file: string): Literal[] {
  const source = readFileSync(join(VIBE_ROOT, file), 'utf8')
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
  const found: Literal[] = []

  function walk(node: ts.Node, keyPath: string): void {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      return
    }

    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name)
      const nextPath = keyPath && name ? `${keyPath}.${name}` : name || keyPath
      walk(node.initializer, nextPath)
      return
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      found.push({ keyPath, line: lineOf(tree, node), text: node.text })
      return
    }

    if (ts.isTemplateExpression(node)) {
      // The head and each span's literal separately: an interpolated count is a constant by construction and
      // the gate's business is the words around it.
      found.push({ keyPath, line: lineOf(tree, node), text: node.head.text })
      for (const span of node.templateSpans) {
        found.push({ keyPath, line: lineOf(tree, span.literal), text: span.literal.text })
      }
      return
    }

    node.forEachChild((child) => walk(child, keyPath))
  }

  walk(tree, '')
  return found
}

/**
 * The key a property contributes to the path, including the computed form.
 *
 * `[Locale.KO]: {…}` is a ComputedPropertyName, and reading it as nothing collapsed the whole locale segment:
 * every literal in `legal.ts` and `pages.ts` arrived as `privacy.sections.body` with no ko/en/ja/zh anywhere,
 * so a gate could not be scoped to one locale even in principle. Taking the accessed member name gives
 * `KO.privacy.sections.body`, which is the path a reader of these files would have written by hand.
 */
function propertyName(name: ts.PropertyName): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text
  }

  if (ts.isComputedPropertyName(name) && ts.isPropertyAccessExpression(name.expression)) {
    return name.expression.name.text
  }

  return ''
}

function lineOf(tree: ts.SourceFile, node: ts.Node): number {
  return tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1
}

/** Everything after the match in the same sentence. A ban the copy itself denies is not a violation. */
function isNegated(text: string, index: number): boolean {
  const rest = text.slice(index).split(/[.!?\n]/)[0] ?? ''
  return NEGATION.test(rest)
}

function violations(gateId: CopyGateId, file: string): string[] {
  const gate = COPY_GATES.find((candidate) => candidate.id === gateId)
  if (!gate) {
    throw new Error(`no gate ${gateId}`)
  }
  if (gate.allow.includes(file)) {
    return []
  }

  const out: string[] = []
  for (const literal of literalsOf(file)) {
    if (gate.keyPaths && !gate.keyPaths.some((pattern) => pattern.test(literal.keyPath))) {
      continue
    }
    for (const pattern of gate.patterns) {
      const match = pattern.exec(literal.text)
      if (match && !isNegated(literal.text, match.index)) {
        out.push(`${file}:${literal.line} ${gateId} ${pattern.source} :: ${literal.text.slice(0, 60)}`)
      }
    }
  }
  return out
}

// The six lexical gates. TURNSTILE_ACTION and the count gate's key scoping are asserted separately below.
const LEXICAL: readonly CopyGateId[] = [
  'DETERMINISM',
  'FAKE_METRIC',
  'URGENCY',
  'TRADEMARK',
  'CAREER_DIRECTIVE',
  'COUNT_PROMISE',
  'REMEASURE',
]

describe('ko copy gates', () => {
  for (const file of KO_COPY_SOURCES) {
    test(`${file} carries no banned vocabulary`, () => {
      expect(LEXICAL.flatMap((gate) => violations(gate, file))).toEqual([])
    })
  }

  // The allowlist is a hole, so it has to keep earning its place: if the exempt files stop containing the
  // movement copy, the exemption is stale and the next author will inherit a permission nobody needs.
  test('the REMEASURE allowlist covers files that actually need it', () => {
    const gate = COPY_GATES.find((candidate) => candidate.id === 'REMEASURE')
    const fired = gate?.allow.filter((file) => {
      const literals = literalsOf(file)
      return gate.patterns.some((pattern) => literals.some((literal) => pattern.test(literal.text)))
    })

    expect(fired).toEqual(['deep-type/content/band-labels.free.ts', 'deep-type/content/band-labels.paid.ts'])
  })

  /**
   * Layer 1 of the trademark rule, over the surfaces that carry OUR name for the product rather than user copy.
   * `worker/lib/pricing.ts` is the one that matters most and the one `KO_COPY_SOURCES` cannot reach: its
   * `orderNames` become the string PortOne prints on the 결제창 and the card statement. The rule used to live in
   * a comment on that object, and a comment is invisible to this scanner by design.
   */
  for (const file of TRADEMARK_SOURCES) {
    test(`${file} carries no MBTI-family mark`, () => {
      expect(violations('TRADEMARK', file)).toEqual([])
    })
  }

  // D14's movement wording may say the ruler moved and may never say a letter did. The allowlist buys the
  // first and must not be readable as buying the second.
  test('the exempt band tables never say a letter could move', () => {
    for (const file of ['deep-type/content/band-labels.free.ts', 'deep-type/content/band-labels.paid.ts']) {
      for (const literal of literalsOf(file)) {
        expect(`${file}: ${/글자[^.!?\n]{0,10}(바뀔|바뀌|달라)/.test(literal.text)}`).toBe(`${file}: false`)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// TURNSTILE_ACTION — structural, not lexical.
// ---------------------------------------------------------------------------

const ACTIONS_FILE = 'worker/api/deep-type/actions.ts'
const ACTION_SHAPE = /^[a-z][a-z0-9-]{0,31}$/

describe('turnstile action gate', () => {
  test('every declared action matches the accepted shape', () => {
    const declared = literalsOf(ACTIONS_FILE).map((literal) => literal.text)

    expect(declared.length).toBeGreaterThan(0)
    for (const action of declared) {
      expect(`${action}:${ACTION_SHAPE.test(action)}`).toBe(`${action}:true`)
    }
  })

  /**
   * Both widgets must read the constant. A literal here is the failure mode the module header describes: the
   * widget mints a token under one action, the Worker verifies another, and every real user is refused with a
   * response that looks exactly like bot traffic.
   */
  test('no widget spells its action as a literal', () => {
    const widgets = [
      'src/app/[locale]/deep-type/_components/paywall-view.tsx',
      'src/app/[locale]/deep-type/reopen/_components/reopen-view.tsx',
    ]

    for (const file of widgets) {
      const source = readFileSync(join(VIBE_ROOT, file), 'utf8')
      expect(`${file}: ${source.includes('actions')}`).toBe(`${file}: true`)
      expect(`${file}: ${/action:\s*['"`]/.test(source)}`).toBe(`${file}: false`)
      // The widget must still declare one. A dropped `action` is silently accepted by Turnstile and rejected
      // by the Worker, which pins both sides to the same constant.
      expect(`${file}: ${/action:\s*DEEPTYPE_[A-Z_]+_ACTION/.test(source)}`).toBe(`${file}: true`)
    }
  })
})
