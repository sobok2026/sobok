import * as THREE from 'three'
import { recipeSizeSchema } from '../content/recipe-schema'
import {
  BACKROOM_DOOR,
  BACKROOM_FRONT_Z,
  BAR_CENTER_Z,
  CONDIMENT_BAR,
  SHOP_BOUNDS,
  STATIONS,
  staffFacingZ,
} from '../content/stations'
import { createColdBrewDispenser } from '../features/cold-brew/equipment'
import { createEspressoMachine } from '../features/crafting/espresso-machine'
import { createIceBin, createSyrupStation, createWaterStation } from '../features/crafting/station-equipment'
import { createDigitalUrn } from '../features/drip-coffee/equipment'
import { BAR_BATCH_CAPACITY } from '../features/inventory/batches'
import { cupKinds, cupRow, cupRows, cupSize, rowCupKinds } from '../features/inventory/cups'
import { createBarRefrigerator } from '../features/inventory/refrigerator'
import { createBlender } from '../features/preparation/blender'
import { createRegister } from '../features/service/register'
import { canvasFont, paintTexture } from '../shared/visuals/canvas-text'
import { createCondimentBar } from '../shared/visuals/condiment-bar'
import { createCupBody } from '../shared/visuals/cup-visual'
import { addVesselLabel } from '../shared/visuals/vessel-label'
import { createBackroom } from './backroom'
import { createCoffeehouse } from './coffeehouse'
import { createMenuBoards } from './menu-board'

