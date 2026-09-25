import * as THREE from 'three'
import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'

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
    ctx.font = `500 ${h * 0.72}px sans-serif`
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
    ctx.font = `600 ${h * 0.09}px sans-serif`
    ctx.fillText('DAY SHIFT', w / 2, h * 0.19)
    for (let i = 0; i < 6; i++) ctx.fillRect(w * 0.15, h * (0.29 + i * 0.075), w * (i % 2 ? 0.47 : 0.67), h * 0.012)
    ctx.font = `${h * 0.06}px sans-serif`
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
      ctx.font = `${h * 0.075}px sans-serif`
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
      const ticket = state.ticket
      receipt.visible = !!ticket
      const key = `${state.phase}:${state.orderNumber}:${ticket?.recipe}:${ticket?.size}:${ticket?.service}:${state.customer?.stage}`
      if (key === previous) return
      previous = key
      const texture = (screen.material as THREE.MeshStandardMaterial).map!
      const canvas = texture.image as HTMLCanvasElement
      const ctx = canvas.getContext('2d')!,
        w = canvas.width,
        h = canvas.height
      ctx.fillStyle = '#edf0ec'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#163e33'
      ctx.fillRect(0, 0, w, h * 0.17)
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${h * 0.07}px sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('DAY SHIFT', w * 0.055, h * 0.115)
      ctx.font = `${h * 0.045}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('ORDER  /  POS', w * 0.95, h * 0.105)
      const labels = ['COFFEE', 'LATTE', 'TEA', 'COLD BREW', 'HOT', 'ICED']
      labels.forEach((label, i) => {
        const x = w * (0.05 + (i % 3) * 0.19),
          y = h * (0.25 + Math.floor(i / 3) * 0.28)
        ctx.fillStyle = i < 3 ? '#dae3dc' : '#e6ddd0'
        ctx.beginPath()
        ctx.roundRect(x, y, w * 0.17, h * 0.23, 7)
        ctx.fill()
        ctx.fillStyle = '#3e6052'
        ctx.beginPath()
        ctx.roundRect(x + w * 0.064, y + h * 0.05, w * 0.044, h * 0.074, 5)
        ctx.fill()
        ctx.textAlign = 'center'
        ctx.font = `500 ${h * 0.036}px sans-serif`
        ctx.fillText(label, x + w * 0.085, y + h * 0.186)
      })
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(w * 0.65, h * 0.23, w * 0.31, h * 0.54)
      ctx.fillStyle = '#274c3f'
      ctx.textAlign = 'left'
      ctx.font = `600 ${h * 0.044}px sans-serif`
      ctx.fillText(ticket ? `주문 #${state.orderNumber}` : '주문 대기', w * 0.68, h * 0.32)
      if (ticket) {
        ctx.font = `${h * 0.032}px sans-serif`
        ctx.fillText(RECIPES[ticket.recipe].name, w * 0.68, h * 0.43, w * 0.26)
        ctx.fillText(
          `${DRINK_SIZES[ticket.size].name} · ${ticket.service === 'dine-in' ? '매장' : '포장'}`,
          w * 0.68,
          h * 0.51,
        )
        ctx.font = `600 ${h * 0.064}px sans-serif`
        ctx.fillText(`${recipeFor(ticket.recipe, ticket.size).price.toLocaleString('ko-KR')}원`, w * 0.68, h * 0.7)
      }
      ctx.fillStyle = '#c6d6ca'
      ctx.fillRect(0, h * 0.86, w, h * 0.14)
      ctx.fillStyle = '#254b3a'
      ctx.font = `${h * 0.04}px sans-serif`
      ctx.fillText('주문 접수', w * 0.06, h * 0.95)
      texture.needsUpdate = true
    },
  }
}
