import type { GemCode, InnerCode } from '@deep-type/model'
import Image, { type StaticImageData } from 'next/image'

import gemMaho from '../_assets/gems/maho.webp'
import gemMahu from '../_assets/gems/mahu.webp'
import gemMavo from '../_assets/gems/mavo.webp'
import gemMavu from '../_assets/gems/mavu.webp'
import gemMoho from '../_assets/gems/moho.webp'
import gemMohu from '../_assets/gems/mohu.webp'
import gemMovo from '../_assets/gems/movo.webp'
import gemMovu from '../_assets/gems/movu.webp'
import gemRaho from '../_assets/gems/raho.webp'
import gemRahu from '../_assets/gems/rahu.webp'
import gemRavo from '../_assets/gems/ravo.webp'
import gemRavu from '../_assets/gems/ravu.webp'
import gemRoho from '../_assets/gems/roho.webp'
import gemRohu from '../_assets/gems/rohu.webp'
import gemRovo from '../_assets/gems/rovo.webp'
import gemRovu from '../_assets/gems/rovu.webp'
import innerENFJ from '../_assets/inner/ENFJ.webp'
import innerENFP from '../_assets/inner/ENFP.webp'
import innerENTJ from '../_assets/inner/ENTJ.webp'
import innerENTP from '../_assets/inner/ENTP.webp'
import innerESFJ from '../_assets/inner/ESFJ.webp'
import innerESFP from '../_assets/inner/ESFP.webp'
import innerESTJ from '../_assets/inner/ESTJ.webp'
import innerESTP from '../_assets/inner/ESTP.webp'
import innerINFJ from '../_assets/inner/INFJ.webp'
import innerINFP from '../_assets/inner/INFP.webp'
import innerINTJ from '../_assets/inner/INTJ.webp'
import innerINTP from '../_assets/inner/INTP.webp'
import innerISFJ from '../_assets/inner/ISFJ.webp'
import innerISFP from '../_assets/inner/ISFP.webp'
import innerISTJ from '../_assets/inner/ISTJ.webp'
import innerISTP from '../_assets/inner/ISTP.webp'

/**
 * The hero card art for a code, gem or inner.
 *
 * One component and not two: `GemArtwork` and `InnerArtwork` differed in nothing but the lookup table. They
 * carried the same `sizes`, the same eager/high-priority hints and the same class list — in a different ORDER,
 * which is what a copy-paste looks like after one side gets reformatted, and is also why a change to the shared
 * look only ever landed on one of them.
 */
const GEM_ARTWORK = {
  MAHO: gemMaho,
  MAHU: gemMahu,
  MAVO: gemMavo,
  MAVU: gemMavu,
  MOHO: gemMoho,
  MOHU: gemMohu,
  MOVO: gemMovo,
  MOVU: gemMovu,
  RAHO: gemRaho,
  RAHU: gemRahu,
  RAVO: gemRavo,
  RAVU: gemRavu,
  ROHO: gemRoho,
  ROHU: gemRohu,
  ROVO: gemRovo,
  ROVU: gemRovu,
} satisfies Record<GemCode, StaticImageData>

const INNER_ARTWORK = {
  ENFJ: innerENFJ,
  ENFP: innerENFP,
  ENTJ: innerENTJ,
  ENTP: innerENTP,
  ESFJ: innerESFJ,
  ESFP: innerESFP,
  ESTJ: innerESTJ,
  ESTP: innerESTP,
  INFJ: innerINFJ,
  INFP: innerINFP,
  INTJ: innerINTJ,
  INTP: innerINTP,
  ISFJ: innerISFJ,
  ISFP: innerISFP,
  ISTJ: innerISTJ,
  ISTP: innerISTP,
} satisfies Record<InnerCode, StaticImageData>

// Eager and high priority: this is the result screen's hero image, so it is the LCP candidate on the page the
// reader waited for.
const CLASS_NAME =
  'mx-auto aspect-square h-auto w-full max-w-sm overflow-hidden rounded-2xl border border-page-border bg-page-soft object-cover sm:rounded-3xl'
// The paid report shows the pair side by side inside a `max-w-xl` column, so each one is at most half of that
// minus the gutters — a `100vw` hint there would ask the browser for a candidate twice the size it will draw.
const SIZES = '(min-width: 640px) 288px, calc(50vw - 2.5rem)'

export function GemArtwork({ gemCode }: { gemCode: GemCode }) {
  return (
    <Image
      alt=""
      className={CLASS_NAME}
      draggable={false}
      fetchPriority="high"
      loading="eager"
      placeholder="blur"
      sizes={SIZES}
      src={GEM_ARTWORK[gemCode]}
    />
  )
}

export function InnerArtwork({ innerCode }: { innerCode: InnerCode }) {
  return (
    <Image
      alt=""
      className={CLASS_NAME}
      draggable={false}
      fetchPriority="high"
      loading="eager"
      placeholder="blur"
      sizes={SIZES}
      src={INNER_ARTWORK[innerCode]}
    />
  )
}
