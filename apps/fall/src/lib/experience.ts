export const ROUTES = ['image', 'location', 'relationship', 'work'] as const

export type ExposureRoute = (typeof ROUTES)[number]

export const DISCLOSURES = ['image', 'account', 'neighborhood', 'movement', 'relations', 'work', 'contact'] as const

export type DisclosureKey = (typeof DISCLOSURES)[number]
export type DisclosureState = Record<DisclosureKey, boolean>

export type Profile = {
  name: string
  company: string
  role: string
  neighborhood: string
  station: string
  place: string
  friend: string
  family: string
  account: string
  phoneSuffix: string
  profilePhoto: string
}

export type Discovery = 'direct' | 'friend' | 'workplace'
export type FirstResponse = 'report' | 'contact' | 'block'
export type WorkResponse = 'explain' | 'requestHelp' | 'silence'
export type RelationshipResponse = 'family' | 'friend' | 'silent'
export type NightResponse = 'rejectCall' | 'lightsOff' | 'shareLocation'
export type EvidenceMode = 'current' | 'search' | 'counsel'
export type DeletionResponse = 'add' | 'later'
export type PublicResponse = 'removePhoto' | 'explain' | 'silence'
export type EmploymentExit = 'continue' | 'leave' | 'resign'
export type Coordination = 'share' | 'compare' | 'observe'
export type RecruitmentResponse = 'explain' | 'documents' | 'withdraw'
export type LegalView = 'open' | 'defer'
export type MonitoringResponse = 'continue' | 'stop'

export type RouteScore = {
  route: ExposureRoute
  score: number
}

export type ProfilePreset = {
  profile: Profile
  disclosures: DisclosureState
}

export const ROUTE_LABELS: Record<ExposureRoute, string> = {
  image: '이미지',
  location: '생활권',
  relationship: '관계',
  work: '직장',
}

export const DISCLOSURE_LABELS: Record<DisclosureKey, string> = {
  image: '공개 사진',
  account: '공개 계정',
  neighborhood: '사는 동네',
  movement: '출퇴근·단골 장소',
  relations: '가까운 사람',
  work: '회사·직무',
  contact: '연락처 일부',
}

const SCORE_WEIGHTS: Record<DisclosureKey, Partial<Record<ExposureRoute, number>>> = {
  image: { image: 3 },
  account: { image: 1, location: 1, relationship: 1, work: 1 },
  neighborhood: { location: 3 },
  movement: { location: 3, work: 1 },
  relations: { relationship: 3 },
  work: { relationship: 1, work: 3 },
  contact: { location: 1, relationship: 2, work: 1 },
}

const BASE_PROFILE: Profile = {
  name: '윤서아',
  company: '다온리빙',
  role: '브랜드 운영팀 사원',
  neighborhood: '상수동',
  station: '상수역',
  place: '회사 근처 카페',
  friend: '지민',
  family: '엄마',
  account: 'seo_a.day',
  phoneSuffix: '4821',
  profilePhoto: '친구가 찍어 준 여행 사진',
}

const ALL_HIDDEN: DisclosureState = {
  image: false,
  account: false,
  neighborhood: false,
  movement: false,
  relations: false,
  work: false,
  contact: false,
}

export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    profile: BASE_PROFILE,
    disclosures: {
      ...ALL_HIDDEN,
      image: true,
      account: true,
      work: true,
    },
  },
  {
    profile: {
      ...BASE_PROFILE,
      name: '김유진',
      company: '모아스튜디오',
      role: '콘텐츠 디자이너',
      neighborhood: '문래동',
      station: '문래역',
      place: '작업실 앞 편의점',
      friend: '하린',
      family: '언니',
      account: 'yujin.notes',
      phoneSuffix: '9036',
      profilePhoto: '동네 카페에서 찍은 셀피',
    },
    disclosures: {
      ...ALL_HIDDEN,
      account: true,
      neighborhood: true,
      movement: true,
    },
  },
  {
    profile: {
      ...BASE_PROFILE,
      name: '박민서',
      company: '유월컴퍼니',
      role: '서비스 기획자',
      neighborhood: '망원동',
      station: '망원역',
      place: '한강 쪽 러닝 코스',
      friend: '수아',
      family: '아빠',
      account: 'minseo.zip',
      phoneSuffix: '1174',
      profilePhoto: '회사 행사에서 찍힌 단체 사진',
    },
    disclosures: {
      ...ALL_HIDDEN,
      account: true,
      relations: true,
      contact: true,
    },
  },
  {
    profile: {
      ...BASE_PROFILE,
      name: '이채원',
      company: '포레스트랩',
      role: '마케팅 매니저',
      neighborhood: '성수동',
      station: '성수역',
      place: '거래처 근처 베이커리',
      friend: '예린',
      family: '동생',
      account: 'chae.one',
      phoneSuffix: '6650',
      profilePhoto: '프로필 촬영 때 남긴 사진',
    },
    disclosures: {
      ...ALL_HIDDEN,
      account: true,
      work: true,
      contact: true,
    },
  },
]

export function disclosureValue(key: DisclosureKey, profile: Profile): string {
  switch (key) {
    case 'image':
      return profile.profilePhoto
    case 'account':
      return `@${profile.account}`
    case 'neighborhood':
      return profile.neighborhood
    case 'movement':
      return `${profile.station} · ${profile.place}`
    case 'relations':
      return `${profile.friend} · ${profile.family}`
    case 'work':
      return `${profile.company} · ${profile.role}`
    case 'contact':
      return `•••• ${profile.phoneSuffix}`
  }
}

