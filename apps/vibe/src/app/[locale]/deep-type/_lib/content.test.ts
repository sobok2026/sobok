import { describe, expect, test } from 'bun:test'

import { deepTypeContent as en } from '../_content/en'
import { deepTypeContent as ja } from '../_content/ja'
import { deepTypeContent as ko } from '../_content/ko'
import { deepTypeContent as zh } from '../_content/zh'

// Every leaf string in ko.ts must be non-empty — this is the only locale with real copy today.
function collectStrings(value: unknown, path: string, out: { path: string; value: string }[]) {
  if (typeof value === 'string') {
    out.push({ path, value })
    return
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      collectStrings(item, `${path}[${index}]`, out)
    }
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      collectStrings(item, path ? `${path}.${key}` : key, out)
    }
  }
}

function collectKeyShape(value: unknown): unknown {
  if (typeof value === 'string') {
    return 'string'
  }

  if (Array.isArray(value)) {
    return value.map(collectKeyShape)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, collectKeyShape(item)]))
  }

  return typeof value
}

describe('ko.ts content', () => {
  test('every string is non-empty', () => {
    const strings: { path: string; value: string }[] = []
    collectStrings(ko, '', strings)

    const empty = strings.filter((entry) => entry.value.trim().length === 0)

    expect(empty).toEqual([])
  })
})

// en/ja/zh translation is intentionally deferred (empty strings) — what must not drift is the *shape*:
// every key ko.ts has, they have too, so a locale switch never renders a missing field.
describe('en/ja/zh content structure', () => {
  const shape = collectKeyShape(ko)

  test('en.ts matches ko.ts key-for-key', () => expect(collectKeyShape(en)).toEqual(shape))
  test('ja.ts matches ko.ts key-for-key', () => expect(collectKeyShape(ja)).toEqual(shape))
  test('zh.ts matches ko.ts key-for-key', () => expect(collectKeyShape(zh)).toEqual(shape))
})
