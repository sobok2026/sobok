import * as THREE from 'three'
import { staffFacingZ } from './catalog'
import { type CraftState, type CraftTool, cupSpot, operationFor } from './crafting'
import type { GameState } from './state'

type CupVisual = {
  root: THREE.Group
  shell: THREE.Mesh
  sleeve: THREE.Mesh
  lid: THREE.Mesh
  layers: { mesh: THREE.Mesh; vertices: Float32Array }[]
  ice: THREE.InstancedMesh
  drizzle: THREE.Mesh
  powder: THREE.InstancedMesh
  shot: THREE.Group
  shotLiquid: THREE.Mesh
}
export function createCraftVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const standard = (color: string, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.3 : 0.65, metalness })
  const cream = standard('#f8edcf')
  const steel = standard('#adbbb2', 0.65)
  const chocolate = standard('#48281c')
  const cylinder = (
    parent: THREE.Object3D,
    r1: number,
    r2: number,
    height: number,
    mat: THREE.Material,
    y = 0,
    open = false,
  ) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, height, 32, 1, open), mat)
    mesh.position.y = y
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  const block = (parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    parent.add(mesh)
    mesh.castShadow = true
    return mesh
  }
  const matrix = new THREE.Object3D()
  function makeCup(parent: THREE.Object3D): CupVisual {
    const root = new THREE.Group()
    parent.add(root)
    const shell = cylinder(
      root,
      0.112,
      0.078,
      0.285,
      new THREE.MeshStandardMaterial({ color: '#f9efdc', side: THREE.DoubleSide, roughness: 0.36 }),
      0.1425,
      true,
    )
    const sleeve = cylinder(root, 0.101, 0.091, 0.072, standard('#3b6049'), 0.135, true)
    const base = cylinder(root, 0.078, 0.078, 0.007, cream, 0.004)
    base.receiveShadow = true
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.111, 0.004, 8, 40), cream)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.285
    root.add(rim)
    const lid = cylinder(root, 0.119, 0.117, 0.023, standard('#f1e7cf'), 0.301)
    const sip = block(lid, 0.035, 0.004, 0.012, chocolate)
    sip.position.set(0, 0.014, 0.08)
    const colors = ['#cdad74', '#4d2b18', '#e8f0e9', '#dfc29b', '#fff2d7']
    const layers = colors.map((color) => {
      const mesh = cylinder(root, 1, 1, 1, standard(color))
      return { mesh, vertices: new Float32Array(mesh.geometry.getAttribute('position').array) }
    })
    const ice = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.04, 0.033, 0.04),
      new THREE.MeshStandardMaterial({ color: '#deeeeb', transparent: true, opacity: 0.75, roughness: 0.22 }),
      8,
    )
    for (let i = 0; i < 8; i++) {
      matrix.position.set(Math.sin(i * 2.4) * 0.058, 0.21 + (i % 3) * 0.017, Math.cos(i * 2.4) * 0.058)
      matrix.rotation.set(i * 0.3, i, i * 0.4)
      matrix.updateMatrix()
      ice.setMatrixAt(i, matrix.matrix)
    }
    root.add(ice)
    const drizzle = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.005, 8, 64), chocolate)
    drizzle.rotation.x = Math.PI / 2
    root.add(drizzle)
    const powder = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0032, 0), standard('#a56d36'), 32)
    root.add(powder)
    const shot = new THREE.Group()
    root.add(shot)
    shot.position.set(-0.48, 0, 0.06)
    cylinder(
      shot,
      0.045,
      0.034,
      0.085,
      new THREE.MeshStandardMaterial({
        color: '#daeee6',
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      0.042,
      true,
    )
    const shotLiquid = cylinder(shot, 0.041, 0.034, 0.057, chocolate, 0.031)
    return { root, shell, sleeve, lid, layers, ice, drizzle, powder, shot, shotLiquid }
  }
  const bench = makeCup(scene)
  const held = makeCup(camera)
  held.root.position.set(0.28, -0.43, -0.62)
  held.root.scale.setScalar(0.85)
  const tools = new Map<CraftTool, THREE.Group>()
  function tool(id: CraftTool) {
    const root = new THREE.Group()
    scene.add(root)
    root.visible = false
    tools.set(id, root)
    return root
  }
  const carton = tool('milk-carton')
  block(carton, 0.1, 0.19, 0.08, cream)
  const stripe = block(carton, 0.102, 0.055, 0.081, standard('#709581'))
  stripe.position.y = -0.005
  const spout = cylinder(carton, 0.022, 0.022, 0.025, cream, 0.11)
  spout.position.x = -0.025
  for (const id of ['pitcher', 'foam-pitcher', 'shot-glass'] as const) {
    const root = tool(id)
    const scale = id === 'shot-glass' ? 0.62 : 1
    cylinder(root, 0.087, 0.06, 0.19, id === 'pitcher' ? steel : cream, 0, true)
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20), steel)
    handle.rotation.y = Math.PI / 2
    handle.position.x = 0.09
    root.add(handle)
    root.scale.setScalar(scale)
  }
  const stirrer = tool('stirrer')
  cylinder(stirrer, 0.006, 0.006, 0.26, standard('#b8a17a'))
  const bottle = tool('mocha-bottle')
  cylinder(bottle, 0.038, 0.042, 0.17, chocolate)
  cylinder(bottle, 0.006, 0.03, 0.045, cream, 0.106)
  const shaker = tool('shaker')
  cylinder(shaker, 0.038, 0.035, 0.105, standard('#c69b59'))
  cylinder(shaker, 0.04, 0.04, 0.025, steel, 0.065)
  const scoop = tool('ice-scoop')
  const scoopBowl = block(scoop, 0.07, 0.04, 0.1, steel)
  scoopBowl.position.z = -0.03
  const scoopHandle = cylinder(scoop, 0.009, 0.009, 0.16, steel)
  scoopHandle.rotation.x = Math.PI / 2
  scoopHandle.position.z = 0.07
  cylinder(tool('lid'), 0.119, 0.117, 0.018, cream)

  const receivingPitcher = new THREE.Group()
  scene.add(receivingPitcher)
  cylinder(receivingPitcher, 0.09, 0.065, 0.21, steel, 0.105, true)
  const pitcherMilk = cylinder(receivingPitcher, 0.081, 0.064, 0.17, cream, 0.09)
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), standard('#e7d1a4'))
  scene.add(stream)
  const pump = new THREE.Group()
  scene.add(pump)
  cylinder(pump, 0.057, 0.057, 0.18, cream, 0.09)
  const pumpHead = block(pump, 0.1, 0.018, 0.035, steel)
  pumpHead.position.set(0.02, 0.205, 0)
  const vapor = Array.from({ length: 7 }, (_, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#fff9e7', transparent: true, opacity: 0.1, depthWrite: false }),
    )
    mesh.userData.offset = i
    scene.add(mesh)
    return mesh
  })
  const start = new THREE.Vector3()
  const end = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const handPosition = new THREE.Vector3()
  const handRotation = new THREE.Quaternion()
  let previous = ''
  let previousProgress = 0
  let pulseUntil = 0
  function drawCup(
    visual: CupVisual,
    craft: CraftState,
    iced: boolean,
    extraction: number,
    shotExtraction: number | null,
  ) {
    const shellMaterial = visual.shell.material as THREE.MeshStandardMaterial
    shellMaterial.transparent = iced
    shellMaterial.opacity = iced ? 0.28 : 1
    shellMaterial.depthWrite = !iced
    shellMaterial.color.set(iced ? '#e4f0e9' : '#f9efdc')
    visual.sleeve.visible = !iced
    visual.lid.visible = craft.lidded
    const c = craft.contents
    const amounts = craft.mixed
      ? [0, c.coffee + c.sauce + extraction, c.water, c.milk, c.foam]
      : [c.sauce, c.coffee + extraction, c.water, c.milk, c.foam]
    let height = 0.008
    visual.layers.forEach(({ mesh, vertices }, i) => {
      const value = Math.min(amounts[i] * 0.265, Math.max(0, 0.276 - height))
      mesh.visible = value > 0.0001
      const positions = mesh.geometry.getAttribute('position')
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const localY = vertices[vertex * 3 + 1]
        const radius = 0.076 + ((height + value * (localY + 0.5)) / 0.285) * 0.034
        positions.setXYZ(vertex, vertices[vertex * 3] * radius, localY, vertices[vertex * 3 + 2] * radius)
      }
      positions.needsUpdate = true
      mesh.scale.y = Math.max(0.0001, value)
      mesh.position.y = height + value / 2
      height += value
    })
    visual.ice.visible = iced && c.ice > 0
    visual.ice.count = Math.min(8, Math.ceil((c.ice / 0.1) * 8))
    visual.drizzle.visible = c.drizzle > 0 && !craft.lidded
    visual.drizzle.position.y = Math.max(0.055, height + 0.003)
    const count = visual.drizzle.geometry.index?.count ?? 0
    visual.drizzle.geometry.setDrawRange(0, Math.floor((count * Math.min(1, c.drizzle)) / 3) * 3)
    visual.powder.count = Math.min(32, Math.ceil(c.powder * 32))
    visual.powder.visible = c.powder > 0 && !craft.lidded
    for (let i = 0; i < visual.powder.count; i++) {
      matrix.position.set(Math.sin(i * 5.1) * 0.046, height + 0.004, Math.cos(i * 2.3) * 0.047)
      matrix.rotation.set(i, i * 0.4, 0)
      matrix.updateMatrix()
      visual.powder.setMatrixAt(i, matrix.matrix)
    }
    visual.powder.instanceMatrix.needsUpdate = true
    visual.shot.visible =
      (craft.shotReady || shotExtraction !== null) && !craft.shotTransferred && craft.tool !== 'shot-glass'
    const shotFill =
      shotExtraction ?? (craft.shotReady && !craft.shotTransferred ? 1 - Math.min(1, c.coffee / 0.13) : 1)
    visual.shotLiquid.scale.y = Math.max(0.001, shotFill)
    visual.shotLiquid.position.y = 0.003 + 0.0285 * shotFill
  }
  return {
    update(state: GameState, active: boolean, now: number) {
      const cup = state.cup
      bench.root.visible = !!cup && cup.craft.location !== 'hand'
      held.root.visible = !!cup && cup.craft.location === 'hand'
      for (const model of tools.values()) model.visible = false
      stream.visible = false
      pump.visible = false
      receivingPitcher.visible = false
      for (const cloud of vapor) cloud.visible = false
      if (!cup) return
      const c = cup.craft
      const op = operationFor(cup.recipe, cup.step, c)
      const job = state.jobs.find((item) => item.kind === 'craft-machine' && item.cupId === cup.id)
      const extraction =
        job?.machine === 'espresso' && cup.recipe !== 'glazed-iced'
          ? Math.min(1, (state.time - job.startedAt) / (job.endsAt - job.startedAt)) * 0.13
          : 0
      const shotExtraction =
        job?.machine === 'espresso' && cup.recipe === 'glazed-iced'
          ? Math.min(1, (state.time - job.startedAt) / (job.endsAt - job.startedAt))
          : null
      drawCup(bench, c, cup.recipe !== 'glazed-hot', extraction, shotExtraction)
      drawCup(held, c, cup.recipe !== 'glazed-hot', extraction, shotExtraction)
      held.root.rotation.z = Math.sin(now / 650) * 0.018
      const station = c.location === 'hand' ? null : c.location
      if (station) bench.root.position.fromArray(cupSpot(station))
      const key = `${cup.id}:${op?.id}`
      if (key !== previous) {
        previous = key
        previousProgress = c.progress
      }
      if (c.progress > previousProgress && op && ['pump', 'sprinkle', 'ice', 'lid'].includes(op.kind))
        pulseUntil = now + 280
      previousProgress = c.progress
      const pulse = Math.max(0, (pulseUntil - now) / 280)
      const spot = station ? cupSpot(station) : [0, 0, 0]
      if (station === 'steam' && cup.recipe === 'glazed-hot' && (c.pitcherReserved || c.pitcherMilk > 0)) {
        receivingPitcher.visible = c.tool !== 'pitcher'
        receivingPitcher.position.set(spot[0] - 0.28, spot[1], spot[2])
        pitcherMilk.scale.y = Math.max(0.001, c.pitcherMilk / 200)
        pitcherMilk.position.y = 0.008 + 0.085 * pitcherMilk.scale.y
      }
      if (station === 'sauce' && op?.kind === 'pump') {
        pump.visible = true
        pump.position.set(spot[0] - 0.15, spot[1], spot[2] + 0.05)
        pumpHead.position.y = 0.205 - Math.sin(pulse * Math.PI) * 0.035
      }
      if (c.tool) {
        const model = tools.get(c.tool)!
        model.visible = true
        handPosition.set(0.26, -0.25, -0.58)
        camera.localToWorld(handPosition)
        camera.getWorldQuaternion(handRotation)
        if (station && (active || pulse > 0)) {
          const receiverX = op?.kind === 'steam' ? spot[0] - 0.28 : spot[0]
          model.position.set(receiverX + 0.15, spot[1] + 0.47, spot[2])
          model.rotation.set(0, 0, 0.85 + Math.sin(now / 140) * 0.025)
          if (op?.kind === 'stir') {
            model.position.set(
              spot[0] + Math.sin(now / 120) * 0.04,
              spot[1] + 0.3,
              spot[2] + Math.cos(now / 120) * 0.04,
            )
            model.rotation.z = 0.25
          }
          if (op?.kind === 'sprinkle') {
            model.position.set(spot[0], spot[1] + 0.42 + Math.sin(pulse * Math.PI) * 0.04, spot[2])
            model.rotation.z = Math.PI
          }
        } else {
          model.position.copy(handPosition)
          model.quaternion.copy(handRotation)
        }
      }
      const pouring = station && op && active && ['steam', 'pour', 'drizzle', 'transfer'].includes(op.kind)
      if (station && (pouring || job?.machine === 'espresso' || (op?.kind === 'pump' && pulse > 0))) {
        const x =
          op?.kind === 'steam'
            ? spot[0] - 0.28
            : job?.machine === 'espresso' && cup.recipe === 'glazed-iced'
              ? spot[0] - 0.48
              : spot[0]
        start.set(x + (job ? 0 : 0.09), job ? 1.43 : spot[1] + 0.44, job ? staffFacingZ(-0.68) : spot[2])
        const fillHeight = Math.min(
          0.267,
          Object.values(c.contents)
            .slice(0, 5)
            .reduce((sum, amount) => sum + amount, 0) * 0.265,
        )
        end.set(
          x,
          spot[1] +
            (op?.kind === 'steam' ? 0.1 : cup.recipe === 'glazed-iced' && job ? 0.05 : Math.max(0.025, fillHeight)),
          spot[2] + (job && cup.recipe === 'glazed-iced' ? 0.06 : 0),
        )
        direction.subVectors(end, start)
        stream.position.copy(start).add(end).multiplyScalar(0.5)
        stream.quaternion.setFromUnitVectors(up, direction.clone().normalize())
        const radius = op?.kind === 'drizzle' ? 0.0035 : op?.kind === 'pump' ? 0.006 : 0.008
        stream.scale.set(radius, direction.length(), radius)
        stream.visible = true
        ;(stream.material as THREE.MeshStandardMaterial).color.set(
          job || op?.kind === 'transfer'
            ? '#593624'
            : op?.kind === 'drizzle'
              ? '#452419'
              : op?.kind === 'pump'
                ? '#caa574'
                : op?.content === 'water'
                  ? '#b7ddd6'
                  : op?.content === 'coffee'
                    ? '#593624'
                    : '#f5e7ca',
        )
      }
      if (station && job?.machine === 'steam')
        for (const [i, cloud] of vapor.entries()) {
          cloud.visible = true
          const cycle = (now / 1600 + i / 7) % 1
          cloud.position.set(spot[0] - 0.28 + Math.sin(i + cycle * 3) * 0.04, spot[1] + 0.22 + cycle * 0.22, spot[2])
          cloud.scale.setScalar(0.4 + cycle)
          ;(cloud.material as THREE.MeshBasicMaterial).opacity = 0.16 * (1 - cycle)
        }
    },
  }
}
