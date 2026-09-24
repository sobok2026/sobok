import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { batchDestination, batchOrigin, carriedBatch } from '../game/batches'
import {
  customerNames,
  formatAmount,
  INGREDIENTS,
  isCupSurface,
  money,
  RECIPES,
  recipeIds,
  recipeLabel,
  STATIONS,
  type StationId,
  tableIds,
} from '../game/catalog'
import { cleaningHandsBusy, cupSurface, dirtyTableCount } from '../game/cleaning'
import { COLD_BREW_BEANS, COLD_BREW_COST, COLD_BREW_WATER } from '../game/cold-brew'
import { craftStations } from '../game/crafting'
import { CUSTOMER_SECONDS, CUSTOMER_STATUS, customerWalking } from '../game/customer'
import type { Preferences } from '../game/preferences'
import { PREPARATIONS, preparationStep } from '../game/preparation'
import { expiryAt } from '../game/quality'
import type { CafeScene, MouseMode } from '../game/scene'
import type { GameState } from '../game/state'
import { exportGame, importGame, loadGame, loadPreferences, saveGame, savePreferences } from '../game/storage'
import {
  type Action,
  available,
  CafeStore,
  closingTasks,
  initialState,
  nextStep,
  suggestedInstruction,
  suggestedStation,
} from '../game/store'
import { SUPPLIES, supplyIds } from '../game/supplies'
import { washingHandsBusy } from '../game/washing'
import BatchLabel from './BatchLabel'
import { Button, TextButton } from './Button'
import CleaningHud from './CleaningHud'
import ColdBrewHud from './ColdBrewHud'
import CraftingHud from './CraftingHud'
import FirstShiftGuide, { firstOrdersDone } from './FirstShiftGuide'
import InventoryPanel from './InventoryPanel'
import PreparationHud from './PreparationHud'
import ShiftLedger from './ShiftLedger'
import SupplyPanel from './SupplyPanel'
import WashingHud from './WashingHud'
import WorkSettings from './WorkSettings'
import { actionSound, createWorkSounds, type SoundStatus, tickSound, workLoop } from './work-sounds'

function CupIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      className="inline-block shrink-0"
      width={small ? 24 : 40}
      height={small ? 24 : 40}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path d="M10 13h20l-3 21H13l-3-21Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 13h24M12 8h16l2 5M17 2v3M23 2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 21h16M13 27h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
