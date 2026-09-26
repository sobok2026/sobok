import { recipeFor } from '../../content/recipes'
import { STATIONS } from '../../content/stations'
import { operationFor } from '../../features/crafting/rules'
import { cupService, cupSize } from '../../features/inventory/cups'
import { preparationStep } from '../../features/preparation/rules'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import type { ActiveInput } from '../../simulation/work-context'
import type { Preferences } from '../session/preferences'

const assetIds = [
  'bell',
  'ice-cubes',
  'pour-cup',
  'pour-milk',
  'espresso',
  'steam-machine',
  'steam-milk',
  'wipe-table',
] as const

// FLAC rather than a lossy codec: five of these loop, and only a lossless file decodes to the exact sample count
// in every browser, without encoder padding that would put a gap at each wrap. Vite fingerprints each URL, so
// the files can be cached forever.
const assetUrls = import.meta.glob<string>('./sounds/*.flac', { eager: true, import: 'default', query: '?no-inline' })
type Asset = (typeof assetIds)[number]
type WorkSound = 'ice' | 'complete' | 'serve'
type WorkLoop = 'pour-cup' | 'pour-milk' | 'espresso' | 'steam' | 'wipe-table'
export type SoundStatus = 'off' | 'idle' | 'loading' | 'ready' | 'blocked' | 'unavailable'
type Voice = { source: AudioBufferSourceNode; gain: GainNode }

export function createWorkSounds(onStatus: (status: SoundStatus) => void) {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let muted = true
  let volume = 0.35
  let disposed = false
  let loading: Promise<void> | null = null
  let generation = 0
  let lastCueAt = -1
  let lastCue: WorkSound | null = null
  let loop: { kind: WorkLoop; voice: Voice } | null = null
  let nextSteam = 0
  const buffers = new Map<Asset, AudioBuffer>()
  const voices = new Set<Voice>()
  const abort = new AbortController()

  const notify = (status: SoundStatus) => {
    if (!disposed) onStatus(muted ? 'off' : status)
  }

  function stopVoice(voice: Voice) {
    if (!context) return
    voice.gain.gain.cancelScheduledValues(context.currentTime)
    voice.gain.gain.setTargetAtTime(0, context.currentTime, 0.006)
    voice.source.stop(context.currentTime + 0.03)
  }

  function stop() {
    generation++
    if (loop) stopVoice(loop.voice)
    loop = null
    for (const voice of voices) stopVoice(voice)
    voices.clear()
  }

  function configure(preferences: Preferences) {
    muted = preferences.muted
    volume = preferences.volume
    if (master && context) master.gain.setTargetAtTime(muted ? 0 : volume * 0.8, context.currentTime, 0.015)
    if (muted || volume === 0) stop()
    notify(currentStatus())
  }

  function currentStatus(): SoundStatus {
    if (loading) return 'loading'
    if (!context) return 'idle'
    return context.state === 'running' && buffers.size === assetIds.length ? 'ready' : 'blocked'
  }

  async function unlock() {
    if (disposed || muted) return
    try {
      if (!context) {
        context = new AudioContext()
        master = context.createGain()
        master.gain.value = volume * 0.8
        master.connect(context.destination)
        context.onstatechange = () => {
          if (context?.state !== 'running') notify('blocked')
          else if (buffers.size === assetIds.length) notify('ready')
        }
      }

      if (context.state !== 'running') await context.resume()
      if (disposed || muted) return

      if (context.state !== 'running') {
        notify('blocked')
        return
      }

      if (!loading && buffers.size !== assetIds.length) {
        notify('loading')
        const audioContext = context
        loading = Promise.all(
          assetIds
            .filter((id) => !buffers.has(id))
            .map(async (id) => {
              const response = await fetch(assetUrls[`./sounds/${id}.flac`]!, { signal: abort.signal })
              if (!response.ok) throw new Error('Sound unavailable')
              const buffer = await audioContext.decodeAudioData(await response.arrayBuffer())
              if (!disposed) buffers.set(id, buffer)
            }),
        )
          .then(() => undefined)
          .finally(() => {
            loading = null
          })
      }

      if (loading) await loading
      notify('ready')
    } catch {
      notify('unavailable')
    }
  }

  function createVoice(asset: Asset, level: number, rate = 1, delay = 0, repeats = false): Voice | null {
    const buffer = buffers.get(asset)
    if (!context || !master || !buffer || muted || volume === 0 || context.state !== 'running' || disposed) return null
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.playbackRate.value = rate
    source.loop = repeats
    source.connect(gain)
    gain.connect(master)
    const start = context.currentTime + delay
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(level, start + 0.008)
    const voice = { source, gain }
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
      voices.delete(voice)
    }
    source.start(start)

    if (!repeats) {
      const end = start + buffer.duration / rate
      gain.gain.setValueAtTime(level, Math.max(start + 0.008, end - 0.015))
      gain.gain.linearRampToValueAtTime(0, end)
      source.stop(end + 0.01)
    }

    return voice
  }

  function hit(asset: Asset, level: number, rate = 1, delay = 0) {
    while (voices.size >= 3) {
      const first = voices.values().next().value as Voice
      stopVoice(first)
      voices.delete(first)
    }

    const voice = createVoice(asset, level, rate, delay)
    if (voice) voices.add(voice)
  }

  function play(sound: WorkSound) {
    if (!context || muted || volume === 0 || disposed || context.state !== 'running') return
    if (sound === lastCue && context.currentTime - lastCueAt < 0.06) return
    lastCue = sound
    lastCueAt = context.currentTime

    switch (sound) {
      case 'ice':
        hit('ice-cubes', 0.6)
        break
      case 'complete':
        hit('bell', 0.25, 0.95)
        break
      case 'serve':
        hit('bell', 0.22)
        break
    }
  }

  function setLoop(kind: WorkLoop | null) {
    if (muted || volume === 0 || context?.state !== 'running') kind = null
    if (loop?.kind === kind) return
    if (loop) stopVoice(loop.voice)
    loop = null
    if (!kind) return
    const steamAsset = nextSteam % 2 === 0 ? 'steam-machine' : 'steam-milk'
    const asset = kind === 'steam' ? steamAsset : kind
    const voice = createVoice(asset, kind === 'wipe-table' ? 0.6 : 0.75, 1, 0, true)

    if (voice) {
      loop = { kind, voice }
      if (kind === 'steam') nextSteam++
    }
  }

  return {
    configure,
    unlock,
    play,
    setLoop,
    stop,
    async preview() {
      const current = generation
      await unlock()
      if (current === generation) play('serve')
    },
    dispose() {
      stop()
      disposed = true
      abort.abort()
      buffers.clear()

      if (context) {
        context.onstatechange = null
        void context.close().catch(() => undefined)
      }

      context = null
      master = null
    },
  }
}

