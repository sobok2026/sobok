import * as THREE from 'three'
import { createBatchVisuals } from './batch-visuals'
import { carriedBatch } from './batches'
import { canAccessStation, isCupSurface, isTable, STATIONS, type StationId, stationIds } from './catalog'
import { cleaningSpot } from './cleaning'
import { createCleaningVisuals } from './cleaning-visuals'
import { createColdBrewVisuals } from './cold-brew-visuals'
import { createCraftVisuals } from './craft-visuals'
import { cupSpot } from './crafting'
import { cleanCupCount, cupCount } from './cups'
import { createCustomerVisuals } from './customer-visuals'
import { createPlayerControls } from './player-controls'
import { PREP_SPOT } from './preparation'
import { createPreparationVisuals } from './preparation-visuals'
import { suggestedStation } from './progress'
import { createShopInterior } from './shop-interior'
import type { GameState } from './state'
import { createSupplyVisuals } from './supplies-visuals'
import { WASH_SPOT } from './washing'
import { createWashingVisuals } from './washing-visuals'

export type MouseMode = 'look' | 'cursor' | 'fallback'
export type SceneOptions = {
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
export type CafeScene = {
  lock: () => void
  unlock: () => void
  unlockForCraft: () => void
  capture: () => GameState['position']
  dispose: () => void
  reset: (position: GameState['position']) => void
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
  const { obstacles, idleBlenderJar, idleBlenderLid, cupStacks } = createShopInterior(scene)
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
        if (object instanceof THREE.InstancedMesh) object.dispose()
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          for (const m of Array.isArray(object.material) ? object.material : [object.material]) usedMaterials.add(m)
        }
      })
      for (const geometry of geometries) geometry.dispose()
      const usedTextures = new Set<THREE.Texture>()
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
