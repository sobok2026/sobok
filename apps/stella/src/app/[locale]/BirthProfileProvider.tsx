'use client'

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'

import { loadBirth, type StoredBirth, saveBirth } from './birth-storage'

type BirthProfileContextValue = {
  birth: StoredBirth | null
  hydrated: boolean
  persistent: boolean
  save: (birth: StoredBirth, persistent: boolean) => void
}

const BirthProfileContext = createContext<BirthProfileContextValue | null>(null)

export default function BirthProfileProvider({ children }: { children: ReactNode }) {
  const [birth, setBirth] = useState<StoredBirth | null>(null)
  const [persistent, setPersistent] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const save = useCallback((nextBirth: StoredBirth, nextPersistent: boolean) => {
    saveBirth(nextBirth, nextPersistent)
    setBirth(nextBirth)
    setPersistent(nextPersistent)
  }, [])

  useEffect(() => {
    const loaded = loadBirth()

    if (loaded) {
      setBirth(loaded.birth)
      setPersistent(loaded.persistent)
    }

    setHydrated(true)
  }, [])

  return <BirthProfileContext value={{ birth, hydrated, persistent, save }}>{children}</BirthProfileContext>
}

export function useBirthProfile(): BirthProfileContextValue {
  const context = useContext(BirthProfileContext)

  if (!context) {
    throw new Error('useBirthProfile must be used within BirthProfileProvider')
  }

  return context
}
