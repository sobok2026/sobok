import * as THREE from 'three'
import { CONDIMENT_BAR, STATIONS } from '../../content/stations'
import { canvasFont } from './canvas-text'
import {
  equipmentBox as box,
  equipmentBasin,
  equipmentPanel,
  equipmentMaterial as material,
  equipmentMesh as mesh,
} from './equipment-geometry'

export const CONDIMENT_COUNTER_Y = 1.06
export const CONDIMENT_RETURN_Y = CONDIMENT_COUNTER_Y + 0.02

function walnutTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const context = canvas.getContext('2d')!
  context.fillStyle = '#785335'
  context.fillRect(0, 0, canvas.width, canvas.height)
  let seed = 271

  for (let x = 0; x < canvas.width; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const shade = (seed >>> 24) % 36
    context.strokeStyle = `rgba(${48 + shade}, ${27 + shade}, ${15 + shade}, 0.24)`
    context.lineWidth = 0.5 + (shade % 3) * 0.5
    context.beginPath()
    context.moveTo(x, 0)
    context.bezierCurveTo(x + 3, 150, x - 4, 320, x + 1, 512)
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

export function createCondimentBar(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Combined condiment and return bar'
  root.position.set(CONDIMENT_BAR.x, 0, CONDIMENT_BAR.z)
  root.rotation.y = CONDIMENT_BAR.yaw
  scene.add(root)
  const wood = material({ map: walnutTexture(), roughness: 0.64 })
  const stone = material({ color: '#292c29', roughness: 0.38 })
  const dark = material({ color: '#242822', roughness: 0.8 })
  const steel = material({ color: '#bbc0bd', metalness: 0.85, roughness: 0.3 })
  const tray = material({ color: '#394039', roughness: 0.7 })
  const width = CONDIMENT_BAR.width
  const depth = CONDIMENT_BAR.depth
  const suppliesX = STATIONS.supplies.x - CONDIMENT_BAR.x
  const trashX = STATIONS.trash.x - CONDIMENT_BAR.x

  function label(text: string, x: number, y: number, z: number, labelWidth: number, height = 0.085) {
    return equipmentPanel(root, labelWidth, height, [x, y, z], (context, w, h) => {
      context.fillStyle = '#273c32'
      context.fillRect(0, 0, w, h)
      context.fillStyle = '#f0eadc'
      context.font = canvasFont(h * 0.48, 500)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, w / 2, h / 2, w * 0.9)
    })
  }

  box(root, [width - 0.12, 0.12, depth - 0.16], [0, 0.08, -0.025], dark)
  box(root, [width - 0.07, 0.035, depth - 0.08], [0, 0.16, 0], wood)
  box(root, [width - 0.07, 0.86, 0.03], [0, 0.59, -depth / 2 + 0.035], wood)

  for (const x of [-width / 2 + 0.035, -0.575, 0.575, width / 2 - 0.035]) {
    box(root, [0.035, 0.86, depth - 0.07], [x, 0.59, 0], wood, 0.003)
  }

  for (const center of [trashX, 0, suppliesX]) {
    for (const side of [-1, 1]) {
      const x = center + side * 0.281
      box(root, [0.55, 0.835, 0.035], [x, 0.59, depth / 2 - 0.045], wood, 0.003)
      box(root, [0.065, 0.022, 0.02], [center + side * 0.065, 0.94, depth / 2 - 0.018], dark, 0.005)
    }
  }

  const slab = new THREE.Shape()
  slab.moveTo(-width / 2, -depth / 2)
  slab.lineTo(width / 2, -depth / 2)
  slab.lineTo(width / 2, depth / 2)
  slab.lineTo(-width / 2, depth / 2)
  slab.closePath()
  const chutes = [trashX - 0.25, trashX + 0.25]

  for (const x of chutes) {
    const hole = new THREE.Path()
    hole.absarc(x, -0.12, 0.125, 0, Math.PI * 2, true)
    slab.holes.push(hole)
    const collar = mesh(root, new THREE.TorusGeometry(0.128, 0.008, 8, 40), steel, [x, CONDIMENT_COUNTER_Y, 0.12])
    collar.rotation.x = Math.PI / 2
    mesh(root, new THREE.CylinderGeometry(0.125, 0.105, 0.21, 32, 1, true), dark, [x, 0.93, 0.12])
    mesh(root, new THREE.CylinderGeometry(0.105, 0.105, 0.012, 32), dark, [x, 0.825, 0.12])
  }

  const geometry = new THREE.ExtrudeGeometry(slab, { depth: 0.05, bevelEnabled: false, curveSegments: 24 })
  geometry.rotateX(-Math.PI / 2)
  mesh(root, geometry, stone, [0, CONDIMENT_COUNTER_Y - 0.05, 0])
  box(root, [width - 0.025, 0.1, 0.035], [0, 1.1, -depth / 2 + 0.025], wood)

  box(root, [1.13, 0.49, 0.025], [0, 1.32, -0.39], wood)

  for (const x of [-0.558, 0.558]) {
    box(root, [0.028, 0.49, 0.81], [x, 1.32, 0.015], wood, 0.003)
  }

  box(root, [1.17, 0.055, 0.85], [0, 1.585, 0.015], wood, 0.006)
  box(root, [1.11, 0.018, 0.77], [0, 1.618, 0.015], stone, 0.005)
  const returnTray = equipmentBasin(root, 0.98, 0.64, 0.02, tray, 0.035)
  returnTray.position.set(0, CONDIMENT_COUNTER_Y, 0.12)
  label('컵 · 식기 반납', 0, 1.585, 0.444, 0.76, 0.06)
  label('소모품', suppliesX, 1.12, -0.42, 0.44)
  label('일반 쓰레기', chutes[0], 1.12, -0.42, 0.43)
  label('재활용', chutes[1], 1.12, -0.42, 0.43)
}
