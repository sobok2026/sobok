'use client'

import { useEffect, useRef } from 'react'

type Star = { x: number; y: number; r: number; phase: number; speed: number; hue: number }
type Shooting = { x: number; y: number; vx: number; vy: number; life: number }

const METEOR_LIFE = 90

/**
 * Ambient twinkling starfield rendered on a canvas behind the chart. Adds the
 * sense of depth/motion that a flat chart image lacks. Honors reduced-motion by
 * painting a single static frame.
 */
export default function Starfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const context = el.getContext('2d')
    if (!context) return

    // Re-bound to consts with non-null inferred types so the nested render
    // functions below don't need the guard's flow narrowing.
    const canvas = el
    const ctx = context
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let stars: Star[] = []
    let shooting: Shooting | null = null
    let raf = 0
    let nextShoot = 1500

    function seed() {
      const density = Math.min(220, Math.floor((width * height) / 7000))

      stars = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.2,
        hue: Math.random() < 0.25 ? 285 : Math.random() < 0.5 ? 200 : 0,
      }))
    }

    function resize() {
      const parent = canvas.parentElement
      width = parent?.clientWidth ?? window.innerWidth
      height = parent?.clientHeight ?? window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    function starColor(hue: number, alpha: number) {
      if (hue === 0) {
        return `rgba(255,255,255,${alpha})`
      }
      if (hue === 285) {
        return `rgba(245,188,255,${alpha})`
      }
      return `rgba(120,200,255,${alpha})`
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, width, height)

      for (const s of stars) {
        const twinkle = reduced ? 0.7 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = starColor(s.hue, twinkle)

        if (s.r > 1) {
          ctx.shadowColor = starColor(s.hue, 0.8)
          ctx.shadowBlur = 6
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
      }

      ctx.shadowBlur = 0

      if (!reduced) {
        if (shooting) {
          shooting.x += shooting.vx
          shooting.y += shooting.vy
          shooting.life -= 1

          const age = METEOR_LIFE - shooting.life
          const trailLen = 14 * Math.min(1, age / 10)
          const fade = Math.min(1, shooting.life / 24)
          const tailX = shooting.x - shooting.vx * trailLen
          const tailY = shooting.y - shooting.vy * trailLen
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY)

          grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`)
          grad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(shooting.x, shooting.y)
          ctx.lineTo(tailX, tailY)
          ctx.stroke()

          if (shooting.life <= 0 || shooting.x > width + 40 || shooting.y > height + 40) {
            shooting = null
          }
        } else if (t > nextShoot) {
          const speed = Math.random() * 4 + 5
          const angle = Math.PI * (0.15 + Math.random() * 0.2)

          shooting = {
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.3,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: METEOR_LIFE,
          }

          nextShoot = t + 4000 + Math.random() * 5000
        }
      }

      if (!reduced) {
        raf = requestAnimationFrame(draw)
      }
    }

    resize()

    if (reduced) {
      draw(0)
    } else {
      raf = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas aria-hidden className={className} ref={canvasRef} />
}
