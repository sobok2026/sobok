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
    <main className="min-h-dvh bg-background px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-24 text-foreground sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-bold text-3xl tracking-tight">{page.title}</h1>
        <p className="mt-3 text-foreground-secondary">{page.description}</p>
        <p className="mt-2 text-foreground-muted text-sm">
          {page.updatedLabel}: {page.updatedDate}
        </p>

        {page.sections.map((section) => (
          <section className="mt-10" key={section.heading}>
            <h2 className="mb-3 font-semibold text-foreground text-xl">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        {channelsHeading && channels && channels.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-semibold text-foreground text-xl">{channelsHeading}</h2>
            <ul className="flex flex-col gap-3">
              {channels.map((channel) => (
                <li className="rounded-xl border border-border bg-surface px-4 py-3" key={channel.label}>
                  <div className="font-medium text-foreground text-sm">{channel.label}</div>
                  <a
                    className="mt-0.5 inline-block text-accent underline underline-offset-2 hover:text-foreground"
                    href={channel.href}
                    rel={isExternal(channel.href) ? 'noopener noreferrer' : undefined}
                    target={isExternal(channel.href) ? '_blank' : undefined}
                  >
                    {channel.value}
                  </a>
                  <p className="mt-1 text-foreground-secondary text-sm">{channel.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  )
}
