import AccountControls from './AccountControls'
import OrganizationWorkspace from './OrganizationWorkspace'

const MODULES = [
  { code: '01', name: '사업·참여자', detail: '기관과 프로젝트 권한을 분리하고 설계회차를 관리합니다.' },
  { code: '02', name: '도면·공간정보', detail: '원본 성과품과 검색용 공간형상을 안전하게 보관합니다.' },
  { code: '03', name: '수량·토공', detail: '입력 근거와 알고리즘 버전이 고정된 공식 산출을 만듭니다.' },
  { code: '04', name: '단가·품셈', detail: '적용 기준과 선택 근거를 시점별 스냅샷으로 남깁니다.' },
  { code: '05', name: '내역·변경', detail: '당초와 변경 내역을 revision 단위로 비교하고 승인합니다.' },
  { code: '06', name: '전자납품', detail: '검토, 보완, 승인과 성과품 인계를 하나의 흐름으로 연결합니다.' },
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
            <small>SPATIAL ENGINEERING WORKSPACE</small>
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
            도면, 수량, 토공, 단가와 내역을 기관별로 격리하고 공식 계산의 입력·버전·검토 이력을 보존하는 공간기반
            토목업무 플랫폼입니다.
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
