'use client'

import { type ReactNode, useEffect, useState } from 'react'

import {
  type Discovery,
  type ExposureRoute,
  type FirstResponse,
  josa,
  type Profile,
  ROUTE_LABELS,
  ROUTES,
  type Stage,
} from '@/lib/experience'

export type DailyAction = 'family' | 'friend' | 'work'

type Props = {
  stage: Stage
  profile: Profile
  primaryRoute: ExposureRoute
  secondaryRoute: ExposureRoute
  discovery: Discovery
  response: FirstResponse | null
  openedRoute: ExposureRoute | null
  dailyActions: DailyAction[]
  onDailyAction: (action: DailyAction) => void
  onDiscovery: (discovery: Discovery) => void
  onFriendOpen: () => void
  onAccountSearch: () => void
  onSearchAction: () => void
  onPrimaryClose: () => void
  onSecondaryOpen: (route: ExposureRoute) => void
  onResponse: (response: FirstResponse) => void
  onAnswerCall: () => void
}

export default function ExperienceScenes(props: Props) {
  const { stage, profile } = props

  if (stage === 'identity') {
    return <IdentityScene profile={profile} />
  }

  return (
    <div className="phone-frame" data-scene={stage}>
      <div className="scene-enter" key={stage}>
        {renderScene(props)}
      </div>
    </div>
  )
}

function renderScene(props: Props): ReactNode {
  const { stage, profile } = props

  switch (stage) {
    case 'morning':
      return <MorningScene actions={props.dailyActions} onAction={props.onDailyAction} profile={profile} />
    case 'unknownMessage':
      return <UnknownMessageScene onDiscovery={props.onDiscovery} profile={profile} />
    case 'friendDelay':
      return <FriendDelayScene profile={profile} />
    case 'friendReady':
      return <FriendReadyScene onOpen={props.onFriendOpen} profile={profile} />
    case 'accountGone':
      return <AccountGoneScene onSearch={props.onAccountSearch} profile={profile} />
    case 'searchResults':
      return <SearchResultsScene discovery={props.discovery} onAction={props.onSearchAction} profile={profile} />
    case 'primaryRoute':
      return <PrimaryRouteScene onClose={props.onPrimaryClose} profile={profile} route={props.primaryRoute} />
    case 'secondaryRoute':
      return (
        <SecondaryRouteScene
          onOpen={props.onSecondaryOpen}
          primaryRoute={props.primaryRoute}
          profile={profile}
          secondaryRoute={props.secondaryRoute}
        />
      )
    case 'responseChoice':
      return <ResponseChoiceScene onResponse={props.onResponse} profile={profile} />
    case 'responseResult':
      return <ResponseResultScene profile={profile} response={props.response ?? 'report'} />
    case 'incomingCall':
      return <IncomingCallScene onAnswer={props.onAnswerCall} profile={profile} />
    default:
      return null
  }
}

function IdentityScene({ profile }: { profile: Profile }) {
  return (
    <section className="identity-scene">
      <div className="identity-card">
        <span className="identity-index">오늘의 나</span>
        <div className="identity-avatar" aria-hidden="true">
          {profile.name.slice(0, 1)}
        </div>
        <strong>{profile.name}</strong>
        <span>
          {profile.company} · {profile.role}
        </span>
        <span>{profile.neighborhood}</span>
      </div>
      <p>
        이제부터 화면 속의 ‘나’는 <strong>{profile.name}</strong>입니다.
      </p>
    </section>
  )
}

