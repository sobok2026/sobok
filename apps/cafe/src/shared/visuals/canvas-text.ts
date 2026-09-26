import type * as THREE from 'three'

let family: string | undefined

/** The page's own stack from @sobok/typography, so text on a texture is set like the HUD around it. */
export function canvasFont(size: number, weight = 400) {
  family ??= getComputedStyle(document.body).fontFamily
  return `${weight} ${size}px ${family}`
}

const latestDraw = new WeakMap<THREE.Texture, () => void>()

/**
 * Draws onto a canvas texture, then once more when the web-font slices that drawing asked for have arrived.
 *
 * A texture keeps the pixels it was given, so text set before its Pretendard slice loads would stay in the fallback
 * face for good. Drawing the text is itself what starts that slice loading, which is why the check follows the
 * draw. Only the texture's latest drawing is repeated, so a late repaint never shows a stale frame.
 */
export function paintTexture(texture: THREE.Texture, draw: () => void) {
  const canvas = texture.image as HTMLCanvasElement

  const paint = () => {
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    draw()
    texture.needsUpdate = true
  }

  latestDraw.set(texture, draw)
  paint()
  if (document.fonts.status === 'loading')
    void document.fonts.ready.then(() => {
      if (latestDraw.get(texture) === draw) paint()
    })
}
