import type { Locale } from '@sobok/domain/locale'
import type { GuardianRarity } from '../../worker/guardian/manifest'
import type { GuardianPayMethod } from '../../worker/guardian/pay-method'

export type GuardianLoveRedrawContent = {
  meta: { title: string; description: string }
  reportOffer: { eyebrow: string; title: string; body: string; cta: string }
  navigation: { backToReport: string }
  hero: { eyebrow: string; title: string; body: string }
  current: { eyebrow: string; title: string; equipped: string }
  wallet: {
    credits: (count: number) => string
    draw: string
    drawing: string
    guaranteeTitle: string
    guaranteeProgress: (current: number, interval: number) => string
    guaranteeNext: (remaining: number) => string
  }
  offer: {
    eyebrow: string
    title: string
    body: string
    recommended: string
    credits: (count: number) => string
    perDraw: (price: string) => string
    buy: (count: number, price: string) => string
    methodLabel: string
    methodLabels: Record<GuardianPayMethod, string>
    processing: string
    security: string
  }
  odds: {
    title: string
    rarityLabels: Record<GuardianRarity, string>
    guarantee: (interval: number) => string
  }
  reveal: {
    eyebrow: string
    title: string
    tap: string
    duplicate: (count: number) => string
    guaranteed: string
    equip: string
    equipping: string
    equipped: string
    drawAgain: string
    buyMore: string
    accountTitle: string
    accountBody: string
  }
  collection: { eyebrow: string; title: string; body: string; ownedCount: (count: number) => string; equip: string }
  states: { loading: string; confirming: string; emptyCredits: string }
  errors: {
    generic: string
    paymentInterrupted: string
    paymentPending: string
    noCredit: string
    retry: string
    unavailable: string
  }
}

const KO_CONTENT: GuardianLoveRedrawContent = {
  meta: {
    title: '사랑 카드 다시 만나기',
    description: '내 별자리 수호령 리포트에 걸어 둘 새로운 사랑 카드를 만나보세요.',
  },
  reportOffer: {
    eyebrow: 'ANOTHER LOVE SCENE',
    title: '지금의 사랑 카드, 다른 장면도 만나볼까요?',
    body: '리포트 본문은 그대로 두고 사랑 카드의 일러스트와 한 줄 메시지만 새로 만나요. 새 카드는 보관함에 담긴 뒤, 원할 때 직접 걸 수 있어요.',
    cta: '사랑 카드 다시 만나기',
  },
  navigation: { backToReport: '전체 리포트로 돌아가기' },
  hero: {
    eyebrow: 'LOVE CARD REDRAW',
    title: '사랑의 다른 장면을 만나보세요',
    body: '뽑은 카드는 모두 보관돼요. 지금 걸어 둔 카드는 새 카드가 나와도 자동으로 바뀌지 않아요.',
  },
  current: { eyebrow: 'NOW ON YOUR REPORT', title: '지금 리포트에 걸린 카드', equipped: '걸어 둔 카드' },
  wallet: {
    credits: (count) => `남은 만남 ${count}회`,
    draw: '카드 한 장 만나기',
    drawing: '별빛을 모으는 중…',
    guaranteeTitle: '미보유 카드 보장',
    guaranteeProgress: (current, interval) => `${current} / ${interval}회`,
    guaranteeNext: (remaining) =>
      remaining === 1 ? '다음 유료 만남에서 미보유 카드 보장' : `${remaining}회 뒤 미보유 카드 보장`,
  },
  offer: {
    eyebrow: 'CHOOSE YOUR DRAW',
    title: '몇 번 만나볼까요?',
    body: '1회와 5회권은 같은 확률과 보장 횟수를 공유해요. 5회권도 한 장씩 천천히 열 수 있어요.',
    recommended: '가장 많이 선택',
    credits: (count) => `${count}회`,
    perDraw: (price) => `1회당 ${price}`,
    buy: (count, price) => `${count}회 · ${price} 결제하기`,
    methodLabel: '결제수단',
    methodLabels: { tosspay: '토스페이', card: '신용·체크카드' },
    processing: '결제창을 준비하는 중…',
    security: '결제 전에 보안 확인을 완료해주세요.',
  },
  odds: {
    title: '카드 등장 확률',
    rarityLabels: { orbit: '오빗', nebula: '네뷸라', eclipse: '이클립스', stella: '스텔라' },
    guarantee: (interval) =>
      `중복은 나올 수 있지만 유료 ${interval}회마다 아직 없는 카드가 남아 있다면 그중 한 장을 만나요.`,
  },
  reveal: {
    eyebrow: 'A NEW LOVE SCENE',
    title: '새로운 사랑 카드가 도착했어요',
    tap: '카드를 눌러 만나보세요',
    duplicate: (count) => `이미 만난 카드 · 지금까지 ${count}장`,
    guaranteed: '미보유 카드 보장으로 만났어요',
    equip: '이 카드를 리포트에 걸기',
    equipping: '카드를 걸고 있어요…',
    equipped: '지금 리포트에 걸었어요',
    drawAgain: '한 장 더 만나기',
    buyMore: '만남 횟수 더하기',
    accountTitle: '카드는 잃어버리지 않아요',
    accountBody:
      '지금은 구매 이메일의 재열람 링크와 이 브라우저에 연결돼 있어요. Stella 계정이 열리면 이 보관함을 그대로 옮길 수 있어요.',
  },
  collection: {
    eyebrow: 'MY LOVE CARDS',
    title: '내 사랑 카드 보관함',
    body: '마음에 드는 카드를 골라 언제든 리포트에 다시 걸 수 있어요.',
    ownedCount: (count) => `${count}장 보유`,
    equip: '리포트에 걸기',
  },
  states: {
    loading: '사랑 카드 보관함을 불러오고 있어요…',
    confirming: '결제를 확인하고 있어요…',
    emptyCredits: '남은 만남이 없어요.',
  },
  errors: {
    generic: '잠시 연결이 매끄럽지 않았어요. 다시 시도해주세요.',
    paymentInterrupted: '결제가 완료되지 않았어요. 원할 때 다시 시도할 수 있어요.',
    paymentPending: '결제 확인이 아직 끝나지 않았어요. 잠시 뒤 다시 확인해주세요.',
    noCredit: '남은 만남이 없어요. 1회 또는 5회권을 먼저 선택해주세요.',
    retry: '다시 불러오기',
    unavailable: '이 리포트의 사랑 카드 보관함을 열 수 없어요.',
  },
}

