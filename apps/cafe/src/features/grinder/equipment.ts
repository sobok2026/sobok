import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { dripTemperatures } from '../drip-coffee/rules'
import { preparationStation } from '../preparation/rules'
import type { GrindSetting } from './rules'

export const GRINDER_CATCH_SPOT: [number, number, number] = [STATIONS.grinder.x, 1.14, STATIONS.grinder.z + 0.21]
export const GRINDER_HOPPER_SPOT: [number, number, number] = [STATIONS.grinder.x, 2.04, STATIONS.grinder.z]
const DIAL_ANGLES: Record<GrindSetting, number> = { espresso: 0.94, drip: 0, coarse: -0.94 }

// BUNN's G3 HD product photograph: opaque hopper, sloped lid, circular selector, bag clamp and cleaning lever.
// Enlarged to match the game's utensils; no source photographs are bundled.
export function createGrinder(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const root = new THREE.Group()
  root.name = 'BUNN G3 bulk coffee grinder'
  root.position.set(STATIONS.grinder.x, 1.1, STATIONS.grinder.z)
  scene.add(root)
  const black = material({ color: '#252629', roughness: 0.6, metalness: 0.18 })
  const rubber = material({ color: '#111214', roughness: 0.82 })
  const steel = material({ color: '#c5c6c2', metalness: 0.94, roughness: 0.32 })
  const coffee = material({ color: '#513223', roughness: 0.94 })
  const paper = material({ color: '#bd9b6d', roughness: 0.92 })
  box(root, [0.29, 0.034, 0.5], [0, 0.022, 0.012], black, 0.005)
  box(root, [0.267, 0.46, 0.12], [0, 0.265, -0.177], black, 0.005)
  box(root, [0.272, 0.485, 0.405], [0, 0.697, -0.035], black, 0.005)
  box(root, [0.274, 0.006, 0.408], [0, 0.458, -0.035], rubber, 0.001)
  box(root, [0.28, 0.021, 0.415], [0, 0.946, -0.035], rubber, 0.005)
  const lid = box(root, [0.277, 0.028, 0.407], [0, 0.967, -0.045], black, 0.008)
  lid.rotation.x = 0.045
  box(root, [0.242, 0.022, 0.024], [0, 0.948, 0.165], rubber, 0.004)

  panel(root, 0.253, 0.251, [0, 0.803, 0.169], (ctx, w, h) => {
    ctx.fillStyle = '#9c413d'
    ctx.fillRect(w * 0.04, h * 0.08, w * 0.92, h * 0.01)
    ctx.fillRect(w * 0.04, h * 0.96, w * 0.92, h * 0.008)
    ctx.fillStyle = '#edeae0'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.09, 700)
    ctx.fillText('BUNN', w / 2, h * 0.21)
    ctx.font = canvasFont(h * 0.065, 400)
    ctx.fillText('Coffee Mill', w / 2, h * 0.31)
    ctx.font = canvasFont(h * 0.035, 500)
    for (const [i, text] of ['SELECT GRIND', 'PLACE BAG UNDER CHUTE', 'START · GRIND · CLEAN'].entries()) {
      ctx.fillText(text, w / 2, h * (0.47 + i * 0.06))
    }
    ctx.font = canvasFont(h * 0.035, 600)
    ctx.fillText('START', w * 0.86, h * 0.72)
  })
  box(root, [0.028, 0.063, 0.009], [0.094, 0.728, 0.174], rubber, 0.002)
  box(root, [0.018, 0.04, 0.011], [0.094, 0.73, 0.183], black, 0.002).rotation.x = -0.15

  const bezel = mesh(root, new THREE.CylinderGeometry(0.107, 0.107, 0.012, 64), steel, [0, 0.54, 0.176])
  bezel.rotation.x = Math.PI / 2
  panel(root, 0.208, 0.208, [0, 0.54, 0.184], (ctx, w, h) => {
    ctx.fillStyle = '#e1e0d7'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, w * 0.49, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#343632'
    ctx.lineWidth = 2
    for (let i = 0; i <= 24; i++) {
      const angle = -Math.PI * 0.84 + (i / 24) * Math.PI * 0.68
      const x = Math.cos(angle),
        y = Math.sin(angle)
      ctx.beginPath()
      ctx.moveTo(w * (0.5 + x * 0.4), h * (0.5 + y * 0.4))
      ctx.lineTo(w * (0.5 + x * 0.455), h * (0.5 + y * 0.455))
      ctx.stroke()
    }
    ctx.fillStyle = '#282a27'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.037, 700)
    ctx.fillText('ESPRESSO', w * 0.18, h * 0.33)
    ctx.fillText('DRIP', w * 0.5, h * 0.15)
    ctx.fillText('COARSE', w * 0.82, h * 0.33)
  })
  const dial = new THREE.Group()
  dial.position.set(0, 0.54, 0.203)
  root.add(dial)
  const knob = mesh(dial, new THREE.CylinderGeometry(0.073, 0.079, 0.041, 48), rubber)
  knob.rotation.x = Math.PI / 2
  box(dial, [0.012, 0.052, 0.018], [0, 0.056, 0.018], black, 0.003)
  box(dial, [0.004, 0.02, 0.002], [0, 0.075, 0.029], steel, 0.001)
  const screw = mesh(dial, new THREE.CylinderGeometry(0.012, 0.012, 0.004, 24), steel, [0, 0, 0.024])
  screw.rotation.x = Math.PI / 2

  box(root, [0.078, 0.162, 0.068], [0, 0.343, 0.169], steel, 0.004)
  box(root, [0.059, 0.05, 0.038], [0, 0.239, 0.18], steel, 0.007)
  box(root, [0.046, 0.003, 0.032], [0, 0.213, 0.18], rubber, 0.001)
  box(root, [0.058, 0.008, 0.019], [0, 0.37, 0.21], rubber, 0.001)
  box(root, [0.006, 0.073, 0.013], [0, 0.255, 0.215], rubber, 0.002)
  box(root, [0.016, 0.006, 0.06], [0.049, 0.415, 0.164], steel, 0.001)
  box(root, [0.006, 0.045, 0.007], [0.054, 0.395, 0.192], steel, 0.001)
  panel(root, 0.072, 0.013, [0, 0.404, 0.204], (ctx, w, h) => {
    ctx.fillStyle = '#232523'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#deded6'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.49, 500)
    ctx.fillText('CLEANING LEVER', w / 2, h * 0.68)
  })
  box(root, [0.25, 0.004, 0.278], [0, 0.043, 0.08], rubber, 0.001)
  instances(
    root,
    new THREE.BoxGeometry(0.24, 0.003, 0.003),
    black,
    Array.from({ length: 24 }, (_, i) => [0, 0.046, -0.05 + i * 0.011]),
  )
  instances(
    root,
    new THREE.BoxGeometry(0.003, 0.003, 0.27),
    black,
    Array.from({ length: 20 }, (_, i) => [-0.113 + i * 0.012, 0.047, 0.08]),
  )

  const grounds = mesh(root, new THREE.CylinderGeometry(0.008, 0.013, 0.13, 10), coffee, [0, 0.145, 0.181])
  const coldBag = box(
    scene,
    [0.22, 0.31, 0.15],
    [STATIONS.grinder.x + 0.38, 1.255, STATIONS.grinder.z + 0.08],
    paper,
    0.007,
  )
  box(coldBag, [0.21, 0.026, 0.08], [0, 0.156, 0], paper, 0.002)
  const jars = dripTemperatures.map((temperature, index) => {
    const jar = new THREE.Group()
    jar.position.set(STATIONS.grinder.x - 0.37 - index * 0.28, 1.1, STATIONS.grinder.z + 0.14)
    scene.add(jar)
    const glass = material({
      color: '#d9dfd5',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    mesh(jar, new THREE.CylinderGeometry(0.102, 0.085, 0.21, 24, 1, true), glass, [0, 0.105, 0])
    const fill = mesh(jar, new THREE.CylinderGeometry(0.095, 0.081, 1, 24), coffee)
    panel(jar, 0.085, 0.04, [0, 0.1, 0.099], (ctx, w, h) => {
      ctx.fillStyle = '#eee5d3'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#403b32'
      ctx.textAlign = 'center'
      ctx.font = canvasFont(h * 0.57, 600)
      ctx.fillText(temperature.toUpperCase(), w / 2, h * 0.71)
    })
    return { temperature, jar, fill, resting: jar.position.clone() }
  })
  const carried = new THREE.Group()
  carried.position.set(0.25, -0.35, -0.65)
  camera.add(carried)
  box(carried, [0.17, 0.21, 0.13], [0, 0.06, 0], paper, 0.012)
  let previous: GameState | null = null
  let pulseUntil = 0
  let dispensing: 'hot' | 'iced' | 'cold' | 'chips' | null = null

  return {
    update(state: GameState, now: number) {
      dial.rotation.z = DIAL_ANGLES[state.grindSetting]
      const prep = state.preparation
      const atGrinder = !!prep && preparationStation(prep) === 'grinder'
      let justGround: typeof dispensing = null

      if (previous) {
        justGround =
          dripTemperatures.find((id) => state.drip[id]?.stage === 'ground' && previous!.drip[id]?.stage === 'grind') ??
          null
        if ((state.coldBrew?.groundBeans ?? 0) > (previous.coldBrew?.groundBeans ?? 0)) justGround = 'cold'
        if (atGrinder && prep.id === previous.preparation?.id && prep.progress > previous.preparation.progress)
          justGround = 'chips'
      }

      if (justGround) {
        dispensing = justGround
        pulseUntil = now + 350
      }

      previous = state
      const pulse = now < pulseUntil
      grounds.visible = pulse
      lid.rotation.x = pulse ? -0.2 : 0.045
      coldBag.visible = state.coldBrew?.stage === 'grind' || state.coldBrew?.stage === 'ground'
      const fillingBag = pulse && dispensing === 'cold'
      coldBag.scale.y = fillingBag ? 0.58 : 1
      coldBag.position.set(
        STATIONS.grinder.x + (fillingBag ? 0 : 0.38),
        fillingBag ? 1.23 : 1.255,
        STATIONS.grinder.z + (fillingBag ? 0.18 : 0.08),
      )
      carried.visible = dripTemperatures.some((id) => state.drip[id]?.stage === 'ground' && state.drip[id]?.tool)

      for (const { temperature, jar, fill, resting } of jars) {
        const brew = state.drip[temperature]
        jar.visible =
          !!brew && ['beans', 'grind', 'ground'].includes(brew.stage) && !(brew.stage === 'ground' && brew.tool)
        jar.scale.y = 0.8
        jar.position.copy(resting)
        if (pulse && dispensing === temperature) jar.position.fromArray(GRINDER_CATCH_SPOT)
        const height = Math.min(0.18, (brew?.beans ?? 0) / 1500)
        fill.visible = height > 0
        fill.scale.y = Math.max(0.001, height)
        fill.position.y = height / 2 + 0.005
      }
    },
  }
}
