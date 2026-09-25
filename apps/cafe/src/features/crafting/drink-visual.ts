import * as THREE from 'three'
import { CUP_DIMENSIONS, createCupBody, cupFillY, cupRadius, cupScale } from '../../shared/visuals/cup-visual'
import { workCylinder as cylinder, workMaterial as standard } from '../../shared/visuals/work-geometry'
import type { CraftState } from '../../simulation/state'
import { type CupKind, cupKinds } from '../inventory/cups'

type CupVisual = {
  root: THREE.Group
  bodies: Map<CupKind, ReturnType<typeof createCupBody>>
  target: THREE.Mesh
  kind: CupKind | null
  layers: { mesh: THREE.Mesh; vertices: Float32Array; height: number; fill: number }[]
  ice: THREE.InstancedMesh
  drizzle: THREE.Mesh
  powder: THREE.InstancedMesh
  powderHeight: number
  powderCount: number
  shot: THREE.Group
  shotLiquid: THREE.Mesh
}
export function createDrinkVisual(parent: THREE.Object3D) {
  const chocolate = standard('#48281c')
  const matrix = new THREE.Object3D()
  const root = new THREE.Group()
  parent.add(root)
  const bodies = new Map(cupKinds.map((kind) => [kind, createCupBody(root, kind, true)]))
  const target = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 5, 48),
    new THREE.MeshBasicMaterial({ color: '#d69629', transparent: true, opacity: 0.95 }),
  )
  target.rotation.x = Math.PI / 2
  target.renderOrder = 2
  root.add(target)
  const colors = ['#cdad74', '#4d2b18', '#e8f0e9', '#dfc29b', '#967345', '#fff2d7']
  const layers = colors.map((color) => {
    const mesh = cylinder(root, 1, 1, 1, standard(color))
    return {
      mesh,
      vertices: new Float32Array(mesh.geometry.getAttribute('position').array),
      height: -1,
      fill: -1,
    }
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
  const visual: CupVisual = {
    root,
    bodies,
    target,
    kind: null,
    layers,
    ice,
    drizzle,
    powder,
    powderHeight: -1,
    powderCount: -1,
    shot,
    shotLiquid,
  }
  function update(
    craft: CraftState,
    iced: boolean,
    targetFill: number | undefined,
    extraction: number,
    shotExtraction: number | null,
    shotVolume: number,
  ) {
    const scale = cupScale(craft.kind)
    const kindChanged = visual.kind !== craft.kind
    visual.kind = craft.kind
    for (const [kind, body] of visual.bodies) {
      body.root.visible = kind === craft.kind
      body.lid.visible = !body.reusable && craft.lidded
    }
    visual.target.visible = targetFill !== undefined && !craft.lidded
    if (targetFill !== undefined) {
      visual.target.position.y = cupFillY(craft.kind, targetFill)
      visual.target.scale.setScalar(cupRadius(craft.kind, visual.target.position.y) + 0.005)
    }
    const c = craft.contents
    ;(visual.layers[4].mesh.material as THREE.MeshStandardMaterial).color.set(
      craft.consumed.matcha ? '#568438' : '#967345',
    )
    const amounts = craft.mixed
      ? [0, c.coffee + c.sauce + extraction, c.water, c.milk, c.tea, c.foam]
      : [c.sauce, c.coffee + extraction, c.water, c.milk, c.tea, c.foam]
    let lastLiquid = 4
    while (lastLiquid >= 0 && amounts[lastLiquid] <= 0) lastLiquid--
    if (lastLiquid >= 0) amounts[lastLiquid] += c.ice
    let height = 0.008
    visual.layers.forEach((layer, i) => {
      const { mesh, vertices } = layer
      const value = Math.min(
        amounts[i] * (CUP_DIMENSIONS[craft.kind].height - 0.02),
        Math.max(0, CUP_DIMENSIONS[craft.kind].height - 0.008 - height),
      )
      mesh.visible = value > 0.0001
      if (kindChanged || layer.height !== height || layer.fill !== value) {
        const positions = mesh.geometry.getAttribute('position')
        for (let vertex = 0; vertex < positions.count; vertex++) {
          const localY = vertices[vertex * 3 + 1]
          const radius = cupRadius(craft.kind, height + value * (localY + 0.5)) - 0.003
          positions.setXYZ(vertex, vertices[vertex * 3] * radius, localY, vertices[vertex * 3 + 2] * radius)
        }
        positions.needsUpdate = true
        mesh.scale.y = Math.max(0.0001, value)
        mesh.position.y = height + value / 2
        layer.height = height
        layer.fill = value
      }
      height += value
    })
    visual.ice.scale.setScalar(scale)
    visual.ice.position.y = CUP_DIMENSIONS[craft.kind].height - 0.285 * scale
    visual.drizzle.scale.setScalar(scale)
    visual.ice.visible = iced && c.ice > 0
    visual.ice.count = Math.min(8, Math.ceil((c.ice / 0.1) * 8))
    visual.drizzle.visible = c.drizzle > 0 && !craft.lidded
    visual.drizzle.position.y = Math.max(0.055, height + 0.003)
    const count = visual.drizzle.geometry.index?.count ?? 0
    visual.drizzle.geometry.setDrawRange(0, Math.floor((count * Math.min(1, c.drizzle)) / 3) * 3)
    visual.powder.count = Math.min(32, Math.ceil(c.powder * 32))
    visual.powder.visible = c.powder > 0 && !craft.lidded
    if (visual.powderHeight !== height || visual.powderCount !== visual.powder.count) {
      for (let i = 0; i < visual.powder.count; i++) {
        matrix.position.set(Math.sin(i * 5.1) * 0.046 * scale, height + 0.004, Math.cos(i * 2.3) * 0.047 * scale)
        matrix.rotation.set(i, i * 0.4, 0)
        matrix.scale.setScalar(scale)
        matrix.updateMatrix()
        visual.powder.setMatrixAt(i, matrix.matrix)
      }
      visual.powder.instanceMatrix.needsUpdate = true
      visual.powderHeight = height
      visual.powderCount = visual.powder.count
    }
    visual.shot.visible =
      (craft.shotReady || shotExtraction !== null) && !craft.shotTransferred && craft.tool !== 'shot-glass'
    const shotFill =
      shotExtraction ?? (craft.shotReady && !craft.shotTransferred ? 1 - Math.min(1, c.coffee / (shotVolume || 1)) : 1)
    visual.shotLiquid.scale.y = Math.max(0.001, shotFill)
    visual.shotLiquid.position.y = 0.003 + 0.0285 * shotFill
  }
  return { root, shot, update }
}
