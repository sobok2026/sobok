import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

const EFFECTIVE_DATE = '2026-04-04'
const CONTACT_EMAIL = 'sobok2026@gmail.com'

export async function generateMetadata({ params }: PageProps<'/[locale]/doc/youth-protection'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.doc.youthProtection' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/doc/youth-protection',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/doc/youth-protection'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.youthProtection' })
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

        <nav aria-label={commonT('tocAria')} className="mt-6 rounded-2xl border border-border bg-overlay/30 p-4">
          <p className="text-sm font-semibold text-foreground">{commonT('toc')}</p>
          <ol className="mt-2 space-y-1 text-sm text-foreground-secondary">
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#purpose">
                {t('sections.purpose.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#controls">
                {t('sections.controls.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#monitoring">
                {t('sections.monitoring.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#process">
                {t('sections.process.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#complaint">
                {t('sections.complaint.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#officer">
                {t('sections.officer.title')}
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
          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.purpose.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t.rich('sections.purpose.p1', { law: emphasis })}</p>
              <p>{t('sections.purpose.p2')}</p>
            </div>
          </section>

          <section className="space-y-3" id="controls">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.controls.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t.rich('sections.controls.items.entryNotice', { strong: emphasis })}</li>
              <li>{t.rich('sections.controls.items.bbaton', { strong: emphasis })}</li>
              <li>{t.rich('sections.controls.items.extraRestriction', { strong: emphasis })}</li>
              <li>{t.rich('sections.controls.items.protectiveMeasures', { strong: emphasis })}</li>
            </ul>
          </section>

          <section className="space-y-3" id="monitoring">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.monitoring.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>{t('sections.monitoring.p1')}</p>
              <p>{t('sections.monitoring.p2')}</p>
              <p>{t('sections.monitoring.p3')}</p>
            </div>
          </section>

          <section className="space-y-3" id="process">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.process.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t('sections.process.items.reviewStandards')}</li>
              <li>{t('sections.process.items.prioritizeReports')}</li>
              <li>{t('sections.process.items.reviewEvidence')}</li>
              <li>{t('sections.process.items.updatePolicy')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="complaint">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.complaint.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
              <p>
                {t.rich('sections.complaint.p1', {
                  dmca: (chunks: ReactNode) => (
                    <Link
                      className="underline underline-offset-4 text-foreground hover:text-foreground"
                      href="/doc/dmca"
                      prefetch={false}
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
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

          <section className="space-y-3" id="officer">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.officer.title')}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-overlay/30">
              <table className="w-full text-left text-sm text-foreground-secondary">
                <tbody>
                  <tr className="border-b border-border">
                    <th className="w-32 bg-overlay/40 px-4 py-3 font-medium text-foreground">
                      {t('sections.officer.departmentLabel')}
                    </th>
                    <td className="px-4 py-3">{t('sections.officer.departmentValue')}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <th className="bg-overlay/40 px-4 py-3 font-medium text-foreground">
                      {t('sections.officer.roleLabel')}
                    </th>
                    <td className="px-4 py-3">{t('sections.officer.roleValue')}</td>
                  </tr>
                  <tr>
                    <th className="bg-overlay/40 px-4 py-3 font-medium text-foreground">{commonT('emailLabel')}</th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4 text-foreground hover:text-foreground"
                        href={`mailto:${CONTACT_EMAIL}`}
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
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
