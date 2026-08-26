// Static game content, shared model types, and deterministic rule helpers.

export const MAX_NIGHTS = 12
export const ROSTER_SIZE = 12
export const MAX_TIER = 4
export const REQUIRED_LANE_WINS = 2
export const FINAL_CROWN_REQUIRED_SEALS = 2
export const FINAL_CROWN_MASTERY_SCORE = 1_200
export const EMBER_CROWN_SCORE = 62_000

export type UnitKind = 'warden' | 'ranger' | 'raider'
export type SpecializationId =
  | 'ember-bulwark'
  | 'oath-anchor'
  | 'storm-eye'
  | 'ghost-string'
  | 'frost-breaker'
  | 'last-brand'
export type Difficulty = 'story' | 'expedition' | 'whiteout'
export type RunMode = 'standard' | 'daily' | 'shared'

export function inheritedPowerEnabledFor(mode: RunMode): boolean {
  return mode === 'standard'
}

export function runCodeFor(seed: number): string {
  return seed.toString(36).toUpperCase().padStart(6, '0').slice(-6)
}

export function seedForRunCode(code: string): number | null {
  const normalized = code.trim().toUpperCase()
  if (!/^[0-9A-Z]{1,6}$/.test(normalized)) return null
  const seed = Number.parseInt(normalized, 36)
  return Number.isSafeInteger(seed) && seed >= 1 && seed <= 2_147_483_647 ? seed : null
}

