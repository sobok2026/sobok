import * as THREE from 'three'
import { SHOP_BOUNDS, type StationId, staffStartPosition } from '../content/stations'
import { craftWorkStation } from '../features/crafting/rules'
import { carriedBatch } from '../features/inventory/batches'
import { cupCount } from '../features/inventory/cups'
import { washDestination } from '../features/washing/rules'
import { EYE_HEIGHT, intersectsObstacle, type Obstacle, PLAYER_RADIUS } from './collision'
import { floorElevation } from './floors'
import type { SceneOptions } from './scene'

export function createPlayerControls(
  element: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  obstacles: Obstacle[],
  options: SceneOptions,
) {
  const keys = new Set<string>()
  let hovered: StationId | null = null
  let disposed = false
  let using = false
  let pressedStation: StationId | null = null
  let mousePointer: number | null = null
  let lookPointer: { id: number; x: number; y: number } | null = null
  let touchMovement = { sideways: 0, forward: 0, running: false }
  const collides = (x: number, z: number, elevation: number) =>
    x < SHOP_BOUNDS.minX + PLAYER_RADIUS + 0.2 ||
    x > SHOP_BOUNDS.maxX - PLAYER_RADIUS - 0.2 ||
    z < SHOP_BOUNDS.minZ + PLAYER_RADIUS + 0.2 ||
    z > SHOP_BOUNDS.maxZ - PLAYER_RADIUS - 0.2 ||
    obstacles.some((obstacle) => intersectsObstacle(x, z, elevation, obstacle))

  function keydown(event: KeyboardEvent) {
    if (event.defaultPrevented) {
      return
    }
    if (!options.canMove() || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
      return
    }
    if (event.target instanceof HTMLButtonElement && ['Space', 'Enter'].includes(event.code)) {
      return
    }
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
    ) {
      event.preventDefault()
    }
    if (
      !event.repeat &&
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
    ) {
      lock()
    }
    keys.add(event.code)
    if (event.code === 'KeyE' && !event.repeat && hovered) {
      options.onInteract(hovered)
    }
    if (event.code === 'KeyG' && !event.repeat && hovered) {
      options.onTool(hovered)
    }
    if (event.code === 'KeyF' && !event.repeat && hovered) {
      options.onConfirm(hovered)
    }

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
    mousePointer = null
    const lookId = lookPointer?.id
    lookPointer = null
    touchMovement = { sideways: 0, forward: 0, running: false }
    if (lookId !== undefined && element.hasPointerCapture(lookId)) element.releasePointerCapture(lookId)

    if (using || options.activeStation()) {
      using = false
      pressedStation = null
      options.onUseEnd()
    }
  }

  const lock = () => {
    if (!element.isConnected || !options.canMove()) {
      return
    }
    if (options.touchControls()) {
      unlockForCraft()
      return
    }
    wantsMouseLook = true
    if (document.pointerLockElement === element || lockPending) {
      return
    }
    lockPending = true

    try {
      const result = element.requestPointerLock()
      void Promise.resolve(result)
        .catch(() => {
          if (!disposed && wantsMouseLook) {
            options.onMouseMode('fallback')
          }
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
    clear()
    wantsMouseLook = false
    releasingForCraft = false
    options.onMouseMode('cursor')
    if (document.pointerLockElement === element) {
      document.exitPointerLock()
    }
  }

  const unlockForCraft = () => {
    clear()
    wantsMouseLook = false
    releasingForCraft = true
    options.onMouseMode('cursor')
    if (document.pointerLockElement === element) {
      document.exitPointerLock()
    }
  }

  const pointerChanged = () => {
    const previous = locked
    locked = document.pointerLockElement === element

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
      if (!intentional) {
        options.onUnlock()
      } else if (wantsMouseLook) {
        lock()
      }
    }
  }

  const pointerFailed = () => {
    if (wantsMouseLook) {
      options.onMouseMode('fallback')
    }
  }

  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !options.canMove()) {
      return
    }

    // Looking never acts on a station. A second finger can keep the movement stick held.
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (lookPointer) return
      event.preventDefault()
      lookPointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      element.setPointerCapture(event.pointerId)
      return
    }

    mousePointer = event.pointerId

    if (carriedBatch(options.getState()) && hovered) {
      options.onInteract(hovered)
      return
    }

    if (options.getState().cupDelivery && (hovered === 'cups' || hovered === 'stock')) {
      options.onInteract(hovered)
      return
    }
    if (options.getState().supplyDelivery && (hovered === 'supplies' || hovered === 'stock')) {
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

    if (
      hovered &&
      (craftWorkStation(options.getState()) === hovered ||
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

  const pointerUp = (event: PointerEvent) => {
    if (event.pointerId === lookPointer?.id) {
      lookPointer = null
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
      return
    }
    // Releasing the movement/look finger must not release a different finger's work button.
    if (event.pointerId !== mousePointer) return
    mousePointer = null
    dragging = false
    using = false
    pressedStation = null
    options.onUseEnd()
  }

  const touchLook = (event: PointerEvent) => {
    const previous = lookPointer
    if (!previous || previous.id !== event.pointerId) return
    lookPointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
    if (!options.canMove() || using || options.activeStation()) return
    const sensitivity = 0.006 * options.mouseSensitivity()
    camera.rotation.y -= (event.clientX - previous.x) * sensitivity
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - (event.clientY - previous.y) * sensitivity, -1.1, 1.1)
  }

  const hidden = () => {
    if (document.hidden) clear()
  }

  const look = (event: MouseEvent) => {
    if (using || options.activeStation()) {
      return
    }
    if ((!locked && !dragging) || !options.canMove()) {
      return
    }
    const sensitivity = 0.0013 * options.mouseSensitivity()
    camera.rotation.y -= event.movementX * sensitivity
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - event.movementY * sensitivity, -1.1, 1.1)
  }

  document.addEventListener('pointerlockchange', pointerChanged)
  document.addEventListener('pointerlockerror', pointerFailed)
  document.addEventListener('mousemove', look)
  window.addEventListener('pointerup', pointerUp)
  window.addEventListener('pointercancel', pointerUp)
  element.addEventListener('pointerdown', pointerDown)
  element.addEventListener('pointermove', touchLook)
  element.addEventListener('lostpointercapture', pointerUp)
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clear)
  window.addEventListener('resize', clear)
  document.addEventListener('visibilitychange', hidden)

  return {
    lock,
    unlock,
    unlockForCraft,
    moveTouch(sideways: number, forward: number, running: boolean) {
      if (!options.canMove()) {
        touchMovement = { sideways: 0, forward: 0, running: false }
        return
      }
      touchMovement = { sideways, forward, running }
    },
    update(dt: number) {
      if (options.canMove()) {
        let elevation = camera.position.y - EYE_HEIGHT
        if (
          collides(camera.position.x, camera.position.z, elevation) ||
          floorElevation(camera.position.x, camera.position.z, elevation) === null
        ) {
          const [x, z, , , y] = staffStartPosition()
          camera.position.set(x, y + EYE_HEIGHT, z)
          elevation = y
        }
        camera.rotation.y += ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * dt * 1.4
        camera.rotation.x = THREE.MathUtils.clamp(
          camera.rotation.x + ((keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0)) * dt,
          -1.1,
          1.1,
        )
        let forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS')) + touchMovement.forward
        let sideways = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + touchMovement.sideways
        const length = Math.max(1, Math.hypot(forward, sideways))

        if ((forward || sideways) && (using || options.activeStation())) {
          using = false
          pressedStation = null
          options.onUseEnd()
        }

        forward /= length
        sideways /= length
        const yaw = camera.rotation.y
        const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchMovement.running
        const speed = dt * 2.9 * (running ? 2 : 1)
        const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * sideways) * speed
        const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * sideways) * speed
        const segments = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.06))
        for (let segment = 0; segment < segments; segment++) {
          const stepX = dx / segments,
            stepZ = dz / segments
          const across = floorElevation(camera.position.x + stepX, camera.position.z, elevation)
          if (across !== null && !collides(camera.position.x + stepX, camera.position.z, across)) {
            camera.position.x += stepX
            elevation = across
          }
          const forwardElevation = floorElevation(camera.position.x, camera.position.z + stepZ, elevation)
          if (forwardElevation !== null && !collides(camera.position.x, camera.position.z + stepZ, forwardElevation)) {
            camera.position.z += stepZ
            elevation = forwardElevation
          }
        }
        camera.position.y = elevation + EYE_HEIGHT
      } else if (keys.size || using || dragging || lookPointer || touchMovement.forward || touchMovement.sideways) {
        clear()
      }
    },
    setTarget(target: StationId | null) {
      if (
        options.canMove() &&
        (using || options.activeStation()) &&
        target !== (options.activeStation() ?? pressedStation)
      ) {
        using = false
        pressedStation = null
        options.onUseEnd()
      }
      hovered = target
    },
    dispose() {
      disposed = true
      document.removeEventListener('pointerlockchange', pointerChanged)
      document.removeEventListener('pointerlockerror', pointerFailed)
      document.removeEventListener('mousemove', look)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
      unlock()
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear)
      window.removeEventListener('resize', clear)
      document.removeEventListener('visibilitychange', hidden)
      element.removeEventListener('pointerdown', pointerDown)
      element.removeEventListener('pointermove', touchLook)
      element.removeEventListener('lostpointercapture', pointerUp)
    },
  }
}
