import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

const EFFECTIVE_DATE = '2026-01-04'
const CONTACT_EMAIL = 'sobok2026@gmail.com'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.doc.privacy' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/privacy',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.privacy' })
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
              <a className="underline underline-offset-4 hover:text-foreground" href="#collect">
                {t('sections.collect.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#purpose">
                {t('sections.purpose.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#retention">
                {t('sections.retention.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#thirdparty">
                {t('sections.thirdparty.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#cookies">
                {t('sections.cookies.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#rights">
                {t('sections.rights.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-foreground" href="#contact">
                {t('sections.contact.title')}
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
          <section className="space-y-3" id="collect">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.collect.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.collect.intro')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t.rich('sections.collect.items.account', { label: emphasis })}</li>
              <li>{t.rich('sections.collect.items.serviceUsage', { label: emphasis })}</li>
              <li>{t.rich('sections.collect.items.logDevice', { label: emphasis })}</li>
              <li>{t.rich('sections.collect.items.performance', { label: emphasis })}</li>
              <li>{t.rich('sections.collect.items.advertising', { label: emphasis })}</li>
            </ul>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.collect.excludedIntro')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t('sections.collect.excludedItems.directIdentifiers')}</li>
            </ul>
            <p className="text-xs text-foreground-subtle">{t('sections.collect.sessionNote')}</p>
            <p className="text-xs text-foreground-subtle">
              {t.rich('sections.collect.dmcaNote', {
                dmca: (chunks: ReactNode) => (
                  <Link
                    className="underline underline-offset-4 text-foreground hover:text-foreground"
                    href="/dmca"
                    prefetch={false}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.purpose.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t('sections.purpose.items.account')}</li>
              <li>{t('sections.purpose.items.analytics')}</li>
              <li>{t('sections.purpose.items.security')}</li>
              <li>{t('sections.purpose.items.ads')}</li>
              <li>{t('sections.purpose.items.legal')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="retention">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.retention.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.retention.p1')}</p>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.retention.p2')}</p>
          </section>

          <section className="space-y-3" id="thirdparty">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.thirdparty.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.thirdparty.p1')}</p>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.thirdparty.p2')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary marker:text-foreground-faint">
              <li>{t('sections.thirdparty.items.legalRequest')}</li>
              <li>{t('sections.thirdparty.items.investigationRequest')}</li>
              <li>{t('sections.thirdparty.items.userDispute')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="cookies">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.cookies.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.cookies.p1')}</p>
          </section>

          <section className="space-y-3" id="rights">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.rights.title')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">{t('sections.rights.p1')}</p>
          </section>

          <section className="space-y-3" id="contact">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
              {t('sections.contact.title')}
            </h2>
            <p className="text-sm text-foreground-secondary">
              {t('sections.contact.label')}{' '}
              <a
                className="underline underline-offset-4 text-foreground hover:text-foreground"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            </p>
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
