'use client'

import { useEffect, useRef } from 'react'

import { type Stage, stageProgress } from '@/lib/experience'

type Props = {
  stage: Stage
  canGoBack: boolean
  confirmOpen: boolean
  onBack: () => void
  onRequestExit: () => void
  onCancelExit: () => void
  onExit: () => void
}

export default function ExperienceChrome({
  stage,
  canGoBack,
  confirmOpen,
  onBack,
  onRequestExit,
  onCancelExit,
  onExit,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const progress = stageProgress(stage)

  useEffect(() => {
    if (!confirmOpen) {
      return
    }

    cancelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancelExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmOpen, onCancelExit])

  return (
    <>
      <div className="experience-chrome">
        <div className="chrome-progress">
          <i style={{ transform: `scaleX(${progress?.ratio ?? 1})` }} />
        </div>
        <div className="chrome-row">
          <button className="chrome-button" disabled={!canGoBack} onClick={onBack} type="button">
            <span aria-hidden="true">←</span>
            이전
          </button>
          <p className="chrome-status">
            {progress ? (
              <>
                <span>
                  {progress.chapterIndex + 1}장 · {progress.chapterTitle}
                </span>
                <small>
                  {progress.chapterIndex + 1} / {progress.chapterCount}
                </small>
              </>
            ) : (
              <span>체험 종료</span>
            )}
          </p>
          <button className="chrome-button" onClick={onRequestExit} type="button">
            중단
          </button>
        </div>
      </div>

      {confirmOpen ? (
        <div aria-labelledby="exit-confirm-title" aria-modal="true" className="exit-confirm" role="dialog">
          <div className="exit-confirm-card">
            <strong id="exit-confirm-title">체험을 중단할까요?</strong>
            <p>이야기는 멈춰 있습니다. 중단하면 지금까지의 선택은 저장되지 않고 처음 화면으로 돌아갑니다.</p>
            <div className="exit-confirm-actions">
              <button className="secondary-action" onClick={onCancelExit} ref={cancelRef} type="button">
                계속 보기
              </button>
              <button className="danger-action" onClick={onExit} type="button">
                중단하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
