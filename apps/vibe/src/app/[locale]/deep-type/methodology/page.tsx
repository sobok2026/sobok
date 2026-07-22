import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { getDeepTypeContent } from '../_lib/content'
import { RESEARCH_SOURCES } from '../_lib/research'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type/methodology'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) {
    return {}
  }
  const content = await getDeepTypeContent(locale)
  return buildLocalizedMetadata({
    description: content.methodology.intro,
    locale,
    pathname: '/deep-type/methodology',
    title: content.methodology.title,
  })
}

export default async function DeepTypeMethodologyPage({ params }: PageProps<'/[locale]/deep-type/methodology'>) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getDeepTypeContent(locale)
  const methodology = content.methodology

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-16" id="main-content">
      <article className="mx-auto w-full max-w-3xl">
        <h1 className="text-balance font-black text-3xl leading-tight sm:text-4xl">{methodology.title}</h1>
        <p className="mt-5 max-w-2xl text-page-ink/68 leading-8">{methodology.intro}</p>

        <div className="mt-8 grid gap-4">
          <MethodSection body={methodology.modelBody} title={methodology.modelTitle} />
          <MethodSection body={methodology.scoringBody} title={methodology.scoringTitle} />
          <MethodSection body={methodology.evidenceBody} title={methodology.evidenceTitle} />

          <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-8">
            <h2 className="font-black text-xl">{methodology.limitationsTitle}</h2>
            <ul className="mt-4 grid gap-3">
              {methodology.limitations.map((limitation) => (
                <li className="flex gap-3 text-page-ink/70 leading-7" key={limitation}>
                  <span aria-hidden="true" className="font-black text-page-accent">
                    •
                  </span>
                  {limitation}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-8">
            <h2 className="font-black text-xl">{methodology.sourcesTitle}</h2>
            <p className="mt-3 text-page-ink/64 text-sm leading-7">{methodology.sourcesIntro}</p>
            <ol className="mt-5 grid gap-4">
              {RESEARCH_SOURCES.map((source, index) => (
                <li className="flex gap-3 text-page-ink/70 text-sm leading-7" key={source.href}>
                  <span className="shrink-0 font-black text-page-accent">{index + 1}</span>
                  <a
                    className="underline decoration-page-border underline-offset-4 hover:text-page-ink"
                    href={source.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.citation}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <Link
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-page-ink px-6 font-black text-sm text-white"
          href={`/${locale}/deep-type`}
        >
          {methodology.backCta}
        </Link>
      </article>
    </main>
  )
}

function MethodSection({ body, title }: { body: string; title: string }) {
  return (
    <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-8">
      <h2 className="font-black text-xl">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-page-ink/70 leading-8">{body}</p>
    </section>
  )
}
