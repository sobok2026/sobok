import * as THREE from 'three'
import { RECIPES } from '../../content/recipes'
import type { StationId } from '../../content/stations'
import { staffFacingZ } from '../../content/stations'
import { CUP_DIMENSIONS } from '../../shared/visuals/cup-visual'
import { addVesselLabel } from '../../shared/visuals/vessel-label'
import {
  workBox as block,
  workCylinder as cylinder,
  workMaterial as standard,
} from '../../shared/visuals/work-geometry'
import type { GameState } from '../../simulation/state'
import { createDrinkVisual } from './drink-visual'
import { type CraftTool, operationFor } from './rules'

export function createCraftVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const cream = standard('#f8edcf')
  const steel = standard('#adbbb2', 0.65)
  const chocolate = standard('#48281c')
  const bench = createDrinkVisual(scene)
  const held = createDrinkVisual(camera)
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
  addVesselLabel(carton, '우유', '#527f66', 0.075, 0.046, -0.005, 0.042)
  let shotToolLiquid: THREE.Mesh | null = null
  for (const id of ['pitcher', 'foam-pitcher', 'shot-glass'] as const) {
    const root = tool(id)
    const scale = id === 'shot-glass' ? 0.62 : 1
    const glass = id === 'shot-glass'
    cylinder(
      root,
      0.087,
      0.06,
      0.19,
      glass
        ? new THREE.MeshStandardMaterial({
            color: '#d9eae2',
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        : id === 'pitcher'
          ? steel
          : cream,
      0,
      true,
    )
    if (glass) shotToolLiquid = cylinder(root, 0.075, 0.055, 0.12, chocolate, -0.025)
    else {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20), steel)
      handle.rotation.y = Math.PI / 2
      handle.position.x = 0.09
      root.add(handle)
      addVesselLabel(
        root,
        id === 'pitcher' ? '스팀' : '폼',
        id === 'pitcher' ? '#667e89' : '#527f66',
        0.09,
        0.052,
        -0.015,
        0.076,
      )
    }
    root.scale.setScalar(scale)
  }
  const stirrer = tool('stirrer')
  cylinder(stirrer, 0.006, 0.006, 0.26, standard('#b8a17a'))
  const bottle = tool('mocha-bottle')
  cylinder(bottle, 0.038, 0.042, 0.17, chocolate)
  cylinder(bottle, 0.006, 0.03, 0.045, cream, 0.106)
  addVesselLabel(bottle, '바모카', '#77513b', 0.062, 0.043, -0.015, 0.041)
  const teaBottle = tool('tea-bottle')
  cylinder(teaBottle, 0.065, 0.062, 0.24, standard('#9b8056'))
  cylinder(teaBottle, 0.067, 0.067, 0.025, standard('#45644d'), 0.133)
  addVesselLabel(teaBottle, '호지차', '#756342', 0.09, 0.056, -0.008, 0.065)
  const shaker = tool('shaker')
  cylinder(shaker, 0.038, 0.035, 0.105, standard('#c69b59'))
  cylinder(shaker, 0.04, 0.04, 0.025, steel, 0.065)
  addVesselLabel(shaker, '파우더', '#886628', 0.058, 0.036, 0, 0.038)
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
  const vapor = Array.from({ length: 7 }, () => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#fff9e7', transparent: true, opacity: 0.1, depthWrite: false }),
    )
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
      if (shotToolLiquid) {
        const fill = Math.max(0.001, 1 - Math.min(1, c.contents.coffee / 0.13))
        shotToolLiquid.scale.y = fill
        shotToolLiquid.position.y = -0.085 + 0.06 * fill
      }
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
      ;(c.location === 'hand' ? held : bench).update(
        c,
        RECIPES[cup.recipe].variant === 'ICED',
        c.location !== 'hand' ? op?.targetFill : undefined,
        extraction,
        shotExtraction,
      )
      held.root.rotation.z = Math.sin(now / 650) * 0.018
      const station = c.location === 'hand' ? null : c.location
      if (station) bench.root.position.fromArray(cupSpot(station))
      const key = `${cup.id}:${op?.id}`
      if (key !== previous) {
        previous = key
        previousProgress = c.progress
      }
      if (c.progress > previousProgress && op && ['pump', 'sprinkle', 'ice', 'lid', 'shake'].includes(op.kind))
        pulseUntil = now + 280
      previousProgress = c.progress
      const pulse = Math.max(0, (pulseUntil - now) / 280)
      const spot = station ? cupSpot(station) : [0, 0, 0]
      if (station === 'steam' && RECIPES[cup.recipe].variant === 'HOT' && (c.pitcherReserved || c.pitcherMilk > 0)) {
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
          if (op?.kind === 'shake') {
            model.position.set(spot[0] + 0.12, spot[1] + 0.42 + Math.sin(pulse * Math.PI * 4) * 0.06, spot[2])
            model.rotation.z = 0.35 + Math.sin(pulse * Math.PI * 4) * 0.22
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
          CUP_DIMENSIONS[c.kind].height - 0.018,
          (c.contents.sauce +
            c.contents.coffee +
            c.contents.water +
            c.contents.milk +
            c.contents.tea +
            c.contents.foam +
            c.contents.ice) *
            (CUP_DIMENSIONS[c.kind].height - 0.02),
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
                    : op?.content === 'tea'
                      ? '#967345'
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

export function cupSpot(station: StationId): [number, number, number] {
  if (station === 'pickup') return [6.1, 1.1, -1.48]
  const x: Partial<Record<StationId, number>> = {
    espresso: -2.27,
    steam: -1.05,
    brew: 0,
    water: 1.1,
    ice: 2.1,
    sauce: 3.1,
    mix: 4.1,
    topping: 5.1,
  }
  return [x[station] ?? 0, station === 'espresso' ? 1.115 : 1.075, staffFacingZ(-0.62)]
}
