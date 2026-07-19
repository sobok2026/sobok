import type { MonsterKey } from './config'

export type Phase = 'ready' | 'playing' | 'levelup' | 'result'

export type PersonState = 'wander' | 'ready' | 'rushing' | 'bonding' | 'spent'

/** Couples form only between opposite genders. */
export type Gender = 'f' | 'm'

export type ToastKind = 'twins' | 'triplets' | 'golden' | 'combo' | 'levelup'

export type SfxKey =
  | 'bond'
  | 'twins'
  | 'golden'
  | 'combo'
  | 'arrow'
  | 'pulse'
  | 'gem'
  | 'levelup'
  | 'hurt'
  | 'monsterDown'
  | 'start'
  | 'win'
  | 'dead'
  | 'tick'

export interface Vec {
  x: number
  y: number
}

export interface Cupid {
  x: number
  y: number
  hp: number
  maxHp: number
  invuln: number
  /** Facing, for drawing. */
  facing: number
}

export interface Person {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  /** Character identity chosen at spawn (e.g. 'girl-3'); render picks the art state (base/heart). */
  characterId: string
  size: number
  wobble: number
  wobbleSpeed: number
  state: PersonState
  /** 0..1 — filled by the aura and love arrows; at 1 the person goes looking for a partner. */
  love: number
  gender: Gender
  golden: boolean
  partnerId: number
  target: Vec
  life: number
  intro: number
}

export interface Monster {
  id: number
  kind: MonsterKey
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  size: number
  hitFlash: number
  intro: number
}

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  pierce: number
  hit: Set<number>
}

export interface Pulse {
  x: number
  y: number
  radius: number
  maxRadius: number
  hit: Set<number>
}

export interface Gem {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  value: number
  magnet: boolean
  born: number
}

export interface Baby {
  id: number
  x: number
  y: number
  vy: number
  emoji: string
  life: number
  maxLife: number
  pop: number
  drift: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
  kind: 'heart' | 'spark' | 'ring'
}

export interface Floater {
  x: number
  y: number
  vy: number
  life: number
  maxLife: number
  text: string
  color: string
  size: number
}

export interface Toast {
  id: number
  kind: ToastKind
  text: string
}

export type UpgradeId =
  | 'auraRadius'
  | 'auraRate'
  | 'arrowCount'
  | 'arrowRate'
  | 'pulse'
  | 'moveSpeed'
  | 'magnet'
  | 'twins'
  | 'maxHp'
  | 'regen'

export interface UpgradeChoice {
  id: UpgradeId
  /** Stack level the player would be at after taking this (for the "Lv.n" tag). */
  nextLevel: number
}

export interface HudSnapshot {
  phase: Phase
  score: number
  combo: number
  comboFrac: number
  multiplier: number
  /** Seconds survived so far (counts up — the run is endless). */
  elapsed: number
  intensity: number
  level: number
  xp: number
  xpToNext: number
  hp: number
  maxHp: number
}

export interface RunSummary {
  score: number
  level: number
  /** Total seconds survived. */
  survived: number
  bestCombo: number
  best: boolean
  grade: Grade
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface GameCallbacks {
  onHud?: (hud: HudSnapshot) => void
  onPhase?: (phase: Phase, summary?: RunSummary) => void
  onToast?: (toast: Toast) => void
  onSfx?: (key: SfxKey) => void
  onLevelUp?: (choices: UpgradeChoice[]) => void
}
