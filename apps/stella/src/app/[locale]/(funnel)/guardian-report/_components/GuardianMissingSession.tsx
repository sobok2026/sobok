import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import Starfield from '@/components/Starfield'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import { guardianReportPaths } from '@/lib/guardian-paid'

export default function GuardianMissingSession({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].paid
  const paths = guardianReportPaths(locale)

  return (
    <main className="relative grid min-h-dvh place-items-center bg-night-sky px-4 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <section className="relative z-10 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center shadow-2xl backdrop-blur">
        <span
          aria-hidden
          className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-pink-200/20 bg-pink-100/10 text-2xl text-pink-100"
        >
          ☾
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">{content.missing.title}</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.missing.body}</p>
        <Link
          className="mt-6 block rounded-2xl cta bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
          href={paths.reopen}
        >
          {content.missing.reopenCta}
        </Link>
        <Link
          className="mt-3 block text-xs text-foreground-subtle underline-offset-4 hover:text-white hover:underline"
          href={paths.landing}
        >
          {content.missing.cta}
        </Link>
      </section>
    </main>
  )
}
