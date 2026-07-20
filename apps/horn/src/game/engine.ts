import { PERSON_ROSTER } from './characters'
import { BABY_EMOJI, CONFIG, MONSTER_KINDS } from './config'
import { makeSeed, Rng } from './rng'
import { pushOutOfWater } from './terrain'
import type {
  Baby,
  Cupid,
  Floater,
  GameCallbacks,
  Gem,
  Gender,
  Grade,
  HudSnapshot,
  Monster,
  Particle,
  Person,
  Phase,
  Projectile,
  Pulse,
  RunSummary,
  UpgradeChoice,
  UpgradeId,
  Vec,
} from './types'

const HEART_HUE = 335
const GOLD_HUE = 45

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function gradeFor(score: number): Grade {
  if (score >= 400) return 'S'
  if (score >= 280) return 'A'
  if (score >= 170) return 'B'
  if (score >= 90) return 'C'
  return 'D'
}

interface Weapons {
  auraRadius: number
  auraRate: number
  arrowCount: number
  arrowCooldown: number
  arrowTimer: number
  pulseUnlocked: boolean
  pulseCooldown: number
  pulseTimer: number
  moveSpeed: number
  pickupRadius: number
  twinsBonus: number
  regen: number
}

const UPGRADES: { id: UpgradeId; max: number; apply: (w: World) => void }[] = [
  {
    id: 'auraRadius',
    max: 6,
    apply: (w) => {
      w.weapons.auraRadius *= 1.16
    },
  },
  {
    id: 'auraRate',
    max: 6,
    apply: (w) => {
      w.weapons.auraRate += 0.2
    },
  },
  {
    id: 'arrowCount',
    max: 5,
    apply: (w) => {
      w.weapons.arrowCount += 1
    },
  },
  {
    id: 'arrowRate',
    max: 5,
    apply: (w) => {
      w.weapons.arrowCooldown *= 0.82
    },
  },
  {
    id: 'pulse',
    max: 5,
    apply: (w) => {
      if (!w.weapons.pulseUnlocked) w.weapons.pulseUnlocked = true
      else w.weapons.pulseCooldown *= 0.84
    },
  },
  {
    id: 'moveSpeed',
    max: 5,
    apply: (w) => {
      w.weapons.moveSpeed *= 1.12
    },
  },
  {
    id: 'magnet',
    max: 4,
    apply: (w) => {
      w.weapons.pickupRadius *= 1.28
    },
  },
  {
    id: 'twins',
    max: 5,
    apply: (w) => {
      w.weapons.twinsBonus += 0.08
    },
  },
  {
    id: 'maxHp',
    max: 5,
    apply: (w) => {
      w.cupid.maxHp += 20
      w.cupid.hp = Math.min(w.cupid.maxHp, w.cupid.hp + 25)
    },
  },
  {
    id: 'regen',
    max: 5,
    apply: (w) => {
      w.weapons.regen += 0.7
    },
  },
]

export interface World {
  /** Visible view size in WORLD units (= css px / scale). */
  width: number
  height: number
  /** Screen px per world unit (responsive camera zoom). */
  scale: number
  phase: Phase
  /** Difficulty-ramp window in seconds; the run itself is endless (ends only on death). */
  duration: number
  elapsed: number
  score: number
  combo: number
  comboTimer: number
  bestCombo: number
  multiplier: number
  level: number
  xp: number
  xpToNext: number
  intensity: number
  shake: number
  cupid: Cupid
  move: Vec
  /** Top-left of the view in world space; follows the cupid so the map is infinite. */
  camera: Vec
  weapons: Weapons
  upgradeLevels: Record<UpgradeId, number>
  people: Person[]
  monsters: Monster[]
  projectiles: Projectile[]
  pulses: Pulse[]
  gems: Gem[]
  babies: Baby[]
  particles: Particle[]
  floaters: Floater[]
  spawnPersonAcc: number
  monsterTimer: number
}

export class Game {
  world: World
  reducedMotion = false
  private cb: GameCallbacks
  private rng: Rng
  private nextId = 1
  private isPaused = false

  constructor(cb: GameCallbacks = {}) {
    this.cb = cb
    this.rng = new Rng(makeSeed())
    this.world = this.freshWorld()
  }

