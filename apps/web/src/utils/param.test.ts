import { describe, expect, test } from 'bun:test'
import { appendViewToPath, getViewFromSearchParams, setViewToSearchParams, VIEW } from '@sobok/std'

describe('view search params helpers', () => {
  test('view=img일 때만 이미지 모드로 해석한다', () => {
    expect(getViewFromSearchParams(new URLSearchParams('view=img'))).toBe(VIEW.IMAGE)
    expect(getViewFromSearchParams(new URLSearchParams('view=card'))).toBe(VIEW.CARD)
    expect(getViewFromSearchParams(new URLSearchParams('view=unexpected'))).toBe(VIEW.CARD)
    expect(getViewFromSearchParams(new URLSearchParams(''))).toBe(VIEW.CARD)
  })

  test('이미지 모드는 쿼리에 view를 남기고 카드 모드는 제거한다', () => {
    expect(setViewToSearchParams(new URLSearchParams('sort=recent'), VIEW.IMAGE).toString()).toBe(
      'sort=recent&view=img',
    )
    expect(setViewToSearchParams(new URLSearchParams('sort=recent&view=img'), VIEW.CARD).toString()).toBe('sort=recent')
  })

  test('링크 생성 시 이미지 모드에서만 view 쿼리를 붙인다', () => {
    expect(appendViewToPath('/ranking/view/day', VIEW.IMAGE)).toBe('/ranking/view/day?view=img')
    expect(appendViewToPath('/ranking/view/day', VIEW.CARD)).toBe('/ranking/view/day')
  })
})
