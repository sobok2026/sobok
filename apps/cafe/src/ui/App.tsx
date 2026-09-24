import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  customerNames,
  formatAmount,
  INGREDIENTS,
  ingredientIds,
  money,
  RECIPES,
  recipeIds,
  recipeLabel,
  STATIONS,
  type StationId,
} from '../game/catalog'
import { craftStations } from '../game/crafting'
import { PREPARATIONS, preparationStep } from '../game/preparation'
import type { CafeScene } from '../game/scene'
import type { GameState } from '../game/state'
import { exportGame, importGame, loadGame, saveGame } from '../game/storage'
import {
  type Action,
  available,
  CafeStore,
  closingTasks,
  initialState,
  nextStep,
  suggestedStation,
} from '../game/store'
import BatchLabel from './BatchLabel'
import CraftingHud from './CraftingHud'
import PreparationHud from './PreparationHud'

function CupIcon({ small = false }: { small?: boolean }) {
  return (
    <svg width={small ? 24 : 40} height={small ? 24 : 40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
    second: '2-digit',
  })
}
export default function App() {
  const [boot, setBoot] = useState<{ store: CafeStore; hasSave: boolean; notice: string } | null>(null)
  useEffect(() => {
    let cancelled = false
    loadGame()
      .then(({ state, recovered }) => {
        if (!cancelled)
          setBoot({
            store: new CafeStore(state ?? initialState()),
            hasSave: !!state,
            notice: recovered ? '이전 정상 저장본으로 복구했어요.' : '',
          })
      })
      .catch(() => {
        if (!cancelled)
          setBoot({
            store: new CafeStore(initialState()),
            hasSave: false,
            notice: '저장 기록을 읽지 못했어요. 새 근무를 시작하거나 백업 파일을 불러올 수 있어요.',
          })
      })
    return () => {
      cancelled = true
    }
  }, [])
  return boot ? (
    <CafeGame {...boot} />
  ) : (
    <div className="loading-screen">
      <CupIcon />
      <p>매장의 불을 켜고 있어요.</p>
      <span>DAY SHIFT</span>
    </div>
  )
}