  private freshWorld(): World {
    const w = this.world?.width ?? 0
    const h = this.world?.height ?? 0
    const scale = this.world?.scale ?? 1
    return {
      width: w,
      height: h,
      scale,
      phase: 'ready',
      duration: CONFIG.duration,
      elapsed: 0,
      score: 0,
      combo: 0,
      comboTimer: 0,
      bestCombo: 0,
      multiplier: 1,
      level: 1,
      xp: 0,
      xpToNext: CONFIG.level.base,
      intensity: 0.15,
      shake: 0,
      cupid: { x: w / 2, y: h / 2, hp: CONFIG.cupid.maxHp, maxHp: CONFIG.cupid.maxHp, invuln: 0, facing: 0 },
      move: { x: 0, y: 0 },
      camera: { x: 0, y: 0 },
      weapons: {
        auraRadius: CONFIG.aura.radius,
        auraRate: CONFIG.aura.rate,
        arrowCount: CONFIG.arrow.count,
        arrowCooldown: CONFIG.arrow.cooldown,
        arrowTimer: CONFIG.arrow.cooldown * 0.5,
        pulseUnlocked: false,
        pulseCooldown: CONFIG.pulse.cooldown,
        pulseTimer: CONFIG.pulse.cooldown,
        moveSpeed: CONFIG.cupid.speed,
        pickupRadius: CONFIG.cupid.pickupRadius,
        twinsBonus: 0,
        regen: CONFIG.cupid.regen,
      },
      upgradeLevels: {
        auraRadius: 0,
        auraRate: 0,
        arrowCount: 0,
        arrowRate: 0,
        pulse: 0,
        moveSpeed: 0,
        magnet: 0,
        twins: 0,
        maxHp: 0,
        regen: 0,
      },
      people: [],
      monsters: [],
      projectiles: [],
      pulses: [],
      gems: [],
      babies: [],
      particles: [],
      floaters: [],
      spawnPersonAcc: 0,
      monsterTimer: CONFIG.monster.firstSpawn,
    }
  }

  resize(cssWidth: number, cssHeight: number): void {
    const w = this.world
    const short = Math.min(cssWidth, cssHeight)
    const scale = clamp(short / CONFIG.view.referenceShortEdge, CONFIG.view.minScale, CONFIG.view.maxScale)
    w.scale = scale
    w.width = cssWidth / scale
    w.height = cssHeight / scale
    if (w.cupid.x === 0 && w.cupid.y === 0) {
      w.cupid.x = w.width / 2
      w.cupid.y = w.height / 2
    }
    w.camera.x = w.cupid.x - w.width / 2
    w.camera.y = w.cupid.y - w.height / 2
    if (w.phase === 'ready' && w.people.length === 0 && cssWidth > 0 && cssHeight > 0) {
      const target = this.targetPersonCount()
      for (let i = 0; i < target; i++) this.spawnPerson()
    }
  }

  private viewRadius(): number {
    return 0.5 * Math.hypot(this.world.width, this.world.height)
  }

  start(): void {
    this.rng = new Rng(makeSeed())
    this.nextId = 1
    this.isPaused = false
    this.world = this.freshWorld()
    this.world.phase = 'playing'
    this.world.cupid.x = this.world.width / 2
    this.world.cupid.y = this.world.height / 2
    const target = this.targetPersonCount()
    for (let i = 0; i < target; i++) this.spawnPerson()
    this.cb.onSfx?.('start')
    this.pushHud()
    this.cb.onPhase?.('playing')
  }

  setMove(x: number, y: number): void {
    this.world.move.x = x
    this.world.move.y = y
  }

  get paused(): boolean {
    return this.isPaused
  }

  /** Toggle pause — only meaningful mid-run. Returns the new paused state. */
  togglePause(): boolean {
    if (this.world.phase !== 'playing') return this.isPaused
    this.isPaused = !this.isPaused
    return this.isPaused
  }

  chooseUpgrade(id: UpgradeId): void {
    const w = this.world
    if (w.phase !== 'levelup') return
    const def = UPGRADES.find((u) => u.id === id)
    if (def) {
      def.apply(w)
      w.upgradeLevels[id] = (w.upgradeLevels[id] ?? 0) + 1
    }
    w.phase = 'playing'
    this.pushHud()
    this.cb.onPhase?.('playing')
  }

  private targetPersonCount(): number {
    const { width, height, elapsed } = this.world
    const area = Math.max(1, width * height)
    const base = Math.round((area * CONFIG.person.regionFactor) / CONFIG.person.areaPerPerson)
    const ramp = Math.floor((elapsed / 60) * CONFIG.person.growthPerMinute)
    return clamp(base + ramp, CONFIG.person.minCount, CONFIG.person.maxCount)
  }

