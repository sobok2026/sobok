import * as THREE from 'three'
import { PREP_SPOT, type PrepTool, preparationStep } from './preparation'
import type { GameState } from './state'
import { addVesselLabel } from './vessel-label'

export function createPreparationVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const mat = (color: string, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.3 : 0.65, metalness })
  const cream = mat('#eee6cd')
  const steel = mat('#afbcb2', 0.6)
  const green = mat('#446d55')
  const brown = mat('#533326')
  function cylinder(
    parent: THREE.Object3D,
    top: number,
    bottom: number,
    height: number,
    material: THREE.Material,
    y = 0,
    open = false,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 32, 1, open), material)
    mesh.position.y = y
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  const vessel = new THREE.Group()
  scene.add(vessel)
  cylinder(
    vessel,
    0.14,
    0.12,
    0.34,
    new THREE.MeshStandardMaterial({
      color: '#d6e9df',
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 0.35,
    }),
    0.17,
    true,
  )
  cylinder(vessel, 0.12, 0.12, 0.008, cream, 0.005)
  const liquidMaterial = mat('#eee0bf')
  const liquid = cylinder(vessel, 0.126, 0.118, 1, liquidMaterial)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.007, 8, 36), steel)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.34
  vessel.add(rim)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 20), steel)
  handle.rotation.y = Math.PI / 2
  handle.position.set(0.16, 0.19, 0)
  vessel.add(handle)
  const lid = cylinder(vessel, 0.145, 0.145, 0.02, green, 0.351)
  const marking = new THREE.Group()
  vessel.add(marking)
  box(marking, 0.115, 0.09, 0.009, cream, 0, 0.16, 0.136)
  for (let i = 0; i < 3; i++) box(marking, 0.075 - i * 0.01, 0.005, 0.003, green, 0, 0.185 - i * 0.022, 0.142)
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.008, 8, 32, Math.PI * 1.5), cream)
  swirl.rotation.x = Math.PI / 2
  vessel.add(swirl)
  const pump = new THREE.Group()
  scene.add(pump)
  cylinder(pump, 0.055, 0.055, 0.19, cream, 0.095)
  const head = box(pump, 0.18, 0.015, 0.025, green, -0.045, 0.23, 0)
  const tools = new Map<PrepTool, THREE.Group>()
  function tool(id: PrepTool) {
    const group = new THREE.Group()
    scene.add(group)
    tools.set(id, group)
    return group
  }
  for (const [id, color] of [
    ['cream-carton', '#b4a574'],
    ['milk-carton', '#759883'],
  ] as const) {
    const carton = tool(id)
    box(carton, 0.11, 0.21, 0.085, cream)
    box(carton, 0.112, 0.055, 0.087, mat(color), 0, -0.025)
    cylinder(carton, 0.022, 0.022, 0.025, cream, 0.117)
    addVesselLabel(carton, id === 'cream-carton' ? '크림' : '우유', color, 0.086, 0.048, -0.025, 0.045)
  }
  const pack = tool('mocha-pack')
  box(pack, 0.15, 0.22, 0.045, mat('#b6a079'))
  box(pack, 0.153, 0.07, 0.047, brown)
  addVesselLabel(pack, '바모카', '#77513b', 0.12, 0.064, -0.015, 0.025)
  for (const id of ['water-jug', 'cold-water-jug'] as const) {
    const jug = tool(id)
    cylinder(jug, 0.09, 0.067, 0.22, steel, 0, true)
    const jugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 20), steel)
    jugHandle.rotation.y = Math.PI / 2
    jugHandle.position.x = 0.095
    jug.add(jugHandle)
    addVesselLabel(
      jug,
      id === 'water-jug' ? '온수' : '정수',
      id === 'water-jug' ? '#95612d' : '#476f87',
      0.09,
      0.054,
      -0.015,
      0.08,
    )
  }
  const scoop = tool('tea-scoop')
  box(scoop, 0.042, 0.025, 0.06, steel)
  box(scoop, 0.012, 0.01, 0.13, steel, 0, 0, 0.08)
  box(scoop, 0.034, 0.015, 0.045, brown, 0, 0.015)
  const teaShaker = tool('tea-shaker')
  cylinder(teaShaker, 0.07, 0.065, 0.25, mat('#967345'))
  cylinder(teaShaker, 0.073, 0.073, 0.025, green, 0.137)
  addVesselLabel(teaShaker, '호지차', '#756342', 0.096, 0.058, -0.015, 0.068)
  const spatula = tool('spatula')
  box(spatula, 0.018, 0.26, 0.012, mat('#9c835b'))
  box(spatula, 0.045, 0.075, 0.015, cream, 0, -0.14)
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), mat('#f3e6c9'))
  scene.add(stream)
  const hand = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const from = new THREE.Vector3(),
    to = new THREE.Vector3(),
    direction = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0)
  let key = '',
    previous = 0,
    pulseUntil = 0
  return {
    update(state: GameState, active: boolean, now: number) {
      const prep = state.preparation
      const batch = state.batches.find((batch) => batch.id === prep?.batchId)
      vessel.visible = !!prep && batch?.location !== 'hand' && prep.tool !== 'tea-shaker'
      pump.visible = false
      stream.visible = false
      for (const model of tools.values()) model.visible = false
      if (!prep || batch?.location === 'hand') return
      const operation = preparationStep(prep)
      const processing = prep.stage === 'processing' && !prep.fault
      if (processing) vessel.position.set(-2.9, 1.355, -5.12)
      else vessel.position.fromArray(PREP_SPOT)
      vessel.rotation.z = processing ? Math.sin(now / 25) * 0.007 : 0
      vessel.scale.setScalar(prep.recipe === 'mocha' ? 1.2 : 1)
      const liquidRatio =
        prep.recipe === 'foam'
          ? (prep.amounts.cream + prep.amounts.milk + prep.amounts.glaze) / 380
          : prep.recipe === 'hojicha'
            ? prep.amounts.water / 300 + prep.amounts.hojichaPowder * 0.005
            : prep.amounts.water / 1250 + prep.amounts.mochaPowder * 0.08
      const height = Math.min(0.3, Math.max(0.001, liquidRatio * 0.3))
      liquid.visible = liquidRatio > 0
      liquid.scale.y = height
      liquid.position.y = 0.01 + height / 2
      liquidMaterial.color.set(prep.recipe === 'foam' ? '#efe3c8' : prep.recipe === 'hojicha' ? '#967345' : '#54382b')
      handle.visible = prep.recipe !== 'hojicha'
      lid.visible = processing || (prep.recipe === 'hojicha' && operation.kind === 'shake')
      swirl.visible = processing || (active && operation.kind === 'stir')
      swirl.position.y = height + 0.017
      swirl.rotation.z = now / 100
      marking.visible = !!batch?.labelled
      const nextKey = `${prep.id}:${prep.step}`
      if (nextKey !== key) {
        key = nextKey
        previous = prep.progress
      }
      if (prep.progress > previous && ['pump', 'pack', 'scoop', 'shake'].includes(operation.kind))
        pulseUntil = now + 330
      previous = prep.progress
      const pulse = Math.max(0, (pulseUntil - now) / 330)
      if (prep.stage === 'measuring' && operation.kind === 'pump') {
        pump.visible = true
        pump.position.set(PREP_SPOT[0] + 0.31, PREP_SPOT[1], PREP_SPOT[2] - 0.06)
        head.position.y = 0.23 - Math.sin(pulse * Math.PI) * 0.035
      }
      if (prep.tool) {
        const model = tools.get(prep.tool)!
        model.visible = true
        if (active || pulse > 0) {
          model.position.set(PREP_SPOT[0] + 0.16, PREP_SPOT[1] + 0.51, PREP_SPOT[2])
          model.rotation.set(0, 0, 0.95)
          if (operation.kind === 'stir') {
            model.position.set(
              PREP_SPOT[0] + Math.sin(now / 130) * 0.055,
              PREP_SPOT[1] + 0.37,
              PREP_SPOT[2] + Math.cos(now / 130) * 0.055,
            )
            model.rotation.z = 0.22
          }
          if (operation.kind === 'shake') {
            model.position.set(
              PREP_SPOT[0] + 0.1,
              PREP_SPOT[1] + 0.4 + Math.sin(pulse * Math.PI * 4) * 0.07,
              PREP_SPOT[2],
            )
            model.rotation.z = 0.35 + Math.sin(pulse * Math.PI * 4) * 0.25
          }
        } else {
          hand.set(0.27, -0.23, -0.57)
          camera.localToWorld(hand)
          camera.getWorldQuaternion(rotation)
          model.position.copy(hand)
          model.quaternion.copy(rotation)
        }
      }
      if ((active && operation.kind === 'pour') || (pulse > 0 && operation.kind !== 'shake')) {
        from.set(PREP_SPOT[0] + 0.1, PREP_SPOT[1] + 0.45, PREP_SPOT[2])
        to.set(PREP_SPOT[0], PREP_SPOT[1] + height + 0.015, PREP_SPOT[2])
        direction.subVectors(to, from)
        stream.position.copy(from).add(to).multiplyScalar(0.5)
        stream.quaternion.setFromUnitVectors(up, direction.clone().normalize())
        stream.scale.set(0.009, direction.length(), 0.009)
        stream.visible = true
        ;(stream.material as THREE.MeshStandardMaterial).color.set(
          operation.kind === 'pack' || operation.kind === 'scoop'
            ? '#634329'
            : operation.tool === 'water-jug' || operation.tool === 'cold-water-jug'
              ? '#b9d5cf'
              : operation.kind === 'pump'
                ? '#caaa73'
                : '#f1e4c9',
        )
      }
    },
  }
}
