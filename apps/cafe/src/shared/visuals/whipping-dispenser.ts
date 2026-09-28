import * as THREE from 'three'
import { canvasFont } from './canvas-text'
import {
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from './equipment-geometry'

/** ITIS manual dispenser, following the user's metal-head / black-collar reference. Origin is the bottle floor. */
export function createWhippingDispenser(parent: THREE.Object3D) {
  const root = new THREE.Group()
  root.name = 'ITIS manual whipping dispenser'
  parent.add(root)
  const steel = material({ color: '#d1d4d5', metalness: 0.96, roughness: 0.28 })
  const polished = material({ color: '#e0e2e3', metalness: 0.98, roughness: 0.18 })
  const black = material({ color: '#181a1a', roughness: 0.62 })
  lathe(
    root,
    [
      [0, 0.004],
      [0.038, 0.004],
      [0.052, 0.011],
      [0.057, 0.026],
      [0.059, 0.065],
      [0.057, 0.15],
      [0.05, 0.251],
      [0.047, 0.268],
      [0.039, 0.275],
      [0.038, 0.283],
      [0.034, 0.283],
      [0.034, 0.271],
      [0.045, 0.248],
      [0.052, 0.15],
      [0.054, 0.026],
      [0.044, 0.014],
      [0, 0.014],
    ],
    steel,
  )
  const head = new THREE.Group()
  head.position.y = 0.281
  root.add(head)
  mesh(head, new THREE.CylinderGeometry(0.047, 0.046, 0.031, 48), black, [0, 0.018, 0])

  for (const y of [0.003, 0.034]) {
    mesh(head, new THREE.CylinderGeometry(0.0475, 0.0475, 0.003, 48), polished, [0, y, 0])
  }

  lathe(
    head,
    [
      [0.047, 0.035],
      [0.044, 0.042],
      [0.031, 0.051],
      [0.015, 0.054],
      [0, 0.054],
    ],
    steel,
  )
  const charger = new THREE.Group()
  charger.position.set(0, 0.051, -0.026)
  charger.rotation.x = -0.46
  head.add(charger)
  lathe(
    charger,
    [
      [0, 0],
      [0.015, 0],
      [0.018, 0.007],
      [0.018, 0.111],
      [0.015, 0.12],
      [0, 0.122],
    ],
    polished,
  )
  const grip = material({ color: '#b9bec1', metalness: 0.9, roughness: 0.44 })
  const knurl = document.createElement('canvas')
  knurl.width = knurl.height = 128
  const ctx = knurl.getContext('2d')!
  ctx.fillStyle = '#999999'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = '#dddddd'
  ctx.lineWidth = 2

  for (let x = -128; x <= 256; x += 12) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 128, 128)
    ctx.moveTo(x, 0)
    ctx.lineTo(x - 128, 128)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(knurl)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  grip.bumpMap = texture
  grip.bumpScale = 0.0005
  mesh(charger, new THREE.CylinderGeometry(0.0182, 0.0182, 0.087, 40), grip, [0, 0.062, 0])
  const nozzle = new THREE.Group()
  nozzle.position.set(0, 0.052, 0.019)
  nozzle.rotation.x = 0.47
  head.add(nozzle)
  lathe(
    nozzle,
    [
      [0.017, 0],
      [0.017, 0.028],
      [0.012, 0.033],
      [0.012, 0.052],
      [0.008, 0.068],
      [0.007, 0.134],
    ],
    polished,
  )
  mesh(nozzle, new THREE.CylinderGeometry(0.0125, 0.0125, 0.018, 32), grip, [0, 0.043, 0])
  const opening = mesh(nozzle, new THREE.CylinderGeometry(0.0045, 0.0045, 0.001, 16), black, [0, 0.134, 0])
  opening.castShadow = false

  for (let index = 0; index < 6; index++) {
    const angle = (index * Math.PI) / 3
    const petal = mesh(nozzle, new THREE.ConeGeometry(0.0027, 0.015, 3), polished, [
      Math.cos(angle) * 0.0056,
      0.137,
      Math.sin(angle) * 0.0056,
    ])
    petal.rotation.y = -angle
  }

  const outlet = new THREE.Object3D()
  outlet.position.y = 0.143
  nozzle.add(outlet)
  const lever = new THREE.Group()
  lever.position.set(0, 0.079, 0.005)
  head.add(lever)
  const pivot = mesh(lever, new THREE.CylinderGeometry(0.007, 0.007, 0.028, 20), polished)
  pivot.rotation.z = Math.PI / 2
  tube(
    lever,
    [
      [0, 0, 0],
      [0, -0.005, 0.064],
      [0, -0.028, 0.079],
      [0, -0.085, 0.108],
    ],
    0.005,
    polished,
  )
  const blade = mesh(lever, new THREE.BoxGeometry(0.015, 0.065, 0.005), steel, [0, -0.05, 0.091])
  blade.rotation.x = -0.47
  panel(root, 0.046, 0.017, [0, 0.179, 0.055], (ctx, w, h) => {
    ctx.fillStyle = '#838a8d'
    ctx.font = canvasFont(h * 0.4)
    ctx.textAlign = 'center'
    ctx.fillText('max.  0.5 L', w / 2, h * 0.5)
    ctx.fillRect(w * 0.22, h * 0.76, w * 0.56, h * 0.035)
  })
  const liquidMaterial = material({ color: '#f4ecdc', roughness: 0.65 })
  const liquid = mesh(root, new THREE.CylinderGeometry(0.034, 0.05, 1, 32), liquidMaterial)
  liquid.visible = false

  function update(fill: number, color: string, assembled = true, pressed = 0) {
    head.visible = assembled
    lever.rotation.x = pressed * 0.15
    liquid.visible = !assembled && fill > 0
    const height = 0.25 * Math.min(1, Math.max(0, fill))
    liquid.scale.y = Math.max(0.001, height)
    liquid.position.y = 0.015 + height / 2
    liquidMaterial.color.set(color)
  }

  return { root, head, outlet, height: 0.283, update }
}
