'use client'

export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const errorSignature = `${error.name} ${error.message}`
  const deferredLoadFailure =
    /DeferredModuleLoadError|ChunkLoadError|load(?:ing)? chunk|dynamically imported module|module script|preload CSS|fetch CSS|CSS chunk/i.test(
      errorSignature,
    )
  const restartFromCheckpoint = () => window.location.reload()

  return (
    <main className="app-fallback" data-kind="error" data-recovery={deferredLoadFailure ? 'module' : 'runtime'}>
      <div className="fallback-sky" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <section
        className="fallback-card"
        role="alert"
        aria-labelledby="fallback-title"
        aria-describedby="fallback-description"
      >
        <span className="fallback-sigil" aria-hidden="true">
          <b>✦</b>
        </span>
        <p className="eyebrow">{deferredLoadFailure ? 'CHECKPOINT RECOVERY READY' : 'THE EMBER STILL REMAINS'}</p>
        <h1 id="fallback-title">
          {deferredLoadFailure ? '필요한 화면을 불러오지 못했습니다' : '불씨가 잠시 흔들렸습니다'}
        </h1>
        <p id="fallback-description">
          {deferredLoadFailure
            ? '진행에 필요한 화면이 제시간에 도착하지 않았습니다. 저장된 원정은 그대로이며, 체크포인트에서 재시작하면 현재 앱 화면과 다시 연결합니다.'
            : '화면을 불러오는 중 예상하지 못한 문제가 발생했습니다. 이 기기에 저장된 원정과 유산 기록은 삭제하지 않았습니다.'}
        </p>
        <div className="fallback-actions">
          <button type="button" onClick={deferredLoadFailure ? restartFromCheckpoint : reset} autoFocus>
            <span>{deferredLoadFailure ? '체크포인트에서 재시작' : '화면 다시 불러오기'}</span>
            <i aria-hidden="true">›</i>
          </button>
          <button type="button" onClick={deferredLoadFailure ? reset : restartFromCheckpoint}>
            {deferredLoadFailure ? '현재 화면만 다시 시도' : '저장 기록으로 재시작'}
          </button>
          <a href="/">타이틀로 돌아가기</a>
        </div>
        <footer>
          <span>{deferredLoadFailure ? 'SCREEN LOAD RECOVERY' : 'CHECKPOINT PRESERVED'}</span>
          {error.digest ? (
            <small>참조 코드 {error.digest}</small>
          ) : (
            <small>다시 발생하면 백업 파일을 보관해 주세요.</small>
          )}
        </footer>
      </section>
    </main>
  )
}
