import * as THREE from 'three'
import { CUP_DIMENSIONS, createCupBody } from '../../shared/visuals/cup-visual'
import type { GameState } from '../../simulation/state'
import { reusableCupKinds } from '../inventory/cups'
import { DRYING_LEVEL, WASH_OUTLET, WASHING_SPOT } from './equipment'
import { WASH_STEPS, type WashItem, washItems, washStock } from './rules'

export function createWashingVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const steel = new THREE.MeshStandardMaterial({
    color: '#b8c6bc',
    metalness: 0.6,
    roughness: 0.3,
    side: THREE.DoubleSide,
  })
  const dirty = new THREE.MeshStandardMaterial({ color: '#988665', roughness: 0.8 })
  const foam = new THREE.MeshStandardMaterial({ color: '#fcf6e3', transparent: true, opacity: 0.85 })

  function pitcher(parent: THREE.Object3D) {
    const group = new THREE.Group()
    parent.add(group)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.065, 0.23, 28, 1, true), steel)
    body.position.y = 0.115
    body.castShadow = true
    group.add(body)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.008, 24), steel)
    base.position.y = 0.005
    group.add(base)
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 8, 20), steel)
    handle.rotation.y = Math.PI / 2
    handle.position.set(0.1, 0.13, 0)
    group.add(handle)
    const stain = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 24), dirty)
    stain.position.y = 0.012
    group.add(stain)
    const reusable = new Map(reusableCupKinds.map((kind) => [kind, createCupBody(group, kind)]))
    const pitcherParts = [body, base, handle]

    return {
      group,
      stain,
      show(item: WashItem) {
        for (const part of pitcherParts) part.visible = item === 'pitcher'
        for (const [kind, cup] of reusable) cup.root.visible = kind === item
      },
    }
  }

  const working = pitcher(scene)
  const held = pitcher(camera)
  held.group.position.set(0.26, -0.37, -0.62)
  const dirtyQueue = Array.from({ length: 4 }, (_, i) => {
    const value = pitcher(scene)
    value.group.scale.setScalar(0.65)
    value.group.position.set(-5.53, 1.117, -5.42 + i * 0.16)
    return value
  })
  const washedQueue = Array.from({ length: 6 }, (_, i) => {
    const value = pitcher(scene)
    value.group.scale.setScalar(0.65)
    value.group.position.set(-4.15 + (i % 3) * 0.25, 1.132, -5.32 + Math.floor(i / 3) * 0.29)
    value.stain.visible = false
    return value
  })
  const cleanQueue = Array.from({ length: 5 }, (_, i) => {
    const value = pitcher(scene)
    value.group.position.set(-4.12 + (i % 2) * 0.3, DRYING_LEVEL, -5.3 + Math.floor(i / 2) * 0.24)
    value.stain.visible = false
    value.show('pitcher')
    return value
  })
  const sponge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.055),
    new THREE.MeshStandardMaterial({ color: '#d4b564', roughness: 0.9 }),
  )
  scene.add(sponge)
  const soap = Array.from({ length: 9 }, (_, i) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.006, 8, 6), foam)
    mesh.position.set(
      WASH_SPOT[0] + Math.sin(i * 2.4) * 0.07,
      WASH_SPOT[1] + 0.17 + (i % 2) * 0.04,
      WASH_SPOT[2] + Math.cos(i * 2.4) * 0.055,
    )
    scene.add(mesh)
    return mesh
  })
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.012, 1, 10),
    new THREE.MeshStandardMaterial({ color: '#c3e2dc', transparent: true, opacity: 0.7, roughness: 0.1 }),
  )
  water.position.fromArray(WASH_OUTLET)
  scene.add(water)
  const hand = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()

  return {
    update(state: GameState, active: boolean, now: number) {
      const washing = state.washing
      working.group.visible = !!washing && (washing.stage === 'scrub' || washing.stage === 'rinse')
      working.group.position.fromArray(WASH_SPOT)

      if (washing) {
        working.show(washing.item)
        held.show(washing.item)
      }

      const scrub = washing?.stage === 'scrub' ? washing.progress / WASH_STEPS.scrub.seconds : 1
      working.stain.visible = scrub < 1
      working.stain.scale.y = Math.max(0.01, 1 - scrub)
      held.group.visible = washing?.stage === 'carrying'
      held.stain.visible = false
      held.group.rotation.z = Math.sin(now / 650) * 0.025

      for (const [queue, key] of [
        [dirtyQueue, 'dirty'],
        [washedQueue, 'washed'],
      ] as const) {
        const items = washItems.flatMap((item) =>
          Array.from({ length: Math.min(washStock(state, item)[key], queue.length) }, () => item),
        )
        const count = items.length

        queue.forEach((value, i) => {
          value.group.visible = i < count
          if (i < count) {
            value.show(items[i])
          }
        })
      }

      cleanQueue.forEach((value, i) => {
        value.group.visible = i < state.tools.clean
      })

      sponge.visible = !!washing?.spongeHeld

      if (sponge.visible) {
        if (active) {
          sponge.position.set(
            WASH_SPOT[0] + Math.sin(now / 75) * 0.065,
            WASH_SPOT[1] + 0.16,
            WASH_SPOT[2] + 0.02 + Math.cos(now / 90) * 0.045,
          )
          sponge.rotation.set(0.3, now / 300, 0.2)
        } else {
          hand.set(0.26, -0.24, -0.56)
          camera.localToWorld(hand)
          camera.getWorldQuaternion(quaternion)
          sponge.position.copy(hand)
          sponge.quaternion.copy(quaternion)
        }
      }

      soap.forEach((mesh, i) => {
        mesh.visible =
          !!washing &&
          ((washing.stage === 'scrub' && washing.progress > 0) ||
            (washing.stage === 'rinse' && washing.progress < WASH_STEPS.rinse.seconds))
        const amount =
          washing?.stage === 'rinse' ? 1 - washing.progress / WASH_STEPS.rinse.seconds : Math.min(1, scrub * 2)
        mesh.scale.setScalar(Math.max(0.01, amount * (1 + Math.sin(now / 180 + i) * 0.06)))
      })

      water.visible = active && washing?.stage === 'rinse'

      if (water.visible && washing) {
        const vesselHeight = washing.item === 'pitcher' ? 0.23 : CUP_DIMENSIONS[washing.item].height
        const endY = WASH_SPOT[1] + vesselHeight * 0.7
        water.scale.y = WASH_OUTLET[1] - endY
        water.position.y = (WASH_OUTLET[1] + endY) / 2
      }
    },
  }
}

export const WASH_SPOT = WASHING_SPOT
