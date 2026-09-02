import AuthRecoveryPanel from '@/components/AuthRecoveryPanel'
import CivilHeader from '@/components/CivilHeader'

export default function AuthErrorPage() {
  return (
    <div className="civil-shell">
      <CivilHeader />
      <main className="workspace-main">
        <AuthRecoveryPanel />
      </main>
    </div>
  )
}
