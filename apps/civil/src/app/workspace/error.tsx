'use client'

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="workspace-page">
      <div className="empty-panel workspace-route-error">
        <strong>작업공간 화면을 표시하지 못했습니다.</strong>
        <p>입력 중이던 내용은 유지되지 않을 수 있습니다. 화면을 다시 불러와주세요.</p>
        <button className="button button-dark" onClick={reset} type="button">
          다시 불러오기
        </button>
      </div>
    </section>
  )
}
