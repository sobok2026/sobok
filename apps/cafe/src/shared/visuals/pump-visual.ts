import * as THREE from 'three'
import { recipeCatalog } from '../../content/catalog'
import { INGREDIENTS } from '../../content/ingredients'
import { shopStockRules } from '../../content/inventory-schema'
import type { ResolvedOperation } from '../../content/recipe-plan'
import { canvasFont, paintTexture } from './canvas-text'
import {
  equipmentBox as box,
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from './equipment-geometry'

const syrupLabels: Record<string, { english: string; color: string; liquid: string; plain?: boolean }> = {
  classic: { english: 'Classic', color: '#aab2c1', liquid: '#d6ca98' },
  'vanilla-syrup': { english: 'Vanilla', color: '#d7bd64', liquid: '#b57520' },
  'french-vanilla-syrup': { english: 'French Vanilla', color: '#e4e0d8', liquid: '#b8a19e', plain: true },
  'hazelnut-syrup': { english: 'Hazelnut', color: '#95ac72', liquid: '#b79b46' },
  'simple-syrup': { english: 'Simple Syrup', color: '#c6b38b', liquid: '#dfd9b7', plain: true },
  'sweet-syrup': { english: 'Sweet', color: '#c49c43', liquid: '#aa752b' },
}

const defaultTools: Record<string, string> = {
  classic: 'syrup-pump',
  'vanilla-syrup': 'syrup-pump',
  'french-vanilla-syrup': 'syrup-pump',
  'hazelnut-syrup': 'syrup-pump',
  'simple-syrup': 'syrup-pump',
  'sweet-syrup': 'cbs-pump',
  mocha: 'mocha-pump',
  'white-mocha-sauce': 'white-mocha-pump',
  'white-mocha-syrup': 'white-mocha-pump',
  'white-chocolate-mocha-sauce': 'white-mocha-pump',
  'condensed-milk': 'dolce-pump',
  'frappuccino-roast': 'frappuccino-roast-pump',
  glaze: 'white-mocha-pump',
  'cream-base': 'base-pump',
  'coffee-base': 'base-pump',
  'cream-frappuccino-base': 'base-pump',
  'coffee-frappuccino-base': 'base-pump',
  'coffee-flavored-base': 'base-pump',
}

export type PumpSpec = {
  key: string
  materialId: string
  toolId: string
  kind: 'syrup' | 'shallow' | 'base'
  dose: number
}

export function pumpSpec(materialId: string, toolId = defaultTools[materialId]): PumpSpec | null {
  if (!toolId) return null
  if (!(materialId in defaultTools) && !['white-mocha-pump', 'white-mocha-pump-15'].includes(toolId)) return null
  const equipment = recipeCatalog.equipment.get(toolId)
  if (equipment?.kind !== 'pump') return null
  const dose = equipment.dose ?? shopStockRules.tools[toolId]
  if (dose?.unit !== 'ml') return null
  let kind: PumpSpec['kind'] = 'shallow'
  if (materialId in syrupLabels) kind = 'syrup'
  if (toolId === 'base-pump') kind = 'base'

  return { key: `${materialId}:${toolId}`, materialId, toolId, kind, dose: dose.value }
}

export function operationPump(operation: ResolvedOperation | undefined) {
  if (
    operation?.action !== 'add' ||
    (operation.amount.kind !== 'count' && operation.amount.kind !== 'count-range') ||
    operation.amount.unit !== 'pump'
  )
    return null
  return pumpSpec(operation.materialId, operation.toolId)
}

function bottleLabel(root: THREE.Group, id: string) {
  const label = syrupLabels[id]
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  paintTexture(map, () => {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width,
      h = canvas.height
    ctx.fillStyle = label.color
    ctx.beginPath()
    ctx.moveTo(w / 2, 16)
    ctx.lineTo(w - 14, 80)
    ctx.lineTo(w - 14, h - 90)
    ctx.lineTo(w / 2, h - 16)
    ctx.lineTo(14, h - 90)
    ctx.lineTo(14, 80)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 12
    ctx.strokeStyle = '#c3ae6a'
    ctx.stroke()
    ctx.textAlign = 'center'

    if (label.plain) {
      ctx.fillStyle = '#efece3'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#443e33'
      ctx.font = canvasFont(45, 700)
      ctx.fillText(label.english, w / 2, 98, w - 34)
      ctx.font = canvasFont(34, 600)
      ctx.fillText(INGREDIENTS[id].name, w / 2, 173, w - 34)
      ctx.fillStyle = label.color
      ctx.fillRect(30, 217, w - 60, 22)
      ctx.fillStyle = '#746e61'

      for (let y = 285; y < 760; y += 45) ctx.fillRect(38, y, w - 76, 5)
    } else {
      ctx.fillStyle = '#172b25'
      ctx.beginPath()
      ctx.moveTo(w / 2, 34)
      ctx.lineTo(w - 35, 95)
      ctx.lineTo(w - 35, 218)
      ctx.lineTo(w / 2, 276)
      ctx.lineTo(35, 218)
      ctx.lineTo(35, 95)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#e8dca8'
      ctx.font = 'italic 700 72px Georgia, serif'
      ctx.fillText('Fontana', w / 2, 178, w - 60)
      ctx.fillStyle = '#f3eee0'
      ctx.fillRect(42, 320, w - 84, 110)
      ctx.fillStyle = '#27352a'
      ctx.font = canvasFont(51, 600)
      ctx.fillText(label.english, w / 2, 394, w - 102)
      ctx.fillStyle = '#1b5140'
      ctx.font = canvasFont(29, 700)
      ctx.fillText('STARBUCKS', w / 2, 572)
      ctx.font = canvasFont(29)
      ctx.fillText(INGREDIENTS[id].name, w / 2, 672, w - 80)
    }

    ctx.fillStyle = '#f0eee5'
    ctx.fillRect(45, 790, w - 90, 120)
    ctx.fillStyle = '#393d33'
    ctx.font = canvasFont(43, 600)
    ctx.fillText('750 mL', w / 2, 872)
  })
  const labelMaterial = material({ map, transparent: true, roughness: 0.74, depthWrite: false })
  const geometry = new THREE.CylinderGeometry(0.0586, 0.0586, 0.204, 40, 1, true, -1.02, 2.04)
  mesh(root, geometry, labelMaterial, [0, 0.148, 0]).renderOrder = 2
}

function syrupBody(root: THREE.Group, id: string, white: THREE.Material) {
  const glass = material({
    color: '#e5e8d4',
    transparent: true,
    opacity: 0.1,
    roughness: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  lathe(
    root,
    [
      [0, 0],
      [0.042, 0],
      [0.055, 0.008],
      [0.058, 0.019],
      [0.058, 0.255],
      [0.054, 0.274],
      [0.042, 0.289],
      [0.027, 0.306],
      [0.022, 0.322],
      [0.021, 0.363],
      [0.023, 0.366],
      [0.023, 0.375],
      [0.018, 0.375],
      [0.018, 0.324],
      [0.025, 0.308],
      [0.039, 0.289],
      [0.051, 0.272],
      [0.054, 0.021],
      [0.046, 0.012],
      [0, 0.012],
    ],
    glass,
  )
  const liquid = mesh(
    root,
    new THREE.CylinderGeometry(0.053, 0.051, 1, 40),
    material({
      color: syrupLabels[id].liquid,
      transparent: true,
      opacity: id === 'french-vanilla-syrup' ? 0.95 : 0.62,
      roughness: 0.23,
      depthWrite: false,
    }),
  )
  liquid.renderOrder = 1
  const dip = mesh(root, new THREE.CylinderGeometry(0.004, 0.004, 0.335, 12), white, [0, 0.18, 0])
  bottleLabel(root, id)
  const heel = mesh(root, new THREE.TorusGeometry(0.052, 0.004, 8, 40), glass, [0, 0.014, 0])
  heel.rotation.x = Math.PI / 2
  return { liquid, dip }
}

function shallowBody(root: THREE.Group, steel: THREE.Material) {
  const polypropylene = material({ color: '#e3e4df', roughness: 0.56 })
  const body = box(root, [0.195, 0.205, 0.25], [0, 0.146, 0], polypropylene, 0.014)
  const position = body.geometry.getAttribute('position')

  for (let i = 0; i < position.count; i++) {
    const taper = 0.88 + 0.12 * (position.getY(i) / 0.205 + 0.5)
    position.setX(i, position.getX(i) * taper)
    position.setZ(i, position.getZ(i) * taper)
  }

  body.geometry.computeVertexNormals()

  for (const x of [-0.076, 0.076]) {
    for (const z of [-0.101, 0.101]) box(root, [0.024, 0.063, 0.027], [x, 0.035, z], polypropylene, 0.007)
  }

  box(root, [0.21, 0.014, 0.267], [0, 0.248, 0], polypropylene, 0.011)
  box(root, [0.2, 0.008, 0.256], [0, 0.26, 0], steel, 0.01)
}

function baseBody(root: THREE.Group, white: THREE.Material) {
  lathe(
    root,
    [
      [0, 0],
      [0.058, 0],
      [0.065, 0.012],
      [0.071, 0.263],
      [0.074, 0.28],
      [0.074, 0.3],
      [0, 0.3],
    ],
    white,
  )

  for (const y of [0.28, 0.292]) {
    const ring = mesh(root, new THREE.TorusGeometry(0.073, 0.002, 8, 40), white, [0, y, 0])
    ring.rotation.x = Math.PI / 2
  }
}

/** Dimensions follow the user photos at game scale; stock consumption uses equipment doses, never model size. */
export function createPumpVisual(parent: THREE.Object3D, spec: PumpSpec) {
  const root = new THREE.Group()
  root.name = `${INGREDIENTS[spec.materialId]?.name ?? spec.materialId} · ${spec.dose}ml pump`
  parent.add(root)
  const steel = material({ color: '#cbd0d2', metalness: 0.95, roughness: 0.22 })
  const black = material({ color: '#202122', roughness: 0.55 })
  const white = material({ color: '#eeeee7', roughness: 0.38 })
  const syrup = spec.kind === 'syrup'
  const base = spec.kind === 'base'
  const bottle = syrup ? syrupBody(root, spec.materialId, white) : null

  if (base) baseBody(root, white)
  else if (!syrup) shallowBody(root, steel)

  const hardware = new THREE.Group()
  root.add(hardware)
  const collarY = syrup ? 0.378 : 0.285
  let headY = syrup ? 0.463 : 0.413 + spec.dose * 0.003
  if (base) headY = 0.48
  const reach = syrup ? 0.158 : 0.205
  let stroke = 0.022 + spec.dose * 0.0016
  if (syrup) stroke = spec.dose <= 3.75 ? 0.024 : 0.042
  const head = new THREE.Group()
  head.position.y = headY
  hardware.add(head)
  const darkHead = spec.materialId === 'mocha' || spec.materialId === 'frappuccino-roast' || base
  const knob = darkHead ? black : white

  if (base) {
    const coffee = spec.materialId.startsWith('coffee')
    const lid = coffee ? material({ color: '#b78229', roughness: 0.44 }) : white
    mesh(hardware, new THREE.CylinderGeometry(0.079, 0.079, 0.017, 48), lid, [0, 0.31, 0])
  }

  const mountY = base ? 0.337 : collarY
  mesh(
    hardware,
    new THREE.CylinderGeometry(syrup ? 0.029 : 0.025, syrup ? 0.03 : 0.028, 0.027, 40),
    syrup ? white : black,
    [0, mountY, 0],
  )
  mesh(hardware, new THREE.CylinderGeometry(0.015, 0.02, 0.038, 32), syrup ? white : black, [0, mountY + 0.023, 0])
  mesh(
    head,
    new THREE.CylinderGeometry(syrup ? 0.009 : 0.01, syrup ? 0.009 : 0.01, headY - mountY + 0.018, 24),
    syrup ? white : steel,
    [0, -(headY - mountY + 0.018) / 2 - 0.013, 0],
  )

  if (syrup) {
    box(head, [0.038, 0.017, 0.045], [0, 0, 0], white, 0.008)
    const arm = box(head, [0.025, 0.014, reach], [0, -0.006, reach / 2], white, 0.006)
    arm.rotation.x = 0.07
    tube(
      head,
      [
        [0, -0.01, reach - 0.022],
        [0, -0.014, reach - 0.004],
        [0, -0.034, reach],
      ],
      0.006,
      white,
    )
  } else {
    lathe(
      head,
      [
        [0, 0.016],
        [0.027, 0.016],
        [0.033, 0.009],
        [0.033, 0.003],
        [0.022, -0.01],
        [0.019, -0.02],
        [0, -0.02],
      ],
      knob,
    )

    if (base) {
      tube(
        head,
        [
          [0, -0.012, 0.015],
          [0, -0.012, 0.07],
          [0, -0.021, 0.115],
          [0, -0.048, 0.122],
        ],
        0.007,
        steel,
      )
    } else {
      // Only the plunger moves on a shallow jar; its separate discharge pipe is fixed to the lid.
      tube(
        hardware,
        [
          [0.051, 0.265, 0.021],
          [0.051, 0.344, 0.035],
          [0.048, 0.413, 0.047],
          [0.035, 0.43, 0.072],
          [0, 0.43, reach - 0.025],
          [0, 0.408, reach],
        ],
        0.007,
        steel,
      )
    }
  }

  const movingOutlet = syrup || base
  const outletParent = movingOutlet ? head : hardware
  let outletY = 0.402
  if (syrup) outletY = -0.038
  if (base) outletY = -0.052
  const outletReach = base ? 0.122 : reach
  const hole = spec.materialId === 'frappuccino-roast' ? 0.0022 : 0.006
  const nozzleMaterial = (syrup ? white : steel).clone()
  nozzleMaterial.side = THREE.DoubleSide
  const nozzle = mesh(outletParent, new THREE.RingGeometry(hole, syrup ? 0.0078 : 0.01, 24), nozzleMaterial, [
    0,
    outletY,
    outletReach,
  ])
  nozzle.rotation.x = Math.PI / 2
  mesh(outletParent, new THREE.CylinderGeometry(hole, hole, 0.001, 16), black, [0, outletY + 0.001, outletReach])
  const outlet = new THREE.Object3D()
  outlet.position.set(0, outletY, outletReach)
  outletParent.add(outlet)
  const cap = mesh(root, new THREE.CylinderGeometry(0.024, 0.024, 0.028, 32), black, [0, 0.376, 0])
  cap.visible = false

  if (!syrup) {
    const sticker = panel(root, base ? 0.085 : 0.133, 0.039, [0, 0.145, base ? 0.069 : 0.12], (ctx, w, h) => {
      ctx.fillStyle = '#eeeee7'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#373b36'
      ctx.font = canvasFont(h * 0.28, 600)
      ctx.textAlign = 'center'
      ctx.fillText(INGREDIENTS[spec.materialId]?.name ?? spec.materialId, w / 2, h * 0.43, w * 0.92)
      ctx.font = canvasFont(h * 0.22)
      let mode = ''
      if (spec.materialId === 'mocha') mode = spec.dose === 7.5 ? 'CBS · ' : 'ESP · '
      ctx.fillText(`${mode}${spec.dose} ml`, w / 2, h * 0.81)
    })
    sticker.rotation.x = -0.06
  }

  function update(pressed = 0, fill = 0.8, sealed = false) {
    head.position.y = headY - Math.min(1, Math.max(0, pressed)) * stroke
    hardware.visible = !sealed
    cap.visible = syrup && sealed
    if (!bottle) return
    const { liquid, dip } = bottle
    dip.visible = !sealed
    const height = 0.25 * Math.min(1, Math.max(0, fill))
    liquid.visible = fill > 0
    liquid.scale.y = Math.max(0.001, height)
    liquid.position.y = 0.013 + height / 2
  }

  update()

  function place(spot: THREE.Vector3, vesselRadius: number) {
    let depth = 0.134
    if (syrup) depth = 0.058
    if (base) depth = 0.074
    root.rotation.y = Math.PI
    root.position.set(spot.x, spot.y, spot.z + Math.max(outletReach, depth + vesselRadius + 0.015))
  }

  return { root, head, outlet, reach: outletReach, update, place }
}
