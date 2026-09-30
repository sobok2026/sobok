import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import { workBox, workCylinder, workMaterial } from '../../shared/visuals/work-geometry'
import type { GameState } from '../../simulation/state'
import { type FoodProduct, foodProducts, SHOWCASE_CAPACITY } from './catalog'

function foodShape(parent: THREE.Object3D, product: FoodProduct) {
  const root = new THREE.Group()
  parent.add(root)
  const bread = workMaterial(product.color)

  if (product.category === 'sandwich') {
    workBox(root, 0.28, 0.045, 0.2, bread, 0, 0.025)
    workBox(root, 0.28, 0.045, 0.2, bread, 0, 0.1)
    workBox(root, 0.29, 0.017, 0.205, workMaterial('#66813e'), 0, 0.054)
    workBox(root, 0.265, 0.015, 0.2, workMaterial('#f2d36e'), 0, 0.071)
  } else if (product.category === 'cake') {
    workCylinder(root, 0.13, 0.13, 0.1, bread, 0.075)
    workCylinder(root, 0.132, 0.132, 0.025, workMaterial('#986d42'), 0.0125)
  } else if (product.id.includes('bagel')) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.042, 10, 24), bread)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.04
    root.add(ring)
  } else {
    const scone = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.13, 0.095, 3), bread)
    scone.position.y = 0.045
    root.add(scone)
  }

  return root
}

export function createFoodVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const showcase = new THREE.Group()
  showcase.position.set(-4.9, 0, -3.15)
  showcase.rotation.y = -Math.PI / 2
  scene.add(showcase)
  const slots = Array.from({ length: SHOWCASE_CAPACITY }, (_, index) => {
    const root = new THREE.Group()
    root.position.set(-1.72 + (index % 9) * 0.43, 1.025 + Math.floor(index / 9) * 0.24, 0)
    showcase.add(root)
    workCylinder(root, 0.17, 0.16, 0.014, workMaterial('#f3f0e6'))
    return { root, products: foodProducts.map((product) => ({ id: product.id, root: foodShape(root, product) })) }
  })

  const oven = new THREE.Group()
  oven.position.set(STATIONS['food-oven'].x, 0, STATIONS['food-oven'].z)
  oven.rotation.y = -Math.PI / 2
  scene.add(oven)
  workBox(oven, 0.8, 1, 0.8, workMaterial('#777e78'), 0, 0.5)
  workBox(oven, 0.77, 0.56, 0.68, workMaterial('#aeb7b2', 0.6), 0, 1.32)
  const windowMaterial = new THREE.MeshStandardMaterial({ color: '#141e1a', emissive: '#a33e0a', emissiveIntensity: 0 })
  workBox(oven, 0.52, 0.35, 0.018, windowMaterial, -0.07, 1.3, 0.35)
  workBox(oven, 0.46, 0.025, 0.045, workMaterial('#222b25'), -0.07, 1.53, 0.39)
  const displayCanvas = document.createElement('canvas')
  displayCanvas.width = 256
  displayCanvas.height = 128
  const displayTexture = new THREE.CanvasTexture(displayCanvas)
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 0.08),
    new THREE.MeshBasicMaterial({ map: displayTexture }),
  )
  display.position.set(0.28, 1.43, 0.35)
  oven.add(display)
  let lastStatus = ''

  const makeTray = (parent: THREE.Object3D) => {
    const root = new THREE.Group()
    parent.add(root)
    workBox(root, 0.38, 0.014, 0.29, workMaterial('#eee9da'))
    const packageBox = workBox(root, 0.34, 0.14, 0.24, workMaterial('#ccb58e'), 0, 0.08)

    return {
      root,
      packageBox,
      products: foodProducts.map((product) => ({ id: product.id, root: foodShape(root, product) })),
    }
  }
  const carried = makeTray(camera)
  carried.root.position.set(0.38, -0.55, -0.85)
  const placed = makeTray(scene)

  return {
    update(state: GameState) {
      const visible = state.foodBatches
        .filter((batch) => batch.location === 'showcase')
        .flatMap((batch) => Array.from({ length: Math.min(batch.quantity, SHOWCASE_CAPACITY) }, () => batch.productId))
        .slice(0, SHOWCASE_CAPACITY)
      slots.forEach((slot, index) => {
        slot.root.visible = !!visible[index]
        for (const product of slot.products) product.root.visible = product.id === visible[index]
      })
      const work = state.foodWork
      const line = state.sale?.foodLines.find((line) => line.id === work?.lineId)
      const status =
        work?.stage === 'heating'
          ? `${Math.max(0, Math.ceil((work.heatingEndsAt ?? state.time) - state.time))}s`
          : 'READY'

      if (status !== lastStatus) {
        lastStatus = status
        const context = displayCanvas.getContext('2d')!
        context.fillStyle = '#092f29'
        context.fillRect(0, 0, 256, 128)
        context.fillStyle = '#9ee6b7'
        context.font = canvasFont(50)
        context.textAlign = 'center'
        context.fillText(status, 128, 84)
        displayTexture.needsUpdate = true
      }

      windowMaterial.emissiveIntensity = work?.stage === 'heating' ? 0.9 : 0

      for (const tray of [carried, placed]) {
        tray.root.visible =
          !!work &&
          (tray === carried ? work.location === 'hand' : work.location !== 'hand' && work.location !== 'food-oven')
        tray.packageBox.visible = work?.stage === 'packed' && (work.packaging !== 'none' || line?.service === 'takeout')

        for (const product of tray.products)
          product.root.visible = work?.productId === product.id && !tray.packageBox.visible
      }

      placed.root.position.set(STATIONS.pickup.x, 1.125, STATIONS.pickup.z)
    },
    obstacle: { x: STATIONS['food-oven'].x, z: STATIONS['food-oven'].z, width: 0.8, depth: 0.8, minY: 0, maxY: 1.6 },
  }
}
