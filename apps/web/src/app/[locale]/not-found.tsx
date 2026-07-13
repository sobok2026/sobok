import { APP_METADATA } from '@sobok/domain/app/metadata'
import { Home, Search, SearchX } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import { Link } from '@/i18n/navigation'

const primaryActionClassName =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_42px_rgba(0,0,0,0.28)] transition hover:opacity-90 active:opacity-80 sm:w-auto'

const secondaryActionClassName =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border-2/80 bg-overlay/70 px-5 py-3 text-sm font-bold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-border-strong hover:bg-surface active:bg-overlay sm:w-auto'

const shelfItems = [
  { label: 'L-01', className: 'row-span-2 bg-gradient-to-br from-cyan-300/80 via-sky-500/40 to-overlay' },
  { label: 'I-24', className: 'bg-gradient-to-br from-surface-3 via-surface to-overlay' },
  { label: 'T-09', className: 'row-span-2 bg-gradient-to-br from-fuchsia-300/70 via-pink-500/35 to-overlay' },
  { label: 'O-17', className: 'bg-gradient-to-br from-amber-200/70 via-orange-500/30 to-overlay' },
  { label: 'M-44', className: 'bg-gradient-to-br from-emerald-200/70 via-teal-500/30 to-overlay' },
  { label: 'I-00', className: 'row-span-2 bg-gradient-to-br from-violet-200/70 via-indigo-500/35 to-overlay' },
  { label: '404', className: 'bg-gradient-to-br from-surface-4/60 via-surface-2 to-overlay' },
  { label: 'X-13', className: 'bg-gradient-to-br from-rose-200/70 via-red-500/25 to-overlay' },
  { label: 'N-28', className: 'bg-gradient-to-br from-slate-500/70 via-surface-2 to-overlay' },
  { label: 'E-35', className: 'row-span-2 bg-gradient-to-br from-brand/70 via-brand/35 to-overlay' },
]

export default async function NotFound() {
  const locale = await getLocale()
  const t = await getTranslations('NotFound')

  const shortName = APP_METADATA[locale].shortName
  const titleLines = [t('titleLine1'), t('titleLine2')]

  return (
    <main className="relative isolate flex min-h-dvh overflow-hidden bg-background px-4 py-10 text-foreground sm:px-8 sm:py-12">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(70,205,252,0.16),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(245,188,255,0.13),transparent_36%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[48px_48px]"
      />
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[minmax(0,0.94fr)_minmax(320px,1.06fr)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:text-left">
          <div className="mb-8 inline-flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl border border-border bg-overlay/80 shadow-[0_16px_36px_rgba(0,0,0,0.24)]">
              <Image
                alt={shortName}
                className="size-7 object-contain"
                height={342}
                priority
                src="/image/logo.webp"
                width={299}
              />
            </span>
            <span className="text-sm font-bold text-foreground-secondary">{shortName}</span>
          </div>

          <p className="font-mono text-sm font-bold leading-6 text-brand">404 / PAGE NOT FOUND</p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-normal sm:text-6xl">
            {titleLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-foreground-secondary sm:text-lg">
            {t('description')}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <Link className={primaryActionClassName} href="/" prefetch={false}>
              <Home className="size-4" />
              {t('homeAction')}
            </Link>
            <Link className={secondaryActionClassName} href="/search" prefetch={false}>
              <Search className="size-4" />
              {t('searchAction')}
            </Link>
          </div>
        </div>

        <div aria-hidden className="relative mx-auto aspect-4/3 w-full max-w-xl">
          <div className="absolute inset-0 rounded-3xl border border-border/90 bg-overlay/60 p-3 shadow-[0_34px_90px_rgba(0,0,0,0.42)] backdrop-blur sm:p-4">
            <div className="grid h-full grid-cols-4 grid-rows-4 gap-2 sm:gap-3">
              {shelfItems.map((item) => (
                <div
                  className={twMerge(
                    'relative overflow-hidden rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
                    item.className,
                  )}
                  key={item.label}
                >
                  <span className="absolute left-2 top-2 font-mono text-[0.625rem] font-bold leading-none text-white/50">
                    {item.label}
                  </span>
                  <span className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/20" />
                </div>
              ))}
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 w-[min(82%,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-2/90 bg-background/95 p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
              <SearchX className="size-7" />
            </div>
            <p className="mt-4 font-mono text-xs font-bold leading-5 text-foreground-subtle">{t('emptyDescription')}</p>
            <p className="mt-1 text-base font-bold leading-6 text-foreground">{t('emptyTitle')}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
