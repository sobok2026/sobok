import * as THREE from 'three'
import type { Ingredient } from '../../content/ingredients'
import type { ResolvedOperation } from '../../content/recipe-plan'
import { cupScale } from '../../shared/visuals/cup-profiles'
import { CUP_DIMENSIONS, createCupBody, cupRadius } from '../../shared/visuals/cup-visual'
import { createIceScoop, type IceScoopSize } from '../../shared/visuals/ice-scoop'
import { materialColor, materialGroup } from '../../shared/visuals/material-color'
import { createWhippingDispenser } from '../../shared/visuals/whipping-dispenser'
import { workBox as box, workCylinder as cylinder, workMaterial as standard } from '../../shared/visuals/work-geometry'
import type { CupKind } from '../inventory/cups'
import { createBlenderJar } from '../preparation/blender'
import type { ProductionState, ProductionTool, WorkStep } from '../production/workflow'
import type { OrderSticker } from '../service/order-sticker'
import { createOrderStickerTexture } from '../service/order-sticker-texture'

export type VesselVisualState = {
  fill: number
  color: string
  layers: { fill: number; color: string }[]
  ice: boolean
  powder: boolean
  foam: boolean
}

export type DrinkVisualState = {
  kind: CupKind
  lidded: boolean
  vessel: VesselVisualState
  sticker: OrderSticker | null
}

export function projectVessel(session: ProductionState, vesselId: string, fallbackColor: string): VesselVisualState {
  const vessel = session.vessels[vesselId]
  const groups = new Map<Ingredient['visualGroup'], string>()

  for (const [id, amount] of Object.entries(vessel?.materials ?? {})) {
    if (amount <= 0) {
      continue
    }
    const group = materialGroup(id)
    groups.set(group, materialColor(id, fallbackColor))
  }

  const blendedWithIce = vessel?.processes.some((process) => process.startsWith('machine:blender/')) ?? false
  const mixed =
    blendedWithIce ||
    (vessel?.processes.some(
      (process) =>
        ['mix', 'shake', 'swirl', 'muddle'].includes(process) || process.startsWith('machine:cold-foam-blender/'),
    ) ??
      false)
  const liquidColors = [...groups.entries()]
    .filter(([group]) => group !== 'ice' && group !== 'foam')
    .map(([, color]) => color)
  const blended = new THREE.Color(liquidColors[0] ?? fallbackColor)

  liquidColors.slice(1).forEach((color, index) => {
    blended.lerp(new THREE.Color(color), 1 / (index + 2))
  })

  const color = `#${blended.getHexString()}`
  const fill = Math.min(1, Math.max(0, vessel?.fill ?? 0))
  const foamFill = groups.has('foam') ? Math.min(fill, 0.12) : 0
  const layeredColors = liquidColors.length ? liquidColors : [fallbackColor]
  const colors = mixed ? [color] : layeredColors
  // Equal color bands communicate ingredient presence; stock units are not volume ratios.
  const layers = colors.map((value) => ({ color: value, fill: (fill - foamFill) / colors.length }))
  if (foamFill > 0) {
    layers.push({ color: groups.get('foam')!, fill: foamFill })
  }

  return {
    fill,
    color,
    layers,
    ice: groups.has('ice') && !blendedWithIce,
    powder: groups.has('powder') && !mixed,
    foam: groups.has('foam'),
  }
}

export function operationColor(
  session: ProductionState,
  operation: WorkStep['operation'] | undefined,
  fallback: string,
): string {
  if (operation && 'materialId' in operation && operation.materialId) {
    return materialColor(operation.materialId)
  }
  if (operation && 'from' in operation) {
    return projectVessel(session, operation.from, fallback).color
  }
  return fallback
}

export function heldTool(session: ProductionState, step: WorkStep | null | undefined, steps: WorkStep[]) {
  if (!session.tool) {
    return null
  }
  if (step?.tool?.id === session.tool) {
    return step.tool
  }
  return steps.find((item) => item.tool?.id === session.tool)?.tool ?? null
}

export function operationVessel(operation: ResolvedOperation): string | null {
  if ('into' in operation) {
    return operation.into
  }
  if ('vessel' in operation) {
    return operation.vessel
  }
  if ('from' in operation) {
    return operation.from
  }
  if (operation.action === 'attach') return operation.toId
  return null
}

