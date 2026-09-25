import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { batchDestination, batchOrigin, carriedBatch } from '../game/batches'
import {
  COLD_BREW_HOURS,
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
import { cupSurface } from '../game/cleaning'
import { COLD_BREW_BEANS, COLD_BREW_COST, COLD_BREW_WATER } from '../game/cold-brew'
import { craftStations } from '../game/crafting'
import {
  CUP_NAMES,
  cleanCupCount,
  cupCount,
  cupKindFor,
  isReusableCup,
  SERVICE_NAMES,
  type ServiceMode,
  serviceModes,
} from '../game/cups'
import { CUSTOMER_STATUS, customerWalking } from '../game/customer'
import type { Preferences } from '../game/preferences'
import { PREPARATIONS, preparationIds } from '../game/preparation'
import { expiryAt } from '../game/quality'
import type { CafeScene, MouseMode } from '../game/scene'
import type { GameState } from '../game/state'
import { exportGame, importGame, loadGame, loadPreferences, saveGame, savePreferences } from '../game/storage'
import { type Action, available, CafeStore, closingTasks, initialState, nextStep } from '../game/store'
import { SUPPLIES, supplyIds } from '../game/supplies'
import { WASH_NAMES, washDestination, washItems, washStock } from '../game/washing'
import BatchLabel from './BatchLabel'
import { Button, TextButton } from './Button'
import CleaningHud from './CleaningHud'
import ColdBrewHud from './ColdBrewHud'
import CraftingHud from './CraftingHud'
import CupInventory from './CupInventory'
import GameDialog from './GameDialog'
import InventoryPanel from './InventoryPanel'
import PreparationHud from './PreparationHud'
import ShiftLedger from './ShiftLedger'
import SupplyPanel from './SupplyPanel'
import WashingHud from './WashingHud'
import WorkGuide from './WorkGuide'
import WorkSettings from './WorkSettings'
import { actionSound, createWorkSounds, type SoundStatus, tickSound, workLoop } from './work-sounds'

function CupIcon() {
  return (
    <svg className="inline-block shrink-0" width={40} height={40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <p className="mb-4 text-body text-muted">불러오는 중…</p>
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
  const guideReturn = useRef<{
    mode: 'welcome' | 'play' | 'pause'
    panel: StationId | null
    station: StationId | null
    mouseMode: MouseMode
  }>({ mode: 'welcome', panel: null, station: null, mouseMode: 'cursor' })
  const [panel, setPanel] = useState<StationId | null>(null)
  const [target, setTarget] = useState<StationId | null>(null)
  const targetRef = useRef<StationId | null>(null)
  const [needsStaffAccess, setNeedsStaffAccess] = useState(false)
  const [saveStatus, setSaveStatus] = useState(notice || '이 기기에 자동 저장')
  const [saveError, setSaveError] = useState(false)
  const [graphicsError, setGraphicsError] = useState('')
  const [sceneReady, setSceneReady] = useState(false)
  const [hasLock, setHasLock] = useState<boolean | null>(null)
  const [mouseMode, setMouseMode] = useState<MouseMode>('cursor')
  const [confirmNew, setConfirmNew] = useState(false)
  const [started, setStarted] = useState(false)
  const [posSelection, setPosSelection] = useState(state.ticket?.recipe ?? state.request)
  const [posService, setPosService] = useState<ServiceMode>(
    state.ticket?.service ?? state.customer?.service ?? 'dine-in',
  )
  const customerId = state.customer?.id
  const customerService = state.customer?.service
  const ticketRecipe = state.ticket?.recipe
  const ticketService = state.ticket?.service
  useEffect(() => {
    if (customerId && customerService) {
      setPosSelection(ticketRecipe ?? state.request)
      setPosService(ticketService ?? customerService)
    }
  }, [customerId, customerService, ticketRecipe, ticketService, state.request])
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
  const flags = useRef({ mode, panel, started, hasLock, confirmNew, mouseMode })
  flags.current = { mode, panel, started, hasLock, confirmNew, mouseMode }

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
  function openGuide() {
    const previous = flags.current
    guideReturn.current = {
      mode: previous.mode === 'welcome' ? 'welcome' : previous.mode === 'pause' ? 'pause' : 'play',
      panel: previous.panel,
      station: previous.panel ?? targetRef.current,
      mouseMode: previous.mouseMode,
    }
    stopUse()
    sounds.current?.stop()
    flags.current.mode = 'guide'
    setMode('guide')
    scene.current?.unlock()
  }
  function closeGuide() {
    const previous = guideReturn.current
    flags.current.mode = previous.mode
    flags.current.panel = previous.panel
    setMode(previous.mode)
    setPanel(previous.panel)
    if (previous.mode === 'play' && !previous.panel) {
      if (previous.mouseMode === 'cursor') scene.current?.unlockForCraft()
      else scene.current?.lock()
    }
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
    if (id === 'wash' && cupCount(current.cleaning?.heldCups)) {
      act({ type: 'drop-used-cups' })
      return
    }
    if (id === current.cleaning?.station) {
      if (current.cleaning.stage === 'collect') act({ type: 'collect-cup' })
      else scene.current?.unlockForCraft()
      return
    }
    if (id === 'wash' && current.washing) {
      if (current.washing.stage === 'ready') act({ type: 'take-washed', item: current.washing.item })
      else if (current.washing.stage === 'carrying') act({ type: 'leave-wash' })
      else scene.current?.unlockForCraft()
      return
    }
    if (current.washing?.stage === 'carrying' && id === washDestination(current.washing.item)) {
      act({ type: 'store-washed', station: id })
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
    if (
      id === 'cups' &&
      current.ticket &&
      !current.cup &&
      cleanCupCount(current, cupKindFor(current.ticket.recipe, current.ticket.service)) > 0
    ) {
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
    if (id === 'pos') {
      setPosSelection(current.ticket?.recipe ?? current.request)
      setPosService(current.ticket?.service ?? current.customer?.service ?? 'dine-in')
    }
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
    if (
      (action.type === 'collect-cup' && cupCount(store.getSnapshot().cleaning?.heldCups)) ||
      action.type === 'drop-used-cups'
    )
      closePanel()
    if (action.type === 'place-cup' && store.getSnapshot().cup?.craft.location === action.station)
      scene.current?.unlockForCraft()
    if (action.type === 'pick-cup' && store.getSnapshot().cup?.craft.location === 'hand') scene.current?.lock()
    const current = store.getSnapshot()
    if (flags.current.mode === 'play' && focused.current && !document.hidden) {
      const feedback = actionSound(action, previous, current)
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
    const washing = store.getSnapshot().washing
    if (washing?.stage === 'carrying' && station === washDestination(washing.item)) {
      act({ type: 'store-washed', station })
      return
    }
    if (station === 'wash' && washing) {
      if (washing.stage === 'ready') act({ type: 'take-washed', item: washing.item })
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
            mouseSensitivity: () => preferencesRef.current.mouseSensitivity,
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
              targetRef.current = id
              setTarget(id)
              setNeedsStaffAccess(blocked)
            },
            onInteract: openPanel,
            onUseStart: use,
            onUseEnd: stopUse,
            onTool: tool,
            onConfirm: confirm,
            activeStation: () => store.getActiveInput()?.station ?? null,
            onMouseMode: (nextMode) => {
              flags.current.mouseMode = nextMode
              setMouseMode(nextMode)
            },
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
      if (
        event.defaultPrevented ||
        event.repeat ||
        flags.current.confirmNew ||
        (event.target instanceof HTMLInputElement && event.target.type !== 'radio') ||
        event.target instanceof HTMLSelectElement
      )
        return
      if (
        event.code === 'KeyH' &&
        ['welcome', 'play', 'pause', 'guide'].includes(flags.current.mode) &&
        store.getSnapshot().phase !== 'summary'
      ) {
        event.preventDefault()
        if (flags.current.mode === 'guide') closeGuide()
        else openGuide()
        return
      }
      if (event.code === 'KeyM' && flags.current.started && store.getSnapshot().phase !== 'summary') {
        if (flags.current.mode === 'play' || flags.current.mode === 'pause') {
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
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    (state.customer.stage === 'ordering' || !!state.ticket)
  const running = mode === 'play' && state.phase !== 'summary'
  const actionJob = state.jobs.find((job) => job.station === panel)
  const canStart = sceneReady && hasLock === true && !graphicsError
  const heldBatch = carriedBatch(state)
  const showPreparation = !heldBatch && !!state.preparation && target === 'prep'
  const showColdBrew = !heldBatch && !!state.coldBrew && target === 'cold-prep'
  const showWashing =
    !heldBatch &&
    !cupCount(state.cleaning?.heldCups) &&
    !!state.washing &&
    (target === 'wash' || (target === washDestination(state.washing.item) && state.washing.stage === 'carrying'))
  const showCrafting =
    !heldBatch && !!state.cup && state.cup.craft.location !== 'hand' && target === state.cup.craft.location
  const showCleaning =
    !heldBatch &&
    !!state.cleaning &&
    (target === state.cleaning.station || (target === 'wash' && cupCount(state.cleaning.heldCups) > 0))
  const focusedWork = !panel && (showPreparation || showColdBrew || showWashing || showCrafting || showCleaning)
  const mismatch =
    !!state.ticket && (state.ticket.recipe !== state.request || state.ticket.service !== state.customer?.service)
  const carried = heldBatch
    ? {
        name: `${INGREDIENTS[heldBatch.ingredient].name} 용기`,
        destination:
          heldBatch.expiresAt !== null && heldBatch.expiresAt <= state.time
            ? batchOrigin(heldBatch)
            : batchDestination(heldBatch),
      }
    : state.supplyDelivery
      ? { name: SUPPLIES[state.supplyDelivery.supply].name, destination: 'condiment' as const }
      : cupCount(state.cleaning?.heldCups)
        ? { name: `사용한 컵 ${cupCount(state.cleaning?.heldCups)}개`, destination: 'wash' as const }
        : state.washing?.stage === 'carrying'
          ? { name: `씻은 ${WASH_NAMES[state.washing.item]}`, destination: washDestination(state.washing.item) }
          : state.cup?.craft.location === 'hand'
            ? { name: CUP_NAMES[state.cup.craft.kind], destination: step?.station ?? ('pickup' as const) }
            : null
  const selectedCupKind = state.ticket ? cupKindFor(state.ticket.recipe, state.ticket.service) : null
  const washingQueue = washItems
    .map((item) => ({ item, ...washStock(state, item) }))
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)
  const targetAction =
    cupCount(state.cleaning?.heldCups) && target === 'wash'
      ? '사용한 컵 내려놓기'
      : state.washing?.stage === 'carrying' && target === washDestination(state.washing.item)
        ? '씻은 용기 정리'
        : target === 'pos'
          ? state.phase === 'closing'
            ? '마감 관리'
            : canTakeOrder
              ? '주문 입력'
              : '주문 확인'
          : heldBatch
            ? target === batchOrigin(heldBatch)
              ? '용기 내려놓기'
              : '용기 보관'
            : state.supplyDelivery && target === 'condiment'
              ? '소모품 채우기'
              : state.supplyDelivery && target === 'stock'
                ? '보충품 내려놓기'
                : target === 'cups' && selectedCupKind && !state.cup
                  ? cleanCupCount(state, selectedCupKind) > 0
                    ? `${CUP_NAMES[selectedCupKind]} 집기`
                    : '컵 재고 확인'
                  : target && state.cup && craftStations.includes(target) && state.cup.craft.location === 'hand'
                    ? '컵 내려놓기'
                    : target === 'stock'
                      ? '재고 확인'
                      : '열기'

  return (
    <main className="relative h-dvh overflow-hidden" data-mouse-mode={mouseMode}>
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
            scene.current?.reset(imported.position)
            scene.current?.unlock()
            flags.current.started = true
            setStarted(true)
            setSaveStatus('백업을 불러왔어요.')
            setSaveError(false)
            flags.current.mode = 'pause'
            setMode('pause')
          } catch {
            setSaveStatus('호환되는 저장 파일을 불러오지 못했어요. 현재 기록은 유지됩니다.')
            setSaveError(true)
          }
          event.target.value = ''
        }}
      />
      {running ? (
        <header className="pointer-events-none absolute inset-x-6 top-5 z-10 flex items-start justify-between gap-4 max-tablet:inset-x-4 max-tablet:top-4">
          <div className="flex items-center gap-3 rounded-full border border-white/60 bg-surface/95 px-4 py-2.5 text-xs shadow-hud">
            <span className="text-muted">{state.day}일차</span>
            <span className="font-medium tabular-nums">{clock(state.time)}</span>
            <span className="border-l border-line pl-3 text-brand">
              {state.phase === 'open' ? '영업 중' : '마감 중'}
            </span>
          </div>
          <nav
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/60 bg-surface/95 p-1 shadow-hud"
            aria-label="게임 메뉴"
          >
            <button
              type="button"
              className="flex min-h-9 items-center gap-2 rounded-full px-3 text-xs"
              onClick={openGuide}
            >
              <kbd className="font-sans text-muted">H</kbd> 도움말
            </button>
            <button
              type="button"
              className="flex min-h-9 items-center gap-2 rounded-full px-3 text-xs"
              onClick={() => pause('overview')}
            >
              <kbd className="font-sans text-muted">M</kbd> 매장
            </button>
            <button
              type="button"
              className="flex min-h-9 items-center gap-2 rounded-full px-3 text-xs"
              onClick={() => pause()}
            >
              <kbd className="font-sans text-muted">Esc</kbd> 메뉴
            </button>
          </nav>
        </header>
      ) : null}

      {mode === 'welcome' ? (
        <div className="absolute inset-0 flex items-center bg-[linear-gradient(90deg,#f3f2ecf5,transparent_80%)] max-tablet:bg-surface/60">
          <section className="ml-[8vw] w-72 max-w-[80vw]">
            <div className="mb-5 text-brand">
              <CupIcon />
            </div>
            <h1 className="mb-10 text-5xl font-medium tracking-[-0.06em] text-brand">
              Day Shift<span className="mt-3 block text-sm font-normal tracking-normal text-muted">카페 근무</span>
            </h1>
            <Button size="start" disabled={!canStart} onClick={() => start(false)}>
              {sceneReady ? (hasSave ? '이어서 하기' : '시작하기') : '불러오는 중…'} <span aria-hidden="true">→</span>
            </Button>
            <div className="mt-3 flex items-center justify-between">
              <TextButton onClick={openGuide}>도움말</TextButton>
              <details className="relative text-xs text-muted">
                <summary className="cursor-pointer py-3">저장 관리</summary>
                <div className="absolute right-0 top-full z-10 grid w-40 rounded-xl border border-line bg-surface p-3 shadow-hud">
                  <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                    백업 불러오기
                  </TextButton>
                  {hasSave ? (
                    <TextButton danger onClick={() => setConfirmNew(true)}>
                      처음부터 시작
                    </TextButton>
                  ) : null}
                </div>
              </details>
            </div>
            {notice || saveError ? (
              <p className="mt-4 text-xs text-danger" role="status">
                {saveError ? saveStatus : notice}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {running ? (
        <>
          {!panel && state.ticket ? (
            <aside
              className="pointer-events-none absolute top-21 left-6 z-6 w-64 rounded-xl border border-white/60 bg-surface/95 p-4 shadow-hud max-tablet:left-4 max-tablet:w-56"
              aria-label="현재 주문"
            >
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-muted">
                <span>주문 {String(state.orderNumber).padStart(3, '0')}</span>
                <span className="font-medium">
                  {SERVICE_NAMES[state.ticket.service]} · {RECIPES[state.ticket.recipe].variant}
                </span>
              </div>
              <h2 className="text-base leading-snug font-semibold tracking-tight">
                {RECIPES[state.ticket.recipe].shortName}
              </h2>
              {mismatch ? (
                <p className="mt-3 border-t border-line pt-3 text-xs text-danger">
                  요청: {state.customer ? SERVICE_NAMES[state.customer.service] : ''} · {recipeLabel(state.request)}
                  <br />
                  {state.cup ? '컵 정리 후 POS에서 주문 수정' : 'POS에서 주문 수정'}
                </p>
              ) : null}
            </aside>
          ) : null}
          {!panel && !focusedWork && (target || carried || needsStaffAccess) ? (
            <section
              className="absolute bottom-6 left-1/2 z-6 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-white/60 bg-surface/97 px-5 py-3.5 shadow-hud compact:bottom-4"
              aria-label="현재 행동"
            >
              {needsStaffAccess ? (
                <p className="text-sm">
                  직원 통로에서 이용 가능 <span className="ml-3 text-xs text-muted">POS 옆 출입구</span>
                </p>
              ) : target &&
                (!heldBatch ||
                  target === batchOrigin(heldBatch) ||
                  target === batchDestination(heldBatch) ||
                  target === 'pos') ? (
                <button type="button" className="flex items-center gap-4 text-left" onClick={() => openPanel(target)}>
                  <div>
                    <span className="mb-1 block text-xs text-muted">{STATIONS[target].name}</span>
                    <span className="text-sm font-medium">{targetAction}</span>
                  </div>
                  <kbd className="ml-4 grid size-9 shrink-0 place-items-center rounded-lg bg-brand font-sans text-sm text-on-brand">
                    E
                  </kbd>
                </button>
              ) : carried ? (
                <p className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted">{carried.name}</span>
                  <span aria-hidden="true">→</span>
                  <span className="font-medium">{STATIONS[carried.destination].name}</span>
                </p>
              ) : null}
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
          {lastMessage?.tone === 'error' && lastMessage.id !== dismissedMessageId ? (
            <div
              className="absolute top-21 left-1/2 z-15 flex w-max max-w-[min(28.75rem,calc(100%-3rem))] -translate-x-1/2 animate-appear items-center gap-2.5 rounded-lg border border-[#d1d8c8] bg-surface py-2.5 pr-3 pl-4 text-sm leading-[1.6] text-ink shadow-toast data-[tone=error]:border-[#d9b398] data-[tone=error]:bg-[#fff0e6] data-[tone=error]:text-[#88472e] motion-reduce:animate-none max-wide:max-w-[min(28.75rem,54vw)] max-tablet:max-w-[85vw]"
              data-tone={lastMessage.tone}
              role="status"
              aria-live="polite"
              key={lastMessage.id}
            >
              <span className="text-danger" aria-hidden="true">
                !
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
          {saveError ? (
            <div role="status">
              <button
                type="button"
                onClick={() => pause()}
                className="absolute right-6 bottom-6 z-10 max-w-64 rounded-xl border border-danger/30 bg-surface px-4 py-3 text-xs text-danger"
              >
                저장 실패 · 메뉴에서 백업
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {mode === 'overview' ? <ShiftOverview state={state} onClose={resume} /> : null}

      {panel && running ? (
        <div className="pointer-events-none absolute inset-0 z-8 bg-[linear-gradient(90deg,#263c281f,transparent_70%)]">
          <section className="pointer-events-auto absolute top-21 bottom-6 left-6 w-90 [scrollbar-width:thin] [scrollbar-color:#c6cdb9_transparent] overflow-auto rounded-2xl border border-white/60 bg-surface p-6 shadow-panel compact:top-20 compact:p-5 max-wide:left-5 max-tablet:top-21 max-tablet:bottom-4 max-tablet:left-3 max-tablet:max-w-[calc(100vw-1.5rem)]">
            <div className="flex items-center justify-between">
              <div>
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
            <div className="h-5" />
            {actionJob ? (
              <div className="mb-5 flex flex-col gap-1.75 rounded-sm bg-[#e1e8d5] p-4.25 text-xs">
                <span>{actionJob.label}</span>
                <strong className="text-stat font-medium">{Math.ceil(actionJob.endsAt - state.time)}초 남음</strong>
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
                      <span className="text-xs text-muted">손님 주문</span>
                      <p className="mt-2.25 mb-0 text-body leading-[1.7] text-[#4b6248]">
                        {recipeLabel(state.request)} · {SERVICE_NAMES[state.customer.service]}
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
                    <fieldset
                      className="mb-4 grid grid-cols-2 gap-2 disabled:opacity-45"
                      disabled={!!state.cup || !canTakeOrder}
                    >
                      <legend className="mb-2 text-xs text-muted">이용 방식</legend>
                      {serviceModes.map((service) => (
                        <label key={service} className="cursor-pointer">
                          <input
                            className="peer sr-only"
                            type="radio"
                            name="pos-service"
                            value={service}
                            checked={posService === service}
                            onChange={() => setPosService(service)}
                          />
                          <span className="block rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                            {SERVICE_NAMES[service]}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <Button
                      disabled={!!state.cup || !canTakeOrder}
                      onClick={() => act({ type: 'ticket', recipe: posSelection, service: posService })}
                    >
                      {state.ticket ? '주문표 수정' : canTakeOrder ? '주문 접수' : '손님 도착 대기'}
                    </Button>
                  </>
                ) : (
                  <div className="mb-5 rounded-md bg-[#eaeade] p-4 text-sm leading-relaxed text-muted">
                    <p>
                      {state.customer
                        ? `${customer} 님 · ${CUSTOMER_STATUS[state.customer.stage]}`
                        : '응대 중인 손님 없음'}
                    </p>
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
                      주문 접수 마감
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
                        <p className="mb-4 text-xs text-[#638259]">마감 준비 완료</p>
                      )}
                      <Button disabled={closingTasks(state).length > 0} onClick={() => act({ type: 'finish' })}>
                        결산하기
                      </Button>
                    </>
                  )}
                </details>
              </>
            ) : null}
            {panel === 'cups' ? (
              <>
                {selectedCupKind ? (
                  <Button
                    disabled={!!state.cup || !cleanCupCount(state, selectedCupKind)}
                    onClick={() => act({ type: 'take-cup' })}
                  >
                    {CUP_NAMES[selectedCupKind]} 집기
                  </Button>
                ) : null}
                <CupInventory state={state} act={act} />
              </>
            ) : null}
            {['espresso', 'steam', 'brew', 'water', 'ice', 'sauce', 'mix', 'topping'].includes(panel) ? (
              <p className="py-4 text-sm text-muted">
                {state.cup
                  ? `컵 위치 · ${state.cup.craft.location === 'hand' ? '손' : STATIONS[state.cup.craft.location].name}`
                  : state.ticket
                    ? '컵 보관대에서 컵 준비'
                    : 'POS에서 주문 접수'}
              </p>
            ) : null}
            {panel === 'pickup' ? (
              <>
                <div className="my-5.5 h-px bg-line" />
                <Button
                  disabled={!state.cup || !!step || state.customer?.stage !== 'pickup'}
                  onClick={() => act({ type: 'serve' })}
                >
                  음료 전달
                </Button>
              </>
            ) : null}
            {panel === 'prep' ? (
              <div className="divide-y divide-line">
                {preparationIds.map((id) => (
                  <div key={id} className="py-4 first:pt-0">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold">{PREPARATIONS[id].name}</h3>
                      <span className="text-xs text-muted tabular-nums">{formatAmount(available(state, id))}ml</span>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={!!actionJob}
                      aria-label={`${PREPARATIONS[id].name} 준비 시작`}
                      onClick={() => act({ type: 'start-preparation', recipe: id })}
                    >
                      준비 시작
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            {panel === 'cold-prep' ? (
              <>
                <dl className="mb-5 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">원두</dt>
                    <dd className="mt-2 text-base">{COLD_BREW_BEANS}lb</dd>
                  </div>
                  <div>
                    <dt className="text-muted">정수</dt>
                    <dd className="mt-2 text-base">{COLD_BREW_WATER}L</dd>
                  </div>
                  <div>
                    <dt className="text-muted">추출</dt>
                    <dd className="mt-2 text-base">{COLD_BREW_HOURS}시간</dd>
                  </div>
                </dl>
                <Button
                  disabled={!!state.coldBrew || state.cash < COLD_BREW_COST}
                  onClick={() => act({ type: 'start-cold-brew' })}
                >
                  추출 준비 <span>{money(COLD_BREW_COST)}</span>
                </Button>
              </>
            ) : null}
            {panel === 'shelf' ? (
              <>
                {!state.batches.some(
                  (batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0,
                ) ? (
                  <p className="text-sm text-muted">보관된 배합 없음</p>
                ) : null}
                {state.batches
                  .filter((batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0)
                  .map((batch) => (
                    <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} station="shelf" />
                  ))}
              </>
            ) : null}
            {panel === 'wash' ? (
              <div className="divide-y divide-line">
                {washingQueue.length === 0 ? <p className="text-sm text-muted">세척할 용기 없음</p> : null}
                {washingQueue.map(({ item, dirty, washed }) => {
                  return (
                    <section key={item} className="py-3" aria-label={`${WASH_NAMES[item]} 세척 재고`}>
                      <p className="mb-3 flex justify-between gap-3 text-sm">
                        <span>{WASH_NAMES[item]}</span>
                        <span className="text-muted">
                          {dirty > 0 ? `세척 대기 ${dirty}개` : `세척 완료 ${washed}개`}
                        </span>
                      </p>
                      {dirty > 0 ? (
                        <Button disabled={!!state.washing} onClick={() => act({ type: 'wash', item })}>
                          {WASH_NAMES[item]} 세척 시작
                        </Button>
                      ) : null}
                      {washed > 0 ? (
                        <Button
                          variant={dirty > 0 ? 'secondary' : 'primary'}
                          disabled={!!state.washing}
                          onClick={() => act({ type: 'take-washed', item })}
                        >
                          씻은 {WASH_NAMES[item]} 집기
                        </Button>
                      ) : null}
                    </section>
                  )
                })}
              </div>
            ) : null}
            {panel === 'rack' ? (
              <p className="text-sm text-muted">
                깨끗한 피처 <strong className="ml-2 text-lg font-medium text-ink">{state.tools.clean}개</strong>
              </p>
            ) : null}
            {isCupSurface(panel) ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {cupCount(cupSurface(state, panel).cups)}
                  <small className="mt-2 block text-xs text-muted">개 회수 대기</small>
                </div>
                <p className="mb-4 text-sm leading-[1.9] text-muted">
                  {cupSurface(state, panel).dirty
                    ? '얼룩 있음'
                    : cupCount(cupSurface(state, panel).cups)
                      ? '컵 회수 필요'
                      : '정리 완료'}
                </p>
                <Button
                  disabled={!cupSurface(state, panel).dirty && !cupCount(cupSurface(state, panel).cups)}
                  onClick={() => act({ type: 'start-cleaning', station: panel })}
                >
                  정리 시작
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
                작업대 닦기
              </Button>
            ) : null}
            {panel === 'trash' ? (
              <>
                <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
                  {state.trash}
                  <small className="mt-2 block text-xs text-muted">개</small>
                </div>
                <Button disabled={!state.trash} onClick={() => act({ type: 'start-cleaning', station: 'trash' })}>
                  분리수거 시작
                </Button>
              </>
            ) : null}
            {panel === 'stock' ? <InventoryPanel state={state} act={act} /> : null}
            {state.cup ? (
              <details className="mt-6 border-t border-line pt-4 text-sm">
                <summary className="mb-3 cursor-pointer text-muted">현재 컵 관리</summary>
                <TextButton danger onClick={() => act({ type: 'discard-cup' })}>
                  {isReusableCup(state.cup.craft.kind) ? '내용물 비우고 컵을 세척 대기로' : '현재 컵 폐기하기'}
                </TextButton>
              </details>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === 'guide' ? (
        <GameDialog title="도움말" onClose={closeGuide} wide>
          <WorkGuide state={state} station={guideReturn.current.station} started={started} />
        </GameDialog>
      ) : null}
      {mode === 'pause' ? (
        <GameDialog title="일시정지" onClose={resume}>
          <Button disabled={!canStart} onClick={resume}>
            계속하기 <kbd className="font-sans text-xs">Esc</kbd>
          </Button>
          <div className="my-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => pause('overview')}>
              매장 현황 <kbd className="font-sans text-xs">M</kbd>
            </Button>
            <Button variant="secondary" onClick={openGuide}>
              도움말 <kbd className="font-sans text-xs">H</kbd>
            </Button>
          </div>
          <details className="border-t border-line py-4">
            <summary className="text-sm font-medium">설정</summary>
            <WorkSettings
              preferences={preferences}
              status={soundStatus}
              error={preferencesError}
              onChange={updatePreferences}
              onPreview={() => void sounds.current?.preview()}
            />
          </details>
          <details className="border-t border-line pt-4">
            <summary className="text-sm font-medium">저장 관리</summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TextButton onClick={() => exportGame(capture())}>백업 내보내기</TextButton>
              <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                백업 불러오기
              </TextButton>
              <TextButton onClick={() => void persist()}>지금 저장</TextButton>
              <TextButton danger onClick={() => setConfirmNew(true)}>
                처음부터 시작
              </TextButton>
            </div>
            <p className="mt-3 text-xs text-muted data-[error=true]:text-danger" data-error={saveError} role="status">
              {saveStatus}
            </p>
          </details>
          {saveError ? (
            <p className="mt-4 text-xs text-danger" role="alert">
              {saveStatus}
            </p>
          ) : null}
        </GameDialog>
      ) : null}

      {state.phase === 'summary' && started && mode === 'play' ? (
        <GameDialog title={`${state.day}일차 결산`} wide>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">판매액</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{money(state.totals.revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">완료 주문</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {state.totals.served}
                <span className="ml-1 text-sm font-normal text-muted">잔</span>
              </p>
            </div>
          </div>
          <ShiftLedger state={state} />
          <Button className="mt-6" onClick={() => act({ type: 'next-day' })}>
            다음 날 시작 <span aria-hidden="true">→</span>
          </Button>
        </GameDialog>
      ) : null}
      {confirmNew ? (
        <GameDialog title="처음부터 시작" onClose={() => setConfirmNew(false)}>
          <p className="mb-5 text-sm text-muted">현재 근무 기록이 지워집니다.</p>
          <Button disabled={!canStart} onClick={() => start(true)}>
            새로 시작
          </Button>
          <Button variant="secondary" onClick={() => exportGame(capture())}>
            현재 기록 백업
          </Button>
          <TextButton className="mt-3" onClick={() => setConfirmNew(false)}>
            취소
          </TextButton>
        </GameDialog>
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
  const [tab, setTab] = useState<'work' | 'ledger'>('work')
  const expired = state.batches.filter(
    (batch) => batch.amount > 0 && batch.expiresAt !== null && batch.expiresAt <= state.time,
  ).length
  const tasks = [
    cupCount(state.condiment.cups) || state.condiment.dirty
      ? `컨디먼트 바 · 반납 컵 ${cupCount(state.condiment.cups)}개${state.condiment.dirty ? ' · 닦기 필요' : ''}`
      : '',
    ...supplyIds
      .filter((id) => state.supplies[id].bar <= 5)
      .map(
        (id) =>
          `${SUPPLIES[id].name} 보충 · 진열 ${state.supplies[id].bar}${SUPPLIES[id].unit}, 창고 ${state.supplies[id].stock}${SUPPLIES[id].unit}`,
      ),
    state.supplyDelivery ? `들고 있는 ${SUPPLIES[state.supplyDelivery.supply].name} 보충품 정리` : '',
    ...tableIds
      .filter((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
      .map(
        (id) =>
          `${STATIONS[id].name} · 컵 ${cupCount(state.tables[id].cups)}개${state.tables[id].dirty ? ' · 닦기 필요' : ''}`,
      ),
    state.dirtyBar ? '작업대 닦기' : '',
    state.cleaning
      ? `${STATIONS[state.cleaning.station].name} 청소 중${cupCount(state.cleaning.heldCups) ? ` · 들고 있는 컵 ${cupCount(state.cleaning.heldCups)}개` : ''}`
      : '',
    ...washItems.flatMap((item) => {
      const stock = washStock(state, item)
      return [
        stock.dirty ? `${WASH_NAMES[item]} 세척 ${stock.dirty}개` : '',
        stock.washed ? `씻은 ${WASH_NAMES[item]} 정리 ${stock.washed}개` : '',
      ]
    }),
    state.trash ? `분리수거 ${state.trash}개` : '',
    expired ? `기한이 지난 배치 ${expired}개` : '',
    state.washing
      ? state.washing.stage === 'carrying'
        ? `씻은 ${WASH_NAMES[state.washing.item]}를 ${STATIONS[washDestination(state.washing.item)].name}에 정리`
        : `${WASH_NAMES[state.washing.item]} 세척 중`
      : '',
    state.preparation && state.preparation.stage !== 'processing'
      ? `${PREPARATIONS[state.preparation.recipe].name} 준비 중`
      : '',
    state.coldBrew && state.coldBrew.stage !== 'extracting' ? '콜드 브루 회수·보관' : '',
  ].filter(Boolean)
  const remaining = state.phase === 'closing' ? closingTasks(state) : tasks
  return (
    <GameDialog title="매장 현황" onClose={onClose} wide>
      <fieldset className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-control p-1" aria-label="현황 보기">
        <button
          type="button"
          aria-pressed={tab === 'work'}
          className="rounded-lg py-2.5 text-sm text-muted aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
          onClick={() => setTab('work')}
        >
          할 일
        </button>
        <button
          type="button"
          aria-pressed={tab === 'ledger'}
          className="rounded-lg py-2.5 text-sm text-muted aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
          onClick={() => setTab('ledger')}
        >
          운영 기록
        </button>
      </fieldset>
      {tab === 'work' ? (
        <>
          {state.customer ? (
            <p className="mb-5 text-sm text-muted">손님 · {CUSTOMER_STATUS[state.customer.stage]}</p>
          ) : null}
          {remaining.length ? (
            <ul className="divide-y divide-line text-sm">
              {remaining.map((task) => (
                <li key={task} className="flex gap-3 py-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/40" aria-hidden="true" />
                  {task}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">남은 정리 없음</p>
          )}
          {state.jobs.length ? (
            <section className="mt-6 border-t border-line pt-4" aria-label="진행 중인 작업">
              <h3 className="mb-3 text-xs text-muted">진행 중</h3>
              {state.jobs.map((job) => (
                <div key={job.id} className="flex justify-between gap-4 py-2 text-sm">
                  <span>{job.label}</span>
                  <span className="tabular-nums text-muted">
                    {job.endsAt - state.time > 3600
                      ? `${Math.ceil((job.endsAt - state.time) / 3600)}시간`
                      : `${Math.max(0, Math.ceil(job.endsAt - state.time))}초`}
                  </span>
                </div>
              ))}
            </section>
          ) : null}
          <details className="mt-5 border-t border-line pt-4 text-sm">
            <summary>비품 수량</summary>
            <dl className="mt-3 space-y-3 text-xs text-muted">
              <div className="flex justify-between">
                <dt>깨끗한 피처</dt>
                <dd>{state.tools.clean}개</dd>
              </div>
            </dl>
            <CupInventory state={state} />
          </details>
        </>
      ) : (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted">판매액</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums">{money(state.totals.revenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">완료 주문</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums">
                {state.totals.served}
                <span className="ml-1 text-sm font-normal text-muted">잔</span>
              </dd>
            </div>
          </dl>
          <ShiftLedger state={state} />
        </>
      )}
    </GameDialog>
  )
}
