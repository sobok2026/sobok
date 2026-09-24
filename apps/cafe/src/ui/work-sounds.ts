import { RECIPES, STATIONS } from '../game/catalog'
import { CLEANING_SECONDS } from '../game/cleaning'
import { coldBrewStep } from '../game/cold-brew'
import { isContinuous, operationFor, readyToConfirm } from '../game/crafting'
import type { Preferences } from '../game/preferences'
import { preparationStep } from '../game/preparation'
import type { GameState } from '../game/state'
import type { Action, CafeStore } from '../game/store'
import { WASH_STEPS } from '../game/washing'

const assetIds = ['pump', 'cup', 'ice', 'confirm', 'bell', 'error', 'cloth', 'water', 'steam'] as const
type Asset = (typeof assetIds)[number]
export type WorkSound = 'pump' | 'cup' | 'ice' | 'ready' | 'confirm' | 'complete' | 'serve' | 'error'
export type WorkLoop = 'water' | 'steam' | 'cloth'
export type SoundStatus = 'off' | 'idle' | 'loading' | 'ready' | 'blocked' | 'unavailable'
type ActiveInput = ReturnType<CafeStore['getActiveInput']>
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
    notify(
      loading
        ? 'loading'
        : !context
          ? 'idle'
          : context.state === 'running' && buffers.size === assetIds.length
            ? 'ready'
            : 'blocked',
    )
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
              const response = await fetch(`/audio/${id}.wav`, { signal: abort.signal })
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
    if (sound === lastCue && context.currentTime - lastCueAt < (sound === 'error' ? 0.16 : 0.06)) return
    lastCue = sound
    lastCueAt = context.currentTime
    switch (sound) {
      case 'pump':
        hit('pump', 0.45)
        break
      case 'cup':
        hit('cup', 0.35, 0.95)
        break
      case 'ice':
        hit('ice', 0.4)
        break
      case 'ready':
        hit('confirm', 0.25, 1.1)
        break
      case 'confirm':
        hit('confirm', 0.35)
        break
      case 'complete':
        hit('bell', 0.25, 0.95)
        break
      case 'serve':
        hit('cup', 0.35)
        hit('bell', 0.22, 1, 0.12)
        break
      case 'error':
        hit('error', 0.32, 0.8)
        hit('error', 0.18, 0.8, 0.1)
        break
    }
  }
  function setLoop(kind: WorkLoop | null) {
    if (muted || volume === 0 || context?.state !== 'running') kind = null
    if (loop?.kind === kind) return
    if (loop) stopVoice(loop.voice)
    loop = null
    if (!kind) return
    const voice = createVoice(kind, kind === 'steam' ? 0.25 : 0.5, 1, 0, true)
    if (voice) loop = { kind, voice }
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
export function actionSound(
  action: Action,
  previous: GameState,
  current: GameState,
  input: ActiveInput,
): WorkSound | null {
  if (newError(previous, current)) return 'error'
  if (current.totals.served > previous.totals.served) return 'serve'
  if (completedWork(previous, current)) return 'complete'
  if (
    action.type === 'confirm-craft' &&
    current.cup &&
    previous.cup?.id === current.cup.id &&
    current.cup.step > previous.cup.step &&
    current.cup.step === RECIPES[current.cup.recipe].steps.length
  )
    return 'complete'
  const changedMessage = previous.messages.at(-1)?.id !== current.messages.at(-1)?.id
  if (
    [
      'confirm-craft',
      'prep-confirm',
      'cold-confirm',
      'wash-confirm',
      'clean-confirm',
      'label-batch',
      'ticket',
    ].includes(action.type) &&
    changedMessage
  )
    return 'confirm'
  if (action.type === 'use-start' && previous.cup && current.cup) {
    const op = operationFor(previous.cup.recipe, previous.cup.step, previous.cup.craft)
    if (current.cup.craft.progress > previous.cup.craft.progress)
      return op?.kind === 'ice' || op?.kind === 'sprinkle' ? 'ice' : op?.kind === 'lid' ? 'cup' : 'pump'
    if (current.jobs.length > previous.jobs.length) return 'pump'
    if (input?.kind === 'drink' && op?.kind === 'stir') return 'cup'
  }
  if (action.type === 'prep-use' && previous.preparation && current.preparation) {
    if (current.preparation.progress > previous.preparation.progress || current.jobs.length > previous.jobs.length)
      return 'pump'
    if (input?.kind === 'prep' && preparationStep(current.preparation).kind === 'stir') return 'cup'
  }
  if (
    changedMessage &&
    [
      'take-cup',
      'place-cup',
      'pick-cup',
      'tool',
      'prep-tool',
      'wash-tool',
      'clean-tool',
      'collect-cup',
      'drop-used-cups',
      'take-washed',
      'rack',
      'place-supply',
      'return-supply',
      'store-batch',
      'take-batch',
      'return-batch',
      'cold-tool',
      'collect-cold-brew',
    ].includes(action.type)
  )
    return 'cup'
  return null
}
export function tickSound(previous: GameState, current: GameState): WorkSound | null {
  if (newError(previous, current)) return 'error'
  if (
    completedWork(previous, current) ||
    previous.jobs.some((job) => job.endsAt <= current.time && !current.jobs.some((item) => item.id === job.id))
  )
    return 'complete'
  const cup = current.cup
  if (cup && previous.cup?.id === cup.id && previous.cup.step === cup.step && !cup.craft.fault) {
    const op = operationFor(cup.recipe, cup.step, cup.craft)
    if (
      op &&
      isContinuous(op) &&
      readyToConfirm(op, cup.craft.progress) &&
      !readyToConfirm(op, previous.cup.craft.progress)
    )
      return 'ready'
  }
  const prep = current.preparation
  if (
    prep?.stage === 'measuring' &&
    previous.preparation?.id === prep.id &&
    previous.preparation.step === prep.step &&
    !prep.fault
  ) {
    const step = preparationStep(prep)
    const target = step.target * (1 - step.tolerance)
    if (prep.progress >= target && previous.preparation.progress < target) return 'ready'
  }
  const wash = current.washing
  if (
    wash &&
    (wash.stage === 'scrub' || wash.stage === 'rinse') &&
    previous.washing?.id === wash.id &&
    previous.washing.stage === wash.stage &&
    wash.progress >= WASH_STEPS[wash.stage].seconds &&
    previous.washing.progress < WASH_STEPS[wash.stage].seconds
  )
    return 'ready'
  const cleaning = current.cleaning
  if (
    cleaning &&
    cleaning.stage !== 'collect' &&
    previous.cleaning?.id === cleaning.id &&
    previous.cleaning.stage === cleaning.stage &&
    cleaning.progress >= CLEANING_SECONDS[cleaning.stage] &&
    previous.cleaning.progress < CLEANING_SECONDS[cleaning.stage]
  )
    return 'ready'
  const brew = current.coldBrew
  if (
    brew &&
    !brew.fault &&
    brew.stage === 'measuring' &&
    brew.step < 2 &&
    previous.coldBrew?.id === brew.id &&
    previous.coldBrew.step === brew.step
  ) {
    const step = coldBrewStep(brew)
    const target = step.target * (1 - step.tolerance)
    if (brew.progress >= target && previous.coldBrew.progress < target) return 'ready'
  }
  return null
}
export function workLoop(state: GameState, input: ActiveInput, position: GameState['position']): WorkLoop | null {
  if (input?.kind === 'clean') return 'cloth'
  if (input?.kind === 'cold') return state.coldBrew?.step === 0 ? 'cloth' : 'water'
  if (input?.kind === 'wash') return state.washing?.stage === 'rinse' ? 'water' : 'cloth'
  if (input?.kind === 'prep' && state.preparation)
    return preparationStep(state.preparation).kind === 'pour' ? 'water' : null
  if (input?.kind === 'drink' && state.cup) {
    const op = operationFor(state.cup.recipe, state.cup.step, state.cup.craft)
    if (op && ['pour', 'steam', 'drizzle', 'transfer'].includes(op.kind)) return 'water'
  }
  const machine = state.jobs
    .filter((job) => job.kind === 'craft-machine' && job.endsAt > state.time)
    .map((job) => ({
      job,
      distance: Math.hypot(position[0] - STATIONS[job.station].x, position[1] - STATIONS[job.station].z),
    }))
    .filter((item) => item.distance <= 3.5)
    .sort((a, b) => a.distance - b.distance)[0]
  return machine ? (machine.job.machine === 'steam' ? 'steam' : 'water') : null
}
