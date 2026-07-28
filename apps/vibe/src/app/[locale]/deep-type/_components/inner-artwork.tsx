import type { InnerCode } from '@deep-type/model'
import Image, { type StaticImageData } from 'next/image'

import enfjArt from '../_assets/inner/ENFJ.webp'
import enfpArt from '../_assets/inner/ENFP.webp'
import entjArt from '../_assets/inner/ENTJ.webp'
import entpArt from '../_assets/inner/ENTP.webp'
import esfjArt from '../_assets/inner/ESFJ.webp'
import esfpArt from '../_assets/inner/ESFP.webp'
import estjArt from '../_assets/inner/ESTJ.webp'
import estpArt from '../_assets/inner/ESTP.webp'
import infjArt from '../_assets/inner/INFJ.webp'
import infpArt from '../_assets/inner/INFP.webp'
import intjArt from '../_assets/inner/INTJ.webp'
import intpArt from '../_assets/inner/INTP.webp'
import isfjArt from '../_assets/inner/ISFJ.webp'
import isfpArt from '../_assets/inner/ISFP.webp'
import istjArt from '../_assets/inner/ISTJ.webp'
import istpArt from '../_assets/inner/ISTP.webp'

const INNER_ARTWORK = {
  ENFJ: enfjArt,
  ENFP: enfpArt,
  ENTJ: entjArt,
  ENTP: entpArt,
  ESFJ: esfjArt,
  ESFP: esfpArt,
  ESTJ: estjArt,
  ESTP: estpArt,
  INFJ: infjArt,
  INFP: infpArt,
  INTJ: intjArt,
  INTP: intpArt,
  ISFJ: isfjArt,
  ISFP: isfpArt,
  ISTJ: istjArt,
  ISTP: istpArt,
} satisfies Record<InnerCode, StaticImageData>

export function InnerArtwork({ innerCode }: { innerCode: InnerCode }) {
  return (
    <Image
      alt=""
      className="mx-auto aspect-square h-auto w-full max-w-sm overflow-hidden rounded-3xl border border-page-border bg-page-soft object-cover"
      draggable={false}
      fetchPriority="high"
      loading="eager"
      sizes="(min-width: 640px) 384px, calc(100vw - 4rem)"
      src={INNER_ARTWORK[innerCode]}
    />
  )
}
