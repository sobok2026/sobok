import { sha256Hex } from '@sobok/edge/tokens'
import {
  GUARDIAN_DAILY_THEMES,
  GUARDIAN_DAILY_TONES,
  type GuardianDailyBasis,
  type GuardianDailyCardSnapshot,
  type GuardianDailySummary,
  type GuardianDailyTheme,
  type GuardianDailyTone,
  type GuardianZodiacSign,
} from './daily-contract'
import { type GuardianDailyEdition, guardianDailyPool } from './manifest'

const DAY_MS = 24 * 60 * 60 * 1_000
const FOCUS_TOKEN_PATTERN = /\{focus(?::(을|가|은))?\}/g

const VALID_CONTEXTS = new Set([
  'present-weather',
  'hidden-need',
  'coping-pattern',
  'next-self',
  'first-signal',
  'careful-approach',
  'everyday-care',
  'honest-conversation',
  'shared-play',
  'boundary-and-space',
  'distance-and-return',
  'repair',
  'mutual-growth',
  'future-promise',
  'motivation',
  'strength',
  'pressure',
  'next-move',
  'desire',
  'evidence',
  'protected-value',
  'reversible-step',
])

const FOCUS_BY_THEME: Record<GuardianDailyTheme, string> = {
  self: '이 흐름',
  love: '관계의 흐름',
  work: '이 일',
  choice: '선택의 흐름',
}

const ACTION_BY_THEME_AND_TONE: Record<GuardianDailyTheme, Record<GuardianDailyTone, string>> = {
  self: {
    comfort: '하루의 속도를 평가하지 말고 마음이 편안해지는 시간을 10분 먼저 확보해 보세요.',
    honesty: '지금 가장 크게 느껴지는 감정 하나를 꾸미지 않은 말로 적어 보세요.',
    action: '이 하루에 바꿀 수 있는 가장 작은 동작 하나를 정하고 바로 시작해 보세요.',
    possibility: '하루가 끝날 때 남기고 싶은 작은 표식 하나를 정해 보세요.',
  },
  love: {
    comfort: '관계의 답을 서두르지 말고 내 마음이 안전해지는 거리부터 살펴보세요.',
    honesty: '상대의 반응을 추측하기 전에 내가 진짜 원하는 관계의 모습을 한 문장으로 적어 보세요.',
    action: '부담 없이 건넬 수 있는 가장 작은 관심이나 경계 표현 하나를 골라 보세요.',
    possibility: '한 가지 결론 대신 이 관계가 건강하게 달라질 수 있는 장면을 하나 떠올려 보세요.',
  },
  work: {
    comfort: '성과보다 먼저 회복해야 할 에너지 한 칸을 일정에 비워 두세요.',
    honesty: '지금 하는 일에서 나를 가장 지치게 하는 조건을 정확한 말로 적어 보세요.',
    action: '끝낼 수 있는 크기로 일을 줄이고 첫 10분을 바로 시작해 보세요.',
    possibility: '익숙한 방식 밖에서 시험해 볼 수 있는 작은 업무 방법 하나를 남겨 두세요.',
  },
  choice: {
    comfort: '당장 결론내리지 않아도 되는 부분을 구분하고 마음이 가라앉을 시간을 주세요.',
    honesty: '남의 기대를 뺀 뒤에도 남는 바람과 두려움을 각각 한 문장으로 적어 보세요.',
    action: '되돌릴 수 있고 결과를 확인할 수 있는 가장 작은 선택부터 실행해 보세요.',
    possibility: '둘 중 하나만 고르기 전에 아직 이름 붙이지 않은 세 번째 선택지를 찾아보세요.',
  },
}

