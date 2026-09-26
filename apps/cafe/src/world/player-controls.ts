import * as THREE from 'three'
import type { StationId } from '../content/stations'
import { craftStations } from '../features/crafting/rules'
import { carriedBatch } from '../features/inventory/batches'
import { cupCount } from '../features/inventory/cups'
import { washDestination } from '../features/washing/rules'
import type { Obstacle } from './interior'
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
    if (!element.isConnected || !options.canMove()) return
    wantsMouseLook = true
    if (document.pointerLockElement === element || lockPending) return
    lockPending = true

    try {
      const result = element.requestPointerLock()
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
    if (document.pointerLockElement === element) document.exitPointerLock()
  }

  const unlockForCraft = () => {
    wantsMouseLook = false
    releasingForCraft = true
    options.onMouseMode('cursor')
    if (document.pointerLockElement === element) document.exitPointerLock()
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

  document.addEventListener('pointerlockchange', pointerChanged)
  document.addEventListener('pointerlockerror', pointerFailed)
  document.addEventListener('mousemove', look)
  window.addEventListener('pointerup', pointerUp)
  element.addEventListener('pointerdown', pointerDown)
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clear)

  return {
    lock,
    unlock,
    unlockForCraft,
    update(dt: number) {
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
    },
    setTarget(target: StationId | null) {
      if ((using || options.activeStation()) && target !== (options.activeStation() ?? pressedStation)) {
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
      unlock()
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear)
      element.removeEventListener('pointerdown', pointerDown)
    },
  }
}