export type WorkVesselShape = 'pitcher' | 'shot' | 'blender' | 'whipper' | 'jar'

export function workVesselShape(id: string, steps: WorkStep[]): WorkVesselShape {
  if (id === 'whipping-canister') return 'whipper'
  if (id === 'shallow-jar') return 'jar'
  if (
    steps.some(
      ({ operation }) =>
        operation.action === 'run-machine' && operation.equipmentId === 'blender' && operation.vessel === id,
    )
  ) {
    return 'blender'
  }
  if (steps.some(({ operation }) => operation.action === 'espresso' && operation.into === id)) {
    return 'shot'
  }
  return 'pitcher'
}

/** A printed order sticker on the side of the cup that faces the player: +1 toward the camera, -1 away. */
function createSticker(root: THREE.Object3D, facing: 1 | -1) {
  const texture = createOrderStickerTexture()
  const geometry = new THREE.PlaneGeometry(1, 1, 20, 16)
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture.map, transparent: true, depthWrite: false, toneMapped: false }),
  )
  mesh.rotation.y = facing > 0 ? 0 : Math.PI
  mesh.renderOrder = 2
  root.add(mesh)
  let previousKind: CupKind | null = null
  let previousAspect = 0

  return (kind: CupKind, sticker: OrderSticker | null) => {
    mesh.visible = !!sticker
    if (!sticker) return
    const aspect = texture.update(sticker)
    if (kind === previousKind && aspect === previousAspect) return
    previousKind = kind
    previousAspect = aspect
    const { floor, height } = CUP_DIMENSIONS[kind]
    const y = floor + (height - floor) * 0.5
    const labelHeight = Math.min((height - floor) * 0.82, (cupRadius(kind, y) * 1.45) / aspect)
    const width = labelHeight * aspect
    const positions = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')

    for (let vertex = 0; vertex < positions.count; vertex++) {
      const rowY = y + (uv.getY(vertex) - 0.5) * labelHeight
      const radius = cupRadius(kind, rowY) + 0.003
      const angle = ((uv.getX(vertex) - 0.5) * width) / radius
      positions.setXYZ(vertex, Math.sin(angle) * radius, rowY, Math.cos(angle) * radius)
    }

    positions.needsUpdate = true
    geometry.computeBoundingSphere()
  }
}

export function createDrinkVisual(parent: THREE.Object3D, facing: 1 | -1 = 1) {
  const root = new THREE.Group()
  parent.add(root)
  const bodies = new Map<CupKind, ReturnType<typeof createCupBody>>()
  const updateSticker = createSticker(root, facing)
  const layers = Array.from({ length: 9 }, () => {
    const mesh = cylinder(root, 1, 1, 1, standard('#dfc29b'))
    return { mesh, vertices: new Float32Array(mesh.geometry.getAttribute('position').array), height: -1, fill: -1 }
  })
  const matrix = new THREE.Object3D()
  const ice = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.04, 0.033, 0.04),
    new THREE.MeshStandardMaterial({ color: '#deeeeb', transparent: true, opacity: 0.75, roughness: 0.22 }),
    8,
  )
  root.add(ice)
  const powder = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0032, 0), standard('#a56d36'), 32)
  root.add(powder)
  let previousKind: CupKind | null = null

  function update(view: DrinkVisualState) {
    if (!bodies.has(view.kind)) {
      bodies.set(view.kind, createCupBody(root, view.kind, true))
    }

    for (const [kind, body] of bodies) {
      body.root.visible = kind === view.kind
      body.lid.visible = !body.reusable && view.lidded
    }

    const kindChanged = previousKind !== view.kind
    previousKind = view.kind
    const scale = cupScale(view.kind)
    updateSticker(view.kind, view.sticker)

    const { floor, height: rim } = CUP_DIMENSIONS[view.kind]
    let height = floor + 0.008

    layers.forEach((layer, index) => {
      const band = view.vessel.layers[index]
      const value = Math.min((band?.fill ?? 0) * (rim - floor - 0.02), Math.max(0, rim - 0.008 - height))
      layer.mesh.visible = value > 0.0001
      if (band) {
        ;(layer.mesh.material as THREE.MeshStandardMaterial).color.set(band.color)
      }

      if (kindChanged || layer.height !== height || layer.fill !== value) {
        const positions = layer.mesh.geometry.getAttribute('position')

        for (let vertex = 0; vertex < positions.count; vertex++) {
          const y = layer.vertices[vertex * 3 + 1]
          const radius = cupRadius(view.kind, height + value * (y + 0.5)) - 0.003
          positions.setXYZ(vertex, layer.vertices[vertex * 3] * radius, y, layer.vertices[vertex * 3 + 2] * radius)
        }

        positions.needsUpdate = true
        layer.mesh.scale.y = Math.max(0.0001, value)
        layer.mesh.position.y = height + value / 2
        layer.height = height
        layer.fill = value
      }

      height += value
    })

    ice.visible = view.vessel.ice && view.vessel.fill > 0
    ice.count = 8

    for (let i = 0; i < ice.count; i++) {
      matrix.position.set(
        Math.sin(i * 2.4) * 0.055 * scale,
        Math.max(0.03 * scale, height - 0.026 * scale + (i % 3) * 0.012 * scale),
        Math.cos(i * 2.4) * 0.055 * scale,
      )
      matrix.rotation.set(i * 0.3, i, i * 0.4)
      matrix.scale.setScalar(scale)
      matrix.updateMatrix()
      ice.setMatrixAt(i, matrix.matrix)
    }

    ice.instanceMatrix.needsUpdate = true
    powder.visible = view.vessel.powder && !view.lidded && view.vessel.fill > 0

    for (let i = 0; i < powder.count; i++) {
      matrix.position.set(Math.sin(i * 5.1) * 0.046 * scale, height + 0.004, Math.cos(i * 2.3) * 0.047 * scale)
      matrix.rotation.set(i, i * 0.4, 0)
      matrix.scale.setScalar(scale)
      matrix.updateMatrix()
      powder.setMatrixAt(i, matrix.matrix)
    }

    powder.instanceMatrix.needsUpdate = true
  }

  return { root, update }
}