const THEME_SUMMARY: Record<GuardianDailyTheme, { title: string; body: string }> = {
  self: {
    title: '나를 돌보는 장면이 자주 나타난 일주일',
    body: '최근 카드들은 바깥의 정답보다 내 마음과 리듬을 먼저 살피는 시간을 비추고 있어요.',
  },
  love: {
    title: '관계의 온도를 자주 비춘 일주일',
    body: '최근 카드들은 사랑과 관계 안에서 가까움, 솔직함, 안전한 거리를 함께 살피고 있어요.',
  },
  work: {
    title: '일의 리듬을 자주 비춘 일주일',
    body: '최근 카드들은 성과만이 아니라 동력과 부담, 지속 가능한 다음 움직임을 살피고 있어요.',
  },
  choice: {
    title: '선택의 기준을 자주 비춘 일주일',
    body: '최근 카드들은 빠른 결론보다 내가 지킬 기준과 확인 가능한 단서를 먼저 보라고 이야기해요.',
  },
}

const TONE_SUMMARY: Record<GuardianDailyTone, string> = {
  comfort: '그 안에서는 더 밀어붙이기보다 안심할 자리를 만드는 목소리가 반복됐어요.',
  honesty: '그 안에서는 듣기 좋은 답보다 이미 알고 있던 사실을 바라보는 목소리가 반복됐어요.',
  action: '그 안에서는 완벽한 계획보다 지금 가능한 첫 동작을 시작하는 목소리가 반복됐어요.',
  possibility: '그 안에서는 하나의 결론을 서두르지 않고 다른 가능성을 남기는 목소리가 반복됐어요.',
}

export async function guardianDailyThemeForDate(input: {
  seedHash: string
  dateKey: string
}): Promise<GuardianDailyTheme> {
  const order = await deterministicThemeOrder(input.seedHash)
  const index = positiveModulo(dayOrdinal(input.dateKey), order.length)
  const theme = order[index]
  if (!theme) throw new Error('Guardian daily theme cycle did not resolve')
  return theme
}

export async function selectGuardianDailyCard(input: {
  locale: 'ko'
  dateKey: string
  timeZone: string
  basis: GuardianDailyBasis
  sign: GuardianZodiacSign
  skySign: GuardianZodiacSign
  seedHash: string
  tone?: GuardianDailyTone
}): Promise<GuardianDailyCardSnapshot> {
  const theme = await guardianDailyThemeForDate(input)
  const familyId = `${input.sign}.${theme}`
  const tone =
    input.tone ??
    (await deterministicPick(GUARDIAN_DAILY_TONES, `${input.seedHash}:${input.dateKey}:${input.skySign}:tone`))
  const candidates = guardianDailyPool(familyId).filter((edition) => edition.tone === tone)
  const edition = await deterministicWeightedPick(
    candidates,
    `${input.seedHash}:${input.dateKey}:${familyId}:${input.skySign}:${tone}`,
  )
  if (!VALID_CONTEXTS.has(edition.contextId)) {
    throw new Error(`Guardian daily edition has an unknown context: ${edition.id}`)
  }

  return {
    locale: input.locale,
    dateKey: input.dateKey,
    timeZone: input.timeZone,
    basis: input.basis,
    sign: input.sign,
    skySign: input.skySign,
    theme,
    tone,
    rarity: edition.rarity,
    familyId,
    editionId: edition.id,
    artworkObjectKey: edition.artworkObjectKey,
    title: dayNeutralTitleKo(edition.copy.title),
    guardians: edition.copy.guardians,
    artworkAlt: dayNeutralKo(edition.copy.artworkAlt),
    oneLine: dayNeutralKo(firstSentence(renderOneLine(edition.copy.oneLineTemplate, FOCUS_BY_THEME[theme]))),
    action: ACTION_BY_THEME_AND_TONE[theme][tone],
    reflection: dayNeutralKo(edition.copy.reflection),
  }
}

export function summarizeGuardianDailyCards(cards: readonly GuardianDailyCardSnapshot[]): GuardianDailySummary | null {
  const recent = cards.slice(0, 7)
  if (recent.length < 2) return null

  const dominantTheme = dominantRecent(recent, GUARDIAN_DAILY_THEMES, (card) => card.theme)
  const dominantTone = dominantRecent(recent, GUARDIAN_DAILY_TONES, (card) => card.tone)
  const themeCopy = THEME_SUMMARY[dominantTheme]
  return {
    cardCount: recent.length,
    fromDateKey: recent.at(-1)?.dateKey ?? recent[0].dateKey,
    toDateKey: recent[0].dateKey,
    dominantTheme,
    dominantTone,
    title: themeCopy.title,
    body: `${themeCopy.body} ${TONE_SUMMARY[dominantTone]}`,
  }
}

