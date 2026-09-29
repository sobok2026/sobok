import * as THREE from 'three'
import { recipeCatalog } from '../../content/catalog'
import { RECIPES } from '../../content/recipes'
import { isEspressoStation, isSteamStation, STATIONS, type StationId } from '../../content/stations'
import { vesselProfile } from '../../content/stock-amounts'
import { CUP_DIMENSIONS, cupFillY } from '../../shared/visuals/cup-visual'
import { createPumpVisual, operationPump } from '../../shared/visuals/pump-visual'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_OUTLET } from '../cold-brew/equipment'
import { URN_HOT_OUTLET } from '../drip-coffee/equipment'
import { dispensingFill } from '../inventory/batches'
import { BLENDER_JAR_SPOT } from '../preparation/blender'
import { orderSticker } from '../service/order-sticker'
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
  type WorkVesselShape,
  workVesselShape,
} from './drink-visual'
import { espressoOutlet, steamPitcherSpot } from './espresso-machine'
import { cupRecipe, operationFor, stepVessels, vesselPlace } from './rules'
import { WATER_OUTLET } from './station-equipment'

function vesselSpot(station: StationId, shape: WorkVesselShape, index: number): THREE.Vector3 {
  if (isSteamStation(station) && shape === 'pitcher') {
    return new THREE.Vector3(...steamPitcherSpot(station))
  }
  if (isEspressoStation(station) && shape === 'shot') {
    const outlet = espressoOutlet(station)
    return new THREE.Vector3(outlet[0], 1.11, outlet[2])
  }
  if (station === 'blender' && shape === 'blender') {
    return new THREE.Vector3(...BLENDER_JAR_SPOT)
  }
  const [x, y, z] = cupSpot(station)
  return new THREE.Vector3(x - 0.32 * (index + 1), y, z + 0.04)
}

function cupSticker(state: GameState) {
  const cup = state.cup
  const line = state.sale?.lines.find((item) => item.id === cup?.orderLineId)
  if (!cup?.craft.sticker || !line) {
    return null
  }
  return orderSticker(state, line)
}

