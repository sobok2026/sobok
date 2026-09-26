import clsx from 'clsx'
import { type ReactNode, useEffect, useState } from 'react'
import ShiftLedger from '../features/shift/ShiftLedger'
import ShiftOverview from '../features/shift/ShiftOverview'
import { money } from '../shared/format'
import { Button, TextButton } from '../shared/ui/Button'
import GameDialog from '../shared/ui/GameDialog'
import { initialState } from '../simulation/initial-state'
import { CafeStore } from '../simulation/store'
import WorkGuide from './guide/WorkGuide'
import PlayHud from './PlayHud'
import { exportGame, loadGame, loadPreferences } from './persistence/storage'
import StationPanel from './StationPanel'
import type { Preferences } from './session/preferences'
import { type CafeSessionProps, useCafeSession } from './session/use-cafe-session'
import WorkSettings from './session/WorkSettings'

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
      if (!cancelled) {
        setBoot({
          store: new CafeStore(game.state ?? initialState()),
          hasSave: game.hasSave,
          notice: game.notice,
          preferences,
        })
      }
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

function CafeGame(props: CafeSessionProps) {
  const { hasSave, notice } = props
  const session = useCafeSession(props)

  const {
    state,
    preferences,
    preferencesError,
    soundStatus,
    mode,
    panel,
    saveStatus,
    saveError,
    graphicsError,
    sceneReady,
    hasLock,
    mouseMode,
    confirmNew,
    setConfirmNew,
    started,
    host,
    input,
    updatePreferences,
    openGuide,
    closeGuide,
    closePanel,
    pause,
    resume,
    start,
    act,
    capture,
    persist,
    importBackup,
    guideStation,
    previewSound,
  } = session
  const running = mode === 'play' && state.phase !== 'summary'
  const canStart = sceneReady && hasLock === true && !graphicsError

  return (
    <main className="relative h-dvh overflow-hidden" data-mouse-mode={mouseMode}>
      <div ref={host} className="absolute inset-0 [&_canvas]:block [&_canvas]:size-full [&_canvas]:outline-none" />
      <div
        className={clsx(
          'pointer-events-none absolute inset-0',
          'bg-[linear-gradient(180deg,#18231b29,transparent_24%,transparent_75%,#18231b4d)]',
        )}
      />
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="저장 백업 파일 불러오기"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (file) {
            await importBackup(file)
          }
          event.target.value = ''
        }}
      />
      {running && (
        <header
          className={clsx(
            'absolute top-6 right-6 z-10 flex items-center gap-1',
            'rounded-full border border-white/60 bg-surface/95 py-1 pr-1 pl-4 shadow-hud',
            'max-tablet:top-4 max-tablet:right-4',
          )}
        >
          <time className="mr-2 text-body font-semibold tabular-nums">{clock(state.time)}</time>
          {state.phase === 'closing' && (
            <span className="mr-1 rounded-full bg-brand/10 px-2.5 py-1 text-sm font-medium text-brand">마감 중</span>
          )}
          <nav className="flex items-center" aria-label="게임 메뉴">
            {state.day === 1 && (
              <>
                <MenuKey shortcut="H" onClick={openGuide}>
                  도움말
                </MenuKey>
                <MenuKey shortcut="M" onClick={() => pause('overview')}>
                  매장
                </MenuKey>
              </>
            )}
            <MenuKey shortcut="Esc" onClick={() => pause()}>
              메뉴
            </MenuKey>
          </nav>
        </header>
      )}

      {mode === 'welcome' && (
        <div
          className={clsx(
            'absolute inset-0 flex items-center bg-[linear-gradient(90deg,#f3f2ecf5,transparent_80%)]',
            'max-tablet:bg-surface/60',
          )}
        >
          <section className="ml-[8vw] w-72 max-w-[80vw]">
            <div className="mb-5 text-brand">
              <CupIcon />
            </div>
            <h1 className="mb-10 text-5xl font-medium tracking-tighter text-brand">
              소복다방<span className="mt-3 block text-sm font-normal tracking-normal text-muted">카페 근무</span>
            </h1>
            <Button size="start" disabled={!canStart} onClick={() => start(false)}>
              {startLabel(sceneReady, hasSave)} <span aria-hidden="true">→</span>
            </Button>
            <div className="mt-3 flex items-center justify-between">
              <TextButton onClick={openGuide}>도움말</TextButton>
              <details className="relative text-sm text-muted">
                <summary className="cursor-pointer py-3">저장 관리</summary>
                <div
                  className={clsx(
                    'absolute right-0 top-full z-10 grid w-40',
                    'rounded-xl border border-line bg-surface p-3 shadow-hud',
                  )}
                >
                  <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                    백업 불러오기
                  </TextButton>
                  {hasSave && (
                    <TextButton danger onClick={() => setConfirmNew(true)}>
                      처음부터 시작
                    </TextButton>
                  )}
                </div>
              </details>
            </div>
            {(notice || saveError) && (
              <p className="mt-4 text-sm text-danger" role="status">
                {saveError ? saveStatus : notice}
              </p>
            )}
          </section>
        </div>
      )}

      {running && <PlayHud {...session} />}

      {mode === 'overview' && <ShiftOverview state={state} onClose={resume} />}

      {running && panel && <StationPanel state={state} panel={panel} act={act} closePanel={closePanel} />}

      {mode === 'guide' && (
        <GameDialog title="도움말" onClose={closeGuide} wide>
          <WorkGuide state={state} station={guideStation} started={started} />
        </GameDialog>
      )}
      {mode === 'pause' && (
        <GameDialog title="일시정지" onClose={resume}>
          <Button disabled={!canStart} onClick={resume}>
            계속하기 <kbd className="text-sm">Esc</kbd>
          </Button>
          <div className="my-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => pause('overview')}>
              매장 현황 <kbd className="text-sm">M</kbd>
            </Button>
            <Button variant="secondary" onClick={openGuide}>
              도움말 <kbd className="text-sm">H</kbd>
            </Button>
          </div>
          <details className="border-t border-line py-4">
            <summary className="text-sm font-medium">설정</summary>
            <WorkSettings
              preferences={preferences}
              status={soundStatus}
              error={preferencesError}
              onChange={updatePreferences}
              onPreview={previewSound}
            />
          </details>
          <details className="border-t border-line pt-4">
            <summary className="text-sm font-medium">저장 관리</summary>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <TextButton onClick={() => void persist()}>지금 저장</TextButton>
              <TextButton onClick={() => exportGame(capture())}>백업 내보내기</TextButton>
              <TextButton disabled={!hasLock} onClick={() => input.current?.click()}>
                백업 불러오기
              </TextButton>
            </div>
            <p className="mt-2 text-sm text-muted data-[error=true]:text-danger" data-error={saveError} role="status">
              {saveStatus}
            </p>
            <TextButton danger className="mt-3 border-t border-line pt-3" onClick={() => setConfirmNew(true)}>
              처음부터 시작
            </TextButton>
          </details>
          {saveError && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {saveStatus}
            </p>
          )}
        </GameDialog>
      )}

      {state.phase === 'summary' && started && mode === 'play' && (
        <GameDialog title={`${state.day}일차 결산`} wide>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">판매액</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{money(state.totals.revenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted">전달 음료</p>
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
      )}
      {confirmNew && (
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
      )}
      {(graphicsError || hasLock === false) && (
        <div
          className={clsx(
            'absolute bottom-16.25 left-1/2 z-30 max-w-145 -translate-x-1/2',
            'rounded border border-danger/30 bg-orange-100 px-5.5 py-4.25 shadow-toast',
            'text-sm leading-relaxed text-danger',
          )}
          role="alert"
        >
          {graphicsError || '다른 창에서 이 매장을 열고 있어요. 그 창을 닫은 뒤 새로고침해주세요.'}
        </div>
      )}
    </main>
  )
}

function MenuKey({ shortcut, children, onClick }: { shortcut: string; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="flex min-h-9 items-center gap-2 rounded-full px-3 text-sm" onClick={onClick}>
      <kbd className="text-muted">{shortcut}</kbd> {children}
    </button>
  )
}

function startLabel(sceneReady: boolean, hasSave: boolean) {
  if (!sceneReady) {
    return '불러오는 중…'
  }
  return hasSave ? '이어서 하기' : '시작하기'
}
