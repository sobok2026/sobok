import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { ICE } from './rules'

function icePile(parent: THREE.Object3D, width: number, depth: number, round = false) {
  const ice = material({ color: '#d0e7ef', transparent: true, opacity: 0.8, roughness: 0.18, depthWrite: false })
  const pile = new THREE.InstancedMesh(new RoundedBoxGeometry(0.043, 0.035, 0.04, 1, 0.006), ice, 180)
  const transform = new THREE.Object3D()
  for (let i = 0; i < 180; i++) {
    const radius = Math.sqrt((i + 0.5) / 180) / 2
    const x = round ? Math.cos(i * 2.4) * radius : (i % 15) / 14 - 0.5
    const z = round ? Math.sin(i * 2.4) * radius : Math.floor(i / 15) / 11 - 0.5
    transform.position.set(x * width, Math.sin(i * 2.41) * 0.025, z * depth)
    transform.rotation.set(i * 0.37, i * 1.17, i * 0.23)
    transform.updateMatrix()
    pile.setMatrixAt(i, transform.matrix)
  }
  pile.computeBoundingSphere()
  parent.add(pile)
  return pile
}

export function createIceBucket(parent: THREE.Object3D) {
  const root = new THREE.Group()
  parent.add(root)
  const plastic = material({ color: '#dee8e3', roughness: 0.37, side: THREE.DoubleSide })
  const grip = material({ color: '#2a7185', roughness: 0.54 })
  lathe(
    root,
    [
      [0, 0],
      [0.14, 0],
      [0.16, 0.02],
      [0.205, 0.37],
      [0.2, 0.388],
      [0.187, 0.38],
      [0.143, 0.026],
      [0, 0.026],
    ],
    plastic,
  )
  tube(
    root,
    [
      [-0.2, 0.3, 0],
      [-0.23, 0.48, 0],
      [0, 0.56, 0],
      [0.23, 0.48, 0],
      [0.2, 0.3, 0],
    ],
    0.016,
    grip,
  )
  panel(root, 0.19, 0.085, [0, 0.22, 0.19], (ctx, w, h) => {
    ctx.fillStyle = '#28586c'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f1f5ee'
    ctx.font = canvasFont(h * 0.42, 600)
    ctx.textAlign = 'center'
    ctx.fillText('얼음 전용', w / 2, h * 0.67)
  })
  return root
}

export function createIceMachine(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Ice-O-Matic CIM1446 and B110 slope-front storage bin'
  root.position.set(STATIONS['ice-machine'].x, 0, STATIONS['ice-machine'].z + 0.49)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#c3c9cb', metalness: 0.88, roughness: 0.42 })
  const black = material({ color: '#20262b', roughness: 0.56 })
  const liner = material({ color: '#dfe6e2', roughness: 0.64 })
  const blue = material({ color: '#447e98', emissive: '#3c97b9', emissiveIntensity: 0.65 })

  for (const x of [-0.51, 0.51]) {
    for (const z of [-0.34, 0.34]) {
      mesh(root, new THREE.CylinderGeometry(0.029, 0.023, 0.17, 16), steel, [x, 0.115, z])
      box(root, [0.08, 0.03, 0.08], [x, 0.033, z], black)
    }
  }
  // Build the bin around an actual cavity so the moving lid reveals stored ice.
  box(root, [1.22, 0.12, 0.83], [0, 0.23, 0], steel)
  for (const x of [-0.59, 0.59]) box(root, [0.05, 0.9, 0.83], [x, 0.72, 0], steel)
  box(root, [1.14, 0.76, 0.035], [0, 0.67, -0.399], liner)
  box(root, [1.13, 0.018, 0.75], [0, 0.31, 0], liner)
  box(root, [1.17, 0.38, 0.04], [0, 0.43, 0.401], steel)
  box(root, [1.23, 0.66, 0.62], [0, 1.5, -0.1], steel)
  box(root, [1.2, 0.64, 0.025], [0, 1.5, 0.222], steel)
  for (const x of [-0.43, 0.43]) box(root, [0.035, 0.64, 0.009], [x, 1.5, 0.238], black, 0.002)
  const status = mesh(root, new THREE.CircleGeometry(0.013, 16), blue, [0.54, 1.52, 0.239])
  panel(root, 0.38, 0.07, [-0.34, 1.65, 0.239], (ctx, w, h) => {
    ctx.fillStyle = '#285e87'
    ctx.font = `italic 700 ${h * 0.6}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('ICE-O-MATIC', w / 2, h * 0.75)
  })
  const lid = new THREE.Group()
  lid.position.set(0, 1.15, 0.19)
  root.add(lid)
  box(lid, [1.12, 0.56, 0.045], [0, -0.28, 0], black)
  box(lid, [0.42, 0.035, 0.043], [0, -0.46, 0.043], steel)
  const ice = icePile(root, 1.04, 0.64)
  const bucket = createIceBucket(root)
  bucket.position.set(-0.98, 0.68, 0.01)
  tube(
    root,
    [
      [-0.98, 0.95, -0.15],
      [-0.98, 1.23, -0.15],
      [-0.98, 1.26, 0.02],
    ],
    0.018,
    steel,
  )
  for (const x of [0.83, 1.0]) {
    mesh(root, new THREE.CylinderGeometry(0.055, 0.055, 0.47, 20), liner, [x, 1.55, -0.27])
    box(root, [0.13, 0.045, 0.13], [x, 1.81, -0.27], blue)
  }
  tube(
    root,
    [
      [0.53, 1.2, -0.36],
      [0.83, 1.2, -0.36],
      [0.83, 1.84, -0.27],
      [1, 1.84, -0.27],
    ],
    0.012,
    black,
  )
  tube(
    root,
    [
      [0.45, 0.28, -0.1],
      [0.73, 0.16, 0],
      [0.87, 0.1, 0],
    ],
    0.024,
    black,
  )

  return {
    update(state: GameState) {
      lid.rotation.x = state.ice.bucketHeld ? -1.15 : -0.36
      ice.visible = state.ice.stored > 0
      ice.position.y = 0.34 + Math.min(1, state.ice.stored / ICE.capacity) * 0.43
      status.visible = state.ice.enabled
      bucket.visible = !state.ice.bucketHeld
    },
  }
}

export function createCarriedIce(camera: THREE.Camera) {
  const bucket = createIceBucket(camera)
  bucket.position.set(0.24, -0.63, -0.82)
  const ice = icePile(bucket, 0.25, 0.25, true)
  ice.position.y = 0.32
  return {
    update(state: GameState) {
      bucket.visible = state.ice.bucketHeld
      ice.visible = state.ice.bucket > 0
      ice.position.y = 0.06 + (state.ice.bucket / ICE.bucketCapacity) * 0.27
    },
  }
}
