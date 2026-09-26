import * as THREE from 'three'
import { recipeCatalog } from '../../content/catalog'
import { recipeFor } from '../../content/recipes'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { operationFor } from '../crafting/rules'
import { cupService, cupSize } from '../inventory/cups'
import { PREPARATIONS, preparationStep } from './rules'

export const BLENDER_JAR_SPOT: [number, number, number] = [-2.9, 1.355, -5.12]

export function createBlenderJar() {
  const root = new THREE.Group()
  const clear = material({
    color: '#e4edf0',
    transparent: true,
    opacity: 0.19,
    roughness: 0.16,
    metalness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const edge = material({ color: '#c7d9df', transparent: true, opacity: 0.58, roughness: 0.22, depthWrite: false })
  const black = material({ color: '#22272a', roughness: 0.7 })
  const steel = material({ color: '#c6cccf', metalness: 0.95, roughness: 0.2 })
  const shell = mesh(root, new THREE.CylinderGeometry(0.173, 0.127, 0.33, 4, 1, true), clear, [0, 0.18, 0])
  shell.rotation.y = Math.PI / 4
  box(root, [0.178, 0.027, 0.178], [0, 0.02, 0], clear)
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      tube(
        root,
        [
          [x * 0.09, 0.03, z * 0.09],
          [x * 0.108, 0.2, z * 0.108],
          [x * 0.122, 0.345, z * 0.122],
        ],
        0.003,
        edge,
      )
  const rim = tube(
    root,
    [
      [-0.122, 0.345, 0.122],
      [0.122, 0.345, 0.122],
      [0.122, 0.345, -0.122],
      [-0.122, 0.345, -0.122],
      [-0.122, 0.345, 0.122],
    ],
    0.005,
    edge,
  )
  rim.castShadow = false
  tube(
    root,
    [
      [0.117, 0.3, 0],
      [0.19, 0.28, 0],
      [0.19, 0.12, 0],
      [0.1, 0.1, 0],
    ],
    0.014,
    clear,
  )
  const blade = box(root, [0.14, 0.006, 0.025], [0, 0.036, 0], steel, 0.002)
  blade.rotation.y = 0.5
  const crossBlade = box(root, [0.1, 0.006, 0.022], [0, 0.04, 0], steel, 0.002)
  crossBlade.rotation.y = -0.9
  const liquidMaterial = material({ color: '#eee3ce', roughness: 0.28 })
  const liquid = mesh(root, new THREE.CylinderGeometry(0.149, 0.122, 1, 4), liquidMaterial)
  liquid.rotation.y = Math.PI / 4
  liquid.visible = false
  const lid = new THREE.Group()
  root.add(lid)
  box(lid, [0.255, 0.028, 0.255], [0, 0.354, 0], black, 0.018)
  box(lid, [0.2, 0.028, 0.2], [0, 0.376, 0], black, 0.017)
  box(lid, [0.065, 0.023, 0.065], [0, 0.4, 0], black)
  const graduations = panel(root, 0.088, 0.245, [0, 0.193, 0.11], (ctx, w, h) => {
    ctx.strokeStyle = '#35474c'
    ctx.fillStyle = '#35474c'
    ctx.lineWidth = 4
    ctx.font = canvasFont(w * 0.14)
    ctx.textAlign = 'right'
    for (let i = 0; i < 12; i++) {
      const y = h * (0.09 + i * 0.076)
      ctx.beginPath()
      ctx.moveTo(w * (i % 2 ? 0.4 : 0.2), y)
      ctx.lineTo(w * 0.84, y)
      ctx.stroke()
      if (!(i % 2)) ctx.fillText(String(48 - i * 2), w * 0.16, y + h * 0.013)
    }
  })
  graduations.rotation.x = 0.1
  const label = panel(root, 0.095, 0.048, [-0.02, 0.1, 0.12], (ctx, w, h) => {
    ctx.fillStyle = '#f4f0e3'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#354a42'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.33, 600)
    ctx.fillText('PREPARED', w / 2, h * 0.44)
    ctx.font = canvasFont(h * 0.24)
    ctx.fillText('소복다방', w / 2, h * 0.81)
  })
  label.visible = false
  const swirl = mesh(
    root,
    new THREE.TorusGeometry(0.065, 0.007, 6, 24, Math.PI * 1.65),
    material({ color: '#faf2df', roughness: 0.45 }),
  )
  swirl.rotation.x = Math.PI / 2
  swirl.visible = false
  return { root, lid, liquid, liquidMaterial, label, swirl }
}

export function createBlender(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Quiet One inspired enclosed blender'
  root.position.set(-2.9, 1.095, -5.12)
  scene.add(root)
  const black = material({ color: '#24292c', roughness: 0.54, metalness: 0.08 })
  const rubber = material({ color: '#101416', roughness: 0.86 })
  const silver = material({ color: '#909ca3', metalness: 0.7, roughness: 0.31 })
  const clear = material({
    color: '#dce8ed',
    transparent: true,
    opacity: 0.1,
    roughness: 0.11,
    metalness: 0.05,
    depthWrite: false,
  })
  const edge = material({ color: '#acbfc8', transparent: true, opacity: 0.52, roughness: 0.17, depthWrite: false })
  box(root, [0.43, 0.25, 0.43], [0, 0.125, 0], black, 0.024)
  for (const x of [-0.16, 0.16]) for (const z of [-0.15, 0.15]) box(root, [0.07, 0.035, 0.08], [x, 0.017, z], rubber)
  box(root, [0.35, 0.075, 0.02], [0, 0.071, 0.212], rubber)
  instances(
    root,
    new THREE.BoxGeometry(0.23, 0.004, 0.003),
    rubber,
    Array.from({ length: 10 }, (_, i) => [0, 0.07 + i * 0.012, -0.216]),
  )
  box(root, [0.405, 0.015, 0.395], [0, 0.256, 0], rubber)
  mesh(root, new THREE.CylinderGeometry(0.06, 0.06, 0.022, 24), silver, [0, 0.266, 0])
  const control = new THREE.Group()
  root.add(control)
  control.position.set(0, 0.177, 0.214)
  control.rotation.x = -0.11
  box(control, [0.345, 0.12, 0.015], [0, 0, 0], rubber)
  const drawControls = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    blending = false,
    program: string | null = null,
  ) => {
    ctx.fillStyle = '#41484c'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#d3d8d9'
    ctx.font = canvasFont(h * 0.11, 600)
    ctx.textAlign = 'center'
    ctx.fillText('BLENDING STATION', w / 2, h * 0.16)
    ctx.fillStyle = '#b7c9ca'
    ctx.fillRect(w * 0.3, h * 0.22, w * 0.4, h * 0.26)
    ctx.fillStyle = '#2e4248'
    ctx.font = `${h * 0.13}px monospace`
    const setting = program
      ? recipeCatalog.equipment.get('blender')?.programs.find((entry) => entry.id === program)
      : undefined
    const displayProgram = program && /^\d+$/.test(program) ? program.padStart(2, '0') : setting?.name
    ctx.fillText(
      `${blending ? 'BLENDING' : 'READY'}${displayProgram ? ` ${displayProgram}` : ''}`,
      w / 2,
      h * 0.405,
      w * 0.37,
    )
    for (let i = 0; i < 6; i++) {
      const x = w * (0.195 + i * 0.104)
      ctx.fillStyle = blending && String(i + 1) === program ? '#39785d' : '#11181c'
      ctx.strokeStyle = '#c4c9ca'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(x - w * 0.039, h * 0.66, w * 0.079, h * 0.25, 9)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#e7edef'
      ctx.font = canvasFont(h * 0.19, 600)
      ctx.fillText(String(i + 1), x, h * 0.85)
    }
    ctx.fillStyle = '#dce2e3'
    ctx.font = canvasFont(h * 0.16)
    ctx.fillText('▲', w * 0.13, h * 0.39)
    ctx.fillText('▼', w * 0.13, h * 0.59)
    ctx.fillText('Ⅱ', w * 0.85, h * 0.4)
  }
  const controlFace = panel(control, 0.326, 0.104, [0, 0, 0.009], drawControls, true)
  let previousDisplay = ''
  const indicatorMaterial = material({ color: '#b8d6bd', emissive: '#77b391', emissiveIntensity: 0.5, roughness: 0.5 })
  mesh(control, new THREE.SphereGeometry(0.005, 8, 6), indicatorMaterial, [0.126, -0.002, 0.011])
  const idleJar = createBlenderJar()
  idleJar.root.position.y = 0.26
  root.add(idleJar.root)
  // The enclosure pivots about the upper rear hinge, clearing the removable pitcher.
  const cover = new THREE.Group()
  cover.position.set(0, 0.72, -0.195)
  root.add(cover)
  box(cover, [0.405, 0.45, 0.004], [0, -0.22, 0.396], clear, 0.002)
  for (const x of [-0.202, 0.202]) box(cover, [0.004, 0.45, 0.39], [x, -0.22, 0.195], clear, 0.002)
  box(cover, [0.408, 0.004, 0.398], [0, 0.006, 0.198], clear, 0.002)
  for (const x of [-0.201, 0.201])
    tube(
      cover,
      [
        [x, -0.44, 0.396],
        [x, -0.02, 0.396],
        [x, 0.004, 0.375],
        [x, 0.004, 0.008],
      ],
      0.006,
      edge,
    )
  box(cover, [0.4, 0.009, 0.014], [0, -0.446, 0.394], edge, 0.004)
  box(cover, [0.3, 0.038, 0.022], [0, -0.354, 0.41], silver, 0.015)
  box(root, [0.412, 0.45, 0.005], [0, 0.497, -0.203], clear, 0.002)
  for (const x of [-0.2, 0.2]) box(root, [0.025, 0.46, 0.026], [x, 0.49, -0.193], black)
  return {
    update(state: GameState) {
      const prep = state.preparation
      const cup = state.cup
      const prepStep = prep ? preparationStep(prep) : undefined
      const drinkStep = cup ? operationFor(cup.recipe, cup.craft) : null
      const job = state.jobs.find((item) => item.kind === 'production' && item.equipmentId === 'blender')
      const step =
        job?.preparationId && job.preparationId === prep?.id
          ? prepStep
          : job?.cupId && job.cupId === cup?.id
            ? drinkStep
            : prepStep?.equipmentId === 'blender'
              ? prepStep
              : drinkStep?.equipmentId === 'blender'
                ? drinkStep
                : undefined
      const program =
        step?.operation.action === 'run-machine' && step.operation.equipmentId === 'blender'
          ? step.operation.program
          : null
      const prepJar =
        !!prep &&
        !state.batches.some((batch) => batch.id === prep.batchId && batch.location === 'hand') &&
        PREPARATIONS[prep.recipe].steps.some((entry) => entry.equipmentId === 'blender')
      const drinkJar =
        !!cup &&
        recipeFor(cup.recipe, cupSize(cup.craft.kind), cupService(cup.craft.kind), cup.craft.customizations).steps.some(
          (entry) => entry.equipmentId === 'blender',
        )
      const jarInUse = prepJar || drinkJar
      const blending = !!job
      idleJar.root.visible = !jarInUse
      cover.rotation.x = jarInUse && !blending ? -1.05 : 0
      indicatorMaterial.emissiveIntensity = blending ? 1.1 : 0.25
      const display = `${blending}:${program}`
      if (display !== previousDisplay) {
        const texture = (controlFace.material as THREE.MeshStandardMaterial).map!
        const canvas = texture.image as HTMLCanvasElement
        drawControls(canvas.getContext('2d')!, canvas.width, canvas.height, blending, program)
        texture.needsUpdate = true
        previousDisplay = display
      }
    },
  }
}
