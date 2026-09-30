import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import {
  equipmentBox as box,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { createDishRack } from './equipment'
import { dishwasherJob, rackSlots, washItems } from './rules'

export function createDishwasher(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Hobart AMX inspired pass-through hood dishwasher'
  root.position.set(STATIONS.dishwasher.x, 0, STATIONS.dishwasher.z - 0.12)
  scene.add(root)
  const steel = material({ color: '#c5cbd0', metalness: 0.88, roughness: 0.38 })
  const chrome = material({ color: '#d9e0e4', metalness: 0.94, roughness: 0.21 })
  const dark = material({ color: '#243033', roughness: 0.66 })
  const liner = material({ color: '#76858d', metalness: 0.78, roughness: 0.44 })
  const green = material({ color: '#277f6c', emissive: '#277f6c', emissiveIntensity: 0.6 })

  for (const x of [-0.29, 0.29]) {
    for (const z of [-0.28, 0.28]) {
      mesh(root, new THREE.CylinderGeometry(0.025, 0.028, 0.21, 12), chrome, [x, 0.17, z])
      box(root, [0.075, 0.035, 0.075], [x, 0.058, z], dark)
    }
  }
  box(root, [0.72, 0.66, 0.76], [0, 0.57, 0], steel, 0.008)
  box(root, [0.66, 0.53, 0.012], [0, 0.585, 0.389], steel, 0.004)
  box(root, [0.64, 0.013, 0.015], [0, 0.31, 0.401], liner)
  box(root, [0.72, 0.065, 0.78], [0, 0.947, 0], chrome)
  box(root, [0.59, 0.016, 0.61], [0, 0.987, 0], liner)
  box(root, [0.72, 1.01, 0.07], [0, 1.39, -0.37], steel)
  for (const x of [-0.3, 0.3])
    tube(
      root,
      [
        [x, 0.94, -0.31],
        [x, 1.92, -0.31],
      ],
      0.014,
      chrome,
    )
  for (const z of [-0.19, 0.19]) box(root, [0.65, 0.012, 0.022], [0, 1.012, z], chrome)
  const washArm = box(root, [0.46, 0.022, 0.039], [0, 0.999, 0], chrome)
  washArm.rotation.y = 0.35
  mesh(root, new THREE.CylinderGeometry(0.042, 0.042, 0.025, 20), chrome, [0, 1.0, 0])

  const hood = new THREE.Group()
  hood.name = 'Vertically lifting insulated hood'
  hood.position.y = 1.01
  root.add(hood)
  box(hood, [0.73, 0.028, 0.75], [0, 0.49, 0], steel)
  box(hood, [0.73, 0.48, 0.028], [0, 0.245, 0.372], steel, 0.006)
  for (const x of [-0.352, 0.352]) box(hood, [0.026, 0.48, 0.72], [x, 0.245, 0], steel)
  box(hood, [0.71, 0.016, 0.023], [0, 0.02, 0.388], dark, 0.003)
  tube(
    hood,
    [
      [-0.39, 0.23, -0.24],
      [-0.41, 0.2, 0.38],
      [-0.39, 0.13, 0.47],
      [0.39, 0.13, 0.47],
      [0.41, 0.2, 0.38],
      [0.39, 0.23, -0.24],
    ],
    0.018,
    chrome,
  )
  panel(hood, 0.2, 0.045, [0, 0.35, 0.388], (ctx, w, h) => {
    ctx.fillStyle = '#243033'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f0f4f4'
    ctx.font = `700 ${h * 0.7}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('HOBART', w / 2, h * 0.77)
  })

  box(root, [0.3, 0.11, 0.025], [0, 0.827, 0.4], dark)
  const status = mesh(root, new THREE.CircleGeometry(0.027, 24), green, [0.075, 0.827, 0.416])
  panel(
    root,
    0.16,
    0.055,
    [-0.052, 0.827, 0.414],
    (ctx, w, h) => {
      ctx.fillStyle = '#c8e1d7'
      ctx.font = `600 ${h * 0.37}px sans-serif`
      ctx.fillText('PROFI', w * 0.1, h * 0.43)
      ctx.fillText('AMX', w * 0.1, h * 0.88)
    },
    true,
  )
  const rack = createDishRack(root, 1.021)
  const porcelain = material({ color: '#eceee5', roughness: 0.27 })
  const glass = material({ color: '#c4d9db', transparent: true, opacity: 0.65, roughness: 0.15 })
  const items = Array.from({ length: 16 }, (_, i) => {
    const vessel = mesh(rack, new THREE.CylinderGeometry(0.045, 0.035, 0.115, 16), porcelain, [
      -0.177 + (i % 4) * 0.118,
      0.09,
      -0.177 + Math.floor(i / 4) * 0.118,
    ])
    return vessel
  })

  return {
    update(state: GameState, dt: number) {
      const running = !!dishwasherJob(state)
      const hoodY = state.dishwasher.hoodOpen ? 1.51 : 1.01
      hood.position.y = dt > 0 ? THREE.MathUtils.damp(hood.position.y, hoodY, 12, dt) : hoodY
      green.color.set(running ? '#51a9d5' : '#48ab7b')
      green.emissive.copy(green.color)
      status.visible = running || state.dishwasher.clean
      const loaded = washItems.flatMap((item) => Array.from({ length: state.dishwasher.rack[item] ?? 0 }, () => item))
      let slot = 0
      items.forEach((vessel, index) => {
        const item = loaded[index]
        vessel.visible = !!item
        if (!item) return
        const pitcher = item === 'pitcher'
        vessel.material = porcelain
        if (pitcher) vessel.material = chrome
        else if (!item.startsWith('hot-mug')) vessel.material = glass
        vessel.scale.setScalar(pitcher ? 1.55 : 1)
        vessel.position.set(-0.177 + (slot % 4) * 0.118, pitcher ? 0.12 : 0.09, -0.177 + Math.floor(slot / 4) * 0.118)
        slot += rackSlots(item)
      })
    },
  }
}
