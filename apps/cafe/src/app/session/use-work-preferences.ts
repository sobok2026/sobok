import { useEffect, useRef, useState } from 'react'
import { createWorkSounds, type SoundStatus } from '../audio/work-sounds'
import { savePreferences } from '../persistence/storage'
import type { Preferences } from './preferences'

export function useWorkPreferences(initialPreferences: Preferences) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const preferencesRef = useRef(preferences)

  preferencesRef.current = preferences
  const [preferencesError, setPreferencesError] = useState(false)
  const [soundStatus, setSoundStatus] = useState<SoundStatus>('off')
  const sounds = useRef<ReturnType<typeof createWorkSounds> | null>(null)

  useEffect(() => {
    const player = createWorkSounds(setSoundStatus)
    sounds.current = player
    player.configure(preferencesRef.current)

    return () => {
      sounds.current = null
      player.dispose()
    }
  }, [])

  function updatePreferences(update: Partial<Preferences>) {
    const next = { ...preferencesRef.current, ...update }
    preferencesRef.current = next
    setPreferences(next)
    sounds.current?.configure(next)
    if (update.muted === false) {
      void sounds.current?.unlock()
    }
    void savePreferences(next)
      .then(() => setPreferencesError(false))
      .catch(() => setPreferencesError(true))
  }

  return { preferences, preferencesRef, preferencesError, soundStatus, sounds, updatePreferences }
}