function newError(previous: GameState, current: GameState) {
  const message = current.messages.at(-1)
  return message?.id !== previous.messages.at(-1)?.id && message?.tone === 'error'
}

function completedWork(previous: GameState, current: GameState) {
  return (
    current.totals.prepared > previous.totals.prepared ||
    current.totals.washed > previous.totals.washed ||
    current.totals.cleaned > previous.totals.cleaned
  )
}

export function actionSound(action: Action, previous: GameState, current: GameState): WorkSound | null {
  if (newError(previous, current)) return null
  if (current.totals.served > previous.totals.served) return 'serve'
  if (completedWork(previous, current)) return 'complete'
  if (
    action.type === 'confirm-craft' &&
    current.cup &&
    previous.cup?.id === current.cup.id &&
    current.cup.craft.cursor > previous.cup.craft.cursor &&
    current.cup.craft.cursor ===
      recipeFor(
        current.cup.recipe,
        cupSize(current.cup.craft.kind),
        cupService(current.cup.craft.kind),
        current.cup.craft.customizations,
      ).steps.length
  )
    return 'complete'

  if (action.type === 'use-start' && previous.cup && current.cup) {
    const op = operationFor(previous.cup.recipe, previous.cup.craft)
    if (current.cup.craft.progress > previous.cup.craft.progress)
      return op?.operation.action === 'add' && op.operation.materialId === 'ice' ? 'ice' : null
  }

  return null
}

export function tickSound(previous: GameState, current: GameState): WorkSound | null {
  if (newError(previous, current)) return null
  if (
    completedWork(previous, current) ||
    previous.jobs.some((job) => job.endsAt <= current.time && !current.jobs.some((item) => item.id === job.id))
  )
    return 'complete'
  return null
}

export function workLoop(state: GameState, input: ActiveInput, position: GameState['position']): WorkLoop | null {
  if (input?.kind === 'clean') return state.cleaning?.stage === 'wipe' ? 'wipe-table' : null
  if (input?.kind === 'cold') return state.coldBrew?.step === 1 ? 'pour-cup' : null

  if (input?.kind === 'prep' && state.preparation) {
    const step = preparationStep(state.preparation)
    if (step?.kind === 'pour')
      return step.operation.action === 'add' && ['milk', 'cream'].includes(step.operation.materialId)
        ? 'pour-milk'
        : 'pour-cup'
  }

  if (input?.kind === 'drink' && state.cup) {
    const op = operationFor(state.cup.recipe, state.cup.craft)
    if (op?.kind === 'pour')
      return op.operation.action === 'add' && ['milk', 'cream'].includes(op.operation.materialId)
        ? 'pour-milk'
        : 'pour-cup'
  }

  const machine = state.jobs
    .filter(
      (job) =>
        job.kind === 'production' &&
        ['steam-wand', 'espresso-machine'].includes(job.equipmentId ?? '') &&
        job.endsAt > state.time,
    )
    .map((job) => ({
      job,
      distance: Math.hypot(position[0] - STATIONS[job.station].x, position[1] - STATIONS[job.station].z),
    }))
    .filter((item) => item.distance <= 3.5)
    .sort((a, b) => a.distance - b.distance)[0]
  if (!machine) return null
  return machine.job.equipmentId === 'steam-wand' ? 'steam' : 'espresso'
}
