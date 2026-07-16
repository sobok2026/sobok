'use client'

import type { Locale } from '@sobok/domain/locale'
import { useLocale } from 'next-intl'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

import { clearBirth, loadBirth, type StoredBirth, saveBirth } from '@/lib/birth-storage'

type BirthProfileContextValue = {
  birth: StoredBirth | null
  hydrated: boolean
  persistent: boolean
  save: (birth: StoredBirth, persistent: boolean) => void
  clear: () => void
}

const BirthProfileContext = createContext<BirthProfileContextValue | null>(null)

export default function BirthProfileProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as Locale
  const [birth, setBirth] = useState<StoredBirth | null>(null)
  const [persistent, setPersistent] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  function save(nextBirth: StoredBirth, nextPersistent: boolean) {
    saveBirth(nextBirth, nextPersistent)
    setBirth(nextBirth)
    setPersistent(nextPersistent)
  }

  function clear() {
    clearBirth()
    setBirth(null)
    setPersistent(false)
  }

  useEffect(() => {
    const loaded = loadBirth(locale)

    if (loaded) {
      setBirth(loaded.birth)
      setPersistent(loaded.persistent)
    } else {
      setBirth(null)
      setPersistent(false)
    }

    setHydrated(true)
  }, [locale])

  return <BirthProfileContext value={{ birth, hydrated, persistent, save, clear }}>{children}</BirthProfileContext>
}

export function useBirthProfile(): BirthProfileContextValue {
  const context = useContext(BirthProfileContext)

  if (!context) {
    throw new Error('useBirthProfile must be used within BirthProfileProvider')
  }

  return context
}
