import type { SfxKey } from './types'

type Ctor = typeof AudioContext

/** Tiny WebAudio blip synth — zero assets, so it ships in the static bundle. */
export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  /** Must be called from a user gesture (the Start tap) to satisfy autoplay policy. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const Ctx: Ctor | undefined =
      typeof window === 'undefined'
        ? undefined
        : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext)
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.5
    this.master.connect(this.ctx.destination)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02)
    }
  }

  play(key: SfxKey): void {
    if (this.muted || !this.ctx || !this.master) return
    switch (key) {
      case 'bond':
        this.blip(660, 0.12, 'sine', 0.3, 990)
        break
      case 'twins':
        this.blip(660, 0.1, 'sine', 0.26, 880)
        this.blip(990, 0.14, 'sine', 0.24, 1320, 0.06)
        break
      case 'golden':
        this.arp([784, 988, 1319, 1568], 0.09, 'triangle', 0.22)
        break
      case 'combo':
        this.blip(880, 0.16, 'square', 0.14, 1760)
        break
      case 'arrow':
        this.blip(720, 0.05, 'triangle', 0.08, 900)
        break
      case 'pulse':
        this.blip(420, 0.16, 'sine', 0.12, 720)
        break
      case 'gem':
        this.blip(1040, 0.05, 'square', 0.07, 1400)
        break
      case 'levelup':
        this.arp([523, 659, 784, 1047], 0.08, 'triangle', 0.22)
        break
      case 'hurt':
        this.blip(200, 0.16, 'sawtooth', 0.18, 90)
        break
      case 'monsterDown':
        this.blip(320, 0.12, 'square', 0.14, 120)
        break
      case 'start':
        this.arp([523, 659, 784], 0.1, 'sine', 0.22)
        break
      case 'win':
        this.arp([523, 659, 784, 1047, 1319], 0.12, 'triangle', 0.24)
        break
      case 'dead':
        this.arp([440, 349, 262, 196], 0.18, 'sawtooth', 0.2)
        break
      case 'tick':
        this.blip(1200, 0.05, 'square', 0.1)
        break
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number, sweepTo?: number, delay = 0): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const t0 = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  private arp(freqs: number[], step: number, type: OscillatorType, gain: number): void {
    freqs.forEach((f, i) => {
      this.blip(f, step * 1.6, type, gain, undefined, i * step)
    })
  }
}
