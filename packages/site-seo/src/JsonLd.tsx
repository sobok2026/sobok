/**
 * Emit one structured-data node. Site-independent, so it is its own entry point.
 *
 * `<` is escaped because the payload is embedded in an HTML `<script>` block, where a literal `</script>`
 * inside any string would close the element early. Every value comes from our own content, so escaping that
 * one character is the whole obligation.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own strings, with `<` escaped
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\\u003c') }}
    />
  )
}
