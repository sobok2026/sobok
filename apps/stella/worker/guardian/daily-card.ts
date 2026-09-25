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
  self: '지금 네 마음',
  love: '이 관계',
  work: '이 일',
  choice: '이 선택',
}

const ACTION_BY_THEME_AND_TONE: Record<GuardianDailyTheme, Record<GuardianDailyTone, string>> = {
  self: {
    comfort: '잠시 하던 일을 멈추고, 마음이 편안해지는 일을 10분만 해보세요.',
    honesty: '지금 가장 크게 느끼는 감정을 솔직하게 적어 보세요.',
    action: '지금 해볼 수 있는 작은 일 하나를 골라 시작해 보세요.',
    possibility: '하루가 끝났을 때 기억하고 싶은 일 하나를 해보세요.',
  },
  love: {
    comfort: '관계의 결론을 서두르지 말고, 어떤 거리에서 마음이 편안한지 살펴보세요.',
    honesty: '상대의 반응을 추측하기 전에 내가 진짜 원하는 관계의 모습을 한 문장으로 적어 보세요.',
    action: '가볍게 안부를 묻거나 불편한 점을 말하는 것부터 시작해 보세요.',
    possibility: '서로 더 편안하게 지내려면 무엇이 달라지면 좋을지 생각해 보세요.',
  },
  work: {
    comfort: '일정에 쉴 시간을 먼저 넣고, 잠시 일에서 벗어나 보세요.',
    honesty: '지금 하는 일에서 무엇 때문에 가장 지치는지 구체적으로 적어 보세요.',
    action: '할 일을 작게 나눠서, 먼저 10분 동안 해보세요.',
    possibility: '평소와 다르게 해볼 수 있는 일하는 방법을 하나 떠올려 보세요.',
  },
  choice: {
    comfort: '지금 결정하지 않아도 되는 일은 잠시 미뤄 두고, 마음을 가라앉혀 보세요.',
    honesty: '다른 사람의 기대를 내려놓고, 내가 원하는 것과 걱정되는 것을 하나씩 적어 보세요.',
    action: '부담 없이 되돌릴 수 있는 작은 일부터 해보고, 어떤지 살펴보세요.',
    possibility: '둘 중 하나를 고르기 어렵다면 다른 방법도 있는지 찾아보세요.',
  },
}

const THEME_SUMMARY: Record<GuardianDailyTheme, { title: string; body: string }> = {
  self: {
    title: '나를 돌보라는 말이 많았어요',
    body: '최근 카드에는 다른 사람의 기준보다 내 마음을 먼저 살펴보라는 이야기가 많았어요.',
  },
  love: {
    title: '관계를 돌아보라는 말이 많았어요',
    body: '최근 카드에는 가까운 사람과 솔직하게 이야기하고, 서로 편안한 거리를 찾으라는 말이 많았어요.',
  },
  work: {
    title: '일하는 방식을 돌아봤어요',
    body: '최근 카드에는 일하는 이유와 부담을 돌아보고, 무리 없이 이어갈 방법을 찾으라는 말이 많았어요.',
  },
  choice: {
    title: '선택의 기준을 살펴봤어요',
    body: '최근 카드에는 결정을 서두르기보다, 나에게 중요한 기준과 필요한 정보를 먼저 살펴보라는 말이 많았어요.',
  },
}

const TONE_SUMMARY: Record<GuardianDailyTone, string> = {
  comfort: '조금 쉬어 가도 괜찮다는 다정한 위로가 자주 담겨 있었어요.',
  honesty: '마음을 솔직하게 들여다보라는 조언이 자주 담겨 있었어요.',
  action: '지금 할 수 있는 작은 일부터 시작해 보라는 조언이 자주 담겨 있었어요.',
  possibility: '결론을 서두르지 말고 다른 가능성도 살펴보라는 조언이 자주 담겨 있었어요.',
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
