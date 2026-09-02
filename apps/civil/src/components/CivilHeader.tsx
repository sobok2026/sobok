import Link from 'next/link'
import AccountControls from './AccountControls'

export default function CivilHeader({ workspace = false }: { workspace?: boolean }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Civil 홈">
        <span className="brand-mark" aria-hidden="true">
          C
        </span>
        <span>
          <strong>Civil</strong>
          <small>OFFICIAL CALCULATION WORKSPACE</small>
        </span>
      </Link>
      <div className="topbar-actions">
        <Link className="topbar-workspace-link" href="/workspace">
          {workspace ? '기관 목록' : '작업공간'}
        </Link>
        <AccountControls />
      </div>
    </header>
  )
}
