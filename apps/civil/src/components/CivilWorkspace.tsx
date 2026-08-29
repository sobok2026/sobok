import AccountControls from './AccountControls'
import OrganizationWorkspace from './OrganizationWorkspace'

const MODULES = [
  { code: '01', name: '기관·프로젝트', detail: '기관과 프로젝트의 데이터 및 참여자 권한을 분리합니다.' },
  { code: '02', name: '도면·측량 성과', detail: 'CAD·GIS·PDF 원본과 좌표계·공간 범위·revision 계보를 연결합니다.' },
  { code: '03', name: '비공개 파일 보관', detail: 'R2 원본을 공개하지 않고 형식·크기·SHA-256을 확인해 보관합니다.' },
  { code: '04', name: '수량·토공', detail: '입력 근거와 알고리즘 버전이 고정된 공식 산출을 만듭니다.' },
  { code: '05', name: '결과 revision', detail: '검증된 결과를 수정하지 않고 새 revision으로 축적합니다.' },
  { code: '06', name: '전자납품', detail: '원본과 manifest를 불변 ZIP으로 묶고 제출·보완·승인을 기록합니다.' },
  { code: '07', name: '무결성 증거', detail: '입력·원본·manifest·패키지 해시를 함께 보존합니다.' },
  { code: '08', name: '승인·감사', detail: '승인 이력과 시스템 행위를 불변 감사 이벤트로 남깁니다.' },
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
            도면·측량·계산·원가 근거를 기관별로 격리하고 공식 결과의 입력·알고리즘 버전·파일 해시·전자납품·승인 이력을
            보존하는 검증 가능한 토목업무 플랫폼입니다.
          </p>
          <ul className="hero-status" aria-label="플랫폼 원칙">
            <li>기관별 데이터 격리</li>
            <li>서버 권위 계산</li>
            <li>불변 승인 revision</li>
            <li>비공개 성과품 보관</li>
            <li>전자납품 manifest</li>
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