function CafeGame({ store, hasSave, notice }: { store: CafeStore; hasSave: boolean; notice: string }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [mode, setMode] = useState<'welcome' | 'play' | 'pause' | 'guide'>('welcome')
  const [panel, setPanel] = useState<StationId | null>(null)
  const [target, setTarget] = useState<StationId | null>(null)
  const [needsStaffAccess, setNeedsStaffAccess] = useState(false)
  const [saveStatus, setSaveStatus] = useState(notice || '이 기기에 자동 저장')
  const [saveError, setSaveError] = useState(false)
  const [graphicsError, setGraphicsError] = useState('')
  const [sceneReady, setSceneReady] = useState(false)
  const [hasLock, setHasLock] = useState<boolean | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [started, setStarted] = useState(false)
  const [posSelection, setPosSelection] = useState(state.ticket ?? state.request)
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<CafeScene | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const flags = useRef({ mode, panel, started, hasLock })
  flags.current = { mode, panel, started, hasLock }

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
    if (id === 'prep' && current.preparation) {
      scene.current?.unlockForCraft()
      return
    }
    if (id === 'cups' && current.ticket && !current.cup) {
      act({ type: 'take-cup' })
      return
    }
    if (current.cup && craftStations.includes(id)) {
      moveCup(id)
      return
    }
    flags.current.panel = id
    setPanel(id)
    setTarget(null)
    if (id === 'pos') setPosSelection(store.getSnapshot().ticket ?? store.getSnapshot().request)
    scene.current?.unlock()
  }
  function closePanel() {
    flags.current.panel = null
    setPanel(null)
    scene.current?.lock()
  }
  function pause() {
    stopUse()
    flags.current.mode = 'pause'
    flags.current.panel = null
    setPanel(null)
    setMode('pause')
    scene.current?.unlock()
    void persist()
  }
  function resume() {
    flags.current.mode = 'play'
    flags.current.panel = null
    setPanel(null)
    setMode('play')
    scene.current?.lock()
  }
  function start(fresh = false) {
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
    store.dispatch(action)
    if (action.type === 'take-cup' && store.getSnapshot().cup) closePanel()
    if (action.type === 'start-preparation' && store.getSnapshot().preparation) {
      closePanel()
      scene.current?.unlockForCraft()
    }
    if (action.type === 'place-cup' && store.getSnapshot().cup?.craft.location === action.station)
      scene.current?.unlockForCraft()
    if (action.type === 'pick-cup' && store.getSnapshot().cup?.craft.location === 'hand') scene.current?.lock()
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
    if (station === 'prep' && store.getSnapshot().preparation) act({ type: 'prep-use' })
    else act({ type: 'use-start', station })
  }
  function stopUse() {
    if (!store.getActiveInput()) return
    store.stopActiveInput()
    void persist()
  }
  function tool(station: StationId) {
    if (station === 'prep' && store.getSnapshot().preparation) act({ type: 'prep-tool' })
    else act({ type: 'tool', station })
  }
  function confirm(station: StationId) {
    const prep = store.getSnapshot().preparation
    if (station === 'prep' && prep) {
      if (prep.fault) act({ type: 'discard-preparation' })
      else if (prep.stage === 'ready' && prep.batchId) act({ type: 'label-batch', id: prep.batchId })
      else act({ type: 'prep-confirm' })
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
      if (!store.getActiveInput() && seconds < 0.49) return
      last = now
      if (flags.current.mode === 'play' && flags.current.started && flags.current.hasLock && !document.hidden) {
        const wasUsing = !!store.getActiveInput()
        store.tick(seconds)
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
    window.addEventListener('keydown', keyboard)
    window.addEventListener('blur', stopUse)
    return () => {
      clearInterval(tick)
      clearInterval(save)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('blur', stopUse)
    }
  }, [store])
  const step = nextStep(state)
  const request = RECIPES[state.request]
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]
  const running = mode === 'play' && state.phase !== 'summary'
  const lastMessage = state.messages.at(-1)
  const actionJob = state.jobs.find((job) => job.station === panel)
  const goalStation = suggestedStation(state)
  const goal =
    goalStation === 'pos'
      ? state.phase === 'closing'
        ? 'POS에서 근무 결산'
        : 'POS에서 주문 받기'
      : STATIONS[goalStation].name
  const canStart = sceneReady && hasLock === true && !graphicsError
  const showPreparation = !!state.preparation && (target === 'prep' || !state.cup)
  const taskLabel = state.preparation
    ? state.preparation.stage === 'ready'
      ? '라벨·보관'
      : preparationStep(state.preparation).label
    : step?.label

  return (
    <main
      className={`cafe-app ${!panel && ((state.cup && target === state.cup.craft.location) || (state.preparation && target === 'prep')) ? 'craft-active' : ''}`}
    >
      <div ref={host} className="scene-host" />
      <div className="scene-vignette" />
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        aria-label="저장 백업 파일 불러오기"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file || !hasLock) return
          try {
            const imported = await importGame(file)
            await saveGame(imported)
            store.replace(imported)
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
      <header className="topbar">
        <div className="brand">
          <CupIcon small />
          <div>
            DAY SHIFT<span>카페 근무</span>
          </div>
        </div>
        <div className="shift-clock">
          <span className="sun-symbol">☀</span>
          <div>
            <small>
              DAY {String(state.day).padStart(2, '0')} ·{' '}
              {state.phase === 'open' ? '영업 중' : state.phase === 'closing' ? '마감 정리' : '근무 완료'}
            </small>
            <strong>{clock(state.time)}</strong>
          </div>
        </div>
        <div className="top-actions">
          <div className="wallet">
            <small>운영비</small>
            <strong>{money(state.cash)}</strong>
          </div>
          {started ? (
            <button type="button" className="icon-button" onClick={pause} aria-label="일시정지 메뉴">
              Ⅱ
            </button>
          ) : (
            <span className="version-badge">PROTOTYPE 01</span>
          )}
        </div>
      </header>

      {mode === 'welcome' ? (
        <div className="welcome-layer">
          <section className="welcome-card">
            <span className="eyebrow">A LITTLE COFFEE, A LITTLE CARE</span>
            <h1>
              오늘도,
              <br />
              문을 엽니다.
            </h1>
            <p className="intro">
              주문을 받고, 커피를 만들고,
              <br />
              다음 손님을 위한 자리를 준비해요.
              <br />
              작은 카페의 하루가 당신을 기다립니다.
            </p>
            <div className="welcome-meta">
              <span>1인칭 매장 운영</span>
              <span>PC · 키보드와 마우스</span>
              <span>로컬 자동 저장</span>
            </div>
            <button
              type="button"
              className="primary-button start-button"
              disabled={!canStart}
              onClick={() => start(false)}
            >
              {sceneReady ? (hasSave ? '이어서 근무하기' : '첫 근무 시작하기') : '매장 준비 중…'}
              <span>↗</span>
            </button>
            <div className="welcome-links">
              <button type="button" onClick={() => setMode('guide')}>
                근무 안내
              </button>
              <button type="button" disabled={!hasLock} onClick={() => input.current?.click()}>
                백업 불러오기
              </button>
              {hasSave ? (
                <button type="button" onClick={() => setConfirmNew(true)}>
                  처음부터
                </button>
              ) : null}
            </div>
            <p className="subtle-note">
              화면을 클릭하면 마우스로 둘러볼 수 있어요.
              <br />
              Esc를 누르면 언제든 쉬어갈 수 있습니다.
            </p>
            {notice ? (
              <p className="error-text" role="status">
                {notice}
              </p>
            ) : null}
          </section>
          <div className="welcome-caption">
            <span>01 — MORNING SHIFT</span>
            <p>
              따뜻한 빛, 막 준비한 커피.
              <br />
              영업 준비를 시작해볼까요?
            </p>
          </div>
        </div>
      ) : null}

      {running ? (
        <>
          <aside className="order-card">
            <div className="card-label">
              <span>ORDER / {String(state.orderNumber).padStart(3, '0')}</span>
              <span className={`status-pill ${state.ticket ? 'active' : ''}`}>
                {state.ticket ? '제조 중' : state.phase === 'closing' ? '접수 마감' : '접수 대기'}
              </span>
            </div>
            {state.phase === 'closing' && !state.ticket ? (
              <>
                <h2>
                  오늘의 주문을
                  <br />
                  마감했어요.
                </h2>
                <p>
                  남은 정리를 마치고
                  <br />
                  POS에서 결산해주세요.
                </p>
              </>
            ) : (
              <>
                <div className="customer-line">
                  <span className="avatar">{customer.slice(0, 1)}</span>
                  <span>{customer} 님의 주문</span>
                </div>
                <h2>{request.shortName}</h2>
                <div className="order-spec">
                  <span>{request.variant === 'HOT' ? 'HOT' : 'ICED'}</span>
                  <span>TALL</span>
                  <span>1잔</span>
                </div>
                {state.ticket ? (
                  <div className="ticket-detail">
                    <small>입력한 주문표</small>
                    <strong>{recipeLabel(state.ticket)}</strong>
                    {state.ticket !== state.request ? (
                      <span className="error-text">손님의 요청을 다시 확인해주세요.</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="order-quote">
                    “{request.name} {request.variant === 'HOT' ? '따뜻하게' : '아이스로'} 한 잔 부탁해요.”
                  </p>
                )}
                <div className="recipe-progress">
                  <div>
                    <span>{state.cup ? '제조 진행' : '다음 업무'}</span>
                    <strong>
                      {state.cup
                        ? `${state.cup.step} / ${RECIPES[state.cup.recipe].steps.length}`
                        : state.preparation
                          ? 'PREP'
                          : 'POS'}
                    </strong>
                  </div>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${state.cup ? (state.cup.step / RECIPES[state.cup.recipe].steps.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="next-task">
              <span>→</span>
              <div>
                <small>지금 할 일</small>
                <strong>{goal}</strong>
                {taskLabel ? <p>{taskLabel}</p> : null}
              </div>
            </div>
          </aside>
          <aside className="shift-status">
            <span className="eyebrow">매장 살피기</span>
            <div className="mini-stats">
              <span>
                <b>{state.totals.served}</b>완료 주문
              </span>
              <span>
                <b>{state.tools.clean}</b>깨끗한 피처
              </span>
              <span>
                <b>{state.cups}</b>준비된 컵
              </span>
            </div>
            <div className="chore-list">
              <span className={state.dirtyTables ? 'needs-work' : ''}>
                <i />
                테이블 정리 <b>{state.dirtyTables || '완료'}</b>
              </span>
              <span className={state.tools.dirty ? 'needs-work' : ''}>
                <i />
                사용한 피처 <b>{state.tools.dirty}</b>
              </span>
              <span className={state.tools.washed ? 'needs-work' : ''}>
                <i />
                선반에 둘 도구 <b>{state.tools.washed}</b>
              </span>
              {state.dirtyBar ? (
                <span className="needs-work">
                  <i />
                  작업대 닦기 <b>{state.dirtyBar}</b>
                </span>
              ) : null}
            </div>
            {state.jobs.length ? (
              <div className="active-jobs">
                {state.jobs.map((job) => (
                  <div key={job.id}>
                    <span>{job.label}</span>
                    <b>
                      {job.endsAt - state.time > 3600
                        ? `${Math.ceil((job.endsAt - state.time) / 3600)}시간`
                        : `${Math.ceil(job.endsAt - state.time)}초`}
                    </b>
                    <div className="progress-track">
                      <i
                        style={{
                          width: `${Math.min(100, ((state.time - job.startedAt) / (job.endsAt - job.startedAt)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
          {!panel ? (
            <>
              <div className={`crosshair ${target ? 'focused' : ''}`} />
              <div className="interaction-hint">
                {target ? (
                  <button type="button" onClick={() => openPanel(target)}>
                    <kbd>E</kbd>
                    <span>
                      <small>
                        {state.cup && craftStations.includes(target)
                          ? state.cup.craft.location === 'hand'
                            ? 'E · 컵 내려놓기'
                            : state.cup.craft.location === target
                              ? 'E · 컵 집기'
                              : '컵이 다른 작업대에 있어요'
                          : STATIONS[target].subtitle}
                      </small>
                      <strong>{STATIONS[target].name}</strong>
                    </span>
                    <span className="hint-arrow">↗</span>
                  </button>
                ) : (
                  <span className="look-hint">
                    {needsStaffAccess
                      ? '직원 쪽에서만 사용할 수 있어요 · POS 옆 직원 출입구로 들어가세요'
                      : '작업대를 바라보고 가까이 다가가세요'}
                  </span>
                )}
              </div>
            </>
          ) : null}
          {!panel && showPreparation ? <PreparationHud state={state} target={target} act={act} stop={stopUse} /> : null}
          {!panel && state.cup && !showPreparation ? (
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
          <div className={`toast ${lastMessage?.tone ?? ''}`} role="status" aria-live="polite" key={lastMessage?.id}>
            <span>{lastMessage?.tone === 'success' ? '✓' : lastMessage?.tone === 'error' ? '!' : '·'}</span>
            {lastMessage?.text}
          </div>
          <footer className="game-footer">
            <div>
              <kbd>W A S D</kbd> 이동 <kbd>E</kbd> 컵·작업대 <kbd>G</kbd> 도구 <kbd>Space</kbd> 사용 <kbd>F</kbd> 확인{' '}
              <kbd>Esc</kbd> 쉬기
            </div>
            <span className={saveError ? 'error-text' : ''}>
              <i className="save-dot" />
              {saveStatus}
            </span>
          </footer>
        </>
      ) : null}

      {panel && running ? (
        <div className="station-layer">
          <section className="station-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">WORK STATION</span>
                <h2>{STATIONS[panel].name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closePanel} aria-label="작업대 닫기">
                ×
              </button>
            </div>
            <p className="panel-description">{STATIONS[panel].subtitle}</p>
            {actionJob ? (
              <div className="job-banner">
                <span>{actionJob.label}</span>
                <strong>{Math.ceil(actionJob.endsAt - state.time)}초 남음</strong>
                <small>작업대를 나가도 계속 진행돼요.</small>
              </div>
            ) : null}
            {panel === 'pos' ? (
              <>
                {state.phase === 'open' || state.ticket ? (
                  <>
                    <div className="request-note">
                      <span>{customer} 님</span>
                      <p>
                        {recipeLabel(state.request)}
                        <br />
                        <small>Tall · 1잔</small>
                      </p>
                    </div>
                    <label className="field-label" htmlFor="pos-menu">
                      주문 입력
                    </label>
                    <select
                      id="pos-menu"
                      value={posSelection}
                      onChange={(event) => setPosSelection(event.target.value as typeof posSelection)}
                    >
                      {recipeIds.map((id) => (
                        <option key={id} value={id}>
                          {recipeLabel(id)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={!!state.cup}
                      onClick={() => act({ type: 'ticket', recipe: posSelection })}
                    >
                      {state.ticket ? '주문표 수정' : '결제 확인 · 주문표 출력'}
                    </button>
                  </>
                ) : null}
                <div className="panel-separator" />
                <div className="summary-pair">
                  <span>오늘 판매</span>
                  <strong>{money(state.totals.revenue)}</strong>
                </div>
                {state.phase === 'open' ? (
                  <button type="button" className="secondary-button" onClick={() => act({ type: 'close' })}>
                    신규 주문 마감하기
                  </button>
                ) : (
                  <>
                    <p className="field-label">마감 체크</p>
                    {closingTasks(state).length ? (
                      <ul className="closing-list">
                        {closingTasks(state).map((task) => (
                          <li key={task}>{task}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="success-text">모든 정리를 마쳤어요.</p>
                    )}
                    <button
                      type="button"
                      className="primary-button"
                      disabled={closingTasks(state).length > 0}
                      onClick={() => act({ type: 'finish' })}
                    >
                      근무 마치고 결산하기
                    </button>
                  </>
                )}
              </>
            ) : null}
            {panel === 'cups' ? (
              <>
                <div className="large-number">
                  {state.cups}
                  <small>개 준비됨</small>
                </div>
                <p>주문에 맞는 Tall 컵을 집어 제조를 시작해요.</p>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!state.ticket || !!state.cup || !state.cups}
                  onClick={() => act({ type: 'take-cup' })}
                >
                  컵 집기
                </button>
                <button type="button" className="secondary-button" onClick={() => act({ type: 'cups' })}>
                  후방 컵 보충 · 남은 {state.reserveCups}개
                </button>
              </>
            ) : null}
            {['espresso', 'steam', 'brew', 'water', 'ice', 'sauce', 'mix', 'topping'].includes(panel) &&
            step?.station !== panel ? (
              <div className="empty-work">
                <CupIcon />
                <p>
                  {state.cup
                    ? `다음 작업은 ${step?.label ?? '픽업대에서 전달'}예요.`
                    : '주문을 받고 컵을 준비하면 제조할 수 있어요.'}
                </p>
              </div>
            ) : null}
            {panel === 'pickup' ? (
              <>
                <div className="panel-separator" />
                <button
                  type="button"
                  className="primary-button"
                  disabled={!state.cup || !!step}
                  onClick={() => act({ type: 'serve' })}
                >
                  주문 확인 · 손님에게 전달
                </button>
              </>
            ) : null}
            {panel === 'prep' ? (
              <>
                <div className="prep-card">
                  <span>01 / COLD FOAM</span>
                  <h3>글레이즈드 폼</h3>
                  <p>
                    휘핑크림, 우유와 소스를 계량하고
                    <br />
                    블렌딩한 뒤 냉장 보관해요.
                  </p>
                  <small>준비된 양 {formatAmount(available(state, 'foam'))}ml</small>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!!actionJob}
                    onClick={() => act({ type: 'start-preparation', recipe: 'foam' })}
                  >
                    피처 놓고 직접 계량
                  </button>
                </div>
                <div className="prep-card">
                  <span>02 / MOCHA</span>
                  <h3>바모카</h3>
                  <p>
                    원팩과 온수를 배합하고
                    <br />
                    마킹 M으로 보관해요.
                  </p>
                  <small>준비된 양 {formatAmount(available(state, 'mocha'))}ml</small>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!!actionJob}
                    onClick={() => act({ type: 'start-preparation', recipe: 'mocha' })}
                  >
                    원팩·온수 직접 배합
                  </button>
                </div>
                <p className="subtle-note">피처가 필요해요. 작업 후 세척대와 도구 선반을 이용하세요.</p>
                <p className="subtle-note">
                  {PREPARATIONS.foam.storageNote}
                  <br />
                  바모카: {PREPARATIONS.mocha.storageNote}
                </p>
              </>
            ) : null}
            {panel === 'wash' ? (
              <>
                <div className="large-number">
                  {state.tools.dirty}
                  <small>개 세척 대기</small>
                </div>
                <p>세척이 끝나면 옆 도구 선반에 정리해주세요.</p>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!!actionJob || !state.tools.dirty}
                  onClick={() => act({ type: 'wash' })}
                >
                  피처 한 개 세척
                </button>
              </>
            ) : null}
            {panel === 'rack' ? (
              <>
                <div className="large-number">
                  {state.tools.washed}
                  <small>개 정리 대기</small>
                </div>
                <p>선반에 정리한 도구를 다음 제조에 사용할 수 있어요.</p>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!state.tools.washed}
                  onClick={() => act({ type: 'rack' })}
                >
                  깨끗한 도구 정리
                </button>
              </>
            ) : null}
            {panel === 'table' ? (
              <>
                <div className="large-number">
                  {state.dirtyTables}
                  <small>회 정리 필요</small>
                </div>
                <p>컵을 회수하고 사용한 자리를 닦아주세요.</p>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!state.dirtyTables || !!actionJob}
                  onClick={() => act({ type: 'clean-table' })}
                >
                  테이블 정리 · 닦기
                </button>
              </>
            ) : null}
            {panel === 'mix' ? (
              <button
                type="button"
                className="secondary-button"
                disabled={!state.dirtyBar || !!actionJob}
                onClick={() => act({ type: 'wipe' })}
              >
                작업대 닦기 · {state.dirtyBar}회
              </button>
            ) : null}
            {panel === 'trash' ? (
              <>
                <div className="large-number">
                  {state.trash}
                  <small>개 모였어요</small>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!state.trash}
                  onClick={() => act({ type: 'trash' })}
                >
                  분리수거함 비우기
                </button>
              </>
            ) : null}
            {panel === 'stock' ? (
              <>
                <div className="inventory-grid">
                  {ingredientIds.map((id) => {
                    const definition = INGREDIENTS[id]
                    const batches = state.batches.filter((batch) => batch.ingredient === id && batch.amount > 0)
                    const sealed = batches.find((batch) => batch.location === 'stock' && batch.openedAt === null)
                    return (
                      <article className="inventory-item" key={id}>
                        <div>
                          <h3>{definition.name}</h3>
                          <span className="storage-label">{definition.storage === 'fridge' ? '냉장' : '실온'}</span>
                        </div>
                        <p className="inventory-amount">
                          {formatAmount(available(state, id))}
                          <small>{definition.unit} 사용 가능</small>
                        </p>
                        {batches
                          .filter((batch) => batch.openedAt !== null)
                          .map((batch) => (
                            <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} />
                          ))}
                        <div className="inventory-actions">
                          {sealed ? (
                            <button type="button" onClick={() => act({ type: 'open-batch', id: sealed.id })}>
                              원팩 개봉
                            </button>
                          ) : !definition.prepared ? (
                            <button type="button" onClick={() => act({ type: 'buy', ingredient: id })}>
                              입고 · {money(definition.price)}
                            </button>
                          ) : (
                            <small>준비대에서 제조</small>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
                <button type="button" className="secondary-button" onClick={() => act({ type: 'cups' })}>
                  컵 보충 · 후방 {state.reserveCups}개
                </button>
                <button type="button" className="secondary-button" onClick={() => act({ type: 'buy-cups' })}>
                  컵 24개 입고 · 2,000원
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={state.jobs.some((job) => job.kind === 'cold-brew')}
                  onClick={() => act({ type: 'cold-brew' })}
                >
                  다음 날 콜드 브루 추출 · 20시간
                </button>
              </>
            ) : null}
            {state.cup ? (
              <button type="button" className="text-button danger" onClick={() => act({ type: 'discard-cup' })}>
                현재 컵 폐기하기
              </button>
            ) : null}
            <button type="button" className="leave-button" onClick={closePanel}>
              매장으로 돌아가기 <span>Esc</span>
            </button>
          </section>
        </div>
      ) : null}

      {mode === 'pause' || mode === 'guide' ? (
        <div className="modal-shade">
          <section className="pause-card">
            <span className="eyebrow">{mode === 'guide' ? 'YOUR FIRST SHIFT' : 'TAKE A BREATH'}</span>
            <h2>{mode === 'guide' ? '근무를 시작하기 전에' : '잠시 쉬어가요.'}</h2>
            {mode === 'guide' ? (
              <>
                <p>
                  POS → 컵 준비 → 제조 → 픽업.
                  <br />
                  주문표가 다음 작업대를 알려줍니다.
                </p>
                <div className="guide-grid">
                  <p>
                    <kbd>W A S D</kbd>
                    <span>매장 이동</span>
                  </p>
                  <p>
                    <kbd>마우스 / 방향키</kbd>
                    <span>주변 둘러보기</span>
                  </p>
                  <p>
                    <kbd>E</kbd>
                    <span>컵 집기·놓기 / 작업대 열기</span>
                  </p>
                  <p>
                    <kbd>G</kbd>
                    <span>도구 집기·놓기</span>
                  </p>
                  <p>
                    <kbd>클릭 / Space</kbd>
                    <span>누르고 붓기·젓기 / 한 번 펌핑</span>
                  </p>
                  <p>
                    <kbd>F</kbd>
                    <span>계량 확인 / 픽업대에서 전달</span>
                  </p>
                  <p>
                    <kbd>Esc</kbd>
                    <span>메뉴 · 일시정지</span>
                  </p>
                </div>
                <p className="subtle-note">
                  컵을 작업대에 놓고 계량하세요. 목표 구간에서 멈춘 뒤 도구를 놓고 F로 확인해요.
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
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => (started ? resume() : setMode('welcome'))}
                >
                  {started ? '근무로 돌아가기' : '알겠어요'}
                </button>
              </>
            ) : (
              <>
                <p>
                  게임 시간도 함께 멈췄어요.
                  <br />
                  준비가 되면 이어서 근무하세요.
                </p>
                <button type="button" className="primary-button" disabled={!canStart} onClick={resume}>
                  근무 계속하기 <span>→</span>
                </button>
                <button type="button" className="secondary-button" onClick={() => setMode('guide')}>
                  조작과 근무 안내
                </button>
                <div className="backup-actions">
                  <button type="button" onClick={() => exportGame(capture())}>
                    백업 내보내기
                  </button>
                  <button type="button" disabled={!hasLock} onClick={() => input.current?.click()}>
                    백업 불러오기
                  </button>
                </div>
                <button type="button" className="text-button" onClick={() => void persist()}>
                  지금 저장
                </button>
                <button type="button" className="text-button danger" onClick={() => setConfirmNew(true)}>
                  처음부터 다시 시작
                </button>
                <p className={saveError ? 'error-text' : 'subtle-note'}>{saveStatus}</p>
              </>
            )}
          </section>
        </div>
      ) : null}

      {state.phase === 'summary' && started && mode === 'play' ? (
        <div className="modal-shade">
          <section className="closing-card">
            <span className="eyebrow">DAY {String(state.day).padStart(2, '0')} / CLOSED</span>
            <h2>잘 마쳤습니다.</h2>
            <p>
              한 잔의 커피부터 깨끗한 마감까지.
              <br />
              오늘 매장에 남긴 기록이에요.
            </p>
            <div className="report-grid">
              <div>
                <small>완료 주문</small>
                <strong>
                  {state.totals.served}
                  <em>잔</em>
                </strong>
              </div>
              <div>
                <small>판매</small>
                <strong>{money(state.totals.revenue)}</strong>
              </div>
              <div>
                <small>청소 / 세척</small>
                <strong>
                  {state.totals.cleaned} / {state.totals.washed}
                </strong>
              </div>
              <div>
                <small>재제조 컵</small>
                <strong>
                  {state.totals.wastedCups}
                  <em>개</em>
                </strong>
              </div>
            </div>
            <p className="subtle-note">
              다음 날에도 재고와 품질 기한이 이어집니다.
              <br />
              추출 중인 콜드 브루도 게임 시간만큼 진행돼요.
            </p>
            <button type="button" className="primary-button" onClick={() => act({ type: 'next-day' })}>
              다음 날 문 열기 <span>↗</span>
            </button>
            <button type="button" className="text-button" onClick={() => exportGame(capture())}>
              오늘의 기록 백업하기
            </button>
          </section>
        </div>
      ) : null}

      {confirmNew ? (
        <div className="modal-shade top-modal">
          <section className="pause-card">
            <h2>새로 시작할까요?</h2>
            <p>현재 기록을 백업한 뒤 새 근무를 시작할 수 있어요.</p>
            <button type="button" className="secondary-button" onClick={() => exportGame(capture())}>
              현재 기록 백업
            </button>
            <button type="button" className="primary-button" disabled={!canStart} onClick={() => start(true)}>
              처음부터 시작
            </button>
            <button type="button" className="text-button" onClick={() => setConfirmNew(false)}>
              돌아가기
            </button>
          </section>
        </div>
      ) : null}
      {graphicsError || hasLock === false ? (
        <div className="error-banner" role="alert">
          {graphicsError || '다른 창에서 이 매장을 열고 있어요. 그 창을 닫은 뒤 새로고침해주세요.'}
        </div>
      ) : null}
    </main>
  )
}
