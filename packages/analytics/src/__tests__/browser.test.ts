import { beforeEach, describe, expect, test } from 'bun:test'

import '../../../../test/setup.dom'

import { identify, push, track, trackEcommerce } from '../browser'

function dataLayer(): unknown[] {
  return window.dataLayer ?? []
}

describe('데이터 레이어 래퍼', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  test('push는 데이터 레이어가 없어도 만들어서 넣는다', () => {
    window.dataLayer = undefined

    push({ event: 'anything' })

    expect(dataLayer()).toEqual([{ event: 'anything' }])
  })

  test('track는 날짜 파라미터를 직렬화하고 정의되지 않은 값은 무시한다', () => {
    track('login', {
      method: 'password',
      happened_at: new Date('2026-03-27T00:00:00.000Z'),
      empty: undefined,
    })

    expect(dataLayer()).toEqual([
      {
        event: 'login',
        method: 'password',
        happened_at: '2026-03-27T00:00:00.000Z',
      },
    ])
  })

  test('identify는 auth_identify 이벤트로 숫자 ID를 문자열로 보내고 null이면 해제한다', () => {
    identify(42)
    identify(null)

    expect(dataLayer()).toEqual([
      { event: 'auth_identify', user_id: '42' },
      { event: 'auth_identify', user_id: null },
    ])
  })

  // GA4의 ecommerce 객체는 재귀 병합되므로, 앞선 이벤트의 items가 섞여 들어가지 않도록
  // 리셋 push가 반드시 같은 이벤트 앞에 하나 더 있어야 한다.
  test('trackEcommerce는 이벤트 직전에 ecommerce를 리셋하고 같은 메시지에 실어 보낸다', () => {
    const ecommerce = {
      currency: 'KRW',
      items: [{ item_id: 'report', item_name: 'DeepType report', price: 4900, quantity: 1 }],
      value: 4900,
    } as const

    trackEcommerce('begin_checkout', ecommerce, { locale: 'ko' })

    expect(dataLayer()).toEqual([{ ecommerce: null }, { event: 'begin_checkout', ecommerce, locale: 'ko' }])
  })
})
