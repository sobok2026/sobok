import * as THREE from 'three'
import { createCupBody } from '../../shared/visuals/cup-visual'
import type { GameState } from '../../simulation/state'
import { reusableCupKinds } from '../inventory/cups'
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
  const dirtyQueue = Array.from({ length: 11 }, (_, i) => {
    const value = pitcher(scene)
    value.group.scale.setScalar(0.65)
    value.group.position.set(
      -5.5 + (i % 2) * 0.18,
      1.11 + Math.floor(i / 6) * 0.12,
      -5.42 + (Math.floor(i / 2) % 3) * 0.2,
    )
    return value
  })
  const washedQueue = Array.from({ length: 11 }, (_, i) => {
    const value = pitcher(scene)
    value.group.scale.setScalar(0.65)
    value.group.position.set(
      -4.65 + (i % 2) * 0.18,
      1.11 + Math.floor(i / 6) * 0.12,
      -5.42 + (Math.floor(i / 2) % 3) * 0.2,
    )
    value.stain.visible = false
    return value
  })
  const cleanQueue = Array.from({ length: 5 }, (_, i) => {
    const value = pitcher(scene)
    value.group.position.set(-4.12 + (i % 2) * 0.3, 1.13, -5.3 + Math.floor(i / 2) * 0.24)
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
    new THREE.CylinderGeometry(0.009, 0.012, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: '#c3e2dc', transparent: true, opacity: 0.7, roughness: 0.1 }),
  )
  water.position.set(-5, 1.44, -5.14)
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
          if (i < count) value.show(items[i])
        })
      }
      cleanQueue.forEach((value, i) => {
        value.group.visible = i < state.tools.clean
      })
      sponge.visible = !!washing?.spongeHeld
      if (sponge.visible) {
        if (active) {
          sponge.position.set(-5 + Math.sin(now / 75) * 0.065, 1.3, -5.03 + Math.cos(now / 90) * 0.045)
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
    },
  }
}

export const WASH_SPOT: [number, number, number] = [-5, 1.13, -5.05]
