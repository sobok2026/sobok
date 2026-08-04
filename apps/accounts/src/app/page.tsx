import { AccountShell } from '@/components/AccountShell'

export default function HomePage() {
  return (
    <AccountShell compact>
      <div className="title-block">
        <h1>소복 계정</h1>
        <p className="subtitle">Stella, Vibe, ZWDS와 Sobok 서비스를 하나의 계정으로 이어가세요.</p>
      </div>
      <div className="stack-tight">
        <a
          className="button button-primary"
          href="/sign-in"
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
        >
          로그인
        </a>
        <a
          className="button button-secondary"
          href="/sign-up"
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
        >
          계정 만들기
        </a>
      </div>
    </AccountShell>
  )
}
