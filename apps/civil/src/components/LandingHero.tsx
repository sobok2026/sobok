import Link from 'next/link'

const PLATFORM_PRINCIPLES = [
  '기관별 데이터 격리',
  '서버 권위 계산',
  '불변 승인 revision',
  '비공개 성과품 보관',
  '전자납품 manifest',
] as const

export default function LandingHero() {
  return (
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
        <div className="hero-actions">
          <Link className="button button-dark" href="/workspace">
            작업공간 열기
          </Link>
          <a className="button button-quiet" href="#product-modules">
            업무 모듈 보기
          </a>
        </div>
        <ul className="hero-status" aria-label="플랫폼 원칙">
          {PLATFORM_PRINCIPLES.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
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
  )
}
