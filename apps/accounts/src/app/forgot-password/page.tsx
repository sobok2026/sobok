import { AccountShell } from '@/components/AccountShell'
import { ForgotPasswordPanel } from '@/components/ForgotPasswordPanel'

export default function ForgotPasswordPage() {
  return (
    <AccountShell compact>
      <ForgotPasswordPanel />
    </AccountShell>
  )
}
