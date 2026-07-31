import { LEGAL_CONTACT_EMAIL } from '@sobok/brand/identity'

type Props = {
  heading: string
}

export default function LegalContact({ heading }: Props) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-foreground">{heading}</h2>
      <p className="leading-relaxed text-foreground-secondary">
        <a className="text-accent underline underline-offset-2 hover:text-brand" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </>
  )
}
