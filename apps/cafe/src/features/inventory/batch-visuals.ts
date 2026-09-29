import * as THREE from 'three'
import { INGREDIENTS } from '../../content/ingredients'
import { STATIONS } from '../../content/stations'
import { createCupBody } from '../../shared/visuals/cup-visual'
import { materialColor } from '../../shared/visuals/material-color'
import { createPumpVisual, pumpSpec } from '../../shared/visuals/pump-visual'
import { createWhippingDispenser } from '../../shared/visuals/whipping-dispenser'
import type { GameState } from '../../simulation/state'
import { carriedBatch, isSealed } from './batches'
import { CUP_SUPPLY, type DisposableCupKind } from './cups'

const BATCH_COLORS: Partial<Record<string, string>> = {
  foam: '#eee0bf',
  mocha: '#65422e',
  hojicha: '#967345',
  matcha: '#568438',
}

const BATCH_SCALES: Partial<Record<string, number>> = { 'cold-brew': 1.15, mocha: 1 }

export function createBatchVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const materialModels = new Map<string, ReturnType<typeof createPumpVisual>>()
  const carriedMaterial = new THREE.Group()
  carriedMaterial.position.set(0.25, -0.44, -0.74)
  carriedMaterial.rotation.y = -0.25
  carriedMaterial.scale.setScalar(0.85)
  camera.add(carriedMaterial)
  let whipper: ReturnType<typeof createWhippingDispenser> | undefined
  const bundles = new Map<DisposableCupKind, ReturnType<typeof createCupBody>[]>()
  const cupBundle = new THREE.Group()
  cupBundle.position.set(0.24, -0.36, -0.7)
  camera.add(cupBundle)
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
  // A delivered pack is the same plain box for every ingredient, so where it belongs stays the player's call.
  const pack = new THREE.Group()
  pack.position.set(0.25, -0.34, -0.72)
  pack.rotation.y = -0.35
  camera.add(pack)
  const carton = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.26, 0.17),
    new THREE.MeshStandardMaterial({ color: '#c49a68', roughness: 0.86 }),
  )
  carton.position.y = 0.13
  pack.add(carton)
  const packLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.08, 0.004),
    new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.8 }),
  )
  packLabel.position.set(0, 0.15, 0.087)
  pack.add(packLabel)
  const shelfJars = Array.from({ length: 3 }, (_, index) => {
    const jar = createPumpVisual(scene, pumpSpec('mocha')!)
    jar.root.position.set(STATIONS.shelf.x + 0.03, 1.095, STATIONS.shelf.z - 0.4 + index * 0.4)
    jar.root.scale.setScalar(0.85)
    return jar
  })

  return {
    update(state: GameState) {
      const held = carriedBatch(state)
      const sealed = !!held && isSealed(held)
      const rawPack = !!held && !INGREDIENTS[held.ingredient].prepared
      vessel.visible = !!held && !sealed && !rawPack
      pack.visible = sealed || rawPack
      for (const model of materialModels.values()) model.root.visible = false
      if (whipper) whipper.root.visible = false

      if (held) {
        const spec = pumpSpec(held.ingredient)
        if (spec && (!sealed || spec.kind === 'syrup')) {
          let model = materialModels.get(spec.key)

          if (!model) {
            model = createPumpVisual(carriedMaterial, spec)
            materialModels.set(spec.key, model)
          }

          model.root.visible = true
          model.update(0, held.amount / INGREDIENTS[held.ingredient].pack, sealed)
          vessel.visible = pack.visible = false
        } else if (!sealed && held.ingredient.endsWith('whipped-cream')) {
          whipper ??= createWhippingDispenser(carriedMaterial)
          whipper.root.visible = true
          whipper.update(0, materialColor(held.ingredient))
          vessel.visible = pack.visible = false
        }
      }

      for (const cups of bundles.values()) for (const cup of cups) cup.root.visible = false
      cupBundle.visible = !!state.cupDelivery

      if (state.cupDelivery) {
        const { kind, amount } = state.cupDelivery
        let cups = bundles.get(kind)
        if (!cups) {
          cups = Array.from({ length: CUP_SUPPLY.refill }, (_, index) => {
            const cup = createCupBody(cupBundle, kind)
            cup.root.scale.setScalar(0.52)
            cup.root.position.y = index * 0.035
            return cup
          })
          bundles.set(kind, cups)
        }
        cups.forEach((cup, index) => {
          cup.root.visible = index < amount
        })
      }

      if (held && !sealed) {
        drinkMaterial.color.set(BATCH_COLORS[held.ingredient] ?? materialColor(held.ingredient))
        handle.visible = held.ingredient !== 'hojicha' && held.ingredient !== 'matcha'
        const height = Math.max(0.012, 0.29 * Math.min(1, held.amount / INGREDIENTS[held.ingredient].pack))
        liquid.scale.y = height
        liquid.position.y = height / 2 + 0.006
        label.visible = held.labelled
        vessel.scale.setScalar(BATCH_SCALES[held.ingredient] ?? 0.85)
      }

      const stored = state.batches.filter(
        (batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0,
      ).length

      shelfJars.forEach((jar, index) => {
        jar.root.visible = index < stored
      })
    },
  }
}
