import { defaultPreferences, type Preferences, preferencesSchema } from './preferences'
import { type GameState, stateSchema } from './state'

const DATABASE = 'sobok-cafe'
let database: Promise<IDBDatabase> | undefined
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE)
      request.onupgradeneeded = () => request.result.createObjectStore('saves')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        database = undefined
        reject(request.error ?? new Error('저장소를 열지 못했어요.'))
      }
      request.onblocked = () => {
        database = undefined
        reject(new Error('다른 창을 닫고 다시 시도해주세요.'))
      }
    })
  return database
}
export async function loadGame(): Promise<{ state: GameState | null; recovered: boolean }> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', 'readonly')
    const store = tx.objectStore('saves')
    const current = store.get('current')
    const previous = store.get('previous')
    tx.oncomplete = () => {
      if (current.result === undefined) {
        resolve({ state: null, recovered: false })
        return
      }
      const parsed = stateSchema.safeParse(current.result)
      if (parsed.success) {
        resolve({ state: parsed.data, recovered: false })
        return
      }
      const fallback = stateSchema.safeParse(previous.result)
      if (fallback.success) {
        resolve({ state: fallback.data, recovered: true })
        return
      }
      reject(new Error('저장 형식을 읽을 수 없어요. 백업을 불러오거나 새 근무를 시작해주세요.'))
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
let writes: Promise<void> = Promise.resolve()
export function saveGame(state: GameState): Promise<void> {
  const snapshot = stateSchema.parse(state)
  const write = writes
    .catch(() => undefined)
    .then(async () => {
      const db = await open()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('saves', 'readwrite')
        const store = tx.objectStore('saves')
        const old = store.get('current')
        old.onsuccess = () => {
          const parsed = stateSchema.safeParse(old.result)
          if (parsed.success) store.put(parsed.data, 'previous')
          store.put(snapshot, 'current')
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
    })
  writes = write
  return write
}
export function exportGame(state: GameState) {
  const blob = new Blob([JSON.stringify(stateSchema.parse(state), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cafe-day-${state.day}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function importGame(file: File) {
  if (file.size > 2 * 1024 * 1024) throw new Error('백업 파일이 너무 커요.')
  return stateSchema.parse(JSON.parse(await file.text()))
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const db = await open()
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly')
      const request = tx.objectStore('saves').get('preferences')
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    const result = preferencesSchema.safeParse(value)
    return result.success ? result.data : defaultPreferences()
  } catch {
    return defaultPreferences()
  }
}
let preferenceWrites: Promise<void> = Promise.resolve()
export function savePreferences(preferences: Preferences) {
  const snapshot = preferencesSchema.parse(preferences)
  const write = preferenceWrites
    .catch(() => undefined)
    .then(async () => {
      const db = await open()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('saves', 'readwrite')
        tx.objectStore('saves').put(snapshot, 'preferences')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
    })
  preferenceWrites = write
  return write
}
