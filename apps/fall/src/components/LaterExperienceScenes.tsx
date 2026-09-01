'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { AppHeader, Bubble, Notification, PhoneSurface, type Stage } from '@/components/ExperienceScenes'
import type {
  Coordination,
  DeletionResponse,
  EmploymentExit,
  EvidenceMode,
  ExposureRoute,
  LegalView,
  MonitoringResponse,
  NightResponse,
  Profile,
  PublicResponse,
  RecruitmentResponse,
  RelationshipResponse,
  WorkResponse,
} from '@/lib/experience'

const WORKPLACE_CALL_LINES = [
  '관련 게시물이 사내 메일로 다수 접수됐습니다.',
  '회사도 피해를 보고 있어서 사실관계 확인이 필요합니다.',
  '오늘 예정된 외부 미팅은 다른 직원이 대신 진행하겠습니다.',
  '당분간 재택근무로 전환하고, 관련 문의는 인사팀을 통해서만 전달해 주세요.',
] as const

const EMPLOYMENT_CALENDAR = [
  ['월', '인사팀 면담'],
  ['화', '피해 게시물 URL 정리'],
  ['수', '수사기관 자료 제출'],
  ['목', '이사할 방 확인'],
  ['금', '삭제지원 진행 결과'],
] as const

const NETWORK_NODES = [
  ['제공자 A', 12, 16],
  ['제작자 B', 69, 12],
  ['미상 계정', 80, 31],
  ['최초 게시물', 7, 43],
  ['복제 계정', 78, 55],
  ['검색 결과', 11, 69],
  ['회사 메일', 70, 77],
  ['가족·친구', 34, 83],
  ['집', 27, 20],
  ['채용 담당자', 57, 91],
  ['수사기록', 52, 9],
  ['새 유포자', 87, 78],
] as const

type Props = {
  stage: Stage
  profile: Profile
  primaryRoute: ExposureRoute
  openedRoute: ExposureRoute | null
  workResponse: WorkResponse | null
  relationshipResponse: RelationshipResponse | null
  nightResponse: NightResponse | null
  evidenceMode: EvidenceMode | null
  deletionResponse: DeletionResponse | null
  publicResponse: PublicResponse | null
  employmentExit: EmploymentExit | null
  coordination: Coordination | null
  recruitmentResponse: RecruitmentResponse | null
  legalView: LegalView | null
  monitoringResponse: MonitoringResponse | null
  onWorkResponse: (response: WorkResponse) => void
  onRelationshipResponse: (response: RelationshipResponse) => void
  onNightResponse: (response: NightResponse) => void
  onEvidenceMode: (mode: EvidenceMode) => void
  onDeletionResponse: (response: DeletionResponse) => void
  onPublicResponse: (response: PublicResponse) => void
  onEmploymentExit: (exit: EmploymentExit) => void
  onCoordination: (coordination: Coordination) => void
  onRecruitmentResponse: (response: RecruitmentResponse) => void
  onLegalView: (view: LegalView) => void
  onMonitoringResponse: (response: MonitoringResponse) => void
  onNewRelationshipReply: () => void
  onEraseName: () => void
}

export default function LaterExperienceScenes(props: Props) {
  if (props.stage === 'ending') {
    return <EndingScene />
  }

  return (
    <div className="phone-frame late-phone-frame" data-scene={props.stage}>
      <div className="scene-enter" key={props.stage}>
        {renderLateScene(props)}
      </div>
    </div>
  )
}

function renderLateScene(props: Props): ReactNode {
  const { stage, profile } = props

  switch (stage) {
    case 'workplaceCall':
      return <WorkplaceCallScene onRespond={props.onWorkResponse} profile={profile} />
    case 'workplaceResult':
      return <WorkplaceResultScene profile={profile} response={props.workResponse ?? 'silence'} />
    case 'relationships':
      return (
        <RelationshipsScene
          onRespond={props.onRelationshipResponse}
          openedRoute={props.openedRoute}
          profile={profile}
        />
      )
    case 'relationshipResult':
      return <RelationshipResultScene profile={profile} response={props.relationshipResponse ?? 'silent'} />
    case 'locationFear':
      return (
        <LocationFearScene
          locationWasPrimary={props.primaryRoute === 'location'}
          onRespond={props.onNightResponse}
          profile={profile}
        />
      )
    case 'locationResult':
      return <LocationResultScene profile={profile} response={props.nightResponse ?? 'rejectCall'} />
    case 'supportIntake':
      return <SupportIntakeScene onChoose={props.onEvidenceMode} profile={profile} />
    case 'supportResult':
      return <SupportResultScene mode={props.evidenceMode ?? 'current'} profile={profile} />
    case 'deletedNotice':
      return <DeletedNoticeScene mode={props.evidenceMode ?? 'current'} onChoose={props.onDeletionResponse} />
    case 'deletionResult':
      return <DeletionResultScene profile={profile} response={props.deletionResponse ?? 'later'} />
    case 'publicReaction':
      return <PublicReactionScene onChoose={props.onPublicResponse} profile={profile} />
    case 'publicReactionResult':
      return <PublicReactionResultScene profile={profile} response={props.publicResponse ?? 'silence'} />
    case 'employment':
      return (
        <EmploymentScene
          onChoose={props.onEmploymentExit}
          profile={profile}
          relationshipResponse={props.relationshipResponse ?? 'silent'}
          workResponse={props.workResponse ?? 'silence'}
        />
      )
    case 'employmentResult':
      return <EmploymentResultScene exit={props.employmentExit ?? 'resign'} profile={profile} />
    case 'coordination':
      return <CoordinationScene onChoose={props.onCoordination} profile={profile} />
    case 'jobSearch':
      return (
        <JobSearchScene
          employmentExit={props.employmentExit ?? 'resign'}
          onChoose={props.onRecruitmentResponse}
          profile={profile}
        />
      )
    case 'jobRejection':
      return (
        <JobRejectionScene
          employmentExit={props.employmentExit ?? 'resign'}
          profile={profile}
          response={props.recruitmentResponse ?? 'withdraw'}
        />
      )
    case 'investigation':
      return (
        <InvestigationScene
          coordination={props.coordination ?? 'observe'}
          onChoose={props.onLegalView}
          profile={profile}
        />
      )
    case 'investigationResult':
      return <InvestigationResultScene profile={profile} view={props.legalView ?? 'defer'} />
    case 'judgment':
      return <JudgmentScene onChoose={props.onMonitoringResponse} profile={profile} />
    case 'judgmentResult':
      return <JudgmentResultScene profile={profile} response={props.monitoringResponse ?? 'stop'} />
    case 'newRelationship':
      return <NewRelationshipScene onReply={props.onNewRelationshipReply} profile={profile} />
    case 'networkFinal':
      return (
        <NetworkFinalScene
          monitoringResponse={props.monitoringResponse ?? 'stop'}
          onErase={props.onEraseName}
          profile={profile}
        />
      )
    case 'nameErased':
      return <NameErasedScene profile={profile} />
    default:
      return null
  }
}

