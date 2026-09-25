import * as THREE from 'three'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'

export const COLD_BREW_OUTLET: [number, number, number] = [0, 1.555, -1.33]

export function createColdBrewTank(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Toddy inspired commercial cold brewer'
  root.position.set(0.84, 1.1, -5.22)
  scene.add(root)
  const plastic = material({ color: '#edece5', roughness: 0.46 })
  const rim = material({ color: '#dadbd5', roughness: 0.38 })
  const black = material({ color: '#192023', roughness: 0.59 })
  const steel = material({ color: '#aab2b4', metalness: 0.9, roughness: 0.26 })
  const filter = material({ color: '#dfd3b8', roughness: 0.97, side: THREE.DoubleSide })
  box(root, [0.49, 0.026, 0.45], [0, 0.22, 0], black)
  for (const x of [-0.19, 0.19])
    for (const z of [-0.17, 0.17]) box(root, [0.038, 0.22, 0.038], [x, 0.11, z], black, 0.009)
  const vessel = new THREE.Group()
  vessel.position.y = 0.235
  root.add(vessel)
  // A closed lathed wall has a real interior, rolled rim, and molded reinforcing rings.
  lathe(
    vessel,
    [
      [0, 0],
      [0.21, 0],
      [0.218, 0.015],
      [0.246, 0.475],
      [0.253, 0.483],
      [0.253, 0.504],
      [0.24, 0.509],
      [0.234, 0.49],
      [0.208, 0.025],
      [0, 0.025],
    ],
    plastic,
  )
  for (const y of [0.4, 0.445, 0.482])
    lathe(
      vessel,
      [
        [0.235 + y * 0.016, y],
        [0.25, y + 0.002],
        [0.25, y + 0.012],
        [0.236 + y * 0.016, y + 0.014],
      ],
      rim,
    )
  lathe(
    vessel,
    [
      [0.199, 0.06],
      [0.221, 0.425],
      [0.239, 0.493],
      [0.236, 0.5],
    ],
    filter,
  )
  const lid = new THREE.Group()
  vessel.add(lid)
  lathe(
    lid,
    [
      [0, 0.51],
      [0.242, 0.51],
      [0.263, 0.513],
      [0.263, 0.531],
      [0.251, 0.54],
      [0.17, 0.547],
      [0, 0.547],
    ],
    plastic,
  )
  for (const x of [-0.25, 0.25]) box(vessel, [0.044, 0.053, 0.065], [x, 0.405, 0], plastic)
  tube(
    vessel,
    [
      [-0.25, 0.415, 0],
      [-0.274, 0.29, 0.06],
      [-0.2, 0.2, 0.2],
      [0, 0.17, 0.268],
      [0.2, 0.2, 0.2],
      [0.274, 0.29, 0.06],
      [0.25, 0.415, 0],
    ],
    0.006,
    steel,
  )
  tube(
    vessel,
    [
      [-0.063, 0.176, 0.259],
      [0, 0.17, 0.268],
      [0.063, 0.176, 0.259],
    ],
    0.012,
    plastic,
  )
  panel(vessel, 0.22, 0.14, [0, 0.32, 0.242], (ctx, w, h) => {
    ctx.fillStyle = '#153e4c'
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, w * 0.48, h * 0.47, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4f0e1'
    ctx.textAlign = 'center'
    ctx.font = `600 ${h * 0.23}px sans-serif`
    ctx.fillText('COLD BREW', w / 2, h * 0.47)
    ctx.font = `${h * 0.12}px sans-serif`
    ctx.fillText('COMMERCIAL BREWER', w / 2, h * 0.68)
  })
  const valve = mesh(vessel, new THREE.CylinderGeometry(0.036, 0.036, 0.038, 24), plastic, [0, 0.088, 0.235])
  valve.rotation.x = Math.PI / 2
  tube(
    vessel,
    [
      [0, 0.088, 0.25],
      [0, 0.088, 0.3],
      [0, 0.048, 0.329],
      [0, 0.025, 0.329],
    ],
    0.017,
    black,
  )
  box(vessel, [0.064, 0.017, 0.034], [0, 0.13, 0.285], black)
  box(vessel, [0.019, 0.046, 0.019], [0, 0.105, 0.285], black)
  const contents = mesh(
    vessel,
    new THREE.CylinderGeometry(0.218, 0.201, 1, 48),
    material({ color: '#3f2518', roughness: 0.33 }),
  )
  contents.visible = false
  return { root, lid, contents }
}

export function createColdBrewDispenser(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Cold brew service tap'
  root.position.set(0, 1.065, -0.99)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#c2cbcd', metalness: 0.95, roughness: 0.22 })
  const black = material({ color: '#141c1e', roughness: 0.57 })
  box(root, [0.43, 0.026, 0.54], [0, 0.014, 0.21], steel)
  box(root, [0.38, 0.008, 0.48], [0, 0.027, 0.21], black, 0.004)
  instances(
    root,
    new THREE.BoxGeometry(0.35, 0.003, 0.008),
    steel,
    Array.from({ length: 21 }, (_, i) => [0, 0.033, 0.025 + i * 0.018]),
  )
  lathe(
    root,
    [
      [0, 0.025],
      [0.118, 0.025],
      [0.12, 0.053],
      [0.073, 0.073],
      [0.068, 0.63],
      [0.064, 0.66],
      [0, 0.667],
    ],
    steel,
    [0, 0, -0.01],
  )
  tube(
    root,
    [
      [0, 0.57, 0.045],
      [0, 0.57, 0.21],
      [0, 0.545, 0.31],
      [0, 0.51, 0.34],
    ],
    0.022,
    steel,
  )
  mesh(root, new THREE.CylinderGeometry(0.026, 0.021, 0.034, 24), black, [0, 0.507, 0.34])
  tube(
    root,
    [
      [0, 0.58, 0.225],
      [0, 0.66, 0.19],
      [0, 0.75, 0.17],
    ],
    0.018,
    black,
  )
  box(root, [0.097, 0.16, 0.047], [0, 0.81, 0.156], black, 0.026)
  panel(root, 0.074, 0.105, [0, 0.81, 0.181], (ctx, w, h) => {
    ctx.fillStyle = '#e7ddbd'
    ctx.textAlign = 'center'
    ctx.font = `600 ${h * 0.16}px sans-serif`
    ctx.fillText('COLD', w / 2, h * 0.32)
    ctx.fillText('BREW', w / 2, h * 0.55)
    ctx.strokeStyle = '#a38b60'
    ctx.lineWidth = 4
    ctx.strokeRect(w * 0.1, h * 0.08, w * 0.8, h * 0.77)
  })
}
