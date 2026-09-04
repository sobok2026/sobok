'use client'

type Props = {
  onStart: () => void
}

const NOTICES = [
  ['다루는 소재', '딥페이크 성적 합성물, 온라인 스토킹, 신상 유포'],
  ['소요 시간', '약 15분 · 중간에 언제든 나갈 수 있습니다'],
  ['등장 인물', '전부 허구입니다. 실제 인물이나 회사와 관계가 없습니다'],
  ['입력 정보', '이 탭에서만 쓰이고 새로고침하면 사라집니다'],
]

export default function IntroScreen({ onStart }: Props) {
  return (
    <section className="intro-screen">
      <div className="intro-body">
        <p className="intro-kicker">1인칭 인터랙티브</p>
        <h1>검색 가능한 사람</h1>
        <p className="intro-lead">
          평범하게 공개해 둔 정보가 한 사람의 현실을 대신하기 시작합니다. 당신은 그 사람의 하루를 대신 살게 됩니다.
        </p>

        <div className="intro-notice">
          <strong>시작하기 전에 확인해 주세요</strong>
          <dl>
            {NOTICES.map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="intro-actions">
        <button className="primary-action" onClick={onStart} type="button">
          시작하기
        </button>
      </div>
    </section>
  )
}
