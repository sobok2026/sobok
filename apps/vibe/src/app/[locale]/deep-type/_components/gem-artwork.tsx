import type { GemCode } from '@deep-type/model'
import Image, { type StaticImageData } from 'next/image'

import mahoArtwork from '../_assets/gems/maho.webp'
import mahuArtwork from '../_assets/gems/mahu.webp'
import mavoArtwork from '../_assets/gems/mavo.webp'
import mavuArtwork from '../_assets/gems/mavu.webp'
import mohoArtwork from '../_assets/gems/moho.webp'
import mohuArtwork from '../_assets/gems/mohu.webp'
import movoArtwork from '../_assets/gems/movo.webp'
import movuArtwork from '../_assets/gems/movu.webp'
import rahoArtwork from '../_assets/gems/raho.webp'
import rahuArtwork from '../_assets/gems/rahu.webp'
import ravoArtwork from '../_assets/gems/ravo.webp'
import ravuArtwork from '../_assets/gems/ravu.webp'
import rohoArtwork from '../_assets/gems/roho.webp'
import rohuArtwork from '../_assets/gems/rohu.webp'
import rovoArtwork from '../_assets/gems/rovo.webp'
import rovuArtwork from '../_assets/gems/rovu.webp'

const GEM_ARTWORK = {
  MAHO: mahoArtwork,
  MAHU: mahuArtwork,
  MAVO: mavoArtwork,
  MAVU: mavuArtwork,
  MOHO: mohoArtwork,
  MOHU: mohuArtwork,
  MOVO: movoArtwork,
  MOVU: movuArtwork,
  RAHO: rahoArtwork,
  RAHU: rahuArtwork,
  RAVO: ravoArtwork,
  RAVU: ravuArtwork,
  ROHO: rohoArtwork,
  ROHU: rohuArtwork,
  ROVO: rovoArtwork,
  ROVU: rovuArtwork,
} satisfies Record<GemCode, StaticImageData>

export function GemArtwork({ gemCode }: { gemCode: GemCode }) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-page-border bg-page-soft">
      <Image
        alt=""
        className="aspect-square h-auto w-full object-cover"
        draggable={false}
        fetchPriority="high"
        loading="eager"
        sizes="(min-width: 640px) 384px, calc(100vw - 4rem)"
        src={GEM_ARTWORK[gemCode]}
      />
    </div>
  )
}
