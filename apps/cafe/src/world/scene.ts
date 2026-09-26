import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { canAccessStation, isCupSurface, isTable, STATIONS, type StationId, stationIds } from '../content/stations'
import { cleaningSpot, createCleaningVisuals } from '../features/cleaning/visuals'
import { createColdBrewVisuals } from '../features/cold-brew/visuals'
import { createCraftVisuals, cupSpot } from '../features/crafting/visuals'
import { createBatchVisuals } from '../features/inventory/batch-visuals'
import { carriedBatch } from '../features/inventory/batches'
import { cleanCupCount, cupCount } from '../features/inventory/cups'
import { createSupplyVisuals } from '../features/inventory/supplies-visuals'
import { createPreparationVisuals, PREP_SPOT } from '../features/preparation/visuals'
import { createCustomerVisuals } from '../features/service/visuals'
import { createWashingVisuals, WASH_SPOT } from '../features/washing/visuals'
import { objective } from '../simulation/guidance'
import type { GameState } from '../simulation/state'
import { createShopInterior } from './interior'
import { createPlayerControls } from './player-controls'

export type MouseMode = 'look' | 'cursor' | 'fallback'
export type GuideSide = 'left' | 'right' | null

export type SceneOptions = {
  getState: () => GameState
  canMove: () => boolean
  isRunning: () => boolean
  mouseSensitivity: () => number
  onTarget: (id: StationId | null, needsStaffAccess: boolean) => void
  onGuideSide: (side: GuideSide) => void
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

export type CafeScene = {
  lock: () => void
  unlock: () => void
  unlockForCraft: () => void
  capture: () => GameState['position']
  dispose: () => void
  reset: (position: GameState['position']) => void
}

function pickWidth(id: StationId) {
  if (id === 'espresso') {
    return 0.6
  }
  if (id === 'steam') {
    return 0.66
  }
  if (isCupSurface(id) || id === 'prep' || id === 'cold-prep' || id === 'shelf') {
    return 1.3
  }
  if (id === 'wash') {
    return 1.2
  }
  return 0.8
}

function pickHeight(id: StationId) {
  if (id === 'espresso' || id === 'water') {
    return 1.12
  }
  return isTable(id) ? 1 : 0.8
}

function markerHeight(id: StationId) {
  if (id === 'espresso' || id === 'water') {
    return 1.9
  }
  return isTable(id) || id === 'condiment' || id === 'trash' ? 1.2 : 1.42
}

/** Which screen edge leads to a point the camera cannot see, or null while it is in view. */
function offscreenSide(point: THREE.Vector3, scratch: THREE.Vector3, camera: THREE.PerspectiveCamera): GuideSide {
  const projected = scratch.copy(point).project(camera)
  if (projected.z < 1 && Math.abs(projected.x) <= 0.92 && Math.abs(projected.y) <= 0.92) {
    return null
  }
  return scratch.copy(point).applyMatrix4(camera.matrixWorldInverse).x < 0 ? 'left' : 'right'
}

export function createCafeScene(container: HTMLDivElement, options: SceneOptions): CafeScene {
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
  const { obstacles, blender, register, syrupStation, cupStacks } = createShopInterior(scene)
  customerVisuals = createCustomerVisuals(scene)
  // Pick volumes are visible only through the interaction UI, never drawn over the shop.
  const pickMaterial = new THREE.MeshBasicMaterial({ visible: false })
  const targets = stationIds.map((id) => {
    const station = STATIONS[id]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(pickWidth(id), pickHeight(id), 0.8), pickMaterial)
    mesh.position.set(station.x, 1.2, station.z)
    mesh.userData.station = id
    scene.add(mesh)
    return mesh
  })
  // The objective marker points down at the station and stays readable through equipment, like a waypoint.
  const guideMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.2, 4),
    new THREE.MeshBasicMaterial({ color: '#f8db80', transparent: true, opacity: 0.92, depthTest: false }),
  )
  guideMarker.rotation.x = Math.PI
  guideMarker.renderOrder = 10
  scene.add(guideMarker)
  const guidePoint = new THREE.Vector3()
  const guideView = new THREE.Vector3()
  let guideState: GameState | null = null
  let guideStation: StationId = 'pos'
  let guideSide: GuideSide = null
  scene.add(camera)
  const craftVisuals = createCraftVisuals(scene, camera)
  const preparationVisuals = createPreparationVisuals(scene, camera)
  const washingVisuals = createWashingVisuals(scene, camera)
  const cleaningVisuals = createCleaningVisuals(scene, camera)
  const supplyVisuals = createSupplyVisuals(scene, camera)
  const batchVisuals = createBatchVisuals(scene, camera)
  const coldBrewVisuals = createColdBrewVisuals(scene, camera)
  // Bake an indoor reflection once; only the new equipment uses it. No per-frame reflection pass.
  const environmentRoom = new RoomEnvironment()
  const environmentGenerator = new THREE.PMREMGenerator(renderer)
  const equipmentEnvironment = environmentGenerator.fromScene(environmentRoom, 0.04)
  environmentRoom.dispose()
  environmentGenerator.dispose()

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material instanceof THREE.MeshStandardMaterial && material.userData.equipment) {
        material.envMap = equipmentEnvironment.texture
        material.envMapIntensity = 0.85
      }
    }
  })

  const raycaster = new THREE.Raycaster()
  raycaster.far = 3.4
  const controls = createPlayerControls(renderer.domElement, camera, obstacles, options)
  let hovered: StationId | null = null
  let needsStaffAccess = false
  let frame = 0
  let lastTime = performance.now()
  let disposed = false

  const contextLost = (event: Event) => {
    event.preventDefault()
    options.onError('그래픽 연결이 끊겼어요. 저장 후 새로고침해주세요.')
  }

  renderer.domElement.addEventListener('webglcontextlost', contextLost)

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
    if (disposed) {
      return
    }
    frame = requestAnimationFrame(animate)
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    if (document.hidden) {
      return
    }
    const state = options.getState()
    const running = options.isRunning()
    if (!running && !wasRunning && !needsRender && renderedState === state) {
      return
    }
    wasRunning = running
    renderedState = state
    needsRender = false
    if (running) {
      animationTime += dt * 1000
    }
    const cupPlace = state.cup ? `${state.cup.id}:${state.cup.craft.location}` : ''

    if (cupPlace !== previousCupPlace && state.cup && state.cup.craft.location !== 'hand') {
      const spot = cupSpot(state.cup.craft.location)
      camera.lookAt(spot[0], spot[1] + 0.16, spot[2])
    }

    previousCupPlace = cupPlace
    if (state.preparation && state.preparation.id !== previousPreparation) {
      camera.lookAt(PREP_SPOT[0], PREP_SPOT[1] + 0.17, PREP_SPOT[2])
    }
    previousPreparation = state.preparation?.id ?? null
    if (state.washing && state.washing.id !== previousWashing && state.washing.stage !== 'carrying') {
      camera.lookAt(WASH_SPOT[0], WASH_SPOT[1] + 0.13, WASH_SPOT[2])
    }
    previousWashing = state.washing?.id ?? null

    if (state.cleaning && state.cleaning.id !== previousCleaning) {
      const [x, y, z] = cleaningSpot(state.cleaning.station)
      camera.lookAt(x, y + 0.13, z)
    }

    previousCleaning = state.cleaning?.id ?? null
    controls.update(dt)
    camera.updateMatrixWorld()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    const found = options.canMove() ? raycaster.intersectObjects(targets, false)[0] : undefined
    const pointed = found ? (found.object.userData.station as StationId) : null
    const blocked = pointed !== null && !canAccessStation(pointed, camera.position.z)
    const target = blocked ? null : pointed
    controls.setTarget(target)

    if (target !== hovered || blocked !== needsStaffAccess) {
      hovered = target
      needsStaffAccess = blocked
      options.onTarget(hovered, blocked)
    }

    if (state !== guideState) {
      guideState = state
      guideStation = objective(state).station
    }

    const anchor = STATIONS[guideStation]
    const guiding = state.phase !== 'summary' && options.canMove() && target !== guideStation
    guidePoint.set(anchor.x, markerHeight(guideStation) + Math.sin(animationTime / 600) * 0.03, anchor.z)
    guideMarker.position.copy(guidePoint)
    guideMarker.rotation.y = animationTime / 900
    guideMarker.visible = guiding
    const side = guiding ? offscreenSide(guidePoint, guideView, camera) : null

    if (side !== guideSide) {
      guideSide = side
      options.onGuideSide(side)
    }
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
    blender.update(state)
    register.update(state)
    syrupStation.update(state)

    for (const stack of cupStacks)
      stack.cups.forEach((body, index) => {
        body.root.visible = index < cleanCupCount(state, stack.kind)
      })

    customerVisuals?.update(state, dt, running)
    renderer.render(scene, camera)
  }

  frame = requestAnimationFrame(animate)

  return {
    lock: controls.lock,
    unlock: controls.unlock,
    unlockForCraft: controls.unlockForCraft,
    reset,
    capture: () => [camera.position.x, camera.position.z, camera.rotation.y, camera.rotation.x],
    dispose: () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      const geometries = new Set<THREE.BufferGeometry>()
      const usedMaterials = new Set<THREE.Material>()

      scene.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) {
          object.dispose()
        }
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          for (const m of Array.isArray(object.material) ? object.material : [object.material]) usedMaterials.add(m)
        }
      })

      for (const geometry of geometries) geometry.dispose()
      const usedTextures = new Set<THREE.Texture>()

      for (const value of usedMaterials) {
        for (const property of Object.values(value))
          if (property instanceof THREE.Texture && property !== equipmentEnvironment.texture) {
            usedTextures.add(property)
          }
        value.dispose()
      }

      for (const texture of usedTextures) texture.dispose()
      equipmentEnvironment.dispose()
      sunlight.shadow.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