async function deterministicThemeOrder(seedHash: string): Promise<GuardianDailyTheme[]> {
  const digest = await sha256Hex(`${seedHash}:theme-cycle`)
  const order = [...GUARDIAN_DAILY_THEMES]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const offset = (order.length - 1 - index) * 2
    const swapIndex = Number.parseInt(digest.slice(offset, offset + 2), 16) % (index + 1)
    const current = order[index]
    const swap = order[swapIndex]
    if (!current || !swap) throw new Error('Guardian daily theme permutation did not resolve')
    order[index] = swap
    order[swapIndex] = current
  }
  return order
}

async function deterministicPick<T>(values: readonly T[], seed: string): Promise<T> {
  if (values.length === 0) throw new Error('Guardian daily selection has no candidates')
  const digest = await sha256Hex(seed)
  const index = Number.parseInt(digest.slice(0, 8), 16) % values.length
  const value = values[index]
  if (value === undefined) throw new Error('Guardian daily selection did not resolve')
  return value
}

async function deterministicWeightedPick(
  values: readonly GuardianDailyEdition[],
  seed: string,
): Promise<GuardianDailyEdition> {
  if (values.length === 0) throw new Error('Guardian daily selection has no candidates')
  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0)
  const digest = await sha256Hex(seed)
  let cursor = Number.parseInt(digest.slice(0, 12), 16) % totalWeight
  for (const value of values) {
    if (cursor < value.weight) return value
    cursor -= value.weight
  }
  throw new Error('Guardian weighted selection did not resolve')
}

function dominantRecent<Card, Value extends string>(
  cards: readonly Card[],
  values: readonly Value[],
  select: (card: Card) => Value,
): Value {
  const counts = new Map<Value, number>()
  for (const card of cards) {
    const value = select(card)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const max = Math.max(...values.map((value) => counts.get(value) ?? 0))
  const recentWinner = cards.map(select).find((value) => (counts.get(value) ?? 0) === max)
  if (!recentWinner) throw new Error('Guardian daily summary did not resolve')
  return recentWinner
}

function renderOneLine(template: string, focus: string): string {
  let replacements = 0
  const rendered = template.replace(FOCUS_TOKEN_PATTERN, (_token, requestedParticle: string | undefined) => {
    replacements += 1
    return requestedParticle ? `${focus}${koreanParticle(focus, requestedParticle)}` : focus
  })
  if (replacements !== 1 || rendered.includes('{focus')) {
    throw new Error('Guardian daily card has an invalid one-line template')
  }
  return rendered.replace(/^“([^”]+)”/u, '$1')
}

function firstSentence(value: string): string {
  return value.split(/(?<=\.)\s+/u)[0] ?? value
}

function dayNeutralKo(value: string): string {
  return value
    .replaceAll('별싹의 어제 높이와 오늘 높이를', '별싹의 전날 높이와 이날 높이를')
    .replaceAll('오늘 아침부터', '하루를 시작하며')
    .replaceAll('오늘 끝에', '하루 끝에')
    .replaceAll('오늘 확인할 수', '하루 안에 확인할 수')
    .replaceAll('오늘의', '이날의')
    .replaceAll('오늘', '이날')
}

function dayNeutralTitleKo(value: string): string {
  return value.replaceAll('오늘', '하루')
}

function koreanParticle(value: string, requested: string): string {
  const codePoint = Array.from(value).at(-1)?.codePointAt(0)
  if (codePoint === undefined || codePoint < 0xac00 || codePoint > 0xd7a3) {
    throw new Error('Guardian daily focus requiring a particle must end in Hangul')
  }
  const finalConsonant = (codePoint - 0xac00) % 28 !== 0
  if (requested === '을') return finalConsonant ? '을' : '를'
  if (requested === '가') return finalConsonant ? '이' : '가'
  if (requested === '은') return finalConsonant ? '은' : '는'
  throw new Error(`Unsupported Korean particle: ${requested}`)
}

function dayOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}
