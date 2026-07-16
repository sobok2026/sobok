import { Fragment } from 'react'

const URL_PATTERN = /(https?:\/\/[^\s]+?)(?=[.,)]?(?:\s|$))/g

// Renders a paragraph, turning bare http(s) URLs into real links. Content is
// authored by us in legal.ts / pages.ts, so there is no untrusted input here.
export default function Paragraph({ text }: { text: string }) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0]
    const start = match.index

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }

    nodes.push(
      <a
        className="text-accent underline underline-offset-2 hover:text-brand"
        href={url}
        key={start}
        rel="noopener noreferrer"
        target="_blank"
      >
        {url}
      </a>,
    )
    lastIndex = start + url.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return (
    <p className="mb-4 leading-relaxed text-foreground-secondary">
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </p>
  )
}