  private spawnPerson(): Person {
    const w = this.world
    const size = CONFIG.person.size * this.rng.range(0.9, 1.15)
    const golden = this.rng.chance(CONFIG.person.goldenChance)
    const ang = this.rng.range(0, Math.PI * 2)
    const speed = CONFIG.person.wanderSpeed
    const gender: Gender = this.rng.chance(0.5) ? 'f' : 'm'
    // On the title screen fill the view; in play spawn around the player (some just off-screen).
    const vr = this.viewRadius()
    const rr = w.phase === 'ready' ? this.rng.range(vr * 0.1, vr * 0.85) : this.rng.range(vr * 0.6, vr * 1.3)
    const pang = this.rng.range(0, Math.PI * 2)
    const person: Person = {
      id: this.nextId++,
      x: w.cupid.x + Math.cos(pang) * rr,
      y: w.cupid.y + Math.sin(pang) * rr,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      characterId: this.rng.pick(PERSON_ROSTER[gender]),
      size,
      wobble: this.rng.range(0, Math.PI * 2),
      wobbleSpeed: this.rng.range(3.5, 6),
      state: 'wander',
      love: this.rng.range(0, 0.1),
      gender,
      golden,
      partnerId: -1,
      target: { x: 0, y: 0 },
      life: 0,
      intro: 0,
    }
    this.world.people.push(person)
    return person
  }

  private byId(id: number): Person | undefined {
    for (const a of this.world.people) if (a.id === id) return a
    return undefined
  }

