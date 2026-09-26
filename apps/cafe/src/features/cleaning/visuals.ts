import * as THREE from 'three'
import { cupSurfaceIds } from '../../content/stations'
import { createCupBody } from '../../shared/visuals/cup-visual'
import type { GameState } from '../../simulation/state'
import { cupCount, type ReusableCupCounts, reusableCupKinds } from '../inventory/cups'
import type { CleaningStation } from './rules'
import { CLEANING_SECONDS, cupSurface } from './rules'

export function createCleaningVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const paper = new THREE.MeshStandardMaterial({ color: '#e6d6b6', roughness: 0.9 })
  const coffee = new THREE.MeshStandardMaterial({ color: '#79543a', roughness: 0.8 })

  function cup(parent: THREE.Object3D, x: number, y: number, z: number) {
    const root = new THREE.Group()
    root.position.set(x, y, z)
    root.scale.setScalar(0.65)
    parent.add(root)
    const bodies = new Map(reusableCupKinds.map((kind) => [kind, createCupBody(root, kind)]))
    const residue = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 16), coffee)
    residue.position.y = 0.014
    root.add(residue)
    return { root, bodies }
  }

  function showCups(visuals: ReturnType<typeof cup>[], counts: ReusableCupCounts | undefined) {
    const kinds = reusableCupKinds.flatMap((kind) =>
      Array.from({ length: Math.min(counts?.[kind] ?? 0, visuals.length) }, () => kind),
    )
    const count = kinds.length

    visuals.forEach((visual, i) => {
      visual.root.visible = i < count
      const kind = kinds[i]
      for (const [id, body] of visual.bodies) body.root.visible = id === kind
    })
  }

  function stain(x: number, y: number, z: number) {
    const root = new THREE.Group()
    root.position.set(x, y + 0.001, z)
    scene.add(root)
    const material = new THREE.MeshBasicMaterial({
      color: '#70452c',
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.092, 32, 1, 0.2, Math.PI * 1.78), material)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(-0.09, 0, 0.025)
    root.add(ring)
    const patches = [
      [0.08, -0.025, 0.105, 0.055],
      [0.145, 0.04, 0.052, 0.039],
      [-0.015, -0.09, 0.025, 0.018],
      [0.205, -0.05, 0.016, 0.021],
    ]
    const geometry = new THREE.CircleGeometry(1, 24)

    for (const [dx, dz, width, depth] of patches) {
      const patch = new THREE.Mesh(geometry, material)
      patch.rotation.x = -Math.PI / 2
      patch.position.set(dx, 0.0005, dz)
      patch.scale.set(width, depth, 1)
      root.add(patch)
    }

    return { root, material }
  }

  const tables = cupSurfaceIds.map((id) => {
    const [x, y, z] = cleaningSpot(id)
    const cups = Array.from({ length: 8 }, (_, i) =>
      cup(scene, x + ((i % 3) - 1) * 0.21, y + 0.005, z + (Math.floor(i / 3) - 0.5) * 0.3),
    )
    return { id, cups, stain: stain(x + 0.12, y, z - 0.08) }
  })
  const barStain = stain(...cleaningSpot('mix'))
  const held = new THREE.Group()
  camera.add(held)
  held.position.set(0.28, -0.33, -0.6)
  const heldCups = Array.from({ length: 8 }, (_, i) => cup(held, (i % 2) * 0.1, Math.floor(i / 2) * 0.065, 0))
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
  const waste = Array.from({ length: 5 }, (_, i) => {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), paper)
    mesh.position.set(-5.56 + (i % 3) * 0.15, 0.9 + Math.floor(i / 3) * 0.1, 5.08)
    scene.add(mesh)
    return mesh
  })
  const hand = new THREE.Vector3()

  return {
    update(state: GameState, active: boolean, now: number) {
      const cleaning = state.cleaning
      const ratio = cleaning?.stage === 'wipe' ? cleaning.progress / CLEANING_SECONDS.wipe : 0

      for (const table of tables) {
        showCups(table.cups, cupSurface(state, table.id).cups)
        table.stain.root.visible = cupSurface(state, table.id).dirty
        const remaining = 1 - (cleaning?.station === table.id ? ratio : 0)
        table.stain.material.opacity = 0.58 * remaining
        table.stain.root.scale.setScalar(0.72 + remaining * 0.28)
      }

      barStain.root.visible = state.dirtyBar > 0
      const barRemaining = 1 - (cleaning?.station === 'mix' ? ratio : 0)
      barStain.material.opacity = 0.58 * barRemaining
      barStain.root.scale.setScalar((0.72 + barRemaining * 0.28) * (state.dirtyBar > 1 ? 1.15 : 1))
      held.visible = cupCount(cleaning?.heldCups) > 0
      showCups(heldCups, cleaning?.heldCups)
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

      waste.forEach((value, i) => {
        value.visible = i < state.trash && !bag.visible
      })
    },
  }
}

export function cleaningSpot(station: CleaningStation): [number, number, number] {
  if (station === 'condiment') return [0, 1.085, 4.95]
  if (station === 'mix') return [4.1, 1.09, -1.48]
  if (station === 'trash') return [-5.4, 0.87, 5.1]
  return [station === 'table' ? 3.2 : -2.2, 0.85, 3.7]
}