function MorningScene({
  profile,
  actions,
  onAction,
}: {
  profile: Profile
  actions: DailyAction[]
  onAction: (action: DailyAction) => void
}) {
  return (
    <PhoneSurface className="morning-surface" time="07:42">
      <div className="lock-heading">
        <span>9월 1일 월요일</span>
        <strong>07:42</strong>
      </div>
      <div className="notification-stack daily-stack">
        <Notification
          action={actions.includes('family') ? '밀어 둠' : undefined}
          app="메시지"
          onClick={() => onAction('family')}
          title={profile.family}
        >
          어제 늦게 들어갔어? 저녁에 전화해.
        </Notification>
        <Notification
          action={actions.includes('friend') ? '♥' : undefined}
          app="메시지"
          onClick={() => onAction('friend')}
          title={profile.friend}
        >
          어제 찍은 사진 보내줘 ㅋㅋ
        </Notification>
        <Notification app="워크온" onClick={() => onAction('work')} title="박 팀장">
          오늘 10시 회의 자료만 한 번 확인해 주세요.
        </Notification>
      </div>
      <button className="memory-card" onClick={() => onAction('friend')} type="button">
        <span className="memory-thumb" aria-hidden="true" />
        <span>
          <small>@{profile.account}</small>
          <strong>1년 전 오늘의 사진이 있습니다.</strong>
        </span>
      </button>
      <p className="gesture-hint">업무 메시지를 열어 확인</p>
    </PhoneSurface>
  )
}

