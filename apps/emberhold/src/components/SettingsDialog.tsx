import './deferred.css'

import type { ChangeEvent, RefObject } from 'react'
import type { GameSettings, StorageProtection } from './game-model'

export type BackupRecordSummary = {
  checkpoint: string
  context: string
  score: number
  bestScore: number
  embers: number
  completedRuns: number
  legacyCount: number
  achievementCount: number
  historyCount: number
}

export type BackupRestorePreview = {
  fileName: string
  current: BackupRecordSummary
  incoming: BackupRecordSummary
}

type SettingsDialogProps = {
  settings: GameSettings
  storageProtection: StorageProtection
  storageRequestPending: boolean
  restorePending: boolean
  backupRestorePreview: BackupRestorePreview | null
  backupInputRef: RefObject<HTMLInputElement | null>
  closeSettings: () => void
  toggleSound: () => void
  toggleHaptics: () => void
  updateSettings: (patch: Partial<GameSettings>) => void
  previewSound: () => void
  requestPersistentStorage: () => Promise<void>
  exportGameBackup: () => void
  restoreGameBackup: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  cancelGameBackupRestore: () => void
  confirmGameBackupRestore: () => void
  resetSettings: () => void
}

function BackupRecordCard({
  label,
  summary,
  incoming,
}: {
  label: string
  summary: BackupRecordSummary
  incoming: boolean
}) {
  return (
    <article className="backup-record-card" data-incoming={incoming ? 'true' : 'false'}>
      <header>
        <small>{label}</small>
        <strong>{summary.checkpoint}</strong>
        <p>{summary.context}</p>
      </header>
      <dl>
        <div>
          <dt>현재 명성</dt>
          <dd>{summary.score.toLocaleString('ko-KR')}</dd>
        </div>
        <div>
          <dt>최고 명성</dt>
          <dd>{summary.bestScore.toLocaleString('ko-KR')}</dd>
        </div>
        <div>
          <dt>유산 불씨</dt>
          <dd>{summary.embers.toLocaleString('ko-KR')}</dd>
        </div>
        <div>
          <dt>완주</dt>
          <dd>{summary.completedRuns.toLocaleString('ko-KR')}</dd>
        </div>
      </dl>
      <p>
        유산 {summary.legacyCount} · 업적 {summary.achievementCount} · 연대기 {summary.historyCount}
      </p>
    </article>
  )
}

