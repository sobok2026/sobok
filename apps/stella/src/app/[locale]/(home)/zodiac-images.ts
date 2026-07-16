import aquariusImage from '@/assets/zodiac/aquarius.svg'
import ariesImage from '@/assets/zodiac/aries.svg'
import cancerImage from '@/assets/zodiac/cancer.svg'
import capricornImage from '@/assets/zodiac/capricorn.svg'
import geminiImage from '@/assets/zodiac/gemini.svg'
import leoImage from '@/assets/zodiac/leo.svg'
import libraImage from '@/assets/zodiac/libra.svg'
import piscesImage from '@/assets/zodiac/pisces.svg'
import sagittariusImage from '@/assets/zodiac/sagittarius.svg'
import scorpioImage from '@/assets/zodiac/scorpio.svg'
import taurusImage from '@/assets/zodiac/taurus.svg'
import virgoImage from '@/assets/zodiac/virgo.svg'
import type { SignId } from '@/chart/types'

type ZodiacImage = {
  readonly src: string
}

// Static imports place the SVGs under /_next/static/media with content hashes.
// The existing immutable cache rule for /_next/static/* is therefore safe.
export const ZODIAC_IMAGE_BY_SIGN: Record<SignId, ZodiacImage> = {
  aries: ariesImage,
  taurus: taurusImage,
  gemini: geminiImage,
  cancer: cancerImage,
  leo: leoImage,
  virgo: virgoImage,
  libra: libraImage,
  scorpio: scorpioImage,
  sagittarius: sagittariusImage,
  capricorn: capricornImage,
  aquarius: aquariusImage,
  pisces: piscesImage,
}

export const ZODIAC_IMAGE_URLS = Object.values(ZODIAC_IMAGE_BY_SIGN).map(({ src }) => src)
