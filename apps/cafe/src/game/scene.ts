import * as THREE from 'three'
import { createBatchVisuals } from './batch-visuals'
import { carriedBatch } from './batches'
import {
  BAR_CENTER_Z,
  canAccessStation,
  isCupSurface,
  isTable,
  STATIONS,
  type StationId,
  staffFacingZ,
  stationIds,
} from './catalog'
import { cleaningSpot } from './cleaning'
import { createCleaningVisuals } from './cleaning-visuals'
import { createColdBrewVisuals } from './cold-brew-visuals'
import { createCraftVisuals } from './craft-visuals'
import { craftStations, cupSpot } from './crafting'
import { createCupBody } from './cup-visual'
import { cleanCupCount, cupCount, cupKinds } from './cups'
import { CUSTOMER_DOOR_X } from './customer'
import { createCustomerVisuals } from './customer-visuals'
import { PREP_SPOT } from './preparation'
import { createPreparationVisuals } from './preparation-visuals'
import type { GameState } from './state'
import { suggestedStation } from './store'
import { createSupplyVisuals } from './supplies-visuals'
import { addVesselLabel } from './vessel-label'
import { WASH_SPOT, washDestination } from './washing'
import { createWashingVisuals } from './washing-visuals'

export type MouseMode = 'look' | 'cursor' | 'fallback'
type Options = {
  getState: () => GameState
  canMove: () => boolean
  isRunning: () => boolean
  mouseSensitivity: () => number
  onTarget: (id: StationId | null, needsStaffAccess: boolean) => void
  onInteract: (id: StationId) => void
  onUseStart: (id: StationId) => void
  onUseEnd: () => void
  onTool: (id: StationId) => void
  onConfirm: (id: StationId) => void
  activeStation: () => StationId | null
  onMouseMode: (mode: MouseMode) => void
  onUnlock: () => void
  onError: (message: string) => void
}
type Obstacle = { x: number; z: number; width: number; depth: number }
export type CafeScene = {
  lock: () => void
  unlock: () => void
  unlockForCraft: () => void
  capture: () => GameState['position']
  dispose: () => void
  reset: (position: GameState['position']) => void
}

