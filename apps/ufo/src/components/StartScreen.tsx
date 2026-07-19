import { KO } from '@/content/ko'

export default function StartScreen({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-gradient-to-b from-black/40 via-black/25 to-black/55 backdrop-blur-[2px]">
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-8 text-center">
        <div className="animate-float-slow text-6xl drop-shadow-[0_6px_20px_rgba(255,138,190,0.5)]">👽💘</div>

        <div>
          <h1 className="bg-gradient-to-r from-accent-cool via-brand to-accent-warm bg-clip-text text-5xl font-black text-transparent drop-shadow sm:text-6xl">
            {KO.brand}
          </h1>
          <p className="mt-1 text-base font-bold tracking-wide text-white/75">{KO.subtitle}</p>
        </div>

        <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-white/80">{KO.tagline}</p>

        <ol className="w-full max-w-xs space-y-1.5 rounded-2xl bg-white/8 p-4 text-left text-[13px] text-white/75 ring-1 ring-white/10">
          <li className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-brand">{KO.howto.title}</li>
          {KO.howto.steps.map((step, i) => (
            <li className="flex gap-2" key={step}>
              <span className="font-black text-accent-cool">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <button
          className="animate-pulse-glow rounded-full bg-gradient-to-r from-brand to-accent-warm px-10 py-4 text-lg font-black text-[#2a0a1e] shadow-lg transition-transform active:scale-95"
          onClick={onStart}
          type="button"
        >
          {KO.startButton}
        </button>

        {best > 0 && (
          <p className="text-xs font-semibold text-white/55">
            {KO.bestPrefix} {best}
            {KO.result.unit}
          </p>
        )}
      </div>
    </div>
  )
}
