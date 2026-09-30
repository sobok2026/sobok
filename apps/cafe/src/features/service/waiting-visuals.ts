import * as THREE from 'three'
import { workCylinder, workMaterial } from '../../shared/visuals/work-geometry'
import type { GameState } from '../../simulation/state'

export function createWaitingVisuals(scene: THREE.Scene) {
  const people = Array.from({ length: 10 }, (_, index) => {
    const root = new THREE.Group()
    scene.add(root)
    workCylinder(root, 0.2, 0.24, 0.6, workMaterial(['#718882', '#a48573', '#87936d'][index % 3]), 1.1)
    workCylinder(root, 0.18, 0.16, 0.31, workMaterial('#d4ab8d'), 1.58)

    for (const x of [-0.11, 0.11]) {
      const leg = workCylinder(root, 0.065, 0.075, 0.8, workMaterial('#3e4746'), 0.41)
      leg.position.x = x
    }

    return root
  })

  return {
    update(state: GameState) {
      people.forEach((root, index) => {
        const customer = state.waitingOrders[index]?.customer
        root.visible = !!customer
        if (customer) root.position.set(customer.position[0], customer.position[2], customer.position[1])
      })
    },
  }
}