function emptyContent(): GuardianLoveRedrawContent {
  const empty = ''
  return {
    meta: { title: empty, description: empty },
    reportOffer: { eyebrow: empty, title: empty, body: empty, cta: empty },
    navigation: { backToReport: empty },
    hero: { eyebrow: empty, title: empty, body: empty },
    current: { eyebrow: empty, title: empty, equipped: empty },
    wallet: {
      credits: () => empty,
      draw: empty,
      drawing: empty,
      guaranteeTitle: empty,
      guaranteeProgress: () => empty,
      guaranteeNext: () => empty,
    },
    offer: {
      eyebrow: empty,
      title: empty,
      body: empty,
      recommended: empty,
      credits: () => empty,
      perDraw: () => empty,
      buy: () => empty,
      methodLabel: empty,
      methodLabels: { tosspay: empty, card: empty },
      processing: empty,
      security: empty,
    },
    odds: {
      title: empty,
      rarityLabels: { orbit: empty, nebula: empty, eclipse: empty, stella: empty },
      guarantee: () => empty,
    },
    reveal: {
      eyebrow: empty,
      title: empty,
      tap: empty,
      duplicate: () => empty,
      guaranteed: empty,
      equip: empty,
      equipping: empty,
      equipped: empty,
      drawAgain: empty,
      buyMore: empty,
      accountTitle: empty,
      accountBody: empty,
    },
    collection: { eyebrow: empty, title: empty, body: empty, ownedCount: () => empty, equip: empty },
    states: { loading: empty, confirming: empty, emptyCredits: empty },
    errors: {
      generic: empty,
      paymentInterrupted: empty,
      paymentPending: empty,
      noCredit: empty,
      retry: empty,
      unavailable: empty,
    },
  }
}

export const GUARDIAN_LOVE_REDRAW_UI = {
  ko: KO_CONTENT,
  en: emptyContent(),
  ja: emptyContent(),
  zh: emptyContent(),
} as const satisfies Record<Locale, GuardianLoveRedrawContent>
