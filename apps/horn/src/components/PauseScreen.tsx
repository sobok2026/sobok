import { KO } from '@/content/ko'

export default function PauseScreen({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/60 px-6 text-center backdrop-blur-sm">
      <div className="animate-float-slow text-6xl drop-shadow-[0_6px_20px_rgba(255,138,190,0.5)]">⏸️</div>
      <h2 className="text-4xl font-black text-white drop-shadow sm:text-5xl">{KO.pause.title}</h2>
      <div className="flex flex-col items-center gap-3">
        <button
          className="animate-pulse-glow rounded-full bg-gradient-to-r from-brand to-accent-warm px-10 py-4 text-lg font-black text-[#2a0a1e] shadow-lg transition-transform active:scale-95"
          onClick={onResume}
          type="button"
        >
          {KO.pause.resume}
        </button>
        <button
          className="rounded-full bg-white/10 px-8 py-3 text-base font-bold text-white/85 ring-1 ring-white/15 transition-transform active:scale-95"
          onClick={onRestart}
          type="button"
        >
          {KO.pause.restart}
        </button>
      </div>
    </div>
  )
}
