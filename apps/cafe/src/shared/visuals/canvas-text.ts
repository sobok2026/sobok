import type * as THREE from 'three'

let family: string | undefined

export function canvasFont(size: number, weight = 400) {
  family ??= getComputedStyle(document.body).fontFamily
  return `${weight} ${size}px ${family}`
}

const latestDraw = new WeakMap<THREE.Texture, () => void>()

/**
 * Drawing starts the Pretendard slice load. Without repainting afterwards, the texture keeps the fallback font.
 * Only repeat the latest drawing so a late font load cannot restore a stale frame.
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
  if (document.fonts.status === 'loading') {
    void document.fonts.ready.then(() => {
      if (latestDraw.get(texture) === draw) {
        paint()
      }
    })
  }
}
