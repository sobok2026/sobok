'use client'

import { useEffect, useRef, useState } from 'react'
import { KO } from '@/content/ko'
import { AudioEngine } from '@/game/audio'
import { personSpriteEntries } from '@/game/characters'
import { CONFIG, MONSTER_KINDS } from '@/game/config'
import { Game as Engine } from '@/game/engine'
import { Renderer } from '@/game/render'
import { SpriteSheet } from '@/game/sprites'
import type { HudSnapshot, Phase, RunSummary, Toast, ToastKind, UpgradeChoice, UpgradeId } from '@/game/types'
import { loadBest, saveBest } from '@/lib/storage'
import Hud from './Hud'
import LevelUpModal from './LevelUpModal'
import ResultScreen from './ResultScreen'
import StartScreen from './StartScreen'

const INITIAL_HUD: HudSnapshot = {
  phase: 'ready',
  score: 0,
  combo: 0,
  comboFrac: 0,
  multiplier: 1,
  elapsed: 0,
  intensity: 0.15,
  level: 1,
  xp: 0,
  xpToNext: CONFIG.level.base,
  hp: CONFIG.cupid.maxHp,
  maxHp: CONFIG.cupid.maxHp,
}

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'])

interface LiveToast {
  id: number
  text: string
}

function toastText(kind: ToastKind, raw: string): string {
  if (kind === 'combo') return KO.comboTemplate.replace('{n}', raw)
  const arr = KO.toasts[kind]
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const audioRef = useRef<AudioEngine | null>(null)

  const [phase, setPhase] = useState<Phase>('ready')
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD)
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [best, setBest] = useState(0)
  const [muted, setMuted] = useState(false)
  const [toasts, setToasts] = useState<LiveToast[]>([])
  const [levelChoices, setLevelChoices] = useState<UpgradeChoice[] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const audio = new AudioEngine()
    const renderer = new Renderer()
    const sprites = new SpriteSheet()
    sprites.load([
      ...personSpriteEntries(),
      ...MONSTER_KINDS.map((m) => ({ key: `monster-${m.key}`, url: `/characters/monster-${m.key}.webp` })),
    ])
    renderer.sprites = sprites
    const toastTimers = new Set<number>()

    const engine = new Engine({
      onHud: (h) => setHud(h),
      onPhase: (p, s) => {
        if (p === 'result' && s) {
          const isBest = saveBest(s.score)
          setBest(loadBest())
          setSummary({ ...s, best: isBest })
        }
        setPhase(p)
      },
      onToast: (t: Toast) => {
        const text = toastText(t.kind, t.text)
        setToasts((prev) => [...prev.slice(-2), { id: t.id, text }])
        const timer = window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id))
          toastTimers.delete(timer)
        }, 1400)
        toastTimers.add(timer)
      },
      onSfx: (key) => audio.play(key),
      onLevelUp: (choices) => setLevelChoices(choices),
    })
    engineRef.current = engine
    audioRef.current = audio

    // Dev-only handle for stepping the sim in tests (dead-code-eliminated in the production build).
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __hornEngine?: Engine }).__hornEngine = engine
    }

    setBest(loadBest())

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotion = () => {
      engine.reducedMotion = mql.matches
      renderer.reducedMotion = mql.matches
    }
    applyMotion()
    mql.addEventListener('change', applyMotion)

    let rect = canvas.getBoundingClientRect()
    const setupCanvas = () => {
      rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      engine.resize(rect.width, rect.height)
    }
    setupCanvas()
    const ro = new ResizeObserver(setupCanvas)
    ro.observe(canvas)

    // --- input: keyboard ---
    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (MOVE_KEYS.has(k)) {
        keys.add(k)
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
    }
    const clearKeys = () => keys.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)

    // --- input: touch/mouse virtual joystick ---
    const JOY_MAX = 56
    let joyPointer: number | null = null
    let joyActive = false
    const joyOrigin = { x: 0, y: 0 }
    const joyVec = { x: 0, y: 0 }
    const toLocal = (e: PointerEvent) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    const onDown = (e: PointerEvent) => {
      if (joyPointer !== null) return
      e.preventDefault()
      joyPointer = e.pointerId
      joyActive = true
      const l = toLocal(e)
      joyOrigin.x = l.x
      joyOrigin.y = l.y
      joyVec.x = 0
      joyVec.y = 0
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== joyPointer) return
      const l = toLocal(e)
      const dx = l.x - joyOrigin.x
      const dy = l.y - joyOrigin.y
      const len = Math.hypot(dx, dy)
      if (len < 8) {
        joyVec.x = 0
        joyVec.y = 0
      } else {
        const mag = Math.min(len, JOY_MAX) / JOY_MAX
        joyVec.x = (dx / len) * mag
        joyVec.y = (dy / len) * mag
      }
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== joyPointer) return
      joyActive = false
      joyVec.x = 0
      joyVec.y = 0
      joyPointer = null
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    const keyVec = () => {
      let x = 0
      let y = 0
      if (keys.has('a') || keys.has('arrowleft')) x -= 1
      if (keys.has('d') || keys.has('arrowright')) x += 1
      if (keys.has('w') || keys.has('arrowup')) y -= 1
      if (keys.has('s') || keys.has('arrowdown')) y += 1
      return { x, y }
    }

    const drawJoystick = () => {
      if (!joyActive) return
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(joyOrigin.x, joyOrigin.y, JOY_MAX, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)'
      ctx.beginPath()
      ctx.arc(joyOrigin.x + joyVec.x * JOY_MAX, joyOrigin.y + joyVec.y * JOY_MAX, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const kv = keyVec()
      engine.setMove(joyActive ? joyVec.x : kv.x, joyActive ? joyVec.y : kv.y)
      engine.update(dt)
      renderer.draw(ctx, engine.world, now / 1000)
      drawJoystick()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onVisible = () => {
      if (document.hidden) clearKeys()
      else last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mql.removeEventListener('change', applyMotion)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      for (const t of toastTimers) window.clearTimeout(t)
      engineRef.current = null
      audioRef.current = null
    }
  }, [])

  const startRun = () => {
    audioRef.current?.unlock()
    setSummary(null)
    setToasts([])
    setLevelChoices(null)
    engineRef.current?.start()
  }

  const chooseUpgrade = (id: UpgradeId) => {
    setLevelChoices(null)
    engineRef.current?.chooseUpgrade(id)
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    audioRef.current?.setMuted(next)
  }

  return (
    <div className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#0e1a38]">
      <canvas
        aria-label={KO.a11y.canvas}
        className="absolute inset-0 h-full w-full touch-none"
        ref={canvasRef}
        role="img"
      />

      {(phase === 'playing' || phase === 'levelup') && <Hud hud={hud} />}

      <div className="pointer-events-none absolute inset-x-0 top-[24%] z-30 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            className="animate-toast rounded-full bg-black/55 px-5 py-2 text-center text-lg font-black text-white shadow-lg backdrop-blur-md"
            key={t.id}
          >
            {t.text}
          </div>
        ))}
      </div>

      <button
        aria-label={muted ? KO.a11y.unmute : KO.a11y.mute}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl backdrop-blur-md transition-transform active:scale-90"
        onClick={toggleMute}
        type="button"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {phase === 'ready' && <StartScreen best={best} onStart={startRun} />}
      {phase === 'levelup' && levelChoices && (
        <LevelUpModal choices={levelChoices} level={hud.level} onChoose={chooseUpgrade} />
      )}
      {phase === 'result' && summary && <ResultScreen best={best} onReplay={startRun} summary={summary} />}
    </div>
  )
}
