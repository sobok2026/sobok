'use client'

export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="app-fallback" data-kind="error">
      <div className="fallback-sky" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <section className="fallback-card" role="alert" aria-labelledby="fallback-title">
        <span className="fallback-sigil" aria-hidden="true">
          <b>✦</b>
        </span>
        <p className="eyebrow">THE EMBER STILL REMAINS</p>
        <h1 id="fallback-title">불씨가 잠시 흔들렸습니다</h1>
        <p>
          화면을 불러오는 중 예상하지 못한 문제가 발생했습니다. 이 기기에 저장된 원정과 유산 기록은 삭제하지 않았습니다.
        </p>
        <div className="fallback-actions">
          <button type="button" onClick={reset}>
            <span>화면 다시 불러오기</span>
            <i aria-hidden="true">›</i>
          </button>
          <button type="button" onClick={() => window.location.reload()}>
            저장 기록으로 재시작
          </button>
          <a href="/">타이틀로 돌아가기</a>
        </div>
        <footer>
          <span>CHECKPOINT PRESERVED</span>
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
