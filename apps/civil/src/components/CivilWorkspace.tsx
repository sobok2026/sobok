import AccountControls from './AccountControls'
import OrganizationWorkspace from './OrganizationWorkspace'

const MODULES = [
  { code: '01', name: '기관·프로젝트', detail: '기관과 프로젝트의 데이터 및 참여자 권한을 분리합니다.' },
  { code: '02', name: '프로젝트 기준', detail: '좌표계와 사업 코드를 프로젝트 단위로 고정합니다.' },
  { code: '03', name: '수량·토공', detail: '입력 근거와 알고리즘 버전이 고정된 공식 산출을 만듭니다.' },
  { code: '04', name: '입력 스냅샷', detail: '계산 입력과 알고리즘 식별자를 해시와 함께 보존합니다.' },
  { code: '05', name: '결과 revision', detail: '검증된 결과를 수정하지 않고 새 revision으로 축적합니다.' },
  { code: '06', name: '승인·감사', detail: '승인 이력과 시스템 행위를 불변 감사 이벤트로 남깁니다.' },
] as const

export default function CivilWorkspace() {
  return (
    <main className="civil-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Civil 홈">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>
            <strong>Civil</strong>
            <small>OFFICIAL CALCULATION WORKSPACE</small>
          </span>
        </a>
        <AccountControls />
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">VERIFIABLE CIVIL ENGINEERING</p>
          <h1>
            설계 근거부터 승인까지,
            <br />한 흐름으로 연결합니다.
          </h1>
          <p className="hero-description">
            수량과 토공 데이터를 기관별로 격리하고 공식 계산의 입력·알고리즘 버전·결과 해시·승인 이력을 보존하는 검증
            가능한 토목업무 플랫폼입니다.
          </p>
          <ul className="hero-status" aria-label="플랫폼 원칙">
            <li>기관별 데이터 격리</li>
            <li>서버 권위 계산</li>
            <li>불변 승인 revision</li>
          </ul>
        </div>
        <div className="survey-card" aria-label="프로젝트 기준점 시각화" role="img">
          <div className="survey-grid" />
          <span className="survey-point point-a">A</span>
          <span className="survey-point point-b">B</span>
          <span className="survey-line" />
          <div className="survey-readout">
            <small>PROJECT DATUM</small>
            <strong>EPSG:5186</strong>
            <span>37° 34′ 12.4″ N</span>
            <span>126° 58′ 41.8″ E</span>
          </div>
        </div>
      </section>

      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRODUCT BOUNDARIES</p>
            <h2>업무 모듈</h2>
          </div>
          <p>각 모듈은 같은 기관·프로젝트·revision 경계를 공유합니다.</p>
        </div>
        <div className="module-grid">
          {MODULES.map((module) => (
            <article className="module-card" key={module.code}>
              <span>{module.code}</span>
              <h3>{module.name}</h3>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <OrganizationWorkspace />
    </main>
  )
}
