import * as THREE from 'three'
import { RECIPES, recipeFor } from '../../content/recipes'
import { STATIONS, type StationId, staffFacingZ } from '../../content/stations'
import { CUP_DIMENSIONS } from '../../shared/visuals/cup-visual'
import { createPumpVisual } from '../../shared/visuals/pump-visual'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_OUTLET } from '../cold-brew/equipment'
import { cupService, cupSize } from '../inventory/cups'
import { BLENDER_JAR_SPOT } from '../preparation/blender'
import { productionTargetFill } from '../production/runtime'
import {
  createDrinkVisual,
  createProductionEffects,
  createProductionToolVisual,
  createWorkVesselVisual,
  heldTool,
  operationColor,
  operationVessel,
  positionProductionTool,
  projectVessel,
  workVesselShape,
} from './drink-visual'
import { ESPRESSO_OUTLET, STEAM_PITCHER_SPOT } from './espresso-machine'
import { operationFor } from './rules'
import { WATER_OUTLET } from './station-equipment'

export function createCraftVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const bench = createDrinkVisual(scene)
  const held = createDrinkVisual(camera)
  held.root.position.set(0.28, -0.43, -0.62)
  held.root.scale.setScalar(0.85)
  const tools = createProductionToolVisual(scene)
  const effects = createProductionEffects(scene)
  const auxiliaries = new Map<string, ReturnType<typeof createWorkVesselVisual>>()
  const pumps = new Map<'glaze' | 'classic', ReturnType<typeof createPumpVisual>>()
  const positions = new Map<string, THREE.Vector3>()
  const start = new THREE.Vector3()
  const end = new THREE.Vector3()
  const spot = new THREE.Vector3()
  let previous = ''
  let previousProgress = 0
  let pulseUntil = 0

  return {
    update(state: GameState, active: boolean, now: number) {
      const cup = state.cup
      bench.root.visible = !!cup && cup.craft.location !== 'hand'
      held.root.visible = !!cup && cup.craft.location === 'hand'
      for (const model of auxiliaries.values()) model.root.visible = false
      for (const pump of pumps.values()) pump.root.visible = false
      positions.clear()
      effects.update(null, end, '#dfc29b', null, now)

      if (!cup) {
        tools.update(null, '#dfc29b')
        return
      }

      const craft = cup.craft
      const definition = recipeFor(cup.recipe, cupSize(craft.kind), cupService(craft.kind), craft.customizations)
      const step = operationFor(cup.recipe, craft) ?? undefined
      const operation = step?.operation
      const servingId = definition.vesselId
      const currentVessel = operation ? operationVessel(operation) : servingId
      const serving = projectVessel(craft, servingId, RECIPES[cup.recipe].color)
      const job = state.jobs.find((item) => item.kind === 'production' && item.cupId === cup.id)
      const station = craft.location === 'hand' ? null : craft.location
      const view = craft.location === 'hand' ? held : bench
      const amount = operation && 'amount' in operation ? operation.amount : undefined
      const targetFill =
        step &&
        currentVessel === servingId &&
        amount &&
        ['line', 'mark', 'fill-volume', 'rim-gap'].includes(amount.kind)
          ? productionTargetFill(craft, step, servingId)
          : undefined
      view.update({ kind: craft.kind, lidded: craft.lidded, vessel: serving, targetFill })
      held.root.rotation.z = Math.sin(now / 650) * 0.018

      if (station) {
        bench.root.position.fromArray(cupSpot(station))

        if (station === 'espresso' && currentVessel !== servingId) {
          bench.root.position.x += 0.48
          bench.root.position.z -= 0.06
          bench.root.position.y = 1.075
        }

        positions.set(servingId, bench.root.position)
        const ids = new Set(
          Object.entries(craft.vessels)
            .filter(([, vessel]) => vessel.fill > 0)
            .map(([id]) => id),
        )
        if (currentVessel) {
          ids.add(currentVessel)
        }
        if (operation && 'from' in operation) {
          ids.add(operation.from)
        }
        ids.delete(servingId)
        let index = 0

        for (const id of ids) {
          const shape = workVesselShape(id, definition.steps)
          const key = `${shape}:${index++}`
          let model = auxiliaries.get(key)

          if (!model) {
            model = createWorkVesselVisual(scene, shape)
            auxiliaries.set(key, model)
          }

          model.root.visible = craft.tool !== `vessel:${id}`
          model.root.position.copy(bench.root.position).add(new THREE.Vector3(-0.32 * index, 0, 0.04))
          if (station === 'espresso' && currentVessel === id) {
            model.root.position.set(ESPRESSO_OUTLET[0], 1.11, ESPRESSO_OUTLET[2])
          }
          if (station === 'steam' && currentVessel === id) {
            model.root.position.fromArray(STEAM_PITCHER_SPOT)
          }
          const blending = job?.equipmentId === 'blender' && currentVessel === id
          const atBlender =
            station === 'prep' && shape === 'blender' && currentVessel === id && step?.equipmentId === 'blender'
          if (atBlender) {
            model.root.position.fromArray(BLENDER_JAR_SPOT)
          }
          model.root.rotation.z = blending ? Math.sin(now / 25) * 0.007 : 0
          positions.set(id, model.root.position)
          model.update(projectVessel(craft, id, RECIPES[cup.recipe].color), {
            lidded: atBlender || operation?.action === 'cover',
            stirring:
              blending || (active && currentVessel === id && (step?.kind === 'mix' || operation?.action === 'shake')),
            now,
          })
        }
      }

      const key = `${cup.id}:${step?.id}`

      if (key !== previous) {
        previous = key
        previousProgress = craft.progress
      }

      if (craft.progress > previousProgress && step && !['pour', 'mix'].includes(step.kind)) {
        pulseUntil = now + 330
      }
      previousProgress = craft.progress
      const pulse = Math.max(0, (pulseUntil - now) / 330)
      spot.copy(positions.get(currentVessel ?? servingId) ?? bench.root.position)
      const color = operationColor(craft, operation, serving.color)
      const descriptor = heldTool(craft, step, definition.steps)
      const tool = tools.update(descriptor, color, cupSize(craft.kind))
      if (tool) {
        positionProductionTool(tool, camera, step, spot, !!station && active, station ? pulse : 0, now)
      }
      const pumped =
        operation?.action === 'add' &&
        (operation.amount.kind === 'count' || operation.amount.kind === 'count-range') &&
        operation.amount.unit === 'pump'
      let pump: ReturnType<typeof createPumpVisual> | undefined

      if (station && pumped && (operation.materialId === 'classic' || operation.materialId === 'glaze')) {
        const kind = operation.materialId
        pump = pumps.get(kind)

        if (!pump) {
          pump = createPumpVisual(scene, kind)
          pumps.set(kind, pump)
        }

        pump.root.visible = true
        pump.root.rotation.y = Math.PI
        pump.root.position.set(spot.x, spot.y, spot.z + 0.36)
        pump.head.position.y = 0.445 - Math.sin(pulse * Math.PI) * 0.035
      }

      const extraction = job?.equipmentId === 'espresso-machine' || (operation?.action === 'espresso' && pulse > 0)
      const dispensing = job?.equipmentId === 'hot-water-dispenser'
      const pouring = active && step?.kind === 'pour'
      const adding = pulse > 0 && operation?.action === 'add'

      if (station && (pouring || adding || extraction || dispensing)) {
        start.set(spot.x + 0.09, spot.y + 0.44, spot.z)
        if (extraction) {
          start.fromArray(ESPRESSO_OUTLET)
        }
        if (dispensing || (station === 'water' && !step?.tool)) {
          start.fromArray(WATER_OUTLET)
        }
        if (station === 'brew' && !step?.tool) {
          start.fromArray(COLD_BREW_OUTLET)
        }
        if (pump) {
          pump.outlet.getWorldPosition(start)
        }
        const height =
          currentVessel === servingId
            ? Math.max(0.025, serving.fill * (CUP_DIMENSIONS[craft.kind].height - 0.02))
            : Math.max(0.04, (craft.vessels[currentVessel ?? '']?.fill ?? 0) * 0.25)
        end.set(spot.x, spot.y + height, spot.z)
        effects.update(start, end, color, null, now)
      }

      const steaming = job?.equipmentId === 'steam-wand' || (operation?.action === 'steam' && pulse > 0)
      if (station && steaming) {
        effects.update(null, end, color, spot, now)
      }
    },
  }
}

export function cupSpot(station: StationId): [number, number, number] {
  if (station === 'pickup') {
    return [6.1, 1.1, -1.48]
  }
  if (station === 'espresso') {
    return [ESPRESSO_OUTLET[0], 1.11, ESPRESSO_OUTLET[2]]
  }
  if (station === 'steam') {
    return [STEAM_PITCHER_SPOT[0] + 0.28, STEAM_PITCHER_SPOT[1], STEAM_PITCHER_SPOT[2]]
  }
  if (station === 'brew') {
    return [COLD_BREW_OUTLET[0], 1.102, COLD_BREW_OUTLET[2]]
  }
  if (station === 'water') {
    return [WATER_OUTLET[0], 1.071, WATER_OUTLET[2]]
  }
  if (station === 'prep') {
    return [-1.95, 1.105, -4.95]
  }
  return [STATIONS[station].x, 1.075, staffFacingZ(-0.62)]
}