type WorkVesselOptions = { lidded?: boolean; stirring?: boolean; labelled?: boolean; marks?: number[]; now: number }

export function createWorkVesselVisual(parent: THREE.Object3D, shape: WorkVesselShape) {
  if (shape === 'whipper') {
    const dispenser = createWhippingDispenser(parent)

    return {
      root: dispenser.root,
      height: dispenser.height,
      update(view: VesselVisualState, options: WorkVesselOptions) {
        dispenser.update(view.fill, view.color, options.lidded)
      },
    }
  }

  const blender = shape === 'blender' ? createBlenderJar() : null
  const root = blender?.root ?? new THREE.Group()
  parent.add(root)
  const [height, radius] = {
    shot: [0.085, 0.045],
    jar: [0.15, 0.12],
    pitcher: [0.34, 0.14],
    blender: [0.34, 0.14],
  }[shape]
  const cream = standard('#eee6cd')
  const steel = standard('#afbcb2', 0.6)

  if (!blender) {
    cylinder(
      root,
      radius,
      radius * 0.8,
      height,
      new THREE.MeshStandardMaterial({
        color: '#d6e9df',
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: THREE.DoubleSide,
        roughness: 0.3,
      }),
      height / 2,
      true,
    )
    cylinder(root, radius * 0.8, radius * 0.8, 0.006, cream, 0.003)

    if (shape === 'pitcher') {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.011, 8, 20), steel)
      handle.rotation.y = Math.PI / 2
      handle.position.set(radius + 0.015, height * 0.55, 0)
      root.add(handle)
    }
  }

  const liquid = blender?.liquid ?? cylinder(root, radius * 0.9, radius * 0.78, 1, standard('#dfc29b'))
  const lid = blender?.lid ?? cylinder(root, radius + 0.005, radius + 0.005, 0.02, standard('#446d55'), height + 0.01)
  const swirl =
    blender?.swirl ?? new THREE.Mesh(new THREE.TorusGeometry(radius * 0.55, 0.006, 8, 32, Math.PI * 1.5), cream)

  if (!blender) {
    swirl.rotation.x = Math.PI / 2
    root.add(swirl)
  }

  const label = blender?.label ?? box(root, radius * 0.85, height * 0.2, 0.005, cream, 0, height * 0.45, radius)
  const bottom = blender ? 0.032 : 0.007
  const etched = standard('#76817b')
  const ticks: THREE.Mesh[] = []
  let etchedFills = ''

  function etch(fills: number[]) {
    const key = fills.join('|')
    if (key === etchedFills) {
      return
    }
    etchedFills = key
    for (const tick of ticks.splice(0)) {
      root.remove(tick)
      tick.geometry.dispose()
    }
    for (const fill of fills) {
      const wall = radius * (0.8 + 0.2 * fill) + 0.001
      for (const side of [1, -1]) {
        const tick = box(root, 0.03, 0.0016, 0.001, etched, 0, bottom + fill * (height - 0.04), side * wall)
        ticks.push(tick)
      }
    }
  }

  function update(view: VesselVisualState, options: WorkVesselOptions) {
    etch(options.marks ?? [])
    const liquidHeight = Math.max(0.001, view.fill * (height - 0.04))
    liquid.visible = view.fill > 0
    liquid.scale.y = liquidHeight
    liquid.position.y = bottom + liquidHeight / 2
    ;(liquid.material as THREE.MeshStandardMaterial).color.set(view.color)
    lid.visible = !!options.lidded
    label.visible = !!options.labelled
    swirl.visible = !!options.stirring && view.fill > 0
    swirl.position.y = bottom + liquidHeight + 0.006
    swirl.rotation.z = options.now / 100
  }

  return { root, height, update }
}