export function runCodeFromText(text: string): string | null {
  const normalized = text.trim().toUpperCase()
  const queryCode = normalized.match(/[?&]RIFT=([0-9A-Z]{1,6})(?=$|[&#\s])/)?.[1]
  const labeledCode = normalized.match(
    /(?:원정|균열|RIFT|EXPEDITION)?\s*(?:코드|CODE)\s*[:·#-]?\s*([0-9A-Z]{1,6})(?=$|[^0-9A-Z])/,
  )?.[1]
  const candidate = queryCode ?? labeledCode ?? (/^[0-9A-Z]{1,6}$/.test(normalized) ? normalized : null)
  if (!candidate) return null
  const seed = seedForRunCode(candidate)
  return seed === null ? null : runCodeFor(seed)
}

export type MasteryContractId = 'fading-hearth' | 'winter-rations' | 'silent-standard'
export type OathId = 'hearthkeepers' | 'signal-corps' | 'salvagers'
export type NightConditionId =
  | 'crown-pressure'
  | 'dead-signal'
  | 'ember-gale'
  | 'supply-drift'
  | 'glass-ground'
  | 'still-stars'
export type TrialId =
  | 'intent-reader'
  | 'unbroken-four'
  | 'united-front'
  | 'relic-bearer'
  | 'renown-keeper'
  | 'bright-hearth'
export type EndingId = 'hearth-dawn' | 'ember-crown' | 'crownless-dawn' | 'broken-watch' | 'frozen-choir' | 'last-march'
type FinalVowId = 'shared-flame' | 'perfected-edge' | 'hearth-circle' | 'signal-beacon' | 'salvaged-crown'
type FinalMarchImprintId =
  | 'linked-hearths'
  | 'measured-rations'
  | 'starless-route'
  | 'ghost-formation'
  | 'folded-retreat'
  | 'burning-vanguard'
  | 'unveiled-command'
  | 'raised-ember'
  | 'woven-standard'
export type BattleOrder = 'hold' | 'assault' | 'support'
export type EnemyIntent = 'siege' | 'flank' | 'suppress'
type EnemyDoctrineId =
  | 'frost-ram'
  | 'pack-flank'
  | 'choir-chain'
  | 'hollow-aegis'
  | 'mirror-vow'
  | 'crown-hunt'
  | 'whiteout-execution'
  | 'black-standard'
export type RelicId =
  | 'living-ember'
  | 'quartermasters-knot'
  | 'watchtower-lens'
  | 'winter-blood'
  | 'threefold-banner'
  | 'salvagers-pack'
  | 'rime-steel'
  | 'marching-drum'
export type ResonanceId = 'ember-pulse' | 'whiteout-sight' | 'threefold-cadence' | 'long-road-ledger'
export type LegacyId =
  | 'banked-ember'
  | 'supply-cache'
  | 'veteran-oath'
  | 'command-seal'
  | 'chroniclers-ink'
  | 'salvagers-instinct'
export type AchievementId =
  | 'first-watch'
  | 'first-resonance'
  | 'unbroken-wall'
  | 'intent-breaker'
  | 'threefold-company'
  | 'last-spark'
  | 'crown-breaker'
  | 'whiteout-victor'
  | 'seventh-dawn'
  | 'threefold-oath'
  | 'shared-dawn'
  | 'ending-shared-flame'
  | 'ending-ember-crown'
  | 'ending-crownless-spring'
  | 'ending-broken-watch'
  | 'ending-frozen-choir'
  | 'ending-last-march'
  | 'protocol-guided-flame'
  | 'protocol-tactical-recovery'
  | 'protocol-whiteout-law'
  | 'oath-three-hearths'
  | 'oath-three-signals'
  | 'oath-crown-reclaimed'
type GameStatus = 'playing' | 'won' | 'lost'
export type Phase =
  | 'event'
  | 'camp'
  | 'battling'
  | 'result'
  | 'interlude'
  | 'finale'
  | 'relic'
  | 'promotion'
  | 'won'
  | 'lost'
export type SoundEffect =
  | 'select'
  | 'merge'
  | 'deploy'
  | 'recruit'
  | 'fire'
  | 'battle'
  | 'boss'
  | 'impact'
  | 'crown'
  | 'finale'
  | 'win'
  | 'lose'
  | 'relic'
  | 'milestone'
  | 'seal'
export type SoundscapeMood = 'title' | 'hearth' | 'whiteout' | 'battle' | 'boss' | 'dawn' | 'mourning'
type MilestoneKind = 'achievement' | 'rank' | 'resonance' | 'legacy' | 'crown' | 'growth'
export type ArchiveTab = 'map' | 'chronicle' | 'codex' | 'legacy'
type MotionPreference = 'system' | 'reduced'
type BattlePace = 'cinematic' | 'swift'
export type ActiveLayer =
  | 'session'
  | 'update'
  | 'title'
  | 'install'
  | 'guide'
  | 'event'
  | 'archive'
  | 'settings'
  | 'menu'
  | 'battle'
  | 'interlude'
  | 'finale'
  | 'relic'
  | 'promotion'
  | 'result'
  | 'ending'
export type TutorialStep = 'merge' | 'deploy' | 'orders' | 'focus' | 'battle'
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
export type StandaloneNavigator = Navigator & { standalone?: boolean }

export type GameSettings = {
  sound: boolean
  effectsVolume: number
  ambienceVolume: number
  haptics: boolean
  motion: MotionPreference
  battlePace: BattlePace
  largeText: boolean
  highContrast: boolean
}

export type SoundscapePreset = {
  lowFrequency: number
  highFrequency: number
  harmonicFrequency: number
  toneFilterFrequency: number
  windFrequency: number
  lowLevel: number
  highLevel: number
  harmonicLevel: number
  windLevel: number
  tremoloRate: number
  tremoloDepth: number
  pulseRate: number
  pulseDepth: number
  masterLevel: number
}

export type AmbientSession = {
  mood: SoundscapeMood
  targetLevel: number
  gain: GainNode
  toneFilter: BiquadFilterNode
  windFilter: BiquadFilterNode
  lowDrone: OscillatorNode
  highDrone: OscillatorNode
  harmonicDrone: OscillatorNode
  lowGain: GainNode
  highGain: GainNode
  harmonicGain: GainNode
  windGain: GainNode
  tremolo: OscillatorNode
  tremoloDepth: GainNode
  pulse: OscillatorNode
  pulseDepth: GainNode
  nodes: AudioScheduledSourceNode[]
}

export type MilestoneNotice = {
  id: string
  kind: MilestoneKind
  glyph: string
  kicker: string
  title: string
  description: string
  detail: string
}

export type Unit = {
  id: string
  kind: UnitKind
  tier: number
  specialization: SpecializationId | null
}

export type RenownLedgerEntry = {
  total: number
  legacyBonus: number
  contractBonus: number
}

export type RenownLedger = {
  battle: RenownLedgerEntry
  event: RenownLedgerEntry
  marchSeal: RenownLedgerEntry
}

export type Enemy = {
  id: string
  kind: UnitKind
  tier: number
  name: string
  intent: EnemyIntent
  elite: boolean
  doctrine: EnemyDoctrineId | null
}

export type GameState = {
  campaignStarted: boolean
  day: number
  difficulty: Difficulty
  mode: RunMode
  oath: OathId
  masteryContract: MasteryContractId | null
  runId: number
  runSeed: number
  activeLegacy: LegacyId[]
  heat: number
  supplies: number
  recoverySupplies: number
  morale: number
  recruits: number
  score: number
  renownLedger: RenownLedger
  perfectNights: number
  intentsCountered: number
  unitedVictories: number
  battles: number
  victories: number
  bossesDefeated: number
  relics: RelicId[]
  pendingRelic: boolean
  orders: BattleOrder[]
  eventResolvedForDay: number
  decisions: string[]
  legacyAwarded: boolean
  legacyReward: number
  failureInsights: FailureInsight[]
  slots: Array<Unit | null>
  lineup: Array<string | null>
  status: GameStatus
}

export type ExpeditionRecord = {
  runId: number
  seed: number
  mode: RunMode
  difficulty: Difficulty
  oath: OathId
  masteryContract: MasteryContractId | null
  activeLegacy: LegacyId[]
  ending: EndingId
  won: boolean
  day: number
  score: number
  legacyReward: number
  failureInsights: FailureInsight[]
  perfectNights: number
  trialsCompleted: number
  relics: RelicId[]
}

export function expeditionComparisonKey(
  record: Pick<ExpeditionRecord, 'seed' | 'difficulty' | 'oath' | 'masteryContract' | 'activeLegacy'>,
): string {
  const legacyLoadout = [...record.activeLegacy].sort().join(',')
  return [record.seed, record.difficulty, record.oath, record.masteryContract ?? 'none', legacyLoadout || 'none'].join(
    '|',
  )
}

export type LegacyRewardBreakdown = {
  renown: number
  crowns: number
  trials: number
  protocol: number
  dawn: number
  recovery: number
  total: number
}

export type LegacyMasteryProgress = {
  level: number
  sealLabel: string
  glyph: string
  title: string
  description: string
  current: number
  target: number
  remaining: number
  progress: number
  nextTitle: string
}

export type MetaState = {
  embers: number
  completedRuns: number
  legacy: LegacyId[]
  masteredContracts: MasteryContractId[]
  achievements: AchievementId[]
  discoveredRelics: RelicId[]
  history: ExpeditionRecord[]
}

export type GameBackup = {
  game: GameState
  meta: MetaState
  settings: GameSettings
  bestScore: number
  guide: 'seen' | 'replay' | null
}

export type StorageProtection = 'checking' | 'persistent' | 'standard' | 'unavailable'
export type SessionAccess = 'checking' | 'active' | 'blocked' | 'error'
export type CampUndoKind = 'merge' | 'recruit' | 'stoke' | 'march-seal'

export type CampUndo = {
  kind: CampUndoKind
  game: GameState
  selectedUnitId: string | null
  tutorialStep: TutorialStep | null
  label: string
  detail: string
}

export type LaneResult = {
  lane: number
  unit: Unit
  enemy: Enemy
  playerPower: number
  enemyPower: number
  relation: 'advantage' | 'neutral' | 'disadvantage'
  order: BattleOrder
  intent: EnemyIntent
  countered: boolean
  supportBonus: number
  specializationActive: boolean
  specializationBonus: number
  resonanceIds: ResonanceId[]
  resonanceBonus: number
  decisionEchoActive: boolean
  decisionEchoBonus: number
  finalMarchImprintIds: FinalMarchImprintId[]
  finalMarchImprintBonus: number
  finalVowActive: boolean
  finalVowBonus: number
  doctrineBroken: boolean
  doctrineMultiplier: number
  won: boolean
}

export type DeploymentForecast = {
  lane: number
  action: 'current' | 'deploy' | 'replace' | 'move' | 'swap'
  outcome: 'current' | 'breakthrough' | 'improve' | 'steady' | 'risk'
  relation: LaneResult['relation']
  playerPower: number
  enemyPower: number
  won: boolean
  currentWon: boolean | null
  powerDelta: number | null
  winsBefore: number
  winsAfter: number
  lineupReadyBefore: boolean
  lineupReadyAfter: boolean
  victoryBefore: boolean
  victoryAfter: boolean
  securesLane: boolean
  losesLane: boolean
  securesVictory: boolean
  losesVictory: boolean
  sourceLane: number | null
  targetUnitId: string | null
}

type FailureCause = 'crown' | 'doctrine' | 'intent' | 'affinity' | 'tier' | 'power'

export type FailureInsight = {
  lane: number
  cause: FailureCause
  glyph: string
  label: string
  detail: string
  action: string
  gap: number
  priority: number
}

export type ExpeditionRank = 'S' | 'A' | 'B' | 'C' | 'D'

export type MarchSealCeremony = {
  id: number
  supplies: number
  scoreGain: number
  legacyScoreBonus: number
  contractScoreBonus: number
  masteryContract: MasteryContractId | null
  scoreBefore: number
  scoreAfter: number
  reserve: number
  recoveryReserve: number
  rankBefore: ExpeditionRank
  rankAfter: ExpeditionRank
}

export type GrowthCeremony = {
  id: number
  unitId: string
  name: string
  kind: UnitKind
  fromTier: number
  toTier: number
  powerBefore: number
  powerAfter: number
  heatBefore: number
  heatAfter: number
  warmth: number
  opensPromotion: boolean
  specialization: SpecializationId | null
}

export type BattleResult = {
  victory: boolean
  wins: number
  lanes: LaneResult[]
  supplyReward: number
  legacySupplyBonus: number
  protocolSupplyBonus: number
  protocolScoreBonus: number
  crownBreakCount: number
  crownMasteryBonus: number
  decisionEcho: ActiveDecisionEcho | null
  finalVow: ActiveFinalVow | null
  decisionHeatShield: number
  decisionHeatProtected: number
  heatDelta: number
  moraleDelta: number
  scoreReward: number
  legacyScoreBonus: number
  contractScoreBonus: number
  focusLane: number
  boss: boolean
}

export type TacticalAdjustment =
  | {
      kind: 'order'
      lane: number
      order: BattleOrder
      result: BattleResult
      commandSpent: number
      rank: number[]
    }
  | {
      kind: 'focus'
      lane: number
      order: null
      result: BattleResult
      commandSpent: number
      rank: number[]
    }

export type SavedBattle = {
  runId: number
  battles: number
  day: number
  focusLane: number
}

export type DragSession = {
  pointerId: number
  unitId: string
  startX: number
  startY: number
  touch: boolean
  dragging: boolean
}

export type BattleContext = {
  relics: RelicId[]
  heat: number
  morale: number
  focusLane: number
  day: number
  difficulty: Difficulty
  oath: OathId
  runSeed: number
  orders: BattleOrder[]
  legacy: LegacyId[]
  formationKinds: UnitKind[]
  formationTiers: number[]
  enemyIntents: EnemyIntent[]
  decisionEcho: ActiveDecisionEcho | null
  finalMarchImprints: ActiveFinalMarchImprint[]
  finalVow: ActiveFinalVow | null
}

type DecisionEchoCondition =
  | 'all'
  | 'hold'
  | 'countered'
  | 'focus'
  | 'assault'
  | 'advantage'
  | 'supported'
  | 'mixed-orders'
  | 'focus-countered'

type DecisionEcho = {
  triggerDay: number
  glyph: string
  name: string
  story: string
  effect: string
  condition?: DecisionEchoCondition
  laneBonus?: number
  heatShield?: number
}

type ActiveDecisionEcho = DecisionEcho & {
  choiceId: string
  sourceDay: number
  sourceEvent: string
  sourceChoice: string
}

type FinalMarchImprint = {
  glyph: string
  label: string
  name: string
  story: string
  effect: string
  crownLink: string
  condition: DecisionEchoCondition
  laneBonus: number
}

type ActiveFinalMarchImprint = FinalMarchImprint & {
  id: FinalMarchImprintId
  choiceId: string
  sourceDay: number
  sourceChoice: string
}

type FinalVow = {
  glyph: string
  label: string
  name: string
  story: string
  effect: string
  condition: 'all' | 'focus'
  laneBonus: number
  legacyTitle: string
  legacyDescription: string
  witness: string
}

type ActiveFinalVow = FinalVow & {
  id: FinalVowId
  choiceId: string
  sourceChoice: string
}

export type NightCondition = {
  name: string
  glyph: string
  label: string
  description: string
  enemyScale: number
  scoreScale: number
  supplyDelta: number
  heatDelta: number
  moraleDelta: number
  commandDelta: number
  focusBonus: number
  counterBonus: number
  neutralBonus: number
}

type DifficultyConfig = {
  name: string
  subtitle: string
  glyph: string
  label: string
  description: string
  ruleName: string
  ruleDescription: string
  combatSummary: string
  economySummary: string
  enemyScale: number
  scoreScale: number
  heatShield: number
  startingHeat: number
  startingSupplies: number
  commandBonus: number
  focusBonus: number
  counteredIntentScale: number
  exposedIntentBonus: number
  recruitCostDelta: number
  stokeCost: number
  stokeHeat: number
  mergeHeatBonus: number
  supplyScale: number
  counterSupplyBonus: number
  perfectSupplyBonus: number
  defeatSupply: number
  perfectScoreBonus: number
}

type ProtocolMasteryConfig = {
  achievement: AchievementId
  glyph: string
  label: string
  name: string
  requirement: string
  metricLabel: string
  target: number
  metric: 'heat' | 'intents' | 'perfect-nights'
}

export type ProtocolMasteryProgress = ProtocolMasteryConfig & {
  current: number
  metricReady: boolean
  completed: boolean
  clearedNights: number
  progress: number
  currentLabel: string
}

type NightStory = {
  act: number
  title: string
  location: string
  weather: string
  omen: string
  report: string
  enemyScale: number
  boss: boolean
  rule: string
}

export type BossMechanic = {
  name: string
  epithet: string
  glyph: string
  phase: string
  description: string
  pressureCopy: string
}

export type FinalCrownSeal = {
  lane: 0 | 1 | 2
  name: string
  glyph: string
  label: string
  requirement: string
  pressure: string
  activeMultiplier: number
  brokenMultiplier: number
}

type EnemyDoctrine = {
  name: string
  glyph: string
  label: string
  description: string
  counterplay: string
  commandFloor?: number
}

type EliteEncounter = {
  lane: number
  doctrine: EnemyDoctrineId
  name: string
  epithet: string
  phase: string
}

type ActTransition = {
  fromAct: number
  toAct: number
  label: string
  glyph: string
  title: string
  route: string
  description: string
  warning: string
  directive: string
  artPosition: string
}

type EndingRoute = {
  family: 'dawn' | 'fallen'
  label: string
  requirement: string
  strategy: string
  recommendedOath: OathId | null
}

export type EndingDiscoveryEntry = {
  id: EndingId
  discovered: boolean
  current: boolean
  recordCount: number
}

export type EventChoice = {
  id: string
  title: string
  description: string
  outcome: string
  supplies?: number
  heat?: number
  morale?: number
  score?: number
  recruit?: boolean
  upgrade?: boolean
  requiresSupplies?: number
  echo?: DecisionEcho
  marchImprint?: FinalMarchImprintId
  finalVow?: FinalVowId
  oathOnly?: OathId
  emergencyOnly?: boolean
}

type OathChronicle = {
  label: string
  title: string
  description: string
  witness: string
  stages: readonly [
    { day: 4; name: string; promise: string },
    { day: 8; name: string; promise: string },
    { day: 12; name: string; promise: string },
  ]
}

export type EventRouteState = 'locked' | 'critical' | 'strained' | 'ready' | 'secure'

export type EventChoiceForecast = {
  state: EventRouteState
  route: string
  label: string
  detail: string
  projectedSupplies: number
  projectedRecoverySupplies: number
  recoverySuppliesSpent: number
  projectedHeat: number
  projectedMorale: number
  scoreGain: number
  legacyScoreBonus: number
  contractScoreBonus: number
  masteryContract: MasteryContractId | null
  conversionMorale: number
}

export type CampaignEvent = {
  title: string
  location: string
  body: string
  routeVariant?: 1 | 2
  choices: EventChoice[]
}

export const KIND_META: Record<
  UnitKind,
  {
    name: string
    role: string
    glyph: string
    strongAgainst: UnitKind
    advantageCopy: string
  }
> = {
  warden: {
    name: '수호대',
    role: '방패',
    glyph: '◆',
    strongAgainst: 'ranger',
    advantageCopy: '활을 막아냄',
  },
  ranger: {
    name: '설원대',
    role: '활',
    glyph: '⌁',
    strongAgainst: 'raider',
    advantageCopy: '도끼를 견제',
  },
  raider: {
    name: '척후대',
    role: '도끼',
    glyph: '✦',
    strongAgainst: 'warden',
    advantageCopy: '방패를 돌파',
  },
}

export const SPECIALIZATIONS: Record<
  SpecializationId,
  { kind: UnitKind; name: string; glyph: string; subtitle: string; description: string; detail: string }
> = {
  'ember-bulwark': {
    kind: 'warden',
    name: '불씨 방벽',
    glyph: '◈',
    subtitle: '집중 수비',
    description: '화로 집중 전선에서 전투력 +20% · IV 등급은 +25%',
    detail: '방패 뒤에 불씨를 품어, 가장 위험한 한 전선을 성채로 만듭니다.',
  },
  'oath-anchor': {
    kind: 'warden',
    name: '맹세의 닻',
    glyph: '⬡',
    subtitle: '방벽 숙련',
    description: '방벽 명령을 받으면 전투력 +18% · IV 등급은 +23%',
    detail: '물러서지 않겠다는 맹세가 대열 전체를 설원에 붙잡아 둡니다.',
  },
  'storm-eye': {
    kind: 'ranger',
    name: '폭풍의 눈',
    glyph: '⌁',
    subtitle: '의도 파훼',
    description: '적 의도를 파훼하면 전투력 +18% · IV 등급은 +23%',
    detail: '눈보라가 갈라지는 찰나를 읽고, 적이 움직이기 전에 화살을 놓습니다.',
  },
  'ghost-string': {
    kind: 'ranger',
    name: '유령 시위',
    glyph: '◎',
    subtitle: '우세 강화',
    description: '병과 상성이 우세하면 전투력 +20% · IV 등급은 +25%',
    detail: '한 번 당긴 활시위가 세 방향에서 울려 적의 퇴로까지 끊습니다.',
  },
  'frost-breaker': {
    kind: 'raider',
    name: '서리 파쇄자',
    glyph: '✕',
    subtitle: '돌격 숙련',
    description: '돌격 명령을 받으면 전투력 +20% · IV 등급은 +25%',
    detail: '도끼날이 얼음을 가르는 순간, 뒤따르는 대열이 균열을 넓힙니다.',
  },
  'last-brand': {
    kind: 'raider',
    name: '마지막 낙인',
    glyph: '✦',
    subtitle: '위기 돌파',
    description: '화로 온기 50% 이하에서 전투력 +22% · IV 등급은 +27%',
    detail: '꺼져 가는 불을 피부에 새기고, 가장 추운 밤에 가장 거칠게 싸웁니다.',
  },
}

export const SPECIALIZATIONS_BY_KIND: Record<UnitKind, [SpecializationId, SpecializationId]> = {
  warden: ['ember-bulwark', 'oath-anchor'],
  ranger: ['storm-eye', 'ghost-string'],
  raider: ['frost-breaker', 'last-brand'],
}

export const SPECIALIZATION_IDS = Object.keys(SPECIALIZATIONS) as SpecializationId[]

export const SURVIVOR_NAMES: Record<UnitKind, string[]> = {
  warden: ['브람', '에다', '오르센', '마라', '토른', '리안', '발데르', '시그'],
  ranger: ['세라', '이븐', '키라', '로웬', '엘린', '노아', '베카', '아른'],
  raider: ['바르카', '헤일', '도르', '케른', '사브', '울프', '라그', '브린'],
}
export const SURVIVOR_EPITHETS = [
  '서리길',
  '잿불',
  '북벽',
  '긴밤',
  '흰숨',
  '새벽',
  '눈매',
  '불씨',
  '빙하',
  '매듭',
  '겨울숲',
  '달그늘',
  '바람끝',
  '푸른철',
  '먼별',
  '귀환',
] as const

export const UNIT_ROTATION: UnitKind[] = ['warden', 'ranger', 'raider', 'ranger', 'warden', 'raider']

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  story: {
    name: '불씨 이야기',
    subtitle: '서사 중심',
    glyph: '✦',
    label: 'GUIDED FLAME',
    description: '화로의 안내를 받아 전술을 익히면서 이야기와 빌드 완성에 집중합니다.',
    ruleName: '길잡이 불씨',
    ruleDescription: '명령 점수 +1, 화로 집중 전선의 위력이 추가로 10%p 증가합니다.',
    combatSummary: '명령 점수 +1 · 화로 집중 보정 +10%p',
    economySummary: '온기 92 · 보급 64 · 장작 12 → 온기 +20 · 후퇴 보급 6부터 감소',
    enemyScale: 0.86,
    scoreScale: 0.82,
    heatShield: 5,
    startingHeat: 92,
    startingSupplies: 64,
    commandBonus: 1,
    focusBonus: 0.1,
    counteredIntentScale: 0.92,
    exposedIntentBonus: 0,
    recruitCostDelta: -2,
    stokeCost: 12,
    stokeHeat: 20,
    mergeHeatBonus: 2,
    supplyScale: 1.12,
    counterSupplyBonus: 0,
    perfectSupplyBonus: 0,
    defeatSupply: 6,
    perfectScoreBonus: 0,
  },
  expedition: {
    name: '원정대',
    subtitle: '권장 난이도',
    glyph: '⌘',
    label: 'TACTICAL RECOVERY',
    description: '읽어 낸 적 의도가 다음 날의 보급이 되는, 전술과 성장의 균형 규칙입니다.',
    ruleName: '전술 회수',
    ruleDescription: '승리 시 파훼한 의도마다 보급 +3, 세 전선을 모두 지키면 보급 +9를 얻습니다.',
    combatSummary: '의도 파훼당 승리 보급 +3 · 완벽 방어 보급 +9',
    economySummary: '온기 84 · 보급 58 · 장작 14 → 온기 +18 · 후퇴 보급 7부터 감소',
    enemyScale: 1,
    scoreScale: 1,
    heatShield: 0,
    startingHeat: 84,
    startingSupplies: 58,
    commandBonus: 0,
    focusBonus: 0,
    counteredIntentScale: 0.94,
    exposedIntentBonus: 0,
    recruitCostDelta: 0,
    stokeCost: 14,
    stokeHeat: 18,
    mergeHeatBonus: 0,
    supplyScale: 1,
    counterSupplyBonus: 3,
    perfectSupplyBonus: 9,
    defeatSupply: 7,
    perfectScoreBonus: 0,
  },
  whiteout: {
    name: '백색 종말',
    subtitle: '2회차 도전',
    glyph: '❄',
    label: 'WHITEOUT LAW',
    description: '틀린 명령은 치명적이지만 완벽한 독해와 방어에 가장 큰 보상이 돌아옵니다.',
    ruleName: '백색 법칙',
    ruleDescription: '미파훼 의도 위협 +10%p. 파훼 효과는 강화되며 완벽 방어에 보급 +14와 명성 보너스가 붙습니다.',
    combatSummary: '미파훼 위협 +10%p · 파훼 위협 추가 -6%p',
    economySummary: '온기 76 · 보급 50 · 장작 16 → 온기 +16 · 후퇴 보급 4부터 감소',
    enemyScale: 1.14,
    scoreScale: 1.3,
    heatShield: -2,
    startingHeat: 76,
    startingSupplies: 50,
    commandBonus: 0,
    focusBonus: 0,
    counteredIntentScale: 0.88,
    exposedIntentBonus: 0.1,
    recruitCostDelta: 2,
    stokeCost: 16,
    stokeHeat: 16,
    mergeHeatBonus: -1,
    supplyScale: 0.88,
    counterSupplyBonus: 0,
    perfectSupplyBonus: 14,
    defeatSupply: 4,
    perfectScoreBonus: 900,
  },
}

export const PROTOCOL_MASTERIES: Record<Difficulty, ProtocolMasteryConfig> = {
  story: {
    achievement: 'protocol-guided-flame',
    glyph: '✦',
    label: 'GUIDED FLAME MASTERY',
    name: '꺼지지 않는 길잡이',
    requirement: '불씨 이야기 12일 완주 · 최종 온기 45% 이상',
    metricLabel: '온기 유지',
    target: 45,
    metric: 'heat',
  },
  expedition: {
    achievement: 'protocol-tactical-recovery',
    glyph: '⌘',
    label: 'TACTICAL RECOVERY MASTERY',
    name: '설원의 회수관',
    requirement: '원정대 12일 완주 · 적 의도 누적 24회 이상 파훼',
    metricLabel: '의도 파훼',
    target: 24,
    metric: 'intents',
  },
  whiteout: {
    achievement: 'protocol-whiteout-law',
    glyph: '❄',
    label: 'WHITEOUT LAW MASTERY',
    name: '무결의 백색 지휘',
    requirement: '백색 종말 12일 완주 · 완벽 방어 6회 이상',
    metricLabel: '완벽 방어',
    target: 6,
    metric: 'perfect-nights',
  },
}

export function retreatSupplyFor(difficulty: Difficulty, priorDefeats: number): number {
  return Math.max(2, DIFFICULTIES[difficulty].defeatSupply - Math.max(0, priorDefeats) * 2)
}

export const OATHS: Record<
  OathId,
  {
    name: string
    subtitle: string
    glyph: string
    description: string
    benefit: string
    burden: string
    scoreScale: number
    victorySupplyDelta: number
  }
> = {
  hearthkeepers: {
    name: '화로지기의 서약',
    subtitle: '합성과 생존',
    glyph: '✦',
    description: '병사를 합칠 때 더 많은 온기를 되찾고, 혹한의 소모를 견딥니다.',
    benefit: '합성 온기 +3 · 온기 손실 2 감소 · 명성 +8%',
    burden: '승리 보급품 -6',
    scoreScale: 1.08,
    victorySupplyDelta: -6,
  },
  'signal-corps': {
    name: '신호단의 서약',
    subtitle: '명령과 파훼',
    glyph: '⌘',
    description: '전리품 일부를 신호망에 쓰며 명령을 하나 더 내리지만, 읽지 못한 적 의도는 더 치명적입니다.',
    benefit: '매 전투 명령 점수 +1 · 명성 +12%',
    burden: '승리 보급품 -8 · 파훼하지 못한 의도 위력 증가',
    scoreScale: 1.12,
    victorySupplyDelta: -8,
  },
  salvagers: {
    name: '회수대의 서약',
    subtitle: '보급과 증원',
    glyph: '◈',
    description: '값싼 신호탄과 풍부한 전리품으로 빠르게 대기소를 성장시킵니다.',
    benefit: '신호탄 -4 · 승리 보급품 +12 · 명성 +10%',
    burden: '시작 온기 -10',
    scoreScale: 1.1,
    victorySupplyDelta: 12,
  },
}

export const OATH_CHRONICLES: Record<OathId, OathChronicle> = {
  hearthkeepers: {
    label: 'HEARTHKEEPER COVENANT',
    title: '세 번 이어진 화로',
    description: '각 왕관 앞에서 누구도 혼자 남기지 않는 결단을 이어, 서약 자체를 하나의 새벽으로 완성합니다.',
    witness: '북부 화로 연맹 창립문',
    stages: [
      { day: 4, name: '피난로의 불', promise: '무너지는 국경 성문까지 화로의 온기를 이어 붙입니다.' },
      { day: 8, name: '심장에 건넨 온기', promise: '빙하의 심장에도 살아 있는 이들의 이름을 들려줍니다.' },
      { day: 12, name: '서로의 이름으로 타오르기', promise: '왕좌 앞에서 남은 불씨를 모든 전선의 이름으로 나눕니다.' },
    ],
  },
  'signal-corps': {
    label: 'SIGNAL CORPS COVENANT',
    title: '세 번 울린 응답',
    description: '왕관의 거짓 박자를 세 차례 해독해, 마지막 명령이 눈보라 전체를 가르는 신호망을 완성합니다.',
    witness: '북부 신호망 최종 교신록',
    stages: [
      { day: 4, name: '거짓 종의 기만', promise: '첫 왕관이 잘못된 전선에 병력을 쏟도록 가짜 경보를 울립니다.' },
      { day: 8, name: '심장 박자의 해독', promise: '푸른 심장의 박동을 읽을 수 있는 전장 신호로 바꿉니다.' },
      { day: 12, name: '왕좌를 가른 마지막 신호', promise: '세 전선의 응답을 한 번의 왕관 파쇄 명령으로 묶습니다.' },
    ],
  },
  salvagers: {
    label: 'SALVAGER COVENANT',
    title: '왕관까지 이어진 회수선',
    description: '왕관이 남긴 모든 잔해를 다음 전선의 자재로 돌려, 설원의 종말까지 보급로를 끊기지 않게 만듭니다.',
    witness: '해빙기 회수대 첫 장부',
    stages: [
      { day: 4, name: '성문의 톱니', promise: '버려진 성문 장치를 해체해 첫 왕관전의 장비로 되돌립니다.' },
      { day: 8, name: '푸른 결정의 광맥', promise: '빙하 심장 속 보급 광맥을 표시해 마지막 행군에 남깁니다.' },
      {
        day: 12,
        name: '왕관을 자재로 돌려놓기',
        promise: '왕의 상징을 해체해 살아남은 이들의 첫 정착 자재로 바꿉니다.',
      },
    ],
  },
}

export const OATH_CHRONICLE_ACHIEVEMENTS: Record<OathId, AchievementId> = {
  hearthkeepers: 'oath-three-hearths',
  'signal-corps': 'oath-three-signals',
  salvagers: 'oath-crown-reclaimed',
}

export const NIGHT_CONDITIONS: Record<NightConditionId, NightCondition> = {
  'crown-pressure': {
    name: '왕관의 압력',
    glyph: '♜',
    label: '고위험 교전',
    description: '적 위력 +7% · 획득 명성 +14%',
    enemyScale: 0.07,
    scoreScale: 1.14,
    supplyDelta: 0,
    heatDelta: 0,
    moraleDelta: 0,
    commandDelta: 0,
    focusBonus: 0,
    counterBonus: 0,
    neutralBonus: 0,
  },
  'dead-signal': {
    name: '끊어진 신호',
    glyph: '⌁',
    label: '정밀 지휘',
    description: '명령 점수 -1 · 의도 파훼 위력 증가 · 명성 +10%',
    enemyScale: 0,
    scoreScale: 1.1,
    supplyDelta: 0,
    heatDelta: 0,
    moraleDelta: 0,
    commandDelta: -1,
    focusBonus: 0,
    counterBonus: 0.1,
    neutralBonus: 0,
  },
  'ember-gale': {
    name: '불씨 역풍',
    glyph: '↟',
    label: '집중 돌파',
    description: '집중 전선 위력 +12% · 전투 후 온기 -4 · 명성 +8%',
    enemyScale: 0,
    scoreScale: 1.08,
    supplyDelta: 0,
    heatDelta: -4,
    moraleDelta: 0,
    commandDelta: 0,
    focusBonus: 0.12,
    counterBonus: 0,
    neutralBonus: 0,
  },
  'supply-drift': {
    name: '보급 설류',
    glyph: '▣',
    label: '풍요로운 위험',
    description: '적 위력 +4% · 승리 보급품 +18 · 명성 +4%',
    enemyScale: 0.04,
    scoreScale: 1.04,
    supplyDelta: 18,
    heatDelta: 0,
    moraleDelta: 0,
    commandDelta: 0,
    focusBonus: 0,
    counterBonus: 0,
    neutralBonus: 0,
  },
  'glass-ground': {
    name: '유리 빙판',
    glyph: '◇',
    label: '대등 전선 강화',
    description: '대등 상성 위력 +18% · 적 위력 +5% · 명성 +8%',
    enemyScale: 0.05,
    scoreScale: 1.08,
    supplyDelta: 0,
    heatDelta: 0,
    moraleDelta: 0,
    commandDelta: 0,
    focusBonus: 0,
    counterBonus: 0,
    neutralBonus: 0.18,
  },
  'still-stars': {
    name: '고요한 별빛',
    glyph: '✧',
    label: '사기 회복',
    description: '적 위력 +4% · 전투 후 사기 +4 · 명성 +7%',
    enemyScale: 0.04,
    scoreScale: 1.07,
    supplyDelta: 0,
    heatDelta: 0,
    moraleDelta: 4,
    commandDelta: 0,
    focusBonus: 0,
    counterBonus: 0,
    neutralBonus: 0,
  },
}

export const TRIALS: Record<
  TrialId,
  { name: string; glyph: string; description: string; target: number; reward: number }
> = {
  'intent-reader': {
    name: '눈보라 해독',
    glyph: '⌁',
    description: '승리한 밤에 적 의도 12회 파훼',
    target: 12,
    reward: 3,
  },
  'unbroken-four': {
    name: '네 번의 철벽',
    glyph: '◆',
    description: '완벽 방어 4회',
    target: 4,
    reward: 3,
  },
  'united-front': {
    name: '세 갈래 전선',
    glyph: '≋',
    description: '세 병과 진형으로 5회 승리',
    target: 5,
    reward: 3,
  },
  'relic-bearer': {
    name: '유물 운반자',
    glyph: '◈',
    description: '유물 4개 수집',
    target: 4,
    reward: 3,
  },
  'renown-keeper': {
    name: '설원의 기록관',
    glyph: '♜',
    description: '명성 27,000 달성',
    target: 27_000,
    reward: 3,
  },
  'bright-hearth': {
    name: '밝은 귀환',
    glyph: '✦',
    description: '승리 시 온기 60% 유지',
    target: 60,
    reward: 3,
  },
}

export const ENDINGS: Record<
  EndingId,
  { label: string; title: string; glyph: string; description: string; epilogue: string; witness: string }
> = {
  'hearth-dawn': {
    label: 'ENDING I · THE SHARED FLAME',
    title: '모두의 새벽',
    glyph: '✦',
    description:
      '왕관은 녹았고, 당신은 남은 불을 가장 약한 이들과 나눴습니다. 설원 곳곳의 작은 화로가 서로를 비추며 새로운 도시가 되었습니다.',
    epilogue: '그날 이후 북부에서는 가장 큰 불이 아니라, 가장 멀리 나뉜 불을 새벽이라 불렀습니다.',
    witness: '북부 공동체 첫 연대기',
  },
  'ember-crown': {
    label: 'ENDING II · THE EMBER CROWN',
    title: '불꽃의 왕관',
    glyph: '♜',
    description:
      '긴 밤은 끝났지만 왕좌는 비어 있지 않았습니다. 원정대의 명성과 불씨가 하나의 새 왕관이 되어 북방의 질서를 다시 세웠습니다.',
    epilogue: '얼음 왕좌 위에 놓인 새 왕관은 복종이 아니라, 다시는 불을 빼앗기지 않겠다는 맹세로 타올랐습니다.',
    witness: '신생 북방령 즉위 기록',
  },
  'crownless-dawn': {
    label: 'ENDING III · CROWNLESS SPRING',
    title: '왕관 없는 봄',
    glyph: '◇',
    description:
      '세 개의 왕관은 봄물에 흘려보냈습니다. 누구도 왕좌에 앉지 않았고, 살아남은 이들은 각자의 길에 화로를 세웠습니다.',
    epilogue: '왕좌는 끝내 비어 있었고, 그 빈자리가 모든 사람이 돌아갈 수 있는 길이 되었습니다.',
    witness: '해빙기 자유 정착민 기록',
  },
  'broken-watch': {
    label: 'FALLEN ENDING I · THE BROKEN WATCH',
    title: '무너진 첫 망루',
    glyph: '▱',
    description:
      '국경의 첫 불빛이 너무 일찍 사라졌습니다. 그러나 매몰된 망루의 기록은 다음 원정대가 피해야 할 길을 남겼습니다.',
    epilogue: '눈은 이름을 덮었지만, 마지막 보초가 새긴 화살표만은 다음 원정의 첫 지도가 되었습니다.',
    witness: '북부 망루 매몰 보고서',
  },
  'frozen-choir': {
    label: 'FALLEN ENDING II · THE FROZEN CHOIR',
    title: '얼어붙은 성가',
    glyph: '≋',
    description:
      '원정대의 발걸음은 공허 성당에서 멎었습니다. 마지막 목소리는 얼음 아래 남아 다음 불씨가 다가오기를 기다립니다.',
    epilogue: '합창은 한 목소리를 더 얻었지만, 그 목소리는 끝까지 왕의 이름 대신 화로의 위치를 노래했습니다.',
    witness: '유리 협곡 구조대 채록',
  },
  'last-march': {
    label: 'FALLEN ENDING III · THE LAST MARCH',
    title: '왕좌 앞의 마지막 행군',
    glyph: '⚑',
    description:
      '새벽은 손에 닿을 만큼 가까웠지만 마지막 온기가 먼저 사라졌습니다. 검은 빙벽에는 끝까지 전진한 이름들이 새겨졌습니다.',
    epilogue: '그들이 왕좌에 닿지는 못했어도, 남겨 둔 발자국은 다음 불씨가 길을 잃지 않을 만큼 깊었습니다.',
    witness: '검은 빙벽 최후 원정록',
  },
}

export const ENDING_ACHIEVEMENTS: Record<EndingId, AchievementId> = {
  'hearth-dawn': 'ending-shared-flame',
  'ember-crown': 'ending-ember-crown',
  'crownless-dawn': 'ending-crownless-spring',
  'broken-watch': 'ending-broken-watch',
  'frozen-choir': 'ending-frozen-choir',
  'last-march': 'ending-last-march',
}

export const ENDING_ROUTES: Record<EndingId, EndingRoute> = {
  'hearth-dawn': {
    family: 'dawn',
    label: 'DAWN I · MERCY ROUTE',
    requirement: '12일 완주 · 자비의 선택 8회 이상',
    strategy: '구조·공동체 선택을 먼저 확보하고 화로지기의 생존 보정으로 마지막 왕관까지 이어 가세요.',
    recommendedOath: 'hearthkeepers',
  },
  'ember-crown': {
    family: 'dawn',
    label: 'DAWN II · RENOWN ROUTE',
    requirement: `12일 완주 · 자비의 선택 7회 이하 · 명성 ${EMBER_CROWN_SCORE.toLocaleString('ko-KR')} 이상`,
    strategy: '완벽 방어와 의도 파훼를 겹치고 신호단의 명성 배율로 왕관 기준을 넘기세요.',
    recommendedOath: 'signal-corps',
  },
  'crownless-dawn': {
    family: 'dawn',
    label: 'DAWN III · FREE ROUTE',
    requirement: `12일 완주 · 자비의 선택 7회 이하 · 명성 ${EMBER_CROWN_SCORE.toLocaleString('ko-KR')} 미만`,
    strategy: '회수대의 안정적인 성장으로 승리선은 지키되 명성 봉인과 완벽 방어를 과도하게 쌓지 마세요.',
    recommendedOath: 'salvagers',
  },
  'broken-watch': {
    family: 'fallen',
    label: 'FALLEN I · BORDER RECORD',
    requirement: '1~4일차에 온기가 0이 되어 원정 종료',
    strategy: '첫 막의 실패가 남긴 기록입니다. 완주를 우선하되 이 구간에서 꺼진 원정도 별도 결말로 보존됩니다.',
    recommendedOath: null,
  },
  'frozen-choir': {
    family: 'fallen',
    label: 'FALLEN II · CATHEDRAL RECORD',
    requirement: '5~8일차에 온기가 0이 되어 원정 종료',
    strategy: '두 번째 왕관 이전의 실패 기록입니다. 성당에서 끝난 원정이 설원의 또 다른 증언이 됩니다.',
    recommendedOath: null,
  },
  'last-march': {
    family: 'fallen',
    label: 'FALLEN III · THRONE RECORD',
    requirement: '9~12일차에 온기가 0이 되어 원정 종료',
    strategy: '왕좌 앞까지 도달한 실패 기록입니다. 마지막 행군에서 꺼진 불씨도 완결된 서사로 남습니다.',
    recommendedOath: null,
  },
}

export const WINNING_ENDING_IDS: EndingId[] = ['hearth-dawn', 'ember-crown', 'crownless-dawn']
export const FALLEN_ENDING_IDS: EndingId[] = ['broken-watch', 'frozen-choir', 'last-march']

export const FINAL_VOWS: Record<FinalVowId, FinalVow> = {
  'shared-flame': {
    glyph: '✦',
    label: 'LAST VOW · SHARED FLAME',
    name: '나뉜 불씨',
    story: '마지막 장작이 세 갈래 불꽃으로 나뉘어, 서로 떨어진 전선의 숨과 박자를 하나로 잇습니다.',
    effect: '세 전선 전투력 +8%',
    condition: 'all',
    laneBonus: 0.08,
    legacyTitle: '불은 사람의 이름으로 남았다',
    legacyDescription:
      '마지막 불씨를 나눠 가진 생존자들은 새벽 뒤에도 각자의 화로를 서로의 이름으로 불렀습니다. 가장 멀리 떨어진 정착지까지 같은 맹세가 이어졌습니다.',
    witness: '마지막 화로 생존자 명부',
  },
  'perfected-edge': {
    glyph: '✕',
    label: 'LAST VOW · PERFECTED EDGE',
    name: '완성된 칼날',
    story: '원정대의 모든 기술이 한 자루의 칼날에 겹쳐져, 화로가 가리킨 전선을 왕관까지 곧게 가릅니다.',
    effect: '화로 집중 전선 전투력 +20%',
    condition: 'focus',
    laneBonus: 0.2,
    legacyTitle: '한 자루가 왕관의 시대를 끝냈다',
    legacyDescription:
      '완성된 칼날은 누구의 왕위도 증명하지 않았습니다. 오직 원정대가 한순간에 모은 기술과 대가를 기억하는 표식으로 왕좌 앞에 남았습니다.',
    witness: '빙관 무기고 봉인 기록',
  },
  'hearth-circle': {
    glyph: '✦',
    label: 'OATH VOW · CIRCLE OF NAMES',
    name: '이름의 화로',
    story: '세 왕관 앞에서 지켜 낸 이름들이 화로 둘레에 겹쳐지고, 흩어진 전선마다 같은 온기가 타오릅니다.',
    effect: '세 전선 전투력 +10%',
    condition: 'all',
    laneBonus: 0.1,
    legacyTitle: '모든 이름이 하나의 새벽이 되었다',
    legacyDescription:
      '세 번의 왕관 앞에서 서로를 남겨 두지 않았던 이들은 새벽 뒤에도 가장 먼 정착지의 이름까지 화로 곁에 새겼습니다. 불은 소유가 아니라 서로를 찾는 길이 되었습니다.',
    witness: '북부 화로 연맹 창립문',
  },
  'signal-beacon': {
    glyph: '⌘',
    label: 'OATH VOW · LAST BEACON',
    name: '마지막 신호',
    story: '세 번 해독한 왕관의 박자가 하나의 청록빛 신호가 되어, 화로가 지목한 전선을 왕좌까지 곧게 연결합니다.',
    effect: '화로 집중 전선 전투력 +22%',
    condition: 'focus',
    laneBonus: 0.22,
    legacyTitle: '마지막 응답이 설원 전체를 깨웠다',
    legacyDescription:
      '눈보라가 멎은 뒤에도 마지막 신호는 북부의 모든 망루를 차례로 깨웠습니다. 서로 보이지 않던 정착지들은 같은 박자로 응답하며 하나의 길이 되었습니다.',
    witness: '북부 신호망 최종 교신록',
  },
  'salvaged-crown': {
    glyph: '◈',
    label: 'OATH VOW · CROWN RECLAIMED',
    name: '회수된 왕관',
    story: '왕좌의 장식과 얼음 결정을 해체한 자재가 세 전선의 무기와 방벽으로 다시 조립됩니다.',
    effect: '세 전선 전투력 +7%',
    condition: 'all',
    laneBonus: 0.07,
    legacyTitle: '왕관은 첫 집의 들보가 되었다',
    legacyDescription:
      '회수대는 왕의 상징을 남기지 않았습니다. 녹여 낸 금속은 다리가 되고, 왕좌의 목재는 첫 공동 화로의 지붕을 받치는 들보가 되었습니다.',
    witness: '해빙기 회수대 첫 장부',
  },
}

export const FINAL_MARCH_IMPRINTS: Record<FinalMarchImprintId, FinalMarchImprint> = {
  'linked-hearths': {
    glyph: '≋',
    label: 'GATE I · LINKED HEARTHS',
    name: '이어진 화로',
    story: '식량을 나눠 든 행렬이 전선 사이의 빈틈을 메우며 왕좌까지 함께 걷습니다.',
    effect: '인접 지원을 받는 전선 전투력 +7%',
    crownLink: '중앙 집중 전선을 양옆의 지원으로 보강합니다.',
    condition: 'supported',
    laneBonus: 0.07,
  },
  'measured-rations': {
    glyph: '⌘',
    label: 'GATE I · MEASURED RATIONS',
    name: '절제된 행군',
    story: '왕좌까지 나눈 배급표가 서로 다른 명령을 하나의 박자로 묶습니다.',
    effect: '명령 2종 이상 배치 시 모든 전선 전투력 +5%',
    crownLink: '서로 다른 왕관 칙령을 동시에 파훼할 지휘 여유를 만듭니다.',
    condition: 'mixed-orders',
    laneBonus: 0.05,
  },
  'starless-route': {
    glyph: '⌁',
    label: 'GATE I · STARLESS ROUTE',
    name: '별 없는 길표',
    story: '피난민이 눈 위에 남긴 미세한 흔적이 화로의 위치를 감춘 채 왕좌까지 이어집니다.',
    effect: '화로 집중 전선에서 의도 파훼 시 전투력 +10%',
    crownLink: '첫 번째 칙령과 중앙 왕좌를 한 전선에서 동시에 끊습니다.',
    condition: 'focus-countered',
    laneBonus: 0.1,
  },
  'ghost-formation': {
    glyph: '♜',
    label: 'GATE II · GHOST FORMATION',
    name: '죽은 자의 진형',
    story: '죽은 정찰대의 마지막 진형이 화로가 가리킨 한 전선에서 다시 완성됩니다.',
    effect: '화로 집중 전선 전투력 +9%',
    crownLink: '두 번째 칙령의 중앙 왕좌를 정면으로 압박합니다.',
    condition: 'focus',
    laneBonus: 0.09,
  },
  'folded-retreat': {
    glyph: '◆',
    label: 'GATE II · FOLDED RETREAT',
    name: '접힌 퇴로',
    story: '팔아 넘긴 지도 대신 확보한 자재가 물러서지 않는 방벽의 버팀쇠가 됩니다.',
    effect: '방벽 명령 전선 전투력 +9%',
    crownLink: '왕좌의 압박을 견디며 두 전선 승리선을 지킬 힘을 남깁니다.',
    condition: 'hold',
    laneBonus: 0.09,
  },
  'burning-vanguard': {
    glyph: '↟',
    label: 'GATE II · BURNING VANGUARD',
    name: '불길 돌격선',
    story: '타 사라질 지도를 칼날마다 새긴 선봉대가 물러설 길 없이 왕좌를 향해 돌진합니다.',
    effect: '돌격 명령 전선 전투력 +9%',
    crownLink: '동결 왕좌의 방벽을 정면 돌파할 세 번째 해법을 남깁니다.',
    condition: 'assault',
    laneBonus: 0.09,
  },
  'unveiled-command': {
    glyph: '⌘',
    label: 'GATE III · UNVEILED COMMAND',
    name: '드러난 칙령',
    story: '끝까지 들은 왕의 진실이 명령 속 거짓 박자를 먼저 드러냅니다.',
    effect: '적 의도를 파훼한 전선 전투력 +11%',
    crownLink: '첫 번째 칙령의 명령을 읽고 곧바로 끊습니다.',
    condition: 'countered',
    laneBonus: 0.11,
  },
  'raised-ember': {
    glyph: '◇',
    label: 'GATE III · RAISED EMBER',
    name: '높인 불씨',
    story: '전령 앞에서 높인 불꽃이 왕실 병과의 균열을 가장 먼저 비춥니다.',
    effect: '병과 우세 전선 전투력 +11%',
    crownLink: '세 번째 칙령의 뒤집힌 혈통을 상성 우위로 가릅니다.',
    condition: 'advantage',
    laneBonus: 0.11,
  },
  'woven-standard': {
    glyph: '≋',
    label: 'GATE III · WOVEN STANDARD',
    name: '한데 꿰맨 군기',
    story: '서로 다른 세 부대의 군기가 하나로 이어져, 각기 다른 명령을 같은 행군 박자로 묶습니다.',
    effect: '명령 2종 이상 배치 시 모든 전선 전투력 +7%',
    crownLink: '세 칙령에 서로 다른 명령으로 응답하면서 전선 전체를 보강합니다.',
    condition: 'mixed-orders',
    laneBonus: 0.07,
  },
}

export const MERCY_DECISIONS = new Set([
  'n01-rescue',
  'n02-ring',
  'n02-courier',
  'n03-study',
  'n03-relight',
  'n04-wall',
  'n04-hearth-route',
  'n05-answer',
  'n05-coupling',
  'n06-mask',
  'n06-return',
  'n07-choir',
  'n07-release',
  'n08-feed',
  'n08-hearth-pulse',
  'n09-share',
  'n09-starless-route',
  'n10-ghosts',
  'n11-listen',
  'n12-oath',
  'n12-hearth-circle',
])

export const ENDING_IDS = Object.keys(ENDINGS) as EndingId[]

export const ORDER_META: Record<
  BattleOrder,
  { name: string; glyph: string; cost: number; description: string; counters: EnemyIntent }
> = {
  hold: {
    name: '방벽',
    glyph: '▰',
    cost: 0,
    description: '전투력 +16% · 공성 의도 파훼',
    counters: 'siege',
  },
  assault: {
    name: '돌격',
    glyph: '↟',
    cost: 1,
    description: '전투력 +22% · 제압 의도 파훼',
    counters: 'suppress',
  },
  support: {
    name: '지원',
    glyph: '✦',
    cost: 1,
    description: '인접 전선 +18% · 우회 의도 파훼',
    counters: 'flank',
  },
}

export const INTENT_META: Record<EnemyIntent, { name: string; glyph: string; description: string }> = {
  siege: { name: '공성', glyph: '⬡', description: '방벽이 아니면 적 전투력이 증가합니다.' },
  flank: { name: '우회', glyph: '⌁', description: '지원 명령으로 진입로를 봉쇄할 수 있습니다.' },
  suppress: { name: '제압', glyph: '✕', description: '돌격 명령으로 사격선을 무너뜨릴 수 있습니다.' },
}

export const ENEMY_DOCTRINES: Record<EnemyDoctrineId, EnemyDoctrine> = {
  'frost-ram': {
    name: '빙각 돌진',
    glyph: '↟',
    label: 'BREACH DOCTRINE',
    description: '이 전선의 의도를 놓치면 정예 위협 +18%. 의도를 파훼하면 돌진이 무너져 위협 -6%.',
    counterplay: '정예 전선의 의도에 맞는 명령을 내리세요.',
  },
  'pack-flank': {
    name: '갈퀴 포위',
    glyph: '⌁',
    label: 'PACK DOCTRINE',
    description: '맞닿은 전선에 지원 명령이 없으면 정예 위협 +17%. 지원망이 닿으면 위협 -5%.',
    counterplay: '정예와 인접한 전선 하나에 지원 명령을 배치하세요.',
  },
  'choir-chain': {
    name: '공허 합창',
    glyph: '≋',
    label: 'CHOIR DOCTRINE',
    description: '맞닿은 전선의 미파훼 의도마다 정예 위협 +8%. 인접 의도를 모두 끊으면 위협 -5%.',
    counterplay: '정예 양옆의 적 의도를 먼저 파훼해 합창을 끊으세요.',
    commandFloor: 2,
  },
  'hollow-aegis': {
    name: '유리 방벽',
    glyph: '◇',
    label: 'AEGIS DOCTRINE',
    description: '돌격 명령이 아니면 정예 위협 +16%. 돌격으로 유리 갑옷을 깨면 위협 -5%.',
    counterplay: '정예 전선에 돌격 명령을 내려 갑옷을 깨세요.',
  },
  'mirror-vow': {
    name: '거울 맹세',
    glyph: '◫',
    label: 'MIRROR DOCTRINE',
    description: '반복한 명령 단계마다 정예 위협 +8%. 세 전선의 명령이 모두 다르면 위협 -5%.',
    counterplay: '방벽·돌격·지원 명령을 하나씩 사용하세요.',
    commandFloor: 2,
  },
  'crown-hunt': {
    name: '왕관 추적',
    glyph: '♜',
    label: 'HUNT DOCTRINE',
    description: '정예 전선에 화로를 집중하면 위협 +20%. 다른 전선으로 불을 숨기면 위협 -4%.',
    counterplay: '화로 집중을 다른 전선에 두고 정예는 상성과 명령으로 버티세요.',
  },
  'whiteout-execution': {
    name: '백색 처형',
    glyph: '✕',
    label: 'EXECUTION DOCTRINE',
    description: 'II 이하 생존자를 상대하면 정예 위협 +18%. III 이상 베테랑이 맞서면 위협 -4%.',
    counterplay: 'III 등급 이상 베테랑을 정예 전선에 배치하세요.',
  },
  'black-standard': {
    name: '검은 군기',
    glyph: '⚑',
    label: 'MUSTER DOCTRINE',
    description: '진형에 세 병과가 모두 없으면 정예 위협 +18%. 세 병과가 집결하면 위협 -5%.',
    counterplay: '방패·활·도끼를 하나씩 출전시켜 군기를 꺾으세요.',
  },
}

export const ENEMY_DOCTRINE_IDS = Object.keys(ENEMY_DOCTRINES) as EnemyDoctrineId[]

export const ELITE_ENCOUNTERS: Partial<Record<number, EliteEncounter>> = {
  2: {
    lane: 0,
    doctrine: 'frost-ram',
    name: '빙각 선봉장',
    epithet: '바람 협곡의 첫 돌격',
    phase: 'BREACH',
  },
  3: {
    lane: 1,
    doctrine: 'pack-flank',
    name: '흰송곳니 무리장',
    epithet: '침묵의 도로를 에워싼 자',
    phase: 'ENCIRCLE',
  },
  5: {
    lane: 1,
    doctrine: 'choir-chain',
    name: '무명 성가대장',
    epithet: '성벽 아래의 세 번째 목소리',
    phase: 'RESONATE',
  },
  6: {
    lane: 0,
    doctrine: 'hollow-aegis',
    name: '유리갑옷 순례자',
    epithet: '깨지지 않은 첫 가면',
    phase: 'SHATTER',
  },
  7: {
    lane: 2,
    doctrine: 'mirror-vow',
    name: '공허 성가 지휘자',
    epithet: '모든 명령을 되비추는 자',
    phase: 'REFLECT',
  },
  9: {
    lane: 1,
    doctrine: 'crown-hunt',
    name: '왕관의 사냥개',
    epithet: '마지막 불빛을 맡은 자',
    phase: 'MARK',
  },
  10: {
    lane: 0,
    doctrine: 'whiteout-execution',
    name: '흰 장막 집행자',
    epithet: '왕의 옛길을 지우는 칼',
    phase: 'EXECUTE',
  },
  11: {
    lane: 2,
    doctrine: 'black-standard',
    name: '검은 빙벽의 전령',
    epithet: '왕좌 앞의 마지막 군기',
    phase: 'MUSTER',
  },
}

export const ACTS = [
  { number: 1, title: '꺼지는 국경', subtitle: 'EMBER FRONTIER', range: [1, 4] as const },
  { number: 2, title: '얼어붙은 성가', subtitle: 'THE HOLLOW CHOIR', range: [5, 8] as const },
  { number: 3, title: '왕의 긴 밤', subtitle: 'CROWN OF WHITE', range: [9, 12] as const },
]

export const ENEMY_PATTERNS: UnitKind[][] = [
  ['ranger', 'raider', 'warden'],
  ['warden', 'ranger', 'raider'],
  ['raider', 'warden', 'ranger'],
  ['ranger', 'warden', 'raider'],
  ['raider', 'ranger', 'warden'],
  ['warden', 'raider', 'ranger'],
  ['ranger', 'raider', 'warden'],
  ['warden', 'ranger', 'warden'],
  ['raider', 'warden', 'ranger'],
  ['ranger', 'raider', 'ranger'],
  ['warden', 'raider', 'warden'],
  ['raider', 'ranger', 'warden'],
]

export const ENEMY_TIERS = [
  [1, 1, 1],
  [1, 1, 2],
  [1, 2, 2],
  [2, 2, 2],
  [2, 2, 3],
  [2, 3, 3],
  [3, 3, 3],
  [3, 3, 3],
  [3, 3, 3],
  [3, 3, 4],
  [3, 4, 4],
  [4, 4, 4],
]

export const ENEMY_INTENTS: EnemyIntent[][] = [
  ['siege', 'flank', 'suppress'],
  ['flank', 'suppress', 'siege'],
  ['suppress', 'siege', 'flank'],
  ['siege', 'suppress', 'flank'],
  ['flank', 'siege', 'suppress'],
  ['suppress', 'flank', 'siege'],
  ['siege', 'flank', 'suppress'],
  ['siege', 'suppress', 'siege'],
  ['flank', 'siege', 'suppress'],
  ['suppress', 'flank', 'suppress'],
  ['siege', 'flank', 'siege'],
  ['flank', 'suppress', 'siege'],
]

export const ENEMY_NAMES: Record<UnitKind, string[]> = {
  warden: ['얼음 문지기', '백야 방벽', '빙관 수문장', '왕좌의 철벽'],
  ranger: ['서리 사수', '눈보라 추적자', '극야 명사수', '왕관의 눈'],
  raider: ['균열 약탈자', '빙원 파쇄자', '혹한 선봉장', '빙관 집행자'],
}

export const NIGHT_STORIES: NightStory[] = [
  {
    act: 1,
    title: '첫 번째 균열',
    location: '북부 외벽',
    weather: '잔설',
    omen: '북쪽 빙벽 아래에서 처음으로 쇠가 부딪히는 소리가 들렸다.',
    report: '정찰대는 얼음 아래에 오래된 길이 있다고 말했다. 적은 그 길을 이미 알고 있었다.',
    enemyScale: 1,
    boss: false,
    rule: '첫 교전입니다. 병과 상성과 적 의도를 함께 읽으세요.',
  },
  {
    act: 1,
    title: '흰 숨결',
    location: '바람 협곡',
    weather: '측풍',
    omen: '눈보라는 목소리를 삼켰고, 성벽의 횃불이 하나씩 꺼졌다.',
    report: '사라진 횃불 곁에는 발자국이 없었다. 누군가 성벽 안에서 불을 끄고 있었다.',
    enemyScale: 1.01,
    boss: false,
    rule: '빙각 선봉장의 돌진은 정예 전선의 의도를 파훼해야 멈춥니다.',
  },
  {
    act: 1,
    title: '메아리 없는 행렬',
    location: '침묵의 도로',
    weather: '빙무',
    omen: '안개 너머의 군대는 깃발도 북소리도 없이 다가왔다.',
    report: '쓰러진 적의 갑옷은 비어 있었다. 안쪽에는 얼음 가루만 가득했다.',
    enemyScale: 1.03,
    boss: false,
    rule: '흰송곳니의 포위는 정예와 맞닿은 전선의 지원 명령으로 끊을 수 있습니다.',
  },
  {
    act: 1,
    title: '빈 갑옷의 문',
    location: '국경 성문',
    weather: '극저온',
    omen: '해가 떠야 할 시간, 하늘은 오히려 더 짙은 남색으로 가라앉았다.',
    report: '무너진 지휘관의 투구 안에는 심장이 뛰는 얼음 결정이 있었다. 첫 번째 왕관 조각이었다.',
    enemyScale: 1.07,
    boss: true,
    rule: '막 보스 · 세 전선의 의도가 강화됩니다. 두 전선을 지키면 왕관 조각을 파괴합니다.',
  },
  {
    act: 2,
    title: '성벽 아래의 목소리',
    location: '유리 협곡',
    weather: '환청',
    omen: '죽은 이들의 목소리가 문을 열어 달라며 이름을 불렀다.',
    report: '누구도 문을 열지 않았다. 하지만 아침에 안쪽 빗장이 젖어 있었다.',
    enemyScale: 1.08,
    boss: false,
    rule: '공허 합창은 정예와 맞닿은 전선의 미파훼 의도를 먹고 커집니다.',
  },
  {
    act: 2,
    title: '유리 순례자',
    location: '얼음 회랑',
    weather: '결정비',
    omen: '투명한 가면을 쓴 행렬이 얼음 성당을 향해 무릎으로 기어갔다.',
    report: '가면 안쪽에는 각자의 이름이 거꾸로 새겨져 있었다. 그중 하나는 원정대장의 이름이었다.',
    enemyScale: 1.1,
    boss: false,
    rule: '유리 방벽은 정예 전선에 돌격 명령을 내려야 깨집니다.',
  },
  {
    act: 2,
    title: '기도 없는 성가',
    location: '공허 성당',
    weather: '공명',
    omen: '사람이 없는 성당에서 수천 명의 합창이 들려왔다.',
    report: '노래는 기도가 아니었다. 얼음 아래에서 잠든 무언가의 심장 박동을 맞추는 박자였다.',
    enemyScale: 1.12,
    boss: false,
    rule: '거울 맹세는 반복한 명령을 되비춥니다. 세 종류의 명령을 하나씩 사용하세요.',
  },
  {
    act: 2,
    title: '빙하의 심장',
    location: '푸른 제단',
    weather: '빙진',
    omen: '성당 바닥이 갈라지자 산보다 큰 푸른 심장이 드러났다.',
    report: '두 번째 왕관 조각이 부서지며 극야의 길이 열렸다. 왕은 이제 원정대를 바라보고 있었다.',
    enemyScale: 1.17,
    boss: true,
    rule: '막 보스 · 중앙 전선이 정예 수문장에게 봉쇄됩니다.',
  },
  {
    act: 3,
    title: '해가 뜨지 않는 날',
    location: '극야 평원',
    weather: '극야',
    omen: '시간을 잴 그림자가 사라지고, 마지막 장작더미가 바닥을 보였다.',
    report: '하늘의 별이 하나씩 꺼졌다. 남은 빛은 원정대가 운반하는 불씨뿐이었다.',
    enemyScale: 1.17,
    boss: false,
    rule: '왕관의 사냥개는 화로가 집중된 전선을 추적합니다. 불을 다른 곳에 숨기세요.',
  },
  {
    act: 3,
    title: '불타는 지도',
    location: '왕의 옛길',
    weather: '역풍',
    omen: '지도 위 길들이 실제 설원보다 먼저 불타 사라졌다.',
    report: '길을 잃자 오래전 죽은 정찰대의 불빛이 나타났다. 그들은 말없이 왕좌를 가리켰다.',
    enemyScale: 1.19,
    boss: false,
    rule: '백색 처형은 II 이하 생존자를 노립니다. III 이상 베테랑으로 맞서세요.',
  },
  {
    act: 3,
    title: '마지막 전령',
    location: '검은 빙벽',
    weather: '백색 소음',
    omen: '돌아갈 길이 닫혔다. 성채의 모든 종이 동시에 한 번 울렸다.',
    report: '마지막 전령은 왕이 아니라 화로를 두려워한다고 말했다. 불씨는 오래전 그의 것이었다.',
    enemyScale: 1.22,
    boss: false,
    rule: '검은 군기는 단일 병과 진형을 압도합니다. 세 병과를 모두 집결시키세요.',
  },
  {
    act: 3,
    title: '왕의 눈보라',
    location: '빙관 왕좌',
    weather: '대빙설',
    omen: '하늘과 땅의 경계가 사라졌다. 오직 화로만이 방향을 알려 주었다.',
    report: '열두 번의 밤을 지나, 불씨는 피난처가 아니라 새로운 태양이 되었다. 왕관은 봄의 물이 되어 흘렀다.',
    enemyScale: 1.27,
    boss: true,
    rule: '최종 보스 · 세 칙령 중 둘 이상을 해제하고 두 전선을 지켜야 왕관을 파괴합니다.',
  },
]

export const FIRST_CROWN_MARCH = [
  {
    night: 1,
    glyph: '01',
    label: 'FIRST WATCH',
    reward: '첫 번째 망루',
  },
  {
    night: 2,
    glyph: '∞',
    label: 'FIRST RELIC',
    reward: '첫 유물 각인',
  },
  {
    night: 3,
    glyph: '⌁',
    label: 'CROWN TRACE',
    reward: '왕관 신호 포착',
  },
  {
    night: 4,
    glyph: '◈',
    label: 'FIRST CROWN',
    reward: '왕관 조각 · 유물',
  },
] as const

export const BOSS_MECHANICS: Partial<Record<number, BossMechanic>> = {
  4: {
    name: '빈 갑옷의 메아리',
    epithet: '첫 번째 왕관 조각',
    glyph: '◈',
    phase: 'RESONANCE',
    description: '파훼하지 못한 적 의도가 빈 갑옷 사이에서 공명해 해당 전선의 위협이 15% 증가합니다.',
    pressureCopy: '의도를 파훼해 갑옷의 공명을 끊으세요.',
  },
  8: {
    name: '빙하 심장',
    epithet: '두 번째 왕관 조각',
    glyph: '⬡',
    phase: 'HEART SHIELD',
    description: '중앙 전선은 심장 방벽으로 28% 강화됩니다. 화로를 중앙에 집중하면 방벽이 깨집니다.',
    pressureCopy: '중앙 집중으로 심장 방벽을 먼저 부수세요.',
  },
  12: {
    name: '백색 왕',
    epithet: '빙관의 마지막 주인',
    glyph: '♜',
    phase: 'TRIPLE CROWN',
    description:
      '왕은 세 전선에 서로 다른 칙령을 내립니다. 의도 파훼·중앙 집중·병과 우위 중 둘 이상을 증명해야 왕관이 갈라집니다.',
    pressureCopy: '칙령 두 개와 전선 두 곳을 함께 확보하세요. 세 칙령 완전 파쇄에는 추가 명성이 주어집니다.',
  },
}

export const FINAL_CROWN_SEALS: [FinalCrownSeal, FinalCrownSeal, FinalCrownSeal] = [
  {
    lane: 0,
    name: '침묵의 칙령',
    glyph: '⌘',
    label: 'FIRST EDICT',
    requirement: '1전선의 적 의도에 맞는 명령을 내려 파훼',
    pressure: '미파훼 시 왕의 명령이 증폭되어 위협 +16%',
    activeMultiplier: 1.16,
    brokenMultiplier: 0.96,
  },
  {
    lane: 1,
    name: '동결 왕좌',
    glyph: '♜',
    label: 'SECOND EDICT',
    requirement: '화로의 힘을 중앙 2전선에 집중',
    pressure: '비집중 시 왕좌 방벽이 유지되어 위협 +18%',
    activeMultiplier: 1.18,
    brokenMultiplier: 0.96,
  },
  {
    lane: 2,
    name: '뒤집힌 혈통',
    glyph: '◇',
    label: 'THIRD EDICT',
    requirement: '3전선에서 적 병과를 이기는 상성 우위 확보',
    pressure: '우세 병과가 아니면 왕관의 계보가 위협 +16%',
    activeMultiplier: 1.16,
    brokenMultiplier: 0.96,
  },
]

export const FINAL_MARCH_GATES = [
  {
    night: 9,
    label: 'FIRST GATE · CONTROL',
    name: '불빛의 관문',
    glyph: '♜',
    doctrine: 'crown-hunt' as const,
    lesson: '화로 집중을 숨길 곳과 드러낼 곳을 지휘합니다.',
    crownPreparation: '최종전에서 중앙 왕좌를 정확히 겨눌 집중 통제',
  },
  {
    night: 10,
    label: 'SECOND GATE · VETERAN',
    name: '백색 칼날의 관문',
    glyph: '✕',
    doctrine: 'whiteout-execution' as const,
    lesson: 'III 이상 베테랑이 최후의 전선을 맡을 자격을 증명합니다.',
    crownPreparation: 'IV 등급 왕실 근위대를 버틸 핵심 전선 성장',
  },
  {
    night: 11,
    label: 'THIRD GATE · FORMATION',
    name: '검은 군기의 관문',
    glyph: '⚑',
    doctrine: 'black-standard' as const,
    lesson: '방패·활·도끼가 하나의 마지막 대열로 집결합니다.',
    crownPreparation: '세 전선에서 필요한 상성 우위를 만들 병과 선택권',
  },
] as const

export const CAMPAIGN_PACE_BENCHMARKS = [
  {
    act: 1,
    startDay: 1,
    endDay: 4,
    startTierTotal: 3,
    targetTierTotal: 6,
    crownGrowth: 'II+ 전선 3곳',
  },
  {
    act: 2,
    startDay: 5,
    endDay: 8,
    startTierTotal: 6,
    targetTierTotal: 8,
    crownGrowth: 'III+ 전선 2곳',
  },
  {
    act: 3,
    startDay: 9,
    endDay: 12,
    startTierTotal: 8,
    targetTierTotal: 10,
    crownGrowth: 'III+ 전선 3곳 · IV 전선 1곳',
  },
] as const

export const ACT_TRANSITIONS: Partial<Record<number, ActTransition>> = {
  5: {
    fromAct: 1,
    toAct: 2,
    label: 'INTERLUDE I · THE FIRST CROWN',
    glyph: '◈',
    title: '첫 왕관이 깨지고, 얼음이 노래하기 시작했다',
    route: '국경 성문 → 유리 협곡',
    description:
      '빈 갑옷의 심장이 산산이 갈라지자 국경의 눈보라가 잠시 멎었습니다. 그러나 녹아내린 왕관 조각 아래에서 수천 개의 목소리가 같은 음을 내기 시작했습니다.',
    warning: '두 번째 막의 적은 서로의 의도와 명령을 연결합니다. 한 전선만 보는 지휘로는 합창을 끊을 수 없습니다.',
    directive: '왕관 잔향에서 유물을 회수한 뒤 공허 성당으로 진입하세요.',
    artPosition: '50% center',
  },
  9: {
    fromAct: 2,
    toAct: 3,
    label: 'INTERLUDE II · THE OPENED NIGHT',
    glyph: '⬡',
    title: '빙하의 심장이 멎자, 왕좌로 가는 밤이 열렸다',
    route: '푸른 제단 → 극야 평원',
    description:
      '두 번째 왕관 조각이 푸른 심장과 함께 꺼졌습니다. 성당 천장이 갈라지고 별 없는 하늘이 드러나자, 검은 빙벽 너머에서 왕이 직접 화로의 불빛을 바라보았습니다.',
    warning:
      '마지막 막의 정예는 화로의 위치와 생존자의 성장, 세 병과의 결속을 노립니다. 완성한 빌드 전체가 시험대에 오릅니다.',
    directive: '마지막 전리품을 각인하고 왕의 옛길을 따라 극야로 출정하세요.',
    artPosition: '88% center',
  },
}

export const TUTORIAL_ORDER: TutorialStep[] = ['merge', 'deploy', 'orders', 'focus', 'battle']
export const TUTORIAL_COPY: Record<
  TutorialStep,
  { kicker: string; title: string; description: string; goal: string; action: string }
> = {
  merge: {
    kicker: '01 · FORGE',
    title: '같은 생존자 둘을 합치세요',
    description: '대기소에서 병과와 등급이 같은 두 카드를 차례로 누르면 II 등급으로 강화됩니다.',
    goal: 'II 등급 생존자 1명 완성',
    action: '대기소 보기',
  },
  deploy: {
    kicker: '02 · DEPLOY',
    title: '강화 병사를 전선에 배치하세요',
    description: '선택된 생존자를 유지한 채 전장으로 돌아가 원하는 우리 전선을 누르세요.',
    goal: 'II 등급 생존자 전선 배치',
    action: '전장 보기',
  },
  orders: {
    kicker: '03 · COUNTER',
    title: '적 의도를 한 번 파훼하세요',
    description: '아직 쓰지 않은 청록색 명령을 고르세요. 방벽은 공성, 돌격은 제압, 지원은 우회를 끊습니다.',
    goal: '새 명령으로 적 의도 1곳 파훼',
    action: '명령 보기',
  },
  focus: {
    kicker: '04 · FOCUS',
    title: '첫 승리를 만드는 전선에 집중하세요',
    description: '추천 표시를 참고해 01·02·03 중 한 전선을 누르세요. 예상 방어가 즉시 다시 계산됩니다.',
    goal: '예상 방어 2 / 3 이상 만들기',
    action: '추천 전선 보기',
  },
  battle: {
    kicker: '05 · HOLD',
    title: '이제 첫 밤을 직접 지키세요',
    description: '예상 방어가 2/3 이상이면 준비 완료입니다. 결과는 전선별 교전 장면으로 펼쳐집니다.',
    goal: '예상 방어 2 / 3 이상 확인',
    action: '방어 시작으로',
  },
}

export const RELICS: Record<
  RelicId,
  { name: string; glyph: string; category: string; description: string; detail: string }
> = {
  'living-ember': {
    name: '살아 있는 불씨',
    glyph: '✦',
    category: '화로 유물',
    description: '합성할 때 회복하는 온기가 3에서 7로 증가합니다.',
    detail: '꺼지지 않는 불은 강한 병사보다 오래 버팁니다.',
  },
  'quartermasters-knot': {
    name: '보급관의 매듭',
    glyph: '⌘',
    category: '원정 유물',
    description: '신호탄 비용이 항상 4 감소합니다.',
    detail: '매듭 하나마다 누구에게 무엇이 남았는지 기록되어 있습니다.',
  },
  'watchtower-lens': {
    name: '망루의 렌즈',
    glyph: '◉',
    category: '전술 유물',
    description: '집중 전선의 전투력 보너스가 28%에서 42%로 증가합니다.',
    detail: '눈보라 속에서도 가장 먼저 무너질 곳을 보여 줍니다.',
  },
  'winter-blood': {
    name: '설혈의 서약',
    glyph: '◇',
    category: '생존 유물',
    description: '온기가 45% 이하일 때 모든 전투력이 20% 증가합니다.',
    detail: '추위는 두려움이 아니라 몸이 기억하는 신호가 됩니다.',
  },
  'threefold-banner': {
    name: '세 갈래 깃발',
    glyph: '≋',
    category: '진형 유물',
    description: '세 병과를 모두 배치하면 모든 전투력이 14% 증가합니다.',
    detail: '서로 다른 방식으로 싸우는 이들이 하나의 성벽이 됩니다.',
  },
  'salvagers-pack': {
    name: '회수꾼의 가방',
    glyph: '▣',
    category: '보급 유물',
    description: '승리할 때 받는 보급품이 18 증가합니다.',
    detail: '전장이 끝난 뒤에도 쓸모없는 것은 없습니다.',
  },
  'rime-steel': {
    name: '서리 강철',
    glyph: '✧',
    category: '병장기 유물',
    description: '대등한 상성에서 전투력이 22% 증가합니다.',
    detail: '얼었다 녹기를 반복한 금속은 놀랍도록 단단합니다.',
  },
  'marching-drum': {
    name: '침묵의 행군북',
    glyph: '●',
    category: '전쟁 유물',
    description: 'II 등급 이상 생존자의 전투력이 11% 증가합니다.',
    detail: '소리는 나지 않지만 심장은 같은 박자로 뜁니다.',
  },
}

export const RESONANCES: Record<
  ResonanceId,
  {
    name: string
    glyph: string
    category: string
    requirements: readonly [RelicId, RelicId]
    description: string
    detail: string
  }
> = {
  'ember-pulse': {
    name: '불씨의 맥박',
    glyph: '✦',
    category: '생존 공명',
    requirements: ['living-ember', 'winter-blood'],
    description: '온기 50% 이하에서 모든 전투력 +10% · 승리 후 온기 손실 2 감소',
    detail: '꺼지기 직전의 불과 차가운 피가 같은 박동으로 이어집니다.',
  },
  'whiteout-sight': {
    name: '백야의 조준선',
    glyph: '◉',
    category: '전술 공명',
    requirements: ['watchtower-lens', 'rime-steel'],
    description: '집중 전선에서 적 의도를 파훼하면 해당 전투력 +12%',
    detail: '렌즈가 찾아낸 균열을 서리 강철의 날끝이 정확히 가릅니다.',
  },
  'threefold-cadence': {
    name: '세 갈래 진군가',
    glyph: '≋',
    category: '진형 공명',
    requirements: ['threefold-banner', 'marching-drum'],
    description: '세 병과가 모두 II 등급 이상이면 모든 전투력 +10%',
    detail: '서로 다른 발걸음이 하나의 북소리 위에서 완전한 대열이 됩니다.',
  },
  'long-road-ledger': {
    name: '끝없는 보급로',
    glyph: '▣',
    category: '원정 공명',
    requirements: ['quartermasters-knot', 'salvagers-pack'],
    description: '신호탄 비용 추가 -2 · 승리 보급품 +10',
    detail: '회수한 물자 하나까지 장부에 이어져 다음 행군을 밀어 줍니다.',
  },
}

export const CAMPAIGN_EVENTS: CampaignEvent[] = [
  {
    title: '눈 속의 신호함',
    location: '북부 외벽 · 출정 전',
    body: '매몰된 보급함에서 희미한 두드림이 들린다. 안에는 물자와 살아 있는 정찰병이 함께 갇혀 있다.',
    choices: [
      {
        id: 'n01-cache',
        title: '보급함부터 연다',
        description: '바깥에서 경첩을 뜯는다. 눈보라 속 작업은 화로의 시간을 빼앗는다.',
        outcome: '보급품 +22 · 온기 -4',
        supplies: 22,
        heat: -4,
        score: 100,
        echo: {
          triggerDay: 5,
          glyph: '▣',
          name: '눈 속에서 건진 경첩',
          story: '보급함에서 떼어 둔 경첩과 판금이 유리 협곡의 임시 방벽으로 돌아옵니다.',
          effect: '방벽 명령 전선 전투력 +14%',
          condition: 'hold',
          laneBonus: 0.14,
        },
      },
      {
        id: 'n01-rescue',
        title: '정찰병을 구한다',
        description: '식량을 나누고 얼어붙은 손을 녹인다. 또 하나의 목숨이 전선에 선다.',
        outcome: '신병 합류 · 사기 +10 · 보급품 -10',
        supplies: -10,
        morale: 10,
        recruit: true,
        requiresSupplies: 10,
        echo: {
          triggerDay: 5,
          glyph: '⌁',
          name: '살아 돌아온 정찰병',
          story: '구조한 정찰병이 얼음 아래에서 들려오는 거짓 신호의 박자를 먼저 읽어 냅니다.',
          effect: '적 의도를 파훼한 전선 전투력 +14%',
          condition: 'countered',
          laneBonus: 0.14,
        },
      },
    ],
  },
  {
    title: '금이 간 종',
    location: '바람 협곡',
    body: '피난민들이 두고 간 경보 종이 얼음에 반쯤 묻혀 있다. 울리면 적도, 생존자도 불빛의 위치를 알게 된다.',
    routeVariant: 1,
    choices: [
      {
        id: 'n02-ring',
        title: '종을 울린다',
        description: '긴 울림이 협곡을 건넌다. 흩어진 이들이 아직 우리가 살아 있음을 안다.',
        outcome: '사기 +12 · 명성 +180 · 온기 -5',
        morale: 12,
        heat: -5,
        score: 180,
        echo: {
          triggerDay: 6,
          glyph: '◉',
          name: '협곡 너머의 응답',
          story: '종소리를 들었던 생존자들이 얼음 회랑의 표식을 밝혀 화로의 힘을 한곳으로 모읍니다.',
          effect: '화로 집중 전선 전투력 +14%',
          condition: 'focus',
          laneBonus: 0.14,
        },
      },
      {
        id: 'n02-melt',
        title: '종을 녹인다',
        description: '금속을 화로 둘레에 둘러 열을 오래 붙잡는다. 아무도 구조 신호를 듣지 못한다.',
        outcome: '온기 +16 · 사기 -5',
        heat: 16,
        morale: -5,
        echo: {
          triggerDay: 6,
          glyph: '◈',
          name: '종의 청동 축열판',
          story: '녹여 둔 청동이 화로 둘레에서 다시 달아올라 얼음 회랑의 냉기를 붙잡습니다.',
          effect: '전투 후 온기 손실 최대 6 감소',
          heatShield: 6,
        },
      },
    ],
  },
  {
    title: '주인 없는 갑옷',
    location: '침묵의 도로',
    body: '길가에 늘어선 갑옷은 모두 안이 비어 있다. 흉갑 안쪽에는 같은 전투가 수백 번 기록돼 있다.',
    routeVariant: 1,
    choices: [
      {
        id: 'n03-study',
        title: '전투 기록을 베낀다',
        description: '적의 반복되는 움직임에서 다음 공격의 박자를 찾아낸다.',
        outcome: '명성 +320 · 사기 +5',
        score: 320,
        morale: 5,
        echo: {
          triggerDay: 7,
          glyph: '⌘',
          name: '빈 갑옷의 전투 기록',
          story: '베껴 둔 기록에서 공허 성당의 공격 박자가 되풀이되는 순간을 찾아냅니다.',
          effect: '적 의도를 파훼한 전선 전투력 +15%',
          condition: 'countered',
          laneBonus: 0.15,
        },
      },
      {
        id: 'n03-salvage',
        title: '갑옷을 해체한다',
        description: '쓸 수 있는 판금과 가죽끈을 챙긴다. 기록은 눈 속에 남는다.',
        outcome: '보급품 +30 · 사기 -4',
        supplies: 30,
        morale: -4,
        echo: {
          triggerDay: 7,
          glyph: '◆',
          name: '주인 없는 판금',
          story: '해체해 둔 판금이 합창의 진동을 견디는 전선 버팀쇠로 조립됩니다.',
          effect: '방벽 명령 전선 전투력 +15%',
          condition: 'hold',
          laneBonus: 0.15,
        },
      },
    ],
  },
  {
    title: '첫 왕관 조각',
    location: '국경 성문',
    body: '성문 너머에서 푸른 박동이 느껴진다. 전투 전에 한 번만 방어선을 손볼 시간이 남았다.',
    choices: [
      {
        id: 'n04-wall',
        title: '성문을 덧댄다',
        description: '장작과 판금을 벽에 쏟아붓는다. 화로까지 이어진 통로가 안전해진다.',
        outcome: '온기 +12 · 사기 +8 · 보급품 -18',
        supplies: -18,
        heat: 12,
        morale: 8,
        requiresSupplies: 18,
        echo: {
          triggerDay: 8,
          glyph: '⬡',
          name: '뒤에 남겨 둔 성문',
          story: '덧댄 성문이 피난 행렬을 지켜 냈다는 전갈이 도착하고, 원정대의 세 전선이 함께 버팁니다.',
          effect: '모든 전선 전투력 +8%',
          condition: 'all',
          laneBonus: 0.08,
        },
      },
      {
        id: 'n04-arms',
        title: '무기를 벼린다',
        description: '전선에 선 가장 약한 생존자에게 모든 대장간 시간을 몰아준다.',
        outcome: '전선 우선 생존자 강화 · 명성 +250 · 보급품 -12',
        supplies: -12,
        score: 250,
        upgrade: true,
        requiresSupplies: 12,
        echo: {
          triggerDay: 8,
          glyph: '✦',
          name: '왕관을 벤 첫 날',
          story: '첫 왕관을 앞두고 벼린 날이 빙하의 심장 표면에서 다시 푸른 불꽃을 냅니다.',
          effect: '병과 우세 전선 전투력 +16%',
          condition: 'advantage',
          laneBonus: 0.16,
        },
      },
      {
        id: 'n04-hearth-route',
        title: '피난로에 화로를 잇는다',
        description: '성문 뒤에 남은 이들까지 닿도록 작은 화로를 줄지어 밝힌다. 후퇴로가 하나의 살아 있는 방벽이 된다.',
        outcome: '온기 +10 · 사기 +12 · 보급품 -14',
        supplies: -14,
        heat: 10,
        morale: 12,
        requiresSupplies: 14,
        oathOnly: 'hearthkeepers',
        echo: {
          triggerDay: 8,
          glyph: '✦',
          name: '성문까지 이어진 화로',
          story: '국경에 남겨 둔 작은 불들이 피난 행렬과 함께 푸른 제단에 도착해 세 전선의 숨을 고르게 잇습니다.',
          effect: '모든 전선 전투력 +9%',
          condition: 'all',
          laneBonus: 0.09,
        },
      },
      {
        id: 'n04-signal-feint',
        title: '거짓 경보 종을 세운다',
        description: '왕관의 박자를 베낀 신호를 빈 성벽에 울려 적의 선봉을 허공으로 돌린다.',
        outcome: '명성 +320 · 사기 +5 · 보급품 -10',
        supplies: -10,
        score: 320,
        morale: 5,
        requiresSupplies: 10,
        oathOnly: 'signal-corps',
        echo: {
          triggerDay: 8,
          glyph: '⌘',
          name: '두 번째 왕관의 거짓 박자',
          story: '첫 왕관을 속였던 경보의 박자가 빙하 심장의 방어 신호와 겹치며, 파훼한 전선의 빈틈을 넓힙니다.',
          effect: '적 의도를 파훼한 전선 전투력 +18%',
          condition: 'countered',
          laneBonus: 0.18,
        },
      },
      {
        id: 'n04-salvage-gears',
        title: '성문의 톱니를 회수한다',
        description: '멈춘 개폐 장치를 해체해 전선의 가장 낡은 장비와 보급 수레를 한 번에 손본다.',
        outcome: '전선 우선 생존자 강화 · 보급품 +14 · 사기 -6',
        supplies: 14,
        morale: -6,
        upgrade: true,
        oathOnly: 'salvagers',
        echo: {
          triggerDay: 8,
          glyph: '◈',
          name: '심장을 붙든 성문 톱니',
          story: '회수한 톱니가 푸른 제단의 임시 방벽을 맞물려, 방벽 명령을 받은 전선이 심장 박동을 버팁니다.',
          effect: '방벽 명령 전선 전투력 +13%',
          condition: 'hold',
          laneBonus: 0.13,
        },
      },
      {
        id: 'n04-bypass',
        title: '무너지는 옆길로 우회한다',
        description: '쓸 자재가 없다. 성문을 버리고 얼음 배수로를 따라 왕관의 시야 밖으로 대열을 옮긴다.',
        outcome: '보급 소모 없음 · 온기 -8 · 사기 -6',
        heat: -8,
        morale: -6,
        emergencyOnly: true,
        echo: {
          triggerDay: 8,
          glyph: '↺',
          name: '버려 둔 성문의 뒤길',
          story: '성문을 포기하며 표시한 배수로가 빙하의 심장 아래까지 이어져 방벽 대열의 퇴로를 엽니다.',
          effect: '방벽 명령 전선 전투력 +8%',
          condition: 'hold',
          laneBonus: 0.08,
        },
      },
    ],
  },
  {
    title: '성벽 아래의 목소리',
    location: '유리 협곡',
    body: '얼음 아래에서 원정대원들의 이름을 하나씩 부른다. 마지막 목소리는 아직 태어나지 않은 아이의 것이다.',
    routeVariant: 1,
    choices: [
      {
        id: 'n05-answer',
        title: '목소리에 답한다',
        description: '밧줄을 내려 얼음 틈의 생존자를 끌어올린다. 그가 어떻게 이름을 알았는지는 묻지 않는다.',
        outcome: '신병 합류 · 사기 +10 · 온기 -8',
        recruit: true,
        morale: 10,
        heat: -8,
        echo: {
          triggerDay: 9,
          glyph: '≋',
          name: '얼음 아래의 길잡이',
          story: '끌어올린 생존자가 극야 평원 아래 이어진 참호를 찾아 인접 전선의 지원로를 엽니다.',
          effect: '인접 지원을 받는 전선 전투력 +16%',
          condition: 'supported',
          laneBonus: 0.16,
        },
      },
      {
        id: 'n05-march',
        title: '귀를 막고 전진한다',
        description: '대열은 흐트러지지 않지만 누구도 서로의 얼굴을 오래 보지 않는다.',
        outcome: '보급품 +18 · 명성 +220 · 사기 -6',
        supplies: 18,
        score: 220,
        morale: -6,
        echo: {
          triggerDay: 9,
          glyph: '⌘',
          name: '흐트러지지 않은 행군',
          story: '목소리를 외면하고 맞춘 발걸음이 세 가지 명령을 하나의 작전으로 묶습니다.',
          effect: '두 종류 이상의 명령 배치 시 모든 전투력 +10%',
          condition: 'mixed-orders',
          laneBonus: 0.1,
        },
      },
    ],
  },
  {
    title: '유리 가면의 순례자',
    location: '얼음 회랑',
    body: '순례자의 가면 하나가 바닥에 놓여 있다. 쓰면 성당의 길이 선명해지지만 거울 속 표정이 사라진다.',
    routeVariant: 1,
    choices: [
      {
        id: 'n06-mask',
        title: '가면을 쓴다',
        description: '숨겨진 지름길과 적의 흔적이 동시에 보인다. 전선의 가장 약한 병사가 오래된 전투를 기억한다.',
        outcome: '전선 우선 생존자 강화 · 명성 +380 · 사기 -10',
        upgrade: true,
        score: 380,
        morale: -10,
        echo: {
          triggerDay: 10,
          glyph: '◇',
          name: '유리 가면의 시야',
          story: '가면에 남은 길이 죽은 정찰대의 불빛과 겹쳐 단 하나의 돌파선을 드러냅니다.',
          effect: '집중 전선에서 의도 파훼 시 전투력 +20%',
          condition: 'focus-countered',
          laneBonus: 0.2,
        },
      },
      {
        id: 'n06-burn',
        title: '가면을 태운다',
        description: '유리는 불에 녹지 않지만 이상할 만큼 오래 빛난다.',
        outcome: '온기 +16 · 사기 +8',
        heat: 16,
        morale: 8,
        echo: {
          triggerDay: 10,
          glyph: '✦',
          name: '녹지 않은 유리 불씨',
          story: '불에 남았던 가면 조각이 왕의 옛길에서 다시 타올라 귀환 화로를 감쌉니다.',
          effect: '전투 후 온기 손실 최대 7 감소',
          heatShield: 7,
        },
      },
    ],
  },
  {
    title: '기도 없는 합창',
    location: '공허 성당',
    body: '합창은 듣는 사람의 심장 박자를 빼앗는다. 노래에 박자를 맞추거나, 화약으로 공명을 끊을 수 있다.',
    routeVariant: 1,
    choices: [
      {
        id: 'n07-choir',
        title: '우리의 행군가를 부른다',
        description: '낯선 성가 위에 살아 있는 목소리를 겹친다. 원정대의 발걸음이 다시 하나가 된다.',
        outcome: '사기 +16 · 명성 +220 · 온기 -7',
        morale: 16,
        score: 220,
        heat: -7,
        echo: {
          triggerDay: 11,
          glyph: '≋',
          name: '되찾은 심장 박자',
          story: '성당에서 맞춰 부른 행군가가 검은 빙벽에 울려 인접 전선의 움직임을 하나로 잇습니다.',
          effect: '인접 지원을 받는 전선 전투력 +18%',
          condition: 'supported',
          laneBonus: 0.18,
        },
      },
      {
        id: 'n07-silence',
        title: '기둥을 폭파한다',
        description: '공명은 멎고 돌 파편이 전선에서 가장 약한 무기를 새로 벼린다.',
        outcome: '전선 우선 생존자 강화 · 보급품 -16',
        supplies: -16,
        upgrade: true,
        requiresSupplies: 16,
        echo: {
          triggerDay: 11,
          glyph: '↟',
          name: '폭파된 합창의 잔향',
          story: '무너뜨린 기둥의 화약 배합이 검은 빙벽을 가르는 돌격탄으로 완성됩니다.',
          effect: '돌격 명령 전선 전투력 +17%',
          condition: 'assault',
          laneBonus: 0.17,
        },
      },
    ],
  },
  {
    title: '빙하의 심장',
    location: '푸른 제단',
    body: '산맥을 움직이는 심장이 제단 아래에서 뛴다. 불씨를 먹이거나, 얼음 결정을 떼어 무기에 박을 수 있다.',
    choices: [
      {
        id: 'n08-feed',
        title: '불씨를 나눈다',
        description: '심장의 박동이 느려지고 화로가 그 열을 되돌려 받는다.',
        outcome: '온기 +22 · 사기 +5 · 보급품 -20',
        supplies: -20,
        heat: 22,
        morale: 5,
        requiresSupplies: 20,
        echo: {
          triggerDay: 12,
          glyph: '◉',
          name: '느려진 빙하의 심장',
          story: '나눠 준 불씨가 왕좌 아래 심장의 박동을 늦춰 마지막 세 전선에 숨 쉴 틈을 만듭니다.',
          effect: '모든 전선 전투력 +10%',
          condition: 'all',
          laneBonus: 0.1,
        },
      },
      {
        id: 'n08-shard',
        title: '심장 조각을 캔다',
        description: '전선에서 가장 약한 무기에 푸른 결정이 박힌다. 심장은 원정대의 이름을 기억한다.',
        outcome: '전선 우선 생존자 강화 · 명성 +450 · 사기 -8',
        upgrade: true,
        score: 450,
        morale: -8,
        echo: {
          triggerDay: 12,
          glyph: '◇',
          name: '푸른 심장날',
          story: '무기에 박은 심장 조각이 백색 왕의 병과 균열을 만나 푸른 칼날로 깨어납니다.',
          effect: '병과 우세 전선 전투력 +18%',
          condition: 'advantage',
          laneBonus: 0.18,
        },
      },
      {
        id: 'n08-hearth-pulse',
        title: '심장에 화로의 이름을 건넨다',
        description:
          '원정대의 이름을 하나씩 부르며 불씨를 심장 표면에 놓는다. 거대한 박동이 살아 있는 숨에 맞춰 느려진다.',
        outcome: '온기 +20 · 사기 +10 · 보급품 -18',
        supplies: -18,
        heat: 20,
        morale: 10,
        requiresSupplies: 18,
        oathOnly: 'hearthkeepers',
        echo: {
          triggerDay: 12,
          glyph: '✦',
          name: '왕좌 아래의 따뜻한 박동',
          story: '푸른 심장에 남긴 이름이 왕좌 아래에서 다시 뛰며 마지막 세 전선의 얼음을 동시에 녹입니다.',
          effect: '모든 전선 전투력 +12%',
          condition: 'all',
          laneBonus: 0.12,
        },
      },
      {
        id: 'n08-signal-pulse',
        title: '심장 박자를 신호로 바꾼다',
        description: '박동 사이의 침묵을 기록해 왕관 명령보다 먼저 도착하는 전장 신호로 편성한다.',
        outcome: '명성 +520 · 사기 +6',
        score: 520,
        morale: 6,
        oathOnly: 'signal-corps',
        echo: {
          triggerDay: 12,
          glyph: '⌘',
          name: '왕보다 먼저 울린 응답',
          story: '심장에서 해독한 침묵이 백색 왕의 명령 직전에 울려, 집중 전선의 파훼 신호를 완성합니다.',
          effect: '집중 전선에서 의도 파훼 시 전투력 +22%',
          condition: 'focus-countered',
          laneBonus: 0.22,
        },
      },
      {
        id: 'n08-salvage-vein',
        title: '푸른 광맥을 표시한다',
        description: '심장을 죽이지 않고 결정이 자라는 길만 긁어낸다. 마지막 행군까지 이어질 보급 광맥이 드러난다.',
        outcome: '보급품 +32 · 명성 +180 · 온기 -6 · 사기 -5',
        supplies: 32,
        score: 180,
        heat: -6,
        morale: -5,
        oathOnly: 'salvagers',
        echo: {
          triggerDay: 12,
          glyph: '◈',
          name: '왕좌까지 이어진 푸른 광맥',
          story: '표시해 둔 결정맥이 마지막 전선의 병과 균열을 비추며 회수대의 무기를 정확히 맞물립니다.',
          effect: '병과 우세 전선 전투력 +16%',
          condition: 'advantage',
          laneBonus: 0.16,
        },
      },
    ],
  },
  {
    title: '별이 없는 식사',
    location: '극야 평원',
    body: '굶주린 피난민 무리가 불빛을 따라왔다. 식량은 모두가 먹기에 부족하지만, 그들은 별 없이 왕좌를 피하는 길을 기억한다.',
    choices: [
      {
        id: 'n09-share',
        title: '식량을 나눈다',
        description: '한 사람이 원정대에 남고 나머지는 남쪽 길로 향한다.',
        outcome: '신병 합류 · 사기 +16 · 보급품 -18',
        supplies: -18,
        morale: 16,
        recruit: true,
        requiresSupplies: 18,
        marchImprint: 'linked-hearths',
      },
      {
        id: 'n09-ration',
        title: '왕좌까지 아껴 둔다',
        description: '대열은 살아남지만 뒤에서 멀어지는 발소리를 오래 듣는다.',
        outcome: '보급품 소모 없음 · 명성 +300 · 사기 -9',
        score: 300,
        morale: -9,
        marchImprint: 'measured-rations',
      },
      {
        id: 'n09-starless-route',
        title: '별 없는 길을 함께 그린다',
        description: '식량 대신 화로 곁의 시간을 나눈다. 피난민의 발자국이 불빛을 숨긴 왕좌 우회로로 이어진다.',
        outcome: '명성 +220 · 사기 +8 · 온기 -7',
        score: 220,
        morale: 8,
        heat: -7,
        marchImprint: 'starless-route',
      },
    ],
  },
  {
    title: '불타는 지도',
    location: '왕의 옛길',
    body: '지도 위 길이 하나씩 타 사라진다. 죽은 정찰대의 불빛을 따르거나, 남은 종이를 회수하거나, 사라질 길을 칼날에 새겨야 한다.',
    choices: [
      {
        id: 'n10-ghosts',
        title: '죽은 불빛을 따른다',
        description: '전선의 가장 약한 생존자가 오래전 원정대의 마지막 진형을 배운다.',
        outcome: '전선 우선 생존자 강화 · 사기 +7 · 온기 -6',
        upgrade: true,
        morale: 7,
        heat: -6,
        marchImprint: 'ghost-formation',
      },
      {
        id: 'n10-paper',
        title: '남은 지도를 판다',
        description: '후방 상인이 지도 조각을 사 간다. 그가 어디로 돌아갈지는 알 수 없다.',
        outcome: '보급품 +28 · 명성 +120',
        supplies: 28,
        score: 120,
        marchImprint: 'folded-retreat',
      },
      {
        id: 'n10-burning-vanguard',
        title: '타는 길을 칼날에 새긴다',
        description: '왕좌까지 남은 선을 선봉대의 무기마다 새긴다. 지도는 사라져도 돌격 방향은 잊히지 않는다.',
        outcome: '온기 +10 · 명성 +180 · 보급품 -14',
        supplies: -14,
        heat: 10,
        score: 180,
        requiresSupplies: 14,
        marchImprint: 'burning-vanguard',
      },
    ],
  },
  {
    title: '마지막 전령',
    location: '검은 빙벽',
    body: '왕의 전령이 무기와 세 갈래 군기를 내려놓고 말한다. “그 불씨는 원래 왕의 심장이었다. 돌려주면 모두 살 수 있다.”',
    choices: [
      {
        id: 'n11-listen',
        title: '끝까지 듣는다',
        description: '진실은 두렵지만 원정대는 무엇을 지키는지 분명히 알게 된다.',
        outcome: '사기 +13 · 명성 +340',
        morale: 13,
        score: 340,
        marchImprint: 'unveiled-command',
      },
      {
        id: 'n11-refuse',
        title: '대답 대신 불을 높인다',
        description: '전령의 얼음이 녹으며 숨겨 둔 보급품이 드러난다.',
        outcome: '온기 +13 · 보급품 +12 · 사기 -5',
        heat: 13,
        supplies: 12,
        morale: -5,
        marchImprint: 'raised-ember',
      },
      {
        id: 'n11-woven-standard',
        title: '세 군기를 하나로 꿰맨다',
        description: '왕의 문장을 뜯어 내고 세 부대의 천을 잇는다. 서로 다른 명령이 하나의 행군 박자로 정렬된다.',
        outcome: '사기 +15 · 명성 +220 · 보급품 -14',
        supplies: -14,
        morale: 15,
        score: 220,
        requiresSupplies: 14,
        marchImprint: 'woven-standard',
      },
    ],
  },
  {
    title: '왕좌 앞의 맹세',
    location: '빙관 왕좌',
    body: '마지막 문 앞에서 화로가 사람과 무기를 향해 갈라진다. 세 왕관을 따라온 서약의 인장이 그 사이에 세 번째 불길을 연다.',
    choices: [
      {
        id: 'n12-oath',
        title: '모두에게 불을 나눈다',
        description: '남은 장작을 마지막까지 태운다. 누구도 혼자 추위와 마주하지 않는다.',
        outcome: '온기 +14 · 사기 +14 · 보급품 -20',
        finalVow: 'shared-flame',
        supplies: -20,
        heat: 14,
        morale: 14,
        requiresSupplies: 20,
      },
      {
        id: 'n12-edge',
        title: '한 자루를 완성한다',
        description: '전선의 가장 약한 생존자에게 원정대의 모든 기술을 맡긴다.',
        outcome: '전선 우선 생존자 강화 · 명성 +520 · 사기 -8',
        finalVow: 'perfected-edge',
        upgrade: true,
        score: 520,
        morale: -8,
      },
      {
        id: 'n12-hearth-circle',
        title: '모든 이름으로 화로를 두른다',
        description: '세 왕관 앞에서 지켜 낸 이름을 불러 마지막 장작을 나눈다. 각 전선의 불꽃이 서로를 향해 휘어진다.',
        outcome: '온기 +12 · 사기 +18 · 보급품 -16',
        finalVow: 'hearth-circle',
        supplies: -16,
        heat: 12,
        morale: 18,
        requiresSupplies: 16,
        oathOnly: 'hearthkeepers',
      },
      {
        id: 'n12-signal-beacon',
        title: '마지막 신호를 화로에 겹친다',
        description: '세 전선의 응답을 하나로 압축해 화로가 가리키는 곳에 왕관보다 먼저 도착시킨다.',
        outcome: '명성 +600 · 사기 +6',
        finalVow: 'signal-beacon',
        score: 600,
        morale: 6,
        oathOnly: 'signal-corps',
      },
      {
        id: 'n12-salvaged-crown',
        title: '왕관을 전선의 자재로 해체한다',
        description: '왕좌의 장식부터 뜯어 세 전선의 방벽과 무기에 나눠 붙인다. 남길 상징은 하나도 없다.',
        outcome: '보급품 +24 · 명성 +280 · 사기 -6',
        finalVow: 'salvaged-crown',
        supplies: 24,
        score: 280,
        morale: -6,
        oathOnly: 'salvagers',
      },
    ],
  },
]

const ALTERNATE_CAMPAIGN_EVENTS: Partial<Record<number, CampaignEvent>> = {
  2: {
    title: '얼어붙은 우편마차',
    location: '바람 협곡 · 끊긴 우편로',
    body: '전복된 우편마차 아래에서 전령 하나가 숨을 몰아쉰다. 봉인된 편지는 남쪽으로 향하고, 차축에는 아직 쓸 기름이 남아 있다.',
    routeVariant: 2,
    choices: [
      {
        id: 'n02-courier',
        title: '전령을 깨워 길을 잇는다',
        description: '식량을 나누고 얼어붙은 다리를 묶는다. 전령은 마지막 편지를 품고 원정대에 합류한다.',
        outcome: '신병 합류 · 사기 +9 · 보급품 -8',
        supplies: -8,
        morale: 9,
        recruit: true,
        requiresSupplies: 8,
        echo: {
          triggerDay: 6,
          glyph: '⌁',
          name: '답장을 품은 전령',
          story: '살려 보낸 편지의 답장이 얼음 회랑에 먼저 도착해 인접 전선 사이의 안전한 길을 표시합니다.',
          effect: '인접 지원을 받는 전선 전투력 +14%',
          condition: 'supported',
          laneBonus: 0.14,
        },
      },
      {
        id: 'n02-axle',
        title: '차축과 등유를 회수한다',
        description: '마차를 해체해 수레와 화로를 손본다. 보내지 못한 편지는 눈 속에서 다시 얼어붙는다.',
        outcome: '보급품 +18 · 온기 +8 · 사기 -7',
        supplies: 18,
        heat: 8,
        morale: -7,
        echo: {
          triggerDay: 6,
          glyph: '▰',
          name: '우편마차의 철제 차축',
          story: '회수한 차축이 얼음 회랑의 좁은 입구를 가로막는 버팀대로 다시 조립됩니다.',
          effect: '방벽 명령 전선 전투력 +13%',
          condition: 'hold',
          laneBonus: 0.13,
        },
      },
    ],
  },
  3: {
    title: '거꾸로 선 망루',
    location: '침묵의 도로 · 매몰된 감시선',
    body: '뿌리째 뽑힌 망루가 눈 속에 거꾸로 박혀 있다. 지하가 된 꼭대기에서 꺼져 가는 신호와 온전한 렌즈 하나가 발견된다.',
    routeVariant: 2,
    choices: [
      {
        id: 'n03-relight',
        title: '마지막 신호를 다시 밝힌다',
        description: '화로 불씨를 떼어 남쪽 감시선이 볼 때까지 렌즈 뒤에 붙든다.',
        outcome: '명성 +280 · 사기 +8 · 온기 -6',
        score: 280,
        morale: 8,
        heat: -6,
        echo: {
          triggerDay: 7,
          glyph: '⌘',
          name: '뒤집힌 망루의 응답',
          story: '다시 밝힌 감시선이 공허 성당의 거짓 성가가 시작되는 박자를 멀리서 끊어 알립니다.',
          effect: '적 의도를 파훼한 전선 전투력 +15%',
          condition: 'countered',
          laneBonus: 0.15,
        },
      },
      {
        id: 'n03-lens',
        title: '신호 렌즈를 떼어 낸다',
        description: '빛을 포기하고 온전한 유리와 황동을 보급 수레에 싣는다.',
        outcome: '보급품 +28 · 사기 -6',
        supplies: 28,
        morale: -6,
        echo: {
          triggerDay: 7,
          glyph: '◉',
          name: '거꾸로 비춘 성당',
          story: '떼어 둔 렌즈가 성당의 파동을 한 전선에 모아, 화로 신호와 파훼 명령이 겹치는 순간을 드러냅니다.',
          effect: '집중 전선에서 의도 파훼 시 전투력 +20%',
          condition: 'focus-countered',
          laneBonus: 0.2,
        },
      },
    ],
  },
  5: {
    title: '끊어진 설원 열차',
    location: '유리 협곡 · 매달린 궤도',
    body: '피난 열차의 마지막 객차가 협곡 가장자리에 매달려 있다. 연결쇠를 묶으면 사람을 구할 수 있지만, 화물칸을 떨구면 보급로가 열린다.',
    routeVariant: 2,
    choices: [
      {
        id: 'n05-coupling',
        title: '연결쇠를 다시 묶는다',
        description: '식량 자루의 끈까지 풀어 객차를 끌어올린다. 살아남은 기관수가 원정대의 길을 맡는다.',
        outcome: '신병 합류 · 사기 +13 · 보급품 -12',
        supplies: -12,
        morale: 13,
        recruit: true,
        requiresSupplies: 12,
        echo: {
          triggerDay: 9,
          glyph: '≋',
          name: '이어 붙인 피난 열차',
          story: '구조한 기관수가 극야 평원의 얼어붙은 선로를 찾아 인접 전선의 지원대를 곧장 실어 나릅니다.',
          effect: '인접 지원을 받는 전선 전투력 +16%',
          condition: 'supported',
          laneBonus: 0.16,
        },
      },
      {
        id: 'n05-drop',
        title: '화물칸을 협곡 아래로 떨군다',
        description: '무게가 줄자 앞 객차가 살아난다. 원정대는 부서진 화물에서 쓸 것을 챙긴다.',
        outcome: '보급품 +28 · 명성 +150 · 사기 -8',
        supplies: 28,
        score: 150,
        morale: -8,
        echo: {
          triggerDay: 9,
          glyph: '◉',
          name: '가벼워진 돌파선',
          story: '협곡에서 버린 무게만큼 대열이 빨라져 극야 평원의 한 전선에 화로와 병력을 집중시킵니다.',
          effect: '화로 집중 전선 전투력 +15%',
          condition: 'focus',
          laneBonus: 0.15,
        },
      },
    ],
  },
  6: {
    title: '이름을 가둔 수정',
    location: '얼음 회랑 · 거울 저장고',
    body: '벽 속 수정마다 잊힌 순례자의 이름이 갇혀 있다. 기억을 돌려주면 길잡이가 깨어나고, 수정을 태우면 왕의 옛길이 불빛으로 드러난다.',
    routeVariant: 2,
    choices: [
      {
        id: 'n06-return',
        title: '기억을 주인에게 돌려준다',
        description:
          '수정에 손을 대고 이름을 하나씩 부른다. 깨어난 길잡이가 가장 약한 생존자에게 잊힌 전투법을 가르친다.',
        outcome: '전선 우선 생존자 강화 · 사기 +10 · 온기 -8',
        upgrade: true,
        morale: 10,
        heat: -8,
        echo: {
          triggerDay: 10,
          glyph: '◇',
          name: '되찾은 순례자의 눈',
          story: '이름을 되찾은 길잡이가 왕의 옛길에서 적 병과가 갈라지는 순간을 먼저 짚어 냅니다.',
          effect: '병과 우세 전선 전투력 +16%',
          condition: 'advantage',
          laneBonus: 0.16,
        },
      },
      {
        id: 'n06-burn-memory',
        title: '수정을 길표로 태운다',
        description: '이름은 사라지지만 푸른 불빛이 회랑 끝까지 이어진다.',
        outcome: '온기 +17 · 명성 +140 · 사기 -6',
        heat: 17,
        score: 140,
        morale: -6,
        echo: {
          triggerDay: 10,
          glyph: '◉',
          name: '기억을 태운 길표',
          story: '푸른 길표가 죽은 정찰대의 불빛과 겹쳐 화로가 가리키는 단 하나의 돌파선을 밝힙니다.',
          effect: '화로 집중 전선 전투력 +15%',
          condition: 'focus',
          laneBonus: 0.15,
        },
      },
    ],
  },
  7: {
    title: '숨을 쉬는 파이프',
    location: '공허 성당 · 지하 오르간',
    body: '무너진 오르간의 파이프 안에서 아직 따뜻한 숨이 오간다. 갇힌 이들을 꺼내거나, 파이프를 녹여 성당을 가를 무기를 만들 수 있다.',
    routeVariant: 2,
    choices: [
      {
        id: 'n07-release',
        title: '파이프를 열어 숨을 돌려준다',
        description: '밀폐된 관을 하나씩 열자 살아 있는 목소리가 적의 합창 위에 새로운 박자를 만든다.',
        outcome: '사기 +15 · 명성 +220 · 온기 -7',
        heat: -7,
        morale: 15,
        score: 220,
        echo: {
          triggerDay: 11,
          glyph: '≋',
          name: '서로 다른 숨의 행군가',
          story: '구해 낸 이들의 서로 다른 박자가 검은 빙벽 앞에서 세 명령을 하나의 진군가로 엮습니다.',
          effect: '두 종류 이상의 명령 배치 시 모든 전투력 +11%',
          condition: 'mixed-orders',
          laneBonus: 0.11,
        },
      },
      {
        id: 'n07-pipes',
        title: '파이프를 녹여 돌격창을 만든다',
        description: '남은 숨은 멎지만 황동이 가장 약한 전선의 무기로 다시 태어난다.',
        outcome: '전선 우선 생존자 강화 · 보급품 -15',
        supplies: -15,
        upgrade: true,
        requiresSupplies: 15,
        echo: {
          triggerDay: 11,
          glyph: '↟',
          name: '황동 숨결의 돌격창',
          story: '녹여 만든 창이 검은 빙벽의 첫 균열에서 공명을 일으켜 돌격 대열을 밀어 줍니다.',
          effect: '돌격 명령 전선 전투력 +17%',
          condition: 'assault',
          laneBonus: 0.17,
        },
      },
    ],
  },
}

export function seededValue(seed: number, salt: number): number {
  let value = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  return (value ^ (value >>> 15)) >>> 0
}

export function nightConditionFor(seed: number, day: number): NightCondition & { id: NightConditionId } {
  const normalizedDay = Math.max(1, Math.min(MAX_NIGHTS, Math.trunc(day)))
  const index = seededValue(seed, normalizedDay * 31 + 7) % NIGHT_CONDITION_IDS.length
  let id = NIGHT_CONDITION_IDS[index]
  if (normalizedDay > 1 && id === nightConditionFor(seed, normalizedDay - 1).id) {
    id = NIGHT_CONDITION_IDS[(index + 1) % NIGHT_CONDITION_IDS.length]
  }
  return { id, ...NIGHT_CONDITIONS[id] }
}

export function campaignEventFor(runSeed: number, day: number): CampaignEvent {
  const normalizedDay = Math.max(1, Math.min(MAX_NIGHTS, Math.trunc(day)))
  const baseEvent = CAMPAIGN_EVENTS[normalizedDay - 1]
  const alternateEvent = ALTERNATE_CAMPAIGN_EVENTS[normalizedDay]
  return alternateEvent && seededValue(runSeed, normalizedDay * 43 + 911) % 2 === 1 ? alternateEvent : baseEvent
}

export function decisionsMatchCampaign(
  decisions: readonly string[],
  eventResolvedForDay: number,
  oath: OathId,
  runSeed: number,
): boolean {
  return (
    decisions.length === eventResolvedForDay &&
    decisions.every((decision, index) => {
      const choice = campaignEventFor(runSeed, index + 1).choices.find((candidate) => candidate.id === decision)
      return Boolean(choice && (!choice.oathOnly || choice.oathOnly === oath))
    })
  )
}

export function oathInterventionCountFor(oath: OathId, decisions: readonly string[]): number {
  return OATH_CHRONICLES[oath].stages.filter((stage) => {
    const choiceId = decisions[stage.day - 1]
    const choice = choiceId
      ? CAMPAIGN_EVENTS[stage.day - 1]?.choices.find((candidate) => candidate.id === choiceId)
      : null
    return choice?.oathOnly === oath
  }).length
}

export function activeDecisionEchoFor(
  decisions: readonly string[],
  day: number,
  runSeed: number,
): ActiveDecisionEcho | null {
  for (let sourceIndex = 0; sourceIndex < decisions.length; sourceIndex += 1) {
    const event = campaignEventFor(runSeed, sourceIndex + 1)
    const choice = event.choices.find(
      (candidate) => candidate.id === decisions[sourceIndex] && candidate.echo?.triggerDay === day,
    )
    if (!choice?.echo) continue
    return {
      ...choice.echo,
      choiceId: choice.id,
      sourceDay: sourceIndex + 1,
      sourceEvent: event.title,
      sourceChoice: choice.title,
    }
  }
  return null
}

export function finalMarchImprintsFor(decisions: readonly string[], day: number): ActiveFinalMarchImprint[] {
  if (day < 9) return []
  const imprints: ActiveFinalMarchImprint[] = []
  for (
    let sourceIndex = 8;
    sourceIndex <= 10 && sourceIndex < decisions.length && sourceIndex < day;
    sourceIndex += 1
  ) {
    const choiceId = decisions[sourceIndex]
    const choice = CAMPAIGN_EVENTS[sourceIndex]?.choices.find(
      (candidate) => candidate.id === choiceId && candidate.marchImprint,
    )
    if (!choice?.marchImprint) continue
    imprints.push({
      ...FINAL_MARCH_IMPRINTS[choice.marchImprint],
      id: choice.marchImprint,
      choiceId,
      sourceDay: sourceIndex + 1,
      sourceChoice: choice.title,
    })
  }
  return imprints
}

export function finalVowFor(decisions: readonly string[]): ActiveFinalVow | null {
  const choiceId = decisions[MAX_NIGHTS - 1]
  if (!choiceId) return null
  const choice = CAMPAIGN_EVENTS[MAX_NIGHTS - 1]?.choices.find(
    (candidate) => candidate.id === choiceId && candidate.finalVow,
  )
  if (!choice?.finalVow) return null
  return {
    ...FINAL_VOWS[choice.finalVow],
    id: choice.finalVow,
    choiceId,
    sourceChoice: choice.title,
  }
}

export function finalVowBonusFor(vow: ActiveFinalVow | null, lane: number, context: BattleContext): number {
  if (!vow) return 0
  const applies = vow.condition === 'all' || (vow.condition === 'focus' && lane === context.focusLane)
  return applies ? vow.laneBonus : 0
}

function combatConditionApplies(
  condition: DecisionEchoCondition,
  lane: number,
  context: BattleContext,
  relation: LaneResult['relation'],
  order: BattleOrder,
  countered: boolean,
  supportCount: number,
): boolean {
  return (
    condition === 'all' ||
    (condition === 'hold' && order === 'hold') ||
    (condition === 'countered' && countered) ||
    (condition === 'focus' && lane === context.focusLane) ||
    (condition === 'assault' && order === 'assault') ||
    (condition === 'advantage' && relation === 'advantage') ||
    (condition === 'supported' && supportCount > 0) ||
    (condition === 'mixed-orders' && new Set(context.orders).size >= 2) ||
    (condition === 'focus-countered' && lane === context.focusLane && countered)
  )
}

export function decisionEchoBonusFor(
  echo: ActiveDecisionEcho | null,
  lane: number,
  context: BattleContext,
  relation: LaneResult['relation'],
  order: BattleOrder,
  countered: boolean,
  supportCount: number,
): number {
  if (!echo?.laneBonus || !echo.condition) return 0
  return combatConditionApplies(echo.condition, lane, context, relation, order, countered, supportCount)
    ? echo.laneBonus
    : 0
}

export function finalMarchImprintBonusFor(
  imprints: readonly ActiveFinalMarchImprint[],
  lane: number,
  context: BattleContext,
  relation: LaneResult['relation'],
  order: BattleOrder,
  countered: boolean,
  supportCount: number,
): { ids: FinalMarchImprintId[]; bonus: number } {
  const active = imprints.filter((imprint) =>
    combatConditionApplies(imprint.condition, lane, context, relation, order, countered, supportCount),
  )
  return {
    ids: active.map((imprint) => imprint.id),
    bonus: Math.min(
      0.22,
      active.reduce((total, imprint) => total + imprint.laneBonus, 0),
    ),
  }
}

export const LEGACY_UPGRADES: Record<
  LegacyId,
  { name: string; glyph: string; cost: number; description: string; strategy: string }
> = {
  'banked-ember': {
    name: '보관된 불씨',
    glyph: '✦',
    cost: 6,
    description: '다음 원정의 시작 온기 +10',
    strategy: '온기 부족으로 멈춘 원정의 초반 안전 구간을 가장 빠르게 넓힙니다.',
  },
  'supply-cache': {
    name: '숨겨 둔 창고',
    glyph: '▣',
    cost: 10,
    description: '다음 원정의 시작 보급품 +20',
    strategy: '신호탄·화로·유료 결단의 첫 막 선택지를 동시에 늘립니다.',
  },
  'veteran-oath': {
    name: '노병의 서약',
    glyph: '◆',
    cost: 16,
    description: '첫 수호대가 II 등급으로 출정',
    strategy: '첫 왕관 전까지 필요한 합성 횟수를 줄여 성장 병목을 앞당겨 풉니다.',
  },
  'command-seal': {
    name: '지휘관의 인장',
    glyph: '⌘',
    cost: 22,
    description: '매 전투 명령 점수 +1',
    strategy: '복합 명령 여유가 적은 높은 위험도에서 의도 파훼 선택을 한 단계 넓힙니다.',
  },
  'chroniclers-ink': {
    name: '기록관의 잉크',
    glyph: '≋',
    cost: 28,
    description: '모든 명성 획득량 +8%',
    strategy: '불꽃의 왕관과 상위 원정 등급을 노리는 완주 기록의 명성 상한을 높입니다.',
  },
  'salvagers-instinct': {
    name: '회수꾼의 감각',
    glyph: '◈',
    cost: 34,
    description: '승리 보급품 +8',
    strategy: '긴 원정의 매 승리를 다음 성장과 화로 투자로 이어 주는 후반 경제 핵심입니다.',
  },
}

export const MASTERY_CONTRACTS: Record<
  MasteryContractId,
  {
    name: string
    glyph: string
    label: string
    description: string
    burden: string
    reward: string
    scoreScale: number
    startingHeatDelta: number
    startingSuppliesDelta: number
    commandDelta: number
    requiredMasteryLevel: number
  }
> = {
  'fading-hearth': {
    name: '잦아드는 화로',
    glyph: '✧',
    label: 'COVENANT I · FADING HEARTH',
    description: '계승한 온기를 스스로 덜어 내고, 더 차가운 첫걸음으로 원정 기록을 다시 증명합니다.',
    burden: '시작 온기 −20',
    reward: '모든 명성 ×1.10',
    scoreScale: 1.1,
    startingHeatDelta: -20,
    startingSuppliesDelta: 0,
    commandDelta: 0,
    requiredMasteryLevel: 0,
  },
  'winter-rations': {
    name: '겨울의 배급',
    glyph: '◈',
    label: 'COVENANT II · WINTER RATIONS',
    description: '숨겨 둔 창고의 몫까지 북부에 남기고, 빠듯한 성장선으로 마지막 행군을 이어 갑니다.',
    burden: '시작 보급품 −35',
    reward: '모든 명성 ×1.14',
    scoreScale: 1.14,
    startingHeatDelta: 0,
    startingSuppliesDelta: -35,
    commandDelta: 0,
    requiredMasteryLevel: 1,
  },
  'silent-standard': {
    name: '침묵의 군기',
    glyph: '⚑',
    label: 'COVENANT III · SILENT STANDARD',
    description: '지휘관의 인장을 봉하고, 더 적은 명령만으로 세 전선의 의도를 꿰뚫습니다.',
    burden: '매 전투 명령 한도 −1',
    reward: '모든 명성 ×1.18',
    scoreScale: 1.18,
    startingHeatDelta: 0,
    startingSuppliesDelta: 0,
    commandDelta: -1,
    requiredMasteryLevel: 2,
  },
}

export const LEGACY_MASTERY_STEP = 30

const LEGACY_MASTERY_RANKS = [
  {
    glyph: '◇',
    title: '완성된 계승자',
    description: '여섯 유산을 모두 이었습니다. 이제 남는 불씨가 영원 인장을 벼립니다.',
  },
  {
    glyph: '✦',
    title: '북부의 기록자',
    description: '반복된 새벽을 하나의 인장으로 남겨 다음 원정대가 길을 잃지 않게 합니다.',
  },
  {
    glyph: '♜',
    title: '세 왕관의 증인',
    description: '무너뜨린 왕관과 되찾은 새벽을 북부의 영구 연대기에 새겼습니다.',
  },
  {
    glyph: '❄',
    title: '백야의 수호자',
    description: '가장 긴 눈보라 뒤에도 다시 출정한 지휘관의 이름이 설원에 남습니다.',
  },
  {
    glyph: '☼',
    title: '영원의 화로지기',
    description: '완성 이후의 모든 원정을 끝없는 명예 인장으로 이어 갑니다.',
  },
] as const

export const ACHIEVEMENTS: Record<AchievementId, { name: string; glyph: string; description: string }> = {
  'first-watch': { name: '첫 번째 망루', glyph: '01', description: '처음으로 한 밤의 전투에서 승리' },
  'first-resonance': { name: '이어진 불씨', glyph: '∞', description: '처음으로 유물 공명 완성' },
  'unbroken-wall': { name: '흠 없는 성벽', glyph: '◆', description: '한 밤의 세 전선을 모두 방어' },
  'intent-breaker': { name: '눈보라를 읽는 자', glyph: '⌁', description: '세 적 의도를 한 전투에서 모두 파훼' },
  'threefold-company': { name: '세 갈래 원정대', glyph: '≋', description: '세 병과로 보스전에서 승리' },
  'last-spark': { name: '마지막 불씨', glyph: '✦', description: '온기 20% 이하에서 승리' },
  'crown-breaker': { name: '왕관 파쇄자', glyph: '♜', description: '세 보스를 모두 격파' },
  'whiteout-victor': { name: '백색 종말의 생존자', glyph: '❄', description: '백색 종말 난이도 완주' },
  'seventh-dawn': { name: '되찾은 새벽', glyph: '☼', description: '12일 캠페인 완주' },
  'threefold-oath': { name: '세 겹의 서약', glyph: '≋', description: '한 원정에서 개인 과업 3개 완수' },
  'shared-dawn': { name: '같은 하늘 아래', glyph: '◇', description: '오늘의 균열 완주' },
  'ending-shared-flame': { name: '모두의 새벽', glyph: '✦', description: '자비의 선택으로 모두의 새벽 발견' },
  'ending-ember-crown': { name: '불꽃의 왕관', glyph: '♜', description: '높은 명성으로 불꽃의 왕관 발견' },
  'ending-crownless-spring': { name: '왕관 없는 봄', glyph: '◇', description: '왕좌를 비운 왕관 없는 봄 발견' },
  'ending-broken-watch': { name: '무너진 첫 망루', glyph: '▱', description: '첫 막에서 끝난 원정의 결말 기록' },
  'ending-frozen-choir': { name: '얼어붙은 성가', glyph: '≋', description: '두 번째 막에서 끝난 원정의 결말 기록' },
  'ending-last-march': { name: '마지막 행군', glyph: '⚑', description: '왕좌 앞에서 끝난 원정의 결말 기록' },
  'protocol-guided-flame': {
    name: '꺼지지 않는 길잡이',
    glyph: '✦',
    description: '불씨 이야기를 최종 온기 45% 이상으로 완주',
  },
  'protocol-tactical-recovery': {
    name: '설원의 회수관',
    glyph: '⌘',
    description: '원정대에서 적 의도를 24회 이상 파훼하고 완주',
  },
  'protocol-whiteout-law': {
    name: '무결의 백색 지휘',
    glyph: '❄',
    description: '백색 종말에서 완벽 방어 6회를 달성하고 완주',
  },
  'oath-three-hearths': {
    name: '세 번 이어진 화로',
    glyph: '✦',
    description: '화로지기의 세 왕관 전용 결단을 모두 새기고 완주',
  },
  'oath-three-signals': {
    name: '세 번 울린 응답',
    glyph: '⌘',
    description: '신호단의 세 왕관 전용 결단을 모두 새기고 완주',
  },
  'oath-crown-reclaimed': {
    name: '왕관까지 이어진 회수선',
    glyph: '◈',
    description: '회수대의 세 왕관 전용 결단을 모두 새기고 완주',
  },
}

export const INITIAL_META: MetaState = {
  embers: 0,
  completedRuns: 0,
  legacy: [],
  masteredContracts: [],
  achievements: [],
  discoveredRelics: [],
  history: [],
}

export const RELIC_IDS = Object.keys(RELICS) as RelicId[]
export const RESONANCE_IDS = Object.keys(RESONANCES) as ResonanceId[]
export const LEGACY_IDS = Object.keys(LEGACY_UPGRADES) as LegacyId[]
export const MASTERY_CONTRACT_IDS = Object.keys(MASTERY_CONTRACTS) as MasteryContractId[]
export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[]
export const OATH_IDS = Object.keys(OATHS) as OathId[]
export const NIGHT_CONDITION_IDS = Object.keys(NIGHT_CONDITIONS) as NightConditionId[]
export const TRIAL_IDS = Object.keys(TRIALS) as TrialId[]
export const RELIC_NIGHTS = new Set([2, 4, 6, 8, 10])
export const MAX_HISTORY = 8

export function legacyMasteryFor(meta: Pick<MetaState, 'embers' | 'legacy'>): LegacyMasteryProgress | null {
  if (meta.legacy.length !== LEGACY_IDS.length) return null
  const level = Math.floor(meta.embers / LEGACY_MASTERY_STEP)
  const current = meta.embers % LEGACY_MASTERY_STEP
  const rank = LEGACY_MASTERY_RANKS[Math.min(level, LEGACY_MASTERY_RANKS.length - 1)]
  const nextLevel = level + 1
  const nextRank = LEGACY_MASTERY_RANKS[Math.min(nextLevel, LEGACY_MASTERY_RANKS.length - 1)]
  return {
    level,
    sealLabel: level === 0 ? '영원 인장 준비' : `영원 인장 ${level}`,
    glyph: rank.glyph,
    title: level > LEGACY_MASTERY_RANKS.length - 1 ? `${rank.title} · ${level}` : rank.title,
    description: rank.description,
    current,
    target: LEGACY_MASTERY_STEP,
    remaining: LEGACY_MASTERY_STEP - current,
    progress: Math.round((current / LEGACY_MASTERY_STEP) * 100),
    nextTitle: nextLevel > LEGACY_MASTERY_RANKS.length - 1 ? `${nextRank.title} · ${nextLevel}` : nextRank.title,
  }
}

export const TIER_LABELS = ['0', 'I', 'II', 'III', 'IV']
export const PLAYER_POWER = [0, 18, 40, 86, 180]
export const ENEMY_POWER = [0, 15, 34, 76, 168]
export const EXPEDITION_RANKS: Array<{
  rank: ExpeditionRank
  minimum: number
  title: string
  description: string
}> = [
  {
    rank: 'S',
    minimum: 75_000,
    title: '백야의 전설',
    description: '완벽 방어와 교리 파훼를 끝까지 이어 낸 최고 기록',
  },
  {
    rank: 'A',
    minimum: 62_000,
    title: '왕관 파쇄자',
    description: '왕관을 차지할 명성과 전술 완성도를 증명한 기록',
  },
  {
    rank: 'B',
    minimum: 50_000,
    title: '새벽의 선봉',
    description: '손실을 통제하며 세 막을 안정적으로 돌파한 기록',
  },
  {
    rank: 'C',
    minimum: 40_000,
    title: '긴 밤의 생존자',
    description: '흔들린 전선을 수습하고 마지막 새벽에 도달한 기록',
  },
  {
    rank: 'D',
    minimum: 0,
    title: '남겨진 불씨',
    description: '4만 미만의 완주 기록 또는 중도 종료된 원정',
  },
]
