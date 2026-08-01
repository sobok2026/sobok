export type ContactChannel = {
  label: string
  description: string
  href: string
  value: string
}

type Props = {
  heading: string
  channels: readonly ContactChannel[]
}

// A mailto:/tel: link stays in the tab; anything http(s) is somewhere else entirely and opens accordingly.
function isExternal(href: string) {
  return href.startsWith('http')
}

/** The contact page's list of ways to reach us. Goes in `DocArticle`'s `footer` slot. */
export default function ContactChannels({ channels, heading }: Props) {
  if (channels.length === 0) {
    return null
  }

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-foreground">{heading}</h2>
      <ul className="flex flex-col gap-3">
        {channels.map((channel) => (
          <li className="rounded-xl border border-border bg-surface px-4 py-3" key={channel.label}>
            <div className="text-sm font-medium text-foreground">{channel.label}</div>
            <a
              className="mt-0.5 inline-block text-accent underline underline-offset-2 hover:text-foreground"
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
  )
}
