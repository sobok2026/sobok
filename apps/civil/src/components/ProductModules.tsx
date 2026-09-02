const MODULES = [
  { code: '01', name: '기관·프로젝트', detail: '기관 구성원과 프로젝트별 설계·검토·승인 역할을 분리합니다.' },
  { code: '02', name: '설계협업·변경', detail: '원안·변경·준공 회차를 제출·검토·보완·승인·확정합니다.' },
  { code: '03', name: '비공개 파일 보관', detail: 'R2 원본을 공개하지 않고 형식·크기·SHA-256을 확인해 보관합니다.' },
  { code: '04', name: '수량·토공', detail: '서버 계산과 입력·알고리즘·결과 해시를 공식 승인 흐름에 연결합니다.' },
  { code: '05', name: '확정 revision', detail: '검토 완료본을 append-only 스냅샷과 SHA-256으로 잠급니다.' },
  { code: '06', name: '전자납품', detail: '원본과 manifest를 불변 ZIP으로 묶고 제출·보완·승인을 기록합니다.' },
  { code: '07', name: '무결성 증거', detail: '입력·원본·manifest·패키지 해시를 함께 보존합니다.' },
  {
    code: '08',
    name: '승인·감사',
    detail: '권한·설계·계산·납품의 사용자와 상태 이력을 조회 가능한 감사 이벤트로 남깁니다.',
  },
] as const

export default function ProductModules() {
  return (
    <section className="workspace-section" id="product-modules">
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
  )
}
