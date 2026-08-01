import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { PAGES } from '@/content/pages'
import { buildMetadata } from '@/lib/seo'
import DocArticle from '../DocArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return buildMetadata({ locale, path: '/contact', title: doc.title, description: doc.description })
}

function isExternal(href: string) {
  return href.startsWith('http')
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const page = PAGES[locale].contact

  return (
    <DocArticle
      description={page.description}
      sections={page.sections}
      title={page.title}
      updatedDate={page.updatedDate}
      updatedLabel={page.updatedLabel}
      footer={
        <>
          <h2 className="mb-4 text-xl font-semibold text-foreground">{page.channelsHeading}</h2>
          <ul className="flex flex-col gap-3">
            {page.channels.map((channel) => (
              <li className="rounded-xl border border-border bg-white/[0.02] px-4 py-3" key={channel.label}>
                <div className="text-sm font-medium text-foreground">{channel.label}</div>
                <a
                  className="mt-0.5 inline-block text-accent underline underline-offset-2 hover:text-brand"
                  href={channel.href}
                  rel={isExternal(channel.href) ? 'noopener noreferrer' : undefined}
                  target={isExternal(channel.href) ? '_blank' : undefined}
                >
                  {channel.value}
                </a>
                <p className="mt-1 text-sm text-foreground-secondary">{channel.description}</p>
              </li>
            ))}
          </ul>
        </>
      }
    />
  )
}