  private nearestReady(a: Person): Person | undefined {
    let best: Person | undefined
    let bestD = CONFIG.person.readyDetect ** 2
    for (const b of this.world.people) {
      if (b.state !== 'ready' || b.id === a.id || b.gender === a.gender) continue
      const d = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    return best
  }

  // ---- update ------------------------------------------------------------

  update(dt: number): void {
    const w = this.world

    // Camera keeps the cupid centered — this is what makes the map feel infinite.
    w.camera.x = w.cupid.x - w.width / 2
    w.camera.y = w.cupid.y - w.height / 2

    if (this.isPaused || w.phase === 'levelup' || w.phase === 'result') {
      // Frozen — paused by the player, or held for a level-up choice / game over.
      return
    }

    if (w.phase === 'playing') {
      w.elapsed += dt
      if (w.combo > 0) {
        w.comboTimer -= dt
        if (w.comboTimer <= 0) {
          w.combo = 0
          w.comboTimer = 0
          w.multiplier = 1
        }
      }
      this.updateCupid(dt)
      this.updateWeapons(dt)
      this.updateProjectiles(dt)
      this.updatePulses(dt)
      this.updateMonsters(dt)
    }

    // Persons drift on the title screen too (ambient backdrop).
    this.updatePeople(dt)

    if (w.phase === 'playing') {
      this.resolveMeets()
      this.spawnMaintenance(dt)
      this.updateGems(dt)
      w.intensity = clamp(0.15 + w.score / 300 + w.combo * 0.02, 0, 1)
    }

    this.updateEffects(dt)

    if (w.phase === 'playing') {
      this.pushHud()
      // Endless survival — the only way out is running out of 기력.
      if (w.cupid.hp <= 0) this.end()
    }
  }

  private updateCupid(dt: number): void {
    const w = this.world
    const c = w.cupid
    const mag = Math.hypot(w.move.x, w.move.y)
    if (mag > 0.01) {
      const nx = w.move.x / mag
      const ny = w.move.y / mag
      c.x += nx * w.weapons.moveSpeed * dt
      c.y += ny * w.weapons.moveSpeed * dt
      c.facing = nx
    }
    // No bounds — the city is infinite; the camera follows. But you can't walk on water.
    const pushed = pushOutOfWater(c.x, c.y, CONFIG.cupid.size * 0.4)
    c.x = pushed.x
    c.y = pushed.y
    if (c.invuln > 0) c.invuln -= dt
    if (c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + w.weapons.regen * dt)
  }

  private updateWeapons(dt: number): void {
    const w = this.world
    const c = w.cupid

    // Aura passively woos wandering people in range.
    const r2 = w.weapons.auraRadius * w.weapons.auraRadius
    for (const a of w.people) {
      if (a.state !== 'wander') continue
      const dx = a.x - c.x
      const dy = a.y - c.y
      if (dx * dx + dy * dy <= r2) {
        a.love = clamp(a.love + w.weapons.auraRate * dt, 0, 1)
        if (a.love >= 1) a.state = 'ready'
      }
    }

    // Aura also burns monsters caught inside it — love hurts them.
    for (const m of w.monsters) {
      const dx = m.x - c.x
      const dy = m.y - c.y
      if (dx * dx + dy * dy <= r2) this.hurtMonster(m, CONFIG.aura.monsterDamage * dt)
    }

    // Auto love-arrows.
    w.weapons.arrowTimer -= dt
    if (w.weapons.arrowTimer <= 0) {
      w.weapons.arrowTimer = w.weapons.arrowCooldown
      this.fireArrows()
    }

    // Heart pulse.
    if (w.weapons.pulseUnlocked) {
      w.weapons.pulseTimer -= dt
      if (w.weapons.pulseTimer <= 0) {
        w.weapons.pulseTimer = w.weapons.pulseCooldown
        w.pulses.push({ x: c.x, y: c.y, radius: 0, maxRadius: CONFIG.pulse.maxRadius, hit: new Set() })
        this.cb.onSfx?.('pulse')
      }
    }
  }

  private aimDir(): Vec {
    const w = this.world
    const c = w.cupid
    // Only lock onto things within reach — otherwise arrows chase far off-screen monsters and whiff.
    const range2 = (this.viewRadius() * 0.8) ** 2
    let best: { x: number; y: number } | null = null
    let bestD = range2
    for (const m of w.monsters) {
      const d = (m.x - c.x) ** 2 + (m.y - c.y) ** 2
      if (d < bestD) {
        bestD = d
        best = m
      }
    }
    if (!best) {
      for (const a of w.people) {
        if (a.state !== 'wander') continue
        const d = (a.x - c.x) ** 2 + (a.y - c.y) ** 2
        if (d < bestD) {
          bestD = d
          best = a
        }
      }
    }
    if (best) {
      const dx = best.x - c.x
      const dy = best.y - c.y
      const d = Math.hypot(dx, dy) || 1
      return { x: dx / d, y: dy / d }
    }
    // Nothing in range — fire where the player is heading.
    const mag = Math.hypot(w.move.x, w.move.y)
    if (mag > 0.01) return { x: w.move.x / mag, y: w.move.y / mag }
    const a = this.rng.range(0, Math.PI * 2)
    return { x: Math.cos(a), y: Math.sin(a) }
  }

  private fireArrows(): void {
    const w = this.world
    const c = w.cupid
    const dir = this.aimDir()
    const baseAng = Math.atan2(dir.y, dir.x)
    const n = w.weapons.arrowCount
    const spread = 0.26
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * (n - 1)
      const ang = baseAng + off
      w.projectiles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(ang) * CONFIG.arrow.speed,
        vy: Math.sin(ang) * CONFIG.arrow.speed,
        life: CONFIG.arrow.life,
        pierce: CONFIG.arrow.pierce,
        hit: new Set(),
      })
    }
    this.cb.onSfx?.('arrow')
  }

  private updateProjectiles(dt: number): void {
    const w = this.world
    for (const p of w.projectiles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      // (No screen-bounds cull — the map is infinite; `life` retires projectiles.)
      // Monsters first (defense), then people (charm).
      for (const m of w.monsters) {
        if (p.hit.has(m.id)) continue
        const rr = (m.size / 2 + CONFIG.arrow.size / 2) ** 2
        if ((m.x - p.x) ** 2 + (m.y - p.y) ** 2 <= rr) {
          this.hurtMonster(m, CONFIG.arrow.damage)
          p.hit.add(m.id)
          if (p.pierce <= 0) {
            p.life = 0
            break
          }
          p.pierce--
        }
      }
      if (p.life <= 0) continue
      for (const a of w.people) {
        if (a.state !== 'wander' || p.hit.has(a.id)) continue
        const rr = (a.size / 2 + CONFIG.arrow.size / 2) ** 2
        if ((a.x - p.x) ** 2 + (a.y - p.y) ** 2 <= rr) {
          a.love = clamp(a.love + CONFIG.arrow.charm, 0, 1)
          if (a.love >= 1) a.state = 'ready'
          p.hit.add(a.id)
          if (p.pierce <= 0) {
            p.life = 0
            break
          }
          p.pierce--
        }
      }
    }
    w.projectiles = w.projectiles.filter((p) => p.life > 0)
  }

  private updatePulses(dt: number): void {
    const w = this.world
    for (const pl of w.pulses) {
      pl.radius += CONFIG.pulse.growth * dt
      const r2 = pl.radius * pl.radius
      for (const m of w.monsters) {
        if (pl.hit.has(m.id)) continue
        if ((m.x - pl.x) ** 2 + (m.y - pl.y) ** 2 <= r2) {
          this.hurtMonster(m, CONFIG.pulse.damage)
          pl.hit.add(m.id)
        }
      }
      for (const a of w.people) {
        if (a.state !== 'wander' || pl.hit.has(a.id)) continue
        if ((a.x - pl.x) ** 2 + (a.y - pl.y) ** 2 <= r2) {
          a.love = clamp(a.love + CONFIG.pulse.charm, 0, 1)
          if (a.love >= 1) a.state = 'ready'
          pl.hit.add(a.id)
        }
      }
    }
    w.pulses = w.pulses.filter((pl) => pl.radius < pl.maxRadius)
  }

  private hurtMonster(m: Monster, dmg: number): void {
    if (m.hp <= 0) return // already dying — avoids double gem drops from aura + arrow in one frame
    m.hp -= dmg
    m.hitFlash = 0.12
    if (m.hp <= 0) {
      this.dropGem(m.x, m.y, CONFIG.reward.xpPerMonster)
      this.addParticles(m.x, m.y, 10, GOLD_HUE)
      this.cb.onSfx?.('monsterDown')
    }
  }

  private updateMonsters(dt: number): void {
    const w = this.world
    const c = w.cupid

    // Spawn director — ramps up over the run.
    w.monsterTimer -= dt
    if (w.monsterTimer <= 0) {
      const t = clamp(w.elapsed / w.duration, 0, 1)
      w.monsterTimer = lerp(CONFIG.monster.spawnIntervalStart, CONFIG.monster.spawnIntervalEnd, t)
      this.spawnMonster()
    }

    for (const m of w.monsters) {
      if (m.intro < 1) m.intro = clamp(m.intro + dt / 0.3, 0, 1)
      if (m.hitFlash > 0) m.hitFlash -= dt
      const dx = c.x - m.x
      const dy = c.y - m.y
      const d = Math.hypot(dx, dy) || 1
      m.x += (dx / d) * m.speed * dt
      m.y += (dy / d) * m.speed * dt
      const pushed = pushOutOfWater(m.x, m.y, m.size * 0.4)
      m.x = pushed.x
      m.y = pushed.y
      // Contact damage.
      const touch = (m.size + CONFIG.cupid.size) / 2 - 6
      if (d < touch && c.invuln <= 0) {
        c.hp -= CONFIG.monster.contactDamage
        c.invuln = CONFIG.cupid.invuln
        const k = CONFIG.monster.knockback
        c.x -= (dx / d) * k * dt * 6
        c.y -= (dy / d) * k * dt * 6
        w.shake = clamp(w.shake + CONFIG.juice.shakeOnHit, 0, CONFIG.juice.maxShake)
        this.cb.onSfx?.('hurt')
      }
    }
    // Drop dead monsters and any that fell far behind as the player fled.
    const cull = (this.viewRadius() * 2.4) ** 2
    w.monsters = w.monsters.filter((m) => m.hp > 0 && (m.x - c.x) ** 2 + (m.y - c.y) ** 2 <= cull)
  }

  private spawnMonster(): void {
    const w = this.world
    const minutes = w.elapsed / 60
    const kind = this.rng.pick(MONSTER_KINDS)
    const hp = (CONFIG.monster.hpStart + CONFIG.monster.hpPerMinute * minutes) * kind.hpMul
    const speed = (CONFIG.monster.speedStart + CONFIG.monster.speedPerMinute * minutes) * kind.speedMul
    // Spawn just outside the view, around the player.
    const vr = this.viewRadius()
    const ang = this.rng.range(0, Math.PI * 2)
    const r = this.rng.range(vr * 1.05, vr * 1.28)
    const x = w.cupid.x + Math.cos(ang) * r
    const y = w.cupid.y + Math.sin(ang) * r
    w.monsters.push({
      id: this.nextId++,
      kind: kind.key,
      x,
      y,
      hp,
      maxHp: hp,
      speed,
      size: CONFIG.monster.size,
      hitFlash: 0,
      intro: 0,
    })
  }

  private updatePeople(dt: number): void {
    const w = this.world
    const speed = CONFIG.person.wanderSpeed
    for (const a of w.people) {
      a.wobble += a.wobbleSpeed * dt
      if (a.intro < 1) a.intro = clamp(a.intro + dt / 0.4, 0, 1)

      if (a.state === 'wander') {
        // Steered wander.
        a.vx += this.rng.range(-1, 1) * speed * 2 * dt
        a.vy += this.rng.range(-1, 1) * speed * 2 * dt
        const mag = Math.hypot(a.vx, a.vy) || 1
        a.vx = (a.vx / mag) * speed
        a.vy = (a.vy / mag) * speed
        a.x += a.vx * dt
        a.y += a.vy * dt
      } else if (a.state === 'ready') {
        // Looking for love — drift toward the nearest opposite-gender ready person.
        const mate = this.nearestReady(a)
        if (mate) {
          const dx = mate.x - a.x
          const dy = mate.y - a.y
          const d = Math.hypot(dx, dy) || 1
          a.vx = (dx / d) * CONFIG.person.readySeekSpeed
          a.vy = (dy / d) * CONFIG.person.readySeekSpeed
        } else {
          a.vx += this.rng.range(-1, 1) * speed * 2 * dt
          a.vy += this.rng.range(-1, 1) * speed * 2 * dt
          const mag = Math.hypot(a.vx, a.vy) || 1
          a.vx = (a.vx / mag) * speed
          a.vy = (a.vy / mag) * speed
        }
        a.x += a.vx * dt
        a.y += a.vy * dt
      } else if (a.state === 'rushing') {
        const dx = a.target.x - a.x
        const dy = a.target.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const step = CONFIG.person.seekSpeed * dt
        if (d <= step) {
          a.x = a.target.x
          a.y = a.target.y
        } else {
          a.x += (dx / d) * step
          a.y += (dy / d) * step
        }
      } else if (a.state === 'bonding') {
        a.life -= dt
        if (a.life <= 0) {
          a.state = 'spent'
          a.life = 0.4
        }
      } else if (a.state === 'spent') {
        a.life -= dt
      }
    }

    this.separateWanderers(dt)

    // Reap faded people and recycle wanderers that drifted far off-screen (they respawn near the player).
    const cull = (this.viewRadius() * 1.7) ** 2
    const cx = w.cupid.x
    const cy = w.cupid.y
    w.people = w.people.filter((a) => {
      if (a.state === 'spent' && a.life <= 0) return false
      if ((a.state === 'wander' || a.state === 'ready') && (a.x - cx) ** 2 + (a.y - cy) ** 2 > cull) return false
      return true
    })
  }

  /**
   * Soft-separate WANDER people so they don't stack (readability). ready/rushing/bonding are excluded —
   * they need to converge to pair up. Spatial-grid buckets keep this O(n) instead of O(n²).
   */
  private separateWanderers(dt: number): void {
    const w = this.world
    const cell = CONFIG.person.separationCell
    const grid = new Map<string, Person[]>()
    const cellOf = (p: Person) => `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`
    for (const p of w.people) {
      if (p.state !== 'wander') continue
      const key = cellOf(p)
      const bucket = grid.get(key)
      if (bucket) bucket.push(p)
      else grid.set(key, [p])
    }

    const factor = CONFIG.person.separationFactor
    const rate = Math.min(1, CONFIG.person.separationStrength * dt)
    for (const p of w.people) {
      if (p.state !== 'wander') continue
      const gx = Math.floor(p.x / cell)
      const gy = Math.floor(p.y / cell)
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const bucket = grid.get(`${gx + ox},${gy + oy}`)
          if (!bucket) continue
          for (const q of bucket) {
            if (q.id <= p.id) continue // resolve each pair once
            const dx = p.x - q.x
            const dy = p.y - q.y
            const min = (p.size + q.size) * 0.5 * factor
            const d2 = dx * dx + dy * dy
            if (d2 === 0 || d2 >= min * min) continue
            const d = Math.sqrt(d2)
            const push = ((min - d) * rate) / 2
            const nx = dx / d
            const ny = dy / d
            p.x += nx * push
            p.y += ny * push
            q.x -= nx * push
            q.y -= ny * push
          }
        }
      }
    }
  }

  private resolveMeets(): void {
    const w = this.world
    // Pair up ready people that are near each other.
    for (const a of w.people) {
      if (a.state !== 'ready') continue
      let mate: Person | undefined
      let bestD = CONFIG.person.seekRadius * CONFIG.person.seekRadius
      for (const b of w.people) {
        if (b.state !== 'ready' || b.id === a.id || b.gender === a.gender) continue
        const d = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
        if (d < bestD) {
          bestD = d
          mate = b
        }
      }
      if (mate && a.id < mate.id) this.startPair(a, mate)
    }

    // Rushing pairs that have met bond.
    const meet = CONFIG.person.meetDistance
    for (const a of w.people) {
      if (a.state !== 'rushing' || a.id > a.partnerId) continue
      const b = this.byId(a.partnerId)
      if (!b || b.state !== 'rushing') continue
      const da = Math.hypot(a.x - a.target.x, a.y - a.target.y)
      const db = Math.hypot(b.x - b.target.x, b.y - b.target.y)
      if (da < meet && db < meet) this.bond(a, b)
    }
  }

  private startPair(a: Person, b: Person): void {
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    a.state = 'rushing'
    b.state = 'rushing'
    a.partnerId = b.id
    b.partnerId = a.id
    a.target = mid
    b.target = mid
  }

  private bond(a: Person, b: Person): void {
    const w = this.world
    const r = this.rng
    const p = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

    let babies = 1
    let litter: 'twins' | 'triplets' | null = null
    if (r.chance(CONFIG.reward.tripletsChance)) {
      babies = 3
      litter = 'triplets'
    } else if (r.chance(CONFIG.reward.twinsChance + w.weapons.twinsBonus)) {
      babies = 2
      litter = 'twins'
    }
    const golden = a.golden || b.golden

    w.combo += 1
    w.comboTimer = CONFIG.combo.window
    w.bestCombo = Math.max(w.bestCombo, w.combo)
    w.multiplier = clamp(1 + Math.floor(w.combo / CONFIG.combo.step), 1, CONFIG.combo.maxMultiplier)

    const goldMul = golden ? CONFIG.reward.goldenMultiplier : 1
    const gained = babies * CONFIG.reward.perBaby * w.multiplier * goldMul
    w.score += gained

    this.spawnBabies(p.x, p.y, babies)
    for (let i = 0; i < babies; i++) this.dropGem(p.x + r.range(-12, 12), p.y + r.range(-8, 8), CONFIG.reward.xpPerBaby)
    this.addParticles(p.x, p.y, clamp(10 + gained * 2, 12, 44), golden ? GOLD_HUE : HEART_HUE)
    this.addFloater(p.x, p.y - 16, `+${gained}`, golden ? '#ffdd66' : '#ff9ec4', 24 + Math.min(16, gained))
    w.shake = clamp(w.shake + CONFIG.juice.shakeOnBond + w.combo * CONFIG.juice.shakePerCombo, 0, CONFIG.juice.maxShake)

    if (golden) {
      this.cb.onToast?.({ id: this.nextId++, kind: 'golden', text: '' })
      this.cb.onSfx?.('golden')
    } else if (litter) {
      this.cb.onToast?.({ id: this.nextId++, kind: litter, text: '' })
      this.cb.onSfx?.('twins')
    } else {
      this.cb.onSfx?.('bond')
    }
    if (w.combo >= 3 && w.combo % 5 === 0) {
      this.cb.onToast?.({ id: this.nextId++, kind: 'combo', text: `${w.combo}` })
      this.cb.onSfx?.('combo')
    }

    a.state = 'bonding'
    b.state = 'bonding'
    a.life = CONFIG.person.bondTime
    b.life = CONFIG.person.bondTime
  }

  private spawnMaintenance(dt: number): void {
    const w = this.world
    w.spawnPersonAcc += dt
    if (w.spawnPersonAcc < CONFIG.person.spawnInterval) return
    w.spawnPersonAcc = 0
    const target = this.targetPersonCount()
    let live = w.people.reduce((n, a) => n + (a.state === 'spent' ? 0 : 1), 0)
    // Top up in a small burst so density holds even when the player sprints across the city.
    for (let i = 0; i < CONFIG.person.spawnBurst && live < target; i++) {
      this.spawnPerson()
      live++
    }
  }

  private dropGem(x: number, y: number, value: number): void {
    const ang = this.rng.range(0, Math.PI * 2)
    const spd = this.rng.range(30, 90)
    this.world.gems.push({
      id: this.nextId++,
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      value,
      magnet: false,
      born: 0,
    })
  }

  private updateGems(dt: number): void {
    const w = this.world
    const c = w.cupid
    const pr = w.weapons.pickupRadius
    const pr2 = pr * pr
    for (const g of w.gems) {
      g.born += dt
      if (!g.magnet) {
        g.vx *= 1 - 3 * dt
        g.vy *= 1 - 3 * dt
        g.x += g.vx * dt
        g.y += g.vy * dt
        if ((g.x - c.x) ** 2 + (g.y - c.y) ** 2 <= pr2) g.magnet = true
      } else {
        const dx = c.x - g.x
        const dy = c.y - g.y
        const d = Math.hypot(dx, dy) || 1
        const step = 460 * dt
        g.x += (dx / d) * step
        g.y += (dy / d) * step
        if (d < 16) {
          w.xp += g.value
          g.value = 0
          this.cb.onSfx?.('gem')
        }
      }
    }
    const cull = (this.viewRadius() * 1.8) ** 2
    w.gems = w.gems.filter((g) => g.value > 0 && (g.x - c.x) ** 2 + (g.y - c.y) ** 2 <= cull)

    if (w.xp >= w.xpToNext) this.levelUp()
  }

  private levelUp(): void {
    const w = this.world
    w.xp -= w.xpToNext
    w.level += 1
    w.xpToNext = Math.round(CONFIG.level.base * CONFIG.level.growth ** (w.level - 1))
    const choices = this.rollUpgrades()
    w.phase = 'levelup'
    this.cb.onSfx?.('levelup')
    this.cb.onToast?.({ id: this.nextId++, kind: 'levelup', text: '' })
    this.pushHud()
    this.cb.onLevelUp?.(choices)
    this.cb.onPhase?.('levelup')
  }

  private rollUpgrades(): UpgradeChoice[] {
    const w = this.world
    const pool = UPGRADES.filter((u) => (w.upgradeLevels[u.id] ?? 0) < u.max)
    // Shuffle (Fisher-Yates) with the seeded RNG.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i)
      const tmp = pool[i]
      pool[i] = pool[j]
      pool[j] = tmp
    }
    return pool.slice(0, 3).map((u) => ({ id: u.id, nextLevel: (w.upgradeLevels[u.id] ?? 0) + 1 }))
  }

  private spawnBabies(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const maxLife = this.rng.range(1.1, 1.6)
      this.world.babies.push({
        id: this.nextId++,
        x: x + this.rng.range(-14, 14),
        y: y + this.rng.range(-8, 8),
        vy: this.rng.range(-46, -74),
        emoji: this.rng.pick(BABY_EMOJI),
        life: maxLife,
        maxLife,
        pop: 0,
        drift: this.rng.range(-16, 16),
      })
    }
  }

  private addParticles(x: number, y: number, count: number, hue: number): void {
    const w = this.world
    const budget = this.reducedMotion ? Math.ceil(count / 3) : count
    for (let i = 0; i < budget; i++) {
      if (w.particles.length >= CONFIG.juice.maxParticles) break
      const ang = this.rng.range(0, Math.PI * 2)
      const spd = this.rng.range(40, 220)
      const maxLife = this.rng.range(0.5, 1.1)
      w.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: maxLife,
        maxLife,
        size: this.rng.range(4, 10),
        hue: hue + this.rng.range(-14, 14),
        kind: this.rng.chance(0.55) ? 'heart' : 'spark',
      })
    }
  }

  private addFloater(x: number, y: number, text: string, color: string, size: number): void {
    if (!text) return
    this.world.floaters.push({ x, y, vy: -46, life: 1.1, maxLife: 1.1, text, color, size })
  }

  private updateEffects(dt: number): void {
    const w = this.world
    for (const b of w.babies) {
      b.pop = clamp(b.pop + dt / 0.22, 0, 1)
      b.x += b.drift * dt
      b.y += b.vy * dt
      b.vy += 42 * dt
      b.life -= dt
    }
    w.babies = w.babies.filter((b) => b.life > 0)

    for (const p of w.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 260 * dt
      p.vx *= 1 - 1.6 * dt
      p.life -= dt
    }
    w.particles = w.particles.filter((p) => p.life > 0)

    for (const f of w.floaters) {
      f.y += f.vy * dt
      f.vy += 34 * dt
      f.life -= dt
    }
    w.floaters = w.floaters.filter((f) => f.life > 0)

    if (w.shake > 0) w.shake = Math.max(0, w.shake - CONFIG.juice.shakeDecay * dt)
  }

  private end(): void {
    const w = this.world
    w.phase = 'result'
    this.cb.onSfx?.('dead')
    const summary: RunSummary = {
      score: w.score,
      level: w.level,
      survived: Math.round(w.elapsed),
      bestCombo: w.bestCombo,
      best: false,
      grade: gradeFor(w.score),
    }
    this.pushHud()
    this.cb.onPhase?.('result', summary)
  }

  private pushHud(): void {
    const w = this.world
    const hud: HudSnapshot = {
      phase: w.phase,
      score: w.score,
      combo: w.combo,
      comboFrac: w.combo > 0 ? clamp(w.comboTimer / CONFIG.combo.window, 0, 1) : 0,
      multiplier: w.multiplier,
      elapsed: w.elapsed,
      intensity: w.intensity,
      level: w.level,
      xp: w.xp,
      xpToNext: w.xpToNext,
      hp: Math.max(0, w.cupid.hp),
      maxHp: w.cupid.maxHp,
    }
    this.cb.onHud?.(hud)
  }
}
