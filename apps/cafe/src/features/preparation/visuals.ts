import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { materialColor } from '../../shared/visuals/material-color'
import { createPumpVisual, operationPump } from '../../shared/visuals/pump-visual'
import type { GameState } from '../../simulation/state'
import {
  createProductionEffects,
  createProductionToolVisual,
  createWorkVesselVisual,
  heldTool,
  operationColor,
  operationVessel,
  positionProductionTool,
  projectVessel,
  workVesselShape,
} from '../crafting/drink-visual'
import { dispensingFill } from '../inventory/batches'
import { PREP_BLENDER_JAR_SPOT } from './blender'
import { PREPARATIONS, preparationStep } from './rules'

export function createPreparationVisuals(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const vessels = new Map<string, ReturnType<typeof createWorkVesselVisual>>()
  const tools = createProductionToolVisual(scene)
  const effects = createProductionEffects(scene)
  const pumps = new Map<string, ReturnType<typeof createPumpVisual>>()
  const positions = new Map<string, THREE.Vector3>()
  const spot = new THREE.Vector3()
  const from = new THREE.Vector3()
  const to = new THREE.Vector3()
  let key = ''
  let previous = 0
  let pulseUntil = 0

  return {
    update(state: GameState, active: boolean, now: number) {
      const prep = state.preparation
      const batch = state.batches.find((batch) => batch.id === prep?.batchId)
      for (const vessel of vessels.values()) vessel.root.visible = false
      for (const pump of pumps.values()) pump.root.visible = false
      effects.update(null, to, '#dfc29b', null, now)
      positions.clear()

      if (!prep || batch?.location === 'hand') {
        tools.update(null, '#dfc29b')
        return
      }

      const definition = PREPARATIONS[prep.recipe]
      const step = preparationStep(prep)
      const operation = step?.operation
      const fallback = definition.color ?? materialColor(definition.output.materialId)
      const populated = Object.entries(prep.vessels)
        .filter(([, vessel]) => vessel.fill > 0)
        .map(([id]) => id)
      const vesselId = operation
        ? operationVessel(operation)
        : ([...definition.steps]
            .reverse()
            .map((entry) => operationVessel(entry.operation))
            .find((id) => id && populated.includes(id)) ?? populated.at(-1))
      const ids = new Set(populated)
      if (vesselId) {
        ids.add(vesselId)
      }
      if (operation && 'from' in operation) {
        ids.add(operation.from)
      }
      const job = state.jobs.find((item) => item.kind === 'production' && item.preparationId === prep.id)
      const nextKey = `${prep.id}:${step?.id}`

      if (nextKey !== key) {
        key = nextKey
        previous = prep.progress
      }

      if (prep.progress > previous && step && !['pour', 'mix'].includes(step.kind)) {
        pulseUntil = now + 330
      }
      previous = prep.progress
      const pulse = Math.max(0, (pulseUntil - now) / 330)
      let index = 0

      for (const id of ids) {
        const shape = workVesselShape(id, definition.steps)
        const modelKey = `${shape}:${index++}`
        let model = vessels.get(modelKey)

        if (!model) {
          model = createWorkVesselVisual(scene, shape)
          vessels.set(modelKey, model)
        }

        model.root.visible = prep.tool !== `vessel:${id}`
        model.root.position.fromArray(PREP_SPOT)
        if (id !== vesselId) {
          model.root.position.x += index * 0.32
        }
        const atBlender = id === vesselId && step?.equipmentId === 'blender' && shape === 'blender'
        const blending = atBlender && (!!job || pulse > 0)
        if (atBlender) {
          model.root.position.fromArray(PREP_BLENDER_JAR_SPOT)
        }
        model.root.rotation.z = blending ? Math.sin(now / 25) * 0.007 : 0
        positions.set(id, model.root.position)
        const current = id === vesselId
        model.update(projectVessel(prep, id, fallback), {
          lidded:
            atBlender ||
            (shape === 'whipper' && (!operation || !['add', 'mix'].includes(operation.action))) ||
            (current && (operation?.action === 'cover' || operation?.action === 'shake')),
          stirring: blending || (current && active && step?.kind === 'mix'),
          labelled: !!batch?.labelled && current,
          now,
        })
      }

      spot.copy(positions.get(vesselId ?? '') ?? from.fromArray(PREP_SPOT))
      const color = operationColor(prep, operation, fallback)
      const surfaceHeight = Math.max(0.025, (prep.vessels[vesselId ?? '']?.fill ?? 0) * 0.3)
      const descriptor = heldTool(prep, step, definition.steps)
      const tool = tools.update(descriptor, color)
      if (tool) {
        positionProductionTool(tool, camera, step, spot, active, pulse, now, surfaceHeight)
      }
      const spec = operationPump(operation)
      let pump: ReturnType<typeof createPumpVisual> | undefined

      if (spec) {
        pump = pumps.get(spec.key)

        if (!pump) {
          pump = createPumpVisual(scene, spec)
          pumps.set(spec.key, pump)
        }

        if (tool) tool.root.visible = false
        pump.root.visible = true
        pump.place(spot, vesselId === 'whipping-canister' ? 0.05 : 0.14)
        pump.update(Math.sin(pulse * Math.PI), dispensingFill(state, spec.materialId, 'backroom'))
      }

      const pouring = (active && step?.kind === 'pour') || (pulse > 0 && operation?.action === 'add')

      if (pouring) {
        from.set(spot.x + 0.1, spot.y + 0.45, spot.z)
        if (pump) {
          pump.outlet.getWorldPosition(from)
        }
        if (tool?.dispenser) tool.dispenser.outlet.getWorldPosition(from)
        to.set(spot.x, spot.y + surfaceHeight, spot.z)
        if (pump) to.z = from.z
      }

      const steaming = job?.equipmentId === 'steam-wand' || (operation?.action === 'steam' && pulse > 0)
      effects.update(pouring ? from : null, to, color, steaming ? spot : null, now)
    },
  }
}

export const PREP_SPOT: [number, number, number] = [STATIONS.prep.x + 0.4, 1.105, STATIONS.prep.z + 0.15]
