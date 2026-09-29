import * as THREE from 'three'

function surface(draw: (context: CanvasRenderingContext2D, random: () => number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const context = canvas.getContext('2d')!
  let seed = 729
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  draw(context, random)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export function createInteriorFinishes() {
  const oak = surface((ctx, random) => {
    ctx.fillStyle = '#ac794b'
    ctx.fillRect(0, 0, 512, 512)

    for (let x = 0; x < 512; x++) {
      ctx.strokeStyle = `rgba(65, 34, 15, ${0.04 + random() * 0.2})`
      ctx.lineWidth = 0.5 + random() * 1.4
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + random() * 18, 180, x - random() * 12, 380, x, 512)
      ctx.stroke()
    }
  })
  const stone = surface((ctx, random) => {
    ctx.fillStyle = '#b5aea2'
    ctx.fillRect(0, 0, 512, 512)

    for (let i = 0; i < 22000; i++) {
      const shade = Math.floor(100 + random() * 100)
      ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 12}, 0.11)`
      ctx.fillRect(random() * 512, random() * 512, random() * 6 + 1, random() * 3 + 1)
    }

    ctx.strokeStyle = '#8c867c'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 512, 512)
  })
  const brick = surface((ctx, random) => {
    ctx.fillStyle = '#b2a58f'
    ctx.fillRect(0, 0, 512, 512)

    for (let row = 0; row < 16; row++) {
      for (let column = -1; column < 5; column++) {
        const lightness = 41 + random() * 12
        ctx.fillStyle = `hsl(27 17% ${lightness}%)`
        const x = column * 128 + (row % 2) * 64
        ctx.fillRect(x + 2, row * 32 + 2, 124, 27)

        for (let i = 0; i < 45; i++) {
          ctx.fillStyle = `rgba(38, 26, 17, ${random() * 0.15})`
          ctx.fillRect(x + random() * 124, row * 32 + random() * 26 + 3, 8, 1)
        }
      }
    }
  })
  const tile = surface((ctx, random) => {
    ctx.fillStyle = '#d2c8b6'
    ctx.fillRect(0, 0, 512, 512)

    for (let row = 0; row < 12; row++) {
      for (let column = 0; column < 4; column++) {
        ctx.fillStyle = `hsl(39 25% ${78 + random() * 8}%)`
        ctx.fillRect(column * 128 + 1, (row * 512) / 12 + 1, 126, 40)
      }
    }
  })
  const plaster = surface((ctx, random) => {
    ctx.fillStyle = '#d9c4a8'
    ctx.fillRect(0, 0, 512, 512)

    for (let row = 0; row < 32; row++) {
      ctx.strokeStyle = `rgba(114, 81, 53, ${0.08 + random() * 0.1})`
      ctx.lineWidth = 1 + random() * 2
      ctx.beginPath()
      ctx.moveTo(0, row * 16)
      ctx.bezierCurveTo(170, row * 16 + 9, 340, row * 16 - 10, 512, row * 16)
      ctx.stroke()
    }
  })
  const standard = (color: string, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness })

  return {
    oak: new THREE.MeshStandardMaterial({ map: oak, roughness: 0.57, emissive: '#9a6639', emissiveIntensity: 0.08 }),
    walnut: new THREE.MeshStandardMaterial({ map: oak, color: '#c3a58a', roughness: 0.62 }),
    floor: new THREE.MeshStandardMaterial({ map: stone, bumpMap: stone, bumpScale: 0.012, roughness: 0.82 }),
    brick: new THREE.MeshStandardMaterial({ map: brick, bumpMap: brick, bumpScale: 0.018, roughness: 0.93 }),
    tile: new THREE.MeshStandardMaterial({ map: tile, bumpMap: tile, bumpScale: 0.008, roughness: 0.64 }),
    plaster: new THREE.MeshStandardMaterial({ map: plaster, bumpMap: plaster, bumpScale: 0.025, roughness: 0.93 }),
    charcoal: standard('#292824'),
    counter: standard('#45443e', 0.36),
    ceiling: new THREE.MeshStandardMaterial({
      color: '#e7e2d6',
      emissive: '#b4aa93',
      emissiveIntensity: 0.45,
      roughness: 0.94,
    }),
    linen: standard('#dfd9c6', 0.98),
    leather: standard('#794d36', 0.72),
    foliage: standard('#405940', 0.92),
    brass: new THREE.MeshStandardMaterial({ color: '#a38b61', metalness: 0.65, roughness: 0.38 }),
    light: new THREE.MeshBasicMaterial({ color: '#ffe0a3', toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({
      color: '#d6e5dc',
      transparent: true,
      opacity: 0.08,
      roughness: 0.12,
      depthWrite: false,
    }),
  }
}
