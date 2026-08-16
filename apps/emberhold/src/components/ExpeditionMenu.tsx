import './deferred.css'

import type { GameState, MetaState } from './game-model'
import { ACHIEVEMENT_IDS, DIFFICULTIES, MAX_NIGHTS, OATHS } from './game-model'
import { preloadSettingsDialog } from './game-preloads'

type ExpeditionMenuProps = {
  showNewCampaignConfirm: boolean
  game: GameState
  meta: MetaState
  currentActNumber: number
  currentStoryTitle: string
  encounterGlyph: string
  runCode: string
  unlockedAchievementCount: number
  cancelDiscardCampaign: () => void
  closeExpeditionMenu: () => void
  discardCurrentCampaign: () => void
  openSettingsFromMenu: () => void
  returnToTitle: () => void
  askToDiscardCurrentCampaign: () => void
}

export function ExpeditionMenu({
  showNewCampaignConfirm,
  game,
  meta,
  currentActNumber,
  currentStoryTitle,
  encounterGlyph,
  runCode,
  unlockedAchievementCount,
  cancelDiscardCampaign,
  closeExpeditionMenu,
  discardCurrentCampaign,
  openSettingsFromMenu,
  returnToTitle,
  askToDiscardCurrentCampaign,
}: ExpeditionMenuProps) {
  return (
    <div className="modal-backdrop expedition-menu-backdrop" role="presentation">
      <section
        className="expedition-menu-card"
        data-confirm={showNewCampaignConfirm ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expedition-menu-title"
        aria-describedby="expedition-menu-lead"
        data-focus-scope="menu"
        tabIndex={-1}
      >
        <button
          className="modal-close"
          type="button"
          onClick={showNewCampaignConfirm ? cancelDiscardCampaign : closeExpeditionMenu}
          aria-label={showNewCampaignConfirm ? '새 원정 확인 취소' : '원정 메뉴 닫기'}
        >
          ×
        </button>

        {showNewCampaignConfirm ? (
          <>
            <header className="expedition-menu-heading danger-heading">
              <p className="eyebrow">RELEASE THE CURRENT EMBER</p>
              <h2 id="expedition-menu-title">현재 원정을 끝낼까요?</h2>
              <p id="expedition-menu-lead">
                이 원정의 체크포인트는 삭제되며 되돌릴 수 없습니다. 누적 유산과 업적, 지난 완주 기록은 그대로
                보존됩니다.
              </p>
            </header>
            <section className="discard-checkpoint" aria-label="삭제할 원정 체크포인트">
              <span aria-hidden="true">✕</span>
              <div>
                <small>
                  ACT {currentActNumber} · {game.day}일차
                </small>
                <strong>{currentStoryTitle}</strong>
                <p>
                  {DIFFICULTIES[game.difficulty].name} · {OATHS[game.oath].name} · 명성{' '}
                  {game.score.toLocaleString('ko-KR')}
                </p>
              </div>
            </section>
            <section className="preserved-progress" aria-label="보존되는 유산 기록">
              <span>
                <small>유산 불씨</small>
                <strong>{meta.embers}</strong>
              </span>
              <span>
                <small>해제 업적</small>
                <strong>
                  {unlockedAchievementCount} / {ACHIEVEMENT_IDS.length}
                </strong>
              </span>
              <span>
                <small>완주 기록</small>
                <strong>{meta.completedRuns}</strong>
              </span>
            </section>
            <footer className="discard-actions">
              <button type="button" onClick={cancelDiscardCampaign} data-autofocus="true">
                원정 유지
              </button>
              <button className="discard-confirm" type="button" onClick={discardCurrentCampaign}>
                현재 원정 삭제
              </button>
            </footer>
          </>
        ) : (
          <>
            <header className="expedition-menu-heading">
              <p className="eyebrow">EXPEDITION PAUSED</p>
              <h2 id="expedition-menu-title">불씨는 안전합니다</h2>
              <p id="expedition-menu-lead">
                현재 체크포인트를 이 기기에 저장했습니다. 잠시 멈추거나 원정 환경을 바꿔도 그대로 이어집니다.
              </p>
            </header>

            <section className="pause-checkpoint" aria-label="현재 원정 체크포인트">
              <header>
                <span>CHECKPOINT SECURED</span>
                <b>
                  <i aria-hidden="true">◆</i> 기기에 저장됨
                </b>
              </header>
              <div className="pause-checkpoint-main">
                <span aria-hidden="true">{encounterGlyph}</span>
                <div>
                  <small>
                    ACT {currentActNumber} · NIGHT {game.day} / {MAX_NIGHTS}
                  </small>
                  <strong>{currentStoryTitle}</strong>
                  <p>
                    {DIFFICULTIES[game.difficulty].name} · {OATHS[game.oath].name} · 코드 {runCode}
                  </p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>화로 온기</dt>
                  <dd>{game.heat}%</dd>
                </div>
                <div>
                  <dt>보급품</dt>
                  <dd>{game.supplies}</dd>
                </div>
                <div>
                  <dt>사기</dt>
                  <dd>{game.morale}</dd>
                </div>
                <div>
                  <dt>명성</dt>
                  <dd>{game.score.toLocaleString('ko-KR')}</dd>
                </div>
              </dl>
            </section>

            <div className="expedition-menu-actions">
              <button className="resume-expedition" type="button" onClick={closeExpeditionMenu} data-autofocus="true">
                <span aria-hidden="true">›</span>
                <div>
                  <strong>원정 계속하기</strong>
                  <small>현재 전술 화면으로 돌아갑니다.</small>
                </div>
              </button>
              <button
                type="button"
                onPointerEnter={preloadSettingsDialog}
                onFocus={preloadSettingsDialog}
                onClick={openSettingsFromMenu}
              >
                <span aria-hidden="true">⚙</span>
                <div>
                  <strong>환경 설정</strong>
                  <small>소리·화면·전투 속도를 조절합니다.</small>
                </div>
              </button>
              <button type="button" onClick={returnToTitle}>
                <span aria-hidden="true">⌂</span>
                <div>
                  <strong>저장 후 타이틀로</strong>
                  <small>현재 원정을 보존하고 나갑니다.</small>
                </div>
              </button>
              <button className="new-expedition-action" type="button" onClick={askToDiscardCurrentCampaign}>
                <span aria-hidden="true">↺</span>
                <div>
                  <strong>새 원정 준비</strong>
                  <small>현재 체크포인트 삭제 전 다시 확인합니다.</small>
                </div>
              </button>
            </div>

            <footer className="expedition-menu-footnote">
              <span>
                <kbd>Esc</kbd> 또는 <kbd>P</kbd>
              </span>
              <p>모바일에서 앱이 백그라운드로 이동해도 마지막 상태를 다시 저장합니다.</p>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
