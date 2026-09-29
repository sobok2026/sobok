import * as THREE from 'three'
import type { Recipe } from '../content/playable-menu'
import { RECIPES } from '../content/recipes'
import { canvasFont, paintTexture } from '../shared/visuals/canvas-text'

const WIDTH = 1800
const HEIGHT = 1040
const ink = '#183c35'
const menuRecipes = Object.values(RECIPES)
const price = (value: number | undefined) => (value === undefined ? '—' : value.toLocaleString('ko-KR'))

function recipe(id: string) {
  const candidates = menuRecipes.filter((entry) => entry.recipeId === id && entry.sizes.tall)
  return candidates.find((entry) => entry.temperature === 'iced') ?? candidates[0]
}

function menuList(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  groups: { title: string; ids: string[] }[],
) {
  ctx.fillStyle = '#f1f5ef'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = ink
  ctx.font = canvasFont(70, 600)
  ctx.fillText(title, 88, 118)
  ctx.font = canvasFont(28, 400)
  ctx.fillStyle = '#64756b'
  ctx.fillText(subtitle, 90, 170)
  const columns = [1250, 1460, 1670]

  for (const [i, size] of ['Tall', 'Grande', 'Venti'].entries()) {
    ctx.textAlign = 'right'
    ctx.fillStyle = ink
    ctx.font = canvasFont(32, 600)
    ctx.fillText(size, columns[i], 218)
    ctx.fillStyle = '#6f7b70'
    ctx.font = canvasFont(23)
    ctx.fillText(['355 ml', '473 ml', '591 ml'][i], columns[i], 251)
  }

  let y = 292

  for (const group of groups) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#527267'
    ctx.font = canvasFont(27, 600)
    ctx.fillText(group.title, 90, y)
    ctx.fillStyle = '#c4cfc5'
    ctx.fillRect(90, y + 15, 1580, 2)
    y += 66

    for (const id of group.ids) {
      const drink = recipe(id)
      if (!drink) continue
      ctx.textAlign = 'left'
      ctx.fillStyle = ink
      ctx.font = canvasFont(35, 500)
      ctx.fillText(drink.name, 90, y, 985)
      ctx.textAlign = 'right'
      ctx.font = canvasFont(32, 400)

      for (const [index, size] of (['tall', 'grande', 'venti'] as const).entries()) {
        ctx.fillText(price(drink.sizes[size]?.price), columns[index], y)
      }

      y += 67
    }

    y += 18
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = '#67786c'
  ctx.font = canvasFont(23)
  ctx.fillText('표시 가격은 원화입니다.  ·  일부 음료는 ICED로만 제공됩니다.', 90, HEIGHT - 43)
}