export function createShopInterior(scene: THREE.Scene) {
  const materialCache = new Map<string, THREE.MeshStandardMaterial>()

  const material = (color: string | THREE.MeshStandardMaterial, metal = 0) => {
    if (color instanceof THREE.MeshStandardMaterial) return color
    const key = `${color}/${metal}`
    let value = materialCache.get(key)

    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.35 : 0.78, metalness: metal })
      materialCache.set(key, value)
    }

    return value
  }

  const { materials, obstacles, occluders } = createCoffeehouse(scene)
  const backroom = createBackroom(scene)
  obstacles.push(...backroom.obstacles)
  occluders.push(...backroom.occluders)

  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string | THREE.MeshStandardMaterial,
    parent: THREE.Object3D = scene,
    metal = 0,
  ) {
    const geometry = new THREE.BoxGeometry(w, h, d)

    if (color === materials.tile) {
      const points = geometry.attributes.position
      const uv = geometry.attributes.uv

      for (let i = 0; i < points.count; i++) uv.setXY(i, points.getX(i), points.getY(i))
    }

    const mesh = new THREE.Mesh(geometry, material(color, metal))
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  function cylinder(
    x: number,
    y: number,
    z: number,
    top: number,
    bottom: number,
    height: number,
    color: string | THREE.MeshStandardMaterial,
    parent: THREE.Object3D = scene,
    openEnded = false,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 20, 1, openEnded), material(color))
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  function repeatedBoxes(
    instances: [number, number, number, number, number, number][],
    color: string | THREE.MeshStandardMaterial,
  ) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material(color), instances.length)
    const transform = new THREE.Object3D()

    instances.forEach(([x, y, z, width, height, depth], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(width, height, depth)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })

    mesh.computeBoundingSphere()
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  function sign(text: string, width: number, height: number, background = '#242925', foreground = '#e9e2ce') {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round((1024 * height) / width)
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    paintTexture(texture, () => {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = foreground
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lines = text.split('\n')
      ctx.font = canvasFont(Math.min(95, canvas.height / (lines.length + 1)), 600)

      lines.forEach((line, i) => {
        ctx.fillText(line, 512, (canvas.height * (i + 1)) / (lines.length + 1), 950)
      })
    })

    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    )
  }

  box(0, 0.028, -3.82, 11.4, 0.025, 0.85, '#42443d')
  const doorLeft = BACKROOM_DOOR.x - BACKROOM_DOOR.width / 2
  const doorRight = BACKROOM_DOOR.x + BACKROOM_DOOR.width / 2

  for (const [left, right] of [
    [SHOP_BOUNDS.minX, doorLeft],
    [doorRight, SHOP_BOUNDS.maxX],
  ]) {
    const x = (left + right) / 2
    const width = right - left
    occluders.push(box(x, 1.92, BACKROOM_FRONT_Z, width, 3.84, 0.18, materials.tile))
    obstacles.push({ x, z: BACKROOM_FRONT_Z, width, depth: 0.18 })
  }

  occluders.push(box(BACKROOM_DOOR.x, 3.17, BACKROOM_FRONT_Z, BACKROOM_DOOR.width, 1.34, 0.18, materials.tile))
  for (const x of [doorLeft, doorRight]) box(x, 1.25, BACKROOM_FRONT_Z, 0.055, 2.5, 0.22, materials.charcoal)
  const backroomSign = sign('PARTNERS ONLY', 1, 0.17)
  backroomSign.position.set(BACKROOM_DOOR.x, 2.72, BACKROOM_FRONT_Z + 0.1)
  scene.add(backroomSign)
  const barSign = sign('BAR · 제조 공간', 1.3, 0.24)
  barSign.position.set(BACKROOM_DOOR.x, 2.72, BACKROOM_FRONT_Z - 0.1)
  barSign.rotation.y = Math.PI
  scene.add(barSign)
  box(-0.075, 0.48, BAR_CENTER_Z, 8.55, 0.96, 1.18, materials.oak)
  box(-0.075, 1.0, BAR_CENTER_Z, 8.65, 0.12, 1.35, materials.counter)
  const slats: [number, number, number, number, number, number][] = []
  for (let x = -4.3; x < 4.18; x += 0.06) slats.push([x, 0.5, -0.438, 0.035, 0.78, 0.035])
  repeatedBoxes(slats, materials.oak)
  box(-0.075, 0.08, -0.437, 8.6, 0.15, 0.035, materials.charcoal)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.018, 0.018), materials.light)
  strip.position.set(-0.075, 0.936, -0.42)
  scene.add(strip)
  for (let x = -3.8; x < 4; x += 1.05) {
    box(x, 0.47, -1.655, 1, 0.83, 0.025, '#7c786e')
    box(x, 0.79, -1.679, 0.22, 0.024, 0.025, materials.charcoal, scene, 0.5)
  }
  obstacles.push({ x: -0.075, z: BAR_CENTER_Z, width: 8.65, depth: 1.35, minY: 0, maxY: 1.06, blocksSight: true })

  const showcase = new THREE.Group()
  showcase.position.set(-4.9, 0, -3.15)
  showcase.rotation.y = -Math.PI / 2
  scene.add(showcase)
  box(0, 0.46, 0, 3.95, 0.92, 1.12, materials.oak, showcase)
  box(0, 0.955, 0, 4, 0.07, 1.18, materials.counter, showcase)
  box(0, 1.24, 0.575, 3.94, 0.56, 0.022, materials.glass, showcase)
  for (const x of [-1.97, 1.97]) box(x, 1.25, 0, 0.035, 0.58, 1.17, materials.charcoal, showcase)
  for (const y of [1.01, 1.25, 1.54]) {
    box(0, y, 0, 3.94, 0.018, 1.16, materials.glass, showcase)
    box(0, y, 0.58, 3.94, 0.015, 0.02, materials.brass, showcase)
    if (y > 1.4) continue
    for (let i = 0; i < 9; i++) {
      box(-1.72 + i * 0.43, y + 0.06, 0.23, 0.3, 0.1, 0.3, materials.linen, showcase)
      cylinder(-1.72 + i * 0.43, y + 0.06, -0.2, 0.13, 0.13, 0.1, materials.leather, showcase)
    }
  }
  obstacles.push({
    x: -4.9,
    z: -3.15,
    width: 3.95,
    depth: 1.18,
    yaw: -Math.PI / 2,
    minY: 0,
    maxY: 1.56,
    blocksSight: true,
  })

  const staffSign = sign('STAFF ONLY', 1.1, 0.2)
  staffSign.position.set(8.6, 2.6, -0.4)
  scene.add(staffSign)
  for (const [left, right] of [
    [-3.6, 0.475],
    [1.925, 3.95],
    [4.45, 6.95],
  ])
    box((left + right) / 2, 0.48, -5.2, right - left, 0.96, 0.9, '#a9aaa2')
  box(4.2, 0.35, -5.2, 0.5, 0.7, 0.9, '#a9aaa2')
  for (const z of [-5.5925, -4.8075]) box(4.2, 0.48, z, 0.5, 0.96, 0.115, '#a9aaa2')
  for (const [left, right] of [
    [-3.65, 3.95],
    [4.45, 6.95],
  ])
    box((left + right) / 2, 1.05, -5.2, right - left, 0.09, 1, materials.counter)
  for (const z of [-5.6175, -4.7825]) box(4.2, 1.05, z, 0.5, 0.09, 0.165, materials.counter)
  obstacles.push({ x: 1.65, z: -5.2, width: 10.6, depth: 1, minY: 0, maxY: 1.095 })
  box(STATIONS.rack.x, 1.4, STATIONS.rack.z, 0.95, 0.04, 0.72, '#adb9ac')
  for (const x of [STATIONS.rack.x - 0.42, STATIONS.rack.x + 0.42]) {
    box(x, 1.24, STATIONS.rack.z - 0.3, 0.04, 0.32, 0.04, '#adb9ac')
  }
  createMenuBoards(scene)
  const register = createRegister(scene)
  // Stemmed glasses do not stack, so each dedicated vessel occupies its own rack slot.
  const cupStacks = cupKinds.map((kind) => {
    const size = cupSize(kind)
    const column = size ? recipeSizeSchema.options.indexOf(size) * 0.23 : rowCupKinds(cupRow(kind)).indexOf(kind) * 0.19

    return {
      kind,
      cups: Array.from({ length: size ? 4 : 1 }, (_, i) => {
        const body = createCupBody(scene, kind)
        body.root.scale.setScalar(0.48)
        body.root.position.set(
          STATIONS.cups.x - 0.42 + cupRows.indexOf(cupRow(kind)) * 0.12,
          1.066 + i * 0.055,
          -1.45 + column * 0.6,
        )
        return body
      }),
    }
  })
  createEspressoMachine(scene)
  createEspressoMachine(scene, 'espresso-2')
  const digitalUrn = createDigitalUrn(scene)
  const milkCarton = box(STATIONS.steam.x - 0.28, 1.25, staffFacingZ(-1.12), 0.15, 0.38, 0.18, '#e7e6d7')
  addVesselLabel(milkCarton, '우유', '#527f66', 0.13, 0.09, 0, 0.092)
  createColdBrewDispenser(scene)
  createWaterStation(scene)
  const iceBin = createIceBin(scene)
  const syrupStation = createSyrupStation(scene)
  box(STATIONS.mix.x, 1.07, staffFacingZ(-1.0), 0.72, 0.025, 0.5, '#697959')
  const foamContainer = cylinder(STATIONS.topping.x - 0.15, 1.24, STATIONS.topping.z + 0.1, 0.15, 0.13, 0.33, '#e9ddbc')
  addVesselLabel(foamContainer, '폼', '#527f66', 0.19, 0.1, -0.015, 0.145)
  const powderContainer = cylinder(
    STATIONS.topping.x + 0.2,
    1.18,
    STATIONS.topping.z + 0.1,
    0.11,
    0.11,
    0.22,
    '#c69c5e',
  )
  addVesselLabel(powderContainer, '파우더', '#886628', 0.16, 0.08, 0, 0.112)
  const pickupSign = sign('PICK UP', 0.7, 0.16, '#ac794b', '#262e28')
  pickupSign.position.set(STATIONS.pickup.x, 0.74, -0.405)
  scene.add(pickupSign)
  const blender = createBlender(scene, 'blender')
  const prepBlender = createBlender(scene, 'prep')
  createBarRefrigerator(scene)
  for (const station of [STATIONS['bar-fridge']]) {
    obstacles.push({ x: station.x, z: station.z - 0.4, width: 1.4, depth: 1.1 })
  }
  const shelfSign = sign(`바 실온 재료 · 품목별 ${BAR_BATCH_CAPACITY}개`, 1.3, 0.14, '#d9d3c3', '#344238')
  box(9.07, 0.5, STATIONS.shelf.z, 0.55, 1, 1.8, materials.oak)
  box(9.07, 1.05, STATIONS.shelf.z, 0.6, 0.09, 1.85, materials.counter)
  obstacles.push({ x: 9.07, z: STATIONS.shelf.z, width: 0.6, depth: 1.85, minY: 0, maxY: 1.095 })
  shelfSign.position.set(8.75, 0.83, STATIONS.shelf.z)
  shelfSign.rotation.y = -Math.PI / 2
  scene.add(shelfSign)
  createCondimentBar(scene)
  obstacles.push({ ...CONDIMENT_BAR, minY: 0, maxY: 1.08, blocksSight: true })

  return {
    obstacles,
    occluders,
    blender,
    prepBlender,
    register,
    syrupStation,
    cupStacks,
    digitalUrn,
    iceBin,
    dishwasher: backroom.dishwasher,
    iceMachine: backroom.iceMachine,
  }
}