export function SettingsDialog({
  settings,
  storageProtection,
  storageRequestPending,
  restorePending,
  backupRestorePreview,
  backupInputRef,
  closeSettings,
  toggleSound,
  toggleHaptics,
  updateSettings,
  previewSound,
  requestPersistentStorage,
  exportGameBackup,
  restoreGameBackup,
  cancelGameBackupRestore,
  confirmGameBackupRestore,
  resetSettings,
}: SettingsDialogProps) {
  const applyingRestore = restorePending && backupRestorePreview !== null

  return (
    <div className="modal-backdrop settings-backdrop" role="presentation">
      <section
        className="settings-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-lead"
        data-focus-scope="settings"
        data-restore-applying={applyingRestore ? 'true' : 'false'}
        aria-busy={applyingRestore}
        inert={applyingRestore ? true : undefined}
        tabIndex={-1}
      >
        <button
          className="modal-close"
          type="button"
          onClick={closeSettings}
          aria-label={backupRestorePreview || restorePending ? '백업 복원 취소' : '설정 닫기'}
          disabled={restorePending && backupRestorePreview !== null}
        >
          ×
        </button>
        <header className="settings-heading">
          <p className="eyebrow">FIELD CONFIGURATION</p>
          <h2 id="settings-title">내게 맞는 원정 환경</h2>
          <p id="settings-lead">
            사운드와 화면, 원정 흐름을 즉시 조정합니다. 모든 설정은 이 기기에 하나의 형식으로 저장됩니다.
          </p>
        </header>

        <div className="settings-layout">
          <section className="settings-group" aria-labelledby="settings-audio-title">
            <header>
              <span aria-hidden="true">♪</span>
              <div>
                <p>AUDIO</p>
                <h3 id="settings-audio-title">소리</h3>
              </div>
            </header>
            <button
              className="settings-toggle"
              type="button"
              data-on={settings.sound ? 'true' : 'false'}
              onClick={toggleSound}
              aria-pressed={settings.sound}
            >
              <span>
                <b>마스터 사운드</b>
                <small>효과음과 장면별 음악·환경음을 한 번에 켜거나 끕니다.</small>
              </span>
              <i aria-hidden="true">{settings.sound ? '켬' : '끔'}</i>
            </button>
            <label className="settings-range">
              <span>
                <b>효과음</b>
                <output>{settings.effectsVolume}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.effectsVolume}
                onChange={(event) => updateSettings({ effectsVolume: Number(event.currentTarget.value) })}
                onPointerUp={() => previewSound()}
                onKeyUp={() => previewSound()}
                aria-label="효과음 크기"
              />
            </label>
            <label className="settings-range">
              <span>
                <b>음악·설원 환경음</b>
                <output>{settings.ambienceVolume}%</output>
              </span>
              <small className="settings-range-note" id="settings-ambience-note">
                화롯가, 전투, 왕관 보스와 새벽에 맞춰 분위기가 전환됩니다.
              </small>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.ambienceVolume}
                onChange={(event) => updateSettings({ ambienceVolume: Number(event.currentTarget.value) })}
                aria-label="음악과 설원 환경음 크기"
                aria-describedby="settings-ambience-note"
              />
            </label>
          </section>

          <section className="settings-group" aria-labelledby="settings-accessibility-title">
            <header>
              <span aria-hidden="true">◉</span>
              <div>
                <p>ACCESSIBILITY</p>
                <h3 id="settings-accessibility-title">표시와 반응</h3>
              </div>
            </header>
            <button
              className="settings-toggle"
              type="button"
              data-on={settings.haptics ? 'true' : 'false'}
              onClick={toggleHaptics}
              aria-pressed={settings.haptics}
            >
              <span>
                <b>진동 피드백</b>
                <small>지원하는 기기에서 명령과 충돌을 진동으로 알립니다.</small>
              </span>
              <i aria-hidden="true">{settings.haptics ? '켬' : '끔'}</i>
            </button>
            <div className="settings-choice">
              <span>
                <b>화면 움직임</b>
                <small>시스템 설정을 따르거나 연출 움직임을 최소화합니다.</small>
              </span>
              <fieldset>
                <legend className="settings-visually-hidden">화면 움직임</legend>
                <button
                  type="button"
                  data-selected={settings.motion === 'system' ? 'true' : 'false'}
                  onClick={() => updateSettings({ motion: 'system' })}
                  aria-pressed={settings.motion === 'system'}
                >
                  시스템
                </button>
                <button
                  type="button"
                  data-selected={settings.motion === 'reduced' ? 'true' : 'false'}
                  onClick={() => updateSettings({ motion: 'reduced' })}
                  aria-pressed={settings.motion === 'reduced'}
                >
                  최소화
                </button>
              </fieldset>
            </div>
            <button
              className="settings-toggle"
              type="button"
              data-on={settings.largeText ? 'true' : 'false'}
              onClick={() => updateSettings({ largeText: !settings.largeText })}
              aria-pressed={settings.largeText}
            >
              <span>
                <b>큰 글자</b>
                <small>작은 설명과 전장 수치를 한 단계 키웁니다.</small>
              </span>
              <i aria-hidden="true">{settings.largeText ? '켬' : '끔'}</i>
            </button>
            <button
              className="settings-toggle"
              type="button"
              data-on={settings.highContrast ? 'true' : 'false'}
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              aria-pressed={settings.highContrast}
            >
              <span>
                <b>고대비</b>
                <small>본문, 경계선과 상태색의 구분을 더 선명하게 합니다.</small>
              </span>
              <i aria-hidden="true">{settings.highContrast ? '켬' : '끔'}</i>
            </button>
          </section>

          <section className="settings-group settings-session" aria-labelledby="settings-session-title">
            <header>
              <span aria-hidden="true">››</span>
              <div>
                <p>SESSION</p>
                <h3 id="settings-session-title">원정 템포와 빠른 조작</h3>
              </div>
            </header>
            <div className="settings-choice settings-pace">
              <span>
                <b>원정 연출 템포</b>
                <small>신속 모드는 선택과 결과를 보존하고 전투·성장·기록 연출만 압축합니다.</small>
              </span>
              <fieldset>
                <legend className="settings-visually-hidden">원정 연출 템포</legend>
                <button
                  type="button"
                  data-selected={settings.battlePace === 'cinematic' ? 'true' : 'false'}
                  onClick={() => updateSettings({ battlePace: 'cinematic' })}
                  aria-pressed={settings.battlePace === 'cinematic'}
                >
                  시네마틱
                </button>
                <button
                  type="button"
                  data-selected={settings.battlePace === 'swift' ? 'true' : 'false'}
                  onClick={() => updateSettings({ battlePace: 'swift' })}
                  aria-pressed={settings.battlePace === 'swift'}
                >
                  신속
                </button>
              </fieldset>
            </div>
            <section className="shortcut-grid" aria-labelledby="settings-shortcut-title">
              <h4 className="settings-visually-hidden" id="settings-shortcut-title">
                키보드 빠른 조작
              </h4>
              <span>
                <kbd>1</kbd>
                <kbd>2</kbd>
                <kbd>3</kbd>
                <small>집중 전선</small>
              </span>
              <span>
                <kbd>Q</kbd>
                <kbd>W</kbd>
                <kbd>E</kbd>
                <small>명령 순환</small>
              </span>
              <span>
                <kbd>R</kbd>
                <small>대기소</small>
              </span>
              <span>
                <kbd>A</kbd>
                <small>전술 한 단계 적용</small>
              </span>
              <span>
                <kbd>Z</kbd>
                <small>마지막 투자 되돌리기</small>
              </span>
              <span>
                <kbd>Space</kbd>
                <small>전투 개시</small>
              </span>
              <span>
                <kbd>M</kbd>
                <small>음소거</small>
              </span>
              <span>
                <kbd>O</kbd>
                <small>설정</small>
              </span>
              <span>
                <kbd>Esc</kbd>
                <kbd>P</kbd>
                <small>원정 메뉴</small>
              </span>
            </section>
          </section>

          <section className="settings-group settings-data" aria-labelledby="settings-data-title">
            <header>
              <span aria-hidden="true">▣</span>
              <div>
                <p>DATA SAFETY</p>
                <h3 id="settings-data-title">기록 보호와 백업</h3>
              </div>
            </header>
            <div className="storage-protection" data-state={storageProtection} aria-busy={storageRequestPending}>
              <span aria-hidden="true">
                {storageProtection === 'persistent'
                  ? '◆'
                  : storageProtection === 'unavailable'
                    ? '!'
                    : storageProtection === 'checking'
                      ? '·'
                      : '◇'}
              </span>
              <div>
                <small>DEVICE STORAGE</small>
                <strong>
                  {storageProtection === 'persistent'
                    ? '기록 보호 강화됨'
                    : storageProtection === 'unavailable'
                      ? '기기 저장소 사용 불가'
                      : storageProtection === 'checking'
                        ? storageRequestPending
                          ? '보호 승인 확인 중'
                          : '보호 상태 확인 중'
                        : '기본 기기 저장'}
                </strong>
                <p>
                  {storageProtection === 'persistent'
                    ? '브라우저 자동 정리 대상에서 제외되도록 승인됐습니다. 사용자가 직접 삭제하는 경우는 제외됩니다.'
                    : storageProtection === 'unavailable'
                      ? '현재 플레이는 가능하지만 앱을 닫으면 기록이 남지 않을 수 있습니다. 먼저 백업 파일을 보관하세요.'
                      : storageProtection === 'checking'
                        ? storageRequestPending
                          ? '브라우저에 자동 정리 제외를 요청했습니다. 승인 결과를 기다리고 있습니다.'
                          : '이 기기가 게임 기록 보호 요청을 지원하는지 확인하고 있습니다.'
                        : '현재 기록은 이 기기에 저장됩니다. 지원하는 브라우저에서는 자동 정리 제외를 요청할 수 있습니다.'}
                </p>
              </div>
              {storageProtection === 'standard' ? (
                <button type="button" onClick={() => void requestPersistentStorage()}>
                  보호 강화
                </button>
              ) : null}
            </div>
            <div className="backup-actions">
              <button
                type="button"
                onClick={exportGameBackup}
                disabled={restorePending || backupRestorePreview !== null}
              >
                <span aria-hidden="true">↓</span>
                <div>
                  <strong>백업 파일 저장</strong>
                  <small>원정·유산·설정을 한 파일로 보관</small>
                </div>
              </button>
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                disabled={storageProtection === 'unavailable' || restorePending || backupRestorePreview !== null}
                aria-busy={restorePending}
                aria-controls="backup-restore-preview"
                aria-expanded={backupRestorePreview !== null}
                data-backup-restore-trigger="true"
              >
                <span aria-hidden="true">↑</span>
                <div>
                  <strong>{restorePending ? '백업 검증 중' : '백업 파일 복원'}</strong>
                  <small>
                    {restorePending ? '기존 기록을 보호하며 파일 확인 중' : '현재 형식이 정확히 일치할 때만 교체'}
                  </small>
                </div>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void restoreGameBackup(event)}
                disabled={restorePending}
                hidden
              />
            </div>
            {backupRestorePreview ? (
              <section
                className="backup-restore-preview"
                id="backup-restore-preview"
                aria-labelledby="backup-restore-preview-title"
                aria-describedby="backup-restore-preview-warning"
              >
                <header>
                  <span aria-hidden="true">!</span>
                  <div>
                    <small>VERIFIED BACKUP · 적용 전</small>
                    <h4 id="backup-restore-preview-title">복원 전에 두 기록을 비교하세요</h4>
                    <p>
                      <b title={backupRestorePreview.fileName}>{backupRestorePreview.fileName}</b>의 현재 형식을
                      검증했습니다.
                    </p>
                  </div>
                </header>
                <div className="backup-restore-comparison">
                  <BackupRecordCard label="현재 기기 기록" summary={backupRestorePreview.current} incoming={false} />
                  <span className="backup-restore-arrow" aria-hidden="true">
                    →
                  </span>
                  <BackupRecordCard label="복원 후 기록" summary={backupRestorePreview.incoming} incoming />
                </div>
                <p className="backup-restore-warning" id="backup-restore-preview-warning">
                  확정하면 현재 원정·유산·업적·연대기·설정 전체가 오른쪽 기록으로 교체되고 앱을 다시 시작합니다.
                </p>
                <footer>
                  <button
                    type="button"
                    onClick={cancelGameBackupRestore}
                    disabled={restorePending}
                    data-backup-restore-cancel="true"
                    data-autofocus="true"
                  >
                    현재 기록 유지
                  </button>
                  <button type="button" onClick={exportGameBackup} disabled={restorePending}>
                    현재 기록 먼저 백업
                  </button>
                  <button
                    className="backup-restore-confirm"
                    type="button"
                    onClick={confirmGameBackupRestore}
                    disabled={restorePending || storageProtection === 'unavailable'}
                    aria-busy={restorePending}
                  >
                    {restorePending ? '기록 교체 중' : '백업으로 교체 후 다시 시작'}
                  </button>
                </footer>
              </section>
            ) : null}
            <p className="settings-data-note">
              백업에는 별도 버전이나 이전 형식 변환이 없습니다. 형식이 다르거나 손상된 파일은 복원하지 않으며, 검증된
              파일도 비교 후 확정하기 전에는 현재 기록을 바꾸지 않습니다.
            </p>
          </section>
        </div>

        <footer className="settings-footer">
          <button
            className="settings-reset"
            type="button"
            onClick={resetSettings}
            disabled={restorePending || backupRestorePreview !== null}
          >
            기본값 복원
          </button>
          <button
            className="settings-done"
            type="button"
            onClick={closeSettings}
            data-autofocus="true"
            disabled={restorePending || backupRestorePreview !== null}
          >
            <span>설정 완료</span>
            <i aria-hidden="true">›</i>
          </button>
        </footer>
      </section>
    </div>
  )
}
