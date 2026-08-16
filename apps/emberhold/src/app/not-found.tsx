import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="app-fallback" data-kind="not-found">
      <div className="fallback-sky" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <section className="fallback-card" aria-labelledby="fallback-title">
        <span className="fallback-sigil" aria-hidden="true">
          <b>◇</b>
        </span>
        <p className="eyebrow">PATH LOST IN THE WHITEOUT</p>
        <h1 id="fallback-title">이 길은 눈보라에 지워졌습니다</h1>
        <p>요청한 경로는 존재하지 않지만, 마지막 불씨와 저장된 원정 기록은 원래 자리에서 기다리고 있습니다.</p>
        <div className="fallback-actions">
          <Link href="/">
            <span>마지막 화로로 돌아가기</span>
            <i aria-hidden="true">›</i>
          </Link>
        </div>
        <footer>
          <span>EMBERHOLD · ROUTE 404</span>
          <small>저장 데이터는 변경되지 않았습니다.</small>
        </footer>
      </section>
    </main>
  )
}
