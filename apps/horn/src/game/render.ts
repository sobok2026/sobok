import { PERSON_ART } from './characters'
import { CONFIG, CUPID_EMOJI } from './config'
import type { World } from './engine'
import type { SpriteSheet } from './sprites'
import { forEachLakeNear } from './terrain'

const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "EmojiOne Color", sans-serif'
const TEXT_FONT =
  '900 var(--s) "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", sans-serif'
const TAU = Math.PI * 2

// Top-down city block tiling. Blocks are inset from tile edges; the inset gaps become the road grid.
const TILE = 150
const ROAD = 22
const WIN_GRID = 3

const GENDER_COLOR = { f: '#ff8ab0', m: '#7cc4ff' } as const

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const p = t - 1
  return 1 + c3 * p * p * p + c1 * p * p
}

function tileHash(tx: number, ty: number): number {
  let h = (Math.imul(tx, 374761393) + Math.imul(ty, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0
  return (h ^ (h >>> 16)) >>> 0
}

export class Renderer {
  reducedMotion = false
  sprites: SpriteSheet | null = null

  draw(ctx: CanvasRenderingContext2D, world: World, t: number): void {
    const { width: w, height: h } = world
    if (w === 0 || h === 0) return

    this.drawBase(ctx, w, h)

    ctx.save()
    if (world.shake > 0 && !this.reducedMotion) {
      const s = world.shake
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s)
    }

    ctx.save()
    ctx.translate(-world.camera.x, -world.camera.y)
    this.drawGround(ctx, world)
    this.drawLakes(ctx, world)
    const active = world.phase !== 'ready'
    if (active) this.drawAura(ctx, world)
    this.drawPulses(ctx, world)
    this.drawGems(ctx, world)
    this.drawPeople(ctx, world, t)
    this.drawMonsters(ctx, world)
    if (active) this.drawCupid(ctx, world, t)
    this.drawProjectiles(ctx, world)
    this.drawBabies(ctx, world)
    this.drawParticles(ctx, world)
    this.drawFloaters(ctx, world)
    ctx.restore()

    ctx.restore()

    this.drawVignette(ctx, w, h)
    if (world.phase !== 'ready') this.drawHurtVignette(ctx, world)
  }

  private drawBase(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0a1026')
    g.addColorStop(1, '#0e1636')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  private drawGround(ctx: CanvasRenderingContext2D, world: World): void {
    const { width: w, height: h, camera, intensity } = world
    const x0 = Math.floor(camera.x / TILE)
    const y0 = Math.floor(camera.y / TILE)
    const cols = Math.ceil(w / TILE) + 2
    const rows = Math.ceil(h / TILE) + 2
    const bs = TILE - ROAD * 2
    const cell = bs / WIN_GRID
    const winW = cell * 0.5
    const winH = cell * 0.4

    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const tx = x0 + ix
        const ty = y0 + iy
        const ox = tx * TILE
        const oy = ty * TILE
        // Asphalt fills the tile; the block is inset, so the margins read as a road grid.
        ctx.fillStyle = '#0b1130'
        ctx.fillRect(ox, oy, TILE, TILE)

        let s = tileHash(tx, ty)
        const rnd = () => {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0
          return s / 4294967296
        }
        const kind = s % 100
        const bx = ox + ROAD
        const by = oy + ROAD

        if (kind < 60) {
          // Building rooftop with windows that light up as the city repopulates.
          ctx.fillStyle = '#16213f'
          ctx.fillRect(bx, by, bs, bs)
          for (let gy = 0; gy < WIN_GRID; gy++) {
            for (let gx = 0; gx < WIN_GRID; gx++) {
              const thr = rnd()
              const hue = 44 + rnd() * 12
              if (thr >= intensity) continue
              ctx.fillStyle = `hsl(${hue}, 92%, 64%)`
              ctx.fillRect(bx + gx * cell + (cell - winW) / 2, by + gy * cell + (cell - winH) / 2, winW, winH)
            }
          }
        } else if (kind < 84) {
          // Park with a few trees.
          ctx.fillStyle = '#14351e'
          ctx.fillRect(bx, by, bs, bs)
          const trees = 2 + Math.floor(rnd() * 2)
          for (let ti = 0; ti < trees; ti++) {
            const tX = bx + bs * (0.2 + rnd() * 0.6)
            const tY = by + bs * (0.2 + rnd() * 0.6)
            drawTree(ctx, tX, tY, 10 + rnd() * 6)
          }
        } else {
          // Plaza / concrete lot.
          ctx.fillStyle = '#1a2447'
          ctx.fillRect(bx, by, bs, bs)
        }

        // Streetlight at the intersection (this tile's top-left corner).
        ctx.fillStyle = 'rgba(255, 210, 140, 0.16)'
        ctx.beginPath()
        ctx.arc(ox, oy, 9, 0, TAU)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 224, 168, 0.9)'
        ctx.beginPath()
        ctx.arc(ox, oy, 2.2, 0, TAU)
        ctx.fill()
      }
    }
  }

  private drawLakes(ctx: CanvasRenderingContext2D, world: World): void {
    const { width: w, height: h, camera } = world
    const cx = camera.x + w / 2
    const cy = camera.y + h / 2
    const range = Math.hypot(w, h) / 2 + 180
    forEachLakeNear(cx, cy, range, (l) => {
      ctx.fillStyle = '#123f78'
      ctx.beginPath()
      ctx.arc(l.x, l.y, l.r, 0, TAU)
      ctx.fill()
      const g = ctx.createRadialGradient(l.x - l.r * 0.3, l.y - l.r * 0.3, 0, l.x, l.y, l.r)
      g.addColorStop(0, 'rgba(150, 205, 255, 0.28)')
      g.addColorStop(1, 'rgba(150, 205, 255, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(l.x, l.y, l.r, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = 'rgba(130, 195, 255, 0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(l.x, l.y, l.r - 1.5, 0, TAU)
      ctx.stroke()
    })
  }

  private emoji(ctx: CanvasRenderingContext2D, glyph: string, x: number, y: number, size: number, alpha = 1): void {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${size}px ${EMOJI_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(glyph, x, y)
    ctx.restore()
  }

  /**
   * Draw the WebP sprite for `key`, centered on (x, y) and contained within a `size * 1.5` box while
   * keeping the art's native aspect ratio (portraits stay portrait). Skips if art hasn't decoded yet.
   */
  private drawSprite(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, size: number, alpha = 1): void {
    const img = this.sprites?.get(key)
    if (!img) return
    const box = size * 1.5
    const fit = Math.min(box / img.naturalWidth, box / img.naturalHeight)
    const w = img.naturalWidth * fit
    const h = img.naturalHeight * fit
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h)
    ctx.restore()
  }

  private drawAura(ctx: CanvasRenderingContext2D, world: World): void {
    const c = world.cupid
    const r = world.weapons.auraRadius
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r)
    g.addColorStop(0, 'rgba(255, 138, 190, 0.12)')
    g.addColorStop(0.7, 'rgba(255, 138, 190, 0.06)')
    g.addColorStop(1, 'rgba(255, 138, 190, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(c.x, c.y, r, 0, TAU)
    ctx.fill()
    ctx.save()
    ctx.setLineDash([5, 8])
    ctx.strokeStyle = 'rgba(255, 182, 212, 0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(c.x, c.y, r, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  private drawCupid(ctx: CanvasRenderingContext2D, world: World, t: number): void {
    const c = world.cupid
    const blink = c.invuln > 0 && !this.reducedMotion ? (Math.sin(t * 40) > 0 ? 0.4 : 1) : 1
    const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, CONFIG.cupid.size)
    glow.addColorStop(0, 'rgba(255, 236, 180, 0.5)')
    glow.addColorStop(1, 'rgba(255, 236, 180, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(c.x, c.y, CONFIG.cupid.size, 0, TAU)
    ctx.fill()
    this.emoji(ctx, CUPID_EMOJI, c.x, c.y, CONFIG.cupid.size * 1.1, blink)
  }

  private drawPeople(ctx: CanvasRenderingContext2D, world: World, t: number): void {
    const m = this.reducedMotion ? 0 : 1
    for (const a of world.people) {
      const bob = Math.sin(a.wobble) * 3 * m
      let scale = easeOutBack(a.intro)
      if (a.state === 'bonding') scale *= 1 + Math.sin(t * 30) * 0.08 * m
      if (a.state === 'spent') scale *= Math.max(0, a.life / 0.4)
      const size = a.size * scale
      const y = a.y + bob

      if (a.golden && a.state !== 'spent') {
        const glow = ctx.createRadialGradient(a.x, y, 0, a.x, y, size)
        glow.addColorStop(0, 'rgba(255, 214, 92, 0.55)')
        glow.addColorStop(1, 'rgba(255, 214, 92, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(a.x, y, size, 0, TAU)
        ctx.fill()
      }

      const gc = GENDER_COLOR[a.gender]

      if (a.state === 'wander' && a.love > 0.04) {
        ctx.strokeStyle = gc
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(a.x, y, size * 0.64, -Math.PI / 2, -Math.PI / 2 + a.love * TAU)
        ctx.stroke()
      }

      if (a.state === 'ready') {
        ctx.strokeStyle = gc
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(a.x, y, size * 0.64, 0, TAU)
        ctx.stroke()
        const pulse = 1 + Math.sin(t * 6 + a.wobble) * 0.12 * m
        this.emoji(ctx, '💗', a.x + size * 0.32, y - size * 0.6, size * 0.42 * pulse)
      }

      // Heart portrait once fully charmed — held while seeking (ready) and dashing to a partner (rushing).
      const art = a.state === 'ready' || a.state === 'rushing' ? 'heart' : 'base'
      const spriteKey = PERSON_ART[a.characterId][art]
      this.drawSprite(ctx, spriteKey, a.x, y, size, a.state === 'spent' ? Math.max(0, a.life / 0.4) : 1)

      // Gender pip so you can read who pairs with whom.
      if (a.state !== 'spent') {
        ctx.fillStyle = gc
        ctx.beginPath()
        ctx.arc(a.x, y + size * 0.52, size * 0.1, 0, TAU)
        ctx.fill()
      }
    }
  }

  private drawMonsters(ctx: CanvasRenderingContext2D, world: World): void {
    for (const mo of world.monsters) {
      const scale = easeOutBack(mo.intro)
      const size = mo.size * scale
      const shadow = ctx.createRadialGradient(mo.x, mo.y, 0, mo.x, mo.y, size)
      shadow.addColorStop(0, 'rgba(120, 40, 60, 0.45)')
      shadow.addColorStop(1, 'rgba(120, 40, 60, 0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.arc(mo.x, mo.y, size, 0, TAU)
      ctx.fill()

      this.drawSprite(ctx, `monster-${mo.kind}`, mo.x, mo.y, size)

      if (mo.hitFlash > 0) {
        ctx.save()
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#ff5b6e'
        ctx.beginPath()
        ctx.arc(mo.x, mo.y, size * 0.5, 0, TAU)
        ctx.fill()
        ctx.restore()
      }

      if (mo.hp < mo.maxHp) {
        const bw = size * 0.82
        const bx = mo.x - bw / 2
        const by = mo.y - size * 0.64
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(bx, by, bw, 4)
        ctx.fillStyle = '#ff5b6e'
        ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, mo.hp / mo.maxHp)), 4)
      }
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.fillStyle = '#ff8abe'
    for (const p of world.projectiles) {
      drawHeart(ctx, p.x, p.y, CONFIG.arrow.size * 0.7)
    }
  }

  private drawPulses(ctx: CanvasRenderingContext2D, world: World): void {
    for (const pl of world.pulses) {
      const a = 1 - pl.radius / pl.maxRadius
      ctx.strokeStyle = `rgba(255, 138, 190, ${0.5 * a})`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(pl.x, pl.y, pl.radius, 0, TAU)
      ctx.stroke()
    }
  }

  private drawGems(ctx: CanvasRenderingContext2D, world: World): void {
    for (const g of world.gems) {
      // Soft glow so the pickup hearts read against the dark city.
      const glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 20)
      glow.addColorStop(0, 'rgba(255, 120, 180, 0.55)')
      glow.addColorStop(1, 'rgba(255, 120, 180, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(g.x, g.y, 20, 0, TAU)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 165, 205, 0.98)'
      drawHeart(ctx, g.x, g.y, 15)
    }
  }

  private drawBabies(ctx: CanvasRenderingContext2D, world: World): void {
    for (const b of world.babies) {
      const pop = easeOutBack(b.pop)
      const fade = b.life < 0.4 ? b.life / 0.4 : 1
      this.emoji(ctx, b.emoji, b.x, b.y, 30 * pop, fade)
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
    for (const p of world.particles) {
      const a = Math.max(0, p.life / p.maxLife)
      if (p.kind === 'heart') {
        ctx.globalAlpha = a
        ctx.fillStyle = `hsl(${p.hue}, 90%, 68%)`
        drawHeart(ctx, p.x, p.y, p.size)
      } else {
        ctx.globalAlpha = a
        ctx.fillStyle = `hsl(${p.hue}, 95%, 80%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, TAU)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  private drawFloaters(ctx: CanvasRenderingContext2D, world: World): void {
    for (const f of world.floaters) {
      const a = Math.min(1, f.life / 0.5)
      ctx.save()
      ctx.globalAlpha = a
      ctx.font = TEXT_FONT.replace('var(--s)', `${f.size}px`)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(6, 4, 20, 0.85)'
      ctx.strokeText(f.text, f.x, f.y)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
      ctx.restore()
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75)
    g.addColorStop(0, 'rgba(0, 0, 0, 0)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0.42)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  private drawHurtVignette(ctx: CanvasRenderingContext2D, world: World): void {
    const frac = world.cupid.hp / world.cupid.maxHp
    if (frac >= 0.35) return
    const { width: w, height: h } = world
    const a = (0.35 - frac) / 0.35
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, 'rgba(220, 40, 60, 0)')
    g.addColorStop(1, `rgba(220, 40, 60, ${0.42 * a})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#0d2814'
  ctx.beginPath()
  ctx.arc(x, y + 2, r, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#1f5a2f'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#2f7a45'
  ctx.beginPath()
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.5, 0, TAU)
  ctx.fill()
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const k = s / 10
  ctx.beginPath()
  ctx.moveTo(x, y + 3 * k)
  ctx.bezierCurveTo(x - 5 * k, y - 3 * k, x - 5 * k, y - 6 * k, x, y - 2 * k)
  ctx.bezierCurveTo(x + 5 * k, y - 6 * k, x + 5 * k, y - 3 * k, x, y + 3 * k)
  ctx.fill()
}
