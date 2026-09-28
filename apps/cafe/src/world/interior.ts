import * as THREE from 'three'
import { recipeSizeSchema } from '../content/recipe-schema'
import {
  BACKROOM_DOOR,
  BACKROOM_FRONT_Z,
  BAR_CENTER_Z,
  CONDIMENT_BAR,
  STATIONS,
  staffFacingZ,
} from '../content/stations'
import { createColdBrewDispenser } from '../features/cold-brew/equipment'
import { createEspressoMachine } from '../features/crafting/espresso-machine'
import { createIceBin, createSyrupStation, createWaterStation } from '../features/crafting/station-equipment'
import { createDigitalUrn } from '../features/drip-coffee/equipment'
import { BAR_BATCH_CAPACITY } from '../features/inventory/batches'
import { cupKinds, cupRow, cupRows, cupSize, rowCupKinds } from '../features/inventory/cups'
import { createDryStorage } from '../features/inventory/dry-storage'
import { createRefrigerator } from '../features/inventory/refrigerator'
import { createBlender } from '../features/preparation/blender'
import { CUSTOMER_DOOR_X } from '../features/service/customer'
import { createRegister } from '../features/service/register'
import { createWashingEquipment } from '../features/washing/equipment'
import { canvasFont, paintTexture } from '../shared/visuals/canvas-text'
import { createCondimentBar } from '../shared/visuals/condiment-bar'
import { createCupBody } from '../shared/visuals/cup-visual'
import { addVesselLabel } from '../shared/visuals/vessel-label'

export type Obstacle = { x: number; z: number; width: number; depth: number }

