import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

/**
 * Builds the guardian report's Open Graph image: the three cards from the landing hero, fanned on the same
 * night-sky wash the page uses.
 *
 * No text in the image, deliberately. Every surface that unfurls a link — KakaoTalk, X, Slack, Discord —
 * renders `og:title` and `og:description` as live text beside the picture, so burning a headline in would
 * only duplicate it at a size nobody controls, and it would have to be re-rendered per locale. The artwork is
 * the part a preview cannot supply for itself.
 *
 * Regenerate whenever the hero art changes:
 *   bun run scripts/build-guardian-og.ts
 */

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = join(ROOT, 'public/og-guardian-report.webp')

const WIDTH = 1200
const HEIGHT = 630

/** 3:4, matching the cards themselves. Sized so the fan clears the frame with room to breathe. */
const CARD_WIDTH = 300
const CARD_HEIGHT = 400
const CARD_RADIUS = 26

type Card = { file: string; angle: number; x: number; y: number; opacity: number }

// Back to front, fanned around the canvas centre. The middle card is the one the landing hero also fronts.
const CENTRE_X = WIDTH / 2
const CARDS: readonly Card[] = [
  { file: 'cancer-self.webp', angle: -13, x: CENTRE_X - 196, y: 132, opacity: 0.82 },
  { file: 'taurus-work.webp', angle: 13, x: CENTRE_X + 196, y: 132, opacity: 0.86 },
  { file: 'aries-love-stella.webp', angle: 0, x: CENTRE_X, y: 112, opacity: 1 },
]

const BACKGROUND = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <radialGradient id="pink" cx="14%" cy="8%" r="62%">
      <stop offset="0%" stop-color="#ffc1d6" stop-opacity="0.26" />
      <stop offset="100%" stop-color="#ffc1d6" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="violet" cx="88%" cy="24%" r="66%">
      <stop offset="0%" stop-color="#a77eff" stop-opacity="0.24" />
      <stop offset="100%" stop-color="#a77eff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="blue" cx="48%" cy="96%" r="70%">
      <stop offset="0%" stop-color="#69b8ff" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#69b8ff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0618" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#pink)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#violet)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#blue)" />
</svg>`

const CARD_MASK = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="${CARD_RADIUS}" ry="${CARD_RADIUS}" fill="#fff" />
</svg>`

async function renderCard({ angle, file, opacity }: Card): Promise<Buffer> {
  const artwork = await sharp(join(ROOT, 'public/images/zodiac-guardians', file))
    .resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover' })
    .composite([{ input: Buffer.from(CARD_MASK), blend: 'dest-in' }])
    .ensureAlpha(opacity)
    .png()
    .toBuffer()

  // Rotating after the mask keeps the corner radius true; the transparent background keeps the fan clean.
  return sharp(artwork)
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

const layers = await Promise.all(
  CARDS.map(async (card) => {
    const buffer = await renderCard(card)
    const { height = 0, width = 0 } = await sharp(buffer).metadata()
    // `x`/`y` name the card's top centre, so rotation growing the bitmap does not shift the fan.
    return { input: buffer, left: Math.round(card.x - width / 2), top: Math.round(card.y - (height - CARD_HEIGHT) / 2) }
  }),
)

const image = await sharp(Buffer.from(BACKGROUND)).composite(layers).webp({ quality: 88 }).toBuffer()

await mkdir(dirname(OUTPUT), { recursive: true })
await writeFile(OUTPUT, image)
console.log(`${OUTPUT} · ${WIDTH}×${HEIGHT} · ${(image.byteLength / 1024).toFixed(1)} KiB`)
