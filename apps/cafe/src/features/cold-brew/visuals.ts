import * as THREE from 'three'
import type { GameState } from '../../simulation/state'
import { createColdBrewTank } from './equipment'
import { COLD_BREW_BEANS, COLD_BREW_WATER } from './rules'

export function createColdBrewVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
  const steel = material('#9cae9f')
  const { lid, contents } = createColdBrewTank(scene)
  const jar = new THREE.Group()
  jar.position.set(0.84, 1.1, -4.89)
  scene.add(jar)
  const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.25, 24), material('#64442c'))
  jarBody.position.y = 0.125
  jar.add(jarBody)
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.01), material('#f2e6ce'))
  label.position.set(0, 0.13, 0.137)
  jar.add(label)
  const tools = new THREE.Group()
  camera.add(tools)
  tools.position.set(0.25, -0.25, -0.62)
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.26, 0.1), material('#b19469'))
  tools.add(bag)
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.24, 20, 1, true), steel)
  tools.add(jug)
  const streamMaterial = material('#adced2')
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.027, 0.28, 10), streamMaterial)
  stream.position.set(0.84, 1.88, -5.22)
  scene.add(stream)
  return {
    update(state: GameState, active: boolean) {
      const brew = state.coldBrew
      const batch = state.batches.find((item) => item.id === brew?.batchId)
      lid.visible = brew?.stage !== 'measuring' || brew.step === 2
      contents.visible = !!brew && brew.stage !== 'ready' && (brew.beans > 0 || brew.water > 0)
      const height = brew
        ? Math.min(0.44, (0.12 * brew.beans) / COLD_BREW_BEANS + (0.3 * brew.water) / COLD_BREW_WATER)
        : 0.001
      contents.scale.y = Math.max(0.001, height)
      contents.position.y = height / 2 + 0.027
      jar.visible = batch?.location === 'cold-prep'
      label.visible = !!batch?.labelled
      tools.visible = !!brew?.tool
      bag.visible = brew?.tool === 'bean-bag'
      jug.visible = brew?.tool === 'water-jug'
      tools.rotation.z = active ? -0.55 : 0
      stream.visible = active && brew?.stage === 'measuring' && !!brew.tool && brew.step < 2 && !brew.fault
      streamMaterial.color.set(brew?.step === 0 ? '#64432c' : '#adced2')
    },
  }
}
