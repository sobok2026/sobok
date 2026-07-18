import type { ContactChannel, InfoPage } from '@/content/pages'
import Paragraph from './Paragraph'

type Props = {
  page: InfoPage
  channelsHeading?: string
  channels?: ContactChannel[]
}

function isExternal(href: string) {
  return href.startsWith('http')
}

export default function InfoArticle({ page, channelsHeading, channels }: Props) {
  return (
    <main className="min-h-dvh bg-night-palace px-4 pb-24 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        <p className="mt-3 text-foreground-muted">{page.description}</p>
        <p className="mt-2 text-sm text-foreground-faint">
          {page.updatedLabel}: {page.updatedDate}
        </p>

        {page.sections.map((section) => (
          <section className="mt-10" key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        {channelsHeading && channels && channels.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">{channelsHeading}</h2>
            <ul className="flex flex-col gap-3">
              {channels.map((channel) => (
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
          </section>
        )}
      </article>
    </main>
  )
}