export function rankExposureRoutes(profile: Profile, disclosures: DisclosureState): RouteScore[] {
  const scores = Object.fromEntries(ROUTES.map((route) => [route, 0])) as Record<ExposureRoute, number>

  for (const disclosure of DISCLOSURES) {
    if (!disclosures[disclosure]) {
      continue
    }

    for (const route of ROUTES) {
      scores[route] += SCORE_WEIGHTS[disclosure][route] ?? 0
    }
  }

  const seed = [...Object.values(profile), ...DISCLOSURES.filter((disclosure) => disclosures[disclosure])].join('|')

  return ROUTES.map((route) => ({ route, score: scores[route] })).sort((left, right) => {
    const scoreDifference = right.score - left.score

    if (scoreDifference !== 0) {
      return scoreDifference
    }

    const tieDifference = stableHash(`${seed}:${left.route}`) - stableHash(`${seed}:${right.route}`)
    return tieDifference || ROUTES.indexOf(left.route) - ROUTES.indexOf(right.route)
  })
}

export function selectedDisclosureCount(disclosures: DisclosureState): number {
  return DISCLOSURES.filter((disclosure) => disclosures[disclosure]).length
}

function stableHash(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export type Stage =
  | 'intro'
  | 'profile'
  | 'identity'
  | 'morning'
  | 'unknownMessage'
  | 'friendDelay'
  | 'friendReady'
  | 'accountGone'
  | 'searchResults'
  | 'primaryRoute'
  | 'secondaryRoute'
  | 'responseChoice'
  | 'responseResult'
  | 'incomingCall'
  | 'workplaceCall'
  | 'workplaceResult'
  | 'relationships'
  | 'relationshipResult'
  | 'locationFear'
  | 'locationResult'
  | 'supportIntake'
  | 'supportResult'
  | 'deletedNotice'
  | 'deletionResult'
  | 'publicReaction'
  | 'publicReactionResult'
  | 'employment'
  | 'employmentResult'
  | 'coordination'
  | 'jobSearch'
  | 'jobRejection'
  | 'investigation'
  | 'investigationResult'
  | 'judgment'
  | 'judgmentResult'
  | 'newRelationship'
  | 'networkFinal'
  | 'nameErased'
  | 'ending'

export type Chapter = {
  title: string
  stages: Stage[]
}

/** Narrative order. Branch variants of one beat sit next to each other. */
export const CHAPTERS: Chapter[] = [
  { title: '하루의 시작', stages: ['identity', 'morning'] },
  {
    title: '발견',
    stages: [
      'unknownMessage',
      'friendDelay',
      'friendReady',
      'accountGone',
      'searchResults',
      'primaryRoute',
      'secondaryRoute',
    ],
  },
  {
    title: '대응',
    stages: [
      'responseChoice',
      'responseResult',
      'incomingCall',
      'workplaceCall',
      'workplaceResult',
      'relationships',
      'relationshipResult',
      'locationFear',
      'locationResult',
    ],
  },
  {
    title: '삭제',
    stages: [
      'supportIntake',
      'supportResult',
      'deletedNotice',
      'deletionResult',
      'publicReaction',
      'publicReactionResult',
    ],
  },
  { title: '일상', stages: ['employment', 'employmentResult', 'coordination', 'jobSearch', 'jobRejection'] },
  {
    title: '판결 이후',
    stages: [
      'investigation',
      'investigationResult',
      'judgment',
      'judgmentResult',
      'newRelationship',
      'networkFinal',
      'nameErased',
    ],
  },
]

const STAGE_SEQUENCE: Stage[] = CHAPTERS.flatMap((chapter) => chapter.stages)

export type StageProgress = {
  chapterIndex: number
  chapterCount: number
  chapterTitle: string
  ratio: number
}

export function stageProgress(stage: Stage): StageProgress | null {
  const chapterIndex = CHAPTERS.findIndex((chapter) => chapter.stages.includes(stage))

  if (chapterIndex < 0) {
    return null
  }

  const position = STAGE_SEQUENCE.indexOf(stage)

  return {
    chapterIndex,
    chapterCount: CHAPTERS.length,
    chapterTitle: CHAPTERS[chapterIndex].title,
    ratio: (position + 1) / STAGE_SEQUENCE.length,
  }
}

const JOSA_PAIRS = {
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '을/를': ['을', '를'],
  '와/과': ['과', '와'],
} as const

export type JosaPair = keyof typeof JOSA_PAIRS

/**
 * Appends the Korean particle that agrees with the word's final consonant.
 * Profile values are player-supplied, so the particle cannot be hard-coded.
 * Non-Hangul endings fall back to the open-syllable form.
 */
export function josa(word: string, pair: JosaPair): string {
  const [withFinal, withoutFinal] = JOSA_PAIRS[pair]
  const lastCode = word.codePointAt(word.length - 1) ?? 0
  const isHangulSyllable = lastCode >= 0xac00 && lastCode <= 0xd7a3
  const hasFinalConsonant = isHangulSyllable && (lastCode - 0xac00) % 28 !== 0

  return `${word}${hasFinalConsonant ? withFinal : withoutFinal}`
}