function WorkplaceCallScene({ profile, onRespond }: { profile: Profile; onRespond: (response: WorkResponse) => void }) {
  const [visibleLineCount, setVisibleLineCount] = useState(1)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleLineCount((count) => {
        if (count >= WORKPLACE_CALL_LINES.length) {
          window.clearInterval(interval)
          return count
        }

        return count + 1
      })
    }, 1250)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <PhoneSurface className="hr-call-surface" time="12:24">
      <div className="active-call-header">
        <span className="call-mini-avatar">人事</span>
        <span>
          <small>통화 중 · 00:{String(visibleLineCount * 3).padStart(2, '0')}</small>
          <strong>{profile.company} 인사팀</strong>
        </span>
      </div>
      <div className="call-transcript">
        {WORKPLACE_CALL_LINES.slice(0, visibleLineCount).map((line, index) => (
          <p key={line} style={{ '--line-index': index } as React.CSSProperties}>
            {line}
          </p>
        ))}
      </div>
      {visibleLineCount === WORKPLACE_CALL_LINES.length ? (
        <ChoicePanel className="call-response-options">
          <button onClick={() => onRespond('explain')} type="button">
            합성된 가짜라고 설명한다
          </button>
          <button onClick={() => onRespond('requestHelp')} type="button">
            피해 사실을 알리고 보호를 요청한다
          </button>
          <button onClick={() => onRespond('silence')} type="button">
            아무 말도 하지 않는다
          </button>
        </ChoicePanel>
      ) : null}
    </PhoneSurface>
  )
}

function WorkplaceResultScene({ profile, response }: { profile: Profile; response: WorkResponse }) {
  const reply = {
    explain: '네, 주장하시는 내용은 알겠습니다. 확인이 끝날 때까지 기다려 주세요.',
    requestHelp: '회사가 개인 사건에 직접 개입하기는 어렵습니다. 우선 외부 노출이 적은 업무로 조정하겠습니다.',
    silence: '답변이 어려우신 것으로 기록하겠습니다. 결정 사항은 메일로 보내드리겠습니다.',
  }[response]

  return (
    <PhoneSurface className="calendar-change-surface" time="12:31">
      <AppHeader eyebrow={`${profile.company} 업무 일정`} title="오늘" />
      <div className="hr-reply-card">
        <small>인사팀 · 통화 기록</small>
        <p>{reply}</p>
      </div>
      <div className="day-schedule">
        <time>14:00</time>
        <div>
          <small>외부 미팅</small>
          <strong>신제품 캠페인 제안</strong>
          <p>
            <del>{profile.name}</del>
            <span>박 팀장</span>
          </p>
        </div>
      </div>
      <div className="role-change-line">참석자가 변경되었습니다.</div>
    </PhoneSurface>
  )
}