function UnknownMessageScene({ profile, onDiscovery }: { profile: Profile; onDiscovery: (value: Discovery) => void }) {
  const [secondMessageVisible, setSecondMessageVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setSecondMessageVisible(true), 3000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <PhoneSurface className="work-chat-surface" time="11:18">
      <AppHeader eyebrow="워크온 · 브랜드 운영팀" title="박 팀장" />
      <div className="work-chat-background">
        <Bubble side="incoming">회의 자료 마지막 페이지 수치만 확인해 주세요.</Bubble>
        <Bubble side="outgoing">네, 지금 확인할게요.</Bubble>
      </div>
      <div className="intrusion-layer">
        <div className="unknown-card">
          <div className="unknown-meta">
            <span className="unknown-avatar" aria-hidden="true" />
            <span>
              <strong>user_0471</strong>
              <small>메시지 요청 · 지금</small>
            </span>
          </div>
          <p>혹시 {profile.name}님 맞으세요?</p>
          {secondMessageVisible ? (
            <div className="second-message">
              <p>이거 지금 돌아다니는데 본인 아닌가 해서요.</p>
              <div className="broken-preview">
                <span className="blurred-image blurred-image--mini" aria-hidden="true" />
                <span>
                  {profile.company} 다니는 {profile.name}…
                </span>
              </div>
            </div>
          ) : (
            <span className="typing-dots" aria-label="메시지를 입력 중" role="status">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
        {secondMessageVisible ? (
          <div className="choice-sheet">
            <button onClick={() => onDiscovery('direct')} type="button">
              메시지를 연다
            </button>
            <button onClick={() => onDiscovery('friend')} type="button">
              알림을 지운다
            </button>
            <button onClick={() => onDiscovery('workplace')} type="button">
              계정을 검색한다
            </button>
          </div>
        ) : null}
      </div>
    </PhoneSurface>
  )
}

function FriendDelayScene({ profile }: { profile: Profile }) {
  return (
    <PhoneSurface className="night-lock-surface" time="11:19">
      <div className="lock-heading compact">
        <span>월요일</span>
        <strong>11:19</strong>
      </div>
      <div className="dismissed-trace">
        <span>알림 1개를 지웠습니다.</span>
      </div>
      <div className="waiting-copy">
        <span>{profile.name}</span>
        <i />
      </div>
    </PhoneSurface>
  )
}

function FriendReadyScene({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
  return (
    <PhoneSurface className="night-lock-surface" time="11:27">
      <div className="lock-heading compact">
        <span>월요일</span>
        <strong>11:27</strong>
      </div>
      <div className="notification-stack single-alert">
        <Notification app="메시지" onClick={onOpen} title={profile.friend} urgent>
          이거 너 아니지? 네 이름이랑 회사까지 써 있어.
        </Notification>
      </div>
    </PhoneSurface>
  )
}

function AccountGoneScene({ profile, onSearch }: { profile: Profile; onSearch: () => void }) {
  return (
    <PhoneSurface className="account-search-surface" time="11:20">
      <AppHeader eyebrow="계정 검색" title="user_0471" />
      <section className="missing-account">
        <span className="missing-avatar" aria-hidden="true">
          ?
        </span>
        <h2>사용자를 찾을 수 없습니다</h2>
        <p>계정이 삭제되었거나 이름이 변경되었습니다.</p>
      </section>
      <div className="search-suggestion-panel">
        <small>대신 발견된 검색 결과</small>
        <strong>
          {profile.company} 직원 {profile.name}
        </strong>
        <p>방금 전 등록 · 이미지 3개</p>
        <button onClick={onSearch} type="button">
          검색 결과 보기
        </button>
      </div>
    </PhoneSurface>
  )
}

function SearchResultsScene({
  profile,
  discovery,
  onAction,
}: {
  profile: Profile
  discovery: Discovery
  onAction: () => void
}) {
  const sourceLine = {
    direct: 'user_0471 · 이거 지금 돌아다니는데 본인 아닌가 해서요.',
    friend: `${profile.friend} · 네 이름이랑 회사까지 써 있어.`,
    workplace: `${profile.company} · 관련 게시물에 대한 외부 문의가 접수되었습니다.`,
  }[discovery]

  return (
    <PhoneSurface className="search-surface" time="11:23">
      <div className="search-header">
        <span className="search-brand">FIND</span>
        <div className="search-box">
          <span>
            {profile.name} {profile.company}
          </span>
          <i aria-hidden="true">×</i>
        </div>
      </div>
      <div className="source-overlay">{sourceLine}</div>
      <div className="result-count">검색 결과 약 2,840개</div>
      <div className="search-results-list">
        <SearchResult
          meta="clip-room.today · 방금 전"
          onClick={onAction}
          profile={profile}
          title={`${profile.company} 직원 ${profile.name} 영상`}
          withThumbnail
        />
        <SearchResult
          meta="archive-tape.net · 4분 전"
          onClick={onAction}
          profile={profile}
          title={`@${profile.account} 본인 맞음? 사진 비교`}
        />
        <SearchResult
          meta="people-map.cc · 9분 전"
          onClick={onAction}
          profile={profile}
          title={`${profile.neighborhood} 사는 사람이라는데 아는 사람`}
        />
      </div>
      <div className="autocomplete-strip">
        <small>추천 검색어</small>
        <button onClick={onAction} type="button">
          {profile.name} 영상
        </button>
        <button onClick={onAction} type="button">
          {profile.name} 회사
        </button>
      </div>
    </PhoneSurface>
  )
}

function PrimaryRouteScene({
  profile,
  route,
  onClose,
}: {
  profile: Profile
  route: ExposureRoute
  onClose: () => void
}) {
  const [traceVisible, setTraceVisible] = useState(true)

  if (traceVisible) {
    return <ManufactureTraceScene onContinue={() => setTraceVisible(false)} profile={profile} />
  }

  return (
    <PhoneSurface className="primary-route-surface" dataRoute={route} time="11:31">
      <AppHeader eyebrow="새로운 활동" title={primaryTitle(route)} />
      <div className="route-badge">{ROUTE_LABELS[route]} 노출</div>
      {route === 'image' ? <ImageRoute profile={profile} /> : null}
      {route === 'location' ? <LocationRoute profile={profile} /> : null}
      {route === 'relationship' ? <RelationshipRoute profile={profile} /> : null}
      {route === 'work' ? <WorkRoute profile={profile} /> : null}
      <button className="close-one-button" onClick={onClose} type="button">
        이 화면 닫기
      </button>
    </PhoneSurface>
  )
}

function ManufactureTraceScene({ profile, onContinue }: { profile: Profile; onContinue: () => void }) {
  const steps = [
    {
      detail: `@${profile.account}에 공개된 얼굴 사진 12장이 별도 폴더에 저장됨`,
      label: '공개 사진 수집',
    },
    {
      detail: '눈·코·입의 위치 정보와 얼굴 영역이 원본 사진에서 분리됨',
      label: '얼굴 데이터 분리',
    },
    {
      detail: '출처를 알 수 없는 신체 영상 위에 얼굴이 덧씌워진 파일이 생성됨',
      label: '성적 합성물 생성',
    },
    {
      detail: '서로 다른 계정과 주소에 같은 파일의 복제본이 연속 등록됨',
      label: '복제·업로드',
    },
  ]

  return (
    <PhoneSurface className="manufacture-trace-surface" time="11:25">
      <AppHeader eyebrow="게시물 파일 정보 · 재구성" title="합성물이 만들어진 흔적" />
      <section className="manufacture-trace">
        <p className="trace-intro">
          첫 게시물에 남아 있던 파일 순서입니다. 시작점은 내가 공개했던 <strong>{profile.profilePhoto}</strong>
          이었습니다.
        </p>

        <div className="trace-comparison">
          <figure>
            <div aria-label={`${profile.name}의 공개 프로필 원본 사진`} className="trace-source-photo" role="img">
              <i aria-hidden="true" />
            </div>
            <figcaption>공개 프로필 · 얼굴 원본</figcaption>
          </figure>
          <span className="trace-transfer" aria-hidden="true">
            →
          </span>
          <figure>
            <div aria-label={`${profile.name}의 얼굴이 합성된 이미지`} className="trace-synthetic-still" role="img">
              <i aria-hidden="true" />
              <span aria-hidden="true" />
            </div>
            <figcaption>성적 합성물 · 신체 영역 가림</figcaption>
          </figure>
        </div>

        <ol className="trace-timeline">
          {steps.map((step, index) => (
            <li key={step.label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="trace-copy-burst">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <strong>11분 동안 복제 파일 8개 · 업로드 주소 5곳</strong>
        </div>
      </section>
      <button className="trace-continue-button" onClick={onContinue} type="button">
        이 기록을 계속 본다
      </button>
    </PhoneSurface>
  )
}

function ImageRoute({ profile }: { profile: Profile }) {
  return (
    <div className="image-route-feed">
      <article className="feed-card focal-card">
        <div className="feed-author">
          <i />{' '}
          <span>
            archive_17<small>1분</small>
          </span>
        </div>
        <div className="blurred-image blurred-image--large" aria-label="흐리게 처리된 합성물 미리보기" role="img" />
        <strong>삭제되기 전에 저장.</strong>
        <p>비교해 보니까 @{profile.account}에 있던 사진이랑 같은 사람 맞음.</p>
      </article>
      <article className="feed-card offset-card">
        <div className="split-thumbnail">
          <span />
          <span />
        </div>
        <strong>{profile.name} 원본 / 파일 비교</strong>
        <small>조회 1,927 · 공유 84</small>
      </article>
      <article className="feed-card offset-card second">
        <strong>tell_hr</strong>
        <p>{profile.company} 직원이라던데 회사에도 보냄.</p>
      </article>
      <div className="threat-message">user_0471 · 네가 아니라고 해도 사람들은 보고 싶은 것만 봐.</div>
    </div>
  )
}

function LocationRoute({ profile }: { profile: Profile }) {
  return (
    <div className="location-route">
      <div className="abstract-map">
        <span className="map-road road-a" />
        <span className="map-road road-b" />
        <span className="map-road road-c" />
        <span className="route-line" />
        <span className="map-node home-node">
          <i />
          {profile.neighborhood}
        </span>
        <span className="map-node station-node">
          <i />
          {profile.station}
        </span>
        <span className="map-node place-node">
          <i />
          {profile.place}
        </span>
      </div>
      <div className="map-comment-list">
        <Bubble side="incoming">
          <strong>map_82</strong> · 예전 사진 배경 {profile.station} 맞지?
        </Bubble>
        <Bubble side="incoming">
          <strong>route_note</strong> · 회사는 여기고 집은 이쪽인 듯.
        </Bubble>
        <Bubble side="incoming">
          <strong>user_0913</strong> · 오늘 회색 코트 입었네.
        </Bubble>
      </div>
      <div className="threat-message">user_0913 · 온라인에만 있는 일 같아?</div>
    </div>
  )
}

function RelationshipRoute({ profile }: { profile: Profile }) {
  return (
    <div className="relationship-route">
      <div className="impersonation-profile">
        <div className="impersonation-avatar">{profile.name.slice(0, 1)}</div>
        <span>
          <strong>{profile.name}</strong>
          <small>@{profile.account}_new</small>
        </span>
        <i>사칭 의심</i>
      </div>
      <div className="recipient-row">
        <span>{profile.friend}</span>
        <span>{profile.family}</span>
        <span>수진</span>
        <span>박 팀장</span>
      </div>
      <div className="chat-thread">
        <Bubble side="incoming">
          <strong>{profile.friend}</strong>
          <br />너 계정 새로 만들었어? 방금 나한테 이상한 거 보냈어.
        </Bubble>
        <Bubble side="incoming">
          <strong>수진</strong>
          <br />
          이거 네가 보낸 거 아니지? 회사 메일로도 왔어.
        </Bubble>
        <Bubble side="outgoing">내가 직접 올린 거야.</Bubble>
      </div>
      <div className="threat-message">새 계정이 {profile.name}님의 사진과 이름을 사용하고 있습니다.</div>
    </div>
  )
}

function WorkRoute({ profile }: { profile: Profile }) {
  return (
    <div className="work-route">
      <article className="mail-card">
        <div className="mail-head">
          <span>외부 메일</span>
          <time>11:29</time>
        </div>
        <h2>귀사 직원 {profile.name} 관련 제보</h2>
        <div className="recipient-list">
          <small>받는 사람</small>
          <span>박 팀장</span>
          <span>인사팀</span>
          <span>브랜드 운영팀</span>
          <span>대표 메일</span>
        </div>
        <div className="mail-attachment">
          <span className="blurred-image blurred-image--mini" />
          <strong>첨부 3개</strong>
        </div>
      </article>
      <div className="work-alerts">
        <Notification app="워크온" title="박 팀장">
          잠깐 통화 가능해요?
        </Notification>
        <Notification app="워크온" title="인사팀">
          관련 사실 확인을 위해 오늘 대외 업무는 중단해 주세요.
        </Notification>
      </div>
      <div className="threat-message">외부 발신자가 전체 수신 목록으로 같은 메일을 보냈습니다.</div>
    </div>
  )
}

function SecondaryRouteScene({
  profile,
  primaryRoute,
  secondaryRoute,
  onOpen,
}: {
  profile: Profile
  primaryRoute: ExposureRoute
  secondaryRoute: ExposureRoute
  onOpen: (route: ExposureRoute) => void
}) {
  const [unreadCount, setUnreadCount] = useState(7)
  const remainingRoutes = ROUTES.filter((route) => route !== primaryRoute && route !== secondaryRoute)

  useEffect(() => {
    const interval = window.setInterval(() => setUnreadCount((count) => Math.min(count + 1, 99)), 1200)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <PhoneSurface className="secondary-route-surface" dataRoute={secondaryRoute} time="12:04">
      <div className="secondary-heading">
        <span>{ROUTE_LABELS[secondaryRoute]}에서 새 활동</span>
        <strong>{unreadCount}</strong>
      </div>
      <button className="secondary-focus" onClick={() => onOpen(secondaryRoute)} type="button">
        <span className="secondary-icon">{routeGlyph(secondaryRoute)}</span>
        <span>
          <small>{ROUTE_LABELS[secondaryRoute]} 경로</small>
          <strong>{secondaryNotification(secondaryRoute, profile)}</strong>
          <p>{secondaryDetail(secondaryRoute, profile)}</p>
        </span>
      </button>
      <div className="anonymous-lines">
        <p>user_0471 · 어디까지 퍼졌는지 너만 몰라.</p>
        <p>archive_17 · 한 군데 지우면 다른 데 올리면 돼.</p>
      </div>
      <div className="remaining-notifications">
        {remainingRoutes.map((route) => (
          <button key={route} onClick={() => onOpen(route)} type="button">
            <span>{routeGlyph(route)}</span>
            <span>
              <small>{ROUTE_LABELS[route]}</small>
              <strong>{secondaryNotification(route, profile)}</strong>
            </span>
            <i>{Math.max(2, unreadCount - 4)}</i>
          </button>
        ))}
      </div>
      <p className="gesture-hint dark">알림 하나를 열어 확인</p>
    </PhoneSurface>
  )
}

function ResponseChoiceScene({
  profile,
  onResponse,
}: {
  profile: Profile
  onResponse: (response: FirstResponse) => void
}) {
  return (
    <PhoneSurface className="response-surface" time="12:18">
      <AppHeader eyebrow="게시물" title="무엇부터 해야 하지" />
      <div className="response-backdrop-cards" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <article className="reported-post">
        <div className="feed-author">
          <i />
          <span>
            archive_17<small>방금 전</small>
          </span>
        </div>
        <div className="blurred-image blurred-image--wide" />
        <strong>
          {profile.company} {profile.name}
        </strong>
        <p>원본 있는 사람? @{profile.account} 사진이랑 비교함.</p>
      </article>
      <div className="response-options">
        <button onClick={() => onResponse('report')} type="button">
          <span>01</span>게시물을 신고한다
        </button>
        <button onClick={() => onResponse('contact')} type="button">
          <span>02</span>
          {profile.friend}에게 연락한다
        </button>
        <button onClick={() => onResponse('block')} type="button">
          <span>03</span>익명 계정을 차단한다
        </button>
      </div>
    </PhoneSurface>
  )
}

function ResponseResultScene({ profile, response }: { profile: Profile; response: FirstResponse }) {
  const [followupVisible, setFollowupVisible] = useState(response !== 'block')

  useEffect(() => {
    if (response !== 'block') {
      return
    }

    const timeout = window.setTimeout(() => setFollowupVisible(true), 2600)
    return () => window.clearTimeout(timeout)
  }, [response])

  return (
    <PhoneSurface className="result-surface" time="12:19">
      <div className="result-mark">{response === 'report' ? '!' : response === 'contact' ? '···' : '×'}</div>
      {response === 'report' ? (
        <div className="result-copy">
          <small>신고 접수</small>
          <h2>신고가 접수되었습니다.</h2>
          <p>검토 결과를 알려드리겠습니다.</p>
          <div className="new-alert critical">새로운 게시물 3개에서 {profile.name}님이 언급되었습니다.</div>
        </div>
      ) : null}
      {response === 'contact' ? (
        <div className="result-copy chat-result">
          <small>{profile.friend}</small>
          <h2>응. 나도 봤어.</h2>
          <p>네가 아닌 거 알아. 일단 내가 캡처해 둘게.</p>
          <div className="new-alert">
            {profile.friend}의 메시지 요청 <strong>12개</strong>
          </div>
        </div>
      ) : null}
      {response === 'block' ? (
        <div className="result-copy block-result">
          <small>계정 차단</small>
          <h2>user_0471을 차단했습니다.</h2>
          {followupVisible ? (
            <div className="new-alert critical">user_0472 · 차단하면 끝날 줄 알았어?</div>
          ) : (
            <div className="silent-line" />
          )}
        </div>
      ) : null}
    </PhoneSurface>
  )
}

function IncomingCallScene({ profile, onAnswer }: { profile: Profile; onAnswer: () => void }) {
  return (
    <PhoneSurface className="incoming-call-surface" time="12:24">
      <div className="call-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="caller-avatar">人事</div>
      <span className="call-label">수신 전화</span>
      <h2>{profile.company} 인사팀</h2>
      <p>회사 대표번호</p>
      <div className="call-actions">
        <span aria-hidden="true" className="decline-call">
          ×
        </span>
        <button aria-label="전화 받기" className="accept-call" onClick={onAnswer} type="button">
          ⌕
        </button>
      </div>
    </PhoneSurface>
  )
}

export function PhoneSurface({
  children,
  className,
  time,
  dataRoute,
}: {
  children: ReactNode
  className: string
  time: string
  dataRoute?: ExposureRoute
}) {
  return (
    <section className={`phone-surface ${className}`} data-route={dataRoute}>
      <StatusBar time={time} />
      {children}
      <div className="home-indicator" aria-hidden="true" />
    </section>
  )
}

function StatusBar({ time }: { time: string }) {
  return (
    <div className="status-bar">
      <time>{time}</time>
      <span className="status-symbols" aria-hidden="true">
        <i />
        <i />
        <b />
      </span>
    </div>
  )
}

export function AppHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="app-header">
      <span className="app-back" aria-hidden="true">
        ‹
      </span>
      <span>
        <small>{eyebrow}</small>
        <strong>{title}</strong>
      </span>
      <i aria-hidden="true">•••</i>
    </header>
  )
}

export function Notification({
  app,
  title,
  children,
  onClick,
  action,
  urgent = false,
}: {
  app: string
  title: string
  children: ReactNode
  onClick?: () => void
  action?: string
  urgent?: boolean
}) {
  const content = (
    <>
      <span className="notification-icon" aria-hidden="true">
        {app.slice(0, 1)}
      </span>
      <span className="notification-copy">
        <small>{app} · 지금</small>
        <strong>{title}</strong>
        <p>{children}</p>
      </span>
      {action ? <b className="notification-action">{action}</b> : null}
    </>
  )

  return onClick ? (
    <button className="notification-card" data-urgent={urgent} onClick={onClick} type="button">
      {content}
    </button>
  ) : (
    <div className="notification-card" data-urgent={urgent}>
      {content}
    </div>
  )
}

export function Bubble({ children, side }: { children: ReactNode; side: 'incoming' | 'outgoing' }) {
  return (
    <div className="message-bubble" data-side={side}>
      {children}
    </div>
  )
}

function SearchResult({
  title,
  meta,
  profile,
  withThumbnail = false,
  onClick,
}: {
  title: string
  meta: string
  profile: Profile
  withThumbnail?: boolean
  onClick: () => void
}) {
  return (
    <button className="search-result" onClick={onClick} type="button">
      <span className="result-text">
        <small>{meta}</small>
        <strong>{title}</strong>
        <p>합성인지 아닌지 모르겠는데 얼굴은 똑같네. {profile.company} 어디인지 찾음.</p>
      </span>
      {withThumbnail ? (
        <span className="blurred-image blurred-image--result" aria-label="흐리게 처리된 미리보기" role="img" />
      ) : null}
    </button>
  )
}

function primaryTitle(route: ExposureRoute): string {
  return {
    image: '같은 파일, 다른 계정',
    location: '지도에 연결된 흔적',
    relationship: '내 이름으로 보낸 메시지',
    work: '전체 수신 메일',
  }[route]
}

function secondaryNotification(route: ExposureRoute, profile: Profile): string {
  return {
    image: '새로운 게시물에서 회원님의 계정이 언급되었습니다.',
    location: '공동현관 호출 · 응답 없음 · 4회',
    relationship: `${profile.family} · 부재중 전화 6통`,
    work: `${profile.company} 인사팀 · 면담 일정이 등록되었습니다.`,
  }[route]
}

function secondaryDetail(route: ExposureRoute, profile: Profile): string {
  return {
    image: `@${profile.account} 사진 비교 게시물이 세 플랫폼에 복제되었습니다.`,
    location: `${josa(profile.station, '와/과')} ${josa(profile.place, '이/가')} 같은 이동 경로로 표시되었습니다.`,
    relationship: `${profile.friend}, ${profile.family}, 직장 동료에게 같은 링크가 전송되었습니다.`,
    work: `외부 발신 메일이 ${profile.company}의 여러 수신자에게 전달되었습니다.`,
  }[route]
}

function routeGlyph(route: ExposureRoute): string {
  return {
    image: '▧',
    location: '⌖',
    relationship: '◎',
    work: '▰',
  }[route]
}