export function createShopInterior(scene: THREE.Scene) {
  const materials = new Map<string, THREE.MeshStandardMaterial>()

  const material = (color: string, metal = 0) => {
    const key = `${color}/${metal}`
    let value = materials.get(key)

    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.35 : 0.78, metalness: metal })
      materials.set(key, value)
    }

    return value
  }

  const obstacles: Obstacle[] = []
  const occluders: THREE.Object3D[] = []

  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    parent: THREE.Object3D = scene,
    metal = 0,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, metal))
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
    color: string,
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

  function repeatedBoxes(instances: [number, number, number, number, number, number][], color: string) {
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

  function sign(text: string, width: number, height: number, background = '#123f35', foreground = '#f2e7ce') {
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

  // Warm wooden floor and a cream envelope; the front glazing opens toward a small street.
  box(0, -0.08, -2, 14, 0.15, 16, '#ad9174')
  const floorSeams: [number, number, number, number, number, number][] = []
  for (let x = -6.75; x < 7; x += 0.5) floorSeams.push([x, 0.003, -2, 0.012, 0.008, 16])
  repeatedBoxes(floorSeams, '#967b61')
  // The tiled employee aisle stays behind the counter; the timber floor belongs to the seating area.
  box(0, 0.014, -3.82, 13.45, 0.02, 4.05, '#b6bcb1')
  const tileSeams: [number, number, number, number, number, number][] = []
  for (let x = -6.5; x < 6.8; x += 0.65) tileSeams.push([x, 0.026, -3.82, 0.012, 0.004, 4.05])
  for (let z = -5.7; z < -1.8; z += 0.65) tileSeams.push([0, 0.027, z, 13.4, 0.004, 0.012])
  repeatedBoxes(tileSeams, '#9fa89c')
  box(0, 0.014, -7.87, 13.45, 0.02, 3.96, '#c4cbc5')
  const backroomSeams: [number, number, number, number, number, number][] = []
  for (let x = -6.5; x < 6.8; x += 0.65) backroomSeams.push([x, 0.027, -7.87, 0.012, 0.004, 3.96])
  for (let z = -9.7; z < -5.9; z += 0.65) backroomSeams.push([0, 0.027, z, 13.4, 0.004, 0.012])
  repeatedBoxes(backroomSeams, '#aab5ab')
  box(0, 0.037, -2.24, 10.9, 0.02, 0.65, '#4c6156')
  box(0, 1.8, -9.85, 14, 3.6, 0.18, '#e7e9df')
  box(-6.85, 1.8, -2, 0.18, 3.6, 16, '#e8e0ce')
  box(6.85, 1.8, -5.0, 0.18, 3.6, 9.8, '#e8e0ce')
  const doorLeft = BACKROOM_DOOR.x - BACKROOM_DOOR.width / 2
  const doorRight = BACKROOM_DOOR.x + BACKROOM_DOOR.width / 2

  for (const [left, right] of [
    [-6.85, doorLeft],
    [doorRight, 6.85],
  ]) {
    const x = (left + right) / 2
    const width = right - left
    occluders.push(box(x, 1.8, BACKROOM_FRONT_Z, width, 3.6, 0.18, '#e2e5d9'))
    obstacles.push({ x, z: BACKROOM_FRONT_Z, width, depth: 0.18 })
  }

  occluders.push(box(BACKROOM_DOOR.x, 3.05, BACKROOM_FRONT_Z, BACKROOM_DOOR.width, 1.1, 0.18, '#e2e5d9'))
  for (const x of [doorLeft, doorRight]) box(x, 1.25, BACKROOM_FRONT_Z, 0.055, 2.5, 0.22, '#607365')
  const backroomSign = sign('BACKROOM · 백룸', 1.3, 0.24)
  backroomSign.position.set(BACKROOM_DOOR.x, 2.72, BACKROOM_FRONT_Z + 0.1)
  scene.add(backroomSign)
  const barSign = sign('BAR · 제조 공간', 1.3, 0.24)
  barSign.position.set(BACKROOM_DOOR.x, 2.72, BACKROOM_FRONT_Z - 0.1)
  barSign.rotation.y = Math.PI
  scene.add(barSign)
  box(-1.125, 0.25, 5.8, 11.75, 0.5, 0.16, '#244c3e')
  box(6.575, 0.25, 5.8, 0.85, 0.5, 0.16, '#244c3e')
  for (const x of [CUSTOMER_DOOR_X - 0.72, CUSTOMER_DOOR_X + 0.72]) box(x, 1.75, 5.8, 0.06, 3.5, 0.12, '#244c3e')
  const entranceSign = sign('출입구', 1.15, 0.3, '#244c3e', '#f2e7ce')
  entranceSign.position.set(CUSTOMER_DOOR_X, 2.55, 5.78)
  entranceSign.rotation.y = Math.PI
  scene.add(entranceSign)
  for (const x of [-6.7, -2.2, 2.2, 6.7]) box(x, 1.95, 5.8, 0.07, 3.5, 0.12, '#244c3e')
  box(0, 3.55, 5.8, 14, 0.08, 0.12, '#244c3e')
  box(0, 0, 10, 25, 0.1, 8, '#c7c9b8')

  for (const x of [-10, 9]) {
    cylinder(x, 1.0, 11, 0.2, 0.25, 2, '#776651')
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), material('#819576'))
    crown.position.set(x, 3.7, 11)
    scene.add(crown)
  }

  // Main bar with fluted wood facing.
  // The drop-in ice bin extends through the top into a cavity in the existing cabinet.
  box(-1.95, 0.48, -1.05, 7.6, 0.96, 1.18, '#946e4c')
  box(4.05, 0.48, -1.05, 3.4, 0.96, 1.18, '#946e4c')
  box(2.1, 0.48, -1.4525, 0.5, 0.96, 0.375, '#946e4c')
  box(2.1, 0.48, -0.5275, 0.5, 0.96, 0.135, '#946e4c')
  box(2.1, 0.36, -0.93, 0.5, 0.72, 0.67, '#946e4c')
  box(-1.9925, 1.0, -1.05, 7.715, 0.12, 1.35, '#ddd1b9')
  box(4.0925, 1.0, -1.05, 3.515, 0.12, 1.35, '#ddd1b9')
  box(2.1, 1.0, -1.4875, 0.47, 0.12, 0.475, '#ddd1b9')
  box(2.1, 1.0, -0.4925, 0.47, 0.12, 0.235, '#ddd1b9')
  const barSlats: [number, number, number, number, number, number][] = []
  for (let x = -5.6; x <= 5.6; x += 0.18) barSlats.push([x, 0.47, -0.445, 0.035, 0.85, 0.025])
  repeatedBoxes(barSlats, '#795a3c')

  for (let x = -5.15; x < 5.5; x += 1.15) {
    box(x, 0.47, -1.655, 1.08, 0.83, 0.025, '#aaa48f')
    box(x, 0.79, -1.679, 0.22, 0.024, 0.025, '#45564a', scene, 0.5)
  }

  obstacles.push({ x: 0, z: -1.05, width: 11.7, depth: 1.4 })
  // The left staff entrance is the only route between the work aisle and the customer floor.
  box(-6.26, 0.019, BAR_CENTER_Z, 0.94, 0.025, 1.45, '#466050')
  for (const x of [-6.78, -5.83]) box(x, 1.17, BAR_CENTER_Z, 0.045, 2.34, 0.08, '#465b4d')
  box(-6.3, 2.32, BAR_CENTER_Z, 1.02, 0.07, 0.1, '#465b4d')
  const staffSign = sign('STAFF ONLY\n직원 출입구', 0.82, 0.32)
  staffSign.position.set(-6.3, 2.08, BAR_CENTER_Z + 0.045)
  scene.add(staffSign)
  const floorSign = sign('고객 공간 ↗', 0.82, 0.25, '#d9d8c8', '#304d3d')
  floorSign.position.set(-6.3, 2.08, BAR_CENTER_Z - 0.045)
  floorSign.rotation.y = Math.PI
  scene.add(floorSign)
  box(-2.9, 0.5, -9.2, 5.5, 1, 0.9, '#d1d9cf')
  // Leave a real opening in the worktop for the recessed washing basin.
  box(-5.56, 1.05, -9.2, 0.28, 0.09, 1.0, '#b9c4bb')
  box(-2.34, 1.05, -9.2, 4.48, 0.09, 1.0, '#b9c4bb')
  box(-5, 1.05, -9.56, 0.84, 0.09, 0.28, '#b9c4bb')
  box(-5, 1.05, -8.74, 0.84, 0.09, 0.08, '#b9c4bb')
  obstacles.push({ x: -2.9, z: -9.2, width: 5.6, depth: 1 })
  // The bar keeps its own blender and clean tools, beside the working ingredient storage.
  box(-2.5, 0.5, -5.2, 4.7, 1, 0.9, '#e1d5bb')
  box(-2.5, 1.05, -5.2, 4.8, 0.09, 1, '#c8bda5')
  obstacles.push({ x: -2.5, z: -5.2, width: 4.8, depth: 1 })
  box(STATIONS.rack.x, 1.4, STATIONS.rack.z, 0.95, 0.04, 0.72, '#adb9ac')
  for (const x of [STATIONS.rack.x - 0.42, STATIONS.rack.x + 0.42]) {
    box(x, 1.24, STATIONS.rack.z - 0.3, 0.04, 0.32, 0.04, '#adb9ac')
  }
  for (const [label, x] of [
    ['세척 · 건조', -4.5],
    ['배치 준비', -2.2],
    ['장시간 추출', 1],
    ['예비 재고', 5.1],
  ] as const) {
    const marker = sign(label, 1.5, 0.28, '#e7e9df', '#345747')
    marker.position.set(x, 2.6, -9.73)
    scene.add(marker)
  }
  const mainSign = sign('소복다방\nCOFFEE & COMPANY', 3.9, 1.2)
  mainSign.position.set(0, 2.65, -5.72)
  scene.add(mainSign)
  const menuSign = sign(
    'TODAY’S MENU\nCOLD BREW\nBLACK GLAZED LATTE\nHOJI GLAZED TEA LATTE\nPURE HOJICHA · MATCHA',
    2.4,
    1.4,
    '#ece1ca',
    '#344e3d',
  )
  menuSign.position.set(-3.6, 2.45, -5.71)
  scene.add(menuSign)
  box(3.0, 2.1, -5.4, 1.9, 0.08, 0.65, '#806749')

  for (let i = 0; i < 5; i++) {
    box(2.25 + i * 0.33, 2.37, -5.43, 0.23, 0.5, 0.22, i % 2 ? '#b28b58' : '#d5c1a0')
  }

  for (const x of [-4.1, -0.3, 3.5]) {
    cylinder(x, 3.25, -0.8, 0.015, 0.015, 0.7, '#594d3c')
    cylinder(x, 2.86, -0.8, 0.12, 0.32, 0.22, '#31483b')
    cylinder(x, 2.73, -0.8, 0.28, 0.28, 0.012, '#f2d8a0')
  }

  function plant(x: number, z: number, size = 1) {
    cylinder(x, 0.25 * size, z, 0.28 * size, 0.2 * size, 0.5 * size, '#c3aa84')
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35 * size, 8, 6), material(i % 2 ? '#4b7051' : '#68855b'))
      leaf.scale.set(0.55, 1.6, 0.45)
      leaf.position.set(
        x + Math.sin(i * 2) * 0.25 * size,
        (0.65 + (i % 3) * 0.14) * size,
        z + Math.cos(i * 2) * 0.25 * size,
      )
      leaf.rotation.z = Math.sin(i) * 0.5
      scene.add(leaf)
    }
  }

  plant(5.9, 4.6, 1.3)
  plant(-6.15, 5.28, 0.75)
  // Named work surfaces remain visually distinct at first-person distance.
  const register = createRegister(scene)
  // One rack row per cup line or vessel group. Standard cups line up by size and stack; a drink's own vessels stand
  // one each in rack order, since stemmed glasses do not stack.
  const cupStacks = cupKinds.map((kind) => {
    const size = cupSize(kind)
    const column = size ? recipeSizeSchema.options.indexOf(size) * 0.23 : rowCupKinds(cupRow(kind)).indexOf(kind) * 0.19

    return {
      kind,
      cups: Array.from({ length: size ? 4 : 1 }, (_, i) => {
        const body = createCupBody(scene, kind)
        body.root.scale.setScalar(0.48)
        body.root.position.set(-4.13 + cupRows.indexOf(cupRow(kind)) * 0.17, 1.066 + i * 0.055, -1.45 + column)
        return body
      }),
    }
  })
  createEspressoMachine(scene)
  const digitalUrn = createDigitalUrn(scene)
  const milkCarton = box(-3.23, 1.25, staffFacingZ(-1.12), 0.15, 0.38, 0.18, '#e7e6d7')
  addVesselLabel(milkCarton, '우유', '#527f66', 0.13, 0.09, 0, 0.092)
  createColdBrewDispenser(scene)
  createWaterStation(scene)
  createIceBin(scene)
  const syrupStation = createSyrupStation(scene)
  box(4.1, 1.07, staffFacingZ(-1.0), 0.72, 0.025, 0.5, '#697959')
  const foamContainer = cylinder(4.95, 1.24, staffFacingZ(-1.1), 0.15, 0.13, 0.33, '#e9ddbc')
  addVesselLabel(foamContainer, '폼', '#527f66', 0.19, 0.1, -0.015, 0.145)
  const powderContainer = cylinder(5.3, 1.18, staffFacingZ(-1.1), 0.11, 0.11, 0.22, '#c69c5e')
  addVesselLabel(powderContainer, '파우더', '#886628', 0.16, 0.08, 0, 0.112)
  box(6.1, 0.5, BAR_CENTER_Z, 1.1, 1, 1.2, '#57735c')
  box(6.1, 1.05, BAR_CENTER_Z, 1.15, 0.08, 1.35, '#e0d4b9')
  obstacles.push({ x: 6.1, z: BAR_CENTER_Z, width: 1.15, depth: 1.4 })
  const pickupSign = sign('PICK UP', 0.7, 0.2, '#e0d4b9', '#254c3d')
  pickupSign.position.set(6.1, 0.75, -0.438)
  scene.add(pickupSign)
  const blender = createBlender(scene, 'blender')
  const prepBlender = createBlender(scene, 'prep')
  createRefrigerator(scene)
  createRefrigerator(scene, STATIONS['bar-fridge'])
  for (const station of [STATIONS.fridge, STATIONS['bar-fridge']]) {
    obstacles.push({ x: station.x, z: station.z - 0.4, width: 1.4, depth: 1.1 })
  }
  createDryStorage(scene)
  obstacles.push({ x: 6.34, z: STATIONS.stock.z, width: 0.5, depth: 1.7 })
  const storageSign = sign('백룸 창고', 0.95, 0.24, '#eee5d1', '#344e3d')
  storageSign.position.set(6.75, 2.15, STATIONS.stock.z)
  storageSign.rotation.y = -Math.PI / 2
  scene.add(storageSign)
  box(3, 0.5, -5.2, 1.9, 1, 0.85, '#b39a79')
  box(3, 1.05, -5.2, 2, 0.09, 0.95, '#d3c3a5')
  obstacles.push({ x: 3, z: -5.2, width: 2, depth: 0.95 })
  const shelfSign = sign(`바 실온 재료 · 품목별 ${BAR_BATCH_CAPACITY}개`, 2, 0.28, '#eee5d1', '#344e3d')
  shelfSign.position.set(3, 1.6, -5.7)
  scene.add(shelfSign)
  box(1, 0.5, -9.2, 1.55, 1, 0.85, '#a3b1a5')
  box(1, 1.05, -9.2, 1.65, 0.09, 0.95, '#c4cec3')
  obstacles.push({ x: 1, z: -9.2, width: 1.65, depth: 0.95 })
  const extractionSign = sign('콜드 브루 추출대', 1.4, 0.3, '#eee5d1', '#344e3d')
  extractionSign.position.set(1, 2.2, -9.7)
  scene.add(extractionSign)
  createWashingEquipment(scene)
  createCondimentBar(scene)
  obstacles.push({ ...CONDIMENT_BAR })

  // Two quiet seating areas.
  for (const x of [3.2, -2.2]) {
    cylinder(x, 0.8, 3.7, 0.7, 0.7, 0.08, '#cfb18a')
    cylinder(x, 0.4, 3.7, 0.07, 0.12, 0.8, '#414f3d')
    obstacles.push({ x, z: 3.7, width: 1.2, depth: 1.2 })

    for (const z of [2.7, 4.7]) {
      box(x, 0.45, z, 0.55, 0.08, 0.55, '#778267')
      box(x, 0.77, z + (z < 3.7 ? -0.24 : 0.24), 0.55, 0.58, 0.06, '#778267')
    }
  }

  return { obstacles, occluders, blender, prepBlender, register, syrupStation, cupStacks, digitalUrn }
}
