import { describe, expect, test } from 'bun:test'

import { cn } from './cn'

describe('cn', () => {
  test('removes falsey class values', () => {
    expect(cn('base', false, null, undefined, 'active')).toBe('base active')
  })

  test('handles clsx object and array inputs', () => {
    expect(cn('base', { active: true, hidden: false }, ['nested', ['child']])).toBe('base active nested child')
  })

  test('keeps the last conflicting spacing class', () => {
    expect(cn('p-2 p-4', 'px-2 px-4')).toBe('p-4 px-4')
  })

  test('keeps the last conflicting project token class', () => {
    expect(
      cn('bg-foreground', 'bg-brand', 'text-foreground', 'text-accent', 'rounded-2xl', 'rounded-3xl sm:rounded-4xl'),
    ).toBe('bg-brand text-accent rounded-3xl sm:rounded-4xl')
  })
})