function RelationshipsScene({
  profile,
  openedRoute,
  onRespond,
}: {
  profile: Profile
  openedRoute: ExposureRoute | null
  onRespond: (response: RelationshipResponse) => void
}) {
  const relationshipFirst = openedRoute === 'relationship'

  return (
    <PhoneSurface className="relationship-pressure-surface" time="18:46">
      <div className="lock-heading compact relationship-time">
        <span>월요일</span>
        <strong>18:46</strong>
      </div>
      <div className="relationship-alerts" data-relationship-first={relationshipFirst}>
        <Notification app="전화" title={profile.family} urgent>
          회사에서까지 연락 왔어. 이게 무슨 일이니. 당분간 밖에 나가지 마.
        </Notification>
        <Notification app="메시지" title={profile.friend}>
          난 네 말 믿어. 나한테 온 계정이랑 링크는 내가 따로 정리할게.
        </Notification>
        <Notification app="단체방" title="대학 친구 6명">
          지금 이 얘기 여기서 하는 건 좀 아닌 것 같아. 당분간 모임은 미루자.
        </Notification>
      </div>
      <div className="friend-followup">
        {profile.friend} · 그런데 나한테도 계속 네가 어디 있는지 물어봐. 내가 뭘 더 해야 해?
      </div>
      <ChoicePanel className="relationship-choices">
        <button onClick={() => onRespond('family')} type="button">
          {profile.family} 전화를 받는다
        </button>
        <button onClick={() => onRespond('friend')} type="button">
          {profile.friend}에게 답한다
        </button>
        <button onClick={() => onRespond('silent')} type="button">
          휴대전화를 무음으로 바꾼다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function RelationshipResultScene({ profile, response }: { profile: Profile; response: RelationshipResponse }) {
  return (
    <PhoneSurface className="relationship-result-surface" time="18:51">
      {response === 'family' ? (
        <div className="result-conversation family-conversation">
          <span className="large-contact-avatar">{profile.family.slice(0, 1)}</span>
          <small>{profile.family} · 통화 중</small>
          <p>번호를 바꾸고 회사도 쉬고 당분간 내가 정한 곳에 있자.</p>
        </div>
      ) : null}
      {response === 'friend' ? (
        <div className="result-conversation evidence-table-card">
          <small>{profile.friend} · 공유한 표</small>
          <h2>받은 링크 정리</h2>
          <div>
            <span>URL</span>
            <span>계정</span>
            <span>도착 시간</span>
          </div>
          <div>
            <span>clip…</span>
            <span>0471</span>
            <span>11:18</span>
          </div>
          <div>
            <span>arch…</span>
            <span>0017</span>
            <span>12:02</span>
          </div>
        </div>
      ) : null}
      {response === 'silent' ? (
        <div className="silent-phone-result">
          <span>무음 모드</span>
          <strong>18</strong>
          <p>부재중 전화 7통 · 읽지 않은 메시지 11개</p>
        </div>
      ) : null}
      <div className="relationship-loss-line">안부 대신 사건 확인만 남았습니다.</div>
    </PhoneSurface>
  )
}

function LocationFearScene({
  profile,
  locationWasPrimary,
  onRespond,
}: {
  profile: Profile
  locationWasPrimary: boolean
  onRespond: (response: NightResponse) => void
}) {
  return (
    <PhoneSurface className="location-fear-surface" time="23:17">
      <div className="intercom-panel">
        <span className="intercom-icon">▦</span>
        <span>
          <small>공동현관 호출</small>
          <strong>응답 없음 · 4회</strong>
        </span>
      </div>
      <div className="night-map-card">
        <span className="night-map-grid" aria-hidden="true" />
        <i />
        <strong>{profile.neighborhood}</strong>
        <small>{profile.station} → 주거 블록</small>
      </div>
      <div className="night-threats" data-location-first={locationWasPrimary}>
        <p>map_82 · 예전 게시물대로면 {profile.station}에서 내리겠네.</p>
        <p>user_0913 · 집 불은 켜져 있는데 왜 전화를 안 받아?</p>
        <p>user_2048 · 이사해도 사진 올리면 다시 찾으면 돼.</p>
      </div>
      <ChoicePanel className="night-choices">
        <button onClick={() => onRespond('rejectCall')} type="button">
          현관 호출을 거절한다
        </button>
        <button onClick={() => onRespond('lightsOff')} type="button">
          집 조명 앱을 끈다
        </button>
        <button onClick={() => onRespond('shareLocation')} type="button">
          현재 위치를 보낸다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function LocationResultScene({ profile, response }: { profile: Profile; response: NightResponse }) {
  const actionLine = {
    rejectCall: '공동현관 호출을 거절했습니다.',
    lightsOff: '거실 · 침실 · 현관 조명을 껐습니다.',
    shareLocation: `${profile.friend}에게 현재 위치를 보냈습니다.`,
  }[response]

  return (
    <PhoneSurface className="location-result-surface" time="23:28">
      <div className="night-action-line">{actionLine}</div>
      <div className="address-still-visible">
        <small>공개 게시물에서 추정된 생활권</small>
        <strong>{profile.neighborhood}</strong>
        <span>{profile.station} · 반경 620m</span>
      </div>
      <div className="delivery-alert">
        <span>배송 완료</span>
        <strong>주문하지 않은 상품</strong>
        <small>현관 앞에 놓았습니다.</small>
      </div>
      <p className="same-place-line">서로 다른 세 계정이 같은 장소를 가리키고 있습니다.</p>
      <div className="date-cut">
        <span>3일 뒤</span>
      </div>
    </PhoneSurface>
  )
}

function SupportIntakeScene({ profile, onChoose }: { profile: Profile; onChoose: (mode: EvidenceMode) => void }) {
  return (
    <PhoneSurface className="support-intake-surface" time="10:06">
      <header className="fictional-agency-header">
        <span>D–CARE</span>
        <small>피해 상담 · 삭제지원 접수</small>
      </header>
      <div className="counselor-intro">
        <span>상담원</span>
        <p>지금 확인된 피해부터 함께 정리하겠습니다.</p>
        <p>삭제와 모니터링을 위해 확인 가능한 자료가 필요합니다.</p>
      </div>
      <div className="evidence-fields">
        <EvidenceField label="게시물 URL" value="https://clip-room…" />
        <EvidenceField label="피해 화면 자료" value="화면 캡처 4개" />
        <EvidenceField label="검색 키워드" value={`${profile.name} · ${profile.company}`} />
        <EvidenceField label="의심되는 인물 또는 관계" value="입력하지 못함" />
      </div>
      <ChoicePanel className="support-choices">
        <button onClick={() => onChoose('current')} type="button">
          지금 확인한 주소만 제출한다
        </button>
        <button onClick={() => onChoose('search')} type="button">
          더 찾아서 목록을 만든다
        </button>
        <button onClick={() => onChoose('counsel')} type="button">
          상담원에게 먼저 설명한다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function SupportResultScene({ profile, mode }: { profile: Profile; mode: EvidenceMode }) {
  return (
    <PhoneSurface className="support-result-surface" time="10:19">
      <header className="fictional-agency-header">
        <span>D–CARE</span>
        <small>접수 진행</small>
      </header>
      {mode === 'current' ? (
        <div className="evidence-mode-result">
          <strong>4건이 접수되었습니다.</strong>
          <p>확인하지 못한 게시물 알림 7개가 남아 있습니다.</p>
        </div>
      ) : null}
      {mode === 'search' ? (
        <div className="evidence-mode-result evidence-stack">
          <small>증거 04</small>
          <small>증거 05</small>
          <small>증거 06</small>
          <p>URL을 추가할 때마다 게시물을 다시 열었습니다.</p>
        </div>
      ) : null}
      {mode === 'counsel' ? (
        <div className="evidence-mode-result">
          <strong>상담원</strong>
          <p>한 번에 전부 설명하지 않으셔도 됩니다. 지금 확인할 수 있는 것부터 진행하겠습니다.</p>
        </div>
      ) : null}
      <div className="intake-confirmation">
        <strong>상담이 접수되었습니다.</strong>
        <p>삭제지원과 유포 모니터링 절차를 안내드리겠습니다.</p>
      </div>
      <div className="suspect-question">
        <small>경찰 신고 자료</small>
        <h2>의심되는 사람이 있습니까?</h2>
        <div className="contact-cloud">
          <span>대학 동문</span>
          <span>전 직장 동료</span>
          <span>현재 동료</span>
          <span>{profile.friend}</span>
        </div>
        <strong>알 수 없음</strong>
      </div>
      <div className="date-sweep" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>12일 뒤</span>
      </div>
    </PhoneSurface>
  )
}

function DeletedNoticeScene({
  mode,
  onChoose,
}: {
  mode: EvidenceMode
  onChoose: (response: DeletionResponse) => void
}) {
  const [phase, setPhase] = useState<'summary' | 'silence' | 'ready' | 'revealed'>('summary')
  const counts = {
    current: { deleted: 12, pending: 6, newCount: 9 },
    search: { deleted: 15, pending: 7, newCount: 11 },
    counsel: { deleted: 10, pending: 8, newCount: 8 },
  }[mode]

  useEffect(() => {
    const summaryTimeout = window.setTimeout(() => setPhase('silence'), 1800)
    const readyTimeout = window.setTimeout(() => setPhase('ready'), 8000)

    return () => {
      window.clearTimeout(summaryTimeout)
      window.clearTimeout(readyTimeout)
    }
  }, [])

  if (phase === 'summary') {
    return (
      <PhoneSurface className="deleted-summary-surface" time="09:12">
        <div className="deleted-check">✓</div>
        <h2>신고한 게시물이 삭제되었습니다.</h2>
        <p>
          삭제 확인 {counts.deleted}건 · 처리 중 {counts.pending}건 · 신규 확인 {counts.newCount}건
        </p>
      </PhoneSurface>
    )
  }

  return (
    <PhoneSurface className="deleted-silence-surface" time="09:12">
      {phase === 'ready' ? (
        <button className="blank-screen-tap" onClick={() => setPhase('revealed')} type="button">
          화면을 한 번 누르세요
        </button>
      ) : null}
      {phase === 'revealed' ? (
        <div className="redistribution-alert">
          <span className="red-alert-dot" />
          <small>유포 모니터링 · 지금</small>
          <h2>새 복제 게시물이 발견되었습니다.</h2>
          <div className="repost-copy">
            <p>지워졌길래 다시 올림.</p>
            <p>원래 링크 막혀서 여기 백업.</p>
          </div>
          <div className="redistribution-actions">
            <button onClick={() => onChoose('add')} type="button">
              새 주소 추가
            </button>
            <button onClick={() => onChoose('later')} type="button">
              나중에 확인
            </button>
          </div>
        </div>
      ) : null}
    </PhoneSurface>
  )
}

function DeletionResultScene({ profile, response }: { profile: Profile; response: DeletionResponse }) {
  return (
    <PhoneSurface className="deletion-result-surface" time="09:18">
      <div className="deletion-count-change">
        {response === 'add' ? (
          <>
            <small>새 주소가 추가되었습니다.</small>
            <strong>처리 중 7 · 신규 확인 10</strong>
          </>
        ) : (
          <>
            <small>나중에 확인하도록 남겨 두었습니다.</small>
            <strong>신규 발견 알림 1</strong>
          </>
        )}
      </div>
      <div className="stranger-message">
        <div className="stranger-avatar">?</div>
        <span>
          <small>메시지 요청 · 처음 보는 사람</small>
          <strong>피해자 1</strong>
        </span>
        <p>처음 연락드립니다. {profile.name}님과 같은 계정에서 합성물 피해를 입은 대학 동문입니다.</p>
        <p>게시물 제목과 올린 계정이 같아서 연락드렸어요.</p>
      </div>
      <div className="branching-post" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </PhoneSurface>
  )
}

function PublicReactionScene({
  profile,
  onChoose,
}: {
  profile: Profile
  onChoose: (response: PublicResponse) => void
}) {
  return (
    <PhoneSurface className="public-reaction-surface" time="16:42">
      <AppHeader eyebrow="실시간 검색" title={`${profile.name} 합성 논란`} />
      <div className="reaction-feed">
        <article className="defense-post">
          <small>help_truth · 2분</small>
          <strong>이건 합성입니다. 비교해 보면 바로 알 수 있어요.</strong>
          <div className="comparison-attachment">
            <span />
            <span />
            <b>@{profile.account} 원본 / 피해 파일 비교</b>
          </div>
        </article>
        <article className="spectator-post">
          <small>issue_summary · 4분</small>
          <strong>합성 논란 정리. 회사랑 실명까지 다 나옴.</strong>
          <p>가짜라면서 왜 회사를 쉬지?</p>
          <p>본인이 직접 해명하면 되잖아.</p>
        </article>
      </div>
      <ChoicePanel className="public-reaction-choices">
        <button onClick={() => onChoose('removePhoto')} type="button">
          사진을 내려 달라고 요청한다
        </button>
        <button onClick={() => onChoose('explain')} type="button">
          사실관계를 설명하는 글을 쓴다
        </button>
        <button onClick={() => onChoose('silence')} type="button">
          아무것도 올리지 않는다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function PublicReactionResultScene({ profile, response }: { profile: Profile; response: PublicResponse }) {
  const outcome = {
    removePhoto: '피해자를 도우려던 건데 왜 저한테 뭐라고 하세요?',
    explain: `${profile.name} 본인 입장 · “합성된…”`,
    silence: '당사자는 아직 아무 입장도 없음.',
  }[response]

  return (
    <PhoneSurface className="reaction-result-surface" time="17:03">
      <div className="quoted-outcome">
        <small>{response === 'explain' ? '새로 만들어진 게시물 제목' : '새 댓글'}</small>
        <strong>{outcome}</strong>
      </div>
      <div className="fixed-search-suggestions">
        <small>추천 검색어</small>
        <span>{profile.name} 영상</span>
        <span>{profile.name} 회사</span>
        <span>{profile.name} 입장문</span>
      </div>
      <div className="calendar-morph">
        <i>검색</i>
        <b>→</b>
        <i>일정</i>
        <strong>3개월 뒤</strong>
      </div>
    </PhoneSurface>
  )
}

function EmploymentScene({
  profile,
  workResponse,
  relationshipResponse,
  onChoose,
}: {
  profile: Profile
  workResponse: WorkResponse
  relationshipResponse: RelationshipResponse
  onChoose: (exit: EmploymentExit) => void
}) {
  const companyMessage = {
    explain: '합성물 피해라는 자료는 확인했습니다. 다만 외부 문의가 계속되어 기존 거래처 업무 복귀는 어렵습니다.',
    requestHelp: '보호 조치를 위해 재택근무와 내부 지원 업무 배치를 한 달 더 연장하겠습니다.',
    silence: '관련 외부 업무는 모두 재배정했습니다. 향후 역할은 인사 면담 후 안내하겠습니다.',
  }[workResponse]
  const managerLine = {
    family: `${profile.family} · 다음 상담 일정 내가 확인했어. 위치 공유가 꺼졌어.`,
    friend: `${profile.friend} · 다음 조사 전에 URL 표부터 같이 확인하자.`,
    silent: `${profile.friend} · 새 링크 세 개 왔어. ${profile.family} · 밖에 나간 거면 먼저 말해 줘.`,
  }[relationshipResponse]

  return (
    <PhoneSurface className="employment-surface" time="08:34">
      <header className="time-jump-header">
        <span>사건 발생</span>
        <strong>3개월 뒤</strong>
      </header>
      <div className="week-calendar">
        {EMPLOYMENT_CALENDAR.map(([day, item]) => (
          <div key={day}>
            <span>{day}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      <div className="managed-relationship-line">{managerLine}</div>
      <div className="company-separation-message">
        <small>{profile.company} 인사팀</small>
        <p>{companyMessage}</p>
      </div>
      <ChoicePanel className="employment-choices">
        <button onClick={() => onChoose('continue')} type="button">
          계속 출근하겠다고 한다
        </button>
        <button onClick={() => onChoose('leave')} type="button">
          휴직을 신청한다
        </button>
        <button onClick={() => onChoose('resign')} type="button">
          퇴사한다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function EmploymentResultScene({ profile, exit }: { profile: Profile; exit: EmploymentExit }) {
  const result = {
    continue: {
      title: '출입 가능 · 대외 업무 제외',
      body: '좌석과 업무가 외부 접촉이 없는 자리로 바뀌었습니다. 동료들에게 관련 이야기를 하지 말라는 공지가 전달되었습니다.',
    },
    leave: {
      title: '업무 계정 비활성화',
      body: '휴직이 승인되었습니다. 동료의 안부 대신 인사팀의 복귀 확인 메일만 남았습니다.',
    },
    resign: {
      title: `${profile.company} 퇴사 처리`,
      body: `회사 계정에서 이름은 사라졌지만 검색 결과 제목에는 ${profile.company}이 계속 남아 있습니다.`,
    },
  }[exit]

  return (
    <PhoneSurface className="employment-result-surface" time="17:40">
      <div className="empty-desk" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="employment-outcome">
        <small>역할 변경</small>
        <h2>{result.title}</h2>
        <p>{result.body}</p>
      </div>
      <div className="time-jump-footer">사건 발생 8개월 뒤</div>
    </PhoneSurface>
  )
}

function CoordinationScene({ profile, onChoose }: { profile: Profile; onChoose: (value: Coordination) => void }) {
  return (
    <PhoneSurface className="coordination-surface" time="21:11">
      <AppHeader eyebrow="비공개 대화방 · 6명" title="같은 계정 피해 자료" />
      <div className="anonymous-victims">
        {['가', '나', '다', '라', '마', profile.name.slice(0, 1)].map((name, index) => (
          <span key={`${name}-${index}`}>{name}</span>
        ))}
      </div>
      <div className="victim-chat-thread">
        <Bubble side="incoming">
          <strong>피해자 2</strong>
          <br />제 사건은 다른 경찰서에 있어요.
        </Bubble>
        <Bubble side="incoming">
          <strong>피해자 4</strong>
          <br />
          저도 가해자를 특정하기 어렵다는 안내를 받았습니다.
        </Bubble>
        <Bubble side="incoming">
          <strong>피해자 1</strong>
          <br />
          계정 이름과 게시물 제목이 같아요. 같은 방에서 나온 것 같습니다.
        </Bubble>
        <div className="case-notice">현재 제출된 자료만으로는 계정 사용자를 특정하기 어렵습니다.</div>
      </div>
      <ChoicePanel className="coordination-choices">
        <button onClick={() => onChoose('share')} type="button">
          내가 확보한 URL 목록을 공유한다
        </button>
        <button onClick={() => onChoose('compare')} type="button">
          발견 시점과 진술 내용을 대조한다
        </button>
        <button onClick={() => onChoose('observe')} type="button">
          대화를 읽기만 한다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function JobSearchScene({
  profile,
  employmentExit,
  onChoose,
}: {
  profile: Profile
  employmentExit: EmploymentExit
  onChoose: (response: RecruitmentResponse) => void
}) {
  const [recruiterVisible, setRecruiterVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setRecruiterVisible(true), 3000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <PhoneSurface className="job-search-surface" time="14:02">
      <header className="job-app-header">
        <span>WORK NEXT</span>
        <small>지원 현황</small>
      </header>
      <div className="career-gap-card">
        <small>이전 경력 · {profile.company}</small>
        <strong>{employmentHistoryLine(employmentExit)}</strong>
      </div>
      <div className="interview-success">
        <span>서류 합격</span>
        <h2>2차 면접 대상자로 선정되었습니다.</h2>
      </div>
      {recruiterVisible ? (
        <div className="recruiter-question">
          <small>채용 담당자 · 지금</small>
          <p>공개 검색 결과에서 지원자님과 관련된 게시물을 확인했습니다.</p>
          <p>사실관계를 확인할 수 있는 자료가 있을까요?</p>
          <ChoicePanel className="recruitment-choices">
            <button onClick={() => onChoose('explain')} type="button">
              합성물 피해라고 다시 설명한다
            </button>
            <button onClick={() => onChoose('documents')} type="button">
              수사·삭제지원 자료를 보낸다
            </button>
            <button onClick={() => onChoose('withdraw')} type="button">
              지원 자체를 철회한다
            </button>
          </ChoicePanel>
        </div>
      ) : null}
    </PhoneSurface>
  )
}

function JobRejectionScene({
  profile,
  response,
  employmentExit,
}: {
  profile: Profile
  response: RecruitmentResponse
  employmentExit: EmploymentExit
}) {
  const reply = {
    explain: '내부 검토 후 연락드리겠습니다.',
    documents: '민감한 사안으로 당사에서 판단하기 어렵습니다.',
    withdraw: '지원이 취소되었습니다.',
  }[response]

  return (
    <PhoneSurface className="job-rejection-surface" time="14:18">
      <div className="recruiter-final">
        <small>채용 담당자</small>
        <p>{reply}</p>
        {response !== 'withdraw' ? <p>{employmentFollowupLine(employmentExit)}</p> : null}
      </div>
      <div className="application-closed">
        <small>지원 상태</small>
        <strong>채용 절차가 종료되었습니다.</strong>
      </div>
      <div className="changed-number-message">
        <small>알 수 없는 발신자 · 새 번호</small>
        <p>번호 바꿨네. {profile.phoneSuffix} 맞지?</p>
      </div>
      <div className="time-jump-footer">사건 발생 1년 10개월 뒤</div>
    </PhoneSurface>
  )
}

function InvestigationScene({
  profile,
  coordination,
  onChoose,
}: {
  profile: Profile
  coordination: Coordination
  onChoose: (view: LegalView) => void
}) {
  const entryLine = {
    share: '공유된 URL 목록에서 동일한 대화방 계정이 확인되었습니다.',
    compare: '피해자들의 발견 시점과 진술 대조 결과 사건이 연결되었습니다.',
    observe: '다른 피해자가 제출한 자료에서 동일한 사건이 확인되었습니다.',
  }[coordination]

  return (
    <PhoneSurface className="investigation-surface" time="10:42">
      <header className="time-jump-header dark">
        <span>사건 발생</span>
        <strong>1년 10개월 뒤</strong>
      </header>
      <div className="investigation-entry">{entryLine}</div>
      <div className="case-progress-card">
        <small>사건 진행 알림</small>
        <p className="case-victim-name">피해자 · {profile.name}</p>
        <h2>피해자의 사진과 신상정보를 제공한 피의자 A가 특정되었습니다.</h2>
        <p>피의자 A는 피해자와 같은 대학에 재학했던 사회적 지인으로 확인되었습니다.</p>
        <p>합성물을 제작한 피의자 B가 추가로 특정되었습니다. 일부 참여자의 신원은 확인되지 않았습니다.</p>
      </div>
      <div className="monitoring-continues">삭제지원과 유포 모니터링은 계속됩니다.</div>
      <ChoicePanel className="investigation-choices">
        <button onClick={() => onChoose('open')} type="button">
          사건 진행 내용을 연다
        </button>
        <button onClick={() => onChoose('defer')} type="button">
          나중에 확인한다
        </button>
      </ChoicePanel>
    </PhoneSurface>
  )
}

function InvestigationResultScene({ profile, view }: { profile: Profile; view: LegalView }) {
  return (
    <PhoneSurface className={view === 'open' ? 'case-file-surface' : 'case-deferred-surface'} time="11:03">
      {view === 'open' ? (
        <article className="case-file-document">
          <header>
            <small>수사기록 / 열람본</small>
            <strong>사건 진행 내용</strong>
          </header>
          <dl>
            <div>
              <dt>피해자</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>최초 합성물 생성</dt>
              <dd>피해 인지 214일 전</dd>
            </div>
            <div>
              <dt>피의자 A</dt>
              <dd>공개 사진·실명·연락처 제공</dd>
            </div>
            <div>
              <dt>피의자 B</dt>
              <dd>성적 합성물 제작·전송</dd>
            </div>
            <div>
              <dt>확인된 대화방</dt>
              <dd>12개</dd>
            </div>
            <div>
              <dt>신원 확인 계정</dt>
              <dd>일부</dd>
            </div>
            <div>
              <dt>저장·복제본 총수</dt>
              <dd>확인 불가</dd>
            </div>
          </dl>
          <div className="case-attachments">
            <small>첨부 증거</small>
            <span>{profile.name} 영상</span>
            <span>{profile.name} 회사</span>
            <span>@{profile.account} 비교</span>
          </div>
        </article>
      ) : (
        <div className="deferred-notifications">
          <Notification app="사건" title="사건 진행">
            피의자는 피해자와 같은 대학을 다닌 지인입니다.
          </Notification>
          <Notification app="삭제" title="새 복제본 발견">
            신규 주소 1건이 확인되었습니다.
          </Notification>
          <Notification app="지원" title="삭제 완료">
            게시물 2건의 삭제를 확인했습니다.
          </Notification>
        </div>
      )}
      <div className="old-group-message">
        <small>오래된 대학 단체방 · 졸업 당시</small>
        <p>피의자 A · 졸업 축하해요!</p>
        <span>마지막 대화 · 몇 년 전 “잘 지내?”</span>
      </div>
      <div className="anonymous-after-arrest">올린 사람 잡혔다는데 파일 있는 사람은 아직 많음.</div>
      <div className="time-jump-footer">사건 발생 2년 11개월 뒤</div>
    </PhoneSurface>
  )
}

function JudgmentScene({ profile, onChoose }: { profile: Profile; onChoose: (response: MonitoringResponse) => void }) {
  const [detailsVisible, setDetailsVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDetailsVisible(true), 4000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <PhoneSurface className="judgment-surface" time="09:00">
      <header className="judgment-header">
        <span>사건 알림</span>
        <small>판결 확정</small>
      </header>
      <div className="judgment-title">
        <small>피해자 · {profile.name}</small>
        <h2>피고인 A·B에 대한 판결이 확정되었습니다.</h2>
      </div>
      {detailsVisible ? (
        <div className="judgment-details">
          <div>
            <span>피고인 A·B 사건 상태</span>
            <strong>종결</strong>
          </div>
          <div>
            <span>신원 미상 참여자</span>
            <strong>수사·확인 계속</strong>
          </div>
          <div className="monitoring-copy-alert">
            <span>유포 모니터링</span>
            <strong>새로운 복제 게시물 1건 확인</strong>
          </div>
        </div>
      ) : (
        <div className="judgment-wait-line" />
      )}
      {detailsVisible ? (
        <ChoicePanel className="judgment-choices">
          <button onClick={() => onChoose('continue')} type="button">
            모니터링을 계속한다
          </button>
          <button onClick={() => onChoose('stop')} type="button">
            알림을 더 이상 받지 않는다
          </button>
        </ChoicePanel>
      ) : null}
    </PhoneSurface>
  )
}

function JudgmentResultScene({ profile, response }: { profile: Profile; response: MonitoringResponse }) {
  return (
    <PhoneSurface className="judgment-result-surface" time="09:06">
      <div className="monitoring-choice-result">
        <small>유포 모니터링 설정</small>
        <h2>{response === 'continue' ? '모니터링을 계속합니다.' : '알림이 꺼졌습니다.'}</h2>
        <p>
          {response === 'continue'
            ? '다음 결과를 확인할 수 있도록 알려드리겠습니다.'
            : '새로운 발견에 대한 알림을 더 이상 표시하지 않습니다.'}
        </p>
      </div>
      <div className="search-still-there">
        <small>검색창 자동완성</small>
        <span>{profile.name} 영상</span>
        <span>{profile.name} 회사</span>
      </div>
      <div className="new-home-transition">
        <i />
        <i />
        <i />
        <span>3년 4개월 뒤</span>
      </div>
    </PhoneSurface>
  )
}

function NewRelationshipScene({ profile, onReply }: { profile: Profile; onReply: () => void }) {
  const [questionVisible, setQuestionVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuestionVisible(true), 4000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <PhoneSurface className="new-relationship-surface" time="12:07">
      <AppHeader eyebrow="새 직장 · 점심 대화" title="새 동료" />
      <div className="new-colleague-chat">
        <Bubble side="incoming">내일 점심은 그 국수집 갈까요?</Bubble>
        <Bubble side="incoming">그런데 하나만 물어봐도 돼요?</Bubble>
        {questionVisible ? (
          <>
            <Bubble side="incoming">혹시 예전에 인터넷에 올라왔던 사람이 본인 맞아요?</Bubble>
            <div className="fresh-link-preview">
              <span className="mosaic-mini" />
              <span>
                <small>게시일 · 3일 전</small>
                <strong>{profile.name.slice(0, 1)}○○ 관련 게시물</strong>
              </span>
            </div>
          </>
        ) : null}
      </div>
      {questionVisible ? (
        <div className="reply-composer">
          <div className="empty-reply-field">메시지</div>
          <div className="reply-suggestions">
            <button onClick={onReply} type="button">
              아니에요
            </button>
            <button onClick={onReply} type="button">
              합성된 거예요
            </button>
            <button onClick={onReply} type="button">
              설명할게요
            </button>
          </div>
        </div>
      ) : null}
    </PhoneSurface>
  )
}

function NetworkFinalScene({
  profile,
  monitoringResponse,
  onErase,
}: {
  profile: Profile
  monitoringResponse: MonitoringResponse
  onErase: () => void
}) {
  return (
    <PhoneSurface className="network-final-surface" time="—">
      <div className="network-heading">
        <small>확산망 · 현재</small>
        <strong>끝난 사건, 끝나지 않은 사람</strong>
      </div>
      <NetworkGraph centerLabel={profile.name} monitoringResponse={monitoringResponse} />
      <div className="network-status-list">
        <span>
          <i data-state="dim" />
          최초 게시물 · 삭제됨
        </span>
        <span>
          <i data-state="closed" />
          제공자 A · 판결 확정
        </span>
        <span>
          <i data-state="closed" />
          제작자 B · 판결 확정
        </span>
        <span>
          <i data-state="live" />
          신원 미상 참여자 · 남아 있음
        </span>
        <span>
          <i data-state="live" />새 유포자 · 계속 발견됨
        </span>
      </div>
      <button className="erase-name-button" onClick={onErase} type="button">
        내 이름 지우기
      </button>
    </PhoneSurface>
  )
}

function NameErasedScene({ profile }: { profile: Profile }) {
  const [messageVisible, setMessageVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setMessageVisible(true), 2500)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <PhoneSurface className="network-final-surface erased-network-surface" time="—">
      <div className="network-heading">
        <small>확산망 · 현재</small>
        <strong>이름만 사라졌습니다.</strong>
      </div>
      <NetworkGraph centerLabel={messageVisible ? '새 동료의 질문' : ''} monitoringResponse="stop" />
      {messageVisible ? (
        <div className="new-name-message">혹시 예전에 인터넷에 올라왔던 사람이 본인 맞아요?</div>
      ) : null}
      <blockquote>
        판결은 피고인의 사건을 종결했다.
        <br />
        피해자의 사건은 종결되지 않았다.
      </blockquote>
      <span className="erased-profile-reference" aria-hidden="true">
        {profile.name}
      </span>
    </PhoneSurface>
  )
}

function NetworkGraph({
  centerLabel,
  monitoringResponse,
}: {
  centerLabel: string
  monitoringResponse: MonitoringResponse
}) {
  return (
    <div className="network-graph">
      <svg aria-hidden="true" viewBox="0 0 100 100">
        {NETWORK_NODES.map(([label, x, y]) => (
          <line key={label} x1="50" x2={x} y1="50" y2={y} />
        ))}
      </svg>
      <div className="network-center" data-empty={!centerLabel}>
        {centerLabel}
      </div>
      {NETWORK_NODES.map(([label, x, y], index) => (
        <span
          className="network-node"
          data-live={index === 2 || index === 4 || index === 11}
          key={label}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {label}
        </span>
      ))}
      {monitoringResponse === 'continue' ? <span className="monitoring-pulse-node">새 복제본 알림</span> : null}
      <i className="new-copy-dot dot-one" />
      <i className="new-copy-dot dot-two" />
      <i className="new-copy-dot dot-three" />
    </div>
  )
}

function EndingScene() {
  return (
    <section className="ending-screen">
      <span>체험 종료</span>
    </section>
  )
}

function employmentHistoryLine(exit: EmploymentExit): string {
  return {
    continue: '장기 업무 변경 · 담당 실적 공백',
    leave: '장기 휴직 · 복귀 역할 미정',
    resign: '퇴사 · 근무 공백 8개월',
  }[exit]
}

function employmentFollowupLine(exit: EmploymentExit): string {
  return {
    continue: '이전 직장에서 장기간 업무가 변경된 사유도 확인이 필요합니다.',
    leave: '장기 휴직과 복귀 여부를 추가로 확인해야 합니다.',
    resign: '퇴사 사유와 이후 근무 공백을 설명해 주세요.',
  }[exit]
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-field">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function ChoicePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`late-choice-panel ${className ?? ''}`}>{children}</div>
}
