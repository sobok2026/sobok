/**
 * Loads character WebP art and hands ready <img> elements to the renderer. A key still decoding
 * returns null, so the renderer simply skips it for that frame until the image is ready.
 */
export class SpriteSheet {
  private imgs = new Map<string, HTMLImageElement>()
  private ready = new Set<string>()

  load(entries: { key: string; url: string }[]): void {
    if (typeof window === 'undefined') return
    for (const { key, url } of entries) {
      if (this.imgs.has(key)) continue
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (img.naturalWidth > 0) this.ready.add(key)
      }
      img.src = url
      this.imgs.set(key, img)
    }
  }

  get(key: string): HTMLImageElement | null {
    return this.ready.has(key) ? (this.imgs.get(key) ?? null) : null
  }
}