function drawDrink(ctx: CanvasRenderingContext2D, x: number, y: number, drink: Recipe, foam: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#33554b18'
  ctx.beginPath()
  ctx.ellipse(0, 304, 155, 25, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-140, -90)
  ctx.lineTo(-107, 288)
  ctx.quadraticCurveTo(0, 315, 107, 288)
  ctx.lineTo(140, -90)
  ctx.closePath()
  ctx.save()
  ctx.clip()
  const gradient = ctx.createLinearGradient(-145, 0, 145, 0)
  gradient.addColorStop(0, '#f2eee0')
  gradient.addColorStop(0.16, drink.color)
  gradient.addColorStop(0.8, drink.color)
  gradient.addColorStop(1, '#ded5b8')
  ctx.fillStyle = gradient
  ctx.fillRect(-145, -110, 290, 425)
  ctx.fillStyle = '#503622'
  ctx.fillRect(-145, -85, 290, 85)
  ctx.fillStyle = foam
  ctx.fillRect(-145, -95, 290, 48)

  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = '#fffdf329'
    ctx.fillRect(-104 + (i % 3) * 76, -9 + Math.floor(i / 3) * 88, 64, 67)
  }

  ctx.fillStyle = '#ffffff58'
  ctx.fillRect(-116, -35, 9, 293)
  ctx.restore()
  ctx.strokeStyle = '#ffffffb0'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = foam
  ctx.beginPath()
  ctx.ellipse(0, -91, 140, 27, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffffb8'
  ctx.stroke()
  ctx.fillStyle = '#196a50'
  ctx.beginPath()
  ctx.ellipse(0, 123, 43, 47, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f5f2df'
  ctx.font = canvasFont(21, 600)
  ctx.textAlign = 'center'
  ctx.fillText('COFFEE', 0, 130)
  ctx.restore()
}

function seasonal(ctx: CanvasRenderingContext2D) {
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#dcebe4')
  background.addColorStop(0.65, '#eaf0e0')
  background.addColorStop(1, '#cadbc8')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  ctx.font = canvasFont(30, 500)
  ctx.fillText('A MOMENT IN NATURE', WIDTH / 2, 93)
  ctx.font = canvasFont(74, 600)
  ctx.fillText('깊어지는 계절, 부드러운 한 잔', WIDTH / 2, 193)
  ctx.font = canvasFont(28)
  ctx.fillText('BLACK GLAZED  /  MATCHA GLAZED', WIDTH / 2, 249)
  const drinks = [recipe('black-glazed-latte'), recipe('matcha-glazed-tea-latte')]

  drinks.forEach((drink, i) => {
    if (!drink) return
    const x = 510 + i * 780
    drawDrink(ctx, x, 461, drink, i ? '#d1dbb0' : '#efddba')
    ctx.fillStyle = ink
    ctx.font = canvasFont(35, 500)
    ctx.textAlign = 'center'
    ctx.fillText(drink.name, x, 862, 720)
    ctx.font = canvasFont(27)
    ctx.fillText(`Tall  ${price(drink.sizes.tall?.price)}`, x, 913)
  })

  ctx.fillStyle = '#577466'
  ctx.font = canvasFont(23)
  ctx.fillText('자연과 함께 머무는 커피의 시간', WIDTH / 2, 995)
}

export function createMenuBoards(scene: THREE.Scene) {
  const screens = [
    (ctx: CanvasRenderingContext2D) =>
      menuList(ctx, 'COFFEE', '에스프레소의 깊은 풍미를 만나보세요', [
        {
          title: 'ESPRESSO  ·  에스프레소',
          ids: ['caffe-americano', 'vanilla-latte', 'cappuccino', 'caffe-mocha', 'double-espresso-cream-latte'],
        },
        { title: 'COLD BREW  ·  콜드 브루', ids: ['cold-brew', 'vanilla-cream-cold-brew', 'dolce-cold-brew'] },
      ]),
    seasonal,
    (ctx: CanvasRenderingContext2D) =>
      menuList(ctx, 'TEAVANA™ & MORE', '차 한 잔의 여유, 다채로운 즐거움', [
        {
          title: 'TEAVANA  ·  티',
          ids: ['jeju-matcha-latte', 'starbucks-classic-milk-tea', 'grapefruit-honey-black-tea', 'pure-hojicha'],
        },
        {
          title: 'FRAPPUCCINO® & BLENDED',
          ids: ['java-chip-frappuccino', 'caramel-frappuccino', 'strawberry-delight-yogurt-blended'],
        },
      ]),
  ]
  const frameMaterial = new THREE.MeshStandardMaterial({ color: '#171d1a', roughness: 0.44 })

  screens.forEach((draw, index) => {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    paintTexture(texture, () => draw(canvas.getContext('2d')!))
    const x = -2.8 + index * 2.45
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.44, 1.43, 0.1), frameMaterial)
    frame.position.set(x, 2.77, -5.65)
    scene.add(frame)
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.36, 1.364),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    )
    screen.name = ['Coffee menu', 'Seasonal drinks', 'Tea and blended menu'][index]
    screen.position.set(x, 2.77, -5.591)
    scene.add(screen)
  })
}
