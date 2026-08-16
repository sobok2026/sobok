import './deferred.css'

type InstallHelpDialogProps = {
  offlineReady: boolean
  onClose: () => void
}

export function InstallHelpDialog({ offlineReady, onClose }: InstallHelpDialogProps) {
  return (
    <div className="modal-backdrop guide-backdrop install-backdrop" role="presentation">
      <section
        className="guide-card install-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        data-focus-scope="install"
        tabIndex={-1}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="설치 안내 닫기">
          ×
        </button>
        <p className="eyebrow">INSTALL EMBERHOLD</p>
        <h2 id="install-title">이 기기에 마지막 불씨 남기기</h2>
        <p className="guide-lead">전체 화면과 오프라인 실행으로 원정을 앱처럼 이어갈 수 있습니다.</p>
        <div className="install-readiness" data-ready={offlineReady ? 'true' : 'false'}>
          <span aria-hidden="true">{offlineReady ? '◆' : '◇'}</span>
          <div>
            <small>OFFLINE SHELL</small>
            <strong>{offlineReady ? '오프라인 전투 준비 완료' : '오프라인 전투 준비 중'}</strong>
            <p>
              {offlineReady
                ? '현재 빌드의 전장과 키아트가 이 기기에 저장됐습니다.'
                : '첫 준비가 끝날 때까지 잠시 연결을 유지해 주세요.'}
            </p>
          </div>
        </div>
        <ol className="install-steps">
          <li>
            <span>01</span>
            <div>
              <strong>iPhone · iPad</strong>
              <p>Safari의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Chrome · Edge</strong>
              <p>주소창의 설치 아이콘 또는 브라우저 메뉴의 ‘앱 설치’를 선택하세요.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>원정 복귀</strong>
              <p>홈 화면의 Emberhold를 열면 마지막 체크포인트에서 그대로 이어집니다.</p>
            </div>
          </li>
        </ol>
        <button className="guide-start" type="button" onClick={onClose} data-autofocus="true">
          <span>설치 안내 확인</span>
          <i aria-hidden="true">›</i>
        </button>
      </section>
    </div>
  )
}

type GameGuideDialogProps = {
  trainingRecovery: 'resume' | 'restart' | 'queue'
  onClose: () => void
  onRecoverTraining: () => void
}

export function GameGuideDialog({ trainingRecovery, onClose, onRecoverTraining }: GameGuideDialogProps) {
  const trainingCopy =
    trainingRecovery === 'resume'
      ? {
          label: '현장 훈련으로 돌아가기',
          detail: '진행 중인 훈련 단계와 현재 대열을 그대로 이어갑니다.',
        }
      : trainingRecovery === 'restart'
        ? {
            label: '현장 훈련 다시 시작',
            detail: '현재 첫날의 대열을 읽고 완료하지 않은 단계부터 다시 안내합니다.',
          }
        : {
            label: '다음 원정에 훈련 예약',
            detail: '현재 원정은 유지하고, 다음 새 원정의 첫 캠프에서 5단계 훈련을 다시 엽니다.',
          }

  return (
    <div className="modal-backdrop guide-backdrop" role="presentation">
      <section
        className="guide-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        data-focus-scope="guide"
        tabIndex={-1}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="게임 방법 닫기">
          ×
        </button>
        <p className="eyebrow">COMMANDER REFERENCE</p>
        <h2 id="guide-title">원정대장 참고서</h2>
        <p className="guide-lead">처음에는 현장 훈련이 직접 안내합니다. 여기서는 세부 규칙을 다시 확인할 수 있어요.</p>
        <ol className="guide-steps">
          <li>
            <span className="step-number">01</span>
            <div className="guide-visual merge-visual" aria-hidden="true">
              <i>
                ◆<small>I</small>
              </i>
              <b>+</b>
              <i>
                ◆<small>I</small>
              </i>
              <b>→</b>
              <i className="upgraded">
                ◆<small>II</small>
              </i>
            </div>
            <div>
              <strong>같은 병과와 등급을 합치기</strong>
              <p>
                한 단계 강해지고, III 등급에서는 두 베테랑 진급 중 하나를 선택합니다. 드래그하거나 차례로 눌러도 돼요.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">02</span>
            <div className="guide-visual affinity-visual" aria-hidden="true">
              <i className="kind-warden">◆</i>
              <b>›</b>
              <i className="kind-ranger">⌁</i>
              <b>›</b>
              <i className="kind-raider">✦</i>
            </div>
            <div>
              <strong>상성에 맞춰 배치하기</strong>
              <p>방패는 활에, 활은 도끼에, 도끼는 방패에 강합니다. 세 전선 중 둘을 지키세요.</p>
            </div>
          </li>
          <li>
            <span className="step-number">03</span>
            <div className="guide-visual order-visual" aria-hidden="true">
              <i>▰</i>
              <b>›</b>
              <i className="upgraded">⬡</i>
            </div>
            <div>
              <strong>적 의도에 맞는 명령 내리기</strong>
              <p>
                방벽은 공성, 돌격은 제압, 지원은 우회를 파훼합니다. 참모 모의는 현재 계획보다 나은 변경 한 가지만
                제안합니다.
              </p>
            </div>
          </li>
          <li>
            <span className="step-number">04</span>
            <div className="guide-visual focus-visual" aria-hidden="true">
              <i>01</i>
              <i className="upgraded">02</i>
              <i>03</i>
            </div>
            <div>
              <strong>무너질 전선에 불을 집중하기</strong>
              <p>매 전투마다 한 전선에 화로의 힘을 보냅니다. 붕괴 위험을 뒤집을 마지막 명령이에요.</p>
            </div>
          </li>
          <li>
            <span className="step-number">05</span>
            <div className="guide-visual hearth-visual" aria-hidden="true">
              <span className="big-flame" />
              <b>84%</b>
            </div>
            <div>
              <strong>화로의 온기와 유물 지키기</strong>
              <p>보급품을 장작과 병사에 나누세요. 짝을 이루는 유물 두 개를 각인하면 고유 공명이 열립니다.</p>
            </div>
          </li>
          <li>
            <span className="step-number">06</span>
            <div className="guide-visual trial-visual" aria-hidden="true">
              <i>♜</i>
              <b>·</b>
              <i className="upgraded">✕</i>
              <b>·</b>
              <i>⚑</i>
            </div>
            <div>
              <strong>위험도·정예 교리·균열 읽기</strong>
              <p>
                위험도마다 전투와 보급 규칙이 다릅니다. 전장 경보로 고유 규칙과 정예 파훼법을 읽고, 균열 효과와 세
                과업까지 함께 노리세요.
              </p>
            </div>
          </li>
        </ol>
        <section className="guide-training-recovery" aria-label="현장 훈련 다시 보기">
          <span aria-hidden="true">⌘</span>
          <div>
            <small>FIELD TRAINING RECOVERY</small>
            <strong>{trainingCopy.label}</strong>
            <p>{trainingCopy.detail}</p>
          </div>
          <button type="button" onClick={onRecoverTraining}>
            선택 <i aria-hidden="true">›</i>
          </button>
        </section>
        <button className="guide-start" type="button" onClick={onClose} data-autofocus="true">
          <span>전장으로 돌아가기</span>
          <i aria-hidden="true">›</i>
        </button>
      </section>
    </div>
  )
}