export function createCafeScene(container: HTMLDivElement, options: Options): CafeScene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#e5e7de')
  scene.fog = new THREE.Fog('#e5e7de', 22, 55)
  const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 65)
  camera.rotation.order = 'YXZ'
  let previousCupPlace = ''
  let previousPreparation: string | null = null
  let previousWashing: string | null = null
  let previousCleaning: string | null = null
  let needsRender = true
  let customerVisuals: ReturnType<typeof createCustomerVisuals> | undefined
  const reset = ([x, z, yaw, pitch]: GameState['position']) => {
    needsRender = true
    camera.position.set(x, 1.65, z)
    camera.rotation.set(pitch, yaw, 0, 'YXZ')
    const state = options.getState()
    previousCupPlace = state.cup ? `${state.cup.id}:${state.cup.craft.location}` : ''
    previousPreparation = state.preparation?.id ?? null
    previousWashing = state.washing?.id ?? null
    previousCleaning = state.cleaning?.id ?? null
    customerVisuals?.reset()
  }
  reset(options.getState().position)
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.domElement.setAttribute(
    'aria-label',
    '1인칭 카페 매장. WASD 이동, 방향키 시점, E 컵·작업대, G 도구, Space 사용, F 확인',
  )
  renderer.domElement.tabIndex = 0
  container.appendChild(renderer.domElement)
  scene.add(new THREE.HemisphereLight('#fff5df', '#8fa78e', 1.5))
  const sunlight = new THREE.DirectionalLight('#fff0ce', 2.0)
  sunlight.position.set(7, 12, 8)
  sunlight.castShadow = true
  sunlight.shadow.mapSize.set(2048, 2048)
  sunlight.shadow.camera.left = -13
  sunlight.shadow.camera.right = 13
  sunlight.shadow.camera.top = 13
  sunlight.shadow.camera.bottom = -13
  sunlight.shadow.normalBias = 0.045
  scene.add(sunlight)
  const fillLight = new THREE.DirectionalLight('#dce9e3', 0.9)
  fillLight.position.set(-5, 5, -5)
  scene.add(fillLight)
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
  const textures: THREE.Texture[] = []
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
    textures.push(texture)
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
    'TODAY’S MENU\nCOLD BREW\nBLACK GLAZED LATTE\nHOJI GLAZED TEA LATTE',
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
  const cupStacks = cupKinds.map((kind, index) => ({
    kind,
    cups: Array.from({ length: 4 }, (_, i) => {
      const body = createCupBody(scene, kind)
      body.root.scale.setScalar(0.68)
      body.root.position.set(
        -4.1 + (index % 2) * 0.38 + (i % 2) * 0.15,
        1.066 + Math.floor(i / 2) * 0.14,
        -1.3 + Math.floor(index / 2) * 0.45,
      )
      return body
    }),
  }))
  box(-2.5, 1.54, staffFacingZ(-1.14), 0.96, 0.66, 0.65, '#aab6ad', scene, 0.65)
  box(-2.5, 1.53, staffFacingZ(-0.79), 0.84, 0.3, 0.025, '#293e35')
  for (const x of [-2.75, -2.26]) {
    cylinder(x, 1.47, staffFacingZ(-0.68), 0.045, 0.045, 0.08, '#b8bcae')
    box(x, 1.46, staffFacingZ(-0.756), 0.06, 0.06, 0.018, '#d8c889')
  }
  box(-2.5, 1.09, staffFacingZ(-0.76), 0.92, 0.04, 0.45, '#4f6256', scene, 0.5)
  cylinder(-1.25, 1.24, staffFacingZ(-1.0), 0.14, 0.1, 0.35, '#a0aaa4')
  const milkCarton = box(-0.96, 1.25, staffFacingZ(-1.12), 0.15, 0.38, 0.18, '#e7e6d7')
  addVesselLabel(milkCarton, '우유', '#527f66', 0.13, 0.09, 0, 0.092)
  const coldBrewDispenser = cylinder(0, 1.33, staffFacingZ(-1.12), 0.2, 0.2, 0.5, '#4c3827')
  addVesselLabel(coldBrewDispenser, '콜드 브루', '#77513b', 0.27, 0.12, 0.08, 0.203)
  cylinder(0, 1.6, staffFacingZ(-1.12), 0.21, 0.21, 0.035, '#273e33')
  box(0, 1.3, staffFacingZ(-0.83), 0.06, 0.05, 0.22, '#a9b7ad')
  const waterDispenser = box(1.1, 1.3, staffFacingZ(-1.15), 0.25, 0.5, 0.26, '#d5ded3')
  addVesselLabel(waterDispenser, '정수', '#6e928e', 0.18, 0.11, 0.08, 0.132)
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
  // Preparation blender and sauce pitcher.
  box(-2.9, 1.2, -5.12, 0.43, 0.3, 0.43, '#304d40')
  const idleBlenderJar = cylinder(-2.9, 1.57, -5.12, 0.18, 0.14, 0.44, '#d9e0ce')
  const idleBlenderLid = cylinder(-2.9, 1.82, -5.12, 0.2, 0.2, 0.055, '#314b3d')
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
  extractionSign.position.set(1, 1.9, -5.7)
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
  customerVisuals = createCustomerVisuals(scene)
  // Pick volumes are visible only through the interaction UI, never drawn over the shop.
  const pickMaterial = new THREE.MeshBasicMaterial({ visible: false })
  const targets = stationIds.map((id) => {
    const station = STATIONS[id]
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        isCupSurface(id) || id === 'prep' || id === 'cold-prep' || id === 'shelf' ? 1.3 : id === 'wash' ? 1.2 : 0.8,
        isTable(id) ? 1 : 0.8,
        0.8,
      ),
      pickMaterial,
    )
    mesh.position.set(station.x, 1.2, station.z)
    mesh.userData.station = id
    scene.add(mesh)
    return mesh
  })
  const guideRing = new THREE.Mesh(
    new THREE.RingGeometry(0.27, 0.33, 40),
    new THREE.MeshBasicMaterial({
      color: '#f8db80',
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  guideRing.rotation.x = -Math.PI / 2
  scene.add(guideRing)
  scene.add(camera)
  const craftVisuals = createCraftVisuals(scene, camera)
  const preparationVisuals = createPreparationVisuals(scene, camera)
  const washingVisuals = createWashingVisuals(scene, camera)
  const cleaningVisuals = createCleaningVisuals(scene, camera)
  const supplyVisuals = createSupplyVisuals(scene, camera)
  const batchVisuals = createBatchVisuals(scene, camera)
  const coldBrewVisuals = createColdBrewVisuals(scene, camera)
  const raycaster = new THREE.Raycaster()
  raycaster.far = 3.4
  const keys = new Set<string>()
  let hovered: StationId | null = null
  let needsStaffAccess = false
  let frame = 0
  let lastTime = performance.now()
  let disposed = false
  let using = false
  let pressedStation: StationId | null = null
  const collides = (x: number, z: number) =>
    Math.abs(x) > 6.55 ||
    z < -5.55 ||
    z > 5.45 ||
    obstacles.some((o) => Math.abs(x - o.x) < o.width / 2 + 0.22 && Math.abs(z - o.z) < o.depth / 2 + 0.22)
  function keydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return
    if (!options.canMove() || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
      return
    if (event.target instanceof HTMLButtonElement && ['Space', 'Enter'].includes(event.code)) return
    if (
      [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyE',
        'KeyG',
        'KeyF',
        'Space',
      ].includes(event.code)
    )
      event.preventDefault()
    if (
      !event.repeat &&
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
    )
      lock()
    keys.add(event.code)
    if (event.code === 'KeyE' && !event.repeat && hovered) options.onInteract(hovered)
    if (event.code === 'KeyG' && !event.repeat && hovered) options.onTool(hovered)
    if (event.code === 'KeyF' && !event.repeat && hovered) options.onConfirm(hovered)
    if (event.code === 'Space' && !event.repeat && hovered) {
      using = true
      pressedStation = hovered
      options.onUseStart(hovered)
    }
  }
  const keyup = (event: KeyboardEvent) => {
    keys.delete(event.code)
    if (event.code === 'Space') {
      using = false
      pressedStation = null
      options.onUseEnd()
    }
  }
  let locked = false
  let dragging = false
  let releasingForCraft = false
  let wantsMouseLook = false
  let lockPending = false
  const clear = () => {
    keys.clear()
    dragging = false
    if (using || options.activeStation()) {
      using = false
      pressedStation = null
      options.onUseEnd()
    }
  }
  const lock = () => {
    if (!renderer.domElement.isConnected || !options.canMove()) return
    wantsMouseLook = true
    if (document.pointerLockElement === renderer.domElement || lockPending) return
    lockPending = true
    try {
      const result = renderer.domElement.requestPointerLock()
      void Promise.resolve(result)
        .catch(() => {
          if (!disposed && wantsMouseLook) options.onMouseMode('fallback')
        })
        .finally(() => {
          lockPending = false
        })
    } catch {
      lockPending = false
      options.onMouseMode('fallback')
    }
  }
  const unlock = () => {
    wantsMouseLook = false
    releasingForCraft = false
    options.onMouseMode('cursor')
    if (document.pointerLockElement === renderer.domElement) document.exitPointerLock()
  }
  const unlockForCraft = () => {
    wantsMouseLook = false
    releasingForCraft = true
    options.onMouseMode('cursor')
    if (document.pointerLockElement === renderer.domElement) document.exitPointerLock()
  }
  const pointerChanged = () => {
    const previous = locked
    locked = document.pointerLockElement === renderer.domElement
    if (locked) {
      if (!wantsMouseLook) {
        releasingForCraft = true
        document.exitPointerLock()
      } else {
        releasingForCraft = false
        options.onMouseMode('look')
      }
      return
    }
    if (previous && !locked) {
      clear()
      const intentional = releasingForCraft
      releasingForCraft = false
      options.onMouseMode('cursor')
      if (!intentional) options.onUnlock()
      else if (wantsMouseLook) lock()
    }
  }
  const pointerFailed = () => {
    if (wantsMouseLook) options.onMouseMode('fallback')
  }
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !options.canMove()) return
    if (carriedBatch(options.getState()) && hovered) {
      options.onInteract(hovered)
      return
    }
    if (options.getState().supplyDelivery && (hovered === 'condiment' || hovered === 'stock')) {
      options.onInteract(hovered)
      return
    }
    if (
      options.getState().washing?.stage === 'carrying' &&
      (hovered === washDestination(options.getState().washing!.item) || hovered === 'wash')
    ) {
      options.onInteract(hovered)
      return
    }
    if (cupCount(options.getState().cleaning?.heldCups) && hovered === 'wash') {
      options.onInteract(hovered)
      return
    }
    const c = options.getState().cup
    if (
      hovered &&
      ((c?.craft.location === hovered && craftStations.includes(hovered)) ||
        (hovered === 'prep' && options.getState().preparation) ||
        (hovered === 'cold-prep' && options.getState().coldBrew) ||
        (hovered === 'wash' && options.getState().washing) ||
        hovered === options.getState().cleaning?.station)
    ) {
      using = true
      pressedStation = hovered
      options.onUseStart(hovered)
    } else {
      dragging = true
      lock()
    }
  }
  const pointerUp = () => {
    dragging = false
    using = false
    pressedStation = null
    options.onUseEnd()
  }
  const look = (event: MouseEvent) => {
    if (using || options.activeStation()) return
    if ((!locked && !dragging) || !options.canMove()) return
    const sensitivity = 0.0013 * options.mouseSensitivity()
    camera.rotation.y -= event.movementX * sensitivity
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - event.movementY * sensitivity, -1.1, 1.1)
  }
  const contextLost = (event: Event) => {
    event.preventDefault()
    options.onError('그래픽 연결이 끊겼어요. 저장 후 새로고침해주세요.')
  }
  document.addEventListener('pointerlockchange', pointerChanged)
  document.addEventListener('pointerlockerror', pointerFailed)
  document.addEventListener('mousemove', look)
  window.addEventListener('pointerup', pointerUp)
  renderer.domElement.addEventListener('pointerdown', pointerDown)
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clear)
  function resize() {
    needsRender = true
    renderer.setSize(container.clientWidth, container.clientHeight)
    camera.aspect = container.clientWidth / Math.max(1, container.clientHeight)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()
  let renderedState: GameState | null = null
  let wasRunning = false
  let animationTime = 0
  function animate(now: number) {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    if (document.hidden) return
    const state = options.getState()
    const running = options.isRunning()
    if (!running && !wasRunning && !needsRender && renderedState === state) return
    wasRunning = running
    renderedState = state
    needsRender = false
    if (running) animationTime += dt * 1000
    const cupPlace = state.cup ? `${state.cup.id}:${state.cup.craft.location}` : ''
    if (cupPlace !== previousCupPlace && state.cup && state.cup.craft.location !== 'hand') {
      const spot = cupSpot(state.cup.craft.location)
      camera.lookAt(spot[0], spot[1] + 0.16, spot[2])
    }
    previousCupPlace = cupPlace
    if (state.preparation && state.preparation.id !== previousPreparation)
      camera.lookAt(PREP_SPOT[0], PREP_SPOT[1] + 0.17, PREP_SPOT[2])
    previousPreparation = state.preparation?.id ?? null
    if (state.washing && state.washing.id !== previousWashing && state.washing.stage !== 'carrying')
      camera.lookAt(WASH_SPOT[0], WASH_SPOT[1] + 0.13, WASH_SPOT[2])
    previousWashing = state.washing?.id ?? null
    if (state.cleaning && state.cleaning.id !== previousCleaning) {
      const [x, y, z] = cleaningSpot(state.cleaning.station)
      camera.lookAt(x, y + 0.13, z)
    }
    previousCleaning = state.cleaning?.id ?? null
    if (options.canMove()) {
      camera.rotation.y += ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * dt * 1.4
      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x + ((keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0)) * dt,
        -1.1,
        1.1,
      )
      let forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'))
      let sideways = Number(keys.has('KeyD')) - Number(keys.has('KeyA'))
      const length = Math.hypot(forward, sideways) || 1
      if ((forward || sideways) && (using || options.activeStation())) {
        using = false
        pressedStation = null
        options.onUseEnd()
      }
      forward /= length
      sideways /= length
      const yaw = camera.rotation.y
      const speed = dt * 2.9
      const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * sideways) * speed
      const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * sideways) * speed
      if (!collides(camera.position.x + dx, camera.position.z)) camera.position.x += dx
      if (!collides(camera.position.x, camera.position.z + dz)) camera.position.z += dz
    } else clear()
    camera.updateMatrixWorld()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    const found = options.canMove() ? raycaster.intersectObjects(targets, false)[0] : undefined
    const pointed = found ? (found.object.userData.station as StationId) : null
    const blocked = pointed !== null && !canAccessStation(pointed, camera.position.z)
    const target = blocked ? null : pointed
    if ((using || options.activeStation()) && target !== (options.activeStation() ?? pressedStation)) {
      using = false
      pressedStation = null
      options.onUseEnd()
    }
    if (target !== hovered || blocked !== needsStaffAccess) {
      hovered = target
      needsStaffAccess = blocked
      options.onTarget(hovered, blocked)
    }
    const desired = suggestedStation(state)
    const anchor = STATIONS[desired]
    guideRing.position.set(anchor.x, 1.72 + Math.sin(animationTime / 600) * 0.025, anchor.z)
    guideRing.rotation.x = -Math.PI / 2
    guideRing.visible = state.phase !== 'summary'
    const benchFocused =
      (state.cup && target === state.cup.craft.location) ||
      (state.preparation && !carriedBatch(state) && target === 'prep') ||
      (state.coldBrew && !carriedBatch(state) && target === 'cold-prep') ||
      (state.washing && state.washing.stage !== 'carrying' && target === 'wash') ||
      (state.cleaning && !cupCount(state.cleaning.heldCups) && target === state.cleaning.station)
    const fov = benchFocused ? 48 : 62
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.12)
      camera.updateProjectionMatrix()
    }
    craftVisuals.update(
      state,
      options.activeStation() !== null && options.activeStation() === state.cup?.craft.location,
      animationTime,
    )
    preparationVisuals.update(state, options.activeStation() === 'prep', animationTime)
    washingVisuals.update(state, options.activeStation() === 'wash', animationTime)
    cleaningVisuals.update(state, !!state.cleaning && options.activeStation() === state.cleaning.station, animationTime)
    supplyVisuals.update(state)
    batchVisuals.update(state)
    coldBrewVisuals.update(state, options.activeStation() === 'cold-prep')
    idleBlenderJar.visible = state.preparation?.stage !== 'processing'
    idleBlenderLid.visible = idleBlenderJar.visible
    for (const stack of cupStacks)
      stack.cups.forEach((body, index) => {
        body.root.visible = index < cleanCupCount(state, stack.kind)
      })
    customerVisuals?.update(state, dt, running)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(animate)
  return {
    lock,
    unlock,
    unlockForCraft,
    reset,
    capture: () => [camera.position.x, camera.position.z, camera.rotation.y, camera.rotation.x],
    dispose: () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('pointerlockchange', pointerChanged)
      document.removeEventListener('pointerlockerror', pointerFailed)
      document.removeEventListener('mousemove', look)
      window.removeEventListener('pointerup', pointerUp)
      unlock()
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear)
      renderer.domElement.removeEventListener('pointerdown', pointerDown)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      const geometries = new Set<THREE.BufferGeometry>()
      const usedMaterials = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) object.dispose()
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          for (const m of Array.isArray(object.material) ? object.material : [object.material]) usedMaterials.add(m)
        }
      })
      for (const geometry of geometries) geometry.dispose()
      const usedTextures = new Set(textures)
      for (const value of usedMaterials) {
        if ((value instanceof THREE.MeshBasicMaterial || value instanceof THREE.MeshStandardMaterial) && value.map)
          usedTextures.add(value.map)
        value.dispose()
      }
      for (const texture of usedTextures) texture.dispose()
      sunlight.shadow.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
