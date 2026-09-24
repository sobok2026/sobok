import * as THREE from 'three'
import { cupSurfaceIds } from './catalog'
import { CLEANING_SECONDS, cleaningSpot, cupSurface } from './cleaning'
import type { GameState } from './state'

export function createCleaningVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const paper = new THREE.MeshStandardMaterial({ color: '#e6d6b6', roughness: 0.9 })
  const coffee = new THREE.MeshStandardMaterial({ color: '#79543a', roughness: 0.8 })
  function cup(parent: THREE.Object3D, x: number, y: number, z: number) {
    const group = new THREE.Group()
    group.position.set(x, y, z)
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.16, 16), paper))
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.005, 16), coffee)
    rim.position.y = 0.081
    group.add(rim)
    parent.add(group)
    return group
  }
  function stain(x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 24),
      new THREE.MeshBasicMaterial({ color: '#78573a', transparent: true, opacity: 0.4, depthWrite: false }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, z)
    scene.add(mesh)
    return mesh
  }
  const tables = cupSurfaceIds.map((id) => {
    const [x, y, z] = cleaningSpot(id)
    const cups = Array.from({ length: 6 }, (_, i) =>
      cup(scene, x + ((i % 3) - 1) * 0.21, y + 0.075, z + (Math.floor(i / 3) - 0.5) * 0.3),
    )
    return { id, cups, stain: stain(x + 0.12, y, z - 0.08) }
  })
  const barStain = stain(...cleaningSpot('mix'))
  const held = new THREE.Group()
  camera.add(held)
  held.position.set(0.28, -0.33, -0.6)
  const heldCups = Array.from({ length: 6 }, (_, i) => cup(held, (i % 2) * 0.1, Math.floor(i / 2) * 0.065, 0))
  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.018, 0.12),
    new THREE.MeshStandardMaterial({ color: '#b7c7a1', roughness: 1 }),
  )
  scene.add(cloth)
  const bag = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#596c5b', roughness: 0.9 }),
  )
  bag.position.set(-5.4, 0.98, 5.1)
  scene.add(bag)
  const binCups = Array.from({ length: 5 }, (_, i) =>
    cup(scene, -5.56 + (i % 3) * 0.15, 0.88 + Math.floor(i / 3) * 0.1, 5.08),
  )
  const hand = new THREE.Vector3()
  return {
    update(state: GameState, active: boolean, now: number) {
      const cleaning = state.cleaning
      const ratio = cleaning?.stage === 'wipe' ? cleaning.progress / CLEANING_SECONDS.wipe : 0
      for (const table of tables) {
        table.cups.forEach((value, i) => {
          value.visible = i < cupSurface(state, table.id).cups
        })
        table.stain.visible = cupSurface(state, table.id).dirty
        table.stain.material.opacity = 0.4 * (1 - (cleaning?.station === table.id ? ratio * 0.9 : 0))
      }
      barStain.visible = state.dirtyBar > 0
      barStain.material.opacity = 0.4 * (1 - (cleaning?.station === 'mix' ? ratio * 0.9 : 0))
      held.visible = !!cleaning?.heldCups
      heldCups.forEach((value, i) => {
        value.visible = i < (cleaning?.heldCups ?? 0)
      })
      cloth.visible = !!cleaning?.clothHeld
      if (cloth.visible && cleaning) {
        if (active) {
          const [x, y, z] = cleaningSpot(cleaning.station)
          cloth.position.set(x + Math.sin(now / 100) * 0.18, y + 0.02, z + Math.cos(now / 125) * 0.1)
          cloth.rotation.set(0, Math.sin(now / 200) * 0.4, 0)
        } else {
          hand.set(0.24, -0.28, -0.54)
          camera.localToWorld(hand)
          cloth.position.copy(hand)
          camera.getWorldQuaternion(cloth.quaternion)
        }
      }
      bag.visible = cleaning?.stage === 'bag'
      const bagRatio = cleaning?.stage === 'bag' ? cleaning.progress / CLEANING_SECONDS.bag : 0
      bag.scale.set(1, 0.5 + bagRatio * 0.8, 1)
      binCups.forEach((value, i) => {
        value.visible = i < state.trash && !bag.visible
      })
    },
  }
}
