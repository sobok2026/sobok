import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

const EFFECTIVE_DATE = '2026-04-04'
const CONTACT_EMAIL = 'sobok2026@gmail.com'

export async function generateMetadata({ params }: PageProps<'/[locale]/doc/2257'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.doc.compliance2257' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/doc/2257',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/doc/2257'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.compliance2257' })
  const commonT = await getTranslations({ locale, namespace: 'Doc.common' })

  function emphasis(chunks: ReactNode) {
    return <span className="font-medium text-foreground">{chunks}</span>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <header className="space-y-2">
          <Link
            className="inline-flex text-xs text-foreground-muted hover:text-foreground underline underline-offset-4"
            href="/new"
            prefetch={false}
          >
            {commonT('back')}
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-muted">{t('subtitle')}</p>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-overlay/30 p-4 text-sm leading-relaxed text-foreground-secondary">
          <p>{t('notice.p1')}</p>
          <p className="mt-3">{t('notice.p2')}</p>
        </section>

        <nav aria-label={commonT('tocAria')} className="mt-6 rounded-2xl border border-border bg-overlay/30 p-4">
          <p className="text-sm font-semibold text-foreground">{commonT('toc')}</p>
          <ol className="mt-2 space-y-1 text-sm text-foreground-secondary">
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#scope">
                {t('sections.scope.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#platform-role">
                {t('sections.platformRole.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#non-real-person">
                {t('sections.nonRealPerson.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#real-person">
                {t('sections.realPerson.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#uploader-obligations">
                {t('sections.uploaderObligations.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#requests">
                {t('sections.requests.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#changes">
                {t('sections.changes.title')}
              </a>
            </li>
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          <section className="space-y-3" id="scope">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.scope.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t.rich('sections.scope.p1', { law: emphasis })}</p>
              <p>{t('sections.scope.p2')}</p>
            </div>
          </section>

          <section className="space-y-3" id="platform-role">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.platformRole.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t('sections.platformRole.p1')}</p>
              <p>{t('sections.platformRole.p2')}</p>
            </div>
          </section>

          <section className="space-y-3" id="non-real-person">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.nonRealPerson.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t('sections.nonRealPerson.p1')}</p>
              <p>{t('sections.nonRealPerson.p2')}</p>
            </div>
          </section>

          <section className="space-y-3" id="real-person">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.realPerson.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t('sections.realPerson.p1')}</p>
              <p>{t('sections.realPerson.p2')}</p>
              <p>{t('sections.realPerson.p3')}</p>
            </div>
          </section>

          <section className="space-y-3" id="uploader-obligations">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.uploaderObligations.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t('sections.uploaderObligations.items.verifyRecords')}</li>
              <li>{t('sections.uploaderObligations.items.maintainRecords')}</li>
              <li>{t('sections.uploaderObligations.items.noMinors')}</li>
              <li>{t('sections.uploaderObligations.items.legalAdvice')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="requests">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.requests.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>
                {t.rich('sections.requests.p1', {
                  dmca: (chunks: ReactNode) => (
                    <Link
                      className="underline underline-offset-4 text-foreground hover:text-foreground"
                      href="/doc/dmca"
                      prefetch={false}
                    >
                      {chunks}
                    </Link>
                  ),
                  terms: (chunks: ReactNode) => (
                    <Link
                      className="underline underline-offset-4 text-foreground hover:text-foreground"
                      href="/doc/terms"
                      prefetch={false}
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
              <p>{t('sections.requests.p2')}</p>
              <p>
                {commonT('contactLabel')}{' '}
                <a
                  className="underline underline-offset-4 text-foreground hover:text-foreground"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>

          <section className="space-y-3" id="changes">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.changes.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.changes.p1')}</p>
          </section>
        </article>

        <footer className="mt-10 border-t border-border pt-6">
          <p className="text-center text-sm text-foreground-secondary">
            {commonT('effectiveDate', { date: EFFECTIVE_DATE })}
          </p>
        </footer>
      </div>
    </div>
  )
}
