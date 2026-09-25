import * as THREE from 'three'
import { RECIPES } from '../../content/recipes'
import { CUP_DIMENSIONS, createCupBody } from '../../shared/visuals/cup-visual'
import type { GameState } from '../../simulation/state'
import { cupKindFor, cupKinds } from '../inventory/cups'
import { customerHasCup, customerSitting, customerWalking } from './customer'

export function createCustomerVisuals(scene: THREE.Scene) {
  const root = new THREE.Group()
  scene.add(root)
  const person = new THREE.Group()
  root.add(person)
  const skin = new THREE.MeshStandardMaterial({ color: '#dcb894', roughness: 0.85 })
  const shirt = new THREE.MeshStandardMaterial({ color: '#bc997d', roughness: 0.9 })
  const trousers = new THREE.MeshStandardMaterial({ color: '#4c6253', roughness: 0.9 })
  const dark = new THREE.MeshStandardMaterial({ color: '#403b30', roughness: 0.9 })
  function cylinder(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.93, height, 16), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  cylinder(person, 0.235, 0.64, shirt, 0, 1.11)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 12), skin)
  head.position.set(0, 1.61, 0)
  head.castShadow = true
  person.add(head)
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.194, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.44), dark)
  hair.position.copy(head.position)
  person.add(hair)
  for (const x of [-0.068, 0.068]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), dark)
    eye.position.set(x, 1.625, 0.17)
    person.add(eye)
  }
  const legs = [-0.12, 0.12].map((x) => {
    const hip = new THREE.Group()
    hip.position.set(x, 0.82, 0)
    person.add(hip)
    cylinder(hip, 0.075, 0.32, trousers, 0, -0.16)
    const knee = new THREE.Group()
    knee.position.y = -0.32
    hip.add(knee)
    cylinder(knee, 0.065, 0.45, trousers, 0, -0.225)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.23), dark)
    shoe.position.set(0, -0.45, 0.055)
    knee.add(shoe)
    return { hip, knee }
  })
  const arms = [-0.285, 0.285].map((x) => {
    const shoulder = new THREE.Group()
    shoulder.position.set(x, 1.32, 0)
    person.add(shoulder)
    cylinder(shoulder, 0.065, 0.32, shirt, 0, -0.16)
    cylinder(shoulder, 0.05, 0.22, skin, 0, -0.43)
    return shoulder
  })
  const cup = new THREE.Group()
  person.add(cup)
  cup.scale.setScalar(0.64)
  const bodies = new Map(cupKinds.map((kind) => [kind, createCupBody(cup, kind)]))
  const liquidMaterial = new THREE.MeshStandardMaterial({ color: '#493022', roughness: 0.5 })
  const liquid = cylinder(cup, 0.1, 0.008, liquidMaterial)
  const palette = ['#bc997d', '#708a83', '#ad806c', '#8a8e6d', '#978697', '#8c9aaa']
  let shownId: string | null = null
  let visualTime = 0
  const position = new THREE.Vector3()
  return {
    reset() {
      shownId = null
    },
    update(state: GameState, delta: number, running: boolean) {
      const customer = state.customer
      root.visible = !!customer
      if (!customer) {
        shownId = null
        return
      }
      position.set(customer.position[0], 0, customer.position[1])
      if (shownId !== customer.id) {
        shownId = customer.id
        root.position.copy(position)
        root.rotation.y = customer.yaw
        shirt.color.set(palette[(customer.orderNumber - 1) % palette.length])
        liquidMaterial.color.set(RECIPES[customer.recipe].color)
        const kind = cupKindFor(customer.recipe, customer.service)
        for (const [id, body] of bodies) {
          body.root.visible = id === kind
          body.lid.visible = customer.service === 'takeout'
        }
        liquid.position.y = CUP_DIMENSIONS[kind].height - 0.014
        liquid.scale.setScalar((CUP_DIMENSIONS[kind].top - 0.006) / 0.1)
        visualTime = state.time
      } else if (running) root.position.lerp(position, 1 - Math.exp(-delta * 20))
      if (running) visualTime += delta
      const sitting = customerSitting({ ...customer, position: [root.position.x, root.position.z] })
      const walking = customerWalking(customer)
      const stride = walking ? Math.sin(visualTime * 8) * (1 - sitting) : 0
      const sipping = customer.stage === 'drinking' ? Math.max(0, Math.sin(visualTime * 2)) : 0
      const yaw = customer.yaw + Math.atan2(Math.sin(-customer.yaw), Math.cos(-customer.yaw)) * sitting
      if (running)
        root.rotation.y +=
          Math.atan2(Math.sin(yaw - root.rotation.y), Math.cos(yaw - root.rotation.y)) * Math.min(1, delta * 14)
      person.position.y = -0.27 * sitting + (walking ? Math.abs(stride) * 0.018 : 0)
      legs.forEach((leg, i) => {
        leg.hip.rotation.x = (-Math.PI / 2) * sitting + stride * (i ? -0.38 : 0.38)
        leg.knee.rotation.x = (Math.PI / 2) * sitting
      })
      const holding = customerHasCup(customer)
      arms[0].rotation.x = walking ? -stride * 0.3 : 0.05
      arms[1].rotation.x = holding ? -0.8 - sitting * 0.6 - sipping * 0.6 : stride * 0.3
      cup.visible = holding
      cup.position.set(
        0.29 - sipping * 0.14,
        0.97 + 0.27 * sitting + sipping * 0.3,
        0.37 + sitting * 0.14 - sipping * 0.09,
      )
      cup.rotation.x = -sipping * 0.28
    },
  }
}