type ProductionToolVisual = {
  root: THREE.Group
  dispenser?: ReturnType<typeof createWhippingDispenser>
}

export function createProductionToolVisual(parent: THREE.Object3D) {
  const tools = new Map<ProductionTool['appearance'], { root: THREE.Group; material: THREE.MeshStandardMaterial }>()
  let dispenser: ReturnType<typeof createWhippingDispenser> | undefined
  const iceScoops = new Map<IceScoopSize, THREE.Group>()
  const scoopLabels: Record<string, IceScoopSize> = {
    'equipment:ice-scoop-tall': 'tall',
    'equipment:ice-scoop-12oz': 'tall',
    'equipment:ice-scoop-grande': 'grande',
    'equipment:ice-scoop-venti': 'venti',
  }

  function model(appearance: ProductionTool['appearance']) {
    const cached = tools.get(appearance)
    if (cached) {
      return cached
    }
    const root = new THREE.Group()
    parent.add(root)
    const material = standard('#dfc29b')
    const steel = standard('#adbbb2', 0.65)
    const cream = standard('#f8edcf')

    switch (appearance) {
      case 'bottle':
        cylinder(root, 0.052, 0.047, 0.21, material)
        cylinder(root, 0.02, 0.025, 0.035, cream, 0.12)
        break
      case 'pitcher': {
        cylinder(root, 0.087, 0.06, 0.19, steel, 0, true)
        cylinder(root, 0.079, 0.055, 0.1, material, -0.027)
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20), steel)
        handle.rotation.y = Math.PI / 2
        handle.position.x = 0.09
        root.add(handle)
        break
      }
      case 'scoop':
        box(root, 0.07, 0.04, 0.1, steel, 0, 0, -0.03)
        box(root, 0.014, 0.012, 0.15, steel, 0, 0, 0.085)
        box(root, 0.055, 0.012, 0.075, material, 0, 0.024, -0.03)
        break
      case 'stirrer':
        cylinder(root, 0.006, 0.006, 0.27, steel)
        box(root, 0.026, 0.045, 0.008, cream, 0, -0.12)
        break
      case 'shaker':
        cylinder(root, 0.061, 0.046, 0.23, material)
        cylinder(root, 0.062, 0.059, 0.025, steel, 0.127)
        break
      case 'pack':
        box(root, 0.13, 0.19, 0.045, material)
        box(root, 0.134, 0.009, 0.047, cream, 0, 0.09)
        break
      case 'lid':
        cylinder(root, 0.119, 0.117, 0.018, cream)
        break
    }

    const value = { root, material }
    tools.set(appearance, value)
    return value
  }

  return {
    update(tool: ProductionTool | null, color: string, servingSize = 'grande'): ProductionToolVisual | null {
      for (const cached of tools.values()) cached.root.visible = false
      for (const scoop of iceScoops.values()) scoop.visible = false
      if (dispenser) dispenser.root.visible = false
      if (!tool) {
        return null
      }

      if (
        tool.id === 'vessel:whipping-canister' ||
        tool.id === 'equipment:whipping-head' ||
        (tool.id.startsWith('material:') && tool.id.endsWith('whipped-cream'))
      ) {
        dispenser ??= createWhippingDispenser(parent)
        dispenser.root.visible = true
        dispenser.update(0, color)
        return { root: dispenser.root, dispenser }
      }

      if (tool.appearance === 'scoop' && (tool.id === 'equipment:ice-scoop' || scoopLabels[tool.id])) {
        const size =
          scoopLabels[tool.id] ?? (servingSize === 'tall' || servingSize === 'grande' ? servingSize : 'venti')
        let scoop = iceScoops.get(size)

        if (!scoop) {
          scoop = createIceScoop(parent, size)
          iceScoops.set(size, scoop)
        }

        scoop.visible = true
        return { root: scoop }
      }

      const selected = model(tool.appearance)
      selected.root.visible = true
      selected.material.color.set(color)
      return { root: selected.root }
    },
  }
}