export function createCraftVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const bench = createDrinkVisual(scene, -1)
  const held = createDrinkVisual(camera, 1)
  held.root.position.set(0.28, -0.43, -0.62)
  held.root.scale.setScalar(0.85)
  const tools = createProductionToolVisual(scene)
  const effects = createProductionEffects(scene)
  const auxiliaries = new Map<string, ReturnType<typeof createWorkVesselVisual>>()
  const carried = new Map<string, ReturnType<typeof createWorkVesselVisual>>()
  const pumps = new Map<string, ReturnType<typeof createPumpVisual>>()
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
      for (const model of carried.values()) model.root.visible = false
      for (const pump of pumps.values()) pump.root.visible = false
      positions.clear()
      effects.update(null, end, '#dfc29b', null, now)

      if (!cup) {
        tools.update(null, '#dfc29b')
        return
      }

      const craft = cup.craft
      const definition = cupRecipe(cup)
      const step = operationFor(cup.recipe, craft) ?? undefined
      const operation = step?.operation
      const servingId = definition.vesselId
      const currentVessel = operation ? operationVessel(operation) : servingId
      const color = RECIPES[cup.recipe].color
      const serving = projectVessel(craft, servingId, color)
      const station = step?.station ?? null
      const jobs = state.jobs.filter((item) => item.kind === 'production' && item.cupId === cup.id)
      const view = craft.location === 'hand' ? held : bench
      view.update({ kind: craft.kind, lidded: craft.lidded, vessel: serving, sticker: cupSticker(state) })
      held.root.rotation.z = Math.sin(now / 650) * 0.018

      if (craft.location !== 'hand') {
        bench.root.position.fromArray(cupSpot(craft.location))
        positions.set(servingId, bench.root.position)
      }

      const helpers = new Set(Object.keys(craft.places))
      if (step) {
        for (const id of stepVessels(step, servingId)) if (id !== servingId) helpers.add(id)
      }
      const context = definition.steps[0]?.stockContext
      let index = 0

      for (const id of helpers) {
        const place = vesselPlace(cup, id, step)
        if (!place) {
          continue
        }
        const shape = workVesselShape(id, definition.steps)
        const marks =
          context && id.startsWith('steam-pitcher')
            ? vesselProfile(recipeCatalog, id, context).marks.map((mark) => mark.fill)
            : []
        const blending = jobs.some((job) => job.vessel === id && job.equipmentId === 'blender')
        const options = {
          lidded:
            (place === 'blender' && shape === 'blender') || (currentVessel === id && operation?.action === 'cover'),
          stirring:
            blending || (active && currentVessel === id && (step?.kind === 'mix' || operation?.action === 'shake')),
          marks,
          now,
        }

        if (place === 'hand') {
          let model = carried.get(shape)
          if (!model) {
            model = createWorkVesselVisual(camera, shape)
            model.root.position.set(0.3, -0.5, -0.66)
            model.root.scale.setScalar(0.8)
            carried.set(shape, model)
          }
          model.root.visible = true
          model.update(projectVessel(craft, id, color), options)
          continue
        }

        const key = `${shape}:${index}`
        let model = auxiliaries.get(key)
        if (!model) {
          model = createWorkVesselVisual(scene, shape)
          auxiliaries.set(key, model)
        }
        model.root.visible = craft.tool !== `vessel:${id}`
        model.root.position.copy(vesselSpot(place, shape, index))
        model.root.rotation.z = blending ? Math.sin(now / 25) * 0.007 : 0
        positions.set(id, model.root.position)
        model.update(projectVessel(craft, id, color), options)
        index++
      }

      if (
        craft.location !== 'hand' &&
        isEspressoStation(craft.location) &&
        currentVessel !== servingId &&
        positions.has(currentVessel ?? '')
      ) {
        bench.root.position.x += 0.48
        bench.root.position.z -= 0.06
        bench.root.position.y = 1.075
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
      const liquidColor = operationColor(craft, operation, serving.color)
      const surfaceHeight =
        currentVessel === servingId
          ? Math.max(0.025, cupFillY(craft.kind, serving.fill))
          : Math.max(0.04, (craft.vessels[currentVessel ?? '']?.fill ?? 0) * 0.25)
      const descriptor = heldTool(craft, step, definition.steps)
      const tool = tools.update(descriptor, liquidColor, craft.size)
      if (tool) {
        positionProductionTool(tool, camera, step, spot, !!station && active, station ? pulse : 0, now, surfaceHeight)
      }
      const spec = operationPump(operation)
      let pump: ReturnType<typeof createPumpVisual> | undefined

      if (station && vesselPlace(cup, currentVessel ?? servingId, step) === station && spec) {
        pump = pumps.get(spec.key)

        if (!pump) {
          pump = createPumpVisual(scene, spec)
          pumps.set(spec.key, pump)
        }

        if (tool) tool.root.visible = false
        pump.root.visible = true
        pump.place(spot, currentVessel === servingId ? CUP_DIMENSIONS[craft.kind].top : 0.14)
        pump.update(Math.sin(pulse * Math.PI), dispensingFill(state, spec.materialId))
      }

      const extraction = operation?.action === 'espresso' && pulse > 0
      const dispensing = jobs.some((job) => job.equipmentId === 'hot-water-dispenser')
      const pouring = active && step?.kind === 'pour'
      const adding = pulse > 0 && operation?.action === 'add'

      if (station && (pouring || adding || extraction || dispensing)) {
        start.set(spot.x + 0.09, spot.y + 0.44, spot.z)
        if (extraction) {
          start.fromArray(espressoOutlet(craft.espressoStation))
        }
        if (dispensing || (station === 'water' && !step?.tool)) {
          start.fromArray(WATER_OUTLET)
        }
        if (station === 'brew' && !step?.tool) {
          start.fromArray(COLD_BREW_OUTLET)
        }
        if (station === 'urn' && !step?.tool) start.fromArray(URN_HOT_OUTLET)
        if (pump) {
          pump.outlet.getWorldPosition(start)
        }
        if (tool?.dispenser) tool.dispenser.outlet.getWorldPosition(start)
        end.set(spot.x, spot.y + surfaceHeight, spot.z)
        if (pump) end.z = start.z
        effects.update(start, end, liquidColor, null, now)
      }

      // The wand keeps steaming after the player walks away, so the steam follows the pitcher, not the input.
      const steaming = jobs.find((job) => job.equipmentId === 'steam-wand' && job.vessel)
      const steamed = steaming?.vessel && positions.get(steaming.vessel)
      if (steamed) {
        effects.update(null, end, liquidColor, steamed, now)
      }
    },
  }
}

export function cupSpot(station: StationId): [number, number, number] {
  if (station === 'urn') return [URN_HOT_OUTLET[0], 1.099, URN_HOT_OUTLET[2]]
  if (station === 'pickup') {
    return [STATIONS.pickup.x, 1.1, STATIONS.pickup.z - 0.08]
  }
  if (isEspressoStation(station)) {
    const outlet = espressoOutlet(station)
    return [outlet[0], 1.11, outlet[2]]
  }
  if (isSteamStation(station)) {
    const spot = steamPitcherSpot(station)
    return [spot[0] + 0.28, spot[1], spot[2]]
  }
  if (station === 'brew') {
    return [COLD_BREW_OUTLET[0], 1.102, COLD_BREW_OUTLET[2]]
  }
  if (station === 'water') {
    return [WATER_OUTLET[0], 1.071, WATER_OUTLET[2]]
  }
  if (station === 'prep' || station === 'blender') {
    return [STATIONS[station].x + 0.75, 1.105, STATIONS[station].z + 0.15]
  }
  return [STATIONS[station].x, 1.075, STATIONS[station].z - 0.08]
}
