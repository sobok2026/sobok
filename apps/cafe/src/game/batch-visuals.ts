import * as THREE from 'three'
import { carriedBatch } from './batches'
import { INGREDIENTS } from './catalog'
import type { GameState } from './state'

export function createBatchVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const vessel = new THREE.Group()
  vessel.position.set(0.25, -0.36, -0.7)
  camera.add(vessel)
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.105, 0.32, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#cedbd0',
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  shell.position.y = 0.16
  vessel.add(shell)
  const drinkMaterial = new THREE.MeshStandardMaterial({ color: '#efe0bf', roughness: 0.7 })
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.102, 1, 24), drinkMaterial)
  vessel.add(liquid)
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.011, 8, 18),
    new THREE.MeshStandardMaterial({ color: '#829485', metalness: 0.3, roughness: 0.4 }),
  )
  handle.rotation.y = Math.PI / 2
  handle.position.set(0.145, 0.17, 0)
  vessel.add(handle)
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.075, 0.008),
    new THREE.MeshStandardMaterial({ color: '#f3e8d0' }),
  )
  label.position.set(0, 0.17, 0.128)
  vessel.add(label)
  const shelfCups = Array.from({ length: 3 }, (_, index) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: '#705241', roughness: 0.7 }),
    )
    cup.position.set(2.45 + index * 0.4, 1.25, -5.18)
    scene.add(cup)
    return cup
  })
  return {
    update(state: GameState) {
      const held = carriedBatch(state)
      vessel.visible = !!held
      if (held) {
        drinkMaterial.color.set(
          held.ingredient === 'foam'
            ? '#eee0bf'
            : held.ingredient === 'mocha'
              ? '#65422e'
              : held.ingredient === 'hojicha'
                ? '#967345'
                : '#3e2c20',
        )
        handle.visible = held.ingredient !== 'hojicha'
        const height = Math.max(0.012, 0.29 * Math.min(1, held.amount / INGREDIENTS[held.ingredient].pack))
        liquid.scale.y = height
        liquid.position.y = height / 2 + 0.006
        label.visible = held.labelled
        vessel.scale.setScalar(held.ingredient === 'coldBrew' ? 1.15 : held.ingredient === 'mocha' ? 1 : 0.85)
      }
      const stored = state.batches.filter(
        (batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0,
      ).length
      shelfCups.forEach((cup, index) => {
        cup.visible = index < stored
      })
    },
  }
}