export function positionProductionTool(
  visual: ProductionToolVisual,
  camera: THREE.PerspectiveCamera,
  step: WorkStep | undefined,
  spot: THREE.Vector3,
  active: boolean,
  pulse: number,
  now: number,
  surfaceHeight = 0.3,
) {
  const model = visual.root
  if (!active && pulse <= 0) {
    model.position.set(0.26, visual.dispenser ? -0.46 : -0.25, -0.58)
    camera.localToWorld(model.position)
    camera.getWorldQuaternion(model.quaternion)
    if (visual.dispenser) model.rotateY(Math.PI / 2)
    return
  }

  model.position.set(spot.x + 0.15, spot.y + 0.47, spot.z)
  model.rotation.set(0, 0, 0.85)

  if (visual.dispenser && step?.operation.action === 'add') {
    model.rotation.set(Math.PI, Math.PI / 2, -0.15)
    model.position.set(0, 0, 0)
    const nozzle = visual.dispenser.outlet.getWorldPosition(new THREE.Vector3())
    model.position.set(spot.x - nozzle.x, spot.y + surfaceHeight + 0.035 - nozzle.y, spot.z - nozzle.z)
    visual.dispenser.update(0, '#f4ecdc', true, 1)
    return
  }

  if (step?.kind === 'mix') {
    model.position.set(spot.x + Math.sin(now / 120) * 0.04, spot.y + 0.26, spot.z + Math.cos(now / 120) * 0.04)
    model.rotation.z = 0.25
  }

  if (step?.operation.action === 'shake' || step?.operation.action === 'swirl') {
    model.position.set(spot.x + 0.12, spot.y + 0.42 + Math.sin(pulse * Math.PI * 4 + now / 100) * 0.06, spot.z)
    model.rotation.z = 0.35 + Math.sin(pulse * Math.PI * 4 + now / 100) * 0.22
  }
}

export function createProductionEffects(parent: THREE.Object3D) {
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), standard('#e7d1a4'))
  parent.add(stream)
  const vapor = Array.from({ length: 7 }, () => {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#fff9e7', transparent: true, opacity: 0.1, depthWrite: false }),
    )
    parent.add(cloud)
    return cloud
  })
  const direction = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  return {
    update(from: THREE.Vector3 | null, to: THREE.Vector3, color: string, steamAt: THREE.Vector3 | null, now: number) {
      stream.visible = from !== null

      if (from) {
        direction.subVectors(to, from)
        stream.position.copy(from).add(to).multiplyScalar(0.5)
        stream.quaternion.setFromUnitVectors(up, direction.clone().normalize())
        stream.scale.set(0.008, direction.length(), 0.008)
        ;(stream.material as THREE.MeshStandardMaterial).color.set(color)
      }

      for (const [index, cloud] of vapor.entries()) {
        cloud.visible = steamAt !== null
        if (!steamAt) {
          continue
        }
        const cycle = (now / 1600 + index / vapor.length) % 1
        cloud.position.set(steamAt.x + Math.sin(index + cycle * 3) * 0.04, steamAt.y + 0.22 + cycle * 0.22, steamAt.z)
        cloud.scale.setScalar(0.4 + cycle)
        ;(cloud.material as THREE.MeshBasicMaterial).opacity = 0.16 * (1 - cycle)
      }
    },
  }
}
