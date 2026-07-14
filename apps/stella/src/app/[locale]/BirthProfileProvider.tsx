'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

import { clearBirth, loadBirth, type StoredBirth, saveBirth } from './birth-storage'

type BirthProfileContextValue = {
  birth: StoredBirth | null
  hydrated: boolean
  persistent: boolean
  // Whether a session-only birth has been deliberately surfaced this page load.
  // Persistent (localStorage) profiles reveal on their own; a transient session
  // copy stays behind the form until the visitor acts, and this resets on a hard
  // reload so a refresh returns to the form rather than jumping to the result.
  revealed: boolean
  save: (birth: StoredBirth, persistent: boolean) => void
  clear: () => void
}

const BirthProfileContext = createContext<BirthProfileContextValue | null>(null)

export default function BirthProfileProvider({ children }: { children: ReactNode }) {
  const [birth, setBirth] = useState<StoredBirth | null>(null)
  const [persistent, setPersistent] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [revealed, setRevealed] = useState(false)

  function save(nextBirth: StoredBirth, nextPersistent: boolean) {
    saveBirth(nextBirth, nextPersistent)
    setBirth(nextBirth)
    setPersistent(nextPersistent)
    setRevealed(true)
  }

  function clear() {
    clearBirth()
    setBirth(null)
    setPersistent(false)
    setRevealed(false)
  }

  useEffect(() => {
    const loaded = loadBirth()

    if (loaded) {
      setBirth(loaded.birth)
      setPersistent(loaded.persistent)
    }

    setHydrated(true)
  }, [])

  return (
    <BirthProfileContext value={{ birth, hydrated, persistent, revealed, save, clear }}>{children}</BirthProfileContext>
  )
}

export function useBirthProfile(): BirthProfileContextValue {
  const context = useContext(BirthProfileContext)

  if (!context) {
    throw new Error('useBirthProfile must be used within BirthProfileProvider')
  }

  return context
}
