import { LEGAL_CONTACT_EMAIL } from '@sobok/brand/identity'

/** The "문의" block every legal document ends with. Goes in `DocArticle`'s `footer` slot. */
export default function LegalContact({ heading }: { heading: string }) {
  return (
    <>
      <h2 className="mb-3 text-xl font-semibold text-foreground">{heading}</h2>
      <p className="leading-relaxed text-foreground-secondary">
        <a
          className="text-accent underline underline-offset-2 hover:text-foreground"
          href={`mailto:${LEGAL_CONTACT_EMAIL}`}
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </>
  )
}
