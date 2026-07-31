import { resolveWorldJob } from '@deep-type/content/world-job'
import type { GemCode, InnerCode } from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'

import { DEEP_TYPE_BRAND_NAME } from '../../_lib/brand'
import type { DeepTypeContent } from '../../_lib/types'
import { GemArtwork, InnerArtwork } from '../code-artwork'

/**
 * The report's cover, and the anchor the back-to-top control returns to.
 *
 * Separate from `WorldJobHero`, which the free screen keeps: the free result is a card at the top of a page of
 * findings, and this is the first page of a document. Only this one carries the two code artworks, and it
 * carries them because they were the wrong size in the wrong place before — two full-width squares stacked in
 * the middle of section 02 spent about twelve hundred pixels of phone screen on decoration a reader had to
 * scroll THROUGH, while the cover that should have been showing them was type alone.
 *
 * Side by side at every width, so the pair reads as the two halves of one code and the whole cover fits on one
 * screen. The captions carry the layer names and the letters, which is what the separate row of chips under
 * the title used to say — printing both put the same eight letters on the cover twice.
 */
export function ReportMasthead({
  content,
  gem,
  inner,
  locale,
}: {
  content: DeepTypeContent
  gem: GemCode
  inner: InnerCode
  locale: Locale
}) {
  const worldJob = resolveWorldJob(inner, gem)

  return (
    <header
      className="rounded-3xl border border-page-border bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:rounded-4xl sm:p-8 print:shadow-none"
      id="report-top"
    >
      <p className="font-black text-page-accent-strong text-sm tracking-[0.14em]">{DEEP_TYPE_BRAND_NAME[locale]}</p>
      <h1 className="mt-3 font-black text-3xl text-page-ink leading-tight sm:text-4xl">{worldJob.name}</h1>
      <p className="mx-auto mt-3 max-w-md text-base text-page-ink-soft leading-8">{worldJob.family.method}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <CoverArt caption={content.ui.layerInner} code={inner}>
          <InnerArtwork innerCode={inner} />
        </CoverArt>
        <CoverArt caption={content.ui.layerGem} code={gem}>
          <GemArtwork gemCode={gem} />
        </CoverArt>
      </div>
    </header>
  )
}

function CoverArt({ caption, children, code }: { caption: string; children: React.ReactNode; code: string }) {
  return (
    <figure>
      {children}
      <figcaption className="mt-2 text-page-ink-muted text-sm">
        {caption}
        <span className="ml-1.5 font-black text-page-ink tracking-wide">{code}</span>
      </figcaption>
    </figure>
  )
}
