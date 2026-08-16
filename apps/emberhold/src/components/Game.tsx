'use client'

import dynamic from 'next/dynamic'
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { CampaignHud } from './CampaignHud'
import type { RosterMergeReadiness } from './CampRoster'
import { DragGhostPreview, GameFeedback } from './GameFeedback'
import type {
  AchievementId,
  ActiveLayer,
  AmbientSession,
  ArchiveTab,
  BattleContext,
  BattleOrder,
  BattleResult,
  BossMechanic,
  CampUndo,
  CampUndoKind,
  DeploymentForecast,
  Difficulty,
  DragSession,
  EndingDiscoveryEntry,
  EndingId,
  Enemy,
  EnemyIntent,
  EventChoice,
  EventChoiceForecast,
  EventRouteState,
  ExpeditionRank,
  ExpeditionRecord,
  FailureInsight,
  FinalCrownSeal,
  GameBackup,
  GameSettings,
  GameState,
  GrowthCeremony,
  InstallPromptEvent,
  LaneResult,
  LegacyId,
  LegacyRewardBreakdown,
  MarchSealCeremony,
  MasteryContractId,
  MetaState,
  MilestoneNotice,
  NightCondition,
  OathId,
  Phase,
  ProtocolMasteryProgress,
  RelicId,
  RenownLedger,
  ResonanceId,
  RunMode,
  SavedBattle,
  SessionAccess,
  SoundEffect,
  SoundscapeMood,
  SoundscapePreset,
  SpecializationId,
  StandaloneNavigator,
  StorageProtection,
  TacticalAdjustment,
  TrialId,
  TutorialStep,
  Unit,
  UnitKind,
} from './game-model'
import {
  ACHIEVEMENT_IDS,
  ACHIEVEMENTS,
  ACT_TRANSITIONS,
  ACTS,
  activeDecisionEchoFor,
  BOSS_MECHANICS,
  CAMPAIGN_PACE_BENCHMARKS,
  campaignEventFor,
  DIFFICULTIES,
  decisionEchoBonusFor,
  decisionsMatchCampaign,
  ELITE_ENCOUNTERS,
  EMBER_CROWN_SCORE,
  ENDING_ACHIEVEMENTS,
  ENDING_IDS,
  ENDING_ROUTES,
  ENDINGS,
  ENEMY_DOCTRINES,
  ENEMY_INTENTS,
  ENEMY_NAMES,
  ENEMY_PATTERNS,
  ENEMY_POWER,
  ENEMY_TIERS,
  EXPEDITION_RANKS,
  expeditionComparisonKey,
  FINAL_CROWN_MASTERY_SCORE,
  FINAL_CROWN_REQUIRED_SEALS,
  FINAL_CROWN_SEALS,
  FINAL_MARCH_GATES,
  FINAL_MARCH_IMPRINTS,
  FINAL_VOWS,
  finalMarchImprintBonusFor,
  finalMarchImprintsFor,
  finalVowBonusFor,
  finalVowFor,
  INITIAL_META,
  INTENT_META,
  inheritedPowerEnabledFor,
  KIND_META,
  LEGACY_IDS,
  LEGACY_UPGRADES,
  legacyMasteryFor,
  MASTERY_CONTRACT_IDS,
  MASTERY_CONTRACTS,
  MAX_HISTORY,
  MAX_NIGHTS,
  MAX_TIER,
  MERCY_DECISIONS,
  NIGHT_STORIES,
  nightConditionFor,
  OATH_CHRONICLE_ACHIEVEMENTS,
  OATH_CHRONICLES,
  OATH_IDS,
  OATHS,
  ORDER_META,
  oathInterventionCountFor,
  PLAYER_POWER,
  PROTOCOL_MASTERIES,
  RELIC_IDS,
  RELIC_NIGHTS,
  RELICS,
  REQUIRED_LANE_WINS,
  RESONANCE_IDS,
  RESONANCES,
  ROSTER_SIZE,
  retreatSupplyFor,
  runCodeFor,
  runCodeFromText,
  SPECIALIZATION_IDS,
  SPECIALIZATIONS,
  SPECIALIZATIONS_BY_KIND,
  SURVIVOR_EPITHETS,
  SURVIVOR_NAMES,
  seededValue,
  seedForRunCode,
  TIER_LABELS,
  TRIAL_IDS,
  TRIALS,
  TUTORIAL_COPY,
  TUTORIAL_ORDER,
  UNIT_ROTATION,
  WINNING_ENDING_IDS,
} from './game-model'
import {
  loadArchiveDialog,
  loadCampaignComponents,
  loadCampaignEventDialog,
  loadCinematicLayers,
  loadEndingScreen,
  loadExpeditionMenu,
  loadHelpDialogs,
  loadProgressionDialogs,
  loadSettingsDialog,
  preloadArchiveDialog,
  preloadCampaignComponents,
  preloadCampaignEventDialog,
  preloadCinematicLayers,
  preloadEndingScreen,
  preloadExpeditionMenu,
  preloadHelpDialogs,
  preloadProgressionDialogs,
  preloadSettingsDialog,
} from './game-preloads'
import { LegacyDepartureBriefing } from './LegacyLoadout'
import { TitleScreen } from './TitleScreen'
import { SNOW_PARTICLES, WorldBackdrop } from './WorldBackdrop'

function DeferredGameLayer({ label, scope }: { label: string; scope?: ActiveLayer }) {
  return (
    <div
      className="deferred-game-layer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      data-focus-scope={scope}
      tabIndex={-1}
    >
      <span aria-hidden="true">
        <i />
        <b>✦</b>
      </span>
      <strong>{label}</strong>
    </div>
  )
}

const ArchiveDialog = dynamic(() => loadArchiveDialog().then((module) => module.ArchiveDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="원정 기록을 펼치는 중" scope="archive" />,
})
const CampaignStageGate = dynamic(() => loadCampaignComponents().then((module) => module.CampaignStageGate), {
  ssr: false,
  loading: () => <DeferredGameLayer label="원정 지휘소를 준비하는 중" scope="battle" />,
})
const BattleBriefing = dynamic(() => loadCampaignComponents().then((module) => module.BattleBriefing), {
  ssr: false,
  loading: () => null,
})
const BattleCommandControls = dynamic(() => loadCampaignComponents().then((module) => module.BattleCommandControls), {
  ssr: false,
  loading: () => null,
})
const BattleLaunch = dynamic(() => loadCampaignComponents().then((module) => module.BattleLaunch), {
  ssr: false,
  loading: () => null,
})
const BattleDirectives = dynamic(() => loadCampaignComponents().then((module) => module.BattleDirectives), {
  ssr: false,
  loading: () => null,
})
const EnemyFormation = dynamic(() => loadCampaignComponents().then((module) => module.EnemyFormation), {
  ssr: false,
  loading: () => null,
})
const PlayerFormation = dynamic(() => loadCampaignComponents().then((module) => module.PlayerFormation), {
  ssr: false,
  loading: () => null,
})
const BattleReadiness = dynamic(() => loadCampaignComponents().then((module) => module.BattleReadiness), {
  ssr: false,
  loading: () => null,
})
const CampActions = dynamic(() => loadCampaignComponents().then((module) => module.CampActions), {
  ssr: false,
  loading: () => null,
})
const CampUndoNotice = dynamic(() => loadCampaignComponents().then((module) => module.CampUndoNotice), {
  ssr: false,
  loading: () => null,
})
const QuartermasterLedger = dynamic(() => loadCampaignComponents().then((module) => module.QuartermasterLedger), {
  ssr: false,
  loading: () => null,
})
const CampOverview = dynamic(() => loadCampaignComponents().then((module) => module.CampOverview), {
  ssr: false,
  loading: () => null,
})
const CampRosterGrid = dynamic(() => loadCampaignComponents().then((module) => module.CampRosterGrid), {
  ssr: false,
  loading: () => null,
})
const SelectedUnitReadout = dynamic(() => loadCampaignComponents().then((module) => module.SelectedUnitReadout), {
  ssr: false,
  loading: () => null,
})
const MobileCommandDock = dynamic(() => loadCampaignComponents().then((module) => module.MobileCommandDock), {
  ssr: false,
  loading: () => null,
})
const TutorialCoach = dynamic(() => loadCampaignComponents().then((module) => module.TutorialCoach), {
  ssr: false,
  loading: () => null,
})
const CampaignEventDialog = dynamic(() => loadCampaignEventDialog().then((module) => module.CampaignEventDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="밤의 선택지를 불러오는 중" scope="event" />,
})
const ActInterlude = dynamic(() => loadCinematicLayers().then((module) => module.ActInterlude), {
  ssr: false,
  loading: () => <DeferredGameLayer label="다음 막을 준비하는 중" scope="interlude" />,
})
const BattleCinemaDirector = dynamic(() => loadCinematicLayers().then((module) => module.BattleCinemaDirector), {
  ssr: false,
  loading: () => <DeferredGameLayer label="교전 기록을 준비하는 중" scope="battle" />,
})
const FinaleSequence = dynamic(() => loadCinematicLayers().then((module) => module.FinaleSequence), {
  ssr: false,
  loading: () => <DeferredGameLayer label="마지막 새벽을 준비하는 중" scope="finale" />,
})
const EndingScreen = dynamic(() => loadEndingScreen().then((module) => module.EndingScreen), {
  ssr: false,
  loading: () => <DeferredGameLayer label="원정 결산을 기록하는 중" scope="ending" />,
})
const ExpeditionMenu = dynamic(() => loadExpeditionMenu().then((module) => module.ExpeditionMenu), {
  ssr: false,
  loading: () => <DeferredGameLayer label="원정 체크포인트를 확인하는 중" scope="menu" />,
})
const GameGuideDialog = dynamic(() => loadHelpDialogs().then((module) => module.GameGuideDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="현장 교범을 펼치는 중" scope="guide" />,
})
const InstallHelpDialog = dynamic(() => loadHelpDialogs().then((module) => module.InstallHelpDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="설치 안내를 준비하는 중" scope="install" />,
})
const BattleResultDialog = dynamic(() => loadProgressionDialogs().then((module) => module.BattleResultDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="전투 결과를 집계하는 중" scope="result" />,
})
const PromotionDialog = dynamic(() => loadProgressionDialogs().then((module) => module.PromotionDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="베테랑 진급을 준비하는 중" scope="promotion" />,
})
const RelicDialog = dynamic(() => loadProgressionDialogs().then((module) => module.RelicDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="유물 공명을 불러오는 중" scope="relic" />,
})
const SettingsDialog = dynamic(() => loadSettingsDialog().then((module) => module.SettingsDialog), {
  ssr: false,
  loading: () => <DeferredGameLayer label="원정 설정을 불러오는 중" scope="settings" />,
})

function preloadPhaseLayer(phase: Phase, nearingEnding: boolean) {
  if (phase === 'camp') preloadCampaignComponents()
  if (phase === 'event') preloadCampaignEventDialog()
  if (phase === 'battling' || phase === 'interlude' || phase === 'finale') preloadCinematicLayers()
  if (phase === 'promotion' || phase === 'relic' || phase === 'result') preloadProgressionDialogs()
  if (phase === 'won' || phase === 'lost' || nearingEnding) preloadEndingScreen()
}

const GAMEPLAY_PRELOAD_IDLE_TIMEOUT_MS = 2_400
const GAMEPLAY_PRELOAD_FALLBACK_DELAY_MS = 1_200

type IdleScheduler = {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function preloadGameplayStage(phase: Phase, nearingEnding: boolean): () => void {
  preloadPhaseLayer(phase, nearingEnding)

  let cancelled = false
  let idleHandle: number | null = null
  let fallbackTimer: number | null = null

  if (phase === 'camp' || phase === 'event') {
    const idleScheduler = window as unknown as IdleScheduler
    const preloadFutureLayers = async () => {
      const loaders: ReadonlyArray<() => Promise<unknown>> = [
        loadCampaignComponents,
        loadCinematicLayers,
        loadProgressionDialogs,
        loadExpeditionMenu,
      ]
      for (const load of loaders) {
        if (cancelled || document.visibilityState !== 'visible' || !document.hasFocus()) return
        await load().catch(() => undefined)
      }
    }
    const startPreload = () => {
      idleHandle = null
      fallbackTimer = null
      if (!cancelled) void preloadFutureLayers()
    }

    if (idleScheduler.requestIdleCallback) {
      idleHandle = idleScheduler.requestIdleCallback(startPreload, { timeout: GAMEPLAY_PRELOAD_IDLE_TIMEOUT_MS })
    } else {
      fallbackTimer = window.setTimeout(startPreload, GAMEPLAY_PRELOAD_FALLBACK_DELAY_MS)
    }
  }

  return () => {
    cancelled = true
    if (idleHandle !== null) (window as unknown as IdleScheduler).cancelIdleCallback?.(idleHandle)
    if (fallbackTimer !== null) window.clearTimeout(fallbackTimer)
  }
}

const STORAGE_PREFIX = 'sobok.emberhold.'
const STORAGE_KEY = `${STORAGE_PREFIX}save`
const BATTLE_STORAGE_KEY = `${STORAGE_PREFIX}battle`
const GUIDE_KEY = `${STORAGE_PREFIX}guide`
const GUIDE_SEEN = 'seen'
const GUIDE_REPLAY = 'replay'
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`
const BEST_SCORE_KEY = `${STORAGE_PREFIX}best-score`
const META_KEY = `${STORAGE_PREFIX}legacy`
const RESTORE_STAGING_KEY = `${STORAGE_PREFIX}restore-staging`
const PLAY_SESSION_LOCK = `${STORAGE_PREFIX}play-session`
const NAVIGATION_HISTORY_KEY = '__emberholdNavigation'
const SHARED_RIFT_QUERY_KEY = 'rift'
const BACKUP_STORAGE_KEYS = [
  STORAGE_KEY,
  BATTLE_STORAGE_KEY,
  GUIDE_KEY,
  SETTINGS_KEY,
  BEST_SCORE_KEY,
  META_KEY,
] as const
const CURRENT_STORAGE_KEYS = new Set([...BACKUP_STORAGE_KEYS, RESTORE_STAGING_KEY])
const BATTLE_LANES = [0, 1, 2] as const

type NavigationHistoryMarker = 'base' | 'guard'
type PausableRuntimeTimer = {
  timer: number | null
  dueAt: number
  remaining: number
  run: () => void
}
type RuntimeTimerRef = { current: PausableRuntimeTimer | null }

function clearRuntimeTimer(timerRef: RuntimeTimerRef) {
  const task = timerRef.current
  if (task && task.timer !== null) window.clearTimeout(task.timer)
  timerRef.current = null
}

function resumeRuntimeTimer(timerRef: RuntimeTimerRef) {
  const task = timerRef.current
  if (!task || task.timer !== null) return
  const delay = Math.max(0, task.remaining)
  task.dueAt = performance.now() + delay
  task.timer = window.setTimeout(() => {
    task.timer = null
    if (timerRef.current !== task) return
    timerRef.current = null
    task.run()
  }, delay)
}

function startRuntimeTimer(timerRef: RuntimeTimerRef, duration: number, run: () => void) {
  clearRuntimeTimer(timerRef)
  timerRef.current = {
    timer: null,
    dueAt: 0,
    remaining: Math.max(0, duration),
    run,
  }
  if (document.visibilityState === 'visible' && document.hasFocus()) resumeRuntimeTimer(timerRef)
}

function pauseRuntimeTimer(timerRef: RuntimeTimerRef) {
  const task = timerRef.current
  if (!task || task.timer === null) return
  window.clearTimeout(task.timer)
  task.timer = null
  task.remaining = Math.max(0, task.dueAt - performance.now())
}

function readNavigationHistoryMarker(): NavigationHistoryMarker | null {
  const state = window.history.state
  if (!state || typeof state !== 'object') return null
  const marker = (state as Record<string, unknown>)[NAVIGATION_HISTORY_KEY]
  return marker === 'base' || marker === 'guard' ? marker : null
}

function navigationHistoryState(marker: NavigationHistoryMarker): Record<string, unknown> {
  const state = window.history.state
  const current = state && typeof state === 'object' ? (state as Record<string, unknown>) : {}
  return { ...current, [NAVIGATION_HISTORY_KEY]: marker }
}

function prepareNavigationHistoryBase() {
  if (readNavigationHistoryMarker() !== null) return
  window.history.replaceState(navigationHistoryState('base'), '')
}

function pushNavigationHistoryGuard() {
  const marker = readNavigationHistoryMarker()
  if (marker === 'guard') return
  if (marker !== 'base') window.history.replaceState(navigationHistoryState('base'), '')
  window.history.pushState(navigationHistoryState('guard'), '')
}

function linkedRiftCodeForCurrentUrl(): string | null {
  const linkedCode = new URL(window.location.href).searchParams.get(SHARED_RIFT_QUERY_KEY)
  return linkedCode ? runCodeFromText(linkedCode) : null
}

function clearLinkedRiftFromCurrentUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(SHARED_RIFT_QUERY_KEY)) return
  url.searchParams.delete(SHARED_RIFT_QUERY_KEY)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

function sharedRiftUrlFor(code: string): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(SHARED_RIFT_QUERY_KEY, code)
  return url.toString()
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to the user-gesture-compatible legacy copy path.
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.readOnly = true
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.cssText = 'position:fixed;inset:0 auto auto 0;width:1px;height:1px;opacity:0;pointer-events:none'
  document.body.append(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    activeElement?.focus({ preventScroll: true })
  }
}

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  effectsVolume: 82,
  ambienceVolume: 58,
  haptics: true,
  motion: 'system',
  battlePace: 'cinematic',
  largeText: false,
  highContrast: false,
}

const BATTLE_ORDER_SEQUENCE: [BattleOrder, BattleOrder, BattleOrder] = ['hold', 'assault', 'support']

type TacticalPlanCandidate = {
  focusLane: number
  orders: BattleOrder[]
  result: BattleResult
  commandSpent: number
  changeCount: number
  rank: number[]
}

type TacticalRouteStep =
  | { kind: 'order'; lane: number; order: BattleOrder; label: string }
  | { kind: 'focus'; lane: number; order: null; label: string }

type TacticalRoutePlan = {
  adjustment: TacticalAdjustment
  result: BattleResult
  commandSpent: number
  steps: string[]
}

const LEGACY_RECOMMENDATION_ORDER: Record<Difficulty, readonly LegacyId[]> = {
  story: ['banked-ember', 'supply-cache', 'veteran-oath', 'command-seal', 'salvagers-instinct', 'chroniclers-ink'],
  expedition: ['supply-cache', 'command-seal', 'veteran-oath', 'banked-ember', 'salvagers-instinct', 'chroniclers-ink'],
  whiteout: ['command-seal', 'veteran-oath', 'banked-ember', 'supply-cache', 'salvagers-instinct', 'chroniclers-ink'],
}
const FOCUS_LANE_BY_KEY: Readonly<Record<string, number>> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
}
const ORDER_LANE_BY_KEY: Readonly<Record<string, number>> = { KeyQ: 0, KeyW: 1, KeyE: 2 }

const SOUNDSCAPE_PRESETS: Record<SoundscapeMood, SoundscapePreset> = {
  title: {
    lowFrequency: 55,
    highFrequency: 82.41,
    harmonicFrequency: 164.81,
    toneFilterFrequency: 520,
    windFrequency: 820,
    lowLevel: 0.34,
    highLevel: 0.11,
    harmonicLevel: 0.045,
    windLevel: 0.11,
    tremoloRate: 0.065,
    tremoloDepth: 0.002,
    pulseRate: 0.1,
    pulseDepth: 0.018,
    masterLevel: 0.023,
  },
  hearth: {
    lowFrequency: 65.41,
    highFrequency: 98,
    harmonicFrequency: 196,
    toneFilterFrequency: 680,
    windFrequency: 620,
    lowLevel: 0.36,
    highLevel: 0.13,
    harmonicLevel: 0.07,
    windLevel: 0.07,
    tremoloRate: 0.09,
    tremoloDepth: 0.0024,
    pulseRate: 0.13,
    pulseDepth: 0.022,
    masterLevel: 0.027,
  },
  whiteout: {
    lowFrequency: 58.27,
    highFrequency: 87.31,
    harmonicFrequency: 174.61,
    toneFilterFrequency: 420,
    windFrequency: 1050,
    lowLevel: 0.3,
    highLevel: 0.08,
    harmonicLevel: 0.035,
    windLevel: 0.24,
    tremoloRate: 0.055,
    tremoloDepth: 0.003,
    pulseRate: 0.085,
    pulseDepth: 0.014,
    masterLevel: 0.027,
  },
  battle: {
    lowFrequency: 55,
    highFrequency: 82.41,
    harmonicFrequency: 164.81,
    toneFilterFrequency: 740,
    windFrequency: 430,
    lowLevel: 0.42,
    highLevel: 0.15,
    harmonicLevel: 0.1,
    windLevel: 0.16,
    tremoloRate: 0.18,
    tremoloDepth: 0.0035,
    pulseRate: 0.72,
    pulseDepth: 0.035,
    masterLevel: 0.03,
  },
  boss: {
    lowFrequency: 41.2,
    highFrequency: 61.74,
    harmonicFrequency: 123.47,
    toneFilterFrequency: 360,
    windFrequency: 280,
    lowLevel: 0.5,
    highLevel: 0.16,
    harmonicLevel: 0.085,
    windLevel: 0.2,
    tremoloRate: 0.12,
    tremoloDepth: 0.004,
    pulseRate: 0.46,
    pulseDepth: 0.035,
    masterLevel: 0.032,
  },
  dawn: {
    lowFrequency: 65.41,
    highFrequency: 98,
    harmonicFrequency: 261.63,
    toneFilterFrequency: 980,
    windFrequency: 1200,
    lowLevel: 0.28,
    highLevel: 0.13,
    harmonicLevel: 0.11,
    windLevel: 0.045,
    tremoloRate: 0.07,
    tremoloDepth: 0.0018,
    pulseRate: 0.16,
    pulseDepth: 0.026,
    masterLevel: 0.027,
  },
  mourning: {
    lowFrequency: 49,
    highFrequency: 73.42,
    harmonicFrequency: 146.83,
    toneFilterFrequency: 340,
    windFrequency: 760,
    lowLevel: 0.38,
    highLevel: 0.075,
    harmonicLevel: 0.03,
    windLevel: 0.12,
    tremoloRate: 0.045,
    tremoloDepth: 0.0028,
    pulseRate: 0.065,
    pulseDepth: 0.012,
    masterLevel: 0.021,
  },
}

const INITIAL_GAME: GameState = {
  campaignStarted: false,
  day: 1,
  difficulty: 'expedition',
  mode: 'standard',
  oath: 'hearthkeepers',
  masteryContract: null,
  runId: 1,
  runSeed: 1,
  activeLegacy: [],
  heat: 84,
  supplies: 58,
  recoverySupplies: 0,
  morale: 64,
  recruits: 0,
  score: 0,
  renownLedger: createEmptyRenownLedger(),
  perfectNights: 0,
  intentsCountered: 0,
  unitedVictories: 0,
  battles: 0,
  victories: 0,
  bossesDefeated: 0,
  relics: [],
  pendingRelic: false,
  orders: ['hold', 'hold', 'hold'],
  eventResolvedForDay: 0,
  decisions: [],
  legacyAwarded: false,
  legacyReward: 0,
  failureInsights: [],
  slots: [
    { id: 'warden-a', kind: 'warden', tier: 1, specialization: null },
    { id: 'ranger-a', kind: 'ranger', tier: 1, specialization: null },
    { id: 'raider-a', kind: 'raider', tier: 1, specialization: null },
    { id: 'warden-b', kind: 'warden', tier: 1, specialization: null },
    { id: 'ranger-b', kind: 'ranger', tier: 1, specialization: null },
    { id: 'raider-b', kind: 'raider', tier: 1, specialization: null },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  lineup: ['warden-a', 'ranger-a', 'raider-a'],
  status: 'playing',
}

function createInitialGame(
  difficulty: Difficulty = 'expedition',
  oath: OathId = 'hearthkeepers',
  mode: RunMode = 'standard',
  runSeed = 1,
  runId = 1,
  meta: MetaState = INITIAL_META,
  campaignStarted = false,
  masteryContract: MasteryContractId | null = null,
): GameState {
  const inheritedPowerEnabled = inheritedPowerEnabledFor(mode)
  const activeMasteryContract = inheritedPowerEnabled ? masteryContract : null
  const contract = activeMasteryContract ? MASTERY_CONTRACTS[activeMasteryContract] : null
  const activeLegacy = inheritedPowerEnabled ? meta.legacy : []
  const game: GameState = {
    ...INITIAL_GAME,
    campaignStarted,
    difficulty,
    mode,
    oath,
    masteryContract: activeMasteryContract,
    runSeed,
    runId,
    activeLegacy: [...activeLegacy],
    renownLedger: createEmptyRenownLedger(),
    heat: Math.min(
      100,
      DIFFICULTIES[difficulty].startingHeat +
        (activeLegacy.includes('banked-ember') ? 10 : 0) -
        (oath === 'salvagers' && campaignStarted ? 10 : 0) +
        (contract?.startingHeatDelta ?? 0),
    ),
    supplies: Math.max(
      0,
      DIFFICULTIES[difficulty].startingSupplies +
        (activeLegacy.includes('supply-cache') ? 20 : 0) +
        (contract?.startingSuppliesDelta ?? 0),
    ),
    slots: INITIAL_GAME.slots.map((unit) => (unit ? { ...unit } : null)),
    lineup: [...INITIAL_GAME.lineup],
  }
  if (activeLegacy.includes('veteran-oath') && game.slots[0]) game.slots[0] = { ...game.slots[0], tier: 2 }
  return game
}

function createEmptyRenownLedger(): RenownLedger {
  return {
    battle: { total: 0, legacyBonus: 0, contractBonus: 0 },
    event: { total: 0, legacyBonus: 0, contractBonus: 0 },
    marchSeal: { total: 0, legacyBonus: 0, contractBonus: 0 },
  }
}

function cloneRenownLedger(ledger: RenownLedger): RenownLedger {
  return {
    battle: { ...ledger.battle },
    event: { ...ledger.event },
    marchSeal: { ...ledger.marchSeal },
  }
}

function addRenownLedgerEntry(
  ledger: RenownLedger,
  source: keyof RenownLedger,
  total: number,
  legacyBonus: number,
  contractBonus: number,
): RenownLedger {
  const current = ledger[source]
  return {
    ...ledger,
    [source]: {
      total: current.total + total,
      legacyBonus: current.legacyBonus + legacyBonus,
      contractBonus: current.contractBonus + contractBonus,
    },
  }
}

function masteryContractScoreFor(inheritedScore: number, masteryContract: MasteryContractId | null): number {
  return Math.round(inheritedScore * (masteryContract ? MASTERY_CONTRACTS[masteryContract].scoreScale : 1))
}

function expeditionRenownScaleFor(difficulty: Difficulty, oath: OathId, encounterScale = 1): number {
  return DIFFICULTIES[difficulty].scoreScale * OATHS[oath].scoreScale * encounterScale
}

function recoverySuppliesAfterSpend(recoverySupplies: number, spentSupplies: number): number {
  return Math.max(0, recoverySupplies - Math.max(0, spentSupplies))
}

function maximumRecoverySuppliesFor(difficulty: Difficulty, defeatCount: number): number {
  const initialRecovery = DIFFICULTIES[difficulty].defeatSupply
  const taperedDefeats = Math.min(Math.max(0, defeatCount), Math.ceil((initialRecovery - 2) / 2))
  return (
    taperedDefeats * initialRecovery -
    taperedDefeats * (taperedDefeats - 1) +
    Math.max(0, defeatCount - taperedDefeats) * 2
  )
}

let sharedAudioContext: AudioContext | null = null
let sharedAudioOutput: GainNode | null = null
let ambientSession: AmbientSession | null = null
const MAX_ACTIVE_AUDIO_SOURCES = 24
const activeEffectStops = new Set<() => void>()
const ambientCleanupTimers = new Map<number, () => void>()
let activeAudioMix = {
  effects: DEFAULT_SETTINGS.effectsVolume / 100,
  ambience: DEFAULT_SETTINGS.ambienceVolume / 100,
}
let hapticsEnabled = DEFAULT_SETTINGS.haptics

function suspendAudioContextWhenIdle() {
  if (ambientSession || activeEffectStops.size > 0 || !sharedAudioContext || sharedAudioContext.state !== 'running') {
    return
  }
  void sharedAudioContext.suspend().catch(() => undefined)
}

function trackAudioEffect(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
  let disposed = false
  let stop = () => undefined
  const cleanup = () => {
    if (disposed) return
    disposed = true
    source.removeEventListener('ended', cleanup)
    activeEffectStops.delete(stop)
    for (const node of nodes) node.disconnect()
    suspendAudioContextWhenIdle()
  }
  stop = () => {
    try {
      source.stop()
    } catch {
      // The source may already have completed naturally.
    }
    cleanup()
  }
  while (activeEffectStops.size >= MAX_ACTIVE_AUDIO_SOURCES) {
    const oldestStop = activeEffectStops.values().next().value
    if (!oldestStop) break
    oldestStop()
  }
  activeEffectStops.add(stop)
  source.addEventListener('ended', cleanup, { once: true })
}

function stopActiveEffects() {
  for (const stop of [...activeEffectStops]) stop()
}

function disconnectAmbientSession(session: AmbientSession) {
  for (const node of session.nodes) {
    try {
      node.stop()
    } catch {
      // A source can already be stopped when the tab closes.
    }
    node.disconnect()
  }
  session.lowGain.disconnect()
  session.highGain.disconnect()
  session.harmonicGain.disconnect()
  session.windGain.disconnect()
  session.toneFilter.disconnect()
  session.windFilter.disconnect()
  session.tremoloDepth.disconnect()
  session.pulseDepth.disconnect()
  session.gain.disconnect()
}

function flushAmbientCleanups() {
  for (const [timer, cleanup] of [...ambientCleanupTimers]) {
    window.clearTimeout(timer)
    cleanup()
  }
}

function applyRuntimeSettings(settings: GameSettings) {
  activeAudioMix = {
    effects: settings.effectsVolume / 100,
    ambience: settings.ambienceVolume / 100,
  }
  hapticsEnabled = settings.haptics
  if (!ambientSession || !sharedAudioContext) return
  const now = sharedAudioContext.currentTime
  const preset = SOUNDSCAPE_PRESETS[ambientSession.mood]
  ambientSession.targetLevel = preset.masterLevel
  retargetAudioParam(ambientSession.gain.gain, preset.masterLevel * activeAudioMix.ambience, now, 0.08)
  retargetAudioParam(ambientSession.tremoloDepth.gain, preset.tremoloDepth * activeAudioMix.ambience, now, 0.08)
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Context =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  sharedAudioContext ??= new Context()
  return sharedAudioContext
}

function getAudioOutput(context: AudioContext): GainNode {
  if (sharedAudioOutput) return sharedAudioOutput
  const input = context.createGain()
  const compressor = context.createDynamicsCompressor()
  input.gain.value = 0.88
  compressor.threshold.value = -18
  compressor.knee.value = 16
  compressor.ratio.value = 4
  compressor.attack.value = 0.004
  compressor.release.value = 0.24
  input.connect(compressor)
  compressor.connect(context.destination)
  sharedAudioOutput = input
  return input
}

function holdAudioParam(param: AudioParam, now: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(now)
    return
  }
  const current = Number.isFinite(param.value) ? param.value : 0
  param.cancelScheduledValues(now)
  param.setValueAtTime(current, now)
}

function retargetAudioParam(param: AudioParam, target: number, now: number, timeConstant = 0.42) {
  holdAudioParam(param, now)
  param.setTargetAtTime(target, now, timeConstant)
}

function playSound(effect: SoundEffect, enabled: boolean) {
  if (!enabled || activeAudioMix.effects <= 0) return
  const context = getAudioContext()
  if (!context) return
  void context.resume().catch(() => undefined)
  const output = getAudioOutput(context)

  const tone = (frequency: number, delay: number, duration: number, gain: number, type: OscillatorType = 'sine') => {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const start = context.currentTime + delay
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * activeAudioMix.effects), start + 0.015)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(envelope)
    envelope.connect(output)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
    trackAudioEffect(oscillator, [oscillator, envelope])
  }

  const burst = (delay: number, duration: number, gain: number, frequency: number) => {
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length)
    }
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const start = context.currentTime + delay
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency, start)
    filter.Q.value = 0.72
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * activeAudioMix.effects), start + 0.012)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    source.connect(filter)
    filter.connect(envelope)
    envelope.connect(output)
    source.start(start)
    trackAudioEffect(source, [source, filter, envelope])
  }

  if (effect === 'select') tone(420, 0, 0.08, 0.025, 'triangle')
  if (effect === 'deploy') {
    tone(260, 0, 0.1, 0.035, 'square')
    tone(390, 0.06, 0.11, 0.025, 'triangle')
  }
  if (effect === 'merge') {
    tone(330, 0, 0.18, 0.04, 'triangle')
    tone(495, 0.08, 0.2, 0.035, 'triangle')
    tone(660, 0.16, 0.25, 0.03, 'sine')
  }
  if (effect === 'recruit') {
    tone(220, 0, 0.2, 0.035, 'sawtooth')
    tone(440, 0.13, 0.25, 0.03, 'triangle')
  }
  if (effect === 'fire') {
    tone(180, 0, 0.26, 0.035, 'sine')
    tone(270, 0.08, 0.35, 0.025, 'triangle')
  }
  if (effect === 'battle') {
    tone(110, 0, 0.42, 0.055, 'sawtooth')
    tone(82, 0.12, 0.5, 0.04, 'square')
    burst(0.03, 0.32, 0.025, 180)
  }
  if (effect === 'boss') {
    tone(55, 0, 0.7, 0.07, 'sawtooth')
    tone(73.42, 0.12, 0.82, 0.045, 'square')
    tone(110, 0.34, 0.75, 0.032, 'triangle')
    burst(0.02, 0.62, 0.05, 145)
  }
  if (effect === 'impact') {
    burst(0, 0.18, 0.065, 760)
    tone(92, 0, 0.2, 0.055, 'square')
    tone(520, 0.035, 0.16, 0.028, 'sawtooth')
  }
  if (effect === 'crown') {
    burst(0, 0.3, 0.075, 980)
    tone(65.41, 0, 0.5, 0.06, 'sawtooth')
    tone(261.63, 0.08, 0.32, 0.038, 'triangle')
    tone(392, 0.18, 0.38, 0.035, 'triangle')
    tone(783.99, 0.27, 0.46, 0.026, 'sine')
  }
  if (effect === 'finale') {
    tone(130.81, 0, 0.7, 0.045, 'sine')
    tone(261.63, 0.1, 0.62, 0.04, 'triangle')
    tone(329.63, 0.26, 0.62, 0.038, 'triangle')
    tone(392, 0.42, 0.7, 0.036, 'triangle')
    tone(523.25, 0.62, 0.92, 0.032, 'sine')
  }
  if (effect === 'win') {
    tone(330, 0, 0.22, 0.04, 'triangle')
    tone(495, 0.12, 0.28, 0.04, 'triangle')
    tone(660, 0.26, 0.45, 0.035, 'sine')
  }
  if (effect === 'lose') {
    burst(0, 0.28, 0.04, 260)
    tone(220, 0, 0.34, 0.04, 'sawtooth')
    tone(146, 0.16, 0.48, 0.035, 'triangle')
  }
  if (effect === 'relic') {
    tone(528, 0, 0.32, 0.035, 'sine')
    tone(704, 0.12, 0.42, 0.03, 'sine')
    tone(880, 0.24, 0.5, 0.025, 'sine')
  }
  if (effect === 'milestone') {
    tone(392, 0, 0.42, 0.035, 'triangle')
    tone(523.25, 0.09, 0.48, 0.033, 'sine')
    tone(659.25, 0.21, 0.56, 0.03, 'triangle')
    tone(783.99, 0.34, 0.7, 0.025, 'sine')
  }
  if (effect === 'seal') {
    burst(0, 0.14, 0.045, 1240)
    tone(98, 0, 0.34, 0.05, 'square')
    tone(196, 0.06, 0.38, 0.038, 'triangle')
    tone(392, 0.18, 0.48, 0.034, 'triangle')
    tone(587.33, 0.33, 0.58, 0.03, 'sine')
    tone(783.99, 0.49, 0.76, 0.026, 'sine')
  }
}

function setSoundscapeMood(mood: SoundscapeMood) {
  if (!ambientSession || !sharedAudioContext) return
  const session = ambientSession
  const preset = SOUNDSCAPE_PRESETS[mood]
  const now = sharedAudioContext.currentTime
  session.mood = mood
  session.targetLevel = preset.masterLevel
  retargetAudioParam(session.gain.gain, preset.masterLevel * activeAudioMix.ambience, now, 0.58)
  retargetAudioParam(session.toneFilter.frequency, preset.toneFilterFrequency, now)
  retargetAudioParam(session.windFilter.frequency, preset.windFrequency, now)
  retargetAudioParam(session.lowDrone.frequency, preset.lowFrequency, now)
  retargetAudioParam(session.highDrone.frequency, preset.highFrequency, now)
  retargetAudioParam(session.harmonicDrone.frequency, preset.harmonicFrequency, now)
  retargetAudioParam(session.lowGain.gain, preset.lowLevel, now)
  retargetAudioParam(session.highGain.gain, preset.highLevel, now)
  retargetAudioParam(session.harmonicGain.gain, preset.harmonicLevel, now)
  retargetAudioParam(session.windGain.gain, preset.windLevel, now)
  retargetAudioParam(session.tremolo.frequency, preset.tremoloRate, now)
  retargetAudioParam(session.tremoloDepth.gain, preset.tremoloDepth * activeAudioMix.ambience, now)
  retargetAudioParam(session.pulse.frequency, preset.pulseRate, now)
  retargetAudioParam(session.pulseDepth.gain, preset.pulseDepth, now)
}

function startAmbience(enabled: boolean, mood: SoundscapeMood) {
  if (!enabled) return
  if (ambientSession) {
    setSoundscapeMood(mood)
    return
  }
  const context = getAudioContext()
  if (!context) return
  void context.resume().catch(() => undefined)
  const preset = SOUNDSCAPE_PRESETS[mood]

  const master = context.createGain()
  master.gain.setValueAtTime(0, context.currentTime)
  master.gain.linearRampToValueAtTime(preset.masterLevel * activeAudioMix.ambience, context.currentTime + 1.5)
  master.connect(getAudioOutput(context))

  const toneFilter = context.createBiquadFilter()
  toneFilter.type = 'lowpass'
  toneFilter.frequency.value = preset.toneFilterFrequency
  toneFilter.Q.value = 0.6
  toneFilter.connect(master)

  const lowDrone = context.createOscillator()
  lowDrone.type = 'sine'
  lowDrone.frequency.value = preset.lowFrequency
  const lowGain = context.createGain()
  lowGain.gain.value = preset.lowLevel
  lowDrone.connect(lowGain)
  lowGain.connect(toneFilter)

  const highDrone = context.createOscillator()
  highDrone.type = 'triangle'
  highDrone.frequency.value = preset.highFrequency
  const highGain = context.createGain()
  highGain.gain.value = preset.highLevel
  highDrone.connect(highGain)
  highGain.connect(toneFilter)

  const harmonicDrone = context.createOscillator()
  harmonicDrone.type = 'sine'
  harmonicDrone.frequency.value = preset.harmonicFrequency
  const harmonicGain = context.createGain()
  harmonicGain.gain.value = preset.harmonicLevel
  harmonicDrone.connect(harmonicGain)
  harmonicGain.connect(toneFilter)

  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate)
  const noise = buffer.getChannelData(0)
  for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 2 - 1) * 0.26
  const wind = context.createBufferSource()
  wind.buffer = buffer
  wind.loop = true
  const windFilter = context.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = preset.windFrequency
  windFilter.Q.value = 0.35
  const windGain = context.createGain()
  windGain.gain.value = preset.windLevel
  wind.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(master)

  const tremolo = context.createOscillator()
  tremolo.frequency.value = preset.tremoloRate
  const tremoloDepth = context.createGain()
  tremoloDepth.gain.setValueAtTime(0, context.currentTime)
  tremoloDepth.gain.linearRampToValueAtTime(preset.tremoloDepth * activeAudioMix.ambience, context.currentTime + 1.5)
  tremolo.connect(tremoloDepth)
  tremoloDepth.connect(master.gain)

  const pulse = context.createOscillator()
  pulse.type = 'sine'
  pulse.frequency.value = preset.pulseRate
  const pulseDepth = context.createGain()
  pulseDepth.gain.value = preset.pulseDepth
  pulse.connect(pulseDepth)
  pulseDepth.connect(harmonicGain.gain)

  const nodes: AudioScheduledSourceNode[] = [lowDrone, highDrone, harmonicDrone, wind, tremolo, pulse]
  ambientSession = {
    mood,
    targetLevel: preset.masterLevel,
    gain: master,
    toneFilter,
    windFilter,
    lowDrone,
    highDrone,
    harmonicDrone,
    lowGain,
    highGain,
    harmonicGain,
    windGain,
    tremolo,
    tremoloDepth,
    pulse,
    pulseDepth,
    nodes,
  }
  for (const node of nodes) node.start()
  flushAmbientCleanups()
}

function stopAmbience(immediate = false) {
  if (immediate) flushAmbientCleanups()
  if (!ambientSession || !sharedAudioContext) {
    suspendAudioContextWhenIdle()
    return
  }
  const session = ambientSession
  ambientSession = null
  if (immediate) {
    disconnectAmbientSession(session)
    suspendAudioContextWhenIdle()
    return
  }
  const now = sharedAudioContext.currentTime
  holdAudioParam(session.gain.gain, now)
  session.gain.gain.setValueAtTime(Math.max(session.gain.gain.value, 0.0001), now)
  session.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
  holdAudioParam(session.tremoloDepth.gain, now)
  session.tremoloDepth.gain.setValueAtTime(Math.max(session.tremoloDepth.gain.value, 0), now)
  session.tremoloDepth.gain.linearRampToValueAtTime(0, now + 0.62)
  holdAudioParam(session.pulseDepth.gain, now)
  session.pulseDepth.gain.setValueAtTime(Math.max(session.pulseDepth.gain.value, 0), now)
  session.pulseDepth.gain.linearRampToValueAtTime(0, now + 0.62)
  let cleanupTimer = 0
  const cleanup = () => {
    ambientCleanupTimers.delete(cleanupTimer)
    disconnectAmbientSession(session)
    suspendAudioContextWhenIdle()
  }
  cleanupTimer = window.setTimeout(cleanup, 760)
  ambientCleanupTimers.set(cleanupTimer, cleanup)
}

function stopAudioPlayback(immediate = false) {
  stopActiveEffects()
  stopAmbience(immediate)
}

function vibrate(pattern: number | number[]) {
  if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}

function cancelHaptics() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(0)
}

function createRandomSeed(): number {
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    const value = new Uint32Array(1)
    globalThis.crypto.getRandomValues(value)
    return (value[0] % 2_147_483_646) + 1
  }
  return (Date.now() % 2_147_483_646) + 1
}

function createUniqueRunId(meta: MetaState): number {
  const existingRunIds = new Set(meta.history.map((record) => record.runId))
  let candidate = createRandomSeed()
  while (existingRunIds.has(candidate)) candidate = candidate === 2_147_483_647 ? 1 : candidate + 1
  return candidate
}

function dailySeedForNow(): number {
  const now = new Date()
  const stamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  let hash = 2_166_136_261
  for (const character of stamp) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16_777_619)
  }
  return ((hash >>> 0) % 2_147_483_646) + 1
}

function trialsFor(seed: number): TrialId[] {
  return TRIAL_IDS.map((id, index) => ({ id, order: seededValue(seed, 700 + index) }))
    .sort((left, right) => left.order - right.order)
    .slice(0, 3)
    .map(({ id }) => id)
}

function trialProgressFor(trialId: TrialId, game: GameState, won = game.status === 'won') {
  const trial = TRIALS[trialId]
  const current =
    trialId === 'intent-reader'
      ? game.intentsCountered
      : trialId === 'unbroken-four'
        ? game.perfectNights
        : trialId === 'united-front'
          ? game.unitedVictories
          : trialId === 'relic-bearer'
            ? game.relics.length
            : trialId === 'renown-keeper'
              ? game.score
              : game.heat
  const completed = trialId === 'bright-hearth' ? won && current >= trial.target : current >= trial.target
  return {
    current: Math.min(current, trial.target),
    target: trial.target,
    completed,
    pending: trialId === 'bright-hearth' && game.status === 'playing',
  }
}

function completedTrialsFor(game: GameState, won: boolean): TrialId[] {
  return trialsFor(game.runSeed).filter((trialId) => trialProgressFor(trialId, game, won).completed)
}

function protocolMasteryProgressFor(game: GameState, won: boolean): ProtocolMasteryProgress {
  const mastery = PROTOCOL_MASTERIES[game.difficulty]
  const current =
    mastery.metric === 'heat' ? game.heat : mastery.metric === 'intents' ? game.intentsCountered : game.perfectNights
  const clearedNights = won ? MAX_NIGHTS : Math.max(0, Math.min(MAX_NIGHTS, game.day - 1))
  const metricReady = current >= mastery.target
  const campaignProgress = clearedNights / MAX_NIGHTS
  const metricProgress = Math.min(1, current / mastery.target)
  const currentLabel =
    mastery.metric === 'heat' ? `${current}% / ${mastery.target}% 유지` : `${current} / ${mastery.target}회`

  return {
    ...mastery,
    current,
    metricReady,
    completed: won && game.day === MAX_NIGHTS && metricReady,
    clearedNights,
    progress: Math.round((campaignProgress * 0.65 + metricProgress * 0.35) * 100),
    currentLabel,
  }
}

function endingFor(game: GameState, won: boolean): EndingId {
  if (!won) {
    if (game.day <= 4) return 'broken-watch'
    if (game.day <= 8) return 'frozen-choir'
    return 'last-march'
  }
  const mercyCount = game.decisions.filter((decision) => MERCY_DECISIONS.has(decision)).length
  if (mercyCount >= 8) return 'hearth-dawn'
  if (game.score >= EMBER_CROWN_SCORE) return 'ember-crown'
  return 'crownless-dawn'
}

function createEnemies(day: number, runSeed: number): Enemy[] {
  const dayIndex = Math.min(MAX_NIGHTS, Math.max(1, day)) - 1
  const patternOffset = day === 1 ? 0 : seededValue(runSeed, day * 13 + 3) % 3
  const intentOffset = day === 1 ? 0 : seededValue(runSeed, day * 17 + 5) % 3
  const eliteEncounter = ELITE_ENCOUNTERS[day]
  return ENEMY_PATTERNS[dayIndex].map((_, lane) => {
    const kind = ENEMY_PATTERNS[dayIndex][(lane + patternOffset) % 3]
    const tier = ENEMY_TIERS[dayIndex][lane]
    const boss = NIGHT_STORIES[dayIndex].boss
    const encounterForLane = eliteEncounter && eliteEncounter.lane === lane ? eliteEncounter : null
    const elite = (boss && lane === 1) || encounterForLane !== null
    const nameIndex = day === MAX_NIGHTS ? 3 : boss || elite ? 2 : Math.min(tier - 1, 1)
    return {
      id: `night-${day}-${runSeed}-lane-${lane}`,
      kind,
      tier,
      name: encounterForLane?.name ?? ENEMY_NAMES[kind][nameIndex],
      intent: ENEMY_INTENTS[dayIndex][(lane + intentOffset) % 3],
      elite,
      doctrine: encounterForLane?.doctrine ?? null,
    }
  })
}

function relationFor(unit: UnitKind, enemy: UnitKind): LaneResult['relation'] {
  if (KIND_META[unit].strongAgainst === enemy) return 'advantage'
  if (KIND_META[enemy].strongAgainst === unit) return 'disadvantage'
  return 'neutral'
}

function finalCrownSealFor(lane: number): FinalCrownSeal | null {
  return FINAL_CROWN_SEALS.find((seal) => seal.lane === lane) ?? null
}

function finalCrownSealBroken(
  lane: number,
  focusLane: number,
  countered: boolean,
  relation: LaneResult['relation'],
): boolean {
  if (lane === 0) return countered
  if (lane === 1) return focusLane === 1
  if (lane === 2) return relation === 'advantage'
  return false
}

function resonanceIsActive(resonanceId: ResonanceId, relics: readonly RelicId[]): boolean {
  return RESONANCES[resonanceId].requirements.every((relicId) => relics.includes(relicId))
}

function activeResonancesFor(relics: readonly RelicId[]): ResonanceId[] {
  return RESONANCE_IDS.filter((resonanceId) => resonanceIsActive(resonanceId, relics))
}

function resonanceForRelic(relicId: RelicId): ResonanceId | null {
  return RESONANCE_IDS.find((resonanceId) => RESONANCES[resonanceId].requirements.includes(relicId)) ?? null
}

function resonancePreviewFor(
  relicId: RelicId,
  ownedRelics: readonly RelicId[],
): { id: ResonanceId; completes: boolean; partner: RelicId } | null {
  const resonanceId = resonanceForRelic(relicId)
  if (!resonanceId) return null
  const partner = RESONANCES[resonanceId].requirements.find((requirement) => requirement !== relicId)
  if (!partner) return null
  return { id: resonanceId, completes: ownedRelics.includes(partner), partner }
}

function unitPower(unit: Unit): number {
  return PLAYER_POWER[unit.tier] ?? PLAYER_POWER[MAX_TIER]
}

function survivorName(unit: Unit): string {
  let hash = 2166136261
  for (let index = 0; index < unit.id.length; index += 1) {
    hash ^= unit.id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const names = SURVIVOR_NAMES[unit.kind]
  const unsignedHash = hash >>> 0
  const name = names[unsignedHash % names.length]
  const epithet = SURVIVOR_EPITHETS[Math.floor(unsignedHash / names.length) % SURVIVOR_EPITHETS.length]
  return `${name} ${epithet}`
}

function orderForIntent(intent: EnemyIntent): BattleOrder {
  return (Object.keys(ORDER_META) as BattleOrder[]).find((order) => ORDER_META[order].counters === intent) ?? 'hold'
}

function counterKindFor(enemyKind: UnitKind): UnitKind {
  return (Object.keys(KIND_META) as UnitKind[]).find((kind) => KIND_META[kind].strongAgainst === enemyKind) ?? 'warden'
}

function failureInsightFor(lane: LaneResult, day: number, focusLane: number): FailureInsight {
  const gap = Math.max(0, lane.enemyPower - lane.playerPower)
  const crownSeal = day === MAX_NIGHTS ? finalCrownSealFor(lane.lane) : null
  if (crownSeal && !finalCrownSealBroken(lane.lane, focusLane, lane.countered, lane.relation)) {
    return {
      lane: lane.lane,
      cause: 'crown',
      glyph: crownSeal.glyph,
      label: `${crownSeal.name} 활성`,
      detail: crownSeal.pressure,
      action: `${crownSeal.requirement}.`,
      gap,
      priority: 0,
    }
  }
  if (lane.enemy.doctrine && !lane.doctrineBroken) {
    const doctrine = ENEMY_DOCTRINES[lane.enemy.doctrine]
    return {
      lane: lane.lane,
      cause: 'doctrine',
      glyph: doctrine.glyph,
      label: '정예 교리 미파훼',
      detail: `${doctrine.name}이 이 전선의 위협을 ${Math.round((lane.doctrineMultiplier - 1) * 100)}% 높였습니다.`,
      action: doctrine.counterplay,
      gap,
      priority: 1,
    }
  }
  if (!lane.countered) {
    const counterOrder = orderForIntent(lane.intent)
    return {
      lane: lane.lane,
      cause: 'intent',
      glyph: INTENT_META[lane.intent].glyph,
      label: '적 의도 미파훼',
      detail: `${INTENT_META[lane.intent].name} 의도를 끊지 못해 적의 공격이 그대로 들어왔습니다.`,
      action: `${ORDER_META[counterOrder].name} 명령으로 ${INTENT_META[lane.intent].name} 의도를 파훼하세요.`,
      gap,
      priority: 2,
    }
  }
  if (lane.relation === 'disadvantage') {
    const counterKind = counterKindFor(lane.enemy.kind)
    return {
      lane: lane.lane,
      cause: 'affinity',
      glyph: KIND_META[counterKind].glyph,
      label: '병과 상성 열세',
      detail: `${KIND_META[lane.unit.kind].name}는 ${KIND_META[lane.enemy.kind].name}의 공격에 불리합니다.`,
      action: `${KIND_META[counterKind].name} 생존자를 이 전선에 배치해 상성 우위를 만드세요.`,
      gap,
      priority: 3,
    }
  }
  if (lane.unit.tier < lane.enemy.tier) {
    return {
      lane: lane.lane,
      cause: 'tier',
      glyph: 'Ⅱ',
      label: '생존자 등급 열세',
      detail: `${TIER_LABELS[lane.unit.tier]} 등급 생존자가 ${TIER_LABELS[lane.enemy.tier]} 등급 적을 상대했습니다.`,
      action: '같은 병과와 등급을 합치거나, 더 높은 등급의 생존자를 이 전선에 배치하세요.',
      gap,
      priority: 4,
    }
  }
  return {
    lane: lane.lane,
    cause: 'power',
    glyph: '✦',
    label: '순수 전투력 부족',
    detail: `명령과 상성은 유효했지만 최종 전투력이 ${gap} 부족했습니다.`,
    action: '화로 집중을 옮기거나, 인접 지원·합성·베테랑 진급으로 전투력을 보강하세요.',
    gap,
    priority: 5,
  }
}

function needsPromotion(unit: Unit | null): unit is Unit {
  return unit !== null && unit.tier >= 3 && unit.specialization === null
}

function pendingPromotionFor(game: GameState): Unit | null {
  return game.slots.find((unit) => needsPromotion(unit)) ?? null
}

function specializationBonusFor(
  unit: Unit,
  lane: number,
  context: BattleContext,
  relation: LaneResult['relation'],
  order: BattleOrder,
  countered: boolean,
): number {
  const specialization = unit.specialization
  if (!specialization) return 0
  const masteryBonus = unit.tier === MAX_TIER ? 0.05 : 0
  if (specialization === 'ember-bulwark' && lane === context.focusLane) return 0.2 + masteryBonus
  if (specialization === 'oath-anchor' && order === 'hold') return 0.18 + masteryBonus
  if (specialization === 'storm-eye' && countered) return 0.18 + masteryBonus
  if (specialization === 'ghost-string' && relation === 'advantage') return 0.2 + masteryBonus
  if (specialization === 'frost-breaker' && order === 'assault') return 0.2 + masteryBonus
  if (specialization === 'last-brand' && context.heat <= 50) return 0.22 + masteryBonus
  return 0
}

function promotionPathFitCopy(
  specializationId: SpecializationId,
  lane: number,
  focusLane: number,
  order: BattleOrder | null,
  laneResult: LaneResult | null,
  heat: number,
  active: boolean,
): { status: string; detail: string } {
  if (lane < 0 || order === null) {
    return {
      status: '대기소 · 배치 후 판정',
      detail: `출전 전선을 정하면 ${SPECIALIZATIONS[specializationId].subtitle} 조건과 실제 전투력을 계산합니다.`,
    }
  }

  const status = active ? `현재 ${lane + 1}전선 · 즉시 발동` : `현재 ${lane + 1}전선 · 조건 대기`
  if (specializationId === 'ember-bulwark') {
    return {
      status,
      detail: active
        ? '화로 집중과 같은 전선이라 이번 교전부터 보너스가 전부 적용됩니다.'
        : `화로 집중을 ${lane + 1}전선으로 옮기면 발동합니다. 현재 집중은 ${focusLane + 1}전선입니다.`,
    }
  }
  if (specializationId === 'oath-anchor') {
    return {
      status,
      detail: active
        ? '현재 방벽 명령과 맞물려 이번 교전부터 발동합니다.'
        : '이 전선의 명령을 방벽으로 바꾸면 발동합니다.',
    }
  }
  if (specializationId === 'storm-eye') {
    return {
      status,
      detail: active
        ? '현재 명령이 적 의도를 파훼해 이번 교전부터 발동합니다.'
        : '적 의도를 파훼하는 명령으로 바꾸면 발동합니다.',
    }
  }
  if (specializationId === 'ghost-string') {
    return {
      status,
      detail: active
        ? '현재 적에게 병과 우세라 이번 교전부터 발동합니다.'
        : laneResult?.relation === 'disadvantage'
          ? '현재는 병과 열세입니다. 도끼 적이 있는 우세 전선에 배치하면 발동합니다.'
          : '도끼 적을 상대하는 병과 우세 전선에 배치하면 발동합니다.',
    }
  }
  if (specializationId === 'frost-breaker') {
    return {
      status,
      detail: active
        ? '현재 돌격 명령과 맞물려 이번 교전부터 발동합니다.'
        : '이 전선의 명령을 돌격으로 바꾸면 발동합니다.',
    }
  }
  return {
    status,
    detail: active
      ? `현재 화로 온기 ${heat}%로 위기 돌파 조건이 발동합니다.`
      : `화로 온기를 50% 이하로 관리하면 발동합니다. 현재 온기는 ${heat}%입니다.`,
  }
}

function resonanceCombatBonusFor(
  lane: number,
  context: BattleContext,
  countered: boolean,
): { ids: ResonanceId[]; bonus: number } {
  const activeResonances = activeResonancesFor(context.relics)
  const ids: ResonanceId[] = []
  let multiplier = 1

  if (activeResonances.includes('ember-pulse') && context.heat <= 50) {
    ids.push('ember-pulse')
    multiplier *= 1.1
  }
  if (activeResonances.includes('whiteout-sight') && lane === context.focusLane && countered) {
    ids.push('whiteout-sight')
    multiplier *= 1.12
  }
  if (
    activeResonances.includes('threefold-cadence') &&
    new Set(context.formationKinds).size === 3 &&
    context.formationTiers.length === 3 &&
    context.formationTiers.every((tier) => tier >= 2)
  ) {
    ids.push('threefold-cadence')
    multiplier *= 1.1
  }

  return { ids, bonus: multiplier - 1 }
}

function bossPressureMultiplier(
  enemy: Enemy,
  lane: number,
  context: BattleContext,
  countered: boolean,
  unit: Unit | null,
): number {
  if (context.day === 4) return countered ? 0.96 : 1.15
  if (context.day === 8 && lane === 1) return context.focusLane === 1 ? 0.96 : 1.28
  if (context.day === MAX_NIGHTS) {
    const seal = finalCrownSealFor(lane)
    const relation = unit ? relationFor(unit.kind, enemy.kind) : 'neutral'
    if (seal) {
      return finalCrownSealBroken(lane, context.focusLane, countered, relation)
        ? seal.brokenMultiplier
        : seal.activeMultiplier
    }
  }
  return 1
}

function enemyDoctrineEffectFor(
  enemy: Enemy,
  lane: number,
  context: BattleContext,
  countered: boolean,
  unit: Unit | null,
): { multiplier: number; broken: boolean } {
  if (!enemy.doctrine) return { multiplier: 1, broken: false }

  if (enemy.doctrine === 'frost-ram') {
    return { multiplier: countered ? 0.94 : 1.18, broken: countered }
  }
  if (enemy.doctrine === 'pack-flank') {
    const supportReachesLane = context.orders.some(
      (order, candidateLane) => order === 'support' && Math.abs(candidateLane - lane) === 1,
    )
    return { multiplier: supportReachesLane ? 0.95 : 1.17, broken: supportReachesLane }
  }
  if (enemy.doctrine === 'choir-chain') {
    const adjacentOpenSignals = context.enemyIntents.filter(
      (intent, candidateLane) =>
        Math.abs(candidateLane - lane) === 1 && ORDER_META[context.orders[candidateLane]].counters !== intent,
    ).length
    return {
      multiplier: adjacentOpenSignals === 0 ? 0.95 : 1 + adjacentOpenSignals * 0.08,
      broken: adjacentOpenSignals === 0,
    }
  }
  if (enemy.doctrine === 'hollow-aegis') {
    const shattered = context.orders[lane] === 'assault'
    return { multiplier: shattered ? 0.95 : 1.16, broken: shattered }
  }
  if (enemy.doctrine === 'mirror-vow') {
    const uniqueOrders = new Set(context.orders).size
    return {
      multiplier: uniqueOrders === 3 ? 0.95 : 1 + (3 - uniqueOrders) * 0.08,
      broken: uniqueOrders === 3,
    }
  }
  if (enemy.doctrine === 'crown-hunt') {
    const fireHidden = context.focusLane !== lane
    return { multiplier: fireHidden ? 0.96 : 1.2, broken: fireHidden }
  }
  if (enemy.doctrine === 'whiteout-execution') {
    const veteranStands = Boolean(unit && unit.tier >= 3)
    return { multiplier: veteranStands ? 0.96 : 1.18, broken: veteranStands }
  }

  const threefoldFormation = new Set(context.formationKinds).size === 3
  return { multiplier: threefoldFormation ? 0.95 : 1.18, broken: threefoldFormation }
}

function enemyPowerFor(
  enemy: Enemy,
  lane: number,
  context: BattleContext,
  countered: boolean,
  unit: Unit | null = null,
): number {
  const condition = nightConditionFor(context.runSeed, context.day)
  const difficulty = DIFFICULTIES[context.difficulty]
  const signalBurden = context.oath === 'signal-corps' && !countered ? 0.07 : 0
  const intentPressure = countered
    ? difficulty.counteredIntentScale
    : (NIGHT_STORIES[context.day - 1].boss ? 1.17 : 1.11) + signalBurden + difficulty.exposedIntentBonus
  const elitePressure = enemy.doctrine ? 1.04 : enemy.elite ? 1.09 : 1
  const doctrineEffect = enemyDoctrineEffectFor(enemy, lane, context, countered, unit)
  return Math.round(
    (ENEMY_POWER[enemy.tier] ?? ENEMY_POWER[MAX_TIER]) *
      NIGHT_STORIES[context.day - 1].enemyScale *
      DIFFICULTIES[context.difficulty].enemyScale *
      (1 + condition.enemyScale) *
      intentPressure *
      elitePressure *
      doctrineEffect.multiplier *
      bossPressureMultiplier(enemy, lane, context, countered, unit),
  )
}

function resolveLane(unit: Unit, enemy: Enemy, lane: number, context: BattleContext): LaneResult {
  const relation = relationFor(unit.kind, enemy.kind)
  const order = context.orders[lane]
  const countered = ORDER_META[order].counters === enemy.intent
  const condition = nightConditionFor(context.runSeed, context.day)
  const supportCount = context.orders.filter(
    (candidate, candidateLane) => candidate === 'support' && Math.abs(candidateLane - lane) === 1,
  ).length
  const supportBonus = supportCount * 0.18
  let multiplier = relation === 'advantage' ? 1.55 : relation === 'disadvantage' ? 0.72 : 1
  multiplier *= 0.91 + context.morale * 0.0013
  if (order === 'hold') multiplier *= 1.16
  if (order === 'assault') multiplier *= relation === 'advantage' ? 1.28 : 1.22
  if (order === 'support') multiplier *= 0.9
  if (supportBonus > 0) multiplier *= 1 + supportBonus
  if (countered) multiplier *= 1.13 + condition.counterBonus
  if (relation === 'neutral') multiplier *= 1 + condition.neutralBonus
  if (lane === context.focusLane) {
    multiplier *=
      (context.relics.includes('watchtower-lens') ? 1.42 : 1.28) +
      condition.focusBonus +
      DIFFICULTIES[context.difficulty].focusBonus
  }
  if (context.heat <= 45 && context.relics.includes('winter-blood')) multiplier *= 1.2
  if (new Set(context.formationKinds).size === 3 && context.relics.includes('threefold-banner')) multiplier *= 1.14
  if (relation === 'neutral' && context.relics.includes('rime-steel')) multiplier *= 1.22
  if (unit.tier >= 2 && context.relics.includes('marching-drum')) multiplier *= 1.11
  const specializationBonus = specializationBonusFor(unit, lane, context, relation, order, countered)
  if (specializationBonus > 0) multiplier *= 1 + specializationBonus
  const resonance = resonanceCombatBonusFor(lane, context, countered)
  if (resonance.bonus > 0) multiplier *= 1 + resonance.bonus
  const decisionEchoBonus = decisionEchoBonusFor(
    context.decisionEcho,
    lane,
    context,
    relation,
    order,
    countered,
    supportCount,
  )
  if (decisionEchoBonus > 0) multiplier *= 1 + decisionEchoBonus
  const finalMarchImprint = finalMarchImprintBonusFor(
    context.finalMarchImprints,
    lane,
    context,
    relation,
    order,
    countered,
    supportCount,
  )
  if (finalMarchImprint.bonus > 0) multiplier *= 1 + finalMarchImprint.bonus
  const finalVowBonus = finalVowBonusFor(context.finalVow, lane, context)
  if (finalVowBonus > 0) multiplier *= 1 + finalVowBonus
  const playerPower = Math.round(unitPower(unit) * multiplier)
  const doctrineEffect = enemyDoctrineEffectFor(enemy, lane, context, countered, unit)
  const enemyPower = enemyPowerFor(enemy, lane, context, countered, unit)

  return {
    lane,
    unit,
    enemy,
    playerPower,
    enemyPower,
    relation,
    order,
    intent: enemy.intent,
    countered,
    supportBonus,
    specializationActive: specializationBonus > 0,
    specializationBonus,
    resonanceIds: resonance.ids,
    resonanceBonus: resonance.bonus,
    decisionEchoActive: decisionEchoBonus > 0,
    decisionEchoBonus,
    finalMarchImprintIds: finalMarchImprint.ids,
    finalMarchImprintBonus: finalMarchImprint.bonus,
    finalVowActive: finalVowBonus > 0,
    finalVowBonus,
    doctrineBroken: doctrineEffect.broken,
    doctrineMultiplier: doctrineEffect.multiplier,
    won: playerPower >= enemyPower,
  }
}

function createBattleResult(game: GameState, focusLane: number): BattleResult | null {
  const enemies = createEnemies(game.day, game.runSeed)
  const units = game.lineup.map((unitId) => findUnit(game, unitId))
  if (units.some((unit) => unit === null)) return null
  const decisionEcho = activeDecisionEchoFor(game.decisions, game.day, game.runSeed)
  const finalVow = game.day === MAX_NIGHTS ? finalVowFor(game.decisions) : null

  const context: BattleContext = {
    relics: game.relics,
    heat: game.heat,
    morale: game.morale,
    focusLane,
    day: game.day,
    difficulty: game.difficulty,
    oath: game.oath,
    runSeed: game.runSeed,
    orders: game.orders,
    legacy: game.activeLegacy,
    formationKinds: units.flatMap((unit) => (unit ? [unit.kind] : [])),
    formationTiers: units.flatMap((unit) => (unit ? [unit.tier] : [])),
    enemyIntents: enemies.map((enemy) => enemy.intent),
    decisionEcho,
    finalMarchImprints: finalMarchImprintsFor(game.decisions, game.day),
    finalVow,
  }
  const lanes = units.map((unit, lane) => resolveLane(unit as Unit, enemies[lane], lane, context))
  const wins = lanes.filter((lane) => lane.won).length
  const counterCount = lanes.filter((lane) => lane.countered).length
  const doctrineBreakCount = lanes.filter((lane) => lane.enemy.doctrine && lane.doctrineBroken).length
  const crownBreakCount =
    game.day === MAX_NIGHTS
      ? lanes.filter((lane) => finalCrownSealBroken(lane.lane, focusLane, lane.countered, lane.relation)).length
      : 0
  const victory =
    wins >= REQUIRED_LANE_WINS && (game.day !== MAX_NIGHTS || crownBreakCount >= FINAL_CROWN_REQUIRED_SEALS)
  const crownSealFailure =
    game.day === MAX_NIGHTS && wins >= REQUIRED_LANE_WINS && crownBreakCount < FINAL_CROWN_REQUIRED_SEALS
  const holdCount = game.orders.filter((order) => order === 'hold').length
  const perfectBonus = wins === 3 ? 650 : 0
  const story = NIGHT_STORIES[game.day - 1]
  const condition = nightConditionFor(game.runSeed, game.day)
  const difficulty = DIFFICULTIES[game.difficulty]
  const bossBonus = story.boss ? 900 : 0
  const rawProtocolSupplyBonus = victory
    ? counterCount * difficulty.counterSupplyBonus + (wins === 3 ? difficulty.perfectSupplyBonus : 0)
    : 0
  const protocolSupplyBonus = rawProtocolSupplyBonus
  const protocolScoreBonus = victory && wins === 3 ? difficulty.perfectScoreBonus : 0
  const crownMasteryBaseBonus =
    victory && game.day === MAX_NIGHTS && crownBreakCount === FINAL_CROWN_SEALS.length ? FINAL_CROWN_MASTERY_SCORE : 0
  const activeResonances = activeResonancesFor(game.relics)
  const supplyLegacy = game.activeLegacy.includes('salvagers-instinct') ? 8 : 0
  const supplyRelic = game.relics.includes('salvagers-pack') ? 18 : 0
  const supplyResonance = activeResonances.includes('long-road-ledger') ? 10 : 0
  const oathSupply = OATHS[game.oath].victorySupplyDelta
  const victorySupplyBase =
    22 + game.day * 3 + (story.boss ? 18 : 0) + supplyRelic + supplyResonance + oathSupply + condition.supplyDelta
  const scaledVictorySupply = (legacyBonus: number) =>
    Math.max(0, Math.round((victorySupplyBase + legacyBonus) * difficulty.supplyScale) + protocolSupplyBonus)
  const victorySupplyReward = scaledVictorySupply(supplyLegacy)
  const legacySupplyBonus = victory ? victorySupplyReward - scaledVictorySupply(0) : 0
  const oathHeatShield = game.oath === 'hearthkeepers' ? 2 : 0
  const resonanceHeatShield = activeResonances.includes('ember-pulse') && game.heat <= 50 ? 2 : 0
  const decisionHeatShield = decisionEcho?.heatShield ?? 0
  const victoryHeat =
    -(5 + story.act * 2) +
    Math.min(3, holdCount) +
    DIFFICULTIES[game.difficulty].heatShield +
    oathHeatShield +
    resonanceHeatShield +
    decisionHeatShield +
    condition.heatDelta
  const defeatHeat =
    (crownSealFailure ? -12 : -(15 + story.act * 4) + counterCount * 2) +
    DIFFICULTIES[game.difficulty].heatShield +
    oathHeatShield +
    decisionHeatShield +
    condition.heatDelta
  const rawScore = victory
    ? 900 +
      game.day * 210 +
      wins * 320 +
      game.heat * 4 +
      perfectBonus +
      protocolScoreBonus +
      counterCount * 180 +
      doctrineBreakCount * 260 +
      crownBreakCount * 320 +
      crownMasteryBaseBonus +
      bossBonus
    : 0
  const scoreScaleWithoutLegacy = expeditionRenownScaleFor(game.difficulty, game.oath, condition.scoreScale)
  const scoreScaleWithLegacy = scoreScaleWithoutLegacy * (game.activeLegacy.includes('chroniclers-ink') ? 1.08 : 1)
  const inheritedScoreReward = Math.round(rawScore * scoreScaleWithLegacy)
  const scoreReward = masteryContractScoreFor(inheritedScoreReward, game.masteryContract)
  const legacyScoreBonus = victory ? inheritedScoreReward - Math.round(rawScore * scoreScaleWithoutLegacy) : 0
  const contractScoreBonus = victory ? scoreReward - inheritedScoreReward : 0
  const scoreScale =
    scoreScaleWithLegacy * (game.masteryContract ? MASTERY_CONTRACTS[game.masteryContract].scoreScale : 1)
  const crownMasteryBonus =
    crownMasteryBaseBonus > 0 ? scoreReward - Math.round((rawScore - crownMasteryBaseBonus) * scoreScale) : 0
  const heatDelta = victory ? Math.min(0, victoryHeat) : Math.min(-6, defeatHeat)
  const heatDeltaWithoutDecision = victory
    ? Math.min(0, victoryHeat - decisionHeatShield)
    : Math.min(-6, defeatHeat - decisionHeatShield)

  return {
    victory,
    wins,
    lanes,
    supplyReward: victory ? victorySupplyReward : retreatSupplyFor(game.difficulty, game.battles - game.victories),
    legacySupplyBonus,
    protocolSupplyBonus,
    protocolScoreBonus,
    crownBreakCount,
    crownMasteryBonus,
    decisionEcho,
    finalVow,
    decisionHeatShield,
    decisionHeatProtected: Math.max(0, heatDelta - heatDeltaWithoutDecision),
    heatDelta,
    moraleDelta: victory
      ? 5 + (wins === 3 ? 3 : 0) + counterCount + condition.moraleDelta
      : crownSealFailure
        ? -7 + condition.moraleDelta
        : -12 + counterCount * 2 + condition.moraleDelta,
    scoreReward,
    legacyScoreBonus,
    contractScoreBonus,
    focusLane,
    boss: story.boss,
  }
}

function tacticalPlanRank(result: BattleResult, day: number, commandValid: boolean, commandSpent: number): number[] {
  const counterCount = result.lanes.filter((lane) => lane.countered).length
  const powerMargin = result.lanes.reduce((total, lane) => total + lane.playerPower - lane.enemyPower, 0)
  if (!commandValid) return [0, -commandSpent, result.wins, counterCount, powerMargin]
  const objectiveProgress =
    Math.min(result.wins, REQUIRED_LANE_WINS) +
    (day === MAX_NIGHTS ? Math.min(result.crownBreakCount, FINAL_CROWN_REQUIRED_SEALS) : 0)
  return [
    1,
    result.victory ? 1 : 0,
    objectiveProgress,
    result.wins,
    result.crownBreakCount,
    result.heatDelta,
    result.supplyReward,
    result.moraleDelta,
    result.scoreReward,
    counterCount,
    powerMargin,
    -commandSpent,
  ]
}

function compareTacticalRanks(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStoredValue(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function localStorageAvailable(): boolean {
  const probeKey = `${STORAGE_PREFIX}storage-probe`
  try {
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

function removeStoredValues(...keys: string[]) {
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // The game remains playable when storage is unavailable.
    }
  }
}

function removeUnknownStoredValues() {
  try {
    const unknownKeys: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(STORAGE_PREFIX) && !CURRENT_STORAGE_KEYS.has(key)) unknownKeys.push(key)
    }
    removeStoredValues(...unknownKeys)
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

function replaceStoredBackup(backup: GameBackup): boolean {
  const previous = new Map<string, string | null>()
  let stagingWritten = false
  try {
    for (const key of BACKUP_STORAGE_KEYS) previous.set(key, window.localStorage.getItem(key))
    window.localStorage.setItem(RESTORE_STAGING_KEY, JSON.stringify(backup))
    stagingWritten = true
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.game))
    window.localStorage.setItem(META_KEY, JSON.stringify(backup.meta))
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(backup.settings))
    window.localStorage.setItem(BEST_SCORE_KEY, String(backup.bestScore))
    if (backup.guide) window.localStorage.setItem(GUIDE_KEY, backup.guide)
    else window.localStorage.removeItem(GUIDE_KEY)
    window.localStorage.removeItem(BATTLE_STORAGE_KEY)
  } catch {
    let rollbackComplete = true
    for (const [key, value] of previous) {
      try {
        if (value === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, value)
      } catch {
        rollbackComplete = false
      }
    }
    if (stagingWritten && rollbackComplete) removeStoredValues(RESTORE_STAGING_KEY)
    return false
  }

  removeStoredValues(RESTORE_STAGING_KEY)
  return true
}

function readStoredJson(key: string): unknown | null | undefined {
  const value = readStoredValue(key)
  if (value === null) return undefined
  try {
    return JSON.parse(value) as unknown
  } catch {
    removeStoredValues(key)
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value)
  return actualKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key))
}

function isIntegerInRange(value: unknown, minimum: number, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length
}

const SETTINGS_KEYS = [
  'sound',
  'effectsVolume',
  'ambienceVolume',
  'haptics',
  'motion',
  'battlePace',
  'largeText',
  'highContrast',
] as const

function parseStoredSettings(value: unknown): GameSettings | null {
  if (!isRecord(value) || !hasExactKeys(value, SETTINGS_KEYS)) return null
  if (
    typeof value.sound !== 'boolean' ||
    !isIntegerInRange(value.effectsVolume, 0, 100) ||
    !isIntegerInRange(value.ambienceVolume, 0, 100) ||
    typeof value.haptics !== 'boolean' ||
    (value.motion !== 'system' && value.motion !== 'reduced') ||
    (value.battlePace !== 'cinematic' && value.battlePace !== 'swift') ||
    typeof value.largeText !== 'boolean' ||
    typeof value.highContrast !== 'boolean'
  ) {
    return null
  }
  return {
    sound: value.sound,
    effectsVolume: value.effectsVolume,
    ambienceVolume: value.ambienceVolume,
    haptics: value.haptics,
    motion: value.motion,
    battlePace: value.battlePace,
    largeText: value.largeText,
    highContrast: value.highContrast,
  }
}

function isStoredUnit(value: unknown): value is Unit {
  if (!isRecord(value) || !hasExactKeys(value, ['id', 'kind', 'tier', 'specialization'])) return false
  const kindIsValid = value.kind === 'warden' || value.kind === 'ranger' || value.kind === 'raider'
  const specialization = value.specialization
  const specializationIsValid =
    specialization === null ||
    (typeof specialization === 'string' &&
      SPECIALIZATION_IDS.includes(specialization as SpecializationId) &&
      kindIsValid &&
      SPECIALIZATIONS[specialization as SpecializationId].kind === value.kind &&
      isIntegerInRange(value.tier, 3, MAX_TIER))
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    kindIsValid &&
    isIntegerInRange(value.tier, 1, MAX_TIER) &&
    specializationIsValid
  )
}

const FAILURE_INSIGHT_KEYS = ['lane', 'cause', 'glyph', 'label', 'detail', 'action', 'gap', 'priority'] as const
const FAILURE_CAUSE_PRIORITIES: Record<FailureInsight['cause'], number> = {
  crown: 0,
  doctrine: 1,
  intent: 2,
  affinity: 3,
  tier: 4,
  power: 5,
}

function isStoredFailureInsight(value: unknown): value is FailureInsight {
  if (!isRecord(value) || !hasExactKeys(value, FAILURE_INSIGHT_KEYS)) return false
  const cause = value.cause
  if (
    cause !== 'crown' &&
    cause !== 'doctrine' &&
    cause !== 'intent' &&
    cause !== 'affinity' &&
    cause !== 'tier' &&
    cause !== 'power'
  ) {
    return false
  }
  return (
    isIntegerInRange(value.lane, 0, 2) &&
    typeof value.glyph === 'string' &&
    value.glyph.length > 0 &&
    value.glyph.length <= 8 &&
    typeof value.label === 'string' &&
    value.label.length > 0 &&
    value.label.length <= 80 &&
    typeof value.detail === 'string' &&
    value.detail.length > 0 &&
    value.detail.length <= 400 &&
    typeof value.action === 'string' &&
    value.action.length > 0 &&
    value.action.length <= 400 &&
    isIntegerInRange(value.gap, 0) &&
    value.priority === FAILURE_CAUSE_PRIORITIES[cause]
  )
}

function hasValidFailureInsights(value: unknown): value is FailureInsight[] {
  if (
    !Array.isArray(value) ||
    value.length > 3 ||
    !value.every(isStoredFailureInsight) ||
    !hasUniqueValues(value.map((insight) => insight.lane))
  ) {
    return false
  }
  return value.every(
    (insight, index) =>
      index === 0 ||
      value[index - 1].priority < insight.priority ||
      (value[index - 1].priority === insight.priority && value[index - 1].gap >= insight.gap),
  )
}

function cloneFailureInsights(insights: readonly FailureInsight[]): FailureInsight[] {
  return insights.map((insight) => ({ ...insight }))
}

const GAME_STATE_KEYS = [
  'campaignStarted',
  'day',
  'difficulty',
  'mode',
  'oath',
  'masteryContract',
  'runId',
  'runSeed',
  'activeLegacy',
  'heat',
  'supplies',
  'recoverySupplies',
  'morale',
  'recruits',
  'score',
  'renownLedger',
  'perfectNights',
  'intentsCountered',
  'unitedVictories',
  'battles',
  'victories',
  'bossesDefeated',
  'relics',
  'pendingRelic',
  'orders',
  'eventResolvedForDay',
  'decisions',
  'legacyAwarded',
  'legacyReward',
  'failureInsights',
  'slots',
  'lineup',
  'status',
] as const

const RENOWN_LEDGER_KEYS = ['battle', 'event', 'marchSeal'] as const
const RENOWN_LEDGER_ENTRY_KEYS = ['total', 'legacyBonus', 'contractBonus'] as const

function parseStoredRenownLedger(value: unknown): RenownLedger | null {
  if (!isRecord(value) || !hasExactKeys(value, RENOWN_LEDGER_KEYS)) return null

  const entries = RENOWN_LEDGER_KEYS.map((source) => value[source])
  if (
    entries.some(
      (entry) =>
        !isRecord(entry) ||
        !hasExactKeys(entry, RENOWN_LEDGER_ENTRY_KEYS) ||
        !isIntegerInRange(entry.total, 0) ||
        !isIntegerInRange(entry.legacyBonus, 0) ||
        !isIntegerInRange(entry.contractBonus, 0) ||
        entry.legacyBonus + entry.contractBonus > entry.total,
    )
  ) {
    return null
  }

  return cloneRenownLedger(value as RenownLedger)
}

function parseStoredGame(value: unknown): GameState | null {
  if (!isRecord(value) || !hasExactKeys(value, GAME_STATE_KEYS)) return null
  const game = value as GameState
  const renownLedger = parseStoredRenownLedger(game.renownLedger)
  const renownTotal = renownLedger
    ? renownLedger.battle.total + renownLedger.event.total + renownLedger.marchSeal.total
    : -1
  const legacyRenownTotal = renownLedger
    ? renownLedger.battle.legacyBonus + renownLedger.event.legacyBonus + renownLedger.marchSeal.legacyBonus
    : -1
  const contractRenownTotal = renownLedger
    ? renownLedger.battle.contractBonus + renownLedger.event.contractBonus + renownLedger.marchSeal.contractBonus
    : -1

  const hasValidLegacy =
    Array.isArray(game.activeLegacy) &&
    game.activeLegacy.length <= LEGACY_IDS.length &&
    game.activeLegacy.every((legacy) => LEGACY_IDS.includes(legacy)) &&
    hasUniqueValues(game.activeLegacy)
  const hasValidRelics =
    Array.isArray(game.relics) &&
    game.relics.length <= RELIC_IDS.length &&
    game.relics.every((relic) => RELIC_IDS.includes(relic)) &&
    hasUniqueValues(game.relics)
  const hasValidOrders =
    Array.isArray(game.orders) &&
    game.orders.length === 3 &&
    game.orders.every((order) => order === 'hold' || order === 'assault' || order === 'support')
  const hasValidDecisions =
    Array.isArray(game.decisions) &&
    game.decisions.length <= MAX_NIGHTS &&
    game.decisions.every((decision) => typeof decision === 'string' && decision.length > 0) &&
    hasUniqueValues(game.decisions) &&
    decisionsMatchCampaign(game.decisions, game.eventResolvedForDay, game.oath, game.runSeed)
  const hasValidSlots =
    Array.isArray(game.slots) &&
    game.slots.length === ROSTER_SIZE &&
    game.slots.every((unit) => unit === null || isStoredUnit(unit))
  const hasValidLineup =
    Array.isArray(game.lineup) &&
    game.lineup.length === 3 &&
    game.lineup.every((unitId) => unitId === null || (typeof unitId === 'string' && unitId.length > 0))
  const hasValidOutcomeInsights = hasValidFailureInsights(game.failureInsights)

  if (
    typeof game.campaignStarted !== 'boolean' ||
    !isIntegerInRange(game.day, 1, MAX_NIGHTS) ||
    (game.difficulty !== 'story' && game.difficulty !== 'expedition' && game.difficulty !== 'whiteout') ||
    (game.mode !== 'standard' && game.mode !== 'daily' && game.mode !== 'shared') ||
    !OATH_IDS.includes(game.oath) ||
    (game.masteryContract !== null && !MASTERY_CONTRACT_IDS.includes(game.masteryContract)) ||
    (game.masteryContract !== null && game.mode !== 'standard') ||
    !isIntegerInRange(game.runId, 1, 2_147_483_647) ||
    !isIntegerInRange(game.runSeed, 1, 2_147_483_647) ||
    !hasValidLegacy ||
    (!inheritedPowerEnabledFor(game.mode) && game.activeLegacy.length !== 0) ||
    !isIntegerInRange(game.heat, 0, 100) ||
    !isIntegerInRange(game.supplies, 0) ||
    !isIntegerInRange(game.recoverySupplies, 0, game.supplies) ||
    !isIntegerInRange(game.morale, 0, 100) ||
    !isIntegerInRange(game.recruits, 0) ||
    !isIntegerInRange(game.score, 0) ||
    renownLedger === null ||
    renownTotal !== game.score ||
    (!game.activeLegacy.includes('chroniclers-ink') && legacyRenownTotal !== 0) ||
    (game.masteryContract === null && contractRenownTotal !== 0) ||
    (game.masteryContract !== null && game.activeLegacy.length !== LEGACY_IDS.length) ||
    !isIntegerInRange(game.perfectNights, 0, MAX_NIGHTS) ||
    !isIntegerInRange(game.intentsCountered, 0, MAX_NIGHTS * 3) ||
    !isIntegerInRange(game.unitedVictories, 0, MAX_NIGHTS) ||
    !isIntegerInRange(game.battles, 0) ||
    !isIntegerInRange(game.victories, 0, MAX_NIGHTS) ||
    !isIntegerInRange(game.bossesDefeated, 0, 3) ||
    !hasValidRelics ||
    typeof game.pendingRelic !== 'boolean' ||
    !hasValidOrders ||
    !isIntegerInRange(game.eventResolvedForDay, 0, game.day) ||
    !hasValidDecisions ||
    typeof game.legacyAwarded !== 'boolean' ||
    !isIntegerInRange(game.legacyReward, 0) ||
    !hasValidOutcomeInsights ||
    !hasValidSlots ||
    !hasValidLineup ||
    (game.status !== 'playing' && game.status !== 'won' && game.status !== 'lost') ||
    (game.status === 'won' && game.day !== MAX_NIGHTS) ||
    (game.status === 'lost' && game.heat !== 0) ||
    (game.status === 'lost' && game.failureInsights.length === 0) ||
    (game.status !== 'lost' && game.failureInsights.length !== 0) ||
    (game.status === 'playing' && game.legacyAwarded) ||
    (game.status !== 'playing' && !game.legacyAwarded)
  ) {
    return null
  }

  const slots = game.slots.map((unit) => (unit ? { ...unit } : null))
  const occupiedIds = slots.flatMap((unit) => (unit ? [unit.id] : []))
  if (occupiedIds.length < 3 || new Set(occupiedIds).size !== occupiedIds.length) return null

  const lineupIds = game.lineup.flatMap((unitId) => (unitId ? [unitId] : []))
  if (
    !hasUniqueValues(lineupIds) ||
    lineupIds.some((unitId) => !occupiedIds.includes(unitId)) ||
    game.victories > game.battles ||
    game.bossesDefeated > game.victories ||
    game.perfectNights > game.victories ||
    game.intentsCountered > game.battles * 3 ||
    game.unitedVictories > game.victories ||
    game.recoverySupplies > maximumRecoverySuppliesFor(game.difficulty, game.battles - game.victories)
  ) {
    return null
  }

  const expectedLegacyReward =
    game.status === 'playing' ? 0 : legacyRewardBreakdownFor(game, game.status === 'won').total
  if (game.legacyReward !== expectedLegacyReward) return null

  return {
    ...game,
    activeLegacy: [...game.activeLegacy],
    relics: [...game.relics],
    orders: [...game.orders],
    decisions: [...game.decisions],
    failureInsights: cloneFailureInsights(game.failureInsights),
    renownLedger,
    slots,
    lineup: [...game.lineup],
  }
}

const EXPEDITION_RECORD_KEYS = [
  'runId',
  'seed',
  'mode',
  'difficulty',
  'oath',
  'masteryContract',
  'activeLegacy',
  'ending',
  'won',
  'day',
  'score',
  'legacyReward',
  'failureInsights',
  'perfectNights',
  'trialsCompleted',
  'relics',
] as const

function isStoredExpeditionRecord(value: unknown): value is ExpeditionRecord {
  if (!isRecord(value) || !hasExactKeys(value, EXPEDITION_RECORD_KEYS)) return false
  const record = value as ExpeditionRecord
  const hasMatchingEnding = record.won
    ? record.ending === 'hearth-dawn' || record.ending === 'ember-crown' || record.ending === 'crownless-dawn'
    : record.ending === 'broken-watch' || record.ending === 'frozen-choir' || record.ending === 'last-march'
  const hasValidRelics =
    Array.isArray(record.relics) &&
    record.relics.length <= RELIC_NIGHTS.size &&
    record.relics.every((relicId) => RELIC_IDS.includes(relicId)) &&
    hasUniqueValues(record.relics)
  const hasValidActiveLegacy =
    Array.isArray(record.activeLegacy) &&
    record.activeLegacy.length <= LEGACY_IDS.length &&
    record.activeLegacy.every((legacyId) => LEGACY_IDS.includes(legacyId)) &&
    hasUniqueValues(record.activeLegacy)
  const hasValidOutcomeInsights = hasValidFailureInsights(record.failureInsights)
  return (
    isIntegerInRange(record.runId, 1, 2_147_483_647) &&
    isIntegerInRange(record.seed, 1, 2_147_483_647) &&
    (record.mode === 'standard' || record.mode === 'daily' || record.mode === 'shared') &&
    (record.difficulty === 'story' || record.difficulty === 'expedition' || record.difficulty === 'whiteout') &&
    OATH_IDS.includes(record.oath) &&
    (record.masteryContract === null || MASTERY_CONTRACT_IDS.includes(record.masteryContract)) &&
    (record.masteryContract === null || record.mode === 'standard') &&
    hasValidActiveLegacy &&
    (record.mode === 'standard' || record.activeLegacy.length === 0) &&
    (record.masteryContract === null || record.activeLegacy.length === LEGACY_IDS.length) &&
    ENDING_IDS.includes(record.ending) &&
    typeof record.won === 'boolean' &&
    hasMatchingEnding &&
    isIntegerInRange(record.day, 1, MAX_NIGHTS) &&
    (!record.won || record.day === MAX_NIGHTS) &&
    isIntegerInRange(record.score, 0) &&
    isIntegerInRange(record.legacyReward, 0) &&
    hasValidOutcomeInsights &&
    (record.won ? record.failureInsights.length === 0 : record.failureInsights.length > 0) &&
    isIntegerInRange(record.perfectNights, 0, record.day) &&
    isIntegerInRange(record.trialsCompleted, 0, 3) &&
    hasValidRelics
  )
}

const META_STATE_KEYS = [
  'embers',
  'completedRuns',
  'legacy',
  'masteredContracts',
  'achievements',
  'discoveredRelics',
  'history',
] as const

function parseStoredMeta(value: unknown): MetaState | null {
  if (!isRecord(value) || !hasExactKeys(value, META_STATE_KEYS)) return null
  const meta = value as MetaState
  const hasValidLegacy =
    Array.isArray(meta.legacy) &&
    meta.legacy.length <= LEGACY_IDS.length &&
    meta.legacy.every((legacy) => LEGACY_IDS.includes(legacy)) &&
    hasUniqueValues(meta.legacy)
  const hasValidAchievements =
    Array.isArray(meta.achievements) &&
    meta.achievements.length <= ACHIEVEMENT_IDS.length &&
    meta.achievements.every((achievement) => ACHIEVEMENT_IDS.includes(achievement)) &&
    hasUniqueValues(meta.achievements)
  const hasValidMasteredContracts =
    Array.isArray(meta.masteredContracts) &&
    meta.masteredContracts.length <= MASTERY_CONTRACT_IDS.length &&
    meta.masteredContracts.every((contractId) => MASTERY_CONTRACT_IDS.includes(contractId)) &&
    hasUniqueValues(meta.masteredContracts)
  const hasValidRelics =
    Array.isArray(meta.discoveredRelics) &&
    meta.discoveredRelics.length <= RELIC_IDS.length &&
    meta.discoveredRelics.every((relic) => RELIC_IDS.includes(relic)) &&
    hasUniqueValues(meta.discoveredRelics)
  const hasValidHistory =
    Array.isArray(meta.history) &&
    meta.history.length <= MAX_HISTORY &&
    meta.history.every(isStoredExpeditionRecord) &&
    hasUniqueValues(meta.history.map((record) => record.runId))

  if (
    !isIntegerInRange(meta.embers, 0) ||
    !isIntegerInRange(meta.completedRuns, 0) ||
    !hasValidLegacy ||
    !hasValidMasteredContracts ||
    !hasValidAchievements ||
    !hasValidRelics ||
    !hasValidHistory
  ) {
    return null
  }

  const mastery = legacyMasteryFor(meta)
  if (
    meta.completedRuns < meta.history.filter((record) => record.won).length ||
    (meta.masteredContracts.length > 0 && mastery === null) ||
    meta.masteredContracts.some(
      (contractId) => mastery === null || mastery.level < MASTERY_CONTRACTS[contractId].requiredMasteryLevel,
    ) ||
    meta.history.some(
      (record) =>
        record.masteryContract !== null &&
        (mastery === null || mastery.level < MASTERY_CONTRACTS[record.masteryContract].requiredMasteryLevel),
    ) ||
    meta.history.some((record) => record.activeLegacy.some((legacyId) => !meta.legacy.includes(legacyId))) ||
    meta.history.some((record) => record.relics.some((relicId) => !meta.discoveredRelics.includes(relicId))) ||
    meta.history.some(
      (record) =>
        record.won && record.masteryContract !== null && !meta.masteredContracts.includes(record.masteryContract),
    )
  ) {
    return null
  }

  return {
    ...meta,
    legacy: [...meta.legacy],
    masteredContracts: [...meta.masteredContracts],
    achievements: [
      ...new Set([...meta.achievements, ...meta.history.map((record) => ENDING_ACHIEVEMENTS[record.ending])]),
    ],
    discoveredRelics: [...meta.discoveredRelics],
    history: meta.history.map((record) => ({
      ...record,
      activeLegacy: [...record.activeLegacy],
      failureInsights: cloneFailureInsights(record.failureInsights),
      relics: [...record.relics],
    })),
  }
}

const BACKUP_KEYS = ['game', 'meta', 'settings', 'bestScore', 'guide'] as const

function parseGameBackup(value: unknown): GameBackup | null {
  if (!isRecord(value) || !hasExactKeys(value, BACKUP_KEYS)) return null
  const game = parseStoredGame(value.game)
  const meta = parseStoredMeta(value.meta)
  const settings = parseStoredSettings(value.settings)
  if (
    game === null ||
    meta === null ||
    !masteryContractAvailableFor(game.masteryContract, meta) ||
    game.activeLegacy.some((legacyId) => !meta.legacy.includes(legacyId)) ||
    game.relics.some((relicId) => !meta.discoveredRelics.includes(relicId)) ||
    !gameHistoryMatches(game, meta, false) ||
    settings === null ||
    !isIntegerInRange(value.bestScore, 0) ||
    value.bestScore < highestRecordedScoreFor(game, meta) ||
    (value.guide !== null && value.guide !== GUIDE_SEEN && value.guide !== GUIDE_REPLAY)
  ) {
    return null
  }
  return {
    game,
    meta,
    settings,
    bestScore: value.bestScore,
    guide: value.guide,
  }
}

function masteryContractAvailableFor(contractId: MasteryContractId | null, meta: MetaState): boolean {
  if (contractId === null) return true
  const mastery = legacyMasteryFor(meta)
  return mastery !== null && mastery.level >= MASTERY_CONTRACTS[contractId].requiredMasteryLevel
}

type InterruptedRestoreRecovery = 'none' | 'completed' | 'reset'

function recoverInterruptedBackupRestore(): InterruptedRestoreRecovery {
  const stagedValue = readStoredJson(RESTORE_STAGING_KEY)
  if (stagedValue === undefined) return 'none'

  const stagedBackup = parseGameBackup(stagedValue)
  if (stagedBackup && replaceStoredBackup(stagedBackup)) return 'completed'

  removeStoredValues(...BACKUP_STORAGE_KEYS, RESTORE_STAGING_KEY)
  return 'reset'
}

function readBestScore(): number {
  const value = readStoredValue(BEST_SCORE_KEY)
  if (value === null) return 0
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    removeStoredValues(BEST_SCORE_KEY)
    return 0
  }
  const score = Number(value)
  if (!Number.isSafeInteger(score)) {
    removeStoredValues(BEST_SCORE_KEY)
    return 0
  }
  return score
}

function highestRecordedScoreFor(game: GameState | null, meta: MetaState): number {
  let highestScore = game && game.status !== 'playing' ? game.score : 0
  for (const record of meta.history) highestScore = Math.max(highestScore, record.score)
  return highestScore
}

function restoreSavedBattle(value: unknown, game: GameState): BattleResult | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['runId', 'battles', 'day', 'focusLane']) ||
    game.status !== 'playing' ||
    pendingPromotionFor(game) !== null ||
    game.pendingRelic ||
    game.eventResolvedForDay < game.day
  ) {
    return null
  }
  const checkpoint = value as Partial<SavedBattle>
  if (
    checkpoint.runId !== game.runId ||
    checkpoint.battles !== game.battles ||
    checkpoint.day !== game.day ||
    typeof checkpoint.focusLane !== 'number' ||
    !Number.isInteger(checkpoint.focusLane) ||
    checkpoint.focusLane < 0 ||
    checkpoint.focusLane > 2
  ) {
    return null
  }
  return createBattleResult(game, checkpoint.focusLane)
}

function findUnit(game: GameState, id: string | null): Unit | null {
  if (!id) return null
  return game.slots.find((unit) => unit?.id === id) ?? null
}

function lineupAfterDeployment(
  lineup: readonly (string | null)[],
  unitId: string,
  targetLane: number,
): Array<string | null> {
  const nextLineup = [...lineup]
  const sourceLane = nextLineup.indexOf(unitId)
  if (sourceLane === targetLane) return nextLineup

  const targetUnitId = nextLineup[targetLane] ?? null
  if (sourceLane >= 0) nextLineup[sourceLane] = targetUnitId
  nextLineup[targetLane] = unitId
  return nextLineup
}

function tutorialCounterCountFor(game: GameState): number {
  const tutorialEnemies = createEnemies(game.day, game.runSeed)
  return game.orders.filter(
    (order, lane) => order !== INITIAL_GAME.orders[lane] && ORDER_META[order].counters === tutorialEnemies[lane].intent,
  ).length
}

function inferTutorialStep(game: GameState): TutorialStep {
  if (!game.slots.some((unit) => unit && unit.tier >= 2)) return 'merge'
  if (
    !game.lineup.some((unitId) => {
      const unit = findUnit(game, unitId)
      return unit && unit.tier >= 2
    })
  ) {
    return 'deploy'
  }
  if (tutorialCounterCountFor(game) === 0) return 'orders'
  return 'focus'
}

function relicChoicesFor(day: number, owned: RelicId[], runSeed: number): RelicId[] {
  const available = RELIC_IDS.filter((relic) => !owned.includes(relic))
  if (available.length <= 3) return available
  const ordered = available
    .map((id) => ({ id, order: seededValue(runSeed, day * 101 + RELIC_IDS.indexOf(id) * 17) }))
    .sort((left, right) => left.order - right.order)
    .map(({ id }) => id)
  const completion = ordered.find((relicId) => resonancePreviewFor(relicId, owned)?.completes)
  if (!completion) return ordered.slice(0, 3)

  const selected: RelicId[] = [completion]
  for (const relicId of ordered) {
    if (!selected.includes(relicId)) selected.push(relicId)
    if (selected.length === 3) break
  }
  return ordered.filter((relicId) => selected.includes(relicId))
}

function actForDay(day: number) {
  return ACTS.find((act) => day >= act.range[0] && day <= act.range[1]) ?? ACTS[ACTS.length - 1]
}

function commandLimitFor(
  morale: number,
  legacy: LegacyId[],
  oath: OathId,
  condition: NightCondition,
  difficulty: Difficulty,
): number {
  return Math.max(
    1,
    2 +
      (morale >= 80 ? 1 : 0) +
      (legacy.includes('command-seal') ? 1 : 0) +
      (oath === 'signal-corps' ? 1 : 0) +
      DIFFICULTIES[difficulty].commandBonus +
      condition.commandDelta,
  )
}

function eventScoreRewardFor(
  choice: EventChoice,
  difficulty: Difficulty,
  oath: OathId,
  legacy: readonly LegacyId[],
  masteryContract: MasteryContractId | null,
) {
  const baseScore = choice.score ?? 0
  const expeditionScale = expeditionRenownScaleFor(difficulty, oath)
  const expeditionScore = Math.round(baseScore * expeditionScale)
  const inheritedScore = Math.round(baseScore * expeditionScale * (legacy.includes('chroniclers-ink') ? 1.08 : 1))
  const scoreGain = masteryContractScoreFor(inheritedScore, masteryContract)
  return {
    scoreGain,
    legacyScoreBonus: inheritedScore - expeditionScore,
    contractScoreBonus: scoreGain - inheritedScore,
    masteryContract,
  }
}

function legacyRewardBreakdownFor(game: GameState, won: boolean): LegacyRewardBreakdown {
  const renown = Math.floor(game.score / 4_500)
  const crowns = game.bossesDefeated * 2
  const trials = completedTrialsFor(game, won).reduce((total, trialId) => total + TRIALS[trialId].reward, 0)
  const protocol = won ? (game.difficulty === 'whiteout' ? 7 : game.difficulty === 'expedition' ? 3 : 0) : 0
  const dawn = won ? 8 : 0
  const earned = renown + crowns + trials + protocol + dawn
  const recovery = !won && earned === 0 && game.victories > 0 ? 1 : 0
  return {
    renown,
    crowns,
    trials,
    protocol,
    dawn,
    recovery,
    total: earned + recovery,
  }
}

function rankEntryForScore(score: number) {
  return EXPEDITION_RANKS.find((entry) => score >= entry.minimum) ?? EXPEDITION_RANKS.at(-1)!
}

function expeditionRank(score: number, won: boolean): ExpeditionRank {
  if (!won) return 'D'
  return rankEntryForScore(score).rank
}

function achievementMilestone(achievementId: AchievementId): MilestoneNotice {
  const achievement = ACHIEVEMENTS[achievementId]
  const discoveredEndingId = ENDING_IDS.find((endingId) => ENDING_ACHIEVEMENTS[endingId] === achievementId)
  const masteredProtocol = (Object.keys(PROTOCOL_MASTERIES) as Difficulty[]).find(
    (difficulty) => PROTOCOL_MASTERIES[difficulty].achievement === achievementId,
  )
  const completedOathChronicle = (Object.keys(OATH_CHRONICLE_ACHIEVEMENTS) as OathId[]).find(
    (oath) => OATH_CHRONICLE_ACHIEVEMENTS[oath] === achievementId,
  )
  return {
    id: `achievement-${achievementId}`,
    kind: 'achievement',
    glyph: achievement.glyph,
    kicker: discoveredEndingId
      ? 'ENDING DISCOVERED'
      : masteredProtocol
        ? 'EXPEDITION PROTOCOL MASTERED'
        : completedOathChronicle
          ? 'OATH CHRONICLE COMPLETED'
          : 'ACHIEVEMENT UNLOCKED',
    title: achievement.name,
    description: achievement.description,
    detail: discoveredEndingId
      ? '새벽 도감에 영구 보존'
      : masteredProtocol
        ? `${DIFFICULTIES[masteredProtocol].name} 교범에 영구 보존`
        : completedOathChronicle
          ? `${OATHS[completedOathChronicle].name} 연대기에 영구 보존`
          : '원정 업적 기록에 영구 보존',
  }
}

function crownApproachMilestone(runId: number, night: number, mechanic: BossMechanic): MilestoneNotice {
  return {
    id: `crown-${runId}-${night}`,
    kind: 'crown',
    glyph: mechanic.glyph,
    kicker: 'CROWN SIGNATURE DETECTED',
    title: `${mechanic.name} 접근`,
    description: `${mechanic.epithet}이 다음 밤의 길을 막아섭니다.`,
    detail: `NIGHT ${String(night).padStart(2, '0')} · ${mechanic.pressureCopy}`,
  }
}

function legacyLoadoutMilestone(game: GameState): MilestoneNotice | null {
  if (game.activeLegacy.length === 0) return null
  const names = game.activeLegacy.map((legacyId) => LEGACY_UPGRADES[legacyId].name)
  const visibleNames = names.slice(0, 3).join(' · ')
  const remaining = names.length - 3
  return {
    id: `legacy-loadout-${game.runId}`,
    kind: 'legacy',
    glyph: game.activeLegacy.length === 1 ? LEGACY_UPGRADES[game.activeLegacy[0]].glyph : '✦',
    kicker: 'EXPEDITION LEGACY LOADED',
    title: `계승 유산 ${game.activeLegacy.length}개 적용`,
    description: `${visibleNames}${remaining > 0 ? ` 외 ${remaining}개` : ''}`,
    detail: 'DAY 01 · 현재 원정에 고정 · 첫 선택부터 적용',
  }
}

function legacyMasteryMilestoneFor(previousMeta: MetaState, nextMeta: MetaState): MilestoneNotice | null {
  const previousMastery = legacyMasteryFor(previousMeta)
  const nextMastery = legacyMasteryFor(nextMeta)
  if (!nextMastery || (previousMastery && nextMastery.level <= previousMastery.level)) return null
  const unlocked = previousMastery === null
  const levelsRaised = nextMastery.level - (previousMastery?.level ?? 0)
  const previousLevel = previousMastery?.level ?? -1
  const unlockedContracts = MASTERY_CONTRACT_IDS.filter((contractId) => {
    const requiredLevel = MASTERY_CONTRACTS[contractId].requiredMasteryLevel
    return requiredLevel > previousLevel && requiredLevel <= nextMastery.level
  })
  const contractUnlockDetail =
    unlockedContracts.length > 0
      ? ` · 영원 계약 ${unlockedContracts.map((contractId) => MASTERY_CONTRACTS[contractId].name).join(' · ')} 개방`
      : ''
  return {
    id: `legacy-mastery-${nextMastery.level}-${nextMeta.completedRuns}-${nextMeta.embers}`,
    kind: 'legacy',
    glyph: nextMastery.glyph,
    kicker: unlocked ? 'EVERLASTING LEGACY UNLOCKED' : 'EVERLASTING LEGACY RAISED',
    title: unlocked && nextMastery.level === 0 ? '영원 인장 트랙 개방' : nextMastery.title,
    description: unlocked
      ? '여섯 유산을 완성했습니다. 이제 남는 불씨 30마다 전투력과 무관한 영구 명예 인장이 이어집니다.'
      : `${nextMastery.sealLabel} · ${nextMastery.title}`,
    detail: unlocked
      ? `${nextMastery.sealLabel} · ${nextMastery.nextTitle}까지 불씨 ${nextMastery.remaining}${contractUnlockDetail}`
      : `영원 인장 ${previousMastery.level} → ${nextMastery.level}${levelsRaised > 1 ? ` · 한 번에 ${levelsRaised}단계 상승` : ''}${contractUnlockDetail}`,
  }
}

function masteryContractMilestone(contractId: MasteryContractId): MilestoneNotice {
  const contract = MASTERY_CONTRACTS[contractId]
  return {
    id: `mastery-contract-${contractId}`,
    kind: 'legacy',
    glyph: contract.glyph,
    kicker: 'ETERNAL COVENANT MASTERED',
    title: `${contract.name} 정복`,
    description: `${contract.burden}을 끝까지 지키고 새벽에 도달했습니다.`,
    detail: `${contract.reward} · 영원 계약 숙련 기록에 영구 보존`,
  }
}

function createExpeditionRecord(game: GameState, won: boolean): ExpeditionRecord {
  return {
    runId: game.runId,
    seed: game.runSeed,
    mode: game.mode,
    difficulty: game.difficulty,
    oath: game.oath,
    masteryContract: game.masteryContract,
    activeLegacy: [...game.activeLegacy],
    ending: endingFor(game, won),
    won,
    day: game.day,
    score: game.score,
    legacyReward: game.legacyReward,
    failureInsights: cloneFailureInsights(game.failureInsights),
    perfectNights: game.perfectNights,
    trialsCompleted: completedTrialsFor(game, won).length,
    relics: [...game.relics],
  }
}

function expeditionRecordMatchesGame(record: ExpeditionRecord, game: GameState): boolean {
  if (game.status === 'playing') return false
  const expected = createExpeditionRecord(game, game.status === 'won')
  return (
    record.runId === expected.runId &&
    record.seed === expected.seed &&
    record.mode === expected.mode &&
    record.difficulty === expected.difficulty &&
    record.oath === expected.oath &&
    record.masteryContract === expected.masteryContract &&
    record.activeLegacy.length === expected.activeLegacy.length &&
    record.activeLegacy.every((legacyId, index) => legacyId === expected.activeLegacy[index]) &&
    record.ending === expected.ending &&
    record.won === expected.won &&
    record.day === expected.day &&
    record.score === expected.score &&
    record.legacyReward === expected.legacyReward &&
    record.failureInsights.length === expected.failureInsights.length &&
    record.failureInsights.every((insight, index) => {
      const expectedInsight = expected.failureInsights[index]
      return FAILURE_INSIGHT_KEYS.every((key) => insight[key] === expectedInsight[key])
    }) &&
    record.perfectNights === expected.perfectNights &&
    record.trialsCompleted === expected.trialsCompleted &&
    record.relics.length === expected.relics.length &&
    record.relics.every((relicId, index) => relicId === expected.relics[index])
  )
}

function gameHistoryMatches(game: GameState, meta: MetaState, allowMissingTerminalRecord: boolean): boolean {
  const matchingRecord = meta.history.find((record) => record.runId === game.runId)
  if (game.status === 'playing') return matchingRecord === undefined
  if (!matchingRecord) return allowMissingTerminalRecord
  return expeditionRecordMatchesGame(matchingRecord, game)
}

function cloneGameState(game: GameState): GameState {
  return {
    ...game,
    activeLegacy: [...game.activeLegacy],
    relics: [...game.relics],
    orders: [...game.orders],
    decisions: [...game.decisions],
    failureInsights: cloneFailureInsights(game.failureInsights),
    renownLedger: cloneRenownLedger(game.renownLedger),
    slots: game.slots.map((unit) => (unit ? { ...unit } : null)),
    lineup: [...game.lineup],
  }
}

export default function Game() {
  const [game, setGame] = useState<GameState>(() => createInitialGame())
  const [meta, setMeta] = useState<MetaState>(() => ({ ...INITIAL_META }))
  const [phase, setPhase] = useState<Phase>('event')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [riskDepartureConfirmation, setRiskDepartureConfirmation] = useState<{
    game: GameState
    focusLane: number
  } | null>(null)
  const [focusLane, setFocusLane] = useState(0)
  const [showTitle, setShowTitle] = useState(true)
  const [showDifficulty, setShowDifficulty] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [setupMode, setSetupMode] = useState<RunMode>('standard')
  const [selectedMasteryContract, setSelectedMasteryContract] = useState<MasteryContractId | null>(null)
  const [sharedCode, setSharedCode] = useState('')
  const [incomingRiftCode, setIncomingRiftCode] = useState<string | null>(null)
  const [pendingReplacementRiftCode, setPendingReplacementRiftCode] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('map')
  const [showGuide, setShowGuide] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExpeditionMenu, setShowExpeditionMenu] = useState(false)
  const [showNewCampaignConfirm, setShowNewCampaignConfirm] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [online, setOnline] = useState(true)
  const [runtimeActive, setRuntimeActive] = useState(true)
  const [campaignStageReady, setCampaignStageReady] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null)
  const [mobileRosterOpen, setMobileRosterOpen] = useState(false)
  const [compactViewport, setCompactViewport] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS })
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [storageProtection, setStorageProtection] = useState<StorageProtection>('checking')
  const [installPending, setInstallPending] = useState(false)
  const [storageRequestPending, setStorageRequestPending] = useState(false)
  const [restorePending, setRestorePending] = useState(false)
  const [sharePending, setSharePending] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const [campUndo, setCampUndo] = useState<CampUndo | null>(null)
  const [growthCeremony, setGrowthCeremony] = useState<GrowthCeremony | null>(null)
  const [marchSealCeremony, setMarchSealCeremony] = useState<MarchSealCeremony | null>(null)
  const [pendingLegacyPurchase, setPendingLegacyPurchase] = useState<LegacyId | null>(null)
  const [sessionAccess, setSessionAccess] = useState<SessionAccess>('checking')
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const [milestoneQueue, setMilestoneQueue] = useState<MilestoneNotice[]>([])
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null)
  const dragSession = useRef<DragSession | null>(null)
  const dragGhostRef = useRef<HTMLDivElement>(null)
  const dragFrame = useRef<number | null>(null)
  const dragPosition = useRef({ x: 0, y: 0 })
  const animationFrames = useRef(new Set<number>())
  const toastTimer = useRef<PausableRuntimeTimer | null>(null)
  const growthCeremonyTimer = useRef<PausableRuntimeTimer | null>(null)
  const marchSealTimer = useRef<PausableRuntimeTimer | null>(null)
  const milestoneDismissTimer = useRef<PausableRuntimeTimer | null>(null)
  const milestoneSoundId = useRef<string | null>(null)
  const queuedMilestoneIds = useRef(new Set<string>())
  const backupInputRef = useRef<HTMLInputElement>(null)
  const campMutationInFlight = useRef(false)
  const battleLaunchInFlight = useRef(false)
  const resolvingBattle = useRef(false)
  const resolvingChoice = useRef<string | null>(null)
  const purchasingLegacy = useRef(false)
  const storageWarningShown = useRef(false)
  const runtimeActiveRef = useRef(true)
  const installInFlight = useRef(false)
  const storageRequestInFlight = useRef(false)
  const restoringBackup = useRef(false)
  const shareInFlight = useRef(false)
  const sessionLockRelease = useRef<(() => void) | null>(null)
  const audioRecoveryInFlight = useRef(false)
  const navigationGuardArmed = useRef(false)
  const suppressNavigationPop = useRef(false)
  const waitingServiceWorker = useRef<ServiceWorker | null>(null)
  const applyingUpdate = useRef(false)
  const reloadingAfterControllerChange = useRef(false)
  const soundOn = settings.sound

  const enemies = useMemo(() => createEnemies(game.day, game.runSeed), [game.day, game.runSeed])
  const currentStory = NIGHT_STORIES[game.day - 1]
  const soundscapeMood: SoundscapeMood = showTitle
    ? 'title'
    : phase === 'finale' || phase === 'won'
      ? 'dawn'
      : phase === 'lost' || (phase === 'result' && battleResult?.victory === false)
        ? 'mourning'
        : phase === 'battling'
          ? currentStory.boss
            ? 'boss'
            : 'battle'
          : phase === 'event' || phase === 'interlude' || game.heat <= 25
            ? 'whiteout'
            : 'hearth'
  const campaignRuntimeActive = !showTitle
  const eventForecastActive = campaignRuntimeActive && phase === 'event'
  const campForecastActive = campaignRuntimeActive && phase === 'camp'
  const promotionForecastActive = campaignRuntimeActive && phase === 'promotion'
  const relicForecastActive = campaignRuntimeActive && phase === 'relic'
  const laneForecastActive = campForecastActive || promotionForecastActive || relicForecastActive
  const battlePreviewActive = campForecastActive || promotionForecastActive
  const endingScreenActive = phase === 'won' || phase === 'lost'
  const achievementAnalysisActive = showTitle || showArchive || showExpeditionMenu || endingScreenActive
  const retrospectiveAnalysisActive = showTitle || showArchive || endingScreenActive
  const legacyRecommendationActive = showArchive || endingScreenActive
  const battleResultFor = useMemo(() => {
    const cache = new Map<string, BattleResult | null>()

    return (candidateFocusLane: number, candidateGame: GameState = game) => {
      // Render-time simulations only vary the current game's orders, lineup, or specialized slots.
      const key = JSON.stringify([
        candidateFocusLane,
        candidateGame.orders,
        candidateGame.lineup,
        candidateGame.slots.map((unit) => (unit ? [unit.id, unit.kind, unit.tier, unit.specialization] : null)),
      ])
      if (cache.has(key)) return cache.get(key) ?? null

      const result = createBattleResult(candidateGame, candidateFocusLane)
      cache.set(key, result)
      return result
    }
  }, [game])
  const currentEvent = campaignEventFor(game.runSeed, game.day)
  const oathAvailableEventChoices = currentEvent.choices.filter(
    (choice) => !choice.oathOnly || choice.oathOnly === game.oath,
  )
  const standardEventChoices = oathAvailableEventChoices.filter((choice) => !choice.emergencyOnly)
  const emergencyEventChoices = oathAvailableEventChoices.filter((choice) => choice.emergencyOnly)
  const hasAffordableStandardEventChoice = standardEventChoices.some(
    (choice) => !choice.requiresSupplies || game.supplies >= choice.requiresSupplies,
  )
  const currentEventChoices =
    emergencyEventChoices.length > 0 && !hasAffordableStandardEventChoice
      ? [...standardEventChoices, ...emergencyEventChoices]
      : standardEventChoices
  const oathEventChoiceIndex = currentEventChoices.findIndex(
    (choice) => choice.oathOnly === game.oath && (!choice.requiresSupplies || game.supplies >= choice.requiresSupplies),
  )
  const firstAvailableEventChoiceIndex =
    oathEventChoiceIndex >= 0
      ? oathEventChoiceIndex
      : currentEventChoices.findIndex((choice) => !choice.requiresSupplies || game.supplies >= choice.requiresSupplies)
  const currentOathIntervention = currentEventChoices.find((choice) => choice.oathOnly === game.oath) ?? null
  const oathChronicle = OATH_CHRONICLES[game.oath]
  const currentOathStage = oathChronicle.stages.find((stage) => stage.day === game.day) ?? null
  const eventOathIntervention =
    currentOathIntervention && currentOathStage
      ? {
          oath: game.oath,
          chronicleLabel: oathChronicle.label,
          stageDay: currentOathStage.day,
          name: currentOathStage.name,
          promise: currentOathStage.promise,
        }
      : null
  const oathInterventionPath = oathChronicle.stages.map((stage) => {
    const choiceId = game.decisions[stage.day - 1]
    const choice = choiceId
      ? campaignEventFor(game.runSeed, stage.day).choices.find((candidate) => candidate.id === choiceId)
      : null
    const state =
      choice?.oathOnly === game.oath
        ? 'sealed'
        : choiceId
          ? 'declined'
          : stage.day === game.day
            ? 'current'
            : stage.day < game.day
              ? 'declined'
              : 'ahead'
    return { stage, choice, state }
  })
  const oathInterventionCount = oathInterventionCountFor(game.oath, game.decisions)
  const activeDecisionEcho = activeDecisionEchoFor(game.decisions, game.day, game.runSeed)
  const endingFinalVow = finalVowFor(game.decisions)
  const activeFinalVow = game.day === MAX_NIGHTS ? endingFinalVow : null
  const activeFinalMarchImprints = finalMarchImprintsFor(game.decisions, game.day)
  const finalMarchEventPath = FINAL_MARCH_GATES.map((gate, index) => {
    const sourceIndex = index + 8
    const choiceId = game.decisions[sourceIndex]
    const choice = choiceId
      ? campaignEventFor(game.runSeed, sourceIndex + 1).choices.find((candidate) => candidate.id === choiceId)
      : null
    const imprint = choice?.marchImprint ? FINAL_MARCH_IMPRINTS[choice.marchImprint] : null
    const state = imprint ? 'sealed' : gate.night === game.day ? 'current' : gate.night < game.day ? 'missed' : 'ahead'
    return {
      night: gate.night,
      gateGlyph: gate.glyph,
      gateLabel: gate.label,
      crownPreparation: gate.crownPreparation,
      choiceTitle: choice?.title ?? null,
      imprint: imprint
        ? {
            glyph: imprint.glyph,
            name: imprint.name,
            effect: imprint.effect,
          }
        : null,
      state,
    }
  })
  const currentAct = actForDay(game.day)
  const currentActTransition = ACT_TRANSITIONS[game.day]
  const currentCondition = nightConditionFor(game.runSeed, game.day)
  const currentBossMechanic = BOSS_MECHANICS[game.day]
  const nextCrownNight = ([4, 8, 12] as const).find((night) => night >= game.day) ?? 12
  const nextCrownMechanic = BOSS_MECHANICS[nextCrownNight]
  const currentEliteEncounter = ELITE_ENCOUNTERS[game.day]
  const currentEliteDoctrine = currentEliteEncounter ? ENEMY_DOCTRINES[currentEliteEncounter.doctrine] : null
  const battleOpeningNarration = `${
    game.day === MAX_NIGHTS
      ? '백색 왕이 세 전선에 마지막 칙령을 내립니다. 명령, 화로 집중, 병과 우위가 차례로 왕관을 가릅니다.'
      : currentBossMechanic
        ? `${currentBossMechanic.name}이 전장을 봉쇄합니다. ${currentBossMechanic.pressureCopy}`
        : currentEliteEncounter && currentEliteDoctrine
          ? `${currentEliteEncounter.name}이 ${currentEliteDoctrine.name} 교리를 펼칩니다. ${currentEliteDoctrine.counterplay}`
          : '빙결 군단이 세 갈래 참호로 밀려옵니다. 화로의 명령이 전선에 도착합니다.'
  }${activeDecisionEcho ? ` ${activeDecisionEcho.name}이 돌아옵니다. ${activeDecisionEcho.effect}.` : ''}${activeFinalMarchImprints.length > 0 ? ` 마지막 행군 각인 ${activeFinalMarchImprints.length}개가 왕좌까지 이어집니다.` : ''}${activeFinalVow ? ` 마지막 맹세, ${activeFinalVow.name}이 전선에 새겨집니다. ${activeFinalVow.effect}.` : ''}`
  const currentEndingId = endingFor(game, game.status === 'won')
  const currentEnding = ENDINGS[currentEndingId]
  const completedCurrentEndingId = game.status === 'playing' ? null : currentEndingId
  const unlockedAchievementIds = new Set(achievementAnalysisActive ? meta.achievements : [])
  if (achievementAnalysisActive) {
    for (const record of meta.history) unlockedAchievementIds.add(ENDING_ACHIEVEMENTS[record.ending])
    if (completedCurrentEndingId) unlockedAchievementIds.add(ENDING_ACHIEVEMENTS[completedCurrentEndingId])
  }
  const endingDiscoveryEntries: EndingDiscoveryEntry[] = retrospectiveAnalysisActive
    ? ENDING_IDS.map((endingId) => {
        const recordCount = meta.history.filter((record) => record.ending === endingId).length
        const current = completedCurrentEndingId === endingId
        return {
          id: endingId,
          current,
          recordCount,
          discovered: unlockedAchievementIds.has(ENDING_ACHIEVEMENTS[endingId]),
        }
      })
    : []
  const endingDiscoveredCount = endingDiscoveryEntries.filter((entry) => entry.discovered).length
  const nextWinningEndingId = retrospectiveAnalysisActive
    ? (WINNING_ENDING_IDS.find(
        (endingId) => !endingDiscoveryEntries.find((entry) => entry.id === endingId)?.discovered,
      ) ?? null)
    : null
  const nextWinningEndingRoute = nextWinningEndingId ? ENDING_ROUTES[nextWinningEndingId] : null
  const showEndingRouteRecommendation =
    retrospectiveAnalysisActive && (meta.history.length > 0 || completedCurrentEndingId !== null)
  const difficultyProtocol = DIFFICULTIES[game.difficulty]
  const protocolMasteryProgress = protocolMasteryProgressFor(game, game.status === 'won')
  const protocolMasteryUnlocked = meta.achievements.includes(protocolMasteryProgress.achievement)
  const protocolMasteryRecognized = protocolMasteryUnlocked || protocolMasteryProgress.completed
  const masteredProtocolCount =
    (retrospectiveAnalysisActive
      ? (Object.keys(PROTOCOL_MASTERIES) as Difficulty[]).filter((difficulty) =>
          unlockedAchievementIds.has(PROTOCOL_MASTERIES[difficulty].achievement),
        ).length
      : 0) + (endingScreenActive && protocolMasteryProgress.completed && !protocolMasteryUnlocked ? 1 : 0)
  const priorDefeatCount = Math.max(0, game.battles - game.victories)
  const recoveryRecruitDiscount = Math.min(6, priorDefeatCount * 2)
  const nextRecoveryRecruitDiscount = Math.min(6, (priorDefeatCount + 1) * 2)
  const liveRankEntry = rankEntryForScore(game.score)
  const nextRankEntry = [...EXPEDITION_RANKS].reverse().find((entry) => entry.minimum > game.score) ?? null
  const liveRankProgress = nextRankEntry
    ? Math.max(
        0,
        Math.min(100, ((game.score - liveRankEntry.minimum) / (nextRankEntry.minimum - liveRankEntry.minimum)) * 100),
      )
    : 100
  const sharedSeed = seedForRunCode(sharedCode)
  const activeTrials = trialsFor(game.runSeed)
  const trialStatuses = activeTrials.map((trialId) => ({
    id: trialId,
    ...trialProgressFor(trialId, game, game.status === 'won'),
  }))
  const selectedUnit = findUnit(game, selectedUnitId)
  const selectedUnitLane = selectedUnit ? game.lineup.indexOf(selectedUnit.id) : -1
  const pendingPromotionUnit = pendingPromotionFor(game)
  const promotionChoices = pendingPromotionUnit ? SPECIALIZATIONS_BY_KIND[pendingPromotionUnit.kind] : []
  const activeResonances = activeResonancesFor(game.relics)
  const unownedLegacyIds = legacyRecommendationActive
    ? LEGACY_IDS.filter((legacyId) => !meta.legacy.includes(legacyId))
    : []
  const affordableLegacyIds = legacyRecommendationActive
    ? unownedLegacyIds.filter((legacyId) => LEGACY_UPGRADES[legacyId].cost <= meta.embers)
    : []
  const resonanceStatuses = RESONANCE_IDS.map((resonanceId) => ({
    id: resonanceId,
    owned: RESONANCES[resonanceId].requirements.filter((relicId) => game.relics.includes(relicId)).length,
    active: activeResonances.includes(resonanceId),
  }))
  const recruitNightPressure = Math.floor((game.day - 1) / 2)
  const recruitScalePressure = Math.floor(game.recruits / 2) * 2
  const recruitDiscount =
    (game.relics.includes('quartermasters-knot') ? 4 : 0) +
    (activeResonances.includes('long-road-ledger') ? 2 : 0) +
    (game.oath === 'salvagers' ? 4 : 0)
  const recruitCostForCount = (recruitCount: number) =>
    Math.max(
      10,
      18 +
        recruitNightPressure +
        Math.floor(recruitCount / 2) * 2 -
        recruitDiscount +
        difficultyProtocol.recruitCostDelta -
        recoveryRecruitDiscount,
    )
  const recruitCost = recruitCostForCount(game.recruits)
  const recruitCostAfterNext = recruitCostForCount(game.recruits + 1)
  const stokeBaseCost = difficultyProtocol.stokeCost
  const stokeHeat = difficultyProtocol.stokeHeat
  const stokeHeatGain = Math.min(stokeHeat, Math.max(0, 100 - game.heat))
  const stokeCost = stokeHeatGain > 0 ? Math.max(1, Math.ceil((stokeBaseCost * stokeHeatGain) / stokeHeat)) : 0
  const rosterCount = game.slots.filter(Boolean).length
  const campMergeWarmth =
    (game.relics.includes('living-ember') ? 7 : 3) +
    (game.oath === 'hearthkeepers' ? 3 : 0) +
    DIFFICULTIES[game.difficulty].mergeHeatBonus
  const campMergeHeatGain = Math.min(100, game.heat + campMergeWarmth) - game.heat
  const rosterMergeCounts = new Map<string, number>()
  for (const unit of game.slots) {
    if (!unit) continue
    const key = `${unit.kind}:${unit.tier}`
    rosterMergeCounts.set(key, (rosterMergeCounts.get(key) ?? 0) + 1)
  }
  let mergeReadyPairCount = 0
  if (rosterCount > 3) {
    for (const [key, count] of rosterMergeCounts) {
      const tier = Number(key.split(':')[1])
      if (tier < MAX_TIER) mergeReadyPairCount += Math.floor(count / 2)
    }
    mergeReadyPairCount = Math.min(mergeReadyPairCount, rosterCount - 3)
  }
  const mergeReadinessByUnit = new Map<string, RosterMergeReadiness>()
  if (rosterCount > 3) {
    for (const unit of game.slots) {
      if (!unit || unit.tier >= MAX_TIER) continue
      const partnerCount = (rosterMergeCounts.get(`${unit.kind}:${unit.tier}`) ?? 0) - 1
      if (partnerCount < 1) continue
      const toTier = unit.tier + 1
      mergeReadinessByUnit.set(unit.id, {
        partnerCount,
        fromTier: unit.tier,
        toTier,
        powerBefore: PLAYER_POWER[unit.tier],
        powerAfter: PLAYER_POWER[toTier],
        heatGain: campMergeHeatGain,
        opensPromotion: toTier === 3,
        specializationMayReset:
          unit.tier === 3 &&
          game.slots.some(
            (candidate) =>
              candidate !== null &&
              candidate.id !== unit.id &&
              candidate.kind === unit.kind &&
              candidate.tier === unit.tier &&
              candidate.specialization !== unit.specialization,
          ),
        chainReady: rosterCount > 4 && toTier < MAX_TIER && (rosterMergeCounts.get(`${unit.kind}:${toTier}`) ?? 0) > 0,
      })
    }
  }
  const veteranCount = game.slots.filter((unit) => unit && unit.tier >= 3).length
  const eventDaysToCrown = Math.max(0, nextCrownNight - game.day)
  const eventCrownHeatFloor = eventDaysToCrown === 0 ? 50 : eventDaysToCrown === 1 ? 42 : 30
  const eventCrownTiming =
    eventDaysToCrown === 0
      ? '오늘 왕관전'
      : eventDaysToCrown === 1
        ? '왕관전까지 1일'
        : `왕관전까지 ${eventDaysToCrown}일`
  const hasUpgradeableSurvivor = game.slots.some((unit) => unit !== null && unit.tier < MAX_TIER)
  const forecastableEventChoices = eventForecastActive ? currentEventChoices : []
  const eventChoiceForecasts = forecastableEventChoices.map((choice): EventChoiceForecast => {
    const recruitConverts = Boolean(choice.recruit && rosterCount >= ROSTER_SIZE)
    const upgradeConverts = Boolean(choice.upgrade && !hasUpgradeableSurvivor)
    const conversionMorale = (recruitConverts ? 5 : 0) + (upgradeConverts ? 5 : 0)
    const scoreReward = eventScoreRewardFor(choice, game.difficulty, game.oath, game.activeLegacy, game.masteryContract)
    const recruitsSurvivor = Boolean(choice.recruit && !recruitConverts)
    const projectedSupplies = Math.max(0, game.supplies + (choice.supplies ?? 0))
    const projectedHeat = Math.max(1, Math.min(100, game.heat + (choice.heat ?? 0)))
    const projectedMorale = Math.max(0, Math.min(100, game.morale + (choice.morale ?? 0) + conversionMorale))
    const projectedRecoverySupplies = recoverySuppliesAfterSpend(
      game.recoverySupplies,
      Math.max(0, -(choice.supplies ?? 0)),
    )
    const recoverySuppliesSpent = game.recoverySupplies - projectedRecoverySupplies
    const projectedRosterCount = Math.min(ROSTER_SIZE, rosterCount + (recruitsSurvivor ? 1 : 0))
    const projectedRecruitCount = game.recruits + (recruitsSurvivor ? 1 : 0)
    const projectedRecruitCost = recruitCostForCount(projectedRecruitCount)
    const needsHeatReserve = projectedHeat < eventCrownHeatFloor
    const needsGrowthReserve = projectedRosterCount <= 3
    const reserveTarget = (needsHeatReserve ? stokeBaseCost : 0) + (needsGrowthReserve ? projectedRecruitCost : 0)
    const reserveGap = Math.max(0, reserveTarget - projectedSupplies)
    const unavailable = Boolean(choice.requiresSupplies && game.supplies < choice.requiresSupplies)
    const routeTokens = [
      (choice.heat ?? 0) > 0 || (choice.morale ?? 0) > 0 ? '생존' : null,
      (choice.supplies ?? 0) > 0 ? '보급' : null,
      choice.recruit || choice.upgrade ? '성장' : null,
      (choice.score ?? 0) >= 200 ? '명성' : null,
      choice.echo ? '후속' : null,
      choice.marchImprint ? '행군 각인' : null,
      choice.finalVow ? '최후 맹세' : null,
      choice.oathOnly ? '서약 개입' : null,
    ].filter((token): token is string => token !== null)
    const route = routeTokens.slice(0, 3).join(' · ') || '결단'

    if (unavailable) {
      return {
        state: 'locked',
        route,
        label: '보급 부족',
        detail: `선택하려면 ◈ ${(choice.requiresSupplies ?? 0) - game.supplies}이 더 필요합니다.`,
        projectedSupplies,
        projectedRecoverySupplies,
        recoverySuppliesSpent,
        projectedHeat,
        projectedMorale,
        ...scoreReward,
        conversionMorale,
      }
    }

    const heatRecoveryBlocked = projectedHeat <= 24 && projectedSupplies < stokeBaseCost
    const moraleCritical = projectedMorale <= 12
    if (heatRecoveryBlocked || moraleCritical) {
      return {
        state: 'critical',
        route,
        label: '붕괴 위험',
        detail: heatRecoveryBlocked
          ? `온기 ${projectedHeat}% · 화로 1회 예비까지 ◈ ${stokeBaseCost - projectedSupplies} 부족합니다.`
          : `사기 ${projectedMorale} · 다음 패배가 원정대를 크게 흔들 수 있습니다.`,
        projectedSupplies,
        projectedRecoverySupplies,
        recoverySuppliesSpent,
        projectedHeat,
        projectedMorale,
        ...scoreReward,
        conversionMorale,
      }
    }

    if (reserveGap > 0 || projectedHeat < eventCrownHeatFloor || projectedMorale < 35) {
      const detail =
        reserveGap > 0
          ? `화로·신호탄 권장 예비 ◈ ${reserveTarget} 중 ◈ ${reserveGap}이 부족합니다.`
          : projectedHeat < eventCrownHeatFloor
            ? `온기는 경보선 아래지만 화로 1회 예비 ◈ ${stokeBaseCost}를 남깁니다.`
            : `사기 ${projectedMorale} · 안정선 35까지 회복 여지가 필요합니다.`
      return {
        state: 'strained',
        route,
        label: '압박 구간',
        detail,
        projectedSupplies,
        projectedRecoverySupplies,
        recoverySuppliesSpent,
        projectedHeat,
        projectedMorale,
        ...scoreReward,
        conversionMorale,
      }
    }

    const securesExtraReserve = projectedSupplies >= reserveTarget + stokeBaseCost
    const state: EventRouteState =
      projectedHeat >= eventCrownHeatFloor + 18 && projectedMorale >= 55 && securesExtraReserve ? 'secure' : 'ready'
    return {
      state,
      route,
      label: state === 'secure' ? '예비 확보' : '운용 가능',
      detail:
        state === 'secure'
          ? '왕관 경보선과 화로 1회 예비를 모두 여유 있게 넘깁니다.'
          : `온기 경보선 ${eventCrownHeatFloor}% 기준으로 다음 야영을 운용할 수 있습니다.`,
      projectedSupplies,
      projectedRecoverySupplies,
      recoverySuppliesSpent,
      projectedHeat,
      projectedMorale,
      ...scoreReward,
      conversionMorale,
    }
  })
  const eventChoiceEntries = forecastableEventChoices.map((choice, index) => ({
    choice,
    forecast: eventChoiceForecasts[index],
    unavailable: Boolean(choice.requiresSupplies && game.supplies < choice.requiresSupplies),
    autofocus: index === firstAvailableEventChoiceIndex,
  }))
  const endingWon = game.status === 'won'
  const mercyDecisionCount = endingScreenActive
    ? game.decisions.filter((decision) => MERCY_DECISIONS.has(decision)).length
    : 0
  const completedEndingTrials = endingScreenActive ? trialStatuses.filter((trial) => trial.completed) : []
  const unfinishedEndingTrial = endingScreenActive
    ? [...trialStatuses]
        .filter((trial) => !trial.completed)
        .sort((left, right) => right.current / right.target - left.current / left.target)[0]
    : undefined
  const endingComparisonKey = endingScreenActive
    ? expeditionComparisonKey({
        seed: game.runSeed,
        difficulty: game.difficulty,
        oath: game.oath,
        masteryContract: game.masteryContract,
        activeLegacy: game.activeLegacy,
      })
    : null
  const comparableEndingRecords = endingComparisonKey
    ? meta.history.filter((record) => expeditionComparisonKey(record) === endingComparisonKey)
    : []
  const endingComparisonCount = Math.max(1, comparableEndingRecords.length)
  const endingComparisonPosition =
    1 + comparableEndingRecords.filter((record) => record.runId !== game.runId && record.score > game.score).length
  const endingComparisonBestScore = comparableEndingRecords.reduce(
    (highestScore, record) => Math.max(highestScore, record.score),
    game.score,
  )
  const endingIsComparisonBest = game.score > 0 && game.score >= endingComparisonBestScore
  const endingPathSeal = endingScreenActive
    ? (() => {
        if (!endingWon) {
          return {
            id: 'path',
            glyph: currentEnding.glyph,
            label: '남겨진 경로',
            title: `ACT ${currentAct.number} · ${currentAct.title}`,
            description: `왕관 ${game.bossesDefeated}개를 파괴하고 ${game.day}일차까지 길을 남겼습니다.`,
          }
        }
        if (currentEndingId === 'hearth-dawn') {
          return {
            id: 'path',
            glyph: '✦',
            label: '결말의 기준',
            title: `나눈 불씨 ${mercyDecisionCount} / ${MAX_NIGHTS}`,
            description: '자비의 선택을 8회 이상 이어 모두의 새벽을 열었습니다.',
          }
        }
        if (currentEndingId === 'ember-crown') {
          return {
            id: 'path',
            glyph: '♜',
            label: '결말의 기준',
            title: `왕관 명성 ${game.score.toLocaleString('ko-KR')}`,
            description: `자비의 선택 ${mercyDecisionCount}회 · 명성 ${EMBER_CROWN_SCORE.toLocaleString('ko-KR')} 이상으로 새 왕관을 벼렸습니다.`,
          }
        }
        return {
          id: 'path',
          glyph: '◇',
          label: '결말의 기준',
          title: '왕좌를 비운 원정대',
          description: `자비의 선택 ${mercyDecisionCount}회 · 왕관 대신 각자의 화로를 남겼습니다.`,
        }
      })()
    : null
  const endingTacticalSeal = endingScreenActive
    ? [
        {
          id: 'intent',
          glyph: '⌁',
          label: '전술 서명',
          title: '눈보라 해독자',
          description: `승리한 밤에 적 의도 ${game.intentsCountered}회를 읽고 명령으로 끊었습니다.`,
          weight: game.intentsCountered / TRIALS['intent-reader'].target,
        },
        {
          id: 'perfect',
          glyph: '◆',
          label: '전술 서명',
          title: '흠 없는 방벽',
          description: `세 전선을 모두 지킨 밤을 ${game.perfectNights}회 만들었습니다.`,
          weight: game.perfectNights / TRIALS['unbroken-four'].target,
        },
        {
          id: 'formation',
          glyph: '≋',
          label: '전술 서명',
          title: '세 갈래 지휘',
          description: `세 병과 대열로 ${game.unitedVictories}번의 승리를 연결했습니다.`,
          weight: game.unitedVictories / TRIALS['united-front'].target,
        },
      ].sort((left, right) => right.weight - left.weight)[0]
    : null
  const endingBuildSeal = endingScreenActive
    ? activeResonances.length > 0
      ? {
          id: 'build',
          glyph: RESONANCES[activeResonances[0]].glyph,
          label: '빌드 서명',
          title:
            activeResonances.length > 1
              ? `${RESONANCES[activeResonances[0]].name} 외 ${activeResonances.length - 1}개`
              : RESONANCES[activeResonances[0]].name,
          description: `유물 ${game.relics.length}개로 공명 ${activeResonances.length}개를 완성했습니다.`,
        }
      : veteranCount > 0
        ? {
            id: 'build',
            glyph: '◈',
            label: '빌드 서명',
            title: `베테랑 대열 ${veteranCount}명`,
            description: '공명 대신 III 등급 이상의 생존자 성장에 전력을 집중했습니다.',
          }
        : {
            id: 'build',
            glyph: '▣',
            label: '빌드 서명',
            title: `각인 유물 ${game.relics.length}개`,
            description: '독립 유물 효과와 자원 운용으로 긴 밤을 버텼습니다.',
          }
    : null
  const endingCommanderTitle = endingScreenActive
    ? currentEndingId === 'hearth-dawn'
      ? '불씨를 나누는 수호자'
      : currentEndingId === 'ember-crown'
        ? '왕관을 벼린 정복자'
        : currentEndingId === 'crownless-dawn'
          ? '왕좌를 비운 개척자'
          : currentEndingId === 'broken-watch'
            ? '첫 길을 남긴 파수꾼'
            : currentEndingId === 'frozen-choir'
              ? '성가를 거스른 기록자'
              : '왕좌까지 걸은 선봉'
    : ''
  const endingDossierSeals =
    endingPathSeal && endingTacticalSeal && endingBuildSeal ? [endingPathSeal, endingTacticalSeal, endingBuildSeal] : []
  const nextChallengeDifficulty: Difficulty = endingWon
    ? game.difficulty === 'story'
      ? 'expedition'
      : 'whiteout'
    : game.difficulty
  const legacyRecommendationPool = affordableLegacyIds.length > 0 ? affordableLegacyIds : unownedLegacyIds
  const recommendedLegacyId = legacyRecommendationActive
    ? (LEGACY_RECOMMENDATION_ORDER[game.status === 'lost' ? 'story' : nextChallengeDifficulty].find((legacyId) =>
        legacyRecommendationPool.includes(legacyId),
      ) ?? null)
    : null
  const endingLegacyRewardBreakdown = endingScreenActive
    ? legacyRewardBreakdownFor(game, endingWon)
    : { renown: 0, crowns: 0, trials: 0, protocol: 0, dawn: 0, recovery: 0, total: 0 }
  const endingLegacyMastery = endingScreenActive ? legacyMasteryFor(meta) : null
  const nextUnmasteredContract = endingLegacyMastery
    ? (MASTERY_CONTRACT_IDS.find(
        (contractId) =>
          endingLegacyMastery.level >= MASTERY_CONTRACTS[contractId].requiredMasteryLevel &&
          !meta.masteredContracts.includes(contractId),
      ) ?? null)
    : null
  const nextLockedContract = endingLegacyMastery
    ? (MASTERY_CONTRACT_IDS.find(
        (contractId) => endingLegacyMastery.level < MASTERY_CONTRACTS[contractId].requiredMasteryLevel,
      ) ?? null)
    : null
  const endingMasteryDirective = (() => {
    if (!endingScreenActive) {
      return {
        state: 'dormant',
        glyph: '',
        kicker: '',
        title: '',
        description: '',
        progress: 0,
        progressLabel: '',
        target: '',
      }
    }
    if (!endingWon) {
      const clearedNights = Math.max(0, game.day - 1)
      const primaryFailure = game.failureInsights[0]
      return {
        state: 'rematch',
        glyph: primaryFailure?.glyph ?? '↺',
        kicker: 'VERIFIED REMATCH DIRECTIVE',
        title: `DAY ${String(game.day).padStart(2, '0')} 패인을 고쳐 동일 균열 재도전`,
        description: `${primaryFailure ? `${primaryFailure.label}: ${primaryFailure.action} ` : ''}${DIFFICULTIES[game.difficulty].name} · ${OATHS[game.oath].name}과 원정 코드 ${runCodeFor(game.runSeed)}를 유지한 채 처음부터 다시 출정합니다.`,
        progress: Math.round((clearedNights / MAX_NIGHTS) * 100),
        progressLabel: `${clearedNights} / ${MAX_NIGHTS} 밤 돌파`,
        target: `DAY ${String(game.day).padStart(2, '0')} 처방`,
      }
    }
    if (nextWinningEndingId && nextWinningEndingRoute) {
      const routeChecks =
        nextWinningEndingId === 'hearth-dawn'
          ? [endingWon, mercyDecisionCount >= 8]
          : nextWinningEndingId === 'ember-crown'
            ? [endingWon, mercyDecisionCount <= 7, game.score >= EMBER_CROWN_SCORE]
            : [endingWon, mercyDecisionCount <= 7, game.score < EMBER_CROWN_SCORE]
      const completedRouteChecks = routeChecks.filter(Boolean).length
      const recommendedOath = nextWinningEndingRoute.recommendedOath
        ? OATHS[nextWinningEndingRoute.recommendedOath].name
        : null
      return {
        state: 'ending',
        glyph: ENDINGS[nextWinningEndingId].glyph,
        kicker: 'UNDISCOVERED DAWN ROUTE',
        title: `다음 결말 · ${ENDINGS[nextWinningEndingId].title}`,
        description: `${nextWinningEndingRoute.requirement}. ${nextWinningEndingRoute.strategy}${recommendedOath ? ` 추천 서약은 ${recommendedOath}입니다.` : ''}`,
        progress: Math.round((completedRouteChecks / routeChecks.length) * 100),
        progressLabel: `이번 기록 기준 ${completedRouteChecks} / ${routeChecks.length} 조건`,
        target: '미발견 새벽',
      }
    }
    if (nextRankEntry) {
      const scoreGap = nextRankEntry.minimum - game.score
      return {
        state: 'rank',
        glyph: nextRankEntry.rank,
        kicker: 'NEXT RENOWN MASTERY',
        title: `${nextRankEntry.rank} 등급까지 명성 ${scoreGap.toLocaleString('ko-KR')}`,
        description: `${nextRankEntry.title}에 가장 가까운 길은 같은 균열에서 완벽 방어와 교리 파훼를 늘려 손실 없는 밤을 만드는 것입니다.`,
        progress: liveRankProgress,
        progressLabel: `${liveRankEntry.rank} → ${nextRankEntry.rank} 등급`,
        target: `+${scoreGap.toLocaleString('ko-KR')}`,
      }
    }
    if (game.difficulty !== 'whiteout') {
      return {
        state: 'protocol',
        glyph: DIFFICULTIES[nextChallengeDifficulty].glyph,
        kicker: 'NEXT EXPEDITION PROTOCOL',
        title: `${DIFFICULTIES[nextChallengeDifficulty].name} 위험도 개방`,
        description: `${DIFFICULTIES[nextChallengeDifficulty].ruleName} 규칙으로 같은 빌드의 한계를 다시 시험할 차례입니다. 다음 도전 설계에서 서약과 경로를 조정할 수 있습니다.`,
        progress: 100,
        progressLabel: `${DIFFICULTIES[game.difficulty].name} 정복 완료`,
        target: DIFFICULTIES[nextChallengeDifficulty].name,
      }
    }
    if (unfinishedEndingTrial) {
      const trial = TRIALS[unfinishedEndingTrial.id]
      return {
        state: 'trial',
        glyph: trial.glyph,
        kicker: 'PERSONAL TRIAL MASTERY',
        title: `${trial.name} 과업 완수`,
        description: `${trial.description}. 같은 균열을 재도전하면 적 구성과 유물 경로가 같아 개선 지점을 정확히 비교할 수 있습니다.`,
        progress: Math.round((unfinishedEndingTrial.current / unfinishedEndingTrial.target) * 100),
        progressLabel: `${unfinishedEndingTrial.current.toLocaleString('ko-KR')} / ${unfinishedEndingTrial.target.toLocaleString('ko-KR')}`,
        target: `+${trial.reward} 불씨`,
      }
    }
    if (nextUnmasteredContract) {
      const contract = MASTERY_CONTRACTS[nextUnmasteredContract]
      return {
        state: 'contract',
        glyph: contract.glyph,
        kicker: 'ETERNAL COVENANT MASTERY',
        title: `${contract.name} 계약 정복`,
        description: `${contract.burden}을 원정 끝까지 지키고 새벽에 도달하세요. ${contract.reward}은 기본·유산 명성과 분리해 결산됩니다. 표준 원정 설정에서 선택할 수 있습니다.`,
        progress: Math.round((meta.masteredContracts.length / MASTERY_CONTRACT_IDS.length) * 100),
        progressLabel: `영원 계약 정복 ${meta.masteredContracts.length} / ${MASTERY_CONTRACT_IDS.length}`,
        target: contract.reward,
      }
    }
    if (nextLockedContract && endingLegacyMastery) {
      const contract = MASTERY_CONTRACTS[nextLockedContract]
      return {
        state: 'contract',
        glyph: contract.glyph,
        kicker: 'NEXT ETERNAL SEAL',
        title: `영원 인장 ${contract.requiredMasteryLevel} · ${contract.name} 개방`,
        description: `완성한 유산 뒤에 불씨 ${endingLegacyMastery.remaining}을 더 모으면 ${contract.burden}과 ${contract.reward}을 맞바꾸는 다음 계약이 열립니다.`,
        progress: endingLegacyMastery.progress,
        progressLabel: `불씨 ${endingLegacyMastery.current} / ${endingLegacyMastery.target}`,
        target: `+${endingLegacyMastery.remaining} 불씨`,
      }
    }
    return {
      state: 'legend',
      glyph: '☼',
      kicker: 'LEGENDARY EXPEDITION COMPLETE',
      title: '이 원정의 모든 숙련 목표 달성',
      description:
        meta.masteredContracts.length === MASTERY_CONTRACT_IDS.length
          ? '세 영원 계약까지 모두 정복했습니다. 다른 서약과 계약 조합으로 완전히 새로운 최고 기록을 남겨 보세요.'
          : '다른 서약과 오늘의 균열에서 완전히 새로운 지휘 기록을 남기고 같은 새벽에 도달해 보세요.',
      progress: 100,
      progressLabel: 'S 등급 · 백색 종말 · 개인 과업 완수',
      target: '새 전설',
    }
  })()
  const nextRecruitKind = UNIT_ROTATION[game.recruits % UNIT_ROTATION.length]
  const nextRecruitTierOneCount = game.slots.filter((unit) => unit?.kind === nextRecruitKind && unit.tier === 1).length
  const lineupUnits = game.lineup.map((id) => findUnit(game, id))
  const lineupReady = laneForecastActive && lineupUnits.every((unit) => unit !== null)
  const formationKindCount = new Set(lineupUnits.flatMap((unit) => (unit ? [unit.kind] : []))).size
  const tierTwoLineCount = lineupUnits.filter((unit) => unit && unit.tier >= 2).length
  const tierThreeLineCount = lineupUnits.filter((unit) => unit && unit.tier >= 3).length
  const tierFourLineCount = lineupUnits.filter((unit) => unit?.tier === MAX_TIER).length
  const lineupTierTotal = lineupUnits.reduce((total, unit) => total + (unit?.tier ?? 0), 0)
  const baseCommandLimit = commandLimitFor(game.morale, game.activeLegacy, game.oath, currentCondition, game.difficulty)
  const doctrineCommandFloor = currentEliteDoctrine?.commandFloor ?? 1
  const commandLimitBeforeContract = Math.max(baseCommandLimit, doctrineCommandFloor)
  const masteryContractCommandDelta = game.masteryContract ? MASTERY_CONTRACTS[game.masteryContract].commandDelta : 0
  const commandLimit = Math.max(1, commandLimitBeforeContract + masteryContractCommandDelta)
  const doctrineCommandRelief = commandLimitBeforeContract - baseCommandLimit
  const commandSealActive = game.activeLegacy.includes('command-seal')
  const commandLimitWithoutLegacy = Math.max(
    commandLimitFor(
      game.morale,
      game.activeLegacy.filter((legacyId) => legacyId !== 'command-seal'),
      game.oath,
      currentCondition,
      game.difficulty,
    ),
    doctrineCommandFloor,
  )
  const commandLimitWithoutLegacyAndWithContract = Math.max(1, commandLimitWithoutLegacy + masteryContractCommandDelta)
  const legacyCommandContribution = commandSealActive
    ? {
        limit: commandLimit,
        limitBeforeLegacy: commandLimitWithoutLegacyAndWithContract,
        appliedBonus: commandLimit - commandLimitWithoutLegacyAndWithContract,
      }
    : null
  const commandSpent = game.orders.reduce((total, order) => total + ORDER_META[order].cost, 0)
  const battleContext: BattleContext = {
    relics: game.relics,
    heat: game.heat,
    morale: game.morale,
    focusLane,
    day: game.day,
    difficulty: game.difficulty,
    oath: game.oath,
    runSeed: game.runSeed,
    orders: game.orders,
    legacy: game.activeLegacy,
    formationKinds: lineupUnits.flatMap((unit) => (unit ? [unit.kind] : [])),
    formationTiers: lineupUnits.flatMap((unit) => (unit ? [unit.tier] : [])),
    enemyIntents: enemies.map((enemy) => enemy.intent),
    decisionEcho: activeDecisionEcho,
    finalMarchImprints: activeFinalMarchImprints,
    finalVow: activeFinalVow,
  }
  const campBattlePreview = battlePreviewActive && lineupReady ? battleResultFor(focusLane) : null
  const forecastLineupUnits = laneForecastActive ? lineupUnits : []
  const forecastLanes = campBattlePreview
    ? campBattlePreview.lanes
    : forecastLineupUnits.map((unit, lane) => (unit ? resolveLane(unit, enemies[lane], lane, battleContext) : null))
  const forecastEnemies = campForecastActive ? enemies : []
  const enemyFormationEntries = forecastEnemies.map((enemy, lane) => {
    const intentCountered = ORDER_META[game.orders[lane]].counters === enemy.intent
    const laneForecast = forecastLanes[lane]
    const doctrineBroken =
      laneForecast?.doctrineBroken ??
      enemyDoctrineEffectFor(enemy, lane, battleContext, intentCountered, lineupUnits[lane]).broken
    return {
      enemy,
      lane,
      doctrineBroken,
      estimatedThreat:
        laneForecast?.enemyPower ?? enemyPowerFor(enemy, lane, battleContext, intentCountered, lineupUnits[lane]),
    }
  })
  const currentForecastWins = forecastLanes.filter((lane) => lane?.won).length
  const selectedUnitForForecast = campForecastActive ? selectedUnit : null
  const scoredDeploymentForecasts: Array<{ forecast: DeploymentForecast; score: number }> = selectedUnitForForecast
    ? BATTLE_LANES.map((lane) => {
        const sourceLane = selectedUnitLane >= 0 ? selectedUnitLane : null
        const targetUnitId = game.lineup[lane]
        const nextLineup = lineupAfterDeployment(game.lineup, selectedUnitForForecast.id, lane)
        const nextLineupUnits = nextLineup.map((unitId) => findUnit(game, unitId))
        const lineupReadyAfter = nextLineupUnits.every((unit) => unit !== null)
        const previewContext: BattleContext = {
          ...battleContext,
          formationKinds: nextLineupUnits.flatMap((unit) => (unit ? [unit.kind] : [])),
          formationTiers: nextLineupUnits.flatMap((unit) => (unit ? [unit.tier] : [])),
        }
        const projectedBattle = lineupReadyAfter ? battleResultFor(focusLane, { ...game, lineup: nextLineup }) : null
        const previewLanes = projectedBattle
          ? projectedBattle.lanes
          : nextLineupUnits.map((unit, previewLane) =>
              unit ? resolveLane(unit, enemies[previewLane], previewLane, previewContext) : null,
            )
        const laneForecast =
          previewLanes[lane] ?? resolveLane(selectedUnitForForecast, enemies[lane], lane, previewContext)
        const winsAfter = previewLanes.filter((preview) => preview?.won).length
        const currentLaneForecast = forecastLanes[lane]
        const currentWon = currentLaneForecast?.won ?? null
        const victoryBefore = campBattlePreview?.victory ?? false
        const victoryAfter = projectedBattle?.victory ?? false
        const securesLane = currentWon !== true && laneForecast.won
        const losesLane = currentWon === true && !laneForecast.won
        const securesVictory = !victoryBefore && victoryAfter
        const losesVictory = victoryBefore && !victoryAfter
        const powerDelta = currentLaneForecast ? laneForecast.playerPower - currentLaneForecast.playerPower : null
        const action: DeploymentForecast['action'] =
          sourceLane === lane
            ? 'current'
            : sourceLane !== null
              ? targetUnitId
                ? 'swap'
                : 'move'
              : targetUnitId
                ? 'replace'
                : 'deploy'
        const outcome: DeploymentForecast['outcome'] =
          action === 'current'
            ? 'current'
            : losesVictory
              ? 'risk'
              : securesVictory
                ? 'breakthrough'
                : !lineupReady && lineupReadyAfter
                  ? 'improve'
                  : losesLane || winsAfter < currentForecastWins
                    ? 'risk'
                    : securesLane
                      ? 'breakthrough'
                      : winsAfter > currentForecastWins || (powerDelta !== null && powerDelta > 0)
                        ? 'improve'
                        : 'steady'
        const forecast: DeploymentForecast = {
          lane,
          action,
          outcome,
          relation: laneForecast.relation,
          playerPower: laneForecast.playerPower,
          enemyPower: laneForecast.enemyPower,
          won: laneForecast.won,
          currentWon,
          powerDelta,
          winsBefore: currentForecastWins,
          winsAfter,
          lineupReadyBefore: lineupReady,
          lineupReadyAfter,
          victoryBefore,
          victoryAfter,
          securesLane,
          losesLane,
          securesVictory,
          losesVictory,
          sourceLane,
          targetUnitId,
        }
        const formationMargin = previewLanes.reduce(
          (total, preview) =>
            total + (preview ? Math.max(-500, Math.min(500, preview.playerPower - preview.enemyPower)) : -750),
          0,
        )
        const score =
          (victoryAfter ? 1_000_000 : 0) +
          (lineupReadyAfter ? 100_000 : 0) +
          (projectedBattle?.crownBreakCount ?? 0) * 20_000 +
          winsAfter * 10_000 +
          formationMargin

        return { forecast, score }
      })
    : []
  const deploymentForecasts = scoredDeploymentForecasts.map(({ forecast }) => forecast)
  const highestDeploymentScore = Math.max(...scoredDeploymentForecasts.map(({ score }) => score))
  const highestDeploymentCandidates = scoredDeploymentForecasts.filter(({ score }) => score === highestDeploymentScore)
  const recommendedDeploymentLane =
    highestDeploymentCandidates.length === 1 ? highestDeploymentCandidates[0].forecast.lane : null
  const promotionUnitForForecast = promotionForecastActive ? pendingPromotionUnit : null
  const promotionChoiceInsights = promotionUnitForForecast
    ? promotionChoices.map((specializationId) => {
        const lane = game.lineup.indexOf(promotionUnitForForecast.id)
        const specializedUnit: Unit = { ...promotionUnitForForecast, specialization: specializationId }
        const currentLane = lane >= 0 ? forecastLanes[lane] : null
        const specializedSlots = game.slots.map((unit) =>
          unit?.id === promotionUnitForForecast.id ? specializedUnit : unit,
        )
        const specializedBattlePreview = lineupReady
          ? battleResultFor(focusLane, { ...game, slots: specializedSlots })
          : null
        const specializedLane =
          lane >= 0
            ? (specializedBattlePreview?.lanes[lane] ??
              resolveLane(specializedUnit, enemies[lane], lane, battleContext))
            : null
        const active = specializedLane?.specializationActive ?? false
        const fit = promotionPathFitCopy(
          specializationId,
          lane,
          focusLane,
          lane >= 0 ? game.orders[lane] : null,
          currentLane,
          game.heat,
          active,
        )
        const playerPowerBefore = currentLane?.playerPower ?? null
        const playerPowerAfter = specializedLane?.playerPower ?? null
        const projectedWinsBefore = campBattlePreview?.wins ?? null
        const projectedWinsAfter = specializedBattlePreview?.wins ?? null
        const securesVictory = Boolean(
          specializedBattlePreview?.victory && campBattlePreview && !campBattlePreview.victory,
        )
        const score =
          (specializedBattlePreview?.victory ? 10_000 : 0) +
          (projectedWinsAfter ?? 0) * 1_000 +
          (active ? 500 : 0) +
          Math.max(0, (playerPowerAfter ?? 0) - (playerPowerBefore ?? 0))

        return {
          specializationId,
          deployed: lane >= 0,
          active,
          status: fit.status,
          detail: fit.detail,
          playerPowerBefore,
          playerPowerAfter,
          projectedWinsBefore,
          projectedWinsAfter,
          securesVictory,
          score,
        }
      })
    : []
  const rankedPromotionChoiceInsights = [...promotionChoiceInsights].sort((left, right) => right.score - left.score)
  const recommendedSpecializationId =
    promotionUnitForForecast &&
    rankedPromotionChoiceInsights[0]?.deployed &&
    rankedPromotionChoiceInsights[0].score > (rankedPromotionChoiceInsights[1]?.score ?? Number.NEGATIVE_INFINITY)
      ? rankedPromotionChoiceInsights[0].specializationId
      : null
  const legacyRewardForecast = {
    available: lineupReady && commandSpent <= commandLimit,
    supply: game.activeLegacy.includes('salvagers-instinct')
      ? {
          triggered: campBattlePreview?.victory ?? false,
          bonus: campBattlePreview?.legacySupplyBonus ?? 0,
          total: campBattlePreview?.supplyReward ?? 0,
        }
      : null,
    renown: game.activeLegacy.includes('chroniclers-ink')
      ? {
          triggered: campBattlePreview?.victory ?? false,
          bonus: campBattlePreview?.legacyScoreBonus ?? 0,
          total: campBattlePreview ? campBattlePreview.scoreReward - campBattlePreview.contractScoreBonus : 0,
        }
      : null,
  }
  const masteryContractForecast = game.masteryContract
    ? {
        id: game.masteryContract,
        available: lineupReady && commandSpent <= commandLimit,
        triggered: Boolean(campBattlePreview?.victory && lineupReady && commandSpent <= commandLimit),
        bonus: campBattlePreview?.contractScoreBonus ?? 0,
        total: campBattlePreview?.scoreReward ?? 0,
      }
    : null
  const projectedWins = forecastLanes.filter((lane) => lane?.won).length
  const decisionEchoForecastCount = forecastLanes.filter((lane) => lane?.decisionEchoActive).length
  const finalMarchImprintForecasts = activeFinalMarchImprints.map((imprint) => ({
    imprint,
    activeLanes: forecastLanes.filter((lane) => lane?.finalMarchImprintIds.includes(imprint.id)).length,
  }))
  const finalMarchImprintForecastCount = forecastLanes.filter(
    (lane) => lane && lane.finalMarchImprintIds.length > 0,
  ).length
  const finalVowForecastCount = forecastLanes.filter((lane) => lane?.finalVowActive).length
  const finalCrownForecast =
    game.day === MAX_NIGHTS
      ? FINAL_CROWN_SEALS.map((seal) => {
          const forecast = forecastLanes[seal.lane]
          return {
            ...seal,
            broken: Boolean(
              forecast && finalCrownSealBroken(seal.lane, focusLane, forecast.countered, forecast.relation),
            ),
          }
        })
      : []
  const finalCrownForecastCount = finalCrownForecast.filter((seal) => seal.broken).length
  const projectedBattleVictory =
    lineupReady &&
    commandSpent <= commandLimit &&
    projectedWins >= REQUIRED_LANE_WINS &&
    (game.day !== MAX_NIGHTS || finalCrownForecastCount >= FINAL_CROWN_REQUIRED_SEALS)
  const riskDepartureAvailable = Boolean(
    phase === 'camp' &&
      tutorialStep === null &&
      !pendingPromotionUnit &&
      lineupReady &&
      commandSpent <= commandLimit &&
      campBattlePreview &&
      !campBattlePreview.victory,
  )
  const riskDepartureArmed = Boolean(
    riskDepartureAvailable &&
      riskDepartureConfirmation?.game === game &&
      riskDepartureConfirmation.focusLane === focusLane,
  )
  const riskDepartureForecast =
    riskDepartureAvailable && campBattlePreview
      ? {
          armed: riskDepartureArmed,
          reason:
            game.day === MAX_NIGHTS &&
            campBattlePreview.wins >= REQUIRED_LANE_WINS &&
            campBattlePreview.crownBreakCount < FINAL_CROWN_REQUIRED_SEALS
              ? `왕관 칙령 ${campBattlePreview.crownBreakCount} / ${FINAL_CROWN_REQUIRED_SEALS} · 최종 승리 조건 미달`
              : `방어 ${campBattlePreview.wins} / 3 · ${3 - campBattlePreview.wins}개 전선 붕괴 예상`,
          supplyReward: campBattlePreview.supplyReward,
          suppliesBefore: game.supplies,
          suppliesAfter: game.supplies + campBattlePreview.supplyReward,
          heatBefore: game.heat,
          heatAfter: Math.max(0, Math.min(100, game.heat + campBattlePreview.heatDelta)),
          moraleBefore: game.morale,
          moraleAfter: Math.max(0, Math.min(100, game.morale + campBattlePreview.moraleDelta)),
          endsExpedition: game.heat + campBattlePreview.heatDelta <= 0,
        }
      : null
  const battleStartDisabled =
    !lineupReady ||
    commandSpent > commandLimit ||
    phase !== 'camp' ||
    (tutorialStep !== null && tutorialStep !== 'battle') ||
    (tutorialStep === 'battle' && !projectedBattleVictory)
  const mobileBattleActionLabel = pendingPromotionUnit
    ? '진급 선택'
    : !lineupReady
      ? '전선 배치'
      : commandSpent > commandLimit
        ? '명령 수정'
        : tutorialStep !== null && tutorialStep !== 'battle'
          ? '훈련 진행'
          : projectedBattleVictory
            ? '방어 시작'
            : riskDepartureArmed
              ? riskDepartureForecast?.endsExpedition
                ? '원정 종료 확정'
                : '출전 확정'
              : riskDepartureForecast?.endsExpedition
                ? '원정 종료 위험'
                : '위험 출전'
  const battleActionReady = !battleStartDisabled && !pendingPromotionUnit && projectedBattleVictory
  const directTacticalAdjustment = useMemo(() => {
    if (phase !== 'camp' || showTitle || tutorialStep !== null || !lineupReady || !campBattlePreview) return null

    const currentRank = tacticalPlanRank(campBattlePreview, game.day, commandSpent <= commandLimit, commandSpent)
    const candidates: TacticalAdjustment[] = []

    for (let lane = 0; lane < game.orders.length; lane += 1) {
      for (const order of Object.keys(ORDER_META) as BattleOrder[]) {
        if (order === game.orders[lane]) continue
        const nextOrders = game.orders.map((current, index) => (index === lane ? order : current))
        const nextSpent = nextOrders.reduce((total, current) => total + ORDER_META[current].cost, 0)
        if (nextSpent > commandLimit && nextSpent >= commandSpent) continue
        const result = battleResultFor(focusLane, { ...game, orders: nextOrders })
        if (!result) continue
        candidates.push({
          kind: 'order',
          lane,
          order,
          result,
          commandSpent: nextSpent,
          rank: tacticalPlanRank(result, game.day, nextSpent <= commandLimit, nextSpent),
        })
      }
    }

    if (commandSpent <= commandLimit) {
      for (const lane of [0, 1, 2]) {
        if (lane === focusLane) continue
        const result = battleResultFor(lane)
        if (!result) continue
        candidates.push({
          kind: 'focus',
          lane,
          order: null,
          result,
          commandSpent,
          rank: tacticalPlanRank(result, game.day, true, commandSpent),
        })
      }
    }

    const best = candidates.sort(
      (left, right) =>
        compareTacticalRanks(right.rank, left.rank) ||
        Number(right.kind === 'order') - Number(left.kind === 'order') ||
        left.lane - right.lane,
    )[0]
    return best && compareTacticalRanks(best.rank, currentRank) > 0 ? best : null
  }, [
    battleResultFor,
    campBattlePreview,
    commandLimit,
    commandSpent,
    focusLane,
    game,
    lineupReady,
    phase,
    showTitle,
    tutorialStep,
  ])
  const tacticalRoute = useMemo<TacticalRoutePlan | null>(() => {
    if (phase !== 'camp' || showTitle || tutorialStep !== null || !lineupReady) return null
    const currentResult = campBattlePreview
    if (!currentResult || currentResult.victory) return null

    const currentRank = tacticalPlanRank(currentResult, game.day, commandSpent <= commandLimit, commandSpent)
    let bestVictory: TacticalPlanCandidate | null = null
    let bestFallback: TacticalPlanCandidate | null = null

    for (const firstOrder of BATTLE_ORDER_SEQUENCE) {
      for (const secondOrder of BATTLE_ORDER_SEQUENCE) {
        for (const thirdOrder of BATTLE_ORDER_SEQUENCE) {
          const orders: BattleOrder[] = [firstOrder, secondOrder, thirdOrder]
          const candidateCommandSpent = orders.reduce((total, order) => total + ORDER_META[order].cost, 0)
          if (candidateCommandSpent > commandLimit) continue

          for (const candidateFocusLane of BATTLE_LANES) {
            const changeCount =
              orders.reduce((total, order, lane) => total + Number(order !== game.orders[lane]), 0) +
              Number(candidateFocusLane !== focusLane)
            if (changeCount === 0) continue
            const result = battleResultFor(candidateFocusLane, { ...game, orders })
            if (!result) continue
            const candidate: TacticalPlanCandidate = {
              focusLane: candidateFocusLane,
              orders,
              result,
              commandSpent: candidateCommandSpent,
              changeCount,
              rank: tacticalPlanRank(result, game.day, true, candidateCommandSpent),
            }

            if (result.victory) {
              if (
                !bestVictory ||
                candidate.changeCount < bestVictory.changeCount ||
                (candidate.changeCount === bestVictory.changeCount &&
                  compareTacticalRanks(candidate.rank, bestVictory.rank) > 0)
              ) {
                bestVictory = candidate
              }
              continue
            }

            if (
              !bestFallback ||
              compareTacticalRanks(candidate.rank, bestFallback.rank) > 0 ||
              (compareTacticalRanks(candidate.rank, bestFallback.rank) === 0 &&
                candidate.changeCount < bestFallback.changeCount)
            ) {
              bestFallback = candidate
            }
          }
        }
      }
    }

    const target = bestVictory ?? bestFallback
    if (!target || compareTacticalRanks(target.rank, currentRank) <= 0) return null

    const routeSteps: TacticalRouteStep[] = []
    for (const lane of BATTLE_LANES) {
      const order = target.orders[lane]
      if (order === game.orders[lane]) continue
      routeSteps.push({
        kind: 'order',
        lane,
        order,
        label: `0${lane + 1} ${ORDER_META[order].name}`,
      })
    }
    if (target.focusLane !== focusLane) {
      routeSteps.push({
        kind: 'focus',
        lane: target.focusLane,
        order: null,
        label: `집중 0${target.focusLane + 1}`,
      })
    }

    const immediateSteps: Array<{ step: TacticalRouteStep; adjustment: TacticalAdjustment }> = []
    for (const step of routeSteps) {
      if (step.kind === 'order') {
        const orders = game.orders.map((order, lane) => (lane === step.lane ? step.order : order))
        const nextCommandSpent = orders.reduce((total, order) => total + ORDER_META[order].cost, 0)
        if (nextCommandSpent > commandLimit && nextCommandSpent >= commandSpent) continue
        const result = battleResultFor(focusLane, { ...game, orders })
        if (!result) continue
        immediateSteps.push({
          step,
          adjustment: {
            kind: 'order',
            lane: step.lane,
            order: step.order,
            result,
            commandSpent: nextCommandSpent,
            rank: tacticalPlanRank(result, game.day, nextCommandSpent <= commandLimit, nextCommandSpent),
          },
        })
        continue
      }

      if (commandSpent > commandLimit) continue
      const result = battleResultFor(step.lane)
      if (!result) continue
      immediateSteps.push({
        step,
        adjustment: {
          kind: 'focus',
          lane: step.lane,
          order: null,
          result,
          commandSpent,
          rank: tacticalPlanRank(result, game.day, true, commandSpent),
        },
      })
    }

    let next = immediateSteps[0] ?? null
    for (const candidate of immediateSteps.slice(1)) {
      if (!next) {
        next = candidate
        continue
      }
      const candidateImproves = compareTacticalRanks(candidate.adjustment.rank, currentRank) > 0
      const nextImproves = compareTacticalRanks(next.adjustment.rank, currentRank) > 0
      if (
        (candidateImproves && !nextImproves) ||
        (candidateImproves === nextImproves &&
          compareTacticalRanks(candidate.adjustment.rank, next.adjustment.rank) > 0)
      ) {
        next = candidate
      }
    }
    if (!next) return null

    return {
      adjustment: next.adjustment,
      result: target.result,
      commandSpent: target.commandSpent,
      steps: [next.step.label, ...routeSteps.filter((step) => step !== next?.step).map((step) => step.label)],
    }
  }, [
    battleResultFor,
    campBattlePreview,
    commandLimit,
    commandSpent,
    focusLane,
    game,
    lineupReady,
    phase,
    showTitle,
    tutorialStep,
  ])
  const tacticalRouteActive = Boolean(
    tacticalRoute && tacticalRoute.steps.length > 1 && !directTacticalAdjustment?.result.victory,
  )
  const tacticalAdjustment = directTacticalAdjustment?.result.victory
    ? directTacticalAdjustment
    : (tacticalRoute?.adjustment ?? directTacticalAdjustment)
  const tacticalRehearsal = (() => {
    if (phase !== 'camp' || showTitle || tutorialStep !== null || !lineupReady || !campBattlePreview) return null
    if (!tacticalAdjustment) {
      const perfected =
        campBattlePreview.wins === 3 &&
        (game.day !== MAX_NIGHTS || campBattlePreview.crownBreakCount === FINAL_CROWN_SEALS.length)
      return {
        state: campBattlePreview.victory ? 'steady' : 'locked',
        glyph: campBattlePreview.victory ? '✓' : '△',
        kicker: campBattlePreview.victory ? 'TACTICAL REHEARSAL · CURRENT PLAN' : 'FULL TACTICAL SEARCH · 81 PLANS',
        title: perfected
          ? '현재 계획이 완벽 방어선입니다'
          : campBattlePreview.victory
            ? '현재 계획의 승리선을 유지하세요'
            : '현재 대열로 가능한 승리 조합이 없습니다',
        description: campBattlePreview.victory
          ? `방어 ${campBattlePreview.wins} / 3 · 지금보다 나은 단일 명령·집중 변경이 없습니다.`
          : '명령 한도와 집중 전선을 포함한 81개 조합을 모두 모의했습니다. 생존자 등급이나 병과 상성을 보강하세요.',
        status: campBattlePreview.victory ? `방어 ${campBattlePreview.wins} / 3` : '성장 필요',
        actionLabel: '한 단계 적용',
        routeSteps: [],
      }
    }

    const tacticalOutcome = tacticalRouteActive && tacticalRoute ? tacticalRoute.result : tacticalAdjustment.result
    const tacticalOutcomeCommandSpent =
      tacticalRouteActive && tacticalRoute ? tacticalRoute.commandSpent : tacticalAdjustment.commandSpent
    const currentCounterCount = campBattlePreview.lanes.filter((lane) => lane.countered).length
    const nextCounterCount = tacticalOutcome.lanes.filter((lane) => lane.countered).length
    const currentMargin = campBattlePreview.lanes.reduce((total, lane) => total + lane.playerPower - lane.enemyPower, 0)
    const nextMargin = tacticalOutcome.lanes.reduce((total, lane) => total + lane.playerPower - lane.enemyPower, 0)
    const currentReturnHeat = Math.max(0, Math.min(100, game.heat + campBattlePreview.heatDelta))
    const nextReturnHeat = Math.max(0, Math.min(100, game.heat + tacticalOutcome.heatDelta))
    const impacts: string[] = []
    if (tacticalOutcomeCommandSpent !== commandSpent) {
      impacts.push(`지휘 ${commandSpent} → ${tacticalOutcomeCommandSpent}`)
    }
    if (!campBattlePreview.victory && tacticalOutcome.victory) impacts.push('승리선 확보')
    if (tacticalOutcome.wins !== campBattlePreview.wins) {
      impacts.push(`방어 ${campBattlePreview.wins} → ${tacticalOutcome.wins}`)
    }
    if (tacticalOutcome.crownBreakCount !== campBattlePreview.crownBreakCount) {
      impacts.push(`칙령 ${campBattlePreview.crownBreakCount} → ${tacticalOutcome.crownBreakCount}`)
    }
    if (nextReturnHeat > currentReturnHeat) impacts.push(`귀환 온기 ${currentReturnHeat}% → ${nextReturnHeat}%`)
    if (nextCounterCount !== currentCounterCount) impacts.push(`파훼 ${currentCounterCount} → ${nextCounterCount}`)
    if (nextMargin > currentMargin) impacts.push(`합산 전력 +${nextMargin - currentMargin}`)

    const adjustedLane = tacticalAdjustment.result.lanes[tacticalAdjustment.lane]
    const countersIntent =
      tacticalAdjustment.kind === 'order' &&
      ORDER_META[tacticalAdjustment.order].counters === enemies[tacticalAdjustment.lane].intent
    const reason =
      tacticalAdjustment.kind === 'focus'
        ? `${tacticalAdjustment.lane + 1}전선의 화로 보정을 다시 계산했습니다.`
        : countersIntent
          ? `${INTENT_META[enemies[tacticalAdjustment.lane].intent].name} 의도를 직접 파훼합니다.`
          : tacticalAdjustment.order === 'support'
            ? '인접 전선의 지원망까지 함께 계산했습니다.'
            : `${adjustedLane.playerPower} 대 ${adjustedLane.enemyPower}의 교전값을 개선합니다.`
    const status = tacticalRouteActive
      ? tacticalOutcome.victory
        ? `승리까지 ${tacticalRoute?.steps.length ?? 0}단계`
        : `최선까지 ${tacticalRoute?.steps.length ?? 0}단계`
      : tacticalAdjustment.commandSpent < commandSpent
        ? `지휘 −${commandSpent - tacticalAdjustment.commandSpent}`
        : !campBattlePreview.victory && tacticalAdjustment.result.victory
          ? '승리선 확보'
          : tacticalAdjustment.result.wins > campBattlePreview.wins
            ? `방어 +${tacticalAdjustment.result.wins - campBattlePreview.wins}`
            : tacticalAdjustment.result.crownBreakCount > campBattlePreview.crownBreakCount
              ? `칙령 +${tacticalAdjustment.result.crownBreakCount - campBattlePreview.crownBreakCount}`
              : nextCounterCount > currentCounterCount
                ? `파훼 +${nextCounterCount - currentCounterCount}`
                : nextReturnHeat > currentReturnHeat
                  ? `온기 +${nextReturnHeat - currentReturnHeat}`
                  : nextMargin > currentMargin
                    ? `전력 +${nextMargin - currentMargin}`
                    : '예측 개선'

    return {
      state: !campBattlePreview.victory && tacticalOutcome.victory ? 'breakthrough' : 'improve',
      glyph: tacticalRouteActive ? '◎' : tacticalAdjustment.kind === 'order' ? '⌘' : '✦',
      kicker: tacticalRouteActive
        ? `FULL TACTICAL ROUTE · ${tacticalRoute?.steps.length ?? 0} MOVES`
        : `TACTICAL REHEARSAL · FRONT 0${tacticalAdjustment.lane + 1}`,
      title:
        tacticalAdjustment.kind === 'order'
          ? `${tacticalAdjustment.lane + 1}전선을 ${ORDER_META[tacticalAdjustment.order].name} 명령으로 전환`
          : `화로 집중을 ${tacticalAdjustment.lane + 1}전선으로 이동`,
      description: tacticalRouteActive
        ? `첫 단계입니다. ${reason} 경로 완료 시 ${impacts.length > 0 ? impacts.slice(0, 3).join(' · ') : `방어 ${tacticalOutcome.wins} / 3`}입니다.`
        : `${reason}${impacts.length > 0 ? ` ${impacts.slice(0, 3).join(' · ')}` : ''}`,
      status,
      actionLabel: tacticalRouteActive ? '1단계 적용' : '한 단계 적용',
      routeSteps: tacticalRouteActive ? (tacticalRoute?.steps ?? []) : [],
    }
  })()
  let recoverableLaneForecast: LaneResult | null = null
  for (const laneForecast of forecastLanes) {
    if (!laneForecast || laneForecast.won) continue
    const gap = laneForecast.enemyPower - laneForecast.playerPower
    if (!recoverableLaneForecast) {
      recoverableLaneForecast = laneForecast
      continue
    }
    const currentGap = recoverableLaneForecast.enemyPower - recoverableLaneForecast.playerPower
    if (gap < currentGap || (gap === currentGap && laneForecast.lane < recoverableLaneForecast.lane)) {
      recoverableLaneForecast = laneForecast
    }
  }
  const recoveryReason = recoverableLaneForecast
    ? recoverableLaneForecast.relation === 'disadvantage'
      ? `${KIND_META[recoverableLaneForecast.enemy.kind].name} 적에게 상성 열세`
      : !recoverableLaneForecast.countered
        ? `${INTENT_META[recoverableLaneForecast.intent].name} 의도 미파훼`
        : recoverableLaneForecast.lane !== focusLane
          ? '화로 집중이 다른 전선에 있음'
          : '상성·명령 적용 뒤에도 전력 부족'
    : '출전 대열을 다시 확인하세요'
  const battleRecoveryDirective =
    tacticalAdjustment && tacticalRehearsal
      ? `${tacticalRehearsal.title} · ${tacticalRehearsal.status}`
      : recoverableLaneForecast
        ? `0${recoverableLaneForecast.lane + 1}전선 ${recoverableLaneForecast.enemyPower - recoverableLaneForecast.playerPower} 부족 · ${recoveryReason}`
        : '대열을 보강하세요'
  const projectedCrownMasteryScore =
    campBattlePreview?.crownMasteryBonus && campBattlePreview.crownMasteryBonus > 0
      ? campBattlePreview.crownMasteryBonus
      : Math.round(
          FINAL_CROWN_MASTERY_SCORE *
            expeditionRenownScaleFor(game.difficulty, game.oath) *
            currentCondition.scoreScale *
            (game.activeLegacy.includes('chroniclers-ink') ? 1.08 : 1),
        )
  const focusBonusPercent = (game.relics.includes('watchtower-lens') ? 42 : 28) + currentCondition.focusBonus * 100
  const battleForecastDetail =
    riskDepartureArmed && riskDepartureForecast
      ? `두 번째 입력 시 후퇴 보급 +${riskDepartureForecast.supplyReward} · 온기 ${riskDepartureForecast.heatBefore}% → ${riskDepartureForecast.heatAfter}% · 사기 ${riskDepartureForecast.moraleBefore} → ${riskDepartureForecast.moraleAfter}`
      : commandSpent > commandLimit
        ? '방벽 명령으로 지휘 부담을 낮추세요'
        : !lineupReady
          ? '대기소에서 생존자를 배치하세요'
          : game.day === MAX_NIGHTS
            ? projectedWins < REQUIRED_LANE_WINS
              ? `붕괴 위험 · ${battleRecoveryDirective}`
              : finalCrownForecastCount < FINAL_CROWN_REQUIRED_SEALS
                ? `왕관 봉인 · 칙령 ${finalCrownForecastCount} / ${FINAL_CROWN_REQUIRED_SEALS} · ${
                    tacticalAdjustment && tacticalRehearsal ? tacticalRehearsal.title : '파훼·집중·상성 조건을 바꾸세요'
                  }`
                : finalCrownForecastCount === FINAL_CROWN_SEALS.length
                  ? `완전 파쇄 예상 · 추가 명성 +${projectedCrownMasteryScore.toLocaleString('ko-KR')}`
                  : `최종 승리 예상 · 칙령 ${finalCrownForecastCount} / ${FINAL_CROWN_REQUIRED_SEALS} · 방어 ${projectedWins} / ${REQUIRED_LANE_WINS}`
            : !projectedBattleVictory
              ? `붕괴 위험 · ${battleRecoveryDirective}`
              : activeDecisionEcho?.heatShield
                ? `${projectedBattleVictory ? '승리 예상' : '붕괴 위험'} · 귀환 온기 손실 최대 ${activeDecisionEcho.heatShield} 감소`
                : activeDecisionEcho
                  ? `${projectedBattleVictory ? '승리 예상' : '붕괴 위험'} · 과거 결정 ${decisionEchoForecastCount} / 3 전선 발동`
                  : projectedBattleVictory
                    ? '승리 예상 · 명령을 확인하세요'
                    : '붕괴 위험 · 상성·집중·명령을 바꾸세요'
  const battleForecastTitle = riskDepartureForecast?.endsExpedition
    ? riskDepartureArmed
      ? '온기 소진 · 원정 종료 확인'
      : '패배 시 온기 0% · 원정 종료'
    : riskDepartureArmed
      ? '위험 출전 · 두 번째 입력 대기'
      : commandSpent > commandLimit
        ? '명령 점수가 초과됐어요'
        : lineupReady
          ? `예상 방어 ${projectedWins} / 3`
          : '전선이 비어 있어요'
  const battleActionLabel =
    phase === 'battling'
      ? '교전 중'
      : pendingPromotionUnit
        ? '베테랑 진급 선택'
        : !lineupReady
          ? `${game.day}일차 전선 배치 필요`
          : commandSpent > commandLimit
            ? '명령 점수 조정 필요'
            : tutorialStep !== null && tutorialStep !== 'battle'
              ? '현장 훈련 진행 중'
              : projectedBattleVictory
                ? `${game.day}일차 방어 시작`
                : riskDepartureArmed
                  ? riskDepartureForecast?.endsExpedition
                    ? `${game.day}일차 원정 종료 확정`
                    : `${game.day}일차 후퇴 위험 확정`
                  : riskDepartureForecast?.endsExpedition
                    ? `${game.day}일차 원정 종료 위험`
                    : `${game.day}일차 위험 출전`
  const currentEliteLane = currentEliteEncounter?.lane ?? null
  const currentEliteDoctrineForecast =
    currentEliteLane === null
      ? null
      : enemyDoctrineEffectFor(
          enemies[currentEliteLane],
          currentEliteLane,
          battleContext,
          ORDER_META[game.orders[currentEliteLane]].counters === enemies[currentEliteLane].intent,
          lineupUnits[currentEliteLane],
        )
  const finalMarchGate = FINAL_MARCH_GATES.find((gate) => gate.night === game.day) ?? null
  const nextFinalMarchGate = finalMarchGate
    ? (FINAL_MARCH_GATES.find((gate) => gate.night > finalMarchGate.night) ?? null)
    : null
  const finalMarchBattlePreview = finalMarchGate ? campBattlePreview : null
  const projectedReturnHeat = finalMarchBattlePreview
    ? Math.max(0, Math.min(100, game.heat + finalMarchBattlePreview.heatDelta))
    : game.heat
  const projectedCampReturnHeat = campBattlePreview
    ? Math.max(0, Math.min(100, game.heat + campBattlePreview.heatDelta))
    : game.heat
  const projectedCampReturnSupplies = game.supplies + (campBattlePreview?.supplyReward ?? 0)
  const protocolMasteryForecast = (() => {
    if (protocolMasteryRecognized) {
      return {
        state: 'mastered',
        label: protocolMasteryProgress.name,
        detail: '숙련 인장 영구 보존',
      }
    }
    if (!lineupReady || !campBattlePreview || commandSpent > commandLimit) {
      return {
        state: 'waiting',
        label: `${protocolMasteryProgress.metricLabel} ${protocolMasteryProgress.currentLabel}`,
        detail: '출전 계획을 완성하면 이번 밤의 숙련 변화를 예측합니다.',
      }
    }

    const counterGain = campBattlePreview.victory ? campBattlePreview.lanes.filter((lane) => lane.countered).length : 0
    const perfectGain = campBattlePreview.victory && campBattlePreview.wins === 3 ? 1 : 0
    const projectedCurrent =
      protocolMasteryProgress.metric === 'heat'
        ? projectedCampReturnHeat
        : protocolMasteryProgress.metric === 'intents'
          ? game.intentsCountered + counterGain
          : game.perfectNights + perfectGain
    const ready = projectedCurrent >= protocolMasteryProgress.target
    const remaining = Math.max(0, protocolMasteryProgress.target - projectedCurrent)
    const label =
      protocolMasteryProgress.metric === 'heat'
        ? `귀환 온기 ${projectedCurrent}% · 숙련선 ${protocolMasteryProgress.target}%`
        : protocolMasteryProgress.metric === 'intents'
          ? `누적 파훼 ${projectedCurrent} / ${protocolMasteryProgress.target}회 · 이번 승리 +${counterGain}`
          : `완벽 방어 ${projectedCurrent} / ${protocolMasteryProgress.target}회 · 이번 밤 +${perfectGain}`
    const remainingLabel = protocolMasteryProgress.metric === 'heat' ? `온기 ${remaining}%` : `${remaining}회`

    return {
      state: ready ? 'ready' : campBattlePreview.victory ? 'progress' : 'warning',
      label,
      detail: ready
        ? `수치 충족 · 12일 완주 시 ${protocolMasteryProgress.name} 인장 획득`
        : `${protocolMasteryProgress.metricLabel} ${remainingLabel}와 12일 완주가 남았습니다.`,
    }
  })()
  const campaignPaceBenchmark = CAMPAIGN_PACE_BENCHMARKS[currentAct.number - 1]
  const campaignPaceActLength = campaignPaceBenchmark.endDay - campaignPaceBenchmark.startDay + 1
  const campaignPaceActProgress = game.day - campaignPaceBenchmark.startDay + 1
  const campaignPaceTierTarget = Math.ceil(
    campaignPaceBenchmark.startTierTotal +
      (campaignPaceBenchmark.targetTierTotal - campaignPaceBenchmark.startTierTotal) *
        (campaignPaceActProgress / campaignPaceActLength),
  )
  const campaignPaceGrowthGap = Math.max(0, campaignPaceTierTarget - lineupTierTotal)
  const campaignCrownGrowthReady =
    currentAct.number === 1
      ? tierTwoLineCount === 3
      : currentAct.number === 2
        ? tierThreeLineCount >= 2
        : tierThreeLineCount === 3 && tierFourLineCount >= 1
  const campaignPaceHeatGap = Math.max(0, eventCrownHeatFloor - game.heat)
  const campaignPaceProgress = Math.min(100, Math.round((lineupTierTotal / campaignPaceTierTarget) * 100))
  const crownReserveWindow = nextCrownNight - game.day <= 1
  const quartermasterReserve = projectedCampReturnHeat <= (crownReserveWindow ? 45 : 24) ? stokeBaseCost : 0
  const quartermasterSpendable = Math.max(0, game.supplies - quartermasterReserve)
  const recruitKeepsReserve = game.supplies >= recruitCost && game.supplies - recruitCost >= quartermasterReserve
  const marchSealVeteranLines = lineupUnits.filter((unit) => unit && unit.tier >= 3).length
  const marchSealUnlocked = game.day >= 9 && lineupReady && marchSealVeteranLines === 3
  const marchSealStokeReserve = stokeBaseCost * Math.min(2, MAX_NIGHTS - game.day + 1)
  const marchSealGrowthReserve = lineupUnits.some((unit) => unit && unit.tier < MAX_TIER) ? recruitCost : 0
  const marchSealRecoveryReserve = game.recoverySupplies
  const marchSealReserve = Math.max(
    quartermasterReserve,
    marchSealStokeReserve + marchSealGrowthReserve,
    marchSealRecoveryReserve,
  )
  const marchSealSupplies = marchSealUnlocked ? Math.floor(Math.max(0, game.supplies - marchSealReserve) / 10) * 10 : 0
  const marchSealLegacyActive = game.activeLegacy.includes('chroniclers-ink')
  const marchSealBaseScoreRate = Math.max(1, Math.round(10 * expeditionRenownScaleFor(game.difficulty, game.oath)))
  const marchSealInheritedScoreRate = Math.max(
    1,
    Math.round(10 * expeditionRenownScaleFor(game.difficulty, game.oath) * (marchSealLegacyActive ? 1.08 : 1)),
  )
  const marchSealScoreRate = Math.max(
    1,
    Math.round(
      10 *
        expeditionRenownScaleFor(game.difficulty, game.oath) *
        (marchSealLegacyActive ? 1.08 : 1) *
        (game.masteryContract ? MASTERY_CONTRACTS[game.masteryContract].scoreScale : 1),
    ),
  )
  const marchSealScore = marchSealSupplies * marchSealScoreRate
  const marchSealLegacyScoreBonus = marchSealLegacyActive
    ? marchSealSupplies * (marchSealInheritedScoreRate - marchSealBaseScoreRate)
    : 0
  const marchSealContractScoreBonus = game.masteryContract
    ? marchSealSupplies * (marchSealScoreRate - marchSealInheritedScoreRate)
    : 0
  const marchSealRankEntry = rankEntryForScore(game.score + marchSealScore)
  const marchSealRaisesRank = marchSealRankEntry.minimum > liveRankEntry.minimum
  const quartermasterBriefing = (() => {
    if (!lineupReady) {
      return {
        state: 'waiting',
        label: 'FORECAST WAITING',
        title: `빈 전선 ${3 - lineupUnits.filter((unit) => unit !== null).length}곳 · 귀환 예산 계산 대기`,
        description: '세 전선을 채우면 현재 명령 기준 전투 보급과 귀환 온기를 함께 계산합니다.',
      }
    }
    if (commandSpent > commandLimit) {
      return {
        state: 'warning',
        label: 'COMMAND OVERLOAD',
        title: `지휘 부담 ${commandSpent - commandLimit} 초과 · 보급 지출 보류`,
        description: '명령을 먼저 조정해야 현재 계획의 귀환 예산이 실제 출전 조건과 일치합니다.',
      }
    }
    if (campBattlePreview && !campBattlePreview.victory) {
      return {
        state: 'critical',
        label: 'RETREAT BUDGET',
        title: `현재 계획은 후퇴 예상 · 복구 보급 +${campBattlePreview.supplyReward}`,
        description: `귀환 온기 ${projectedCampReturnHeat}% 예상입니다. 지출보다 상성·명령·집중 전선을 먼저 고치세요.`,
      }
    }
    if (projectedCampReturnHeat === 0) {
      return {
        state: 'critical',
        label: 'FATAL RETURN',
        title: '승리해도 귀환 온기 0% · 화로 투자가 먼저입니다',
        description: `현재 화로 투자는 보급 ${stokeCost}로 온기 +${stokeHeatGain}%를 정확히 채웁니다.`,
      }
    }
    if (eventDaysToCrown <= 1 && !campaignCrownGrowthReady) {
      return {
        state: 'warning',
        label: 'CROWN GROWTH LINE',
        title: `왕관 권장 성장선 · ${campaignPaceBenchmark.crownGrowth}`,
        description: `현재 출전 등급합 ${lineupTierTotal}, 오늘 성장선 ${campaignPaceTierTarget}입니다. ${campBattlePreview?.victory ? '현재 전술은 승리 예상이지만 다음 막의 안정성을 위해 합성 기회를 확인하세요.' : '신호탄과 합성을 먼저 검토하세요.'}`,
      }
    }
    if (campaignPaceGrowthGap > 0) {
      return {
        state: 'pace',
        label: 'CAMPAIGN GROWTH PACE',
        title: `오늘 성장선까지 출전 등급합 +${campaignPaceGrowthGap}`,
        description:
          nextRecruitTierOneCount > 0
            ? `${KIND_META[nextRecruitKind].name} I 신호탄이 즉시 합성 짝을 완성합니다. 현재 ${lineupTierTotal} / ${campaignPaceTierTarget}.`
            : `신호탄 순환과 사건 강화를 이용해 현재 ${lineupTierTotal} / ${campaignPaceTierTarget} 성장선을 따라가세요.`,
      }
    }
    if (marchSealUnlocked && marchSealSupplies >= 10) {
      return {
        state: 'surplus',
        label: 'MARCH SURPLUS',
        title: `잉여 보급 ${marchSealSupplies} → 명성 +${marchSealScore.toLocaleString('ko-KR')}`,
        description: `화로·성장·복구 보호선 ${marchSealReserve}을 남기고${
          marchSealRecoveryReserve > 0
            ? ` 아직 쓰지 않은 복구 보급 ${marchSealRecoveryReserve}을 보호합니다.`
            : ' 후퇴 보급은 섞지 않습니다.'
        }${marchSealLegacyScoreBonus > 0 ? ` 기록관의 잉크가 실제 명성 +${marchSealLegacyScoreBonus.toLocaleString('ko-KR')}을 더합니다.` : ''}${marchSealContractScoreBonus > 0 && game.masteryContract ? ` ${MASTERY_CONTRACTS[game.masteryContract].name} 계약이 +${marchSealContractScoreBonus.toLocaleString('ko-KR')}을 더합니다.` : ''}${marchSealRaisesRank ? ` 현재 기록은 ${marchSealRankEntry.rank} 등급까지 상승합니다.` : ''}`,
      }
    }
    if (rosterCount >= ROSTER_SIZE) {
      return {
        state: 'warning',
        label: 'ROSTER CAPACITY',
        title: '대기소가 가득 찼습니다 · 합성으로 구조 공간 확보',
        description: `보급 ${game.supplies}은 유지됩니다. 같은 병과·등급을 합친 뒤 다음 신호탄 비용 ${recruitCost}을 검토하세요.`,
      }
    }
    if (nextRecruitTierOneCount > 0 && recruitKeepsReserve) {
      return {
        state: 'growth',
        label: 'MERGE WINDOW',
        title: `${KIND_META[nextRecruitKind].name} I 합성 짝을 완성할 수 있습니다`,
        description: `신호탄 뒤 보급 ${game.supplies - recruitCost} · 권장 예비 ${quartermasterReserve}을 남긴 채 즉시 성장할 수 있습니다.`,
      }
    }
    if (game.supplies >= recruitCost && !recruitKeepsReserve) {
      return {
        state: 'reserve',
        label: 'CROWN RESERVE',
        title: `신호탄은 가능하지만 예비 보급 ${quartermasterReserve}이 무너집니다`,
        description: `다음 왕관과 귀환 온기를 위해 보급 ${quartermasterReserve}을 남기거나 화로를 먼저 보강하세요.`,
      }
    }
    if (game.supplies >= recruitCost) {
      return {
        state: 'ready',
        label: 'GROWTH READY',
        title: `신호탄 뒤 보급 ${game.supplies - recruitCost} · 귀환 예상 ${projectedCampReturnSupplies}`,
        description: '날짜 압박은 완만하게, 실제 구조 인원이 늘수록 다음 신호탄 비용이 단계적으로 상승합니다.',
      }
    }
    return {
      state: 'steady',
      label: 'SUPPLY ROUTE',
      title: `신호탄까지 보급 ${recruitCost - game.supplies} 부족`,
      description: campBattlePreview
        ? `현재 계획대로 승리하면 보급 +${campBattlePreview.supplyReward}, 총 ${projectedCampReturnSupplies}으로 다음 성장을 준비합니다.`
        : '전선을 완성하면 다음 귀환 보급까지 계산할 수 있습니다.',
    }
  })()
  const finalMarchPrimaryInsight = finalMarchGate
    ? (forecastLanes
        .filter((lane): lane is LaneResult => lane !== null && !lane.won)
        .map((lane) => failureInsightFor(lane, game.day, focusLane))
        .sort((left, right) => left.priority - right.priority || right.gap - left.gap)[0] ?? null)
    : null
  const finalMarchBriefing = (() => {
    if (!finalMarchGate) return null
    if (!lineupReady) {
      return {
        state: 'warning',
        kicker: `${finalMarchGate.label} · FORMATION INCOMPLETE`,
        title: `빈 전선 ${3 - lineupUnits.filter((unit) => unit !== null).length}곳을 채우세요`,
        description: '왕좌로 가는 마지막 관문에서는 세 전선이 모두 연결되어야 합니다.',
      }
    }
    if (commandSpent > commandLimit) {
      return {
        state: 'warning',
        kicker: `${finalMarchGate.label} · COMMAND OVERLOAD`,
        title: `지휘 부담을 ${commandSpent - commandLimit} 낮추세요`,
        description: '비용 0인 방벽 명령으로 전환해 전투 개시 조건을 회복하세요.',
      }
    }
    if (currentEliteDoctrine && currentEliteDoctrineForecast && !currentEliteDoctrineForecast.broken) {
      return {
        state: 'warning',
        kicker: `${finalMarchGate.label} · GATE PRESSURE ACTIVE`,
        title: `${currentEliteDoctrine.name} 압박이 아직 활성입니다`,
        description: `${currentEliteDoctrine.counterplay} 이 관문은 ${finalMarchGate.crownPreparation}을 준비합니다.`,
      }
    }
    if (projectedWins < 2 && finalMarchPrimaryInsight) {
      return {
        state: 'warning',
        kicker: `${finalMarchGate.label} · DEFENCE LINE UNSTABLE`,
        title: finalMarchPrimaryInsight.label,
        description: finalMarchPrimaryInsight.action,
      }
    }
    if (finalMarchBattlePreview?.victory && projectedReturnHeat === 0) {
      return {
        state: 'critical',
        kicker: `${finalMarchGate.label} · FATAL RETURN FORECAST`,
        title: '승리해도 귀환 온기가 0%가 됩니다',
        description:
          game.supplies >= stokeCost
            ? `전투 전에 보급 ${stokeCost}로 화로를 지펴 귀환 가능한 온기를 확보하세요.`
            : '합성으로 온기를 회복하거나 대열을 재정비해 원정 종료 위험을 낮추세요.',
      }
    }
    if (finalMarchBattlePreview?.victory && projectedReturnHeat <= 20) {
      return {
        state: 'strained',
        kicker: `${finalMarchGate.label} · LAST EMBER MARGIN`,
        title: `관문 파훼 예상 · 귀환 온기 ${projectedReturnHeat}%`,
        description: '돌파는 가능하지만 다음 밤의 선택 폭이 좁습니다. 출전 전 화로 보강을 검토하세요.',
      }
    }
    return {
      state: projectedWins === 3 ? 'perfect' : 'ready',
      kicker: `${finalMarchGate.label} · GATE BREAK FORECAST`,
      title: `${currentEliteDoctrine?.name ?? finalMarchGate.name} 파훼 · 방어 ${projectedWins} / 3 예상`,
      description: `${finalMarchGate.lesson} 귀환 온기 ${projectedReturnHeat}%를 확보한 채 왕좌로 진군할 수 있습니다.`,
    }
  })()
  const resolvedDoctrineLane = battleResult?.lanes.find((lane) => lane.enemy.doctrine) ?? null
  const resultCounterCount = battleResult?.lanes.filter((lane) => lane.countered).length ?? 0
  const nextStory = NIGHT_STORIES[game.day]
  const firstVictoryPreview =
    battleResult?.victory && game.victories === 0 && game.day < MAX_NIGHTS && nextStory
      ? {
          nextNight: game.day + 1,
          title: nextStory.title,
          location: nextStory.location,
          weather: nextStory.weather,
          omen: nextStory.omen,
        }
      : null
  const resultDecisionEchoCount = battleResult?.lanes.filter((lane) => lane.decisionEchoActive).length ?? 0
  const resultFinalMarchImprints = activeFinalMarchImprints.map((imprint) => ({
    imprint,
    activeLanes: battleResult?.lanes.filter((lane) => lane.finalMarchImprintIds.includes(imprint.id)).length ?? 0,
  }))
  const resultFinalMarchImprintCount =
    battleResult?.lanes.filter((lane) => lane.finalMarchImprintIds.length > 0).length ?? 0
  const resultFinalVowCount = battleResult?.lanes.filter((lane) => lane.finalVowActive).length ?? 0
  const resultCrownStates =
    battleResult && game.day === MAX_NIGHTS
      ? battleResult.lanes.map((lane) => ({
          seal: finalCrownSealFor(lane.lane),
          lane,
          broken: finalCrownSealBroken(lane.lane, battleResult.focusLane, lane.countered, lane.relation),
        }))
      : []
  const resultCrownBreakCount = battleResult?.crownBreakCount ?? 0
  const finalCrownMechanicBlocked =
    battleResult !== null &&
    !battleResult.victory &&
    game.day === MAX_NIGHTS &&
    battleResult.wins >= REQUIRED_LANE_WINS &&
    resultCrownBreakCount < FINAL_CROWN_REQUIRED_SEALS
  const defeatInsights =
    battleResult && !battleResult.victory
      ? battleResult.lanes
          .filter(
            (lane) =>
              !lane.won ||
              (game.day === MAX_NIGHTS &&
                resultCrownBreakCount < FINAL_CROWN_REQUIRED_SEALS &&
                !finalCrownSealBroken(lane.lane, battleResult.focusLane, lane.countered, lane.relation)),
          )
          .map((lane) => failureInsightFor(lane, game.day, battleResult.focusLane))
          .sort((left, right) => left.priority - right.priority || right.gap - left.gap)
      : []
  const primaryFailureInsight = defeatInsights[0] ?? null
  const nextRetreatSupply = retreatSupplyFor(game.difficulty, priorDefeatCount + 1)
  const resultProtocolCopy = battleResult
    ? battleResult.victory
      ? game.difficulty === 'story'
        ? '추가 명령과 강화된 화로 집중이 전선을 안정시켰습니다.'
        : game.difficulty === 'expedition'
          ? `의도 ${resultCounterCount}개 파훼 · 전술 회수 보급 +${battleResult.protocolSupplyBonus}`
          : battleResult.wins === 3
            ? `미파훼 없이 완벽 방어 · 백색 보급 +${battleResult.protocolSupplyBonus} · 명성 보너스`
            : `의도 ${resultCounterCount}개 파훼 · 강화된 파훼 위협 감소 적용`
      : finalCrownMechanicBlocked
        ? `전선 ${battleResult.wins}곳 유지 · 칙령 미달 왕관 반동 · 복구 보급 +${battleResult.supplyReward}`
        : `의도 ${resultCounterCount}개 해법 확인 · 복구 보급 +${battleResult.supplyReward} · 명성은 승리 시 기록`
    : ''
  const resultProtocolMastery = (() => {
    if (!battleResult) return null
    const resultCurrent =
      protocolMasteryProgress.metric === 'heat'
        ? Math.max(0, Math.min(100, game.heat + battleResult.heatDelta))
        : protocolMasteryProgress.metric === 'intents'
          ? game.intentsCountered + (battleResult.victory ? resultCounterCount : 0)
          : game.perfectNights + (battleResult.victory && battleResult.wins === 3 ? 1 : 0)
    const ready = resultCurrent >= protocolMasteryProgress.target
    const completed = battleResult.victory && game.day === MAX_NIGHTS && ready
    const resultLabel =
      protocolMasteryProgress.metric === 'heat'
        ? `귀환 온기 ${resultCurrent}% / ${protocolMasteryProgress.target}%`
        : `${protocolMasteryProgress.metricLabel} ${resultCurrent} / ${protocolMasteryProgress.target}회`
    return {
      state: protocolMasteryRecognized || completed ? 'mastered' : ready ? 'ready' : 'progress',
      copy: completed
        ? `${resultLabel} · 숙련 인장 획득`
        : protocolMasteryRecognized
          ? `${resultLabel} · 숙련 인장 보유`
          : `${resultLabel} · ${ready ? '완주 조건 대기' : '숙련 추적 중'}`,
    }
  })()
  const tutorialCopy = tutorialStep ? TUTORIAL_COPY[tutorialStep] : null
  const tutorialIndex = tutorialStep ? TUTORIAL_ORDER.indexOf(tutorialStep) + 1 : 0
  const veteranBriefing = tutorialStep === null && meta.completedRuns > 0
  const trainingRecovery = tutorialStep
    ? 'resume'
    : game.status === 'playing' && game.day === 1 && game.battles === 0
      ? 'restart'
      : 'queue'
  const deployedLineCount = lineupUnits.filter((unit) => unit !== null).length
  const counteredForecastCount = forecastLanes.filter((lane) => lane?.countered).length
  const firstExposedForecast = forecastLanes.find((lane) => lane !== null && !lane.countered) ?? null
  const weakestForecast = forecastLanes
    .filter((lane): lane is LaneResult => lane !== null)
    .sort(
      (left, right) =>
        left.playerPower - left.enemyPower - (right.playerPower - right.enemyPower) || left.lane - right.lane,
    )[0]
  const tutorialTierTwoRosterCount = game.slots.filter((unit) => unit && unit.tier >= 2).length
  const tutorialTierTwoLineCount = lineupUnits.filter((unit) => unit && unit.tier >= 2).length
  const tutorialCounterCount = tutorialStep ? tutorialCounterCountFor(game) : 0
  const tutorialNeedsFocusForecast = campForecastActive && (tutorialStep === 'focus' || tutorialStep === 'battle')
  const tutorialFocusOptions = ([0, 1, 2] as const).map((lane) => {
    const result = tutorialNeedsFocusForecast ? battleResultFor(lane) : null
    return {
      lane,
      result,
      margin: result
        ? result.lanes.reduce((total, laneResult) => total + laneResult.playerPower - laneResult.enemyPower, 0)
        : Number.NEGATIVE_INFINITY,
    }
  })
  const tutorialRecommendedFocus = tutorialFocusOptions.reduce((best, candidate) => {
    const bestWins = best.result?.wins ?? -1
    const candidateWins = candidate.result?.wins ?? -1
    if (candidateWins !== bestWins) return candidateWins > bestWins ? candidate : best
    if (candidate.margin !== best.margin) return candidate.margin > best.margin ? candidate : best
    return candidate.lane < best.lane ? candidate : best
  })
  const tutorialRecommendedFocusLane = tutorialRecommendedFocus.lane
  const tutorialRecommendedFocusWins = tutorialRecommendedFocus.result?.wins ?? 0
  const tutorialObjective = (() => {
    if (!tutorialStep || !tutorialCopy) return null
    if (tutorialStep === 'merge') {
      return {
        goal: tutorialCopy.goal,
        status: `${tutorialTierTwoRosterCount} / 1 완성`,
        ready: tutorialTierTwoRosterCount >= 1,
      }
    }
    if (tutorialStep === 'deploy') {
      return {
        goal: tutorialCopy.goal,
        status: `${tutorialTierTwoLineCount} / 1 배치`,
        ready: tutorialTierTwoLineCount >= 1,
      }
    }
    if (tutorialStep === 'orders') {
      return {
        goal: tutorialCopy.goal,
        status: `${tutorialCounterCount} / 1 새 파훼`,
        ready: tutorialCounterCount >= 1,
      }
    }
    if (tutorialStep === 'focus') {
      return {
        goal: tutorialRecommendedFocusWins >= REQUIRED_LANE_WINS ? tutorialCopy.goal : '청록 명령을 더 파훼한 뒤 집중',
        status: `현재 ${projectedWins} / 3 · 추천 0${tutorialRecommendedFocusLane + 1}은 ${tutorialRecommendedFocusWins} / 3`,
        ready: projectedWins >= REQUIRED_LANE_WINS,
      }
    }
    return {
      goal: tutorialCopy.goal,
      status: `${projectedWins} / 3 방어 예상`,
      ready: projectedBattleVictory,
    }
  })()
  const tutorialActionLabel = (() => {
    if (!tutorialStep || !tutorialCopy) return ''
    if (tutorialStep === 'focus') {
      return tutorialRecommendedFocusWins >= REQUIRED_LANE_WINS
        ? `추천 0${tutorialRecommendedFocusLane + 1} 선택`
        : '명령 보강하기'
    }
    if (tutorialStep === 'battle') {
      if (!lineupReady) return '전선 보강하기'
      if (commandSpent > commandLimit) return '명령 수정하기'
      if (!projectedBattleVictory) return '집중 수정하기'
    }
    return tutorialCopy.action
  })()
  const firstCrownSignals = [
    {
      id: 'formation',
      glyph: '◆',
      label: '전선 대열',
      value: `${deployedLineCount} / 3`,
      ready: lineupReady,
    },
    {
      id: 'command',
      glyph: '⌘',
      label: '지휘 부담',
      value: `${commandSpent} / ${commandLimit}`,
      ready: commandSpent <= commandLimit,
    },
    {
      id: 'intent',
      glyph: '✦',
      label: '의도 파훼',
      value: `${counteredForecastCount} / 3`,
      ready: counteredForecastCount >= 2,
    },
    {
      id: 'forecast',
      glyph: '◈',
      label: '방어 예상',
      value: `${projectedWins} / 3`,
      ready: projectedWins >= 2,
    },
  ]
  const firstCrownReadyCount = firstCrownSignals.filter((signal) => signal.ready).length
  const firstCrownBriefing = (() => {
    if (tutorialCopy) {
      return {
        state: 'training',
        kicker: `FIELD TRAINING ${tutorialIndex} / ${TUTORIAL_ORDER.length}`,
        title: tutorialCopy.title,
        description: tutorialCopy.description,
      }
    }
    if (!lineupReady) {
      return {
        state: 'warning',
        kicker: 'NEXT COMMAND · FORMATION',
        title: `빈 전선 ${3 - deployedLineCount}곳을 채우세요`,
        description: '대기소에서 생존자를 선택한 뒤 비어 있는 전선을 누르면 즉시 배치됩니다.',
      }
    }
    if (commandSpent > commandLimit) {
      return {
        state: 'warning',
        kicker: 'NEXT COMMAND · COMMAND LOAD',
        title: `지휘 부담을 ${commandSpent - commandLimit} 낮추세요`,
        description: '한 전선을 비용 0인 방벽 명령으로 돌리면 전투 개시 조건을 회복합니다.',
      }
    }
    if (counteredForecastCount < 2 && firstExposedForecast) {
      const counterOrder = orderForIntent(firstExposedForecast.intent)
      return {
        state: 'warning',
        kicker: `NEXT COMMAND · FRONT 0${firstExposedForecast.lane + 1}`,
        title: `${ORDER_META[counterOrder].name}으로 ${INTENT_META[firstExposedForecast.intent].name}을 끊으세요`,
        description: `첫 왕관은 미파훼 의도를 증폭합니다. 최소 두 전선의 의도를 미리 끊어 승리선을 만드세요.`,
      }
    }
    if (projectedWins < 2 && weakestForecast) {
      if (weakestForecast.relation === 'disadvantage') {
        const counterKind = counterKindFor(weakestForecast.enemy.kind)
        return {
          state: 'warning',
          kicker: `NEXT COMMAND · FRONT 0${weakestForecast.lane + 1}`,
          title: `${KIND_META[counterKind].name} 병과로 교대하세요`,
          description: `${KIND_META[weakestForecast.enemy.kind].name}에 상성 우위를 만드는 생존자를 배치하면 전력 격차를 뒤집을 수 있습니다.`,
        }
      }
      if (focusLane !== weakestForecast.lane) {
        return {
          state: 'warning',
          kicker: `NEXT COMMAND · FRONT 0${weakestForecast.lane + 1}`,
          title: `화로를 ${weakestForecast.lane + 1}전선에 집중하세요`,
          description: `현재 가장 큰 전력 격차는 ${weakestForecast.enemyPower - weakestForecast.playerPower}입니다. 집중 전선을 옮겨 두 번째 승리선을 확보하세요.`,
        }
      }
      return {
        state: 'warning',
        kicker: `NEXT COMMAND · FRONT 0${weakestForecast.lane + 1}`,
        title: '같은 표식의 생존자를 합쳐 전력을 높이세요',
        description: '상성과 명령을 갖췄지만 전력이 부족합니다. 대기소의 동일 병과·등급 두 명을 합쳐 주세요.',
      }
    }
    return currentStory.boss
      ? {
          state: 'boss',
          kicker: 'CROWN ENGAGEMENT READY',
          title: `${projectedWins}개 전선 방어 예상 · 왕관 파쇄 준비 완료`,
          description: '두 전선을 지키면 승리합니다. 마지막으로 화로 집중과 각 전선 명령을 확인하세요.',
        }
      : {
          state: 'ready',
          kicker: 'DEFENCE WINDOW SECURED',
          title: `${projectedWins}개 전선 방어 예상 · 진군 가능`,
          description: `첫 왕관까지 ${4 - game.day}밤 남았습니다. 여유 전선은 완벽 방어와 추가 보급을 노려 보세요.`,
        }
  })()
  const nextRelicNight = [...RELIC_NIGHTS].find((night) => night >= game.day) ?? null
  const startedResonanceStatuses = resonanceStatuses.filter((status) => status.owned > 0)
  const activeBuildConditions = activeResonances.map((resonanceId) => {
    if (resonanceId === 'ember-pulse') {
      const ready = game.heat <= 50
      return {
        id: resonanceId,
        ready,
        state: ready ? 'triggered' : 'standby',
        kicker: ready ? 'SURVIVAL RESONANCE TRIGGERED' : 'SURVIVAL RESONANCE ARMED',
        title: ready ? `현재 온기 ${game.heat}% · 불씨의 맥박 발동` : '위기 온기에서 자동으로 대열을 지킵니다',
        description: ready
          ? '모든 전선 전투력 +10%, 승리 후 온기 손실 2 감소가 이번 교전에 적용됩니다.'
          : `온기 50% 이하에서 발동합니다. 현재 ${game.heat}%에서는 안전장치로 대기 중입니다.`,
      }
    }
    if (resonanceId === 'whiteout-sight') {
      const focusForecast = forecastLanes[focusLane]
      const ready = Boolean(focusForecast?.countered)
      const counterOrder = orderForIntent(enemies[focusLane].intent)
      return {
        id: resonanceId,
        ready,
        state: ready ? 'triggered' : 'standby',
        kicker: ready ? 'TACTICAL RESONANCE LOCKED' : `FRONT 0${focusLane + 1} · RESONANCE CONDITION`,
        title: ready
          ? `${focusLane + 1}전선 조준선 연결 · 전투력 +12%`
          : `${ORDER_META[counterOrder].name} 명령으로 조준선을 연결하세요`,
        description: ready
          ? '화로 집중 전선의 적 의도를 파훼해 백야의 조준선이 이번 교전에 발동합니다.'
          : `현재 집중 전선의 ${INTENT_META[enemies[focusLane].intent].name} 의도를 파훼하면 공명 보너스가 열립니다.`,
      }
    }
    if (resonanceId === 'threefold-cadence') {
      const ready = lineupReady && formationKindCount === 3 && tierTwoLineCount === 3
      return {
        id: resonanceId,
        ready,
        state: ready ? 'triggered' : 'standby',
        kicker: ready ? 'FORMATION RESONANCE IN CADENCE' : 'FORMATION RESONANCE CONDITION',
        title: ready
          ? '세 병과 II+ 대열 완성 · 전투력 +10%'
          : `세 병과 ${formationKindCount} / 3 · II+ ${tierTwoLineCount} / 3`,
        description: ready
          ? '세 갈래 진군가가 모든 전선에서 발동합니다.'
          : '방패·활·도끼를 하나씩, 모두 II 등급 이상으로 배치하면 공명이 발동합니다.',
      }
    }
    return {
      id: resonanceId,
      ready: true,
      state: 'triggered',
      kicker: 'SUPPLY RESONANCE ONLINE',
      title: `신호탄 ${recruitCost} · 승리 보급 추가 +10`,
      description: '끝없는 보급로가 증원 비용을 추가로 낮추고 매 승리의 회수 보급을 늘립니다.',
    }
  })
  const waitingBuildCondition = activeBuildConditions.find((condition) => !condition.ready)
  const primaryStartedResonance = startedResonanceStatuses[0] ?? null
  const currentBuildDoctrine =
    waitingBuildCondition ??
    activeBuildConditions[0] ??
    (primaryStartedResonance
      ? (() => {
          const resonance = RESONANCES[primaryStartedResonance.id]
          const missingRelic = resonance.requirements.find((relicId) => !game.relics.includes(relicId))
          return {
            id: primaryStartedResonance.id,
            ready: false,
            state: 'path',
            kicker: 'DORMANT RESONANCE PATH',
            title: `${resonance.name} · 1 / 2 각인`,
            description: missingRelic
              ? `${RELICS[missingRelic].name}을 추가하면 ${resonance.description}`
              : resonance.description,
          }
        })()
      : {
          id: null,
          ready: false,
          state: 'unbound',
          kicker: 'RELIC PATH UNBOUND',
          title: '첫 유물이 원정대의 빌드 방향을 정합니다',
          description: '유물 두 개의 조합은 생존·전술·진형·보급 중 하나의 공명을 완성합니다.',
        })
  const relicChoices =
    relicForecastActive && game.pendingRelic ? relicChoicesFor(game.day - 1, game.relics, game.runSeed) : []
  const neutralForecastCount = forecastLanes.filter((lane) => lane?.relation === 'neutral').length
  const relicChoiceInsights = relicChoices.map((relicId) => {
    const resonancePreview = resonancePreviewFor(relicId, game.relics)
    let score = resonancePreview?.completes ? 100 : resonancePreview ? 10 : 0
    let label = '장기 성장'
    let reason = RELICS[relicId].description

    if (relicId === 'living-ember') {
      score += 18 + mergeReadyPairCount * 8
      label = mergeReadyPairCount > 0 ? `합성 준비 ${mergeReadyPairCount}쌍` : '합성 생존력'
      reason =
        mergeReadyPairCount > 0
          ? '지금 가능한 합성마다 온기를 7 회복합니다.'
          : '다음 합성부터 온기 회복량을 4 높입니다.'
    } else if (relicId === 'quartermasters-knot') {
      score += 24 + (game.supplies < recruitCost * 2 ? 12 : 0)
      label = '증원 효율'
      const reducedRecruitCost = Math.max(10, recruitCost - 4)
      reason =
        reducedRecruitCost < recruitCost
          ? `다음 신호탄부터 비용이 ${recruitCost}에서 ${reducedRecruitCost}로 감소합니다.`
          : '현재는 최저 비용이며, 이후 밤·구조 규모 압박을 4만큼 상쇄합니다.'
    } else if (relicId === 'watchtower-lens') {
      score += 30
      label = '집중 돌파'
      reason = `현재 ${focusLane + 1}전선의 화로 집중 보너스를 14%p 높입니다.`
    } else if (relicId === 'winter-blood') {
      score += game.heat <= 45 ? 42 : game.heat <= 60 ? 28 : 14
      label = game.heat <= 45 ? '즉시 발동' : '위기 안전장치'
      reason =
        game.heat <= 45
          ? `현재 온기 ${game.heat}%에서 모든 전선 전투력 +20%가 즉시 적용됩니다.`
          : `온기 45% 이하에서 모든 전선 전투력 +20%가 발동합니다.`
    } else if (relicId === 'threefold-banner') {
      score += 12 + formationKindCount * 9
      label = formationKindCount === 3 ? '현재 대열 발동' : `세 병과 ${formationKindCount} / 3`
      reason =
        formationKindCount === 3
          ? '현재 진형의 세 병과가 모두 있어 모든 전선 전투력 +14%가 즉시 적용됩니다.'
          : '방패·활·도끼를 모두 배치하면 모든 전선 전투력 +14%가 적용됩니다.'
    } else if (relicId === 'salvagers-pack') {
      score += 24 + (game.supplies < 35 ? 18 : 0)
      label = '보급 회수'
      reason = `현재 보급 ${game.supplies} · 이후 모든 승리 보급이 18 증가합니다.`
    } else if (relicId === 'rime-steel') {
      score += 12 + neutralForecastCount * 13
      label = `대등 전선 ${neutralForecastCount}곳`
      reason =
        neutralForecastCount > 0
          ? `현재 대등한 ${neutralForecastCount}개 전선의 전투력이 즉시 22% 증가합니다.`
          : '대등 상성으로 배치한 전선의 전투력을 22% 높입니다.'
    } else if (relicId === 'marching-drum') {
      score += 12 + tierTwoLineCount * 11
      label = `II+ 전선 ${tierTwoLineCount}곳`
      reason =
        tierTwoLineCount > 0
          ? `현재 II 등급 이상 생존자 ${tierTwoLineCount}명의 전투력이 즉시 11% 증가합니다.`
          : 'II 등급 이상으로 성장한 생존자의 전투력을 11% 높입니다.'
    }

    if (resonancePreview?.completes) {
      const resonance = RESONANCES[resonancePreview.id]
      score += 100
      label = `${resonance.name} 완성`
      reason = `즉시 공명: ${resonance.description}`
    }

    return { relicId, score, label, reason }
  })
  const recommendedRelicId =
    [...relicChoiceInsights].sort((left, right) => right.score - left.score)[0]?.relicId ?? null
  const hasProgress = game.campaignStarted
  const runtimeState = !online ? 'offline' : standalone ? 'installed' : offlineReady ? 'ready' : 'online'
  const runtimeStateCopy =
    runtimeState === 'offline'
      ? '오프라인 실행 중'
      : runtimeState === 'installed'
        ? '앱 설치 완료'
        : runtimeState === 'ready'
          ? '오프라인 준비 완료'
          : '온라인 연결'
  const runtimeNotice = !online ? 'offline' : updateReady ? 'update' : null
  const campaignStagePending = !showTitle && phase === 'camp' && !campaignStageReady
  const activeLayer: ActiveLayer | null =
    sessionAccess !== 'active'
      ? 'session'
      : showInstallHelp
        ? 'install'
        : showArchive
          ? 'archive'
          : showSettings
            ? 'settings'
            : showExpeditionMenu
              ? 'menu'
              : showTitle
                ? 'title'
                : showGuide
                  ? 'guide'
                  : campaignStagePending
                    ? 'battle'
                    : phase === 'event'
                      ? 'event'
                      : phase === 'battling'
                        ? 'battle'
                        : phase === 'interlude'
                          ? 'interlude'
                          : phase === 'finale'
                            ? 'finale'
                            : phase === 'relic'
                              ? 'relic'
                              : phase === 'promotion'
                                ? 'promotion'
                                : phase === 'result'
                                  ? 'result'
                                  : phase === 'won' || phase === 'lost'
                                    ? 'ending'
                                    : null
  const gameIsBlocked = activeLayer !== null || phase === 'battling'
  const documentScrollLocked = gameIsBlocked || (compactViewport && mobileRosterOpen)
  const navigationGuardNeeded =
    ready &&
    sessionAccess === 'active' &&
    (!showTitle || showDifficulty || showArchive || showSettings || showExpeditionMenu || showInstallHelp)
  const activeMilestone = milestoneQueue[0] ?? null
  const activeMilestoneId = activeMilestone?.id ?? null
  const milestoneVisible =
    activeMilestone !== null &&
    sessionAccess === 'active' &&
    !showSettings &&
    !showArchive &&
    !showExpeditionMenu &&
    !showInstallHelp &&
    !showGuide &&
    !showDifficulty &&
    growthCeremony === null &&
    marchSealCeremony === null &&
    phase !== 'battling' &&
    phase !== 'result' &&
    phase !== 'interlude' &&
    phase !== 'finale' &&
    phase !== 'relic' &&
    phase !== 'promotion'

  function scheduleFrame(run: () => void) {
    const frame = window.requestAnimationFrame(() => {
      animationFrames.current.delete(frame)
      run()
    })
    animationFrames.current.add(frame)
  }

  function beginCampMutation() {
    if (campMutationInFlight.current) return false
    campMutationInFlight.current = true
    return true
  }

  function moveDragGhost(x: number, y: number) {
    dragPosition.current.x = x
    dragPosition.current.y = y
    if (dragFrame.current !== null) return
    dragFrame.current = window.requestAnimationFrame(() => {
      dragFrame.current = null
      const node = dragGhostRef.current
      if (!node) return
      const position = dragPosition.current
      node.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -60%) rotate(3deg)`
    })
  }

  function resetDragGhost() {
    if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current)
    dragFrame.current = null
    dragSession.current = null
    setDraggingUnitId(null)
  }

  const persistLatestSnapshot = useEffectEvent(() => {
    if (!ready || restoringBackup.current || sessionAccess !== 'active') return
    writeStoredValue(STORAGE_KEY, JSON.stringify(game))
    writeStoredValue(META_KEY, JSON.stringify(meta))
    writeStoredValue(SETTINGS_KEY, JSON.stringify(settings))
  })

  const armNavigationGuard = useEffectEvent(() => {
    pushNavigationHistoryGuard()
    navigationGuardArmed.current = true
  })

  const releaseNavigationGuard = useEffectEvent(() => {
    if (readNavigationHistoryMarker() !== 'guard') {
      navigationGuardArmed.current = false
      return
    }
    suppressNavigationPop.current = true
    navigationGuardArmed.current = false
    window.history.back()
  })

  const handleSystemBack = useEffectEvent((): boolean => {
    if (showInstallHelp) {
      setShowInstallHelp(false)
      return !showTitle || showArchive || showSettings || showExpeditionMenu || showDifficulty
    }
    if (showArchive) {
      closeArchive()
      return !showTitle || showInstallHelp || showSettings || showExpeditionMenu || showDifficulty
    }
    if (showSettings) {
      closeSettings()
      return !showTitle || showInstallHelp || showArchive || showExpeditionMenu || showDifficulty
    }
    if (showExpeditionMenu) {
      if (showNewCampaignConfirm) cancelDiscardCampaign()
      else closeExpeditionMenu()
      return !showTitle || showInstallHelp || showArchive || showSettings || showDifficulty
    }
    if (showTitle) {
      if (!showDifficulty) return false
      if (selectedDifficulty) {
        setSelectedDifficulty(null)
        return true
      }
      setShowDifficulty(false)
      return false
    }
    if (showGuide) {
      closeGuide()
      return true
    }
    if (mobileRosterOpen) {
      showBattlefield()
      announce('전장 지휘 화면으로 돌아갑니다.')
      return true
    }
    if (phase === 'camp') {
      openExpeditionMenu()
      return true
    }
    announce('현재 장면을 마치거나 화면의 계속·건너뛰기 명령을 선택해 주세요.')
    return true
  })

  const handleNavigationPop = useEffectEvent(() => {
    const marker = readNavigationHistoryMarker()
    if (suppressNavigationPop.current) {
      suppressNavigationPop.current = false
      navigationGuardArmed.current = marker === 'guard'
      return
    }
    if (marker === 'guard') {
      navigationGuardArmed.current = true
      if (!navigationGuardNeeded) releaseNavigationGuard()
      return
    }
    if (!navigationGuardArmed.current) return
    navigationGuardArmed.current = false
    if (handleSystemBack()) armNavigationGuard()
  })

  useEffect(() => {
    if (!('locks' in navigator)) {
      setSessionAccess('active')
      return
    }

    let disposed = false
    const queuedRequest = new AbortController()

    const holdSessionLock = async () => {
      if (disposed) return
      let releaseLock: () => void = () => undefined
      const releasePromise = new Promise<void>((resolve) => {
        releaseLock = resolve
      })
      sessionLockRelease.current = releaseLock
      setSessionAccess('active')
      await releasePromise
      if (sessionLockRelease.current === releaseLock) sessionLockRelease.current = null
    }

    const acquireSessionLock = async () => {
      try {
        let shouldQueue = false
        await navigator.locks.request(PLAY_SESSION_LOCK, { ifAvailable: true }, async (lock) => {
          if (disposed) return
          if (!lock) {
            shouldQueue = true
            setSessionAccess('blocked')
            return
          }
          await holdSessionLock()
        })
        if (disposed || !shouldQueue) return
        await navigator.locks.request(PLAY_SESSION_LOCK, { signal: queuedRequest.signal }, async (lock) => {
          if (!lock || disposed) return
          await holdSessionLock()
        })
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === 'AbortError')) return
        setSessionAccess('error')
      }
    }

    void acquireSessionLock()
    return () => {
      disposed = true
      queuedRequest.abort()
      sessionLockRelease.current?.()
      sessionLockRelease.current = null
    }
  }, [])

  const suspendRuntime = useEffectEvent(() => {
    if (!runtimeActiveRef.current) return
    runtimeActiveRef.current = false
    setRuntimeActive(false)
    persistLatestSnapshot()
    pauseRuntimeTimer(toastTimer)
    pauseRuntimeTimer(growthCeremonyTimer)
    pauseRuntimeTimer(marchSealTimer)
    pauseRuntimeTimer(milestoneDismissTimer)
    stopAudioPlayback(true)
    cancelHaptics()
    resetDragGhost()
  })

  const resumeRuntime = useEffectEvent(() => {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return
    if (runtimeActiveRef.current) return
    runtimeActiveRef.current = true
    setRuntimeActive(true)
    resetDragGhost()
    resumeRuntimeTimer(toastTimer)
    resumeRuntimeTimer(growthCeremonyTimer)
    resumeRuntimeTimer(marchSealTimer)
    resumeRuntimeTimer(milestoneDismissTimer)
    if (audioUnlocked && soundOn) startAmbience(true, soundscapeMood)
  })

  const recoverAudioFromGesture = useEffectEvent(() => {
    const context = getAudioContext()
    if (!context || context.state === 'closed') return
    if (context.state === 'running') {
      setAudioUnlocked(true)
      if (soundOn && document.visibilityState === 'visible' && document.hasFocus() && !ambientSession) {
        startAmbience(true, soundscapeMood)
      }
      return
    }
    if (audioRecoveryInFlight.current) return
    audioRecoveryInFlight.current = true
    void context
      .resume()
      .then(() => {
        if (context.state !== 'running') return
        setAudioUnlocked(true)
        if (soundOn && document.visibilityState === 'visible' && document.hasFocus()) {
          startAmbience(true, soundscapeMood)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        audioRecoveryInFlight.current = false
      })
  })

  useEffect(() => {
    if (sessionAccess !== 'active') return
    const linkedRiftCode = linkedRiftCodeForCurrentUrl()
    if (linkedRiftCode) {
      setIncomingRiftCode(linkedRiftCode)
      setSharedCode(linkedRiftCode)
    } else {
      clearLinkedRiftFromCurrentUrl()
    }
    const interruptedRestoreRecovery = recoverInterruptedBackupRestore()
    removeUnknownStoredValues()

    const storedMeta = interruptedRestoreRecovery === 'reset' ? undefined : readStoredJson(META_KEY)
    const storedGame = interruptedRestoreRecovery === 'reset' ? undefined : readStoredJson(STORAGE_KEY)
    const parsedMeta = storedMeta === undefined ? { ...INITIAL_META } : parseStoredMeta(storedMeta)
    const parsedGame = storedGame === undefined ? null : parseStoredGame(storedGame)
    const hasInvalidMeta = storedMeta !== undefined && parsedMeta === null
    const metaAchievementRepairNeeded =
      parsedMeta !== null &&
      isRecord(storedMeta) &&
      Array.isArray(storedMeta.achievements) &&
      parsedMeta.achievements.length > storedMeta.achievements.length
    const hasInvalidGame =
      (storedGame !== undefined && parsedGame === null) ||
      (parsedGame !== null &&
        (parsedMeta === null ||
          !masteryContractAvailableFor(parsedGame.masteryContract, parsedMeta) ||
          parsedGame.activeLegacy.some((legacyId) => !parsedMeta.legacy.includes(legacyId)) ||
          !gameHistoryMatches(parsedGame, parsedMeta, true)))
    const hydratedGame = hasInvalidMeta || hasInvalidGame ? null : parsedGame
    const baseHydratedMeta = hasInvalidMeta ? { ...INITIAL_META } : (parsedMeta ?? { ...INITIAL_META })
    const terminalRunMissingFromMeta =
      hydratedGame !== null &&
      hydratedGame.status !== 'playing' &&
      !baseHydratedMeta.history.some((record) => record.runId === hydratedGame.runId)
    const restoredProtocolMastery =
      hydratedGame?.status === 'won' ? protocolMasteryProgressFor(hydratedGame, true) : null
    const restoredOathChronicleAchievement =
      hydratedGame?.status === 'won' &&
      oathInterventionCountFor(hydratedGame.oath, hydratedGame.decisions) ===
        OATH_CHRONICLES[hydratedGame.oath].stages.length
        ? OATH_CHRONICLE_ACHIEVEMENTS[hydratedGame.oath]
        : null
    const restoredAchievementIds = [
      restoredProtocolMastery?.completed ? restoredProtocolMastery.achievement : null,
      restoredOathChronicleAchievement,
      terminalRunMissingFromMeta && hydratedGame
        ? ENDING_ACHIEVEMENTS[endingFor(hydratedGame, hydratedGame.status === 'won')]
        : null,
      terminalRunMissingFromMeta && hydratedGame?.status === 'won' ? 'seventh-dawn' : null,
      terminalRunMissingFromMeta && hydratedGame?.status === 'won' && hydratedGame.difficulty === 'whiteout'
        ? 'whiteout-victor'
        : null,
      terminalRunMissingFromMeta && hydratedGame?.status === 'won' && hydratedGame.mode === 'daily'
        ? 'shared-dawn'
        : null,
      terminalRunMissingFromMeta &&
      hydratedGame &&
      completedTrialsFor(hydratedGame, hydratedGame.status === 'won').length === 3
        ? 'threefold-oath'
        : null,
      terminalRunMissingFromMeta && hydratedGame && hydratedGame.bossesDefeated >= 3 ? 'crown-breaker' : null,
    ].filter((achievement): achievement is AchievementId => achievement !== null)
    const hydratedAchievements = [...new Set([...baseHydratedMeta.achievements, ...restoredAchievementIds])]
    const hydratedDiscoveredRelics = hydratedGame
      ? [...new Set([...baseHydratedMeta.discoveredRelics, ...hydratedGame.relics])]
      : baseHydratedMeta.discoveredRelics
    let hydratedMeta =
      hydratedAchievements.length > baseHydratedMeta.achievements.length ||
      hydratedDiscoveredRelics.length > baseHydratedMeta.discoveredRelics.length
        ? {
            ...baseHydratedMeta,
            achievements: hydratedAchievements,
            discoveredRelics: hydratedDiscoveredRelics,
          }
        : baseHydratedMeta
    if (terminalRunMissingFromMeta && hydratedGame) {
      const won = hydratedGame.status === 'won'
      const restoredRecord = createExpeditionRecord(hydratedGame, won)
      const restoredMasteredContract = won ? hydratedGame.masteryContract : null
      hydratedMeta = {
        ...hydratedMeta,
        embers: hydratedMeta.embers + hydratedGame.legacyReward,
        completedRuns: hydratedMeta.completedRuns + (won ? 1 : 0),
        masteredContracts:
          restoredMasteredContract && !hydratedMeta.masteredContracts.includes(restoredMasteredContract)
            ? [...hydratedMeta.masteredContracts, restoredMasteredContract]
            : hydratedMeta.masteredContracts,
        history: [restoredRecord, ...hydratedMeta.history].slice(0, MAX_HISTORY),
      }
    }

    if (hasInvalidMeta) {
      removeStoredValues(STORAGE_KEY, BATTLE_STORAGE_KEY, META_KEY, BEST_SCORE_KEY)
    } else if (hasInvalidGame) {
      removeStoredValues(STORAGE_KEY, BATTLE_STORAGE_KEY)
    }
    setMeta(hydratedMeta)
    if (!hasInvalidMeta && (hydratedMeta !== baseHydratedMeta || metaAchievementRepairNeeded)) {
      writeStoredValue(META_KEY, JSON.stringify(hydratedMeta))
    }

    if (hydratedGame) {
      setGame(hydratedGame)
      const restoredBattle = restoreSavedBattle(readStoredJson(BATTLE_STORAGE_KEY), hydratedGame)
      if (restoredBattle) {
        setBattleResult(restoredBattle)
        setFocusLane(restoredBattle.focusLane)
        setPhase('result')
      } else {
        removeStoredValues(BATTLE_STORAGE_KEY)
        setPhase(
          hydratedGame.status === 'won'
            ? 'won'
            : hydratedGame.status === 'lost'
              ? 'lost'
              : pendingPromotionFor(hydratedGame)
                ? 'promotion'
                : hydratedGame.pendingRelic
                  ? ACT_TRANSITIONS[hydratedGame.day]
                    ? 'interlude'
                    : 'relic'
                  : hydratedGame.eventResolvedForDay < hydratedGame.day
                    ? 'event'
                    : 'camp',
        )
      }
    } else {
      removeStoredValues(BATTLE_STORAGE_KEY)
    }

    const storedGuideValue = interruptedRestoreRecovery === 'reset' ? null : readStoredValue(GUIDE_KEY)
    const storedGuide = storedGuideValue === GUIDE_SEEN || storedGuideValue === GUIDE_REPLAY ? storedGuideValue : null
    if (storedGuideValue !== null && storedGuide === null) removeStoredValues(GUIDE_KEY)
    const shouldRunTutorial =
      storedGuide !== GUIDE_SEEN && (!hydratedGame || (hydratedGame.day === 1 && hydratedGame.battles === 0))
    if (!shouldRunTutorial && storedGuide === null) writeStoredValue(GUIDE_KEY, GUIDE_SEEN)
    setShowGuide(false)
    setTutorialStep(shouldRunTutorial ? (hydratedGame ? inferTutorialStep(hydratedGame) : 'merge') : null)

    const storedSettings = interruptedRestoreRecovery === 'reset' ? undefined : readStoredJson(SETTINGS_KEY)
    const parsedSettings = storedSettings === undefined ? { ...DEFAULT_SETTINGS } : parseStoredSettings(storedSettings)
    const hydratedSettings = parsedSettings ?? { ...DEFAULT_SETTINGS }
    if (storedSettings !== undefined && parsedSettings === null) removeStoredValues(SETTINGS_KEY)
    setSettings(hydratedSettings)
    applyRuntimeSettings(hydratedSettings)
    const storedBestScore = interruptedRestoreRecovery === 'reset' ? 0 : readBestScore()
    const hydratedBestScore = Math.max(storedBestScore, highestRecordedScoreFor(hydratedGame, hydratedMeta))
    setBestScore(hydratedBestScore)
    if (!hasInvalidMeta && hydratedBestScore > storedBestScore) {
      writeStoredValue(BEST_SCORE_KEY, String(hydratedBestScore))
    }
    setReady(true)
    if (interruptedRestoreRecovery === 'completed') {
      announce('중단됐던 백업 복원을 안전하게 완료했습니다.')
    } else if (interruptedRestoreRecovery === 'reset') {
      announce('완료되지 않은 복원 기록을 정리하고 새 기록으로 시작합니다.')
    } else if (terminalRunMissingFromMeta) {
      announce('완결 직후 누락된 원정과 보상을 체크포인트에서 복구했습니다.')
    } else if (hasInvalidGame && !hasInvalidMeta) {
      announce('현재 규칙과 맞지 않는 원정은 정리하고 유산·업적·최고 기록은 보존했습니다.')
    }
  }, [sessionAccess])

  useEffect(() => {
    if (sessionAccess !== 'active') return
    let disposed = false
    if (!localStorageAvailable()) {
      setStorageProtection('unavailable')
      return
    }
    if (typeof navigator.storage?.persisted !== 'function') {
      setStorageProtection('standard')
      return
    }
    void navigator.storage
      .persisted()
      .then((persistent) => {
        if (!disposed) setStorageProtection(persistent ? 'persistent' : 'standard')
      })
      .catch(() => {
        if (!disposed) setStorageProtection('standard')
      })
    return () => {
      disposed = true
    }
  }, [sessionAccess])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px), (max-height: 520px) and (pointer: coarse)')
    const syncViewport = () => setCompactViewport(query.matches)
    syncViewport()
    query.addEventListener('change', syncViewport)
    return () => query.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    const recoverAudio = () => recoverAudioFromGesture()
    window.addEventListener('pointerdown', recoverAudio, { capture: true, passive: true })
    window.addEventListener('keydown', recoverAudio, true)
    return () => {
      window.removeEventListener('pointerdown', recoverAudio, true)
      window.removeEventListener('keydown', recoverAudio, true)
    }
  }, [])

  useEffect(() => {
    let disposed = false
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const syncDisplayMode = () => {
      setStandalone(displayMode.matches || Boolean((navigator as StandaloneNavigator).standalone))
    }
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstallPrompt(null)
      setShowInstallHelp(false)
      setStandalone(true)
    }

    setOnline(navigator.onLine)
    syncDisplayMode()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode.addEventListener('change', syncDisplayMode)

    let serviceWorkerRegistration: ServiceWorkerRegistration | null = null
    let installingServiceWorker: ServiceWorker | null = null
    let removeControllerListener: (() => void) | null = null
    let removeUpdateFoundListener: (() => void) | null = null
    let removeInstallingStateListener: (() => void) | null = null
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      let hadController = Boolean(navigator.serviceWorker.controller)
      const handleControllerChange = () => {
        if (disposed) return
        setOfflineReady(true)
        waitingServiceWorker.current = null
        setUpdateReady(false)
        applyingUpdate.current = false
        if (hadController && !reloadingAfterControllerChange.current) {
          reloadingAfterControllerChange.current = true
          persistLatestSnapshot()
          window.location.reload()
          return
        }
        hadController = true
      }
      const markUpdateReady = (worker: ServiceWorker | null) => {
        if (disposed || !worker || !navigator.serviceWorker.controller) return
        waitingServiceWorker.current = worker
        setUpdateReady(true)
      }
      const watchInstallingWorker = () => {
        removeInstallingStateListener?.()
        installingServiceWorker = serviceWorkerRegistration?.installing ?? null
        if (!installingServiceWorker) {
          removeInstallingStateListener = null
          return
        }
        const worker = installingServiceWorker
        const handleStateChange = () => {
          if (worker.state === 'installed') {
            markUpdateReady(serviceWorkerRegistration?.waiting ?? worker)
          } else if (worker.state === 'redundant' && waitingServiceWorker.current === worker) {
            waitingServiceWorker.current = null
            setUpdateReady(false)
          }
        }
        worker.addEventListener('statechange', handleStateChange)
        removeInstallingStateListener = () => worker.removeEventListener('statechange', handleStateChange)
        handleStateChange()
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      removeControllerListener = () =>
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)

      void navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          serviceWorkerRegistration = registration
          if (disposed) return registration
          setOfflineReady(Boolean(registration.active || navigator.serviceWorker.controller))
          markUpdateReady(registration.waiting)
          registration.addEventListener('updatefound', watchInstallingWorker)
          removeUpdateFoundListener = () => registration.removeEventListener('updatefound', watchInstallingWorker)
          watchInstallingWorker()
          void registration.update().catch(() => undefined)
          return navigator.serviceWorker.ready
        })
        .then((registration) => {
          if (!disposed) setOfflineReady(Boolean(registration.active))
        })
        .catch(() => undefined)
    }

    return () => {
      disposed = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode.removeEventListener('change', syncDisplayMode)
      removeControllerListener?.()
      removeUpdateFoundListener?.()
      removeInstallingStateListener?.()
    }
  }, [])

  useEffect(() => {
    if (!ready || sessionAccess !== 'active') return
    if (!writeStoredValue(STORAGE_KEY, JSON.stringify(game)) && !storageWarningShown.current) {
      storageWarningShown.current = true
      announce('이 브라우저에서는 원정 기록을 저장할 수 없습니다.')
    }
  }, [game, ready, sessionAccess])

  useEffect(() => {
    if (!ready || sessionAccess !== 'active') return
    if (!writeStoredValue(META_KEY, JSON.stringify(meta)) && !storageWarningShown.current) {
      storageWarningShown.current = true
      announce('이 브라우저에서는 유산 기록을 저장할 수 없습니다.')
    }
  }, [meta, ready, sessionAccess])

  useEffect(() => {
    if (!ready || showTitle || !runtimeActive) return
    return preloadGameplayStage(phase, game.day >= MAX_NIGHTS - 1)
  }, [game.day, phase, ready, runtimeActive, showTitle])

  useEffect(() => {
    if (!ready || sessionAccess !== 'active') return
    prepareNavigationHistoryBase()
    navigationGuardArmed.current = readNavigationHistoryMarker() === 'guard'
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const onPopState = () => handleNavigationPop()
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [ready, sessionAccess])

  useEffect(() => {
    if (!ready || sessionAccess !== 'active') return
    if (navigationGuardNeeded) armNavigationGuard()
    else releaseNavigationGuard()
  }, [navigationGuardNeeded, ready, sessionAccess])

  useEffect(() => {
    purchasingLegacy.current = false
  }, [meta])

  useEffect(() => {
    campMutationInFlight.current = false
  }, [focusLane, game])

  useEffect(() => {
    if (phase === 'camp') battleLaunchInFlight.current = false
  }, [phase])

  useEffect(() => {
    if (campUndo && phase !== 'camp' && phase !== 'promotion') setCampUndo(null)
  }, [campUndo, phase])

  useEffect(() => {
    if (!documentScrollLocked) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previousOverflow
    }
  }, [documentScrollLocked])

  useEffect(() => {
    if (!activeLayer) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector =
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    const elementIsVisible = (element: HTMLElement) =>
      !element.hidden && !element.closest('[inert], [aria-hidden="true"]') && element.getClientRects().length > 0
    const focusableElements = (container: HTMLElement) =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(elementIsVisible)
    let scope: HTMLElement | null = null
    let focusFirst: number | null = null
    let focusObserver: MutationObserver | null = null
    const currentScope = () => document.querySelector<HTMLElement>(`[data-focus-scope="${activeLayer}"]`)
    const focusCurrentScope = () => {
      const nextScope = currentScope()
      if (!nextScope || nextScope === scope) return
      scope = nextScope
      if (focusFirst !== null) window.clearTimeout(focusFirst)
      focusFirst = window.setTimeout(() => {
        const focusable = focusableElements(nextScope)
        const preferred = Array.from(nextScope.querySelectorAll<HTMLElement>('[data-autofocus]')).find(
          (element) => elementIsVisible(element) && (element.matches(focusableSelector) || element.tabIndex === -1),
        )
        const first = preferred ?? focusable[0]
        ;(first ?? nextScope).focus({ preventScroll: true })
      }, 0)
      if (!nextScope.classList.contains('deferred-game-layer')) focusObserver?.disconnect()
    }
    focusCurrentScope()
    const initialScope = currentScope()
    if (!initialScope || initialScope.classList.contains('deferred-game-layer')) {
      focusObserver = new MutationObserver(focusCurrentScope)
      focusObserver.observe(document.body, { childList: true, subtree: true })
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const visibleScope = currentScope()
      if (!visibleScope) return
      if (event.key === 'Escape') {
        let handled = true
        if (activeLayer === 'install') setShowInstallHelp(false)
        else if (activeLayer === 'archive') closeArchive()
        else if (activeLayer === 'settings') closeSettings()
        else if (activeLayer === 'menu') {
          if (showNewCampaignConfirm) cancelDiscardCampaign()
          else closeExpeditionMenu()
        } else if (activeLayer === 'guide') closeGuide()
        else if (activeLayer === 'title' && showDifficulty) {
          if (selectedDifficulty) setSelectedDifficulty(null)
          else setShowDifficulty(false)
        } else handled = false
        if (handled) {
          event.preventDefault()
          event.stopPropagation()
        }
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusableElements(visibleScope)
      if (focusable.length === 0) {
        event.preventDefault()
        visibleScope.focus({ preventScroll: true })
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      if (focusFirst !== null) window.clearTimeout(focusFirst)
      focusObserver?.disconnect()
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [activeLayer, ready, selectedDifficulty, showDifficulty, showNewCampaignConfirm])

  useEffect(() => {
    if (!ready || showTitle || phase !== 'camp') return
    const focusTimer = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      const primaryAction = document.querySelector<HTMLElement>('.primary-action:not(:disabled)')
      primaryAction?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(focusTimer)
  }, [game.day, phase, ready, showTitle])

  const handleGlobalKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target instanceof HTMLElement ? event.target : null
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    if (typing) return

    const allowsUtilityShortcut = activeLayer === null || activeLayer === 'title'
    if (event.code === 'KeyM' && allowsUtilityShortcut) {
      event.preventDefault()
      toggleSound()
      return
    }
    if (event.code === 'KeyO' && allowsUtilityShortcut) {
      event.preventDefault()
      openSettings()
      return
    }
    if (showTitle || activeLayer !== null || phase !== 'camp') return

    if (event.key === 'Escape' || event.code === 'KeyP') {
      event.preventDefault()
      if (event.key === 'Escape' && mobileRosterOpen) {
        showBattlefield()
        announce('전장 지휘 화면으로 돌아갑니다.')
      } else {
        openExpeditionMenu()
      }
      return
    }

    if (event.code === 'KeyZ' && campUndo) {
      event.preventDefault()
      undoCampAction()
      return
    }

    const focusKeyLane = FOCUS_LANE_BY_KEY[event.code]
    if (focusKeyLane !== undefined) {
      event.preventDefault()
      chooseFocusLane(focusKeyLane)
      return
    }

    const orderKeyLane = ORDER_LANE_BY_KEY[event.code]
    if (orderKeyLane !== undefined) {
      event.preventDefault()
      const currentOrder = game.orders[orderKeyLane]
      const nextOrder =
        commandSpent > commandLimit && currentOrder !== 'hold'
          ? 'hold'
          : BATTLE_ORDER_SEQUENCE[(BATTLE_ORDER_SEQUENCE.indexOf(currentOrder) + 1) % BATTLE_ORDER_SEQUENCE.length]
      chooseOrder(orderKeyLane, nextOrder)
      return
    }

    if (event.code === 'KeyA') {
      event.preventDefault()
      if (tacticalAdjustment) applyTacticalAdjustment()
      else if (tacticalRehearsal) announce(`전술 모의 · ${tacticalRehearsal.title}`)
      return
    }

    if (event.code === 'KeyR') {
      event.preventDefault()
      if (compactViewport) {
        if (mobileRosterOpen) showBattlefield()
        else showMobileRoster()
        announce(mobileRosterOpen ? '전장 지휘 화면으로 돌아갑니다.' : '생존자 대기소를 펼쳤습니다.')
      } else {
        const rosterAction = document.querySelector<HTMLElement>('.camp-panel button:not(:disabled)')
        const reducedMotion =
          settings.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        rosterAction?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
        rosterAction?.focus({ preventScroll: true })
        playSound('select', soundOn)
        announce('생존자 대기소로 이동했습니다.')
      }
      return
    }

    if (event.code === 'Space' && !target?.closest('button, a, [role="button"]')) {
      event.preventDefault()
      startBattle()
    }
  })

  useEffect(() => {
    if (!ready) return
    const onKeyDown = (event: KeyboardEvent) => handleGlobalKeyDown(event)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [ready])

  useEffect(() => {
    if (audioUnlocked && soundOn && document.visibilityState === 'visible' && document.hasFocus()) {
      startAmbience(true, soundscapeMood)
    } else stopAudioPlayback()
  }, [audioUnlocked, soundOn, soundscapeMood])

  useEffect(() => {
    const syncRuntimeActivity = () => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) suspendRuntime()
      else resumeRuntime()
    }
    const onVisibilityChange = () => syncRuntimeActivity()
    const onPageHide = () => suspendRuntime()
    const onPageShow = () => {
      setOnline(navigator.onLine)
      syncRuntimeActivity()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('freeze', onPageHide)
    document.addEventListener('resume', syncRuntimeActivity)
    window.addEventListener('blur', onPageHide)
    window.addEventListener('focus', syncRuntimeActivity)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    syncRuntimeActivity()
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('freeze', onPageHide)
      document.removeEventListener('resume', syncRuntimeActivity)
      window.removeEventListener('blur', onPageHide)
      window.removeEventListener('focus', syncRuntimeActivity)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  useEffect(() => {
    if (!activeMilestoneId || !milestoneVisible) return
    if (milestoneSoundId.current !== activeMilestoneId) {
      milestoneSoundId.current = activeMilestoneId
      playSound('milestone', soundOn)
      vibrate([18, 32, 26, 38, 42])
    }

    const dismissCurrent = () => {
      setMilestoneQueue((current) => (current[0]?.id === activeMilestoneId ? current.slice(1) : current))
    }
    const displayDuration = settings.battlePace === 'swift' ? 2800 : 4800
    startRuntimeTimer(milestoneDismissTimer, displayDuration, dismissCurrent)
    return () => {
      clearRuntimeTimer(milestoneDismissTimer)
    }
  }, [activeMilestoneId, milestoneVisible, settings.battlePace])

  useEffect(() => {
    return () => {
      for (const frame of animationFrames.current) window.cancelAnimationFrame(frame)
      animationFrames.current.clear()
      if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current)
      clearRuntimeTimer(toastTimer)
      clearRuntimeTimer(growthCeremonyTimer)
      clearRuntimeTimer(marchSealTimer)
      clearRuntimeTimer(milestoneDismissTimer)
      stopAudioPlayback(true)
      cancelHaptics()
    }
  }, [])

  function announce(message: string) {
    setToast(message)
    startRuntimeTimer(toastTimer, 2400, () => setToast(''))
  }

  function enqueueMilestones(notices: MilestoneNotice[]) {
    const fresh = notices.filter((notice) => {
      if (queuedMilestoneIds.current.has(notice.id)) return false
      queuedMilestoneIds.current.add(notice.id)
      return true
    })
    if (fresh.length > 0) setMilestoneQueue((current) => [...current, ...fresh])
  }

  function dismissActiveMilestone() {
    if (!activeMilestoneId) return
    setMilestoneQueue((current) => (current[0]?.id === activeMilestoneId ? current.slice(1) : current))
    playSound('select', soundOn)
  }

  function dismissGrowthCeremony() {
    clearRuntimeTimer(growthCeremonyTimer)
    setGrowthCeremony(null)
  }

  function dismissMarchSealCeremony() {
    clearRuntimeTimer(marchSealTimer)
    setMarchSealCeremony(null)
  }

  function enterGame() {
    playSound('select', soundOn)
    if (hasProgress) {
      preloadPhaseLayer(phase, game.day >= MAX_NIGHTS - 1)
      setShowTitle(false)
      return
    }
    setSelectedDifficulty(null)
    setSetupMode('standard')
    setSelectedMasteryContract(null)
    setSharedCode('')
    setShowDifficulty(true)
  }

  function openIncomingRiftSetup(code: string) {
    setIncomingRiftCode(null)
    setPendingReplacementRiftCode(null)
    setSharedCode(code)
    setSetupMode('shared')
    setSelectedMasteryContract(null)
    setSelectedDifficulty(null)
    setShowDifficulty(true)
    setShowTitle(true)
    clearLinkedRiftFromCurrentUrl()
    playSound('select', soundOn)
    announce(`공유 균열 ${code}를 불러왔습니다. 위험도와 서약을 선택하세요.`)
  }

  function prepareIncomingRift() {
    if (!incomingRiftCode) return
    if (!hasProgress) {
      openIncomingRiftSetup(incomingRiftCode)
      return
    }
    preloadExpeditionMenu()
    setPendingReplacementRiftCode(incomingRiftCode)
    setShowNewCampaignConfirm(true)
    setShowExpeditionMenu(true)
    playSound('select', soundOn)
    announce('현재 체크포인트를 지우기 전에 공유 균열 전환을 다시 확인합니다.')
  }

  function dismissIncomingRift() {
    if (!incomingRiftCode) return
    const dismissedCode = incomingRiftCode
    setIncomingRiftCode(null)
    setPendingReplacementRiftCode(null)
    setSharedCode((current) => (current === dismissedCode ? '' : current))
    clearLinkedRiftFromCurrentUrl()
    playSound('select', soundOn)
    announce(`공유 균열 ${dismissedCode} 초대를 닫았습니다.`)
  }

  async function installGame() {
    const prompt = installPrompt
    if (!prompt || installInFlight.current) return
    installInFlight.current = true
    setInstallPending(true)
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      setInstallPrompt(null)
      announce(choice.outcome === 'accepted' ? 'Emberhold 설치를 시작합니다.' : '설치는 언제든 다시 선택할 수 있어요.')
    } catch {
      setInstallPrompt(null)
      preloadHelpDialogs()
      setShowInstallHelp(true)
      announce('설치 요청을 열지 못했습니다. 이 기기의 설치 방법을 안내합니다.')
    } finally {
      installInFlight.current = false
      setInstallPending(false)
    }
  }

  function retrySessionAccess() {
    window.location.reload()
  }

  function reloadUpdatedGame() {
    if (applyingUpdate.current) return
    const worker = waitingServiceWorker.current
    if (!worker) {
      setUpdateReady(false)
      announce('새 빌드의 준비 상태를 다시 확인합니다.')
      return
    }
    const snapshotStored = [
      writeStoredValue(STORAGE_KEY, JSON.stringify(game)),
      writeStoredValue(META_KEY, JSON.stringify(meta)),
      writeStoredValue(SETTINGS_KEY, JSON.stringify(settings)),
    ].every(Boolean)
    if (!snapshotStored) {
      storageWarningShown.current = true
      announce('체크포인트를 저장할 수 없어 업데이트를 중단했습니다.')
      return
    }

    applyingUpdate.current = true
    try {
      worker.postMessage({ type: 'SKIP_WAITING' })
      setUpdateReady(false)
      announce('체크포인트를 보존했습니다. 최신 빌드로 전환합니다.')
    } catch {
      applyingUpdate.current = false
      announce('새 빌드를 적용하지 못했습니다. 현재 플레이는 그대로 유지됩니다.')
    }
  }

  function persistSettings(nextSettings: GameSettings) {
    setSettings(nextSettings)
    applyRuntimeSettings(nextSettings)
    if (!writeStoredValue(SETTINGS_KEY, JSON.stringify(nextSettings)) && !storageWarningShown.current) {
      storageWarningShown.current = true
      announce('이 브라우저에서는 설정을 저장할 수 없습니다.')
    }
  }

  function updateSettings(patch: Partial<GameSettings>) {
    persistSettings({ ...settings, ...patch })
  }

  function toggleSound() {
    const next = !soundOn
    persistSettings({ ...settings, sound: next })
    playSound('select', next)
  }

  function openSettings() {
    preloadSettingsDialog()
    setShowSettings(true)
    playSound('select', soundOn)
  }

  function closeSettings() {
    setShowSettings(false)
    playSound('select', soundOn)
  }

  function resetSettings() {
    const nextSettings = { ...DEFAULT_SETTINGS }
    persistSettings(nextSettings)
    playSound('select', nextSettings.sound)
    announce('화면·사운드·조작 설정을 기본값으로 되돌렸습니다.')
  }

  function toggleHaptics() {
    const next = !settings.haptics
    persistSettings({ ...settings, haptics: next })
    if (next) vibrate([14, 24, 20])
    playSound('select', soundOn)
  }

  async function requestPersistentStorage() {
    if (storageRequestInFlight.current) return
    if (storageProtection === 'unavailable') {
      announce('이 브라우저에서는 기기 저장소를 사용할 수 없습니다.')
      return
    }
    if (typeof navigator.storage?.persist !== 'function') {
      setStorageProtection('standard')
      announce('이 브라우저는 자동 정리 제외 요청을 지원하지 않습니다. 백업 파일을 함께 보관해 주세요.')
      return
    }
    storageRequestInFlight.current = true
    setStorageRequestPending(true)
    setStorageProtection('checking')
    try {
      const persistent = await navigator.storage.persist()
      setStorageProtection(persistent ? 'persistent' : 'standard')
      announce(
        persistent
          ? '이 기기의 게임 기록 보호가 강화됐습니다.'
          : '브라우저가 보호 요청을 허용하지 않았습니다. 백업 파일로 기록을 보관할 수 있습니다.',
      )
    } catch {
      setStorageProtection('standard')
      announce('기록 보호 상태를 바꾸지 못했습니다. 현재 저장과 백업 기능은 계속 사용할 수 있습니다.')
    } finally {
      storageRequestInFlight.current = false
      setStorageRequestPending(false)
    }
  }

  function exportGameBackup() {
    const storedGuide = readStoredValue(GUIDE_KEY)
    const backup: GameBackup = {
      game,
      meta,
      settings,
      bestScore,
      guide: storedGuide === GUIDE_SEEN || storedGuide === GUIDE_REPLAY ? storedGuide : null,
    }
    const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `emberhold-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    playSound('select', soundOn)
    announce('현재 원정과 유산 기록을 백업 파일로 저장했습니다.')
  }

  async function restoreGameBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    if (restoringBackup.current) {
      input.value = ''
      return
    }
    restoringBackup.current = true
    setRestorePending(true)
    let reloadScheduled = false
    try {
      if (file.size > 1_000_000) throw new Error('Backup file is too large.')
      const backup = parseGameBackup(JSON.parse(await file.text()))
      if (!backup) {
        announce('현재 데이터 형식과 일치하지 않는 백업입니다. 기존 기록은 그대로 유지됩니다.')
        return
      }
      if (!localStorageAvailable() || !replaceStoredBackup(backup)) {
        setStorageProtection('unavailable')
        announce('이 기기에 백업을 복원할 수 없습니다. 기존 기록은 그대로 유지됩니다.')
        return
      }
      reloadScheduled = true
      playSound('relic', soundOn)
      announce('백업 검증과 교체를 마쳤습니다. 복원된 기록을 불러옵니다.')
      window.setTimeout(() => window.location.reload(), 180)
    } catch {
      announce('백업 파일을 읽지 못했습니다. 기존 기록은 그대로 유지됩니다.')
    } finally {
      input.value = ''
      if (!reloadScheduled) {
        restoringBackup.current = false
        setRestorePending(false)
      }
    }
  }

  function openExpeditionMenu() {
    if (showTitle || phase !== 'camp') return
    preloadExpeditionMenu()
    setPendingReplacementRiftCode(null)
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(true)
    playSound('select', soundOn)
  }

  function closeExpeditionMenu() {
    setPendingReplacementRiftCode(null)
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(false)
    playSound('select', soundOn)
  }

  function openSettingsFromMenu() {
    preloadSettingsDialog()
    setPendingReplacementRiftCode(null)
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(false)
    setShowSettings(true)
    playSound('select', soundOn)
  }

  function askToDiscardCurrentCampaign() {
    preloadExpeditionMenu()
    setPendingReplacementRiftCode(null)
    setShowNewCampaignConfirm(true)
    setShowExpeditionMenu(true)
    playSound('select', soundOn)
  }

  function cancelDiscardCampaign() {
    setPendingReplacementRiftCode(null)
    setShowNewCampaignConfirm(false)
    if (showTitle) setShowExpeditionMenu(false)
    playSound('select', soundOn)
  }

  function returnToTitle() {
    writeStoredValue(STORAGE_KEY, JSON.stringify(game))
    writeStoredValue(META_KEY, JSON.stringify(meta))
    setRiskDepartureConfirmation(null)
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(false)
    setShowDifficulty(false)
    setSelectedDifficulty(null)
    setMobileRosterOpen(false)
    setSelectedUnitId(null)
    setShowTitle(true)
    playSound('select', soundOn)
  }

  function prepareNextChallenge() {
    setRiskDepartureConfirmation(null)
    setIncomingRiftCode(null)
    setPendingReplacementRiftCode(null)
    setPendingLegacyPurchase(null)
    clearLinkedRiftFromCurrentUrl()
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(false)
    setShowArchive(false)
    setMobileRosterOpen(false)
    setSelectedDifficulty(nextChallengeDifficulty)
    setSetupMode(game.mode)
    setSelectedMasteryContract(game.mode === 'standard' ? game.masteryContract : null)
    setSharedCode(game.mode === 'shared' ? runCodeFor(game.runSeed) : '')
    setShowTitle(true)
    setShowDifficulty(true)
    scheduleFrame(() => {
      playSound('select', soundOn)
      vibrate([12, 20, 28])
    })
    announce(
      `${DIFFICULTIES[nextChallengeDifficulty].name} · ${nextWinningEndingId ? `${ENDINGS[nextWinningEndingId].title}을 향할` : '다음 원정의'} 서약을 선택하세요.`,
    )
  }

  function discardCurrentCampaign() {
    const replacementRiftCode = pendingReplacementRiftCode
    const freshGame = createInitialGame(
      'expedition',
      'hearthkeepers',
      'standard',
      1,
      createUniqueRunId(meta),
      meta,
      false,
    )
    removeStoredValues(BATTLE_STORAGE_KEY)
    writeStoredValue(STORAGE_KEY, JSON.stringify(freshGame))
    setGame(freshGame)
    setPhase('event')
    setFocusLane(0)
    setBattleResult(null)
    setRiskDepartureConfirmation(null)
    setMilestoneQueue([])
    setSelectedUnitId(null)
    setMobileRosterOpen(false)
    setTutorialStep(null)
    setIncomingRiftCode(null)
    setPendingReplacementRiftCode(null)
    setSetupMode(replacementRiftCode ? 'shared' : 'standard')
    setSelectedMasteryContract(null)
    setSharedCode(replacementRiftCode ?? '')
    setSelectedDifficulty(null)
    setShowNewCampaignConfirm(false)
    setShowExpeditionMenu(false)
    setShowDifficulty(true)
    setShowTitle(true)
    campMutationInFlight.current = false
    battleLaunchInFlight.current = false
    resolvingBattle.current = false
    resolvingChoice.current = null
    clearLinkedRiftFromCurrentUrl()
    playSound('fire', soundOn)
    announce(
      replacementRiftCode
        ? `현재 원정 기록을 정리하고 공유 균열 ${replacementRiftCode}를 준비했습니다. 위험도와 서약을 선택하세요.`
        : '현재 원정 기록을 정리했습니다. 유산과 업적은 그대로 남아 있습니다.',
    )
  }

  function closeGuide() {
    playSound('select', soundOn)
    setShowGuide(false)
  }

  function openGuide() {
    preloadHelpDialogs()
    setShowGuide(true)
  }

  function finishTutorial(message = '현장 훈련 완료 · 이제부터 판단은 원정대장에게 달렸습니다.') {
    setTutorialStep(null)
    writeStoredValue(GUIDE_KEY, GUIDE_SEEN)
    announce(message)
  }

  function skipTutorial() {
    playSound('select', soundOn)
    finishTutorial('현장 훈련을 건너뛰었습니다. ? 참고서에서 현재 또는 다음 원정의 훈련을 다시 열 수 있어요.')
  }

  function recoverTutorial() {
    playSound('select', soundOn)
    setShowGuide(false)
    if (tutorialStep) {
      focusTutorialTarget()
      announce(`현장 훈련 ${tutorialIndex}/5 단계로 돌아갑니다.`)
      return
    }
    if (game.status === 'playing' && game.day === 1 && game.battles === 0) {
      const restoredStep = inferTutorialStep(game)
      removeStoredValues(GUIDE_KEY)
      setTutorialStep(restoredStep)
      if (phase === 'camp' && restoredStep === 'merge') setMobileRosterOpen(true)
      announce(
        phase === 'camp'
          ? `현재 대열에서 현장 훈련 ${TUTORIAL_ORDER.indexOf(restoredStep) + 1}/5 단계를 다시 시작합니다.`
          : '첫 결단을 마치면 현재 대열에 맞는 현장 훈련이 시작됩니다.',
      )
      return
    }
    const queued = writeStoredValue(GUIDE_KEY, GUIDE_REPLAY)
    announce(
      queued
        ? '현재 원정은 유지합니다. 다음 새 원정의 첫 캠프에서 현장 훈련을 다시 시작합니다.'
        : '이 실행 중 다음 새 원정에서 현장 훈련을 다시 시작합니다.',
    )
  }

  function focusTutorialTarget() {
    if (!tutorialStep) return
    const fallbackTargets: Record<TutorialStep, string> = {
      merge: '.camp-panel',
      deploy: '.player-line',
      orders: '.orders-control',
      focus: '.focus-control',
      battle: '.battle-action',
    }
    let targetSelector = fallbackTargets[tutorialStep]
    let openRoster = tutorialStep === 'merge'
    if (tutorialStep === 'orders') {
      targetSelector = ".orders-control button[data-counter='true']:not(.is-active)"
    }
    if (tutorialStep === 'focus') {
      targetSelector =
        tutorialRecommendedFocusWins >= REQUIRED_LANE_WINS
          ? ".focus-buttons button[data-tutorial-recommended='true']"
          : '.orders-control'
    }
    if (tutorialStep === 'battle') {
      if (!lineupReady) {
        targetSelector = '.camp-panel'
        openRoster = true
      } else if (commandSpent > commandLimit) {
        targetSelector = '.orders-control'
      } else if (!projectedBattleVictory) {
        targetSelector = '.focus-control'
      }
    }
    setMobileRosterOpen(openRoster)
    scheduleFrame(() => {
      const target =
        document.querySelector<HTMLElement>(targetSelector) ??
        document.querySelector<HTMLElement>(fallbackTargets[tutorialStep])
      const reducedMotion =
        settings.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
    })
  }

  function showBattlefield() {
    setMobileRosterOpen(false)
    playSound('select', soundOn)
    scheduleFrame(() => {
      document.querySelector<HTMLElement>('.battle-panel')?.scrollIntoView({ block: 'start' })
      if (compactViewport) {
        document.querySelector<HTMLButtonElement>('.mobile-command-dock > button')?.focus({ preventScroll: true })
      }
    })
  }

  function showMobileRoster() {
    setMobileRosterOpen(true)
    scheduleFrame(() => {
      document.querySelector<HTMLButtonElement>('#mobile-roster-sheet .mobile-sheet-close')?.focus({
        preventScroll: true,
      })
    })
    playSound('select', soundOn)
  }

  function clearDeploymentSelection() {
    setSelectedUnitId(null)
    playSound('select', soundOn)
    announce('배치 모의를 닫았습니다. 현재 대열을 유지합니다.')
  }

  function quickDeploySelectedUnit(lane: number) {
    if (!selectedUnit || phase !== 'camp') return
    if (!deployUnit(lane, selectedUnit.id)) return
    setMobileRosterOpen(false)
    scheduleFrame(() => {
      const laneButton = document.querySelector<HTMLButtonElement>(`.lineup-slot[data-lane-index="${lane}"]`)
      laneButton?.scrollIntoView({ block: 'center' })
      laneButton?.focus({ preventScroll: true })
    })
  }

  function openArchive(tab: ArchiveTab) {
    preloadArchiveDialog()
    const endingRewardHandoff = tab === 'legacy' && game.status !== 'playing'
    setPendingLegacyPurchase(null)
    setArchiveTab(tab)
    setShowArchive(true)
    scheduleFrame(() => {
      playSound(endingRewardHandoff ? 'relic' : 'select', soundOn)
      if (endingRewardHandoff) vibrate([12, 18, 26])
    })
  }

  function closeArchive() {
    setPendingLegacyPurchase(null)
    setShowArchive(false)
    playSound('select', soundOn)
  }

  function commitMetaProgress(ids: AchievementId[], emberReward = 0, completedRun = false, record?: ExpeditionRecord) {
    const fresh = ids.filter((id) => !meta.achievements.includes(id))
    const masteredContract = record?.won ? record.masteryContract : null
    const freshMasteredContract =
      masteredContract && !meta.masteredContracts.includes(masteredContract) ? masteredContract : null
    if (fresh.length === 0 && emberReward === 0 && !completedRun && !record && !freshMasteredContract) return fresh
    const nextMeta: MetaState = {
      ...meta,
      embers: meta.embers + emberReward,
      completedRuns: meta.completedRuns + (completedRun ? 1 : 0),
      masteredContracts: freshMasteredContract
        ? [...meta.masteredContracts, freshMasteredContract]
        : meta.masteredContracts,
      achievements: [...new Set([...meta.achievements, ...fresh])],
      history: record
        ? [record, ...meta.history.filter((entry) => entry.runId !== record.runId)].slice(0, MAX_HISTORY)
        : meta.history,
    }
    const legacyMasteryMilestone = legacyMasteryMilestoneFor(meta, nextMeta)
    writeStoredValue(META_KEY, JSON.stringify(nextMeta))
    setMeta(nextMeta)
    enqueueMilestones([
      ...fresh.map(achievementMilestone),
      ...(freshMasteredContract ? [masteryContractMilestone(freshMasteredContract)] : []),
      ...(legacyMasteryMilestone ? [legacyMasteryMilestone] : []),
    ])
    return fresh
  }

  function purchaseLegacy(legacyId: LegacyId) {
    const upgrade = LEGACY_UPGRADES[legacyId]
    if (meta.legacy.includes(legacyId) || purchasingLegacy.current) return
    if (meta.embers < upgrade.cost) {
      announce(`유산 불씨가 ${upgrade.cost - meta.embers} 부족합니다.`)
      return
    }
    purchasingLegacy.current = true
    setPendingLegacyPurchase(null)
    const nextMeta: MetaState = {
      ...meta,
      embers: meta.embers - upgrade.cost,
      legacy: [...meta.legacy, legacyId],
    }
    const legacyMasteryMilestone = legacyMasteryMilestoneFor(meta, nextMeta)
    writeStoredValue(META_KEY, JSON.stringify(nextMeta))
    setMeta(nextMeta)
    enqueueMilestones([
      {
        id: `legacy-${legacyId}`,
        kind: 'legacy',
        glyph: upgrade.glyph,
        kicker: 'LEGACY INHERITED',
        title: upgrade.name,
        description: upgrade.description,
        detail: `유산 불씨 ${upgrade.cost} 사용 · 다음 원정부터 적용`,
      },
      ...(legacyMasteryMilestone ? [legacyMasteryMilestone] : []),
    ])
  }

  function requestLegacyPurchase(legacyId: LegacyId) {
    const upgrade = LEGACY_UPGRADES[legacyId]
    if (meta.legacy.includes(legacyId) || purchasingLegacy.current) return
    if (meta.embers < upgrade.cost) {
      announce(`유산 불씨가 ${upgrade.cost - meta.embers} 부족합니다.`)
      return
    }
    setPendingLegacyPurchase(legacyId)
    playSound('select', soundOn)
    announce(`${upgrade.name} 계승 비용과 남은 불씨를 확인하세요.`)
    scheduleFrame(() => {
      document.querySelector<HTMLButtonElement>('.legacy-purchase-confirm')?.focus({ preventScroll: true })
    })
  }

  function cancelLegacyPurchase() {
    setPendingLegacyPurchase(null)
    playSound('select', soundOn)
    announce('유산 계승을 취소했습니다.')
  }

  function confirmLegacyPurchase() {
    if (!pendingLegacyPurchase) return
    purchaseLegacy(pendingLegacyPurchase)
  }

  function startCampaign(
    difficulty: Difficulty,
    oath: OathId,
    mode: RunMode,
    requestedSeed?: number | null,
    requestedMasteryContract: MasteryContractId | null = selectedMasteryContract,
    exactSeed?: number,
  ) {
    if (mode === 'shared' && (requestedSeed === null || requestedSeed === undefined) && exactSeed === undefined) {
      announce('공유받은 원정 코드를 먼저 입력해 주세요.')
      return
    }
    setIncomingRiftCode(null)
    setPendingReplacementRiftCode(null)
    clearLinkedRiftFromCurrentUrl()
    preloadCampaignEventDialog()
    const runSeed =
      exactSeed ??
      (mode === 'daily' ? dailySeedForNow() : mode === 'shared' ? (requestedSeed ?? 1) : createRandomSeed())
    const mastery = legacyMasteryFor(meta)
    const masteryContract =
      inheritedPowerEnabledFor(mode) &&
      requestedMasteryContract &&
      mastery &&
      mastery.level >= MASTERY_CONTRACTS[requestedMasteryContract].requiredMasteryLevel
        ? requestedMasteryContract
        : null
    const initial = createInitialGame(
      difficulty,
      oath,
      mode,
      runSeed,
      createUniqueRunId(meta),
      meta,
      true,
      masteryContract,
    )
    const inheritanceMilestone = legacyLoadoutMilestone(initial)
    setGame(initial)
    setPhase('event')
    setFocusLane(0)
    setRiskDepartureConfirmation(null)
    if (inheritanceMilestone) queuedMilestoneIds.current.add(inheritanceMilestone.id)
    setMilestoneQueue(inheritanceMilestone ? [inheritanceMilestone] : [])
    setShowTitle(false)
    setShowDifficulty(false)
    setSelectedDifficulty(null)
    setSelectedMasteryContract(masteryContract)
    setShowArchive(false)
    setShowGuide(false)
    setTutorialStep(readStoredValue(GUIDE_KEY) === GUIDE_SEEN ? null : 'merge')
    setMobileRosterOpen(false)
    setSelectedUnitId(null)
    setBattleResult(null)
    campMutationInFlight.current = false
    battleLaunchInFlight.current = false
    resolvingBattle.current = false
    resolvingChoice.current = null
    removeStoredValues(STORAGE_KEY, BATTLE_STORAGE_KEY)
    writeStoredValue(STORAGE_KEY, JSON.stringify(initial))
    playSound('fire', soundOn)
    announce(
      `${mode === 'daily' ? '오늘의 균열' : mode === 'shared' ? '공유 균열' : DIFFICULTIES[difficulty].name} · ${OATHS[oath].name}이 시작됐습니다.${masteryContract ? ` ${MASTERY_CONTRACTS[masteryContract].name} 계약이 적용됩니다.` : ''}${initial.activeLegacy.length > 0 ? ` 계승 유산 ${initial.activeLegacy.length}개가 첫 선택부터 적용됩니다.` : ''}${!inheritedPowerEnabledFor(mode) ? ' 동일 코드 비교를 위해 계승 유산과 영원 계약은 봉인됩니다.' : ''}`,
    )
  }

  function replayExpedition() {
    if (phase !== 'won' && phase !== 'lost') return
    const replayMode = game.mode === 'daily' && game.runSeed !== dailySeedForNow() ? 'shared' : game.mode
    startCampaign(
      game.difficulty,
      game.oath,
      replayMode,
      replayMode === 'shared' ? game.runSeed : null,
      replayMode === 'standard' ? game.masteryContract : null,
      game.runSeed,
    )
  }

  function resolveCampaignEvent(choice: EventChoice) {
    if (phase !== 'event' || game.eventResolvedForDay >= game.day) return
    if (choice.oathOnly && choice.oathOnly !== game.oath) return
    if (choice.emergencyOnly && hasAffordableStandardEventChoice) return
    if (choice.requiresSupplies && game.supplies < choice.requiresSupplies) {
      announce(`보급품이 ${choice.requiresSupplies - game.supplies} 부족합니다.`)
      return
    }
    const choiceKey = `event-${game.day}`
    if (resolvingChoice.current === choiceKey) return
    resolvingChoice.current = choiceKey

    const slots = game.slots.map((unit) => (unit ? { ...unit } : null))
    let recruits = game.recruits
    let bonusMorale = 0
    let upgradeAnnouncement = ''
    if (choice.recruit) {
      const emptyIndex = slots.indexOf(null)
      if (emptyIndex >= 0) {
        const kind = UNIT_ROTATION[recruits % UNIT_ROTATION.length]
        slots[emptyIndex] = { id: `event-${game.day}-${recruits}`, kind, tier: 1, specialization: null }
        recruits += 1
      } else {
        bonusMorale += 5
      }
    }
    if (choice.upgrade) {
      const deployedIds = new Set(game.lineup.flatMap((unitId) => (unitId ? [unitId] : [])))
      const candidates = slots
        .map((unit, index) => ({ unit, index }))
        .filter((entry): entry is { unit: Unit; index: number } => entry.unit !== null && entry.unit.tier < MAX_TIER)
        .sort((left, right) => {
          const deploymentPriority = Number(!deployedIds.has(left.unit.id)) - Number(!deployedIds.has(right.unit.id))
          return deploymentPriority || left.unit.tier - right.unit.tier || left.index - right.index
        })
      const target = candidates[0]
      if (target) {
        const upgradedTier = target.unit.tier + 1
        upgradeAnnouncement = `${survivorName(target.unit)} ${TIER_LABELS[target.unit.tier]} → ${TIER_LABELS[upgradedTier]}`
        slots[target.index] = {
          ...target.unit,
          tier: upgradedTier,
          specialization: upgradedTier === 3 ? null : target.unit.specialization,
        }
      } else bonusMorale += 5
    }

    const eventScoreReward = eventScoreRewardFor(
      choice,
      game.difficulty,
      game.oath,
      game.activeLegacy,
      game.masteryContract,
    )
    const eventSupplySpend = Math.max(0, -(choice.supplies ?? 0))
    const nextGame: GameState = {
      ...game,
      supplies: Math.max(0, game.supplies + (choice.supplies ?? 0)),
      recoverySupplies: recoverySuppliesAfterSpend(game.recoverySupplies, eventSupplySpend),
      heat: Math.max(1, Math.min(100, game.heat + (choice.heat ?? 0))),
      morale: Math.max(0, Math.min(100, game.morale + (choice.morale ?? 0) + bonusMorale)),
      score: game.score + eventScoreReward.scoreGain,
      renownLedger: addRenownLedgerEntry(
        game.renownLedger,
        'event',
        eventScoreReward.scoreGain,
        eventScoreReward.legacyScoreBonus,
        eventScoreReward.contractScoreBonus,
      ),
      recruits,
      slots,
      decisions: [...game.decisions, choice.id],
      eventResolvedForDay: game.day,
    }
    const recoverySuppliesSpent = game.recoverySupplies - nextGame.recoverySupplies
    const eventBaseScore = choice.score ?? 0
    const eventExpeditionScore =
      eventScoreReward.scoreGain - eventScoreReward.legacyScoreBonus - eventScoreReward.contractScoreBonus
    const eventExpeditionScoreDelta = eventExpeditionScore - eventBaseScore
    const eventScoreAdjusted = eventScoreReward.scoreGain !== eventBaseScore
    const opensPromotion = pendingPromotionFor(nextGame) !== null
    writeStoredValue(STORAGE_KEY, JSON.stringify(nextGame))
    setGame(nextGame)
    setPhase(opensPromotion ? 'promotion' : 'camp')
    if (opensPromotion) setMobileRosterOpen(false)
    else if (tutorialStep === 'merge') setMobileRosterOpen(true)
    playSound(
      choice.finalVow || choice.marchImprint || choice.oathOnly
        ? 'seal'
        : choice.heat && choice.heat > 0
          ? 'fire'
          : 'select',
      soundOn,
    )
    vibrate(choice.finalVow ? [20, 28, 34, 32, 58] : choice.marchImprint || choice.oathOnly ? [18, 24, 34] : 18)
    const eventNotes = [
      upgradeAnnouncement,
      bonusMorale > 0 ? `빈자리가 없어 사기 +${bonusMorale}로 전환` : '',
      recoverySuppliesSpent > 0 ? `복구 보급 -${recoverySuppliesSpent} · 보호 잔액 ${nextGame.recoverySupplies}` : '',
      eventScoreReward.scoreGain > 0 && (!choice.outcome.includes('명성') || eventScoreAdjusted)
        ? eventScoreAdjusted
          ? `사건 명성 +${eventBaseScore.toLocaleString('ko-KR')}${eventExpeditionScoreDelta !== 0 ? ` · 위험도·서약 ${eventExpeditionScoreDelta > 0 ? '+' : '−'}${Math.abs(eventExpeditionScoreDelta).toLocaleString('ko-KR')}` : ''}${eventScoreReward.legacyScoreBonus > 0 ? ` · 기록관의 잉크 +${eventScoreReward.legacyScoreBonus.toLocaleString('ko-KR')}` : ''}${eventScoreReward.contractScoreBonus > 0 && game.masteryContract ? ` · ${MASTERY_CONTRACTS[game.masteryContract].name} +${eventScoreReward.contractScoreBonus.toLocaleString('ko-KR')}` : ''} · 실제 +${eventScoreReward.scoreGain.toLocaleString('ko-KR')}`
          : `명성 +${eventScoreReward.scoreGain.toLocaleString('ko-KR')}`
        : '',
      choice.echo ? `${choice.echo.triggerDay}일차 후속 결과 기록` : '',
      choice.marchImprint
        ? `${FINAL_MARCH_IMPRINTS[choice.marchImprint].name} · ${FINAL_MARCH_IMPRINTS[choice.marchImprint].effect}`
        : '',
      choice.finalVow ? `${FINAL_VOWS[choice.finalVow].name} · ${FINAL_VOWS[choice.finalVow].effect}` : '',
      choice.oathOnly ? `${OATHS[choice.oathOnly].name} 전용 결단` : '',
    ].filter(Boolean)
    const eventOutcome = eventNotes.length > 0 ? `${choice.outcome} · ${eventNotes.join(' · ')}` : choice.outcome
    announce(opensPromotion ? `${eventOutcome} · 베테랑 진급 가능` : eventOutcome)
  }

  function rememberCampAction(kind: CampUndoKind, label: string, detail: string) {
    dismissGrowthCeremony()
    if (kind !== 'march-seal') dismissMarchSealCeremony()
    setCampUndo({
      kind,
      game: cloneGameState(game),
      selectedUnitId,
      tutorialStep,
      label,
      detail,
    })
  }

  function undoCampAction() {
    if (!campUndo || (phase !== 'camp' && phase !== 'promotion')) return
    if (!beginCampMutation()) return
    dismissGrowthCeremony()
    if (campUndo.kind === 'march-seal') dismissMarchSealCeremony()
    const restoredGame: GameState = {
      ...cloneGameState(campUndo.game),
      orders: [...game.orders],
    }
    writeStoredValue(STORAGE_KEY, JSON.stringify(restoredGame))
    setGame(restoredGame)
    setPhase('camp')
    setSelectedUnitId(campUndo.selectedUnitId)
    setTutorialStep(campUndo.tutorialStep)
    setCampUndo(null)
    resolvingChoice.current = null
    if (compactViewport) setMobileRosterOpen(true)
    playSound('select', soundOn)
    vibrate(14)
    announce(`${campUndo.label} 이전 상태로 되돌렸습니다.`)
  }

  function replaceLineupAfterMerge(sourceId: string, targetId: string) {
    const targetLane = game.lineup.indexOf(targetId)
    return game.lineup.map((id, lane) => {
      if (id !== sourceId) return id
      return targetLane === -1 || targetLane === lane ? targetId : null
    })
  }

  function moveOrMerge(sourceId: string, targetIndex: number) {
    if (phase !== 'camp') return
    const sourceIndex = game.slots.findIndex((unit) => unit?.id === sourceId)
    if (sourceIndex === -1 || sourceIndex === targetIndex) return

    const source = game.slots[sourceIndex]
    const target = game.slots[targetIndex]
    if (!source) return

    const slots = [...game.slots]
    if (!target) {
      if (!beginCampMutation()) return
      slots[targetIndex] = source
      slots[sourceIndex] = null
      setCampUndo(null)
      setGame({ ...game, slots })
      setSelectedUnitId(source.id)
      playSound('select', soundOn)
      return
    }

    if (source.kind === target.kind && source.tier === target.tier) {
      if (target.tier >= MAX_TIER) {
        announce('최고 등급의 생존자는 더 합칠 수 없어요.')
        return
      }
      if (game.slots.filter(Boolean).length <= 3) {
        announce('세 전선을 지킬 마지막 3명은 합칠 수 없어요. 신호탄으로 생존자를 먼저 구조하세요.')
        return
      }
      if (!beginCampMutation()) return

      slots[sourceIndex] = null
      const upgradedTier = target.tier + 1
      const specialization =
        upgradedTier === 3 || (upgradedTier === 4 && source.specialization !== target.specialization)
          ? null
          : target.specialization
      const upgradedUnit: Unit = { ...target, tier: upgradedTier, specialization }
      slots[targetIndex] = upgradedUnit
      const nextHeat = Math.min(100, game.heat + campMergeWarmth)
      const nextGame: GameState = {
        ...game,
        heat: nextHeat,
        slots,
        lineup: replaceLineupAfterMerge(source.id, target.id),
      }
      const opensPromotion = needsPromotion(upgradedUnit)
      rememberCampAction(
        'merge',
        `${survivorName(target)} 합성`,
        `${KIND_META[target.kind].name} ${TIER_LABELS[target.tier]} 두 명 → ${TIER_LABELS[upgradedTier]} · 온기 +${campMergeHeatGain}`,
      )
      setGrowthCeremony({
        id: Date.now(),
        unitId: target.id,
        name: survivorName(target),
        kind: target.kind,
        fromTier: target.tier,
        toTier: upgradedTier,
        powerBefore: PLAYER_POWER[target.tier],
        powerAfter: PLAYER_POWER[upgradedTier],
        heatBefore: game.heat,
        heatAfter: nextHeat,
        warmth: campMergeHeatGain,
        opensPromotion,
        specialization,
      })
      if (!opensPromotion) {
        const reducedMotion =
          settings.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const ceremonyDuration = reducedMotion ? 900 : settings.battlePace === 'swift' ? 1500 : 2600
        startRuntimeTimer(growthCeremonyTimer, ceremonyDuration, dismissGrowthCeremony)
      }
      setGame(nextGame)
      setSelectedUnitId(target.id)
      if (tutorialStep === 'merge') setTutorialStep('deploy')
      if (opensPromotion) {
        setPhase('promotion')
        setMobileRosterOpen(false)
      }
      playSound('merge', soundOn)
      vibrate([18, 35, 24])
      announce(
        opensPromotion
          ? `${survivorName(target)} ${TIER_LABELS[upgradedTier]} 등급 완성 · 화로 +${campMergeHeatGain} · 베테랑 진급을 선택하세요.`
          : `${survivorName(target)} ${TIER_LABELS[upgradedTier]} 등급 완성 · 화로 +${campMergeHeatGain}`,
      )
      return
    }

    if (!beginCampMutation()) return
    slots[sourceIndex] = target
    slots[targetIndex] = source
    setCampUndo(null)
    setGame({ ...game, slots })
    setSelectedUnitId(source.id)
    playSound('select', soundOn)
  }

  function handleRosterTap(unitId: string) {
    if (phase !== 'camp') return
    if (!selectedUnitId) {
      const unit = findUnit(game, unitId)
      const mergeReadiness = mergeReadinessByUnit.get(unitId)
      setSelectedUnitId(unitId)
      playSound('select', soundOn)
      announce(
        unit && mergeReadiness
          ? `${survivorName(unit)} 선택 · 합성 짝 ${mergeReadiness.partnerCount}명 · ${TIER_LABELS[mergeReadiness.toTier]} 등급과 전투력 ${mergeReadiness.powerAfter} 미리보기`
          : '같은 병사를 고르면 합치고, 전선을 고르면 배치해요.',
      )
      return
    }

    if (selectedUnitId === unitId) {
      setSelectedUnitId(null)
      return
    }

    const source = findUnit(game, selectedUnitId)
    const target = findUnit(game, unitId)
    if (source && target && source.kind === target.kind && source.tier === target.tier) {
      const targetIndex = game.slots.findIndex((unit) => unit?.id === target.id)
      moveOrMerge(source.id, targetIndex)
      return
    }

    setSelectedUnitId(unitId)
    playSound('select', soundOn)
    const nextMergeReadiness = mergeReadinessByUnit.get(unitId)
    announce(
      nextMergeReadiness && target
        ? `${survivorName(target)} 선택 · 같은 병과·등급 짝 ${nextMergeReadiness.partnerCount}명을 밝혔습니다.`
        : '서로 같은 병과와 등급만 합칠 수 있어요.',
    )
  }

  function handleEmptySlot(targetIndex: number) {
    if (!selectedUnitId) return
    moveOrMerge(selectedUnitId, targetIndex)
  }

  function deployUnit(lane: number, explicitUnitId?: string) {
    if (phase !== 'camp') return false
    const unitId = explicitUnitId ?? selectedUnitId
    const unit = findUnit(game, unitId)
    if (!unit) {
      const deployed = findUnit(game, game.lineup[lane])
      if (deployed) {
        setSelectedUnitId(deployed.id)
        announce(`${survivorName(deployed)} 선택`)
      } else {
        announce('먼저 대기소에서 생존자를 선택하세요.')
      }
      return false
    }

    const sourceLane = game.lineup.indexOf(unit.id)
    const targetUnit = findUnit(game, game.lineup[lane])
    const completesTutorialDeploy = tutorialStep === 'deploy' && unit.tier >= 2
    if (sourceLane === lane) {
      setSelectedUnitId(unit.id)
      if (completesTutorialDeploy) {
        setTutorialStep('orders')
        setMobileRosterOpen(false)
        playSound('deploy', soundOn)
        vibrate(12)
      }
      announce(
        tutorialStep === 'deploy' && !completesTutorialDeploy
          ? `${lane + 1}전선의 ${survivorName(unit)} 배치 유지 · 현장 훈련은 II 등급 생존자를 기다립니다.`
          : completesTutorialDeploy
            ? `${lane + 1}전선의 ${survivorName(unit)} 강화 배치 확인 · 다음은 전선 명령입니다.`
            : `${lane + 1}전선의 ${survivorName(unit)} 배치를 유지합니다.`,
      )
      return true
    }

    const lineup = lineupAfterDeployment(game.lineup, unit.id, lane)
    if (!beginCampMutation()) return false
    setCampUndo(null)
    setGame({ ...game, lineup })
    setSelectedUnitId(unit.id)
    if (completesTutorialDeploy) {
      setTutorialStep('orders')
      setMobileRosterOpen(false)
    }
    playSound('deploy', soundOn)
    vibrate(12)
    const deploymentMessage =
      sourceLane >= 0 && targetUnit
        ? `${sourceLane + 1}전선 ${survivorName(unit)} ↔ ${lane + 1}전선 ${survivorName(targetUnit)} · 자리 교환`
        : sourceLane >= 0
          ? `${sourceLane + 1}전선에서 ${lane + 1}전선으로 ${survivorName(unit)} 이동`
          : targetUnit
            ? `${lane + 1}전선에 ${survivorName(unit)} 배치 · ${survivorName(targetUnit)} 대기소 복귀`
            : `${lane + 1}전선에 ${survivorName(unit)} 배치`
    announce(
      tutorialStep === 'deploy' && !completesTutorialDeploy
        ? `${deploymentMessage} · 현장 훈련은 II 등급 생존자를 기다립니다.`
        : deploymentMessage,
    )
    return true
  }

  function recruit() {
    if (phase !== 'camp') return
    const emptyIndex = game.slots.indexOf(null)
    if (emptyIndex === -1) {
      announce('대기소가 가득 찼어요. 먼저 병사를 합쳐 주세요.')
      return
    }
    if (game.supplies < recruitCost) {
      announce(`보급품이 ${recruitCost - game.supplies} 부족해요.`)
      return
    }
    if (!beginCampMutation()) return

    const kind = UNIT_ROTATION[game.recruits % UNIT_ROTATION.length]
    const unit: Unit = {
      id: `recruit-${Date.now()}-${game.recruits}`,
      kind,
      tier: 1,
      specialization: null,
    }
    const slots = [...game.slots]
    slots[emptyIndex] = unit
    const nextRecoverySupplies = recoverySuppliesAfterSpend(game.recoverySupplies, recruitCost)
    const recoverySpend = game.recoverySupplies - nextRecoverySupplies
    const recoveryNote = recoverySpend > 0 ? ` · 복구분 -${recoverySpend}` : ''
    rememberCampAction(
      'recruit',
      '신호탄 사용',
      `${survivorName(unit)} 합류 · ${KIND_META[unit.kind].name} I · 보급품 -${recruitCost}${recoveryNote}`,
    )
    setGame({
      ...game,
      supplies: game.supplies - recruitCost,
      recoverySupplies: nextRecoverySupplies,
      recruits: game.recruits + 1,
      slots,
    })
    setSelectedUnitId(unit.id)
    playSound('recruit', soundOn)
    vibrate([12, 24, 12])
    announce(`${survivorName(unit)} 합류 · 불빛을 따라 도착했어요${recoveryNote}`)
  }

  function stokeFire() {
    if (phase !== 'camp') return
    if (game.heat >= 100 || stokeHeatGain <= 0) {
      announce('화로가 이미 가장 뜨거워요.')
      return
    }
    if (game.supplies < stokeCost) {
      announce('장작을 살 보급품이 부족해요.')
      return
    }
    if (!beginCampMutation()) return

    const nextRecoverySupplies = recoverySuppliesAfterSpend(game.recoverySupplies, stokeCost)
    const recoverySpend = game.recoverySupplies - nextRecoverySupplies
    const recoveryNote = recoverySpend > 0 ? ` · 복구분 -${recoverySpend}` : ''
    rememberCampAction(
      'stoke',
      '화로 투자',
      `보급품 -${stokeCost}${recoveryNote} · 온기 ${game.heat}% → ${game.heat + stokeHeatGain}%`,
    )
    setGame({
      ...game,
      supplies: game.supplies - stokeCost,
      recoverySupplies: nextRecoverySupplies,
      heat: game.heat + stokeHeatGain,
    })
    playSound('fire', soundOn)
    vibrate(18)
    announce(`화로에 필요한 만큼 장작을 넣었어요 · 보급품 -${stokeCost}${recoveryNote} · 온기 +${stokeHeatGain}`)
  }

  function sealMarchSupplies() {
    if (phase !== 'camp' || game.day < 9) return
    if (!marchSealUnlocked) {
      announce(`행군 보급 봉인에는 출전 대열 III 등급 이상 3명이 필요해요 · ${marchSealVeteranLines} / 3`)
      return
    }
    if (marchSealSupplies < 10) {
      announce(
        `화로·성장·복구 보호선 ${marchSealReserve}${marchSealRecoveryReserve > 0 ? ` · 남은 복구 보급 ${marchSealRecoveryReserve} 포함` : ''}을 제외한 잉여 보급 10 이상이 필요해요.`,
      )
      return
    }
    if (!beginCampMutation()) return

    const nextScore = game.score + marchSealScore
    const rankNote = marchSealRaisesRank ? ` · ${marchSealRankEntry.rank} 등급 도달` : ''
    const legacyNote =
      marchSealLegacyScoreBonus > 0 ? ` · 기록관의 잉크 +${marchSealLegacyScoreBonus.toLocaleString('ko-KR')}` : ''
    const contractNote =
      marchSealContractScoreBonus > 0 && game.masteryContract
        ? ` · ${MASTERY_CONTRACTS[game.masteryContract].name} +${marchSealContractScoreBonus.toLocaleString('ko-KR')}`
        : ''
    rememberCampAction(
      'march-seal',
      '행군 보급 봉인',
      `보급품 -${marchSealSupplies} · 명성 +${marchSealScore.toLocaleString('ko-KR')}${legacyNote}${contractNote} · 보호선 ${marchSealReserve}${marchSealRecoveryReserve > 0 ? ` · 남은 복구 보급 ${marchSealRecoveryReserve} 포함` : ''}${rankNote}`,
    )
    dismissMarchSealCeremony()
    setMarchSealCeremony({
      id: Date.now(),
      supplies: marchSealSupplies,
      scoreGain: marchSealScore,
      legacyScoreBonus: marchSealLegacyScoreBonus,
      contractScoreBonus: marchSealContractScoreBonus,
      masteryContract: game.masteryContract,
      scoreBefore: game.score,
      scoreAfter: nextScore,
      reserve: marchSealReserve,
      recoveryReserve: marchSealRecoveryReserve,
      rankBefore: liveRankEntry.rank,
      rankAfter: marchSealRankEntry.rank,
    })
    const reducedMotion = settings.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ceremonyDuration = reducedMotion ? 900 : settings.battlePace === 'swift' ? 1450 : 2400
    startRuntimeTimer(marchSealTimer, ceremonyDuration, dismissMarchSealCeremony)
    setGame({
      ...game,
      supplies: game.supplies - marchSealSupplies,
      score: nextScore,
      renownLedger: addRenownLedgerEntry(
        game.renownLedger,
        'marchSeal',
        marchSealScore,
        marchSealLegacyScoreBonus,
        marchSealContractScoreBonus,
      ),
    })
    playSound('seal', soundOn)
    vibrate([16, 22, 34, 30, 54])
    announce(
      `잉여 보급 ${marchSealSupplies}을 마지막 행군 기록으로 봉인했습니다 · 명성 +${marchSealScore.toLocaleString('ko-KR')}${legacyNote}${contractNote}${rankNote}`,
    )
  }

  function battlePlanAnnouncement(result: BattleResult | null) {
    return result ? ` · 예상 방어 ${result.wins} / 3 · ${result.victory ? '승리선 확보' : '승리선 미확보'}` : ''
  }

  function chooseFocusLane(lane: number) {
    if (phase !== 'camp') return false
    if (lane !== focusLane && !beginCampMutation()) return false
    const focusedResult = battleResultFor(lane)
    setRiskDepartureConfirmation(null)
    setFocusLane(lane)
    playSound('select', soundOn)
    if (tutorialStep === 'focus') {
      if (focusedResult && focusedResult.wins >= REQUIRED_LANE_WINS) {
        setTutorialStep('battle')
        announce(`${lane + 1}전선 집중 · 예상 방어 ${focusedResult.wins} / 3 · 첫 교전 준비 완료`)
        return true
      }
      if (tutorialRecommendedFocusWins < REQUIRED_LANE_WINS) {
        announce(
          `${lane + 1}전선 집중 · 최고 예상도 ${tutorialRecommendedFocusWins} / 3입니다. 청록색 명령을 하나 더 맞춰 주세요.`,
        )
        return true
      }
      announce(
        `${lane + 1}전선 집중 시 예상 방어 ${focusedResult?.wins ?? 0} / 3 · 추천은 0${tutorialRecommendedFocusLane + 1} 전선입니다.`,
      )
      return true
    }
    announce(`${lane + 1}전선 화로 집중${battlePlanAnnouncement(focusedResult)}`)
    return true
  }

  function chooseOrder(lane: number, order: BattleOrder) {
    if (phase !== 'camp') return false
    const nextOrders = game.orders.map((current, index) => (index === lane ? order : current))
    const nextSpent = nextOrders.reduce((total, current) => total + ORDER_META[current].cost, 0)
    if (nextSpent > commandLimit && nextSpent >= commandSpent) {
      announce(`명령 점수가 ${nextSpent - commandLimit} 부족합니다. 현재 부담보다 낮추는 방벽 명령부터 적용해 주세요.`)
      return false
    }
    if (!beginCampMutation()) return false
    const nextGame = { ...game, orders: nextOrders }
    const nextBattleResult = battleResultFor(focusLane, nextGame)
    const addsTutorialCounter = tutorialCounterCountFor(nextGame) > tutorialCounterCount
    setGame(nextGame)
    if (tutorialStep === 'orders' && addsTutorialCounter) {
      setTutorialStep('focus')
    }
    playSound('select', soundOn)
    announce(
      tutorialStep === 'orders' && !addsTutorialCounter
        ? `${lane + 1}전선 · ${ORDER_META[order].name} 명령 · 아직 새 파훼가 아닙니다. 청록색으로 표시된 다른 명령을 골라 주세요.`
        : `${lane + 1}전선 · ${ORDER_META[order].name} 명령${battlePlanAnnouncement(nextBattleResult)}`,
    )
    return true
  }

  function applyTacticalAdjustment() {
    if (phase !== 'camp' || !tacticalAdjustment || !tacticalRehearsal) return
    if (tacticalAdjustment.kind === 'order') {
      if (!chooseOrder(tacticalAdjustment.lane, tacticalAdjustment.order)) return
    } else {
      if (!chooseFocusLane(tacticalAdjustment.lane)) return
    }
    vibrate(12)
    announce(
      `전술 모의 적용 · ${tacticalRehearsal.title} · ${tacticalRehearsal.status} · 적용 후 예상 방어 ${tacticalAdjustment.result.wins} / 3${tacticalAdjustment.result.victory ? ' · 출전 가능' : ''}`,
    )
    scheduleFrame(() => {
      const selector =
        tacticalAdjustment.kind === 'order'
          ? `[data-order-lane="${tacticalAdjustment.lane}"] button[data-order="${tacticalAdjustment.order}"]`
          : `.focus-buttons button[data-focus-lane="${tacticalAdjustment.lane}"]`
      const target = document.querySelector<HTMLButtonElement>(selector)
      const reducedMotion =
        settings.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
      target?.focus({ preventScroll: true })
    })
  }

  function cancelRiskDeparture() {
    if (!riskDepartureArmed) return
    setRiskDepartureConfirmation(null)
    playSound('select', soundOn)
    vibrate(12)
    announce('위험 출전 확인을 취소했습니다. 현재 계획을 계속 조정할 수 있습니다.')
    scheduleFrame(() => {
      const selector = compactViewport ? '.mobile-battle-action:not(:disabled)' : '.primary-action:not(:disabled)'
      document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true })
    })
  }

  function chooseSpecialization(specializationId: SpecializationId) {
    if (phase !== 'promotion' || !pendingPromotionUnit) return
    if (SPECIALIZATIONS[specializationId].kind !== pendingPromotionUnit.kind) return
    const choiceKey = `promotion-${pendingPromotionUnit.id}`
    if (resolvingChoice.current === choiceKey) return
    resolvingChoice.current = choiceKey

    const slots = game.slots.map((unit) =>
      unit?.id === pendingPromotionUnit.id ? { ...unit, specialization: specializationId } : unit,
    )
    const nextGame: GameState = { ...game, slots }
    const remainingPromotion = pendingPromotionFor(nextGame)
    const promotionGrowth = growthCeremony?.unitId === pendingPromotionUnit.id ? growthCeremony : null
    const fromTier = promotionGrowth?.fromTier ?? Math.max(1, pendingPromotionUnit.tier - 1)
    const powerBefore = promotionGrowth?.powerBefore ?? PLAYER_POWER[fromTier]
    const powerAfter = promotionGrowth?.powerAfter ?? PLAYER_POWER[pendingPromotionUnit.tier]
    setCampUndo(null)
    dismissGrowthCeremony()
    writeStoredValue(STORAGE_KEY, JSON.stringify(nextGame))
    setGame(nextGame)
    setSelectedUnitId(pendingPromotionUnit.id)
    setPhase(
      remainingPromotion
        ? 'promotion'
        : nextGame.pendingRelic
          ? ACT_TRANSITIONS[nextGame.day]
            ? 'interlude'
            : 'relic'
          : nextGame.eventResolvedForDay < nextGame.day
            ? 'event'
            : 'camp',
    )
    enqueueMilestones([
      {
        id: `growth-${game.runId}-${game.day}-${pendingPromotionUnit.id}-${pendingPromotionUnit.tier}-${specializationId}`,
        kind: 'growth',
        glyph: SPECIALIZATIONS[specializationId].glyph,
        kicker: `VETERAN PATH FORGED · TIER ${TIER_LABELS[pendingPromotionUnit.tier]}`,
        title: `${survivorName(pendingPromotionUnit)} · ${SPECIALIZATIONS[specializationId].name}`,
        description: `${KIND_META[pendingPromotionUnit.kind].name} ${TIER_LABELS[fromTier]} → ${TIER_LABELS[pendingPromotionUnit.tier]} · 기본 전투력 ${powerBefore} → ${powerAfter}`,
        detail: SPECIALIZATIONS[specializationId].description,
      },
    ])
    resolvingChoice.current = null
    playSound(pendingPromotionUnit.tier === MAX_TIER ? 'seal' : 'relic', soundOn)
    vibrate([22, 30, 22, 42, 28])
    announce(`${survivorName(pendingPromotionUnit)} · ${SPECIALIZATIONS[specializationId].name}의 길을 택했습니다.`)
  }

  function previewSpecialization(specializationId: SpecializationId) {
    if (phase !== 'promotion' || !pendingPromotionUnit) return
    if (SPECIALIZATIONS[specializationId].kind !== pendingPromotionUnit.kind) return
    const insight = promotionChoiceInsights.find((candidate) => candidate.specializationId === specializationId)
    const powerCopy =
      insight?.playerPowerBefore !== null &&
      insight?.playerPowerBefore !== undefined &&
      insight.playerPowerAfter !== null
        ? ` · 현재 전선 ${insight.playerPowerBefore} → ${insight.playerPowerAfter}`
        : ''
    playSound('select', soundOn)
    vibrate(12)
    announce(`${SPECIALIZATIONS[specializationId].name} 미리보기 · ${insight?.status ?? '조건 확인'}${powerCopy}`)
  }

  function continueActInterlude() {
    if (phase !== 'interlude' || !currentActTransition) return
    const nextPhase = game.pendingRelic ? 'relic' : game.eventResolvedForDay < game.day ? 'event' : 'camp'
    revealPhase(nextPhase, nextPhase === 'relic' ? 'relic' : 'fire', [22, 34, 28, 42, 34])
    announce(`제${currentActTransition.toAct}막 · ${ACTS[currentActTransition.toAct - 1].title}`)
  }

  function revealFinalEnding() {
    if (phase !== 'finale' || game.status !== 'won') return
    setBattleResult(null)
    revealPhase('won', 'fire', [28, 34, 28, 34, 52, 40, 72])
    announce(`${currentEnding.title} · 원정의 결말이 기록되었습니다.`)
  }

  function previewRelicChoice(relicId: RelicId) {
    if (phase !== 'relic' || !game.pendingRelic) return
    const resonancePreview = resonancePreviewFor(relicId, game.relics)
    const completesResonance = resonancePreview?.completes === true
    playSound('select', soundOn)
    vibrate(completesResonance ? [12, 22, 20] : 12)
    announce(
      `${RELICS[relicId].name} 선택 · ${completesResonance && resonancePreview ? `${RESONANCES[resonancePreview.id].name} 공명을 완성할 수 있습니다.` : '효과를 확인한 뒤 각인을 확정하세요.'}`,
    )
  }

  function chooseRelic(relicId: RelicId) {
    if (phase !== 'relic' || !game.pendingRelic) return
    const choiceKey = `relic-${game.day}`
    if (resolvingChoice.current === choiceKey) return
    resolvingChoice.current = choiceKey
    const resonancePreview = resonancePreviewFor(relicId, game.relics)
    const completesResonance = resonancePreview?.completes === true
    const unlocksResonanceAchievement = completesResonance && !meta.achievements.includes('first-resonance')
    const nextGame = { ...game, relics: [...game.relics, relicId], pendingRelic: false }
    const nextMeta = {
      ...meta,
      discoveredRelics: [...new Set([...meta.discoveredRelics, relicId])],
      achievements: unlocksResonanceAchievement
        ? [...meta.achievements, 'first-resonance' as const]
        : meta.achievements,
    }
    writeStoredValue(STORAGE_KEY, JSON.stringify(nextGame))
    writeStoredValue(META_KEY, JSON.stringify(nextMeta))
    setGame(nextGame)
    setMeta(nextMeta)
    const nextPhase = game.eventResolvedForDay < game.day ? 'event' : 'camp'
    const milestones: MilestoneNotice[] = []
    if (completesResonance && resonancePreview) {
      const resonance = RESONANCES[resonancePreview.id]
      milestones.push({
        id: `resonance-${game.runId}-${resonancePreview.id}`,
        kind: 'resonance',
        glyph: resonance.glyph,
        kicker: 'RELIC RESONANCE COMPLETE',
        title: resonance.name,
        description: resonance.description,
        detail: resonance.requirements.map((requirement) => RELICS[requirement].name).join(' + '),
      })
    }
    if (unlocksResonanceAchievement) milestones.push(achievementMilestone('first-resonance'))
    enqueueMilestones(milestones)
    revealPhase(
      nextPhase,
      completesResonance ? 'seal' : 'relic',
      completesResonance ? [24, 30, 24, 30, 55, 36, 70] : [20, 35, 20, 45, 30],
    )
    announce(
      `${RELICS[relicId].name} 각인${completesResonance && resonancePreview ? ` · ${RESONANCES[resonancePreview.id].name} 공명 완성` : ''}`,
    )
  }

  function startBattle() {
    if (phase !== 'camp') return
    if (campMutationInFlight.current || battleLaunchInFlight.current) return
    if (pendingPromotionUnit) {
      setPhase('promotion')
      setMobileRosterOpen(false)
      announce('전투 전에 베테랑 진급을 선택해야 합니다.')
      return
    }
    if (tutorialStep && tutorialStep !== 'battle') {
      focusTutorialTarget()
      announce(`현장 훈련 ${tutorialIndex}/5 단계를 먼저 완료해 주세요.`)
      return
    }
    if (commandSpent > commandLimit) {
      announce('현재 사기로 감당할 수 없는 명령입니다. 한 전선을 방벽으로 돌려 주세요.')
      return
    }
    const result = battleResultFor(focusLane)
    if (!result || !lineupReady || forecastLanes.some((lane) => lane === null)) {
      announce('세 전선에 생존자를 모두 배치해야 해요.')
      return
    }
    if (tutorialStep === 'battle' && !result.victory) {
      setTutorialStep('focus')
      announce(`첫 교전은 전선 ${REQUIRED_LANE_WINS}곳 방어가 필요합니다. 추천 집중 전선을 다시 확인해 주세요.`)
      return
    }
    if (tutorialStep === 'battle') finishTutorial('현장 훈련 완료 · 첫 교전을 개시합니다.')
    const riskDepartureConfirmed =
      riskDepartureConfirmation?.game === game && riskDepartureConfirmation.focusLane === focusLane
    if (!result.victory && !riskDepartureConfirmed) {
      const returnHeat = Math.max(0, Math.min(100, game.heat + result.heatDelta))
      const returnMorale = Math.max(0, Math.min(100, game.morale + result.moraleDelta))
      setRiskDepartureConfirmation({ game, focusLane })
      setMobileRosterOpen(false)
      playSound('lose', soundOn)
      vibrate([18, 30, 18])
      announce(
        `후퇴 위험 확인${returnHeat === 0 ? ' · 귀환 온기 0%로 원정이 종료됩니다' : ''} · 같은 계획으로 한 번 더 누르면 출전합니다 · 보급 +${result.supplyReward} · 온기 ${game.heat}% → ${returnHeat}% · 사기 ${game.morale} → ${returnMorale}`,
      )
      scheduleFrame(() => {
        const selector = compactViewport ? '.mobile-battle-action:not(:disabled)' : '.primary-action:not(:disabled)'
        document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true })
      })
      return
    }

    battleLaunchInFlight.current = true
    dismissMarchSealCeremony()
    resolvingBattle.current = false
    setRiskDepartureConfirmation(null)
    const battleCheckpointStored =
      writeStoredValue(STORAGE_KEY, JSON.stringify(game)) &&
      writeStoredValue(
        BATTLE_STORAGE_KEY,
        JSON.stringify({ runId: game.runId, battles: game.battles, day: game.day, focusLane } satisfies SavedBattle),
      )
    if (!battleCheckpointStored) {
      removeStoredValues(BATTLE_STORAGE_KEY)
      if (!storageWarningShown.current) {
        storageWarningShown.current = true
        announce('교전 복구 기록을 저장하지 못했습니다. 앱을 닫으면 마지막 캠프 기록으로 돌아갑니다.')
      }
    }
    setSelectedUnitId(null)
    setMobileRosterOpen(false)
    setBattleResult(result)
    setPhase('battling')
    playSound(result.boss ? 'boss' : 'battle', soundOn)
    vibrate([30, 45, 45])
  }

  function playBattleLaneImpact(lane: LaneResult, result: BattleResult, decisive: boolean) {
    const crownBroken =
      game.day === MAX_NIGHTS && finalCrownSealBroken(lane.lane, result.focusLane, lane.countered, lane.relation)
    const doctrineBroken = Boolean(lane.enemy.doctrine && lane.doctrineBroken)
    const impactSound = crownBroken
      ? 'crown'
      : decisive && !result.victory
        ? 'lose'
        : doctrineBroken || (decisive && result.boss)
          ? 'seal'
          : lane.won
            ? 'impact'
            : 'lose'
    playSound(impactSound, soundOn)
    vibrate(
      crownBroken
        ? [24, 24, 42, 28, 62]
        : decisive
          ? result.victory
            ? [18, 22, 38, 24, 62]
            : [58, 32, 78, 38, 96]
          : doctrineBroken
            ? [16, 18, 26, 20, 48]
            : lane.won
              ? 20
              : [45, 30, 45],
    )
  }

  function playBattleClimax(result: BattleResult) {
    if (finalMarchGate) {
      const doctrineBroken = result.lanes.some(
        (lane) => lane.enemy.doctrine === finalMarchGate.doctrine && lane.doctrineBroken,
      )
      playSound(result.victory ? (doctrineBroken ? 'seal' : 'impact') : doctrineBroken ? 'impact' : 'lose', soundOn)
      vibrate(
        result.victory
          ? doctrineBroken
            ? [20, 34, 34, 38, 52, 30, 72]
            : [30, 26, 54, 30, 68]
          : doctrineBroken
            ? [30, 52, 30, 88, 72]
            : [70, 40, 94],
      )
      return
    }

    playSound(result.victory ? (game.day === MAX_NIGHTS ? 'finale' : 'crown') : 'lose', soundOn)
    vibrate(
      result.victory
        ? game.day === MAX_NIGHTS
          ? [22, 24, 42, 30, 64, 34, 86]
          : game.day === 8
            ? [34, 74, 34, 142, 58, 28, 82]
            : [24, 22, 38, 26, 56, 30, 72]
        : game.day === 8
          ? [46, 82, 46, 154, 96]
          : [70, 34, 92],
    )
  }

  function revealPhase(nextPhase: Phase, sound: SoundEffect, vibration: number | number[]) {
    setPhase(nextPhase)
    scheduleFrame(() => {
      playSound(sound, soundOn)
      vibrate(vibration)
    })
  }

  function completeBattleCinema(result: BattleResult) {
    if (phase !== 'battling') return
    revealPhase('result', result.victory ? 'win' : 'lose', result.victory ? [25, 35, 25, 35, 45] : [80, 40, 100])
  }

  function skipBattleCinema() {
    if (phase !== 'battling' || !battleResult) return
    const shatteredActCrown = battleResult.boss && battleResult.victory && (game.day === 4 || game.day === 8)
    if (finalMarchGate) {
      const doctrineBroken = battleResult.lanes.some(
        (lane) => lane.enemy.doctrine === finalMarchGate.doctrine && lane.doctrineBroken,
      )
      revealPhase(
        'result',
        battleResult.victory ? (doctrineBroken ? 'seal' : 'impact') : doctrineBroken ? 'impact' : 'lose',
        battleResult.victory
          ? doctrineBroken
            ? [18, 30, 30, 36, 54]
            : [26, 24, 52]
          : doctrineBroken
            ? [28, 46, 28, 72]
            : [55, 30, 70],
      )
      return
    }

    revealPhase(
      'result',
      game.day === MAX_NIGHTS && battleResult.victory
        ? 'finale'
        : shatteredActCrown
          ? 'crown'
          : battleResult.victory
            ? 'win'
            : 'lose',
      battleResult.victory
        ? shatteredActCrown
          ? game.day === 8
            ? [28, 64, 28, 120, 64]
            : [22, 20, 38, 24, 58]
          : [20, 25, 35]
        : [55, 30, 70],
    )
  }

  function saveBestScore(score: number) {
    if (score <= bestScore) return
    setBestScore(score)
    writeStoredValue(BEST_SCORE_KEY, String(score))
  }

  async function shareExpedition() {
    if (phase !== 'won' && phase !== 'lost') return
    const won = phase === 'won'
    const runCode = runCodeFor(game.runSeed)
    const shareUrl = sharedRiftUrlFor(runCode)
    const completedTrials = completedTrialsFor(game, won).length
    const outcomeFailure = game.failureInsights[0] ?? null
    const legacyRenownBonus =
      game.renownLedger.battle.legacyBonus +
      game.renownLedger.event.legacyBonus +
      game.renownLedger.marchSeal.legacyBonus
    const contractRenownBonus =
      game.renownLedger.battle.contractBonus +
      game.renownLedger.event.contractBonus +
      game.renownLedger.marchSeal.contractBonus
    const text = [
      `마지막 불씨 · ${currentEnding.title}`,
      `원정 등급 ${expeditionRank(game.score, won)} · 명성 ${game.score.toLocaleString('ko-KR')}`,
      `명성 기여 전투 ${game.renownLedger.battle.total.toLocaleString('ko-KR')} · 사건 ${game.renownLedger.event.total.toLocaleString('ko-KR')} · 행군 봉인 ${game.renownLedger.marchSeal.total.toLocaleString('ko-KR')}`,
      legacyRenownBonus > 0 ? `기록관의 잉크 실제 기여 +${legacyRenownBonus.toLocaleString('ko-KR')}` : '',
      game.masteryContract
        ? `영원 계약 ${MASTERY_CONTRACTS[game.masteryContract].name} · 실제 기여 +${contractRenownBonus.toLocaleString('ko-KR')} · ${MASTERY_CONTRACTS[game.masteryContract].burden}${meta.masteredContracts.includes(game.masteryContract) ? ' · 정복 기록' : ''}`
        : '',
      `${DIFFICULTIES[game.difficulty].name} · ${OATHS[game.oath].name} · 개인 과업 ${completedTrials}/3`,
      `원정 교범 ${protocolMasteryProgress.name} · ${protocolMasteryRecognized ? '숙련 인장' : `${protocolMasteryProgress.metricLabel} ${protocolMasteryProgress.currentLabel}`} · 총 ${masteredProtocolCount}/3`,
      `지휘관 서명 ${endingCommanderTitle} · ${endingTacticalSeal?.title ?? ''}`,
      `서약 연대기 ${oathChronicle.title} · 왕관 개입 ${oathInterventionCount}/3`,
      endingFinalVow ? `최후 맹세 ${endingFinalVow.name} · ${endingFinalVow.legacyTitle}` : '',
      `유물 ${game.relics.length}개 · ${activeResonances.length > 0 ? `공명 ${activeResonances.map((resonanceId) => RESONANCES[resonanceId].name).join(', ')}` : '완성된 공명 없음'}`,
      `새벽 도감 ${endingDiscoveredCount}/${ENDING_IDS.length} 결말 발견`,
      `${game.mode === 'daily' ? '오늘의 균열' : game.mode === 'shared' ? '공유 균열' : '원정'} 코드 ${runCode}`,
      outcomeFailure
        ? `최종 패인 전선 0${outcomeFailure.lane + 1} · ${outcomeFailure.label} · 처방: ${outcomeFailure.action}`
        : '',
      `다음 목표 ${endingMasteryDirective.title}`,
    ]
      .filter(Boolean)
      .join('\n')

    if (shareInFlight.current) return
    shareInFlight.current = true
    setSharePending(true)
    try {
      const share = navigator.share?.bind(navigator)
      let nativeShareFailed = false
      if (share) {
        try {
          await share({ title: '마지막 불씨', text, url: shareUrl })
          announce('원정 기록을 공유했습니다.')
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            announce('기록 공유를 취소했습니다. 원정 기록은 그대로 유지됩니다.')
            return
          }
          nativeShareFailed = true
        }
      }

      const copied = await copyTextToClipboard(`${text}\n${shareUrl}`)
      if (copied) {
        announce(
          nativeShareFailed
            ? '공유 창 대신 원정 기록과 초대 링크를 복사했습니다.'
            : '원정 기록과 초대 링크를 복사했습니다.',
        )
        return
      }
      announce('이 브라우저는 기록 공유를 지원하지 않습니다.')
    } catch {
      announce('기록을 공유하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      shareInFlight.current = false
      setSharePending(false)
    }
  }

  function continueAfterBattle() {
    if (!battleResult || resolvingBattle.current) return
    resolvingBattle.current = true
    const persistOutcome = (nextGame: GameState) => {
      if (writeStoredValue(STORAGE_KEY, JSON.stringify(nextGame))) removeStoredValues(BATTLE_STORAGE_KEY)
    }
    const nextHeat = Math.max(0, Math.min(100, game.heat + battleResult.heatDelta))
    const nextSupplies = game.supplies + battleResult.supplyReward
    const nextRecoverySupplies = battleResult.victory
      ? game.recoverySupplies
      : game.recoverySupplies + battleResult.supplyReward
    const nextMorale = Math.max(0, Math.min(100, game.morale + battleResult.moraleDelta))
    const nextScore = game.score + battleResult.scoreReward
    const nextPerfectNights = game.perfectNights + (battleResult.victory && battleResult.wins === 3 ? 1 : 0)
    const nextVictories = game.victories + (battleResult.victory ? 1 : 0)
    const nextBosses = game.bossesDefeated + (battleResult.victory && battleResult.boss ? 1 : 0)
    const nextIntentsCountered =
      game.intentsCountered + (battleResult.victory ? battleResult.lanes.filter((lane) => lane.countered).length : 0)
    const usedThreeKinds = new Set(battleResult.lanes.map((lane) => lane.unit.kind)).size === 3
    const nextUnitedVictories = Math.min(
      TRIALS['united-front'].target,
      game.unitedVictories + (battleResult.victory && usedThreeKinds ? 1 : 0),
    )
    const nextGame: GameState = {
      ...game,
      heat: nextHeat,
      supplies: nextSupplies,
      recoverySupplies: nextRecoverySupplies,
      morale: nextMorale,
      score: nextScore,
      renownLedger: addRenownLedgerEntry(
        game.renownLedger,
        'battle',
        battleResult.scoreReward,
        battleResult.legacyScoreBonus,
        battleResult.contractScoreBonus,
      ),
      perfectNights: nextPerfectNights,
      intentsCountered: nextIntentsCountered,
      unitedVictories: nextUnitedVictories,
      battles: game.battles + 1,
      victories: nextVictories,
      bossesDefeated: nextBosses,
    }

    const previousRankEntry = rankEntryForScore(game.score)
    const earnedRankEntry = rankEntryForScore(nextScore)
    const runContinues = nextHeat > 0 || (battleResult.victory && game.day >= MAX_NIGHTS)
    if (runContinues && earnedRankEntry.minimum > previousRankEntry.minimum) {
      enqueueMilestones([
        {
          id: `rank-${game.runId}-${earnedRankEntry.rank}`,
          kind: 'rank',
          glyph: earnedRankEntry.rank,
          kicker: 'RENOWN RANK RAISED',
          title: `${earnedRankEntry.rank} 등급 · ${earnedRankEntry.title}`,
          description: earnedRankEntry.description,
          detail: `누적 명성 ${nextScore.toLocaleString('ko-KR')} · 새 등급 진입`,
        },
      ])
    }

    const achievementCandidates: AchievementId[] = []
    if (battleResult.victory && nextVictories === 1) achievementCandidates.push('first-watch')
    if (battleResult.victory && battleResult.wins === 3) achievementCandidates.push('unbroken-wall')
    if (battleResult.victory && battleResult.lanes.every((lane) => lane.countered)) {
      achievementCandidates.push('intent-breaker')
    }
    if (battleResult.victory && battleResult.boss && usedThreeKinds) {
      achievementCandidates.push('threefold-company')
    }
    if (battleResult.victory && nextHeat <= 20) achievementCandidates.push('last-spark')
    if (nextBosses >= 3) achievementCandidates.push('crown-breaker')

    if (battleResult.victory && game.day >= MAX_NIGHTS) {
      achievementCandidates.push('seventh-dawn')
      if (game.difficulty === 'whiteout') achievementCandidates.push('whiteout-victor')
      if (game.mode === 'daily') achievementCandidates.push('shared-dawn')
      if (completedTrialsFor(nextGame, true).length === 3) achievementCandidates.push('threefold-oath')
      const completedProtocolMastery = protocolMasteryProgressFor(nextGame, true)
      if (completedProtocolMastery.completed) achievementCandidates.push(completedProtocolMastery.achievement)
      if (
        oathInterventionCountFor(nextGame.oath, nextGame.decisions) === OATH_CHRONICLES[nextGame.oath].stages.length
      ) {
        achievementCandidates.push(OATH_CHRONICLE_ACHIEVEMENTS[nextGame.oath])
      }
      achievementCandidates.push(ENDING_ACHIEVEMENTS[endingFor(nextGame, true)])
      const reward = legacyRewardBreakdownFor(nextGame, true).total
      const completed = {
        ...nextGame,
        status: 'won' as const,
        legacyAwarded: true,
        legacyReward: reward,
      }
      persistOutcome(completed)
      setGame(completed)
      commitMetaProgress(achievementCandidates, reward, true, createExpeditionRecord(completed, true))
      saveBestScore(nextScore)
      revealPhase('finale', 'finale', [20, 28, 28, 34, 42, 36, 62, 42, 84])
      announce(
        `백색 왕의 왕좌가 무너졌습니다. 최종 전선 ${battleResult.wins}곳 · 칙령 ${battleResult.crownBreakCount}개 파쇄. 마지막 새벽으로 향합니다.`,
      )
      return
    }

    if (nextHeat === 0) {
      if (completedTrialsFor(nextGame, false).length === 3) achievementCandidates.push('threefold-oath')
      achievementCandidates.push(ENDING_ACHIEVEMENTS[endingFor(nextGame, false)])
      const reward = legacyRewardBreakdownFor(nextGame, false).total
      const failed = {
        ...nextGame,
        heat: 0,
        status: 'lost' as const,
        legacyAwarded: true,
        legacyReward: reward,
        failureInsights: cloneFailureInsights(defeatInsights),
      }
      persistOutcome(failed)
      setGame(failed)
      commitMetaProgress(achievementCandidates, reward, false, createExpeditionRecord(failed, false))
      saveBestScore(nextScore)
      setBattleResult(null)
      revealPhase('lost', 'fire', [36, 44, 58, 50, 78])
      announce('마지막 불씨가 꺼졌습니다. 이번 원정의 결말과 다음 공략 목표를 기록합니다.')
      return
    }

    const grantsRelic = battleResult.victory && RELIC_NIGHTS.has(game.day) && game.relics.length < RELIC_IDS.length
    if (completedTrialsFor(nextGame, false).length === 3) achievementCandidates.push('threefold-oath')
    const continued: GameState = {
      ...nextGame,
      day: battleResult.victory ? game.day + 1 : game.day,
      pendingRelic: grantsRelic,
      orders: battleResult.victory ? ['hold', 'hold', 'hold'] : game.orders,
    }
    const approachingCrown = battleResult.victory ? BOSS_MECHANICS[continued.day] : undefined
    if (approachingCrown) {
      enqueueMilestones([crownApproachMilestone(game.runId, continued.day, approachingCrown)])
    }
    const opensInterlude = battleResult.victory && battleResult.boss && ACT_TRANSITIONS[continued.day] !== undefined
    persistOutcome(continued)
    setGame(continued)
    commitMetaProgress(achievementCandidates)
    setBattleResult(null)
    setFocusLane(battleResult.victory ? 0 : battleResult.focusLane)
    const nextPhase = opensInterlude ? 'interlude' : grantsRelic ? 'relic' : battleResult.victory ? 'event' : 'camp'
    const nextSound: SoundEffect = opensInterlude ? 'crown' : grantsRelic ? 'relic' : 'fire'
    const nextVibration = opensInterlude
      ? [20, 28, 38, 30, 54]
      : grantsRelic
        ? [18, 26, 22, 38]
        : battleResult.victory
          ? [16, 22, 30]
          : [20, 30, 24, 38]
    revealPhase(nextPhase, nextSound, nextVibration)
    if (!grantsRelic && !opensInterlude) {
      const statusMessage = battleResult.victory
        ? '새벽이 밝았습니다. 다음 경로를 선택하세요.'
        : primaryFailureInsight
          ? `같은 밤을 재도전합니다. 신호탄 비용 복구 −${nextRecoveryRecruitDiscount}. ${primaryFailureInsight.action}`
          : `신호탄 비용 복구 −${nextRecoveryRecruitDiscount}. 방어선을 다시 짜고 같은 밤에 재도전하세요.`
      announce(statusMessage)
    }
  }

  function onUnitPointerDown(event: ReactPointerEvent<HTMLButtonElement>, unitId: string) {
    if (event.button !== 0 || phase !== 'camp') return
    const touch = event.pointerType === 'touch'
    dragSession.current = {
      pointerId: event.pointerId,
      unitId,
      startX: event.clientX,
      startY: event.clientY,
      touch,
      dragging: false,
    }
    if (!touch) event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onUnitPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const session = dragSession.current
    if (!session || session.pointerId !== event.pointerId) return
    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY)
    if (session.touch) {
      if (distance > 8) session.dragging = true
      return
    }
    if (!session.dragging && distance > 7) {
      session.dragging = true
      setSelectedUnitId(session.unitId)
      setDraggingUnitId(session.unitId)
    }
    if (session.dragging) moveDragGhost(event.clientX, event.clientY)
  }

  function onUnitPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const session = dragSession.current
    if (!session || session.pointerId !== event.pointerId) return

    if (session.dragging && !session.touch) {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      const rosterSlot = target?.closest<HTMLElement>('[data-roster-slot]')
      const lane = target?.closest<HTMLElement>('[data-lane-index]')

      if (rosterSlot) {
        moveOrMerge(session.unitId, Number(rosterSlot.dataset.rosterSlot))
      } else if (lane) {
        deployUnit(Number(lane.dataset.laneIndex), session.unitId)
      }
    } else if (!session.dragging) {
      handleRosterTap(session.unitId)
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resetDragGhost()
  }

  function onUnitPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resetDragGhost()
  }

  return (
    <div
      className="game-shell"
      data-phase={phase}
      data-network={online ? 'online' : 'offline'}
      data-runtime={runtimeActive ? 'active' : 'paused'}
      data-roster-open={mobileRosterOpen ? 'true' : 'false'}
      data-tutorial={tutorialStep ?? 'complete'}
      data-motion={settings.motion}
      data-text-size={settings.largeText ? 'large' : 'default'}
      data-contrast={settings.highContrast ? 'high' : 'default'}
      data-battle-pace={settings.battlePace}
      data-soundscape={soundscapeMood}
    >
      <div className="game-stage" inert={gameIsBlocked && !campaignStagePending ? true : undefined}>
        <WorldBackdrop actNumber={currentAct.number} showCampaignArt={!showTitle} />

        {!showTitle ? (
          <CampaignHud
            game={game}
            actNumber={currentAct.number}
            actTitle={currentAct.title}
            bossBattle={currentStory.boss}
            currentBossName={currentBossMechanic?.name ?? null}
            nextCrownNight={nextCrownNight}
            nextCrownName={nextCrownMechanic?.name ?? null}
            marchSealActive={marchSealCeremony !== null}
            nextRankEntry={nextRankEntry}
            liveRank={liveRankEntry.rank}
            liveRankProgress={liveRankProgress}
            soundOn={soundOn}
            emberPulseActive={activeResonances.includes('ember-pulse')}
            toggleSound={toggleSound}
            openSettings={openSettings}
            openArchive={openArchive}
            openGuide={openGuide}
            openExpeditionMenu={openExpeditionMenu}
          />
        ) : null}

        {phase === 'camp' && !showTitle ? (
          <>
            <CampaignStageGate onReady={setCampaignStageReady} />

            {game.campaignStarted && game.day === 1 && game.activeLegacy.length > 0 ? (
              <LegacyDepartureBriefing legacyIds={game.activeLegacy} />
            ) : null}

            {tutorialStep && tutorialCopy && !showGuide && !showArchive ? (
              <TutorialCoach
                step={tutorialStep}
                copy={tutorialCopy}
                stepIndex={tutorialIndex}
                objective={tutorialObjective}
                actionLabel={tutorialActionLabel}
                onSkip={skipTutorial}
                onFocusTarget={focusTutorialTarget}
              />
            ) : null}

            <div className="game-layout">
              <section
                className="battle-panel panel"
                aria-labelledby="battle-title"
                aria-hidden={compactViewport && mobileRosterOpen ? true : undefined}
                inert={compactViewport && mobileRosterOpen ? true : undefined}
              >
                <BattleBriefing
                  day={game.day}
                  difficulty={game.difficulty}
                  story={currentStory}
                  condition={currentCondition}
                  protocol={difficultyProtocol}
                  masteryForecast={protocolMasteryForecast}
                  veteranBriefing={veteranBriefing}
                />

                <BattleReadiness
                  day={game.day}
                  storyBoss={currentStory.boss}
                  nextCrownMechanic={nextCrownMechanic}
                  firstCrownBriefing={firstCrownBriefing}
                  firstCrownReadyCount={firstCrownReadyCount}
                  firstCrownSignals={firstCrownSignals}
                  currentBuildDoctrine={currentBuildDoctrine}
                  activeResonanceCount={activeResonances.length}
                  ownedRelics={game.relics}
                  startedResonanceStatuses={startedResonanceStatuses}
                  nextRelicNight={nextRelicNight}
                  finalMarchGate={finalMarchGate}
                  finalMarchBriefing={finalMarchBriefing}
                  currentDoctrineBroken={currentEliteDoctrineForecast?.broken ?? false}
                  finalMarchForecastAvailable={finalMarchBattlePreview !== null}
                  projectedReturnHeat={projectedReturnHeat}
                  tierThreeLineCount={tierThreeLineCount}
                  formationKindCount={formationKindCount}
                />

                <BattleDirectives
                  day={game.day}
                  actNumber={currentStory.act}
                  currentBossMechanic={currentBossMechanic}
                  activeDecisionEcho={activeDecisionEcho}
                  lineupReady={lineupReady}
                  decisionEchoForecastCount={decisionEchoForecastCount}
                  finalMarchImprintCount={activeFinalMarchImprints.length}
                  finalMarchImprintForecasts={finalMarchImprintForecasts}
                  finalMarchImprintForecastCount={finalMarchImprintForecastCount}
                  activeFinalVow={activeFinalVow}
                  finalVowForecastCount={finalVowForecastCount}
                  projectedBattleVictory={projectedBattleVictory}
                  finalCrownForecast={finalCrownForecast}
                  finalCrownForecastCount={finalCrownForecastCount}
                  projectedWins={projectedWins}
                  commandSpent={commandSpent}
                  commandLimit={commandLimit}
                  projectedCrownMasteryScore={projectedCrownMasteryScore}
                  currentEliteEncounter={currentEliteEncounter}
                  currentEliteDoctrine={currentEliteDoctrine}
                  doctrineCommandRelief={doctrineCommandRelief}
                  doctrineCommandFloor={doctrineCommandFloor}
                />

                <div className="battle-stage">
                  <div className="stage-label enemy-label">
                    <span>빙결 군단</span>
                    <i />
                  </div>

                  <EnemyFormation entries={enemyFormationEntries} />

                  <div className="clash-line" aria-hidden="true">
                    <span />
                    <b>VS</b>
                    <span />
                  </div>

                  <div className="stage-label player-label">
                    <span>우리 전선</span>
                    <i />
                  </div>

                  <PlayerFormation
                    lineupUnits={lineupUnits}
                    forecasts={forecastLanes}
                    selectedUnit={selectedUnit}
                    deploymentForecasts={deploymentForecasts}
                    recommendedDeploymentLane={recommendedDeploymentLane}
                    selectedUnitId={selectedUnitId}
                    focusLane={focusLane}
                    tutorialDeploy={tutorialStep === 'deploy'}
                    activeDecisionEcho={activeDecisionEcho}
                    activeFinalVow={activeFinalVow}
                    getSurvivorName={survivorName}
                    onClearSelection={clearDeploymentSelection}
                    onDeploy={deployUnit}
                  />

                  <BattleCommandControls
                    focusLane={focusLane}
                    focusBonusPercent={focusBonusPercent}
                    focusResonanceActive={activeResonances.includes('whiteout-sight')}
                    tutorialFocus={tutorialStep === 'focus'}
                    tutorialOrders={tutorialStep === 'orders'}
                    tutorialRecommendedFocusLane={tutorialRecommendedFocusLane}
                    orders={game.orders}
                    enemyIntents={battleContext.enemyIntents}
                    commandSpent={commandSpent}
                    commandLimit={commandLimit}
                    commandLimitBeforeContract={commandLimitBeforeContract}
                    doctrineCommandRelief={doctrineCommandRelief}
                    legacyCommand={legacyCommandContribution}
                    masteryContract={game.masteryContract}
                    tacticalRehearsal={tacticalRehearsal}
                    tacticalAdjustmentAvailable={tacticalAdjustment !== null}
                    onChooseFocusLane={chooseFocusLane}
                    onChooseOrder={chooseOrder}
                    onApplyTacticalAdjustment={applyTacticalAdjustment}
                  />
                </div>

                <BattleLaunch
                  forecastReady={battleActionReady}
                  forecastTitle={battleForecastTitle}
                  forecastDetail={battleForecastDetail}
                  laneForecasts={forecastLanes}
                  recommendedLane={tacticalAdjustment?.lane ?? null}
                  legacyCommand={legacyCommandContribution}
                  legacyRewardForecast={legacyRewardForecast}
                  masteryContractForecast={masteryContractForecast}
                  riskDepartureForecast={riskDepartureForecast}
                  actionLabel={battleActionLabel}
                  actionDisabled={battleStartDisabled}
                  tutorialBattle={tutorialStep === 'battle'}
                  onCancelRiskDeparture={cancelRiskDeparture}
                  onStartBattle={startBattle}
                />
              </section>

              <section
                id="mobile-roster-sheet"
                className="camp-panel panel"
                role={compactViewport ? 'dialog' : undefined}
                aria-labelledby="camp-title"
                aria-describedby={compactViewport ? 'camp-instruction' : undefined}
                aria-hidden={compactViewport && !mobileRosterOpen ? true : undefined}
                data-mobile-open={mobileRosterOpen ? 'true' : 'false'}
                inert={compactViewport && !mobileRosterOpen ? true : undefined}
              >
                <CampOverview
                  rosterCount={rosterCount}
                  mergeReadyPairCount={mergeReadyPairCount}
                  oath={game.oath}
                  mode={game.mode}
                  runCode={runCodeFor(game.runSeed)}
                  heat={game.heat}
                  oathChronicleTitle={oathChronicle.title}
                  oathInterventionCount={oathInterventionCount}
                  oathInterventionPath={oathInterventionPath}
                  trialStatuses={trialStatuses}
                  ownedRelics={game.relics}
                  activeResonances={activeResonances}
                  resonanceStatuses={resonanceStatuses}
                  activeLegacy={game.activeLegacy}
                  inactiveLegacyCount={Math.max(0, meta.legacy.length - game.activeLegacy.length)}
                  getResonanceForRelic={resonanceForRelic}
                  onClose={showBattlefield}
                />

                <CampRosterGrid
                  slots={game.slots}
                  mergeReadinessByUnit={mergeReadinessByUnit}
                  selectedUnitId={selectedUnitId}
                  draggingUnitId={draggingUnitId}
                  tutorialMerge={tutorialStep === 'merge'}
                  getSurvivorName={survivorName}
                  getUnitPower={unitPower}
                  onRosterTap={handleRosterTap}
                  onEmptySlot={handleEmptySlot}
                  onUnitPointerDown={onUnitPointerDown}
                  onUnitPointerMove={onUnitPointerMove}
                  onUnitPointerUp={onUnitPointerUp}
                  onUnitPointerCancel={onUnitPointerCancel}
                />

                <QuartermasterLedger
                  day={game.day}
                  supplies={game.supplies}
                  recoverySupplies={game.recoverySupplies}
                  spendable={quartermasterSpendable}
                  reserve={quartermasterReserve}
                  briefing={quartermasterBriefing}
                  recruit={{
                    cost: recruitCost,
                    afterNext: recruitCostAfterNext,
                    nightPressure: recruitNightPressure,
                    scalePressure: recruitScalePressure,
                    difficultyDelta: difficultyProtocol.recruitCostDelta,
                    discount: recruitDiscount,
                    recoveryDiscount: recoveryRecruitDiscount,
                  }}
                  returnForecast={
                    campBattlePreview
                      ? {
                          victory: campBattlePreview.victory,
                          supplyReward: campBattlePreview.supplyReward,
                          supplies: projectedCampReturnSupplies,
                          heat: projectedCampReturnHeat,
                        }
                      : null
                  }
                  pace={{
                    growthGap: campaignPaceGrowthGap,
                    lineupTierTotal,
                    target: campaignPaceTierTarget,
                    crownGrowth: campaignPaceBenchmark.crownGrowth,
                    progress: campaignPaceProgress,
                    heatGap: campaignPaceHeatGap,
                  }}
                />

                <CampActions
                  recruit={{
                    kind: nextRecruitKind,
                    pairReady: nextRecruitTierOneCount > 0,
                    reserveRisk: game.supplies >= recruitCost && !recruitKeepsReserve,
                    reserve: quartermasterReserve,
                    cost: recruitCost,
                    afterNext: recruitCostAfterNext,
                    nightPressure: recruitNightPressure,
                    scalePressure: recruitScalePressure,
                    difficultyDelta: difficultyProtocol.recruitCostDelta,
                    discount: recruitDiscount,
                    recoveryDiscount: recoveryRecruitDiscount,
                    disabled: rosterCount >= ROSTER_SIZE || game.supplies < recruitCost,
                  }}
                  stoke={{
                    heat: game.heat,
                    heatGain: stokeHeatGain,
                    baseCost: stokeBaseCost,
                    cost: stokeCost,
                    disabled: game.supplies < stokeCost || game.heat >= 100,
                  }}
                  marchSeal={
                    game.day >= 9
                      ? {
                          unlocked: marchSealUnlocked,
                          supplies: marchSealSupplies,
                          reserve: marchSealReserve,
                          recoveryReserve: marchSealRecoveryReserve,
                          scoreRate: marchSealScoreRate,
                          score: marchSealScore,
                          legacy: marchSealLegacyActive
                            ? {
                                baseScoreRate: marchSealBaseScoreRate,
                                scoreBonus: marchSealLegacyScoreBonus,
                              }
                            : null,
                          contract: game.masteryContract
                            ? {
                                id: game.masteryContract,
                                inheritedScoreRate: marchSealInheritedScoreRate,
                                scoreBonus: marchSealContractScoreBonus,
                              }
                            : null,
                          veteranLines: marchSealVeteranLines,
                          disabled: !marchSealUnlocked || marchSealSupplies < 10,
                        }
                      : null
                  }
                  onRecruit={recruit}
                  onStoke={stokeFire}
                  onSealMarchSupplies={sealMarchSupplies}
                />

                <CampUndoNotice undo={campUndo} onUndo={undoCampAction} />

                <SelectedUnitReadout
                  selectedUnit={selectedUnit}
                  selectedUnitLane={selectedUnitLane}
                  deploymentForecasts={deploymentForecasts}
                  recommendedDeploymentLane={recommendedDeploymentLane}
                  mergeReadiness={selectedUnit ? (mergeReadinessByUnit.get(selectedUnit.id) ?? null) : null}
                  rosterCount={rosterCount}
                  getSurvivorName={survivorName}
                  onQuickDeploy={quickDeploySelectedUnit}
                />
              </section>
            </div>

            <MobileCommandDock
              rosterOpen={mobileRosterOpen}
              projectedWins={projectedWins}
              rosterCount={rosterCount}
              day={game.day}
              battleDisabled={battleStartDisabled}
              battleReady={battleActionReady}
              battleActionLabel={mobileBattleActionLabel}
              battleForecastTitle={battleForecastTitle}
              battleForecastDetail={battleForecastDetail}
              riskDepartureForecast={riskDepartureForecast}
              tacticalSuggestion={
                tacticalAdjustment && tacticalRehearsal
                  ? {
                      title: tacticalRehearsal.title,
                      status: tacticalRehearsal.status,
                      actionLabel: tacticalRehearsal.actionLabel,
                    }
                  : null
              }
              onShowBattlefield={showBattlefield}
              onShowRoster={showMobileRoster}
              onApplyTacticalSuggestion={applyTacticalAdjustment}
              onCancelRiskDeparture={cancelRiskDeparture}
              onStartBattle={startBattle}
            />

            <DragGhostPreview
              active={draggingUnitId !== null}
              ghostRef={dragGhostRef}
              glyph={KIND_META[findUnit(game, draggingUnitId)?.kind ?? 'warden'].glyph}
            />
          </>
        ) : null}
      </div>

      <GameFeedback
        sessionAccess={sessionAccess}
        toast={toast}
        growthCeremony={!showTitle && phase === 'camp' ? growthCeremony : null}
        marchSealCeremony={marchSealCeremony}
        milestone={milestoneVisible ? activeMilestone : null}
        milestoneQueueSize={milestoneQueue.length}
        runtimeNotice={runtimeNotice}
        onRetrySession={retrySessionAccess}
        onApplyUpdate={reloadUpdatedGame}
        onDismissMilestone={dismissActiveMilestone}
      />

      {showTitle ? (
        <TitleScreen
          blocked={sessionAccess !== 'active' || showArchive || showInstallHelp || showSettings || showExpeditionMenu}
          showDifficulty={showDifficulty}
          selectedDifficulty={selectedDifficulty}
          setupMode={setupMode}
          selectedMasteryContract={selectedMasteryContract}
          sharedCode={sharedCode}
          sharedSeed={sharedSeed}
          incomingRiftCode={incomingRiftCode}
          unlockedAchievementIds={unlockedAchievementIds}
          showEndingRouteRecommendation={showEndingRouteRecommendation}
          completedEndingId={completedCurrentEndingId}
          nextWinningEndingId={nextWinningEndingId}
          nextWinningEndingRoute={nextWinningEndingRoute}
          meta={meta}
          masteredProtocolCount={masteredProtocolCount}
          ready={ready}
          hasProgress={hasProgress}
          game={game}
          currentActNumber={currentAct.number}
          currentStoryTitle={currentStory.title}
          difficultyProtocolName={difficultyProtocol.name}
          rosterCount={rosterCount}
          standalone={standalone}
          installPrompt={installPrompt !== null}
          installPending={installPending}
          bestScore={bestScore}
          runtimeState={runtimeState}
          runtimeStateCopy={runtimeStateCopy}
          soundOn={soundOn}
          setShowDifficulty={setShowDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          setSetupMode={setSetupMode}
          setSelectedMasteryContract={setSelectedMasteryContract}
          setSharedCode={setSharedCode}
          setShowInstallHelp={setShowInstallHelp}
          openArchive={openArchive}
          openSettings={openSettings}
          toggleSound={toggleSound}
          enterGame={enterGame}
          prepareIncomingRift={prepareIncomingRift}
          dismissIncomingRift={dismissIncomingRift}
          askToDiscardCurrentCampaign={askToDiscardCurrentCampaign}
          installGame={installGame}
          preloadEnterGame={() => {
            if (hasProgress) preloadPhaseLayer(phase, game.day >= MAX_NIGHTS - 1)
          }}
          startCampaign={startCampaign}
        />
      ) : null}

      {showInstallHelp ? (
        <InstallHelpDialog offlineReady={offlineReady} onClose={() => setShowInstallHelp(false)} />
      ) : null}

      {phase === 'event' && !showTitle && !showGuide ? (
        <CampaignEventDialog
          blocked={showArchive}
          actNumber={currentAct.number}
          day={game.day}
          event={currentEvent}
          oathIntervention={eventOathIntervention}
          decisionEcho={activeDecisionEcho}
          crownTiming={eventCrownTiming}
          crownHeatFloor={eventCrownHeatFloor}
          stokeBaseCost={stokeBaseCost}
          finalMarchPath={game.day >= 9 ? finalMarchEventPath : null}
          choiceEntries={eventChoiceEntries}
          onChooseChoice={resolveCampaignEvent}
          onOpenMap={() => openArchive('map')}
        />
      ) : null}

      {showArchive ? (
        <ArchiveDialog
          archiveTab={archiveTab}
          bestScore={bestScore}
          completedEndingId={completedCurrentEndingId}
          endingDiscoveryEntries={endingDiscoveryEntries}
          game={game}
          masteredProtocolCount={masteredProtocolCount}
          meta={meta}
          nextChallengeDifficulty={nextChallengeDifficulty}
          pendingLegacyPurchase={pendingLegacyPurchase}
          recommendedLegacyId={recommendedLegacyId}
          unlockedAchievementIds={unlockedAchievementIds}
          closeArchive={closeArchive}
          prepareNextChallenge={prepareNextChallenge}
          setArchiveTab={setArchiveTab}
          setPendingLegacyPurchase={setPendingLegacyPurchase}
          requestLegacyPurchase={requestLegacyPurchase}
          cancelLegacyPurchase={cancelLegacyPurchase}
          confirmLegacyPurchase={confirmLegacyPurchase}
          activeResonancesFor={activeResonancesFor}
          expeditionRank={expeditionRank}
          runCodeFor={runCodeFor}
        />
      ) : null}

      {phase === 'battling' && battleResult && !showTitle ? (
        <BattleCinemaDirector
          battleResult={battleResult}
          game={game}
          motion={settings.motion}
          battlePace={settings.battlePace}
          currentActNumber={currentAct.number}
          storyTitle={currentStory.title}
          storyWeather={currentStory.weather}
          storyLocation={currentStory.location}
          currentBossMechanic={currentBossMechanic}
          currentEliteEncounter={currentEliteEncounter}
          currentEliteDoctrine={currentEliteDoctrine}
          activeDecisionEcho={activeDecisionEcho}
          activeFinalVow={activeFinalVow}
          battleOpeningNarration={battleOpeningNarration}
          snow={SNOW_PARTICLES}
          onLaneImpact={playBattleLaneImpact}
          onClimax={playBattleClimax}
          onComplete={completeBattleCinema}
          onSkip={skipBattleCinema}
          finalCrownSealFor={finalCrownSealFor}
          finalCrownSealBroken={finalCrownSealBroken}
          survivorName={survivorName}
        />
      ) : null}

      {phase === 'interlude' && currentActTransition && !showTitle ? (
        <ActInterlude
          currentActTransition={currentActTransition}
          game={game}
          veteranCount={veteranCount}
          snow={SNOW_PARTICLES}
          continueActInterlude={continueActInterlude}
        />
      ) : null}

      {phase === 'finale' && game.status === 'won' && battleResult && !showTitle ? (
        <FinaleSequence
          game={game}
          finalCrownBreakCount={battleResult.crownBreakCount}
          finalCrownWins={battleResult.wins}
          finalCrownMasteryBonus={battleResult.crownMasteryBonus}
          endingFinalVow={endingFinalVow}
          revealFinalEnding={revealFinalEnding}
        />
      ) : null}

      {showExpeditionMenu ? (
        <ExpeditionMenu
          showNewCampaignConfirm={showNewCampaignConfirm}
          replacementRiftCode={pendingReplacementRiftCode}
          game={game}
          meta={meta}
          currentActNumber={currentAct.number}
          currentStoryTitle={currentStory.title}
          encounterGlyph={currentBossMechanic?.glyph ?? currentCondition.glyph}
          runCode={runCodeFor(game.runSeed)}
          unlockedAchievementCount={unlockedAchievementIds.size}
          cancelDiscardCampaign={cancelDiscardCampaign}
          closeExpeditionMenu={closeExpeditionMenu}
          discardCurrentCampaign={discardCurrentCampaign}
          openSettingsFromMenu={openSettingsFromMenu}
          returnToTitle={returnToTitle}
          askToDiscardCurrentCampaign={askToDiscardCurrentCampaign}
        />
      ) : null}

      {showSettings ? (
        <SettingsDialog
          settings={settings}
          storageProtection={storageProtection}
          storageRequestPending={storageRequestPending}
          restorePending={restorePending}
          backupInputRef={backupInputRef}
          closeSettings={closeSettings}
          toggleSound={toggleSound}
          toggleHaptics={toggleHaptics}
          updateSettings={updateSettings}
          previewSound={() => playSound('select', soundOn)}
          requestPersistentStorage={requestPersistentStorage}
          exportGameBackup={exportGameBackup}
          restoreGameBackup={restoreGameBackup}
          resetSettings={resetSettings}
        />
      ) : null}

      {showGuide && !showTitle ? (
        <GameGuideDialog trainingRecovery={trainingRecovery} onClose={closeGuide} onRecoverTraining={recoverTutorial} />
      ) : null}

      {phase === 'promotion' && pendingPromotionUnit && !showTitle ? (
        <PromotionDialog
          key={pendingPromotionUnit.id}
          pendingPromotionUnit={pendingPromotionUnit}
          promotionChoices={promotionChoices}
          promotionChoiceInsights={promotionChoiceInsights}
          recommendedSpecializationId={recommendedSpecializationId}
          growthCeremony={growthCeremony?.unitId === pendingPromotionUnit.id ? growthCeremony : null}
          campUndo={campUndo}
          previewSpecialization={previewSpecialization}
          chooseSpecialization={chooseSpecialization}
          undoCampAction={undoCampAction}
          survivorName={survivorName}
        />
      ) : null}

      {phase === 'relic' && game.pendingRelic && !showTitle ? (
        <RelicDialog
          game={game}
          currentBuildDoctrine={currentBuildDoctrine}
          relicChoices={relicChoices}
          relicChoiceInsights={relicChoiceInsights}
          recommendedRelicId={recommendedRelicId}
          activeResonances={activeResonances}
          previewRelicChoice={previewRelicChoice}
          chooseRelic={chooseRelic}
          resonancePreviewFor={resonancePreviewFor}
        />
      ) : null}

      {phase === 'result' && battleResult && !showTitle ? (
        <BattleResultDialog
          battleResult={battleResult}
          game={game}
          currentStoryReport={currentStory.report}
          firstVictoryPreview={firstVictoryPreview}
          finalCrownMechanicBlocked={finalCrownMechanicBlocked}
          resultCrownBreakCount={resultCrownBreakCount}
          primaryFailureInsight={primaryFailureInsight}
          resultFinalMarchImprints={resultFinalMarchImprints}
          resultFinalMarchImprintCount={resultFinalMarchImprintCount}
          resultDecisionEchoCount={resultDecisionEchoCount}
          resultFinalVowCount={resultFinalVowCount}
          resultCrownStates={resultCrownStates}
          finalMarchGate={finalMarchGate}
          nextFinalMarchGate={nextFinalMarchGate}
          resolvedDoctrineLane={resolvedDoctrineLane}
          defeatInsights={defeatInsights}
          priorDefeatCount={priorDefeatCount}
          nextRetreatSupply={nextRetreatSupply}
          nextRecoveryRecruitDiscount={nextRecoveryRecruitDiscount}
          activeResonances={activeResonances}
          difficultyProtocol={difficultyProtocol}
          resultProtocolCopy={resultProtocolCopy}
          resultProtocolMastery={resultProtocolMastery}
          legacyCommand={legacyCommandContribution}
          survivorName={survivorName}
          continueAfterBattle={continueAfterBattle}
        />
      ) : null}

      {(phase === 'won' || phase === 'lost') && !showTitle ? (
        <EndingScreen
          outcome={phase}
          blocked={showArchive}
          game={game}
          meta={meta}
          currentActNumber={currentAct.number}
          currentEnding={currentEnding}
          expeditionRankLabel={expeditionRank(game.score, phase === 'won')}
          endingFinalVow={endingFinalVow}
          bestScore={bestScore}
          protocolMasteryProgress={protocolMasteryProgress}
          protocolMasteryRecognized={protocolMasteryRecognized}
          protocolMasteryUnlocked={protocolMasteryUnlocked}
          oathChronicle={oathChronicle}
          oathInterventionCount={oathInterventionCount}
          oathInterventionPath={oathInterventionPath}
          endingCommanderTitle={endingCommanderTitle}
          endingIsComparisonBest={endingIsComparisonBest}
          endingComparisonCount={endingComparisonCount}
          endingComparisonPosition={endingComparisonPosition}
          endingComparisonBestScore={endingComparisonBestScore}
          endingDossierSeals={endingDossierSeals}
          completedTrialCount={completedEndingTrials.length}
          activeResonances={activeResonances}
          trialStatuses={trialStatuses}
          endingDiscoveryEntries={endingDiscoveryEntries}
          endingMasteryDirective={endingMasteryDirective}
          legacyRewardBreakdown={endingLegacyRewardBreakdown}
          unownedLegacyIds={unownedLegacyIds}
          affordableLegacyIds={affordableLegacyIds}
          recommendedLegacyId={recommendedLegacyId}
          runCode={runCodeFor(game.runSeed)}
          nextWinningEndingId={nextWinningEndingId}
          nextChallengeDifficulty={nextChallengeDifficulty}
          replayExpedition={replayExpedition}
          prepareNextChallenge={prepareNextChallenge}
          sharePending={sharePending}
          shareExpedition={shareExpedition}
          openArchive={openArchive}
        />
      ) : null}
    </div>
  )
}
