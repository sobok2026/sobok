import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'

import { getDeepTypeContent } from '../_lib/content'
import { RESEARCH_SOURCES } from '../_lib/research'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type/methodology'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) {
    return {}
  }
  const content = await getDeepTypeContent(locale)
  return buildMetadata({
    description: content.methodology.intro,
    locale,
    path: '/deep-type/methodology',
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
    <main className="flex flex-1 flex-col bg-background px-safe py-10 text-foreground sm:py-16" id="main-content">
      <article className="mx-auto w-full max-w-3xl">
        <h1 className="text-balance font-black text-3xl leading-tight sm:text-4xl">{methodology.title}</h1>
        <p className="mt-5 max-w-2xl text-foreground-secondary leading-8">{methodology.intro}</p>

        <div className="mt-8 grid gap-4">
          <MethodSection body={methodology.modelBody} title={methodology.modelTitle} />
          <MethodSection body={methodology.scoringBody} title={methodology.scoringTitle} />
          <MethodSection body={methodology.evidenceBody} title={methodology.evidenceTitle} />

          <section className="rounded-3xl sm:rounded-4xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-black text-xl">{methodology.principlesTitle}</h2>
            <ul className="mt-4 grid gap-3">
              {methodology.principles.map((principle) => (
                <li className="flex gap-3 text-foreground-secondary leading-7" key={principle}>
                  <span aria-hidden="true" className="font-black text-accent">
                    •
                  </span>
                  {principle}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl sm:rounded-4xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-black text-xl">{methodology.sourcesTitle}</h2>
            <p className="mt-3 text-foreground-secondary text-sm leading-7">{methodology.sourcesIntro}</p>
            <ol className="mt-5 grid gap-4">
              {RESEARCH_SOURCES.map((source, index) => (
                <li className="flex gap-3 text-foreground-secondary text-sm leading-7" key={source.href}>
                  <span className="shrink-0 font-black text-accent">{index + 1}</span>
                  <a
                    className="underline decoration-border underline-offset-4 hover:text-foreground"
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
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-foreground px-6 font-black text-sm text-white"
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
    <section className="rounded-3xl sm:rounded-4xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="font-black text-xl">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-foreground-secondary leading-8">{body}</p>
    </section>
  )
}
