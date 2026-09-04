'use client'

import {
  DISCLOSURE_LABELS,
  DISCLOSURES,
  type DisclosureState,
  type EmploymentExit,
  type MonitoringResponse,
} from '@/lib/experience'

type Props = {
  disclosures: DisclosureState
  employmentExit: EmploymentExit | null
  monitoringResponse: MonitoringResponse | null
  onRestart: () => void
}

const WORK_STATE: Record<EmploymentExit, string> = {
  continue: '대외 업무 없음',
  leave: '휴직 후 미복귀',
  resign: '없음',
}

const ALERT_STATE: Record<MonitoringResponse, string> = {
  continue: '계속 받는 중',
  stop: '끔 · 유포는 계속',
}

export default function EndingScreen({ disclosures, employmentExit, monitoringResponse, onRestart }: Props) {
  const chosen = DISCLOSURES.filter((key) => disclosures[key]).map((key) => DISCLOSURE_LABELS[key])

  const ledger: [string, string][] = [
    ['검색 자동완성', '그대로'],
    ['저장·복제본', '확인 불가'],
    ['신원 미상 참여자', '확인되지 않음'],
    ['판결', '피고인 2명 · 종결'],
    ['직장', WORK_STATE[employmentExit ?? 'resign']],
    ['유포 알림', ALERT_STATE[monitoringResponse ?? 'stop']],
    ['이름', '바꿨습니다'],
    ['아는 사람', '사건을 아는 사람만'],
  ]

  return (
    <section className="ending-screen">
      <div className="ending-body">
        <p className="ending-kicker">마지막 화면</p>
        <h1>지워진 것은 이름뿐입니다.</h1>
        <p className="ending-lead">
          당신이 공개해 둔 것은 {chosen.join(' · ')}였습니다. 그 다음은 당신이 정하지 않았습니다.
        </p>

        <dl className="ending-ledger">
          {ledger.map(([term, state]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{state}</dd>
            </div>
          ))}
        </dl>

        <p className="ending-close">되돌릴 수 있는 항목은 없습니다.</p>
      </div>

      <div className="ending-actions">
        <button className="primary-action" onClick={onRestart} type="button">
          다시 하기
        </button>
        <p className="ending-footnote">등장하는 인물·회사·게시물은 모두 허구입니다.</p>
      </div>
    </section>
  )
}
