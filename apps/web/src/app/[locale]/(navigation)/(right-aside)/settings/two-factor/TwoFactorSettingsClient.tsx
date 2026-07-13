'use client'

import { useState } from 'react'
import TwoFactorBackupCodes from './components/TwoFactorBackupCodes'
import TwoFactorManagement from './components/TwoFactorManagement'
import TwoFactorOnboarding from './components/TwoFactorOnboarding'
import TwoFactorSetup from './components/TwoFactorSetup'
import type { TwoFactorSetupData } from './types'

interface Props {
  initialEnabled: boolean
}

export default function TwoFactorSettingsClient({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  if (setupData) {
    return (
      <TwoFactorSetup
        onSuccess={() => {
          setBackupCodes(setupData.backupCodes)
          setSetupData(null)
          setEnabled(true)
        }}
        setupData={setupData}
      />
    )
  }

  if (backupCodes.length > 0) {
    return (
      <TwoFactorBackupCodes
        backupCodes={backupCodes}
        onComplete={() => {
          setBackupCodes([])
        }}
      />
    )
  }

  if (!enabled) {
    return <TwoFactorOnboarding onSuccess={(data) => setSetupData(data)} />
  }

  return <TwoFactorManagement onBackupCodesChange={setBackupCodes} onDisabled={() => setEnabled(false)} />
}
