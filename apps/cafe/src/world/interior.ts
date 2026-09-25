import * as THREE from 'three'
import { drinkSizeIds } from '../content/drink-sizes'
import { BAR_CENTER_Z, staffFacingZ } from '../content/stations'
import { createColdBrewDispenser } from '../features/cold-brew/equipment'
import { createEspressoMachine } from '../features/crafting/espresso-machine'
import { cupKinds, cupSize, cupStyle, cupStyles } from '../features/inventory/cups'
import { createBlender } from '../features/preparation/blender'
import { CUSTOMER_DOOR_X } from '../features/service/customer'
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
  function sign(text: string, width: number, height: number, background = '#153e32', foreground = '#f2e7ce') {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round((1024 * height) / width)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = foreground
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lines = text.split('\n')
    ctx.font = `600 ${Math.min(95, canvas.height / (lines.length + 1))}px sans-serif`
    lines.forEach((line, i) => {
      ctx.fillText(line, 512, (canvas.height * (i + 1)) / (lines.length + 1), 950)
    })
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    )
  }
  // Warm wooden floor and a cream envelope; the front glazing opens toward a small street.
  box(0, -0.08, 0, 14, 0.15, 12, '#ad9174')
  const floorSeams: [number, number, number, number, number, number][] = []
  for (let x = -6.75; x < 7; x += 0.5) floorSeams.push([x, 0.003, 0, 0.012, 0.008, 12])
  repeatedBoxes(floorSeams, '#967b61')
  // The tiled employee aisle stays behind the counter; the timber floor belongs to the seating area.
  box(0, 0.014, -3.82, 13.45, 0.02, 4.05, '#b6bcb1')
  const tileSeams: [number, number, number, number, number, number][] = []
  for (let x = -6.5; x < 6.8; x += 0.65) tileSeams.push([x, 0.026, -3.82, 0.012, 0.004, 4.05])
  for (let z = -5.7; z < -1.8; z += 0.65) tileSeams.push([0, 0.027, z, 13.4, 0.004, 0.012])
  repeatedBoxes(tileSeams, '#9fa89c')
  box(0, 0.037, -2.24, 10.9, 0.02, 0.65, '#4c6156')
  box(0, 1.8, -5.85, 14, 3.6, 0.18, '#eee7d7')
  box(-6.85, 1.8, 0, 0.18, 3.6, 12, '#e8e0ce')
  box(6.85, 1.8, -3.0, 0.18, 3.6, 5.8, '#e8e0ce')
  box(-1.125, 0.25, 5.8, 11.75, 0.5, 0.16, '#244c3e')
  box(6.575, 0.25, 5.8, 0.85, 0.5, 0.16, '#244c3e')
  for (const x of [CUSTOMER_DOOR_X - 0.72, CUSTOMER_DOOR_X + 0.72]) box(x, 1.75, 5.8, 0.06, 3.5, 0.12, '#244c3e')
  const entranceSign = sign('입구 · EXIT', 1.15, 0.3, '#244c3e', '#f2e7ce')
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
  box(0, 0.48, -1.05, 11.5, 0.96, 1.18, '#946e4c')
  box(0, 1.0, -1.05, 11.7, 0.12, 1.35, '#ddd1b9')
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
  box(-2.9, 0.5, -5.2, 5.5, 1, 0.9, '#e1d5bb')
  box(-2.9, 1.05, -5.2, 5.6, 0.09, 1.0, '#c8bda5')
  obstacles.push({ x: -2.9, z: -5.2, width: 5.6, depth: 1 })
  const mainSign = sign('DAY SHIFT\nCOFFEE & COMPANY', 3.9, 1.2)
  mainSign.position.set(0, 2.65, -5.72)
  scene.add(mainSign)
  const menuSign = sign(
    'TODAY’S MENU\nCOLD BREW\nBLACK GLAZED LATTE\nHOJI GLAZED TEA LATTE\nPURE HOJICHA · MATCHA',
    2.4,
    1.4,
    '#ece1ca',
    '#344e3d',
  )
  menuSign.position.set(-4.6, 2.45, -5.71)
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
  plant(-5.0, 3.7, 0.75)
  // Named work surfaces remain visually distinct at first-person distance.
  box(-4.8, 1.12, -1.05, 0.35, 0.13, 0.38, '#38483d')
  const screen = box(-4.8, 1.45, staffFacingZ(-1.06), 0.54, 0.36, 0.05, '#183b32')
  screen.rotation.set(0.2, Math.PI, 0)
  const screenText = sign('POS\n주문 접수', 0.48, 0.28, '#a5beab', '#17372f')
  screenText.position.set(-4.8, 1.46, staffFacingZ(-1.015))
  screenText.rotation.set(0.2, Math.PI, 0)
  scene.add(screenText)
  const cupStacks = cupKinds.map((kind) => ({
    kind,
    cups: Array.from({ length: 4 }, (_, i) => {
      const body = createCupBody(scene, kind)
      body.root.scale.setScalar(0.48)
      body.root.position.set(
        -4.13 + cupStyles.indexOf(cupStyle(kind)) * 0.2,
        1.066 + i * 0.055,
        -1.45 + drinkSizeIds.indexOf(cupSize(kind)) * 0.23,
      )
      return body
    }),
  }))
  createEspressoMachine(scene)
  const milkCarton = box(-3.23, 1.25, staffFacingZ(-1.12), 0.15, 0.38, 0.18, '#e7e6d7')
  addVesselLabel(milkCarton, '우유', '#527f66', 0.13, 0.09, 0, 0.092)
  createColdBrewDispenser(scene)
  const waterDispenser = box(1.1, 1.3, staffFacingZ(-1.15), 0.25, 0.5, 0.26, '#d5ded3')
  addVesselLabel(waterDispenser, '정수 · 온수', '#6e928e', 0.22, 0.09, 0.08, 0.132)
  addVesselLabel(waterDispenser, 'HOT  T · G · V', '#95612d', 0.22, 0.055, -0.04, 0.133)
  box(1.1, 1.45, staffFacingZ(-0.91), 0.05, 0.05, 0.3, '#6d8c7b')
  box(2.1, 1.15, staffFacingZ(-1.1), 0.65, 0.2, 0.57, '#8dada9')
  for (let i = 0; i < 8; i++)
    box(
      1.9 + (i % 3) * 0.14,
      1.26 + (i % 2) * 0.025,
      staffFacingZ(-1.26 + Math.floor(i / 3) * 0.14),
      0.1,
      0.08,
      0.1,
      '#e2eddf',
    )
  for (let i = 0; i < 2; i++) {
    const bottle = cylinder(2.96 + i * 0.28, 1.28, staffFacingZ(-1.1), 0.1, 0.1, 0.4, i ? '#d5b476' : '#eee0bb')
    addVesselLabel(bottle, i ? '클래식' : '글레이즈드', i ? '#9b793e' : '#44694b', 0.16, 0.085, -0.025, 0.102)
    box(2.96 + i * 0.28, 1.52, staffFacingZ(-1.01), 0.045, 0.03, 0.25, '#484b3a')
  }
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
  const blender = createBlender(scene)
  box(5.5, 1.1, -5.2, 1.4, 2.2, 1.0, '#c0cabb', scene, 0.25)
  box(5.5, 1.12, -4.68, 1.25, 2.03, 0.05, '#aebfae')
  box(5.02, 1.45, -4.61, 0.045, 0.42, 0.065, '#556e5d')
  obstacles.push({ x: 5.5, z: -5.2, width: 1.4, depth: 1.1 })
  box(3, 0.5, -5.2, 1.9, 1, 0.85, '#b39a79')
  box(3, 1.05, -5.2, 2, 0.09, 0.95, '#d3c3a5')
  obstacles.push({ x: 3, z: -5.2, width: 2, depth: 0.95 })
  const shelfSign = sign('실온 보관', 1.25, 0.28, '#eee5d1', '#344e3d')
  shelfSign.position.set(3, 1.6, -5.7)
  scene.add(shelfSign)
  box(1, 0.5, -5.2, 1.55, 1, 0.85, '#a38b70')
  box(1, 1.05, -5.2, 1.65, 0.09, 0.95, '#d3c3a5')
  obstacles.push({ x: 1, z: -5.2, width: 1.65, depth: 0.95 })
  const extractionSign = sign('COLD BREW\n계량 · 추출 · 회수', 1.4, 0.4, '#eee5d1', '#344e3d')
  extractionSign.position.set(1, 2.2, -5.7)
  scene.add(extractionSign)
  box(-5.0, 1.1, -5.1, 0.84, 0.035, 0.65, '#283c38')
  for (const z of [-5.43, -4.77]) box(-5, 1.126, z, 0.9, 0.035, 0.04, '#b5c6ba', scene, 0.6)
  for (const x of [-5.44, -4.56]) box(x, 1.126, -5.1, 0.04, 0.035, 0.66, '#b5c6ba', scene, 0.6)
  box(-5.0, 1.36, -5.47, 0.035, 0.55, 0.04, '#c5d1c8', scene, 0.6)
  box(-5.0, 1.62, -5.31, 0.035, 0.03, 0.35, '#c5d1c8', scene, 0.6)
  box(-3.9, 1.11, -5.1, 0.9, 0.035, 0.65, '#8a9a83')
  box(-5.4, 0.38, 5.1, 0.58, 0.76, 0.58, '#3c5e4a')
  box(-5.4, 0.8, 5.1, 0.65, 0.07, 0.65, '#263f31')
  box(0, 0.49, 5.15, 1.85, 0.98, 0.8, '#946e4c')
  box(0, 1.03, 5.15, 1.95, 0.08, 0.9, '#ddd1b9')
  box(0, 1.074, 4.95, 1.38, 0.014, 0.33, '#b7b299')
  obstacles.push({ x: 0, z: 5.15, width: 1.95, depth: 0.9 })
  const condimentSign = sign('CONDIMENT BAR\n냅킨 · 빨대 · 설탕 / 컵 반납', 1.8, 0.36, '#eee5d1', '#344e3d')
  condimentSign.position.set(0, 1.55, 5.62)
  condimentSign.rotation.y = Math.PI
  scene.add(condimentSign)
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
  return { obstacles, blender, cupStacks }
}