function clock(time: number) {
  return new Date(time * 1000).toLocaleTimeString('ko-KR', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
}
export default function App() {
  const [boot, setBoot] = useState<{
    store: CafeStore
    hasSave: boolean
    notice: string
    preferences: Preferences
  } | null>(null)
  useEffect(() => {
    let cancelled = false
    const game = loadGame()
      .then(({ state, recovered }) => ({
        state,
        hasSave: !!state,
        notice: recovered ? '이전 정상 저장본으로 복구했어요.' : '',
      }))
      .catch(() => ({
        state: null,
        hasSave: false,
        notice: '저장 기록을 읽지 못했어요. 새 근무를 시작하거나 백업 파일을 불러올 수 있어요.',
      }))
    void Promise.all([game, loadPreferences()]).then(([game, preferences]) => {
      if (!cancelled)
        setBoot({
          store: new CafeStore(game.state ?? initialState()),
          hasSave: game.hasSave,
          notice: game.notice,
          preferences,
        })
    })
    return () => {
      cancelled = true
    }
  }, [])
  return boot ? (
    <CafeGame {...boot} />
  ) : (
    <div className="flex h-dvh flex-col items-center justify-center gap-5">
      <CupIcon />
      <p className="mb-4 text-body text-muted">매장의 불을 켜고 있어요.</p>
      <span className="text-xs tracking-[0.24em]">DAY SHIFT</span>
    </div>
  )
}

function CafeGame({
  store,
  hasSave,
  notice,
  preferences: initialPreferences,
}: {
  store: CafeStore
  hasSave: boolean
  notice: string
  preferences: Preferences
}) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [preferences, setPreferences] = useState(initialPreferences)
  const preferencesRef = useRef(preferences)
  preferencesRef.current = preferences
  const [preferencesError, setPreferencesError] = useState(false)
  const [soundStatus, setSoundStatus] = useState<SoundStatus>('off')
  const sounds = useRef<ReturnType<typeof createWorkSounds> | null>(null)
  const focused = useRef(true)
  const [guideOpen, setGuideOpen] = useState(initialPreferences.guidance && !firstOrdersDone(state))
  const guideOpenRef = useRef(guideOpen)
  guideOpenRef.current = guideOpen
  const guideDone = firstOrdersDone(state)
  useEffect(() => {
    if (guideDone) setGuideOpen(false)
  }, [guideDone])
  useEffect(() => {
    const player = createWorkSounds(setSoundStatus)
    sounds.current = player
    player.configure(preferencesRef.current)
    return () => {
      sounds.current = null
      player.dispose()
    }
  }, [])
  const [mode, setMode] = useState<'welcome' | 'play' | 'pause' | 'guide' | 'overview'>('welcome')
  const [panel, setPanel] = useState<StationId | null>(null)
  const [target, setTarget] = useState<StationId | null>(null)
  const [needsStaffAccess, setNeedsStaffAccess] = useState(false)
  const [saveStatus, setSaveStatus] = useState(notice || '이 기기에 자동 저장')
  const [saveError, setSaveError] = useState(false)
  const [graphicsError, setGraphicsError] = useState('')
  const [sceneReady, setSceneReady] = useState(false)
  const [hasLock, setHasLock] = useState<boolean | null>(null)
  const [mouseMode, setMouseMode] = useState<MouseMode>('cursor')
  const [confirmNew, setConfirmNew] = useState(false)
  const [started, setStarted] = useState(false)
  const [posSelection, setPosSelection] = useState(state.ticket ?? state.request)
  const customerId = state.customer?.id
  useEffect(() => {
    if (customerId) setPosSelection(state.ticket ?? state.request)
  }, [customerId, state.ticket, state.request])
  const [dismissedMessageId, setDismissedMessageId] = useState(state.messages.at(-1)?.id)
  const lastMessage = state.messages.at(-1)
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDismissedMessageId(lastMessage?.id),
      lastMessage?.tone === 'error' ? 6000 : 3000,
    )
    return () => window.clearTimeout(timeout)
  }, [lastMessage?.id, lastMessage?.tone])
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<CafeScene | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const flags = useRef({ mode, panel, started, hasLock })
  flags.current = { mode, panel, started, hasLock }

  function updatePreferences(update: Partial<Preferences>) {
    const next = { ...preferencesRef.current, ...update }
    preferencesRef.current = next
    setPreferences(next)
    sounds.current?.configure(next)
    if (update.muted === false) void sounds.current?.unlock()
    void savePreferences(next)
      .then(() => setPreferencesError(false))
      .catch(() => setPreferencesError(true))
  }
  function toggleGuide() {
    stopUse()
    const open = !guideOpenRef.current
    guideOpenRef.current = open
    setGuideOpen(open)
    updatePreferences({ guidance: open })
    if (open && flags.current.mode === 'play') scene.current?.unlockForCraft()
  }
  function updateSoundLoop() {
    const playing =
      flags.current.mode === 'play' &&
      flags.current.started &&
      flags.current.hasLock &&
      !document.hidden &&
      focused.current
    sounds.current?.setLoop(
      playing && !preferencesRef.current.muted && preferencesRef.current.volume > 0
        ? workLoop(
            store.getSnapshot(),
            store.getActiveInput(),
            scene.current?.capture() ?? store.getSnapshot().position,
          )
        : null,
    )
  }

  function capture(): GameState {
    return { ...store.getSnapshot(), position: scene.current?.capture() ?? store.getSnapshot().position }
  }
  async function persist() {
    if (!flags.current.started || !flags.current.hasLock) return
    try {
      await saveGame(capture())
      setSaveStatus('이 기기에 저장됨')
      setSaveError(false)
    } catch {
      setSaveStatus('저장 실패 · 백업 파일로 기록을 보관해주세요')
      setSaveError(true)
    }
  }
  function openPanel(id: StationId) {
    stopUse()
    const current = store.getSnapshot()
    const carrying = carriedBatch(current)
    if (carrying && id !== 'pos') {
      if (id === 'stock' || id === 'shelf')
        act({ type: 'store-batch', id: carrying.id, storage: id === 'stock' ? 'fridge' : 'room', station: id })
      else act({ type: 'return-batch', station: id })
      return
    }
    if (current.supplyDelivery && (id === 'condiment' || id === 'stock')) {
      act({ type: id === 'condiment' ? 'place-supply' : 'return-supply' })
      return
    }
    if (id === 'trash' && current.cleaning?.heldCups) {
      act({ type: 'drop-used-cups' })
      return
    }
    if (id === current.cleaning?.station) {
      if (current.cleaning.stage === 'collect') act({ type: 'collect-cup' })
      else scene.current?.unlockForCraft()
      return
    }
    if (id === 'wash' && current.washing) {
      if (current.washing.stage === 'ready') act({ type: 'take-washed' })
      else if (current.washing.stage === 'carrying') act({ type: 'leave-wash' })
      else scene.current?.unlockForCraft()
      return
    }
    if (id === 'rack' && current.washing?.stage === 'carrying') {
      act({ type: 'rack' })
      return
    }
    if (id === 'prep' && current.preparation) {
      const batch = current.batches.find((item) => item.id === current.preparation?.batchId)
      if (batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time)
        act({ type: 'take-batch', id: batch.id, station: id })
      else scene.current?.unlockForCraft()
      return
    }
    if (id === 'cold-prep' && current.coldBrew) {
      const batch = current.batches.find((item) => item.id === current.coldBrew?.batchId)
      if (current.coldBrew.stage === 'finished') act({ type: 'collect-cold-brew' })
      else if (batch?.labelled && batch.expiresAt !== null && batch.expiresAt > current.time)
        act({ type: 'take-batch', id: batch.id, station: id })
      else scene.current?.unlockForCraft()
      return
    }
    if (id === 'cups' && current.ticket && !current.cup) {
      act({ type: 'take-cup' })
      return
    }
    if (
      current.cup &&
      craftStations.includes(id) &&
      (current.cup.craft.location === 'hand' || current.cup.craft.location === id)
    ) {
      moveCup(id)
      return
    }
    flags.current.panel = id
    setPanel(id)
    setTarget(null)
    if (id === 'pos') setPosSelection(store.getSnapshot().ticket ?? store.getSnapshot().request)
    scene.current?.unlock()
  }
  function dismissPanel() {
    flags.current.panel = null
    setPanel(null)
  }
  function closePanel() {
    dismissPanel()
    scene.current?.lock()
  }
  function beginWork() {
    dismissPanel()
    scene.current?.unlockForCraft()
  }
  function pause(nextMode: 'pause' | 'overview' = 'pause') {
    stopUse()
    sounds.current?.stop()
    flags.current.mode = nextMode
    flags.current.panel = null
    setPanel(null)
    setMode(nextMode)
    scene.current?.unlock()
    void persist()
  }
  function resume() {
    focused.current = true
    void sounds.current?.unlock()
    flags.current.mode = 'play'
    flags.current.panel = null
    setPanel(null)
    setMode('play')
    scene.current?.lock()
  }
  function start(fresh = false) {
    focused.current = true
    void sounds.current?.unlock()
    if (fresh) {
      const value = initialState()
      store.replace(value)
      scene.current?.reset(value.position)
      setGuideOpen(preferencesRef.current.guidance)
    }
    flags.current.started = true
    flags.current.mode = 'play'
    setStarted(true)
    setConfirmNew(false)
    setMode('play')
    scene.current?.lock()
    void persist()
  }
  function act(action: Action) {
    if (!flags.current.hasLock) return
    const previous = store.getSnapshot()
    store.dispatch(action)
    if ((action.type === 'wash' || action.type === 'take-washed') && store.getSnapshot().washing) {
      if (store.getSnapshot().washing?.stage === 'carrying') closePanel()
      else beginWork()
    }
    if (action.type === 'take-cup' && store.getSnapshot().cup) closePanel()
    if (action.type === 'take-supply' && store.getSnapshot().supplyDelivery) closePanel()
    if (action.type === 'take-batch' && carriedBatch(store.getSnapshot())) closePanel()
    if (action.type === 'return-batch' && !carriedBatch(store.getSnapshot())) beginWork()
    if ((action.type === 'start-cold-brew' || action.type === 'collect-cold-brew') && store.getSnapshot().coldBrew)
      beginWork()
    if (action.type === 'start-preparation' && store.getSnapshot().preparation) {
      beginWork()
    }
    if (action.type === 'start-cleaning' && !previous.cleaning && store.getSnapshot().cleaning) beginWork()
    if ((action.type === 'collect-cup' && store.getSnapshot().cleaning?.heldCups) || action.type === 'drop-used-cups')
      closePanel()
    if (action.type === 'place-cup' && store.getSnapshot().cup?.craft.location === action.station)
      scene.current?.unlockForCraft()
    if (action.type === 'pick-cup' && store.getSnapshot().cup?.craft.location === 'hand') scene.current?.lock()
    const current = store.getSnapshot()
    if (flags.current.mode === 'play' && focused.current && !document.hidden) {
      const feedback = actionSound(action, previous, current, store.getActiveInput())
      if (feedback) sounds.current?.play(feedback)
    }
    updateSoundLoop()
    if (
      !flags.current.panel &&
      ((previous.cup && !current.cup) ||
        (previous.preparation && !current.preparation) ||
        (previous.coldBrew && !current.coldBrew) ||
        (previous.washing && !current.washing) ||
        (previous.cleaning && !current.cleaning) ||
        (previous.supplyDelivery && !current.supplyDelivery))
    )
      scene.current?.lock()
    if (action.type === 'next-day') {
      scene.current?.reset(store.getSnapshot().position)
      closePanel()
    }
    if (store.getSnapshot().phase === 'summary') {
      flags.current.panel = null
      setPanel(null)
      scene.current?.unlock()
    }
    void persist()
  }
  function moveCup(station: StationId) {
    const cup = store.getSnapshot().cup
    if (!cup) return
    act({ type: cup.craft.location === 'hand' ? 'place-cup' : 'pick-cup', station })
  }
  function use(station: StationId) {
    if (flags.current.mode !== 'play' || flags.current.panel) return
    if (station === store.getSnapshot().cleaning?.station) act({ type: 'clean-use' })
    else if (station === 'wash' && store.getSnapshot().washing) act({ type: 'wash-use' })
    else if (station === 'prep' && store.getSnapshot().preparation) act({ type: 'prep-use' })
    else if (station === 'cold-prep' && store.getSnapshot().coldBrew) act({ type: 'cold-use' })
    else act({ type: 'use-start', station })
  }
  function stopUse() {
    if (!store.getActiveInput()) return
    store.stopActiveInput()
    updateSoundLoop()
    void persist()
  }
  function tool(station: StationId) {
    if (station === store.getSnapshot().cleaning?.station) act({ type: 'clean-tool' })
    else if (station === 'wash' && store.getSnapshot().washing) act({ type: 'wash-tool' })
    else if (station === 'prep' && store.getSnapshot().preparation) act({ type: 'prep-tool' })
    else if (station === 'cold-prep' && store.getSnapshot().coldBrew) act({ type: 'cold-tool' })
    else act({ type: 'tool', station })
  }
  function confirm(station: StationId) {
    if (station === store.getSnapshot().cleaning?.station) {
      act({ type: 'clean-confirm' })
      return
    }
    if (station === 'rack' && store.getSnapshot().washing?.stage === 'carrying') {
      act({ type: 'rack' })
      return
    }
    if (station === 'wash' && store.getSnapshot().washing) {
      if (store.getSnapshot().washing?.stage === 'ready') act({ type: 'take-washed' })
      else act({ type: 'wash-confirm' })
      return
    }
    const prep = store.getSnapshot().preparation
    if (station === 'prep' && prep) {
      if (prep.fault) act({ type: 'discard-preparation' })
      else if (prep.stage === 'ready' && prep.batchId) {
        const batch = store.getSnapshot().batches.find((item) => item.id === prep.batchId)
        act({
          type:
            batch?.expiresAt != null && batch.expiresAt <= store.getSnapshot().time ? 'discard-batch' : 'label-batch',
          id: prep.batchId,
          station,
        })
      } else act({ type: 'prep-confirm' })
      return
    }
    const brew = store.getSnapshot().coldBrew
    if (station === 'cold-prep' && brew) {
      if (brew.fault) act({ type: 'discard-cold-brew' })
      else if (brew.stage === 'finished')
        act({
          type:
            brew.completedAt !== null &&
            expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= store.getSnapshot().time
              ? 'discard-cold-brew'
              : 'collect-cold-brew',
        })
      else if (brew.stage === 'ready' && brew.batchId) {
        const batch = store.getSnapshot().batches.find((item) => item.id === brew.batchId)
        act({
          type:
            batch?.expiresAt != null && batch.expiresAt <= store.getSnapshot().time ? 'discard-batch' : 'label-batch',
          id: brew.batchId,
          station,
        })
      } else act({ type: 'cold-confirm' })
      return
    }
    if (store.getSnapshot().cup?.craft.fault) act({ type: 'discard-cup' })
    else if (store.getSnapshot().cup && !nextStep(store.getSnapshot()) && station === 'pickup') act({ type: 'serve' })
    else act({ type: 'confirm-craft', station })
  }
  useEffect(() => {
    let cancelled = false
    let release: (() => void) | undefined
    if (!navigator.locks) {
      setHasLock(true)
      return
    }
    queueMicrotask(() => {
      if (cancelled) return
      void navigator.locks
        .request('sobok-cafe-writer', { ifAvailable: true }, async (lock) => {
          if (cancelled) return
          setHasLock(!!lock)
          if (lock)
            await new Promise<void>((resolve) => {
              release = resolve
            })
        })
        .catch(() => {
          if (!cancelled) setHasLock(false)
        })
    })
    return () => {
      cancelled = true
      release?.()
    }
  }, [])
  useEffect(() => {
    let cancelled = false
    void import('../game/scene')
      .then(({ createCafeScene }) => {
        if (cancelled || !host.current) return
        try {
          scene.current = createCafeScene(host.current, {
            getState: store.getSnapshot,
            isRunning: () =>
              flags.current.mode === 'play' &&
              flags.current.started &&
              flags.current.hasLock === true &&
              !document.hidden &&
              store.getSnapshot().phase !== 'summary',
            canMove: () =>
              flags.current.mode === 'play' &&
              flags.current.panel === null &&
              flags.current.hasLock === true &&
              store.getSnapshot().phase !== 'summary',
            onTarget: (id, blocked) => {
              setTarget(id)
              setNeedsStaffAccess(blocked)
            },
            onInteract: openPanel,
            onUseStart: use,
            onUseEnd: stopUse,
            onTool: tool,
            onConfirm: confirm,
            activeStation: () => store.getActiveInput()?.station ?? null,
            onMouseMode: setMouseMode,
            onUnlock: () => {
              if (
                flags.current.mode === 'play' &&
                flags.current.panel === null &&
                store.getSnapshot().phase !== 'summary'
              )
                pause()
            },
            onError: (message) => {
              setGraphicsError(message)
              pause()
            },
          })
          setSceneReady(true)
        } catch {
          setGraphicsError('3D 화면을 열지 못했어요. WebGL 2를 지원하는 브라우저와 그래픽 가속 설정을 확인해주세요.')
        }
      })
      .catch(() => setGraphicsError('게임 화면을 불러오지 못했어요. 새로고침해주세요.'))
    return () => {
      cancelled = true
      store.stopActiveInput()
      scene.current?.dispose()
      scene.current = null
    }
  }, [store])
  useEffect(() => {
    let last = performance.now()
    const tick = window.setInterval(() => {
      const now = performance.now()
      const seconds = (now - last) / 1000
      updateSoundLoop()
      if (!store.getActiveInput() && !customerWalking(store.getSnapshot().customer) && seconds < 0.49) return
      last = now
      if (flags.current.mode === 'play' && flags.current.started && flags.current.hasLock && !document.hidden) {
        const wasUsing = !!store.getActiveInput()
        const previous = store.getSnapshot()
        store.tick(seconds)
        if (focused.current) {
          const feedback = tickSound(previous, store.getSnapshot())
          if (feedback) sounds.current?.play(feedback)
        }
        updateSoundLoop()
        if (wasUsing && !store.getActiveInput()) void persist()
      }
    }, 100)
    const save = window.setInterval(() => {
      void persist()
    }, 8000)
    const hidden = () => {
      if (document.hidden && flags.current.started) pause()
      last = performance.now()
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
      if (
        event.code === 'KeyH' &&
        flags.current.started &&
        flags.current.mode === 'play' &&
        store.getSnapshot().phase !== 'summary'
      ) {
        event.preventDefault()
        toggleGuide()
        return
      }
      if (event.code === 'KeyM' && flags.current.started && store.getSnapshot().phase !== 'summary') {
        if (flags.current.mode === 'play') {
          event.preventDefault()
          pause('overview')
        } else if (flags.current.mode === 'overview') {
          event.preventDefault()
          resume()
        }
        return
      }
      if (event.code === 'Escape' && flags.current.mode === 'overview') {
        event.preventDefault()
        resume()
        return
      }
      if (event.code === 'Escape' && flags.current.mode === 'play') {
        event.preventDefault()
        if (flags.current.panel) {
          // Escape also releases pointer lock natively; reacquiring it here would reopen the pause menu.
          flags.current.panel = null
          setPanel(null)
        } else pause()
      }
    }
    document.addEventListener('visibilitychange', hidden)
    const blur = () => {
      focused.current = false
      stopUse()
      sounds.current?.stop()
    }
    const focus = () => {
      focused.current = true
    }
    window.addEventListener('keydown', keyboard)
    window.addEventListener('blur', blur)
    window.addEventListener('focus', focus)
    return () => {
      clearInterval(tick)
      clearInterval(save)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', focus)
    }
  }, [store])
  const step = nextStep(state)
  const request = RECIPES[state.request]
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    (state.customer.stage === 'ordering' || !!state.ticket)
  const running = mode === 'play' && state.phase !== 'summary'
  const actionJob = state.jobs.find((job) => job.station === panel)
  const goalStation = suggestedStation(state)
  const goal =
    goalStation === 'pos'
      ? state.phase === 'closing'
        ? state.customer
          ? '손님 퇴장을 기다리는 중이에요'
          : 'POS에서 근무 결산'
        : state.customer?.stage === 'entering'
          ? '손님이 POS에 도착하는 중이에요'
          : 'POS에서 주문 받기'
      : STATIONS[goalStation].name
  const canStart = sceneReady && hasLock === true && !graphicsError
  const heldBatch = carriedBatch(state)
  const showPreparation = !heldBatch && !!state.preparation && target === 'prep'
  const showColdBrew = !heldBatch && !!state.coldBrew && target === 'cold-prep'
  const showWashing =
    !heldBatch && !!state.washing && (target === 'wash' || (target === 'rack' && state.washing.stage === 'carrying'))
  const showCrafting =
    !heldBatch && !!state.cup && state.cup.craft.location !== 'hand' && target === state.cup.craft.location
  const showCleaning =
    !heldBatch &&
    !!state.cleaning &&
    (target === state.cleaning.station || (target === 'trash' && state.cleaning.heldCups > 0))
  const focusedWork = !panel && (showPreparation || showColdBrew || showWashing || showCrafting || showCleaning)
  const careNeeded =
    state.condiment.cups > 0 ||
    state.condiment.dirty ||
    supplyIds.some((id) => state.supplies[id].bar <= 5) ||
    dirtyTableCount(state.tables) > 0 ||
    state.dirtyBar > 0 ||
    state.tools.dirty > 0 ||
    state.tools.washed > 0 ||
    state.trash > 0 ||
    state.batches.some((batch) => batch.amount > 0 && batch.expiresAt !== null && batch.expiresAt <= state.time)
  const mismatch = !!state.ticket && state.ticket !== state.request
  const handLabel = heldBatch
    ? `${INGREDIENTS[heldBatch.ingredient].name} 용기를 들고 있어요`
    : state.supplyDelivery
      ? `${SUPPLIES[state.supplyDelivery.supply].name} 보충품을 들고 있어요`
      : state.cleaning?.heldCups
        ? `회수한 컵 ${state.cleaning.heldCups}개를 들고 있어요`
        : cleaningHandsBusy(state.cleaning)
          ? '청소용 천을 들고 있어요'
          : state.washing?.stage === 'carrying'
            ? '씻은 피처를 들고 있어요'
            : washingHandsBusy(state.washing)
              ? '스펀지를 들고 있어요'
              : state.cup?.craft.location === 'hand'
                ? '컵을 들고 있어요'
                : state.preparation?.tool || state.cup?.craft.tool || state.coldBrew?.tool
                  ? '도구를 들고 있어요'
                  : '다음 업무'
  const targetAction = heldBatch
    ? target === batchOrigin(heldBatch)
      ? '용기 다시 내려놓기'
      : target === batchDestination(heldBatch)
        ? '용기 보관하기'
        : '용기를 보관 장소로 운반하세요'
    : state.supplyDelivery && target === 'condiment'
      ? '소모품 채우기'
      : state.supplyDelivery && target === 'stock'
        ? '소모품 다시 놓기'
        : target === 'pos'
          ? state.phase === 'closing'
            ? '마감 확인하기'
            : canTakeOrder
              ? '주문 받기'
              : '손님·주문 확인하기'
          : target === 'cups' && state.ticket && !state.cup
            ? '컵 집기'
            : target && state.cup && craftStations.includes(target) && state.cup.craft.location === 'hand'
              ? '컵 내려놓기'
              : target === 'prep' && state.preparation
                ? '준비 이어가기'
                : target === 'cold-prep' && state.coldBrew
                  ? state.coldBrew.stage === 'finished'
                    ? '추출액 회수하기'
                    : '콜드 브루 준비 이어가기'
                  : target === 'wash'
                    ? '세척대 열기'
                    : target === 'stock'
                      ? '재고 확인하기'
                      : '작업대 열기'
  const destinationNote =
    suggestedInstruction(state) ??
    (state.preparation
      ? state.preparation.stage === 'ready'
        ? '라벨을 붙이고 E로 용기를 집어 보관 장소로 운반하세요.'
        : state.preparation.stage === 'processing'
          ? '블렌딩이 끝나면 라벨을 붙이세요.'
          : preparationStep(state.preparation).label
      : step?.label)

  return (
    <main className="relative h-dvh min-h-135 overflow-hidden max-tablet:min-h-130">
      <div ref={host} className="absolute inset-0 [&_canvas]:block [&_canvas]:size-full [&_canvas]:outline-none" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#18231b29,transparent_24%,transparent_75%,#18231b4d)]" />
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="저장 백업 파일 불러오기"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file || !hasLock) return
          try {
            const imported = await importGame(file)
            await saveGame(imported)
            store.replace(imported)
            sounds.current?.stop()
            setGuideOpen(preferencesRef.current.guidance && !firstOrdersDone(imported))
            scene.current?.reset(imported.position)
            flags.current.started = true
            setStarted(true)
            setSaveStatus('백업을 불러왔어요.')
            setSaveError(false)
            setMode('pause')
          } catch {
            setSaveStatus('호환되는 저장 파일을 불러오지 못했어요. 현재 기록은 유지됩니다.')
            setSaveError(true)
          }
          event.target.value = ''
        }}
      />
      <header className="pointer-events-none absolute inset-x-7 top-6 z-5 flex items-center justify-between gap-5 max-wide:inset-x-5 max-tablet:top-4.5">
        {!running ? (
          <div className="flex items-center gap-3 text-brand max-tablet:px-2.5 max-tablet:py-2">
            <CupIcon small />
            <div className="text-sm font-bold tracking-[0.14em]">
              DAY SHIFT<span className="mt-1 block text-xs font-normal tracking-normal">카페 근무</span>
            </div>
          </div>
        ) : null}
        <div className="flex items-center gap-3 rounded-lg bg-surface/94 px-3.5 py-2.5 text-xs text-muted max-tablet:hidden">
          <span>DAY {String(state.day).padStart(2, '0')}</span>
          <strong className="text-body font-medium text-ink tabular-nums">{clock(state.time)}</strong>
          <span>{state.phase === 'open' ? '영업 중' : state.phase === 'closing' ? '마감 정리' : '근무 완료'}</span>
        </div>
        {running ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="pointer-events-auto flex min-h-10 items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-ink"
              aria-pressed={guideOpen}
              onClick={toggleGuide}
            >
              <kbd className="font-sans">H</kbd> 단계 안내
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={!preferences.muted}
              aria-label="작업음"
              className="pointer-events-auto min-h-10 rounded-lg bg-surface px-3 py-2 text-xs text-ink"
              onClick={() => updatePreferences({ muted: !preferencesRef.current.muted })}
            >
              {preferences.muted ? '소리 끔' : '소리 켬'}
            </button>
            <button
              type="button"
              className="pointer-events-auto flex min-h-10 items-center gap-2.5 rounded-lg bg-surface px-3.5 py-2 text-sm text-ink"
              onClick={() => pause('overview')}
            >
              <kbd className="font-sans text-xs text-muted">M</kbd> 매장 현황{' '}
              {careNeeded ? (
                <>
                  <span className="size-1.5 rounded-full bg-[#a47235]" aria-hidden="true" />
                  <span className="sr-only">정리할 일이 있어요</span>
                </>
              ) : null}
            </button>
            <button
              type="button"
              className="pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-lg text-brand"
              onClick={() => pause()}
              aria-label="일시정지 메뉴"
            >
              Ⅱ
            </button>
          </div>
        ) : null}
      </header>

      {mode === 'welcome' ? (
        <div className="absolute inset-0 flex items-center bg-[linear-gradient(90deg,#f1eee6_0%,#f1eee6f7_25%,#f1eee6c9_38%,#f1eee600_62%)] max-tablet:bg-[linear-gradient(90deg,#f1eee6f5,#f1eee6d9_60%,#f1eee660)]">
          <section className="mt-11.25 ml-[6.5vw] w-[40vw] max-w-120 max-wide:ml-[5vw] max-wide:w-[44vw] max-tablet:mt-16.25 max-tablet:w-[80vw] short:mt-20">
            <span className="mb-5.75 block text-xs font-semibold tracking-[0.19em] text-muted short:mb-3.75">
              A LITTLE COFFEE, A LITTLE CARE
            </span>
            <h1 className="mb-6.75 font-display text-[clamp(2.375rem,4.6vw,4.25rem)] leading-[1.35] font-medium tracking-[-0.065em] max-tablet:text-[2.4375rem] short:mb-4.75 short:text-[2.75rem] short:leading-[1.23]">
              오늘도,
              <br />
              문을 엽니다.
            </h1>
            <p className="mb-7 text-sm leading-[1.95] tracking-tight text-muted max-tablet:mb-5 max-tablet:text-xs short:mb-4.5 short:text-xs short:leading-[1.75]">
              주문을 받고, 커피를 만들고,
              <br />
              다음 손님을 위한 자리를 준비해요.
              <br />
              작은 카페의 하루가 당신을 기다립니다.
            </p>
            <div className="mb-6.5 flex flex-wrap gap-x-3.5 gap-y-2 text-xs text-muted max-wide:gap-2 short:mb-4.5">
              <span className="not-first:before:mr-3.5 not-first:before:text-[#adae9b] not-first:before:content-['·'] max-wide:not-first:before:mr-2">
                1인칭 매장 운영
              </span>
              <span className="not-first:before:mr-3.5 not-first:before:text-[#adae9b] not-first:before:content-['·'] max-wide:not-first:before:mr-2">
                PC · 키보드와 마우스
              </span>
              <span className="not-first:before:mr-3.5 not-first:before:text-[#adae9b] not-first:before:content-['·'] max-wide:not-first:before:mr-2">
                로컬 자동 저장
              </span>
            </div>
            <Button size="start" disabled={!canStart} onClick={() => start(false)}>
              {sceneReady ? (hasSave ? '이어서 근무하기' : '첫 근무 시작하기') : '매장 준비 중…'}
              <span className="text-[1.3125rem] font-normal">↗</span>
            </Button>
            <div className="mt-4.75 flex gap-5 short:mt-3">
              <TextButton onClick={() => setMode('guide')}>근무 안내</TextButton>
              <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                백업 불러오기
              </TextButton>
              {hasSave ? <TextButton onClick={() => setConfirmNew(true)}>처음부터</TextButton> : null}
            </div>
            <p className="mt-8.25 mb-4 text-xs leading-[1.85] text-subtle max-tablet:mt-4.5 short:mt-4">
              근무를 시작하면 마우스를 움직여 둘러볼 수 있어요.
              <br />
              Esc를 누르면 언제든 쉬어갈 수 있습니다.
            </p>
            {notice ? (
              <p className="mb-4 text-xs text-danger" role="status">
                {notice}
              </p>
            ) : null}
          </section>
          <div className="absolute right-10 bottom-10.75 text-right text-[#fff9e8] text-shadow-[0_1px_20px_#28352180] max-tablet:hidden">
            <span className="text-xs tracking-[0.2em]">01 — MORNING SHIFT</span>
            <p className="mt-2.5 mb-0 text-xs leading-[1.8]">
              따뜻한 빛, 막 준비한 커피.
              <br />
              영업 준비를 시작해볼까요?
            </p>
          </div>
        </div>
      ) : null}

      {running ? (
        <>
          {!panel ? (
            <div className="pointer-events-none absolute top-22 left-7 z-6 flex max-h-[calc(100dvh-12rem)] w-70 flex-col gap-3 overflow-y-auto max-wide:left-5 max-wide:max-h-[calc(50dvh-6rem)] max-wide:w-55 max-tablet:top-25 max-tablet:max-h-[calc(50dvh-8rem)] max-tablet:w-43.75">
              <aside
                className="shrink-0 rounded-lg bg-surface/96 px-4.5 py-4 data-[mismatch=true]:bg-[#fff3e9] max-wide:p-4.25 max-tablet:p-3.25"
                data-mismatch={mismatch}
                aria-label="현재 주문"
              >
                {state.phase === 'closing' && !state.ticket ? (
                  <>
                    <span className="flex justify-between gap-3 text-xs text-muted">접수 마감</span>
                    <h2 className="mt-2 text-lg leading-normal font-semibold tracking-[-0.035em]">
                      남은 정리를 마쳐주세요
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-3 text-xs text-muted">
                      <span>주문 {String(state.orderNumber).padStart(3, '0')}</span>
                      <span>
                        {state.cup
                          ? step
                            ? '제조 중'
                            : '전달 준비'
                          : state.ticket
                            ? '컵 준비'
                            : state.customer
                              ? CUSTOMER_STATUS[state.customer.stage]
                              : '손님 없음'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-3">
                      <h2 className="m-0 text-lg leading-normal font-semibold tracking-[-0.035em]">
                        {request.shortName}
                      </h2>
                      <span className="shrink-0 text-xs text-muted">{request.variant}</span>
                    </div>
                    {mismatch ? (
                      <div className="mt-3 flex flex-col gap-1 border-t border-[#d9bdae] pt-3 text-label leading-[1.6] text-danger">
                        <strong>주문표가 요청과 달라요</strong>
                        <span>입력: {recipeLabel(state.ticket!)}</span>
                        <span>{state.cup ? '컵을 폐기한 뒤 POS에서 수정하세요.' : 'POS에서 주문표를 수정하세요.'}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </aside>
              {guideOpen ? (
                <div className="pointer-events-auto">
                  <FirstShiftGuide state={state} panel={null} onClose={toggleGuide} />
                </div>
              ) : null}
            </div>
          ) : null}
          {!panel && !focusedWork ? (
            <section
              className="absolute bottom-16 left-1/2 z-6 w-110 max-w-[calc(100%-3rem)] -translate-x-1/2 rounded-panel bg-surface/96 px-5 py-4 compact:bottom-13"
              aria-label="현재 행동"
            >
              <span className="mb-2 block text-xs text-muted">{target ? STATIONS[target].name : handLabel}</span>
              {needsStaffAccess ? (
                <>
                  <h2 className="m-0 text-xl leading-normal font-semibold tracking-[-0.035em]">
                    직원 통로로 들어가세요
                  </h2>
                  <p className="mt-2 mb-0 text-label leading-[1.6] text-muted">POS 옆 출입구를 이용할 수 있어요.</p>
                </>
              ) : target ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3.5 border-0 bg-transparent p-0 text-left text-xl font-semibold text-ink"
                    onClick={() => openPanel(target)}
                  >
                    <kbd className="grid h-10.5 min-w-10.5 place-items-center rounded-md bg-brand font-sans text-base font-medium text-surface">
                      E
                    </kbd>
                    <span>{targetAction}</span>
                  </button>
                  {target !== goalStation ? (
                    <p className="mt-2 mb-0 text-label leading-[1.6] text-muted">다음 업무 · {goal}</p>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="m-0 text-xl leading-normal font-semibold tracking-[-0.035em]">
                    {goalStation === 'pos' ? goal : `${goal}에 가세요`}
                  </h2>
                  {destinationNote ? (
                    <p className="mt-2 mb-0 text-label leading-[1.6] text-muted">{destinationNote}</p>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
          {!panel ? (
            <div
              className="data-[focused=true]:border-1.5 pointer-events-none absolute top-1/2 left-1/2 size-1.25 -translate-1/2 rounded-full border border-[#36472c55] bg-white/60 data-[focused=true]:size-2.5 data-[focused=true]:border-[#fff7d9] data-[focused=true]:bg-transparent data-[focused=true]:shadow-[0_0_0_5px_#d0bc7730]"
              data-focused={!!target}
            />
          ) : null}
          {!panel && showCleaning ? <CleaningHud state={state} target={target} act={act} stop={stopUse} /> : null}
          {!panel && showWashing && !showCleaning ? (
            <WashingHud state={state} target={target} act={act} stop={stopUse} />
          ) : null}
          {!panel && showPreparation && !showWashing && !showCleaning ? (
            <PreparationHud state={state} target={target} act={act} stop={stopUse} />
          ) : null}
          {!panel && showColdBrew ? <ColdBrewHud state={state} act={act} stop={stopUse} /> : null}
          {!panel && showCrafting && !showPreparation && !showWashing && !showCleaning ? (
            <CraftingHud
              state={state}
              target={target}
              onUse={use}
              onStop={stopUse}
              onTool={tool}
              onConfirm={confirm}
              onMoveCup={moveCup}
              onDiscard={() => act({ type: 'discard-cup' })}
            />
          ) : null}
          {lastMessage && lastMessage.id !== dismissedMessageId ? (
            <div
              className="absolute top-21 left-1/2 z-10 flex w-max max-w-[min(28.75rem,calc(100%-3rem))] -translate-x-1/2 animate-appear items-center gap-2.5 rounded-lg border border-[#d1d8c8] bg-surface py-2.5 pr-3 pl-4 text-sm leading-[1.6] text-ink shadow-toast data-[tone=error]:border-[#d9b398] data-[tone=error]:bg-[#fff0e6] data-[tone=error]:text-[#88472e] motion-reduce:animate-none max-wide:max-w-[min(28.75rem,54vw)] max-tablet:max-w-[85vw]"
              data-tone={lastMessage.tone}
              role="status"
              aria-live="polite"
              key={lastMessage.id}
            >
              <span className="text-brand" aria-hidden="true">
                {lastMessage.tone === 'success' ? '✓' : lastMessage.tone === 'error' ? '!' : '·'}
              </span>
              {lastMessage.text}
              <button
                className="grid size-7 shrink-0 place-items-center border-0 bg-transparent text-xl text-inherit"
                type="button"
                aria-label="알림 닫기"
                onClick={() => setDismissedMessageId(lastMessage.id)}
              >
                ×
              </button>
            </div>
          ) : null}
          <footer className="pointer-events-none absolute inset-x-7 bottom-5 flex items-center justify-between gap-5 text-xs leading-normal text-[#fff9ec] text-shadow-[0_1px_5px_#1b2c17] max-wide:inset-x-5 max-tablet:bottom-3.75">
            <span className="rounded-md bg-[#213a2deb] px-2.5 py-1.5 text-shadow-none">
              {mouseMode === 'look'
                ? '마우스로 둘러보기'
                : mouseMode === 'fallback'
                  ? '드래그 · 방향키로 둘러보기'
                  : panel
                    ? '메뉴 조작 중'
                    : '커서 조작 중 · WASD로 이동'}
              <span className="px-3">·</span>
              <kbd className="font-sans max-tablet:ml-0.75 max-tablet:p-0.75">Esc</kbd> 메뉴·조작법·소리
            </span>
            {saveError ? (
              <span
                className="max-w-1/2 rounded-md bg-[#fff0e6] px-3 py-2 text-xs text-[#88472e] text-shadow-none"
                role="status"
              >
                {saveStatus}
              </span>
            ) : null}
          </footer>
        </>
      ) : null}

      {mode === 'overview' ? <ShiftOverview state={state} onClose={resume} /> : null}

      {panel && running ? (
        <div className="pointer-events-none absolute inset-0 z-8 bg-[linear-gradient(90deg,#263c281f,transparent_70%)]">
          <section className="pointer-events-auto absolute top-26.25 bottom-16 left-7 w-90 [scrollbar-width:thin] [scrollbar-color:#c6cdb9_transparent] overflow-auto rounded-md border border-white/60 bg-surface p-6.25 shadow-panel compact:top-22 compact:p-5 max-wide:left-5 max-tablet:top-24 max-tablet:bottom-11.25 max-tablet:left-3 max-tablet:max-w-[calc(100vw-1.5rem)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="mb-2 block text-xs font-semibold tracking-[0.19em] text-muted">작업대</span>
                <h2 className="m-0 text-[1.4375rem] font-medium tracking-[-0.04em]">{STATIONS[panel].name}</h2>
              </div>
              <button
                type="button"
                className="pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full border-0 border-line bg-transparent text-[1.625rem] text-[#8e9881]"
                onClick={closePanel}
                aria-label="작업대 닫기"
              >
                ×
              </button>
            </div>
            <p className="mt-3 mb-6 text-sm leading-[1.9] text-muted compact:mb-4">{STATIONS[panel].subtitle}</p>
            {guideOpen ? (
              <div className="mb-5 compact:mb-3">
                <FirstShiftGuide state={state} panel={panel} onClose={toggleGuide} />
              </div>
            ) : null}
            {actionJob ? (
              <div className="mb-5 flex flex-col gap-1.75 rounded-sm bg-[#e1e8d5] p-4.25 text-xs">
                <span>{actionJob.label}</span>
                <strong className="text-stat font-medium">{Math.ceil(actionJob.endsAt - state.time)}초 남음</strong>
                <small className="text-xs text-muted">작업대를 나가도 계속 진행돼요.</small>
              </div>
            ) : null}
            {panel === 'pos' ? (
              <>
                {(state.phase === 'open' || state.ticket) &&
                state.customer &&
                !state.customer.visit &&
                state.customer.stage !== 'leaving' ? (
                  <>
                    <div className="mb-5.5 rounded-[0.1875rem] border-l-2 border-[#a9b495] bg-[#eaeade] p-4 compact:mb-4 compact:p-3">
                      <span className="text-xs text-muted">{customer} 님</span>
                      <p className="mt-2.25 mb-0 text-body leading-[1.7] text-[#4b6248]">
                        {recipeLabel(state.request)}
                        <br />
                        <small className="text-xs text-muted">Tall · 1잔</small>
                      </p>
                    </div>
                    <label className="mb-2.25 block text-xs text-muted" htmlFor="pos-menu">
                      주문 입력
                    </label>
                    <select
                      className="mb-3.5 w-full rounded-[0.1875rem] border border-[#d9ddce] bg-[#fffdf7] p-3 text-sm text-[#496347]"
                      id="pos-menu"
                      value={posSelection}
                      disabled={!!state.cup || !canTakeOrder}
                      onChange={(event) => setPosSelection(event.target.value as typeof posSelection)}
                    >
                      {recipeIds.map((id) => (
                        <option key={id} value={id}>
                          {recipeLabel(id)}
                        </option>
                      ))}
                    </select>
                    <Button
                      disabled={!!state.cup || !canTakeOrder}
                      onClick={() => act({ type: 'ticket', recipe: posSelection })}
                    >
                      {state.ticket
                        ? '주문표 수정'
                        : canTakeOrder
                          ? '결제 확인 · 주문표 출력'
                          : '손님 도착을 기다려주세요'}
                    </Button>
                  </>
                ) : (
                  <div className="mb-5 rounded-md bg-[#eaeade] p-4 text-sm leading-relaxed text-muted">
                    <p>
                      {state.customer
                        ? `${customer} 님 · ${CUSTOMER_STATUS[state.customer.stage]}`
                        : '매장 안의 손님이 모두 나갔어요.'}
                    </p>
                    {state.phase === 'open' ? (
                      <p className="mt-2">이 손님이 나가면 다음 손님이 들어와요. 정리·보충을 진행할 수 있어요.</p>
                    ) : null}
                  </div>
                )}
                <details className="mt-6 border-t border-line pt-4 text-sm" open={state.phase !== 'open'}>
                  <summary className="mb-3 cursor-pointer text-muted">영업 관리</summary>
                  <div className="mb-4.25 flex justify-between text-xs text-muted">
                    <span>오늘 판매</span>
                    <strong className="text-sm text-[#50694a]">{money(state.totals.revenue)}</strong>
                  </div>
                  {state.phase === 'open' ? (
                    <Button variant="secondary" onClick={() => act({ type: 'close' })}>
                      신규 주문 마감하기
                    </Button>
                  ) : (
                    <>
                      <p className="mb-2.25 block text-xs text-muted">마감 체크</p>
                      {closingTasks(state).length ? (
                        <ul className="my-4 list-disc pl-4.25 text-xs leading-[2.1] text-muted">
                          {closingTasks(state).map((task) => (
                            <li key={task}>{task}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-4 text-xs text-[#638259]">모든 정리를 마쳤어요.</p>
                      )}
                      <Button disabled={closingTasks(state).length > 0} onClick={() => act({ type: 'finish' })}>
                        근무 마치고 결산하기
                      </Button>
                    </>
                  )}
                </details>
              </>
            ) : null}
            {panel === 'cups' ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {state.cups}
                  <small className="mt-2 block text-xs text-muted">개 준비됨</small>
                </div>
                <p className="mb-4 text-sm leading-[1.9] text-muted">주문에 맞는 Tall 컵을 집어 제조를 시작해요.</p>
                <Button
                  disabled={!state.ticket || !!state.cup || !state.cups}
                  onClick={() => act({ type: 'take-cup' })}
                >
                  컵 집기
                </Button>
                <Button variant="secondary" onClick={() => act({ type: 'cups' })}>
                  후방 컵 보충 · 남은 {state.reserveCups}개
                </Button>
              </>
            ) : null}
            {['espresso', 'steam', 'brew', 'water', 'ice', 'sauce', 'mix', 'topping'].includes(panel) &&
            step?.station !== panel ? (
              <div className="py-4.5 text-center text-muted">
                <CupIcon />
                <p className="my-3.25 text-xs leading-[1.8] text-muted">
                  {state.cup
                    ? `다음 작업은 ${step?.label ?? '픽업대에서 전달'}예요.`
                    : '주문을 받고 컵을 준비하면 제조할 수 있어요.'}
                </p>
              </div>
            ) : null}
            {panel === 'pickup' ? (
              <>
                <div className="my-5.5 h-px bg-line" />
                <Button
                  disabled={!state.cup || !!step || state.customer?.stage !== 'pickup'}
                  onClick={() => act({ type: 'serve' })}
                >
                  주문 확인 · 손님에게 전달
                </Button>
              </>
            ) : null}
            {panel === 'prep' ? (
              <>
                <div className="border-t border-line py-5">
                  <h3 className="my-2.5 text-[1.3125rem] font-medium">글레이즈드 폼</h3>
                  <p className="mb-4 text-sm leading-[1.9] text-muted">크림·우유·소스를 계량해 블렌딩해요.</p>
                  <small className="my-3 block text-xs text-muted">
                    준비된 양 {formatAmount(available(state, 'foam'))}ml
                  </small>
                  <Button disabled={!!actionJob} onClick={() => act({ type: 'start-preparation', recipe: 'foam' })}>
                    피처 놓고 직접 계량
                  </Button>
                </div>
                <div className="border-t border-line py-5">
                  <h3 className="my-2.5 text-[1.3125rem] font-medium">바모카</h3>
                  <p className="mb-4 text-sm leading-[1.9] text-muted">원팩과 온수를 계량해 섞어요.</p>
                  <small className="my-3 block text-xs text-muted">
                    준비된 양 {formatAmount(available(state, 'mocha'))}ml
                  </small>
                  <Button
                    variant="secondary"
                    disabled={!!actionJob}
                    onClick={() => act({ type: 'start-preparation', recipe: 'mocha' })}
                  >
                    원팩·온수 직접 배합
                  </Button>
                </div>
                <details className="mt-6 border-t border-line pt-4 text-sm">
                  <summary className="mb-3 cursor-pointer text-muted">준비 · 보관 안내</summary>
                  <p className="mb-4">깨끗한 피처가 필요해요. 사용한 피처는 씻어서 선반에 정리해주세요.</p>
                  <p className="mb-4">
                    폼: {PREPARATIONS.foam.storageNote}
                    <br />
                    바모카: {PREPARATIONS.mocha.storageNote}
                  </p>
                </details>
              </>
            ) : null}
            {panel === 'cold-prep' ? (
              <>
                <h3 className="my-4 text-lg font-medium">다음 근무를 위한 콜드 브루</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted">
                  한 배치분의 원두를 준비하고 원두 {COLD_BREW_BEANS}lb·정수 {COLD_BREW_WATER}L를 직접 계량해요. 추출이
                  끝나면 용기에 회수해 라벨을 붙이고 냉장고로 운반하세요.
                </p>
                <p className="mb-4 text-xs text-muted">
                  준비를 중단하면 원두 한 배치분을 폐기해요. 준비비는 반환되지 않아요.
                </p>
                <Button
                  disabled={!!state.coldBrew || state.cash < COLD_BREW_COST}
                  onClick={() => act({ type: 'start-cold-brew' })}
                >
                  원두 한 배치 준비 · {money(COLD_BREW_COST)}
                </Button>
              </>
            ) : null}
            {panel === 'shelf' ? (
              <>
                <p className="my-4 text-sm text-muted">라벨을 붙인 바모카 용기를 들고 와 E로 보관하세요.</p>
                {state.batches
                  .filter((batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0)
                  .map((batch) => (
                    <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} station="shelf" />
                  ))}
              </>
            ) : null}
            {panel === 'wash' ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {state.tools.dirty}
                  <small className="mt-2 block text-xs text-muted">개 세척 대기</small>
                </div>
                <p className="mb-4 text-sm leading-[1.9] text-muted">
                  피처를 놓고 직접 문지르기·헹구기를 진행해요. 씻은 피처는 들고 옆 선반에 정리해주세요.
                </p>
                <Button disabled={!!state.washing || !state.tools.dirty} onClick={() => act({ type: 'wash' })}>
                  세척대에 피처 한 개 놓기
                </Button>
                {state.tools.washed > 0 ? (
                  <Button
                    variant={state.tools.dirty ? 'secondary' : 'primary'}
                    disabled={!!state.washing}
                    onClick={() => act({ type: 'take-washed' })}
                  >
                    씻은 피처 집기 · {state.tools.washed}개
                  </Button>
                ) : null}
              </>
            ) : null}
            {panel === 'rack' ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {state.tools.washed}
                  <small className="mt-2 block text-xs text-muted">개 정리 대기</small>
                </div>
                <p className="mb-4 text-sm leading-[1.9] text-muted">
                  세척대에서 씻은 피처를 집어 가져오면 E로 선반에 놓을 수 있어요.
                </p>
                <Button disabled={state.washing?.stage !== 'carrying'} onClick={() => act({ type: 'rack' })}>
                  들고 있는 피처 놓기
                </Button>
              </>
            ) : null}
            {isCupSurface(panel) ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {cupSurface(state, panel).cups}
                  <small className="mt-2 block text-xs text-muted">개 회수 대기</small>
                </div>
                <p className="mb-4 text-sm leading-[1.9] text-muted">
                  {cupSurface(state, panel).dirty
                    ? '컵을 분리수거함에 옮기고 얼룩을 닦아주세요.'
                    : cupSurface(state, panel).cups
                      ? '얼룩은 없어요. 컵만 회수하면 정리가 끝나요.'
                      : '깨끗하게 정리됐어요.'}
                </p>
                <Button
                  disabled={!cupSurface(state, panel).dirty && !cupSurface(state, panel).cups}
                  onClick={() => act({ type: 'start-cleaning', station: panel })}
                >
                  컵 회수 · 직접 닦기
                </Button>
              </>
            ) : null}
            {panel === 'condiment' ? <SupplyPanel state={state} act={act} location="bar" /> : null}
            {panel === 'mix' ? (
              <Button
                variant="secondary"
                disabled={!state.dirtyBar || !!actionJob}
                onClick={() => act({ type: 'start-cleaning', station: 'mix' })}
              >
                작업대 직접 닦기
              </Button>
            ) : null}
            {panel === 'trash' ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {state.trash}
                  <small className="mt-2 block text-xs text-muted">개 모였어요</small>
                </div>
                <Button disabled={!state.trash} onClick={() => act({ type: 'start-cleaning', station: 'trash' })}>
                  쓰레기 모아 봉투 묶기
                </Button>
              </>
            ) : null}
            {panel === 'stock' ? <InventoryPanel state={state} act={act} /> : null}
            {state.cup ? (
              <details className="mt-6 border-t border-line pt-4 text-sm">
                <summary className="mb-3 cursor-pointer text-muted">현재 컵 관리</summary>
                <TextButton danger onClick={() => act({ type: 'discard-cup' })}>
                  현재 컵 폐기하기
                </TextButton>
              </details>
            ) : null}
            <button
              type="button"
              className="mt-5.75 flex w-full justify-between border-t border-line bg-transparent pt-4.25 text-xs text-muted"
              onClick={closePanel}
            >
              매장으로 돌아가기 <span>Esc</span>
            </button>
          </section>
        </div>
      ) : null}

      {mode === 'pause' || mode === 'guide' ? (
        <div className="absolute inset-0 z-12 flex items-center justify-center bg-[#1f32295c] p-7.5 backdrop-blur-[7px]">
          <section className="max-h-[90dvh] w-97.5 overflow-auto rounded-md bg-surface p-9.5 shadow-dialog max-tablet:p-6.75">
            <span className="mb-4.25 block text-xs font-semibold tracking-[0.19em] text-muted">
              {mode === 'guide' ? 'YOUR FIRST SHIFT' : 'TAKE A BREATH'}
            </span>
            <h2 className="mb-4.75 text-[2rem] font-medium tracking-[-0.05em]">
              {mode === 'guide' ? '근무를 시작하기 전에' : '잠시 쉬어가요.'}
            </h2>
            {mode === 'guide' ? (
              <>
                <p className="mb-6.25 text-sm leading-[1.9] text-muted">
                  POS → 컵 준비 → 제조 → 픽업.
                  <br />
                  화면 아래에서 다음 행동을 확인하세요.
                </p>
                <div className="my-5.5 grid grid-cols-2 gap-2.5">
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">W A S D</kbd>
                    <span className="text-xs text-muted">매장 이동</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">마우스 / 방향키</kbd>
                    <span className="text-xs text-muted">주변 둘러보기</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">E</kbd>
                    <span className="text-xs text-muted">컵 집기·놓기 / 작업대 열기</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">G</kbd>
                    <span className="text-xs text-muted">도구 집기·놓기</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">클릭 / Space</kbd>
                    <span className="text-xs text-muted">누르고 붓기·젓기 / 한 번 펌핑</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">F</kbd>
                    <span className="text-xs text-muted">계량 확인 / 픽업대에서 전달</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">M</kbd>
                    <span className="text-xs text-muted">매장 현황 열기·닫기</span>
                  </p>
                  <p className="m-0 flex flex-col gap-2.25 bg-[#eceee2] p-3.25">
                    <kbd className="font-sans text-[#5d7751]">Esc</kbd>
                    <span className="text-xs text-muted">메뉴 · 일시정지</span>
                  </p>
                </div>
                <p className="mb-6.25 text-sm leading-[1.9] text-muted">
                  컵을 작업대에 놓고 계량하세요. 목표 구간에서 멈춘 뒤 도구를 놓고 F로 확인해요.
                  <br />
                  작업 중에는 화면 버튼을 누를 수 있어요. WASD로 이동하면 다시 마우스로 둘러봐요.
                  <br />
                  제조·POS·픽업은 카운터 안쪽 직원 통로에서 진행해요.
                  <br />
                  뒤쪽 준비대에서는 폼과 바모카를 만들어요.
                  <br />
                  직접 계량한 뒤 라벨을 붙이고 냉장·실온 보관 위치를 선택해요.
                  <br />
                  피처를 씻은 뒤에는 도구 선반에 정리해주세요.
                  <br />
                  객석 청소는 POS 옆 직원 출입구로 나가서 진행해요.
                </p>
                <Button onClick={() => (started ? resume() : setMode('welcome'))}>
                  {started ? '근무로 돌아가기' : '알겠어요'}
                </Button>
                <WorkSettings
                  preferences={preferences}
                  status={soundStatus}
                  error={preferencesError}
                  guideOpen={guideOpen}
                  onChange={updatePreferences}
                  onPreview={() => void sounds.current?.preview()}
                  onGuide={toggleGuide}
                />
              </>
            ) : (
              <>
                <p className="mb-6.25 text-sm leading-[1.9] text-muted">
                  게임 시간도 함께 멈췄어요.
                  <br />
                  준비가 되면 이어서 근무하세요.
                </p>
                <Button disabled={!canStart} onClick={resume}>
                  근무 계속하기 <span>→</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    flags.current.mode = 'overview'
                    setMode('overview')
                  }}
                >
                  매장 현황
                </Button>
                <Button variant="secondary" onClick={() => setMode('guide')}>
                  조작과 근무 안내
                </Button>
                <WorkSettings
                  preferences={preferences}
                  status={soundStatus}
                  error={preferencesError}
                  guideOpen={guideOpen}
                  onChange={updatePreferences}
                  onPreview={() => void sounds.current?.preview()}
                  onGuide={toggleGuide}
                />
                <div className="mt-4.5 flex justify-between gap-3.5">
                  <TextButton onClick={() => exportGame(capture())}>백업 내보내기</TextButton>
                  <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                    백업 불러오기
                  </TextButton>
                </div>
                <TextButton className="mt-3.5 block" onClick={() => void persist()}>
                  지금 저장
                </TextButton>
                <TextButton danger className="mt-3.5 block" onClick={() => setConfirmNew(true)}>
                  처음부터 다시 시작
                </TextButton>
                <p className="mb-6.25 text-sm leading-[1.9] text-muted" data-error={saveError}>
                  {saveStatus}
                </p>
              </>
            )}
          </section>
        </div>
      ) : null}

      {state.phase === 'summary' && started && mode === 'play' ? (
        <div className="absolute inset-0 z-12 flex items-center justify-center bg-[#1f32295c] p-7.5 backdrop-blur-[7px]">
          <section className="max-h-[90dvh] w-110 overflow-auto rounded-md bg-surface p-9.5 shadow-dialog max-tablet:p-6.75">
            <span className="mb-4.25 block text-xs font-semibold tracking-[0.19em] text-muted">
              DAY {String(state.day).padStart(2, '0')} / CLOSED
            </span>
            <h2 className="mb-4.75 text-[2rem] font-medium tracking-[-0.05em]">잘 마쳤습니다.</h2>
            <p className="mb-6.25 text-sm leading-[1.9] text-muted">
              한 잔의 커피부터 깨끗한 마감까지.
              <br />
              오늘 매장에 남긴 기록이에요.
            </p>
            <div className="mb-5.5 grid grid-cols-2 gap-5 border-y border-line py-5.75">
              <div>
                <small className="mb-2.25 block text-xs text-muted">완료 주문</small>
                <strong className="text-2xl font-medium text-[#526e48]">
                  {state.totals.served}
                  <em className="ml-1.25 text-xs text-muted not-italic">잔</em>
                </strong>
              </div>
              <div>
                <small className="mb-2.25 block text-xs text-muted">판매</small>
                <strong className="text-2xl font-medium text-[#526e48]">{money(state.totals.revenue)}</strong>
              </div>
              <div>
                <small className="mb-2.25 block text-xs text-muted">청소 / 세척</small>
                <strong className="text-2xl font-medium text-[#526e48]">
                  {state.totals.cleaned} / {state.totals.washed}
                </strong>
              </div>
              <div>
                <small className="mb-2.25 block text-xs text-muted">재제조 컵</small>
                <strong className="text-2xl font-medium text-[#526e48]">
                  {state.totals.wastedCups}
                  <em className="ml-1.25 text-xs text-muted not-italic">개</em>
                </strong>
              </div>
            </div>
            <ShiftLedger state={state} />
            <p className="mb-6.25 text-sm leading-[1.9] text-muted">
              다음 날에도 재고와 품질 기한이 이어집니다.
              <br />
              추출 중인 콜드 브루도 게임 시간만큼 진행돼요.
            </p>
            <Button onClick={() => act({ type: 'next-day' })}>
              다음 날 문 열기 <span>↗</span>
            </Button>
            <TextButton className="mx-auto mt-4 block" onClick={() => exportGame(capture())}>
              오늘의 기록 백업하기
            </TextButton>
          </section>
        </div>
      ) : null}

      {confirmNew ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1f32295c] p-7.5 backdrop-blur-[7px]">
          <section className="max-h-[90dvh] w-97.5 overflow-auto rounded-md bg-surface p-9.5 shadow-dialog max-tablet:p-6.75">
            <h2 className="mb-4.75 text-[2rem] font-medium tracking-[-0.05em]">새로 시작할까요?</h2>
            <p className="mb-6.25 text-sm leading-[1.9] text-muted">
              현재 기록을 백업한 뒤 새 근무를 시작할 수 있어요.
            </p>
            <Button variant="secondary" onClick={() => exportGame(capture())}>
              현재 기록 백업
            </Button>
            <Button disabled={!canStart} onClick={() => start(true)}>
              처음부터 시작
            </Button>
            <TextButton className="mt-3.5 block" onClick={() => setConfirmNew(false)}>
              돌아가기
            </TextButton>
          </section>
        </div>
      ) : null}
      {graphicsError || hasLock === false ? (
        <div
          className="absolute bottom-16.25 left-1/2 z-30 max-w-145 -translate-x-1/2 rounded-[0.3125rem] border border-[#d9aa7d] bg-[#fcf1e1] px-5.5 py-4.25 text-xs leading-[1.8] text-[#995e3d] shadow-[0_4px_30px_#0002]"
          role="alert"
        >
          {graphicsError || '다른 창에서 이 매장을 열고 있어요. 그 창을 닫은 뒤 새로고침해주세요.'}
        </div>
      ) : null}
    </main>
  )
}

function ShiftOverview({ state, onClose }: { state: GameState; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeButton.current?.focus()
  }, [])
  const expired = state.batches.filter(
    (batch) => batch.amount > 0 && batch.expiresAt !== null && batch.expiresAt <= state.time,
  ).length
  const tasks = [
    state.condiment.cups || state.condiment.dirty
      ? `컨디먼트 바 · 반납 컵 ${state.condiment.cups}개${state.condiment.dirty ? ' · 닦기 필요' : ''}`
      : '',
    ...supplyIds
      .filter((id) => state.supplies[id].bar <= 5)
      .map(
        (id) =>
          `${SUPPLIES[id].name} 보충 · 진열 ${state.supplies[id].bar}${SUPPLIES[id].unit}, 창고 ${state.supplies[id].stock}${SUPPLIES[id].unit}`,
      ),
    state.supplyDelivery ? `들고 있는 ${SUPPLIES[state.supplyDelivery.supply].name} 보충품 정리` : '',
    ...tableIds
      .filter((id) => state.tables[id].dirty || state.tables[id].cups)
      .map(
        (id) => `${STATIONS[id].name} · 컵 ${state.tables[id].cups}개${state.tables[id].dirty ? ' · 닦기 필요' : ''}`,
      ),
    state.dirtyBar ? '작업대 닦기' : '',
    state.cleaning
      ? `${STATIONS[state.cleaning.station].name} 청소 중${state.cleaning.heldCups ? ` · 들고 있는 컵 ${state.cleaning.heldCups}개` : ''}`
      : '',
    state.tools.dirty ? `피처 세척 ${state.tools.dirty}개` : '',
    state.tools.washed ? `씻은 피처 정리 ${state.tools.washed}개` : '',
    state.trash ? `분리수거 ${state.trash}개` : '',
    expired ? `기한이 지난 배치 ${expired}개` : '',
    state.washing
      ? state.washing.stage === 'carrying'
        ? '들고 있는 피처를 선반에 정리'
        : '진행 중인 피처 세척·정리'
      : '',
    state.preparation ? `${PREPARATIONS[state.preparation.recipe].name} 준비 중` : '',
  ].filter(Boolean)
  return (
    <div className="absolute inset-0 z-12 flex items-center justify-center bg-[#1f32295c] p-7.5 backdrop-blur-[7px]">
      <section
        className="max-h-[calc(100dvh-3rem)] w-130 max-w-full overflow-auto rounded-xl bg-surface p-7 text-ink"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overview-title"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary')
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="mb-2 block text-xs font-semibold tracking-[0.19em] text-muted">
              DAY {String(state.day).padStart(2, '0')} · 일시정지
            </span>
            <h2 className="m-0 text-[1.4375rem] font-medium tracking-[-0.04em]" id="overview-title">
              매장 현황
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            className="pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full border-0 border-line bg-transparent text-[1.625rem] text-[#8e9881]"
            onClick={onClose}
            aria-label="매장 현황 닫기"
          >
            ×
          </button>
        </div>
        <dl className="my-6.5 grid grid-cols-3 gap-x-3.5 gap-y-5 border-b border-line pb-6">
          <div>
            <dt className="text-xs text-muted">운영비</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{money(state.cash)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">오늘 판매</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{money(state.totals.revenue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">완료 주문</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{state.totals.served}잔</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">깨끗한 피처</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{state.tools.clean}개</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">준비된 컵</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{state.cups}개</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">후방 컵</dt>
            <dd className="mt-1.5 text-stat font-medium tabular-nums">{state.reserveCups}개</dd>
          </div>
        </dl>
        {state.customer ? (
          <section className="mb-5 rounded-md bg-[#eaeade] p-4 text-sm leading-relaxed" aria-label="응대 중인 손님">
            <strong>
              주문 {String(state.customer.orderNumber).padStart(3, '0')} ·{' '}
              {customerNames[(state.customer.orderNumber - 1) % customerNames.length]} 님
            </strong>
            <p className="mt-1 text-muted">
              {CUSTOMER_STATUS[state.customer.stage]}
              {state.customer.stage === 'drinking'
                ? ` · ${Math.max(0, Math.ceil(CUSTOMER_SECONDS.drinking - state.customer.elapsed))}초 남음`
                : ''}
            </p>
          </section>
        ) : null}
        <ShiftLedger state={state} embedded />
        <h3 className="mt-5 mb-2.5 text-body font-semibold">남은 정리</h3>
        {tasks.length ? (
          <ul className="my-4 list-disc pl-4.75 text-sm leading-[1.8] text-muted">
            {tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm leading-[1.8] text-muted">매장이 깨끗하게 정리됐어요.</p>
        )}
        {state.jobs.length ? (
          <div className="my-5">
            <h3 className="mt-5 mb-2.5 text-body font-semibold">진행 중인 작업</h3>
            {state.jobs.map((job) => (
              <div className="mt-2.5 flex justify-between gap-4 text-sm" key={job.id}>
                <span>{job.label}</span>
                <strong className="font-medium">
                  {job.endsAt - state.time > 3600
                    ? `${Math.ceil((job.endsAt - state.time) / 3600)}시간 남음`
                    : `${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음`}
                </strong>
              </div>
            ))}
          </div>
        ) : null}
        <Button className="mt-6" onClick={onClose}>
          근무로 돌아가기 <kbd className="font-sans text-xs">M / Esc</kbd>
        </Button>
      </section>
    </div>
  )
}
