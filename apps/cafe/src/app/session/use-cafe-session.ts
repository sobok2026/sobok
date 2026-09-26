import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { StationId } from '../../content/stations'
import { carriedBatch } from '../../features/inventory/batches'
import { cupCount } from '../../features/inventory/cups'
import { customerWalking } from '../../features/service/customer'
import type { Action } from '../../simulation/actions'
import { initialState } from '../../simulation/initial-state'
import type { GameState } from '../../simulation/state'
import type { CafeStore } from '../../simulation/store'
import type { GuideSide, MouseMode } from '../../world/scene'
import { actionSound, tickSound, workLoop } from '../audio/work-sounds'
import { importGame, saveGame } from '../persistence/storage'
import { useWriterLock } from '../persistence/use-writer-lock'
import type { Preferences } from './preferences'
import { confirmationAt, interactionAt, toolAt, workActionAt } from './station-interactions'
import { useCafeScene } from './use-cafe-scene'
import { useWorkPreferences } from './use-work-preferences'

export type CafeSessionProps = { store: CafeStore; hasSave: boolean; notice: string; preferences: Preferences }

export function useCafeSession({ store, notice, preferences: initialPreferences }: CafeSessionProps) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const { preferences, preferencesRef, preferencesError, soundStatus, sounds, updatePreferences } =
    useWorkPreferences(initialPreferences)
  const focused = useRef(true)
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
  const [guideSide, setGuideSide] = useState<GuideSide>(null)
  const [saveStatus, setSaveStatus] = useState(notice || '이 기기에 자동 저장')
  const [saveError, setSaveError] = useState(false)
  const hasLock = useWriterLock()
  const [mouseMode, setMouseMode] = useState<MouseMode>('cursor')
  const [confirmNew, setConfirmNew] = useState(false)
  const [started, setStarted] = useState(false)
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
  const input = useRef<HTMLInputElement>(null)
  const flags = useRef({ mode, panel, started, hasLock, confirmNew, mouseMode })

  flags.current = { mode, panel, started, hasLock, confirmNew, mouseMode }

  function openGuide() {
    const previous = flags.current
    guideReturn.current = {
      mode: previous.mode === 'welcome' || previous.mode === 'pause' ? previous.mode : 'play',
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
      if (previous.mouseMode === 'cursor') {
        scene.current?.unlockForCraft()
      } else {
        scene.current?.lock()
      }
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
    if (!flags.current.started || !flags.current.hasLock) {
      return
    }
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
    const interaction = interactionAt(store.getSnapshot(), id)

    if (interaction === null) {
      return
    }

    if (interaction === 'work') {
      scene.current?.unlockForCraft()
      return
    }

    if (interaction !== 'panel') {
      act(interaction)
      return
    }

    flags.current.panel = id
    setPanel(id)
    setTarget(null)

    scene.current?.unlock()
  }

  function dismissPanel() {
    flags.current.panel = null
    setPanel(null)
  }

  function closePanel(lock = true) {
    dismissPanel()
    if (lock) {
      scene.current?.lock()
    }
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
    if (!flags.current.hasLock) {
      return
    }
    const previous = store.getSnapshot()
    store.dispatch(action)
    const current = store.getSnapshot()
    if ((action.type === 'wash' || action.type === 'take-washed') && current.washing) {
      if (current.washing?.stage === 'carrying') {
        closePanel()
      } else {
        beginWork()
      }
    }
    if (action.type === 'take-cup' && current.cup) {
      closePanel()
    }
    if (action.type === 'take-supply' && current.supplyDelivery) {
      closePanel()
    }
    if ((action.type === 'take-batch' || action.type === 'buy') && carriedBatch(current)) {
      closePanel()
    }
    if (action.type === 'return-batch' && !carriedBatch(current)) {
      beginWork()
    }
    if ((action.type === 'start-cold-brew' || action.type === 'collect-cold-brew') && current.coldBrew) {
      beginWork()
    }
    if (action.type === 'start-preparation' && current.preparation) {
      beginWork()
    }
    if (action.type === 'start-cleaning' && !previous.cleaning && current.cleaning) {
      beginWork()
    }
    if ((action.type === 'collect-cup' && cupCount(current.cleaning?.heldCups)) || action.type === 'drop-used-cups') {
      closePanel()
    }
    if (action.type === 'place-cup' && current.cup?.craft.location === action.station) {
      scene.current?.unlockForCraft()
    }
    if (action.type === 'pick-cup' && current.cup?.craft.location === 'hand') {
      scene.current?.lock()
    }

    if (flags.current.mode === 'play' && focused.current && !document.hidden) {
      const feedback = actionSound(action, previous, current)
      if (feedback) {
        sounds.current?.play(feedback)
      }
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
    ) {
      scene.current?.lock()
    }

    if (action.type === 'next-day') {
      scene.current?.reset(current.position)
      closePanel()
    }

    if (current.phase === 'summary') {
      flags.current.panel = null
      setPanel(null)
      scene.current?.unlock()
    }

    void persist()
  }

  function moveCup(station: StationId) {
    const cup = store.getSnapshot().cup
    if (!cup) {
      return
    }
    act(cup.craft.location === 'hand' ? { type: 'place-cup', station } : { type: 'pick-cup', station })
  }

  function use(station: StationId) {
    if (flags.current.mode !== 'play' || flags.current.panel) {
      return
    }
    act(workActionAt(store.getSnapshot(), station))
  }

  function stopUse() {
    if (!store.getActiveInput()) {
      return
    }
    store.stopActiveInput()
    updateSoundLoop()
    void persist()
  }

  function tool(station: StationId) {
    act(toolAt(store.getSnapshot(), station))
  }

  function confirm(station: StationId) {
    const action = confirmationAt(store.getSnapshot(), station)
    if (action) {
      act(action)
    }
  }

  const { scene, sceneReady, graphicsError } = useCafeScene(store, host, {
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
    onGuideSide: setGuideSide,
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
      if (flags.current.mode === 'play' && flags.current.panel === null && store.getSnapshot().phase !== 'summary') {
        pause()
      }
    },
    onError: () => pause(),
  })

  useEffect(() => {
    let last = performance.now()
    const tick = window.setInterval(() => {
      const now = performance.now()
      const seconds = (now - last) / 1000
      updateSoundLoop()
      if (!store.getActiveInput() && !customerWalking(store.getSnapshot().customer) && seconds < 0.49) {
        return
      }
      last = now

      if (flags.current.mode === 'play' && flags.current.started && flags.current.hasLock && !document.hidden) {
        const wasUsing = !!store.getActiveInput()
        const previous = store.getSnapshot()
        store.tick(seconds)

        if (focused.current) {
          const feedback = tickSound(previous, store.getSnapshot())
          if (feedback) {
            sounds.current?.play(feedback)
          }
        }

        updateSoundLoop()
        if (wasUsing && !store.getActiveInput()) {
          void persist()
        }
      }
    }, 100)
    const save = window.setInterval(() => {
      void persist()
    }, 8000)

    const hidden = () => {
      if (document.hidden && flags.current.started) {
        pause()
      }
      last = performance.now()
    }

    const keyboard = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        flags.current.confirmNew ||
        (event.target instanceof HTMLInputElement && event.target.type !== 'radio') ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (
        event.code === 'KeyH' &&
        ['welcome', 'play', 'pause', 'guide'].includes(flags.current.mode) &&
        store.getSnapshot().phase !== 'summary'
      ) {
        event.preventDefault()
        if (flags.current.mode === 'guide') {
          closeGuide()
        } else {
          openGuide()
        }
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
        } else {
          pause()
        }
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

  async function importBackup(file: File) {
    if (!flags.current.hasLock) {
      return
    }
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
  }

  return {
    state,
    preferences,
    preferencesError,
    soundStatus,
    mode,
    panel,
    target,
    needsStaffAccess,
    guideSide,
    saveStatus,
    saveError,
    graphicsError,
    sceneReady,
    hasLock,
    mouseMode,
    confirmNew,
    setConfirmNew,
    started,
    dismissedMessageId,
    setDismissedMessageId,
    host,
    input,
    updatePreferences,
    openGuide,
    closeGuide,
    openPanel,
    closePanel,
    pause,
    resume,
    start,
    act,
    moveCup,
    use,
    stopUse,
    tool,
    confirm,
    capture,
    persist,
    importBackup,
    guideStation: guideReturn.current.station,
    previewSound: () => void sounds.current?.preview(),
  }
}
