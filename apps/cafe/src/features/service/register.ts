import * as THREE from 'three'
import { RECIPES } from '../../content/recipes'
import { canvasFont, paintTexture } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { saleTotal } from './orders'

export function createRegister(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Counter POS terminal'
  root.position.set(-4.8, 1.064, -0.99)
  root.rotation.y = Math.PI
  scene.add(root)
  const black = material({ color: '#090c10', roughness: 0.62, metalness: 0.02 })
  const frameBlack = material({ color: '#080a0d', roughness: 0.28, metalness: 0.03 })
  const rubber = material({ color: '#0b1014', roughness: 0.9 })
  const aluminum = material({ color: '#9aa5ab', metalness: 0.9, roughness: 0.25 })
  // CX7's low, broad, chamfered black foot and short rear bracket define its silhouette.
  const footprint = new THREE.Shape()
  footprint.moveTo(-0.218, -0.15)
  for (const [x, z] of [
    [0.218, -0.15],
    [0.24, -0.128],
    [0.24, 0.128],
    [0.218, 0.15],
    [-0.218, 0.15],
    [-0.24, 0.128],
    [-0.24, -0.128],
  ])
    footprint.lineTo(x, z)
  footprint.closePath()
  const baseGeometry = new THREE.ExtrudeGeometry(footprint, {
    depth: 0.022,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.01,
    bevelThickness: 0.01,
    bevelSegments: 1,
  })
  baseGeometry.rotateX(-Math.PI / 2)
  baseGeometry.scale(0.86, 0.75, 0.82)
  mesh(root, baseGeometry, black, [0, 0.024, 0.035])
  box(root, [0.4, 0.01, 0.254], [0, 0.009, 0.035], rubber, 0.004)
  for (const x of [-0.177, 0.177])
    for (const z of [-0.062, 0.135]) box(root, [0.036, 0.012, 0.03], [x, 0.007, z], rubber, 0.003)
  box(root, [0.11, 0.15, 0.086], [0, 0.125, -0.032], black, 0.006).rotation.x = -0.28
  const swivel = mesh(root, new THREE.CylinderGeometry(0.031, 0.031, 0.135, 24), black, [0, 0.205, -0.012])
  swivel.rotation.z = Math.PI / 2
  const monitor = new THREE.Group()
  monitor.position.set(0, 0.306, 0.025)
  monitor.rotation.x = -0.25
  root.add(monitor)
  box(monitor, [0.635, 0.373, 0.032], [0, 0, 0], frameBlack, 0.006)
  box(monitor, [0.602, 0.339, 0.003], [0, 0.007, 0.017], rubber, 0.003)
  instances(
    monitor,
    new THREE.BoxGeometry(0.19, 0.003, 0.002),
    rubber,
    Array.from({ length: 12 }, (_, i) => [0, -0.05 + i * 0.009, -0.0165]),
  )
  const screen = panel(monitor, 0.592, 0.331, [0, 0.007, 0.019], () => {}, true)
  panel(monitor, 0.081, 0.011, [0, -0.171, 0.019], (ctx, w, h) => {
    ctx.fillStyle = '#d9dcdf'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.72, 500)
    ctx.fillText('NCR VOYIX', w / 2, h * 0.8)
  })
  tube(
    root,
    [
      [0, 0.21, -0.04],
      [0.01, 0.11, -0.08],
      [0.02, 0.04, -0.14],
      [0.15, 0.012, -0.16],
    ],
    0.005,
    rubber,
  )

  // A receipt printer and a card terminal keep their controls facing the employee aisle.
  box(root, [0.21, 0.15, 0.24], [0.44, 0.08, 0.1], black, 0.024)
  box(root, [0.17, 0.015, 0.18], [0.44, 0.154, 0.09], aluminum, 0.007)
  box(root, [0.13, 0.011, 0.007], [0.44, 0.157, 0.184], rubber, 0.002)
  const receipt = panel(root, 0.12, 0.15, [0.44, 0.207, 0.204], (ctx, w, h) => {
    ctx.fillStyle = '#f7f4e8'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#344541'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.09, 600)
    ctx.fillText('소복다방', w / 2, h * 0.19)
    for (let i = 0; i < 6; i++) ctx.fillRect(w * 0.15, h * (0.29 + i * 0.075), w * (i % 2 ? 0.47 : 0.67), h * 0.012)
    ctx.font = canvasFont(h * 0.06)
    ctx.fillText('THANK YOU', w / 2, h * 0.88)
  })
  receipt.rotation.x = -0.38
  const reader = new THREE.Group()
  reader.position.set(-0.365, 0.105, 0.25)
  reader.rotation.x = -0.76
  root.add(reader)
  box(reader, [0.125, 0.235, 0.045], [0, 0, 0], black, 0.015)
  panel(
    reader,
    0.1,
    0.205,
    [0, 0, 0.025],
    (ctx, w, h) => {
      ctx.fillStyle = '#a7bec2'
      ctx.fillRect(w * 0.05, h * 0.04, w * 0.9, h * 0.38)
      ctx.fillStyle = '#2b4b51'
      ctx.textAlign = 'center'
      ctx.font = canvasFont(h * 0.075)
      ctx.fillText('READY', w / 2, h * 0.26)
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i === 11 ? '#436c51' : i === 9 ? '#ab5a4d' : '#a6afb1'
        ctx.beginPath()
        ctx.roundRect(w * (0.09 + (i % 3) * 0.3), h * (0.49 + Math.floor(i / 3) * 0.11), w * 0.22, h * 0.075, 6)
        ctx.fill()
      }
    },
    true,
  )
  let previous = ''
  return {
    update(state: GameState) {
      const sale = state.sale
      receipt.visible = !!sale && sale.paidAt !== null
      const key = `${state.phase}:${state.orderNumber}:${JSON.stringify(sale)}:${state.customer?.stage}`
      if (key === previous) return
      previous = key
      const texture = (screen.material as THREE.MeshStandardMaterial).map!
      const canvas = texture.image as HTMLCanvasElement
      const ctx = canvas.getContext('2d')!,
        w = canvas.width,
        h = canvas.height
      paintTexture(texture, () => {
        ctx.fillStyle = '#123f35'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(w * 0.012, h * 0.02, w * 0.31, h * 0.86)
        ctx.fillStyle = '#203c34'
        ctx.textAlign = 'center'
        ctx.font = canvasFont(h * 0.054, 600)
        ctx.fillText('소복다방', w * 0.17, h * 0.1)
        ctx.textAlign = 'left'
        ctx.font = canvasFont(h * 0.032)
        ctx.fillText(`주문 ${String(state.orderNumber).padStart(3, '0')}`, w * 0.03, h * 0.18)
        if (!sale) ctx.fillText('주문 대기', w * 0.1, h * 0.46)
        for (const [index, line] of (sale?.lines.slice(0, 4) ?? []).entries()) {
          const y = h * (0.23 + index * 0.1)
          ctx.fillStyle = index === 0 ? '#009b7a' : '#d7e9e3'
          ctx.fillRect(w * 0.022, y, w * 0.289, h * 0.087)
          ctx.fillStyle = index === 0 ? '#ffffff' : '#203c34'
          ctx.font = canvasFont(h * 0.029)
          ctx.fillText(RECIPES[line.recipe].name, w * 0.03, y + h * 0.035, w * 0.21)
          ctx.fillText(`${line.quantity}잔`, w * 0.265, y + h * 0.055)
        }
        ctx.fillStyle = '#d7e9e3'
        ctx.fillRect(w * 0.025, h * 0.9, w * 0.29, h * 0.08)
        ctx.fillStyle = '#203c34'
        ctx.font = canvasFont(h * 0.04, 600)
        ctx.fillText(
          `${saleTotal(sale).toLocaleString('ko-KR')} ${sale?.paidAt != null ? '결제 완료' : '결제'}`,
          w * 0.035,
          h * 0.957,
        )
        ctx.fillStyle = '#ffffff'
        ctx.font = canvasFont(h * 0.031)
        ctx.fillText('주문 / 커스텀', w * 0.35, h * 0.075)
        const categories = ['즐겨찾기', '에스프레소', '콜드 브루', '티바나']
        categories.forEach((label, index) => {
          ctx.fillStyle = index === 0 ? '#009b7a' : '#315b50'
          ctx.fillRect(w * (0.4 + index * 0.146), h * 0.12, w * 0.14, h * 0.1)
          ctx.fillStyle = '#ffffff'
          ctx.font = canvasFont(h * 0.029)
          ctx.fillText(label, w * (0.41 + index * 0.146), h * 0.18, w * 0.12)
        })
        for (let index = 0; index < 20; index++) {
          const x = w * (0.4 + (index % 5) * 0.117),
            y = h * (0.24 + Math.floor(index / 5) * 0.16)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x, y, w * 0.11, h * 0.145)
          ctx.fillStyle = '#315b50'
          ctx.font = canvasFont(h * 0.026)
          ctx.fillText(
            ['아메리카노', '카페 라떼', '콜드 브루', '말차', '호지차'][index % 5],
            x + w * 0.006,
            y + h * 0.04,
            w * 0.1,
          )
        }
        for (let index = 0; index < 5; index++) {
          ctx.fillStyle = index === 1 ? '#009b7a' : '#315b50'
          ctx.fillRect(w * 0.335, h * (0.24 + index * 0.128), w * 0.055, h * 0.12)
        }
        ctx.fillStyle = '#315b50'
        ctx.fillRect(w * 0.335, h * 0.9, w * 0.65, h * 0.08)
      })
    },
  }
}
