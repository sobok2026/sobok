/** All gameplay tunables for the Vampire-Survivors-style run. Units: seconds, css px. */
export const CONFIG = {
  /** Run length. Survive to the end (or die when 기력 hits 0). */
  duration: 180,

  cupid: {
    speed: 210,
    maxHp: 100,
    /** i-frames after taking a hit. */
    invuln: 0.7,
    /** Gems within this radius fly to the cupid (>= aura so anything you pair/kill is collectible even while moving). */
    pickupRadius: 110,
    size: 40,
    /** Passive 기력 regen per second. */
    regen: 0.6,
  },

  /** Charm aura — the always-on zone that woos nearby residents and burns nearby monsters (love hurts them). */
  aura: {
    radius: 100,
    /** Love added per second to people inside the aura. */
    rate: 0.72,
    /** Damage per second to monsters inside the aura. */
    monsterDamage: 10,
  },

  /** Auto-firing love arrow. Charms people, damages monsters. */
  arrow: {
    cooldown: 0.95,
    count: 1,
    speed: 440,
    life: 1.25,
    damage: 10,
    /** Love added to a person on hit. */
    charm: 0.5,
    pierce: 0,
    size: 16,
  },

  /** Heart pulse — expanding ring AoE. Unlocked via level-up. */
  pulse: {
    cooldown: 3.2,
    maxRadius: 168,
    growth: 320,
    damage: 12,
    charm: 0.55,
  },

  person: {
    minCount: 20,
    maxCount: 64,
    areaPerPerson: 30000,
    /** Maintained region is larger than the view (infinite map), so scale the target up. */
    regionFactor: 3.0,
    /** Extra people per full minute of the run. */
    growthPerMinute: 8,
    wanderSpeed: 30,
    /** A ready person drifts toward the nearest opposite-gender ready person within this range... */
    readyDetect: 460,
    readySeekSpeed: 95,
    /** ...and once two are this close they rush together and bond. */
    seekSpeed: 165,
    seekRadius: 300,
    meetDistance: 26,
    bondTime: 0.3,
    size: 60,
    spawnInterval: 0.35,
    /** Max people topped up per maintenance tick (keeps density up when the player is moving fast). */
    spawnBurst: 8,
    goldenChance: 0.05,
  },

  monster: {
    /** No monsters for the opening grace period. */
    firstSpawn: 7,
    spawnIntervalStart: 3.0,
    spawnIntervalEnd: 0.75,
    hpStart: 16,
    hpPerMinute: 12,
    speedStart: 52,
    speedPerMinute: 10,
    contactDamage: 12,
    knockback: 220,
    size: 40,
  },

  reward: {
    twinsChance: 0.16,
    tripletsChance: 0.05,
    perBaby: 1,
    goldenMultiplier: 3,
    /** XP dropped per baby born and per monster defeated. */
    xpPerBaby: 1,
    xpPerMonster: 3,
  },

  level: {
    /** XP needed for level 1; each level costs `base * growth^(level-1)`, rounded. */
    base: 6,
    growth: 1.32,
  },

  combo: {
    window: 2.6,
    step: 4,
    maxMultiplier: 8,
  },

  juice: {
    shakeOnBond: 2.6,
    shakeOnHit: 7,
    shakePerCombo: 0.4,
    maxShake: 16,
    shakeDecay: 9,
    maxParticles: 260,
  },
} as const

export const BABY_EMOJI = ['👶', '🍼', '🥚', '🐣'] as const
export const CUPID_EMOJI = '👼'

/** The "저출산 원인" monsters — weak to love. Art at public/characters/monster-<key>.webp. */
export const MONSTER_KINDS = [
  { key: 'rent', hpMul: 1, speedMul: 1 },
  { key: 'overtime', hpMul: 0.8, speedMul: 1.25 },
  { key: 'tuition', hpMul: 1.4, speedMul: 0.82 },
] as const

export type MonsterKey = (typeof MONSTER_KINDS)[number]['key']
