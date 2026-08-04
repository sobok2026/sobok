import { AccountShell } from '@/components/AccountShell'
import { ConsentPanel } from '@/components/ConsentPanel'

export default function ConsentPage() {
  return (
    <AccountShell compact>
      <ConsentPanel />
    </AccountShell>
  )
}
