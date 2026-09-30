import * as THREE from 'three'
import { BACKROOM_BOUNDS, BACKROOM_DOOR, BACKROOM_FRONT_Z, STATIONS } from '../content/stations'
import { createIceMachine } from '../features/ice/equipment'
import { createDryStorage } from '../features/inventory/dry-storage'
import { createRefrigerator } from '../features/inventory/refrigerator'
import { createDishwasher } from '../features/washing/dishwasher'
import { createWashingEquipment } from '../features/washing/equipment'
import { canvasFont } from '../shared/visuals/canvas-text'
import {
  equipmentBasin as basin,
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../shared/visuals/equipment-geometry'
import type { Obstacle } from './collision'

export function createBackroom(scene: THREE.Scene) {
  const room = BACKROOM_BOUNDS
  const obstacles: Obstacle[] = []
  const occluders: THREE.Object3D[] = []
  const steel = material({ color: '#bec8cc', metalness: 0.88, roughness: 0.4 })
  const white = new THREE.MeshStandardMaterial({ color: '#e0e4df', roughness: 0.88 })
  const trim = new THREE.MeshStandardMaterial({ color: '#85918d', roughness: 0.8 })
  const rubber = new THREE.MeshStandardMaterial({ color: '#333b39', roughness: 0.95 })
  const width = room.maxX - room.minX
  const depth = room.maxZ - room.minZ
  const centerX = (room.minX + room.maxX) / 2
  const centerZ = (room.minZ + room.maxZ) / 2

  function solid(size: [number, number, number], position: [number, number, number], finish: THREE.Material) {
    const part = mesh(scene, new THREE.BoxGeometry(...size), finish, position)
    obstacles.push({
      x: position[0],
      z: position[2],
      width: size[0],
      depth: size[2],
      minY: position[1] - size[1] / 2,
      maxY: position[1] + size[1] / 2,
    })
    occluders.push(part)
    return part
  }

  const tile = document.createElement('canvas')
  tile.width = tile.height = 256
  const ctx = tile.getContext('2d')!
  ctx.fillStyle = '#858783'
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#a8aaa5'
  ctx.fillRect(3, 3, 250, 250)
  let seed = 741
  for (let i = 0; i < 8500; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const x = seed % 256
    const y = (seed >>> 8) % 256
    ctx.fillStyle = i % 2 ? '#969b9440' : '#ced0c52b'
    ctx.fillRect(x, y, 2, 2)
  }
  const floorMap = new THREE.CanvasTexture(tile)
  floorMap.colorSpace = THREE.SRGBColorSpace
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping
  floorMap.repeat.set(width / 0.3, depth / 0.3)
  floorMap.anisotropy = 8
  const floor = mesh(
    scene,
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.93 }),
    [centerX, 0.027, centerZ],
  )
  floor.rotation.x = -Math.PI / 2
  solid([0.12, room.ceiling, depth], [room.minX, room.ceiling / 2, centerZ], white)
  solid([0.12, room.ceiling, depth], [room.maxX, room.ceiling / 2, centerZ], white)
  solid([width, room.ceiling, 0.035], [centerX, room.ceiling / 2, room.minZ], white)
  solid([width, 0.065, depth], [centerX, room.ceiling, centerZ], white)
  // The front wall already belongs to the shop. Add its washable workroom face around the doorway.
  for (const [left, right] of [
    [room.minX, BACKROOM_DOOR.x - BACKROOM_DOOR.width / 2],
    [BACKROOM_DOOR.x + BACKROOM_DOOR.width / 2, room.maxX],
  ]) {
    const w = right - left
    box(scene, [w, room.ceiling, 0.025], [(left + right) / 2, room.ceiling / 2, room.maxZ - 0.025], white)
    box(scene, [w, 0.15, 0.035], [(left + right) / 2, 0.097, room.maxZ - 0.055], trim)
  }
  box(scene, [width, 0.15, 0.06], [centerX, 0.097, room.minZ + 0.045], trim)
  for (const x of [room.minX + 0.065, room.maxX - 0.065]) box(scene, [0.04, 0.15, depth], [x, 0.097, centerZ], trim)
  for (let x = room.minX + 1.2; x < room.maxX; x += 1.2)
    box(scene, [0.014, 2.65, 0.01], [x, 1.45, room.minZ + 0.022], trim, 0)
  for (let x = room.minX + 0.6; x < room.maxX; x += 0.6)
    box(scene, [0.016, 0.016, depth], [x, room.ceiling - 0.04, centerZ], trim, 0)
  for (let z = room.minZ + 0.6; z < room.maxZ; z += 0.6)
    box(scene, [width, 0.016, 0.016], [centerX, room.ceiling - 0.04, z], trim, 0)
  const diffuser = new THREE.MeshBasicMaterial({ color: '#eef8f8', toneMapped: false })
  for (const x of [-4.1, -0.5, 3.1, 6.7]) {
    box(scene, [1.14, 0.04, 0.32], [x, room.ceiling - 0.07, centerZ], trim)
    box(scene, [1.08, 0.016, 0.27], [x, room.ceiling - 0.097, centerZ], diffuser)
  }
  for (const x of [-1.8, 5.8]) {
    const light = new THREE.PointLight('#eaf5ff', 9, 10, 2)
    light.position.set(x, 2.72, centerZ)
    scene.add(light)
  }

  function worktable(x: number, z: number, w: number) {
    box(scene, [w, 0.045, 0.88], [x, 1.0725, z], steel)
    box(scene, [w, 0.14, 0.025], [x, 1.16, z - 0.43], steel)
    box(scene, [w - 0.14, 0.028, 0.72], [x, 0.25, z], steel)
    for (const side of [-1, 1]) {
      for (const end of [-1, 1])
        mesh(scene, new THREE.CylinderGeometry(0.024, 0.028, 0.98, 12), steel, [
          x + side * (w / 2 - 0.09),
          0.55,
          z + end * 0.32,
        ])
    }
    obstacles.push({ x, z, width: w, depth: 0.88, minY: 0, maxY: 1.23, blocksSight: true })
  }
  worktable(STATIONS.prep.x, STATIONS.prep.z, 2.25)
  worktable(STATIONS['cold-prep'].x, STATIONS['cold-prep'].z, 1.72)
  createRefrigerator(scene)
  obstacles.push({
    x: STATIONS.fridge.x,
    z: STATIONS.fridge.z - 0.4,
    width: 1.4,
    depth: 1.02,
    maxY: 2.21,
    blocksSight: true,
  })
  createDryStorage(scene)
  obstacles.push({ x: STATIONS.stock.x, z: STATIONS.stock.z, width: 1.62, depth: 0.56, maxY: 2.4, blocksSight: true })
  for (const [x, label] of [
    [-4.45, '컵 · 리드'],
    [-2.65, '시럽 · 소스'],
    [-0.85, '포장 · 소모품'],
    [0.95, '원두 · 티'],
  ] as const) {
    createDryStorage(scene, { x, z: -6.31 }, Math.PI, label)
    obstacles.push({ x, z: -6.31, width: 1.62, depth: 0.56, maxY: 2.4, blocksSight: true })
  }
  // Splash guard separates clean ingredient preparation from the wet work line.
  solid([0.035, 1.25, 0.85], [2.64, 0.89, -9.17], steel)
  createWashingEquipment(scene)
  obstacles.push({ x: 6.93, z: STATIONS.wash.z, width: 3.1, depth: 0.85, maxY: 1.3, blocksSight: true })
  obstacles.push({ x: 3.83, z: STATIONS.wash.z, width: 1, depth: 0.82, maxY: 1.36, blocksSight: true })
  const dishwasher = createDishwasher(scene)
  obstacles.push({ x: STATIONS.dishwasher.x, z: STATIONS.dishwasher.z - 0.12, width: 0.86, depth: 0.93, maxY: 2.1 })
  const iceMachine = createIceMachine(scene)
  obstacles.push({
    x: STATIONS['ice-machine'].x,
    z: STATIONS['ice-machine'].z + 0.49,
    width: 1.24,
    depth: 1,
    maxY: 1.85,
    blocksSight: true,
  })

  function drain(x: number, z: number) {
    box(scene, [0.34, 0.014, 0.34], [x, 0.038, z], steel, 0.005)
    instances(
      scene,
      new THREE.BoxGeometry(0.27, 0.006, 0.012),
      rubber,
      Array.from({ length: 10 }, (_, i) => [x, 0.048, z - 0.135 + i * 0.03]),
    )
  }
  drain(6.5, -8.38)
  drain(4.48, -7.12)
  // Dedicated hand wash basin beside the entrance, with its own splash shield and soap/towel dispensers.
  const hand = new THREE.Group()
  hand.position.set(8.96, 0, -7.11)
  hand.rotation.y = -Math.PI / 2
  scene.add(hand)
  const handSink = basin(hand, 0.44, 0.34, 0.15, steel)
  handSink.position.y = 0.77
  box(hand, [0.5, 0.48, 0.025], [0, 1.13, -0.23], steel)
  tube(
    hand,
    [
      [0, 1.06, -0.22],
      [0, 1.13, -0.12],
      [0, 1.08, 0.03],
    ],
    0.013,
    steel,
  )
  tube(
    hand,
    [
      [0, 0.78, 0],
      [0, 0.5, 0],
      [0, 0.43, -0.2],
    ],
    0.022,
    steel,
  )
  box(hand, [0.23, 0.27, 0.14], [-0.19, 1.64, -0.15], rubber)
  box(hand, [0.11, 0.19, 0.11], [0.15, 1.48, -0.15], white)
  box(hand, [0.2, 0.09, 0.02], [-0.19, 1.46, -0.14], white)
  obstacles.push({ x: 8.94, z: -7.11, width: 0.58, depth: 0.6, maxY: 1.3 })

  // Chemicals stay under the wet line, away from food and packaging shelves.
  const chemicalColors = ['#577cab', '#b77b49', '#8f4b56']
  for (let i = 0; i < 3; i++) {
    const plastic = material({ color: '#e4e6df', roughness: 0.56 })
    box(scene, [0.2, 0.29, 0.2], [5.67 + i * 0.26, 0.18, -9.12], plastic)
    mesh(scene, new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), trim, [5.67 + i * 0.26, 0.343, -9.12])
    const label = material({ color: chemicalColors[i], roughness: 0.7 })
    box(scene, [0.17, 0.12, 0.005], [5.67 + i * 0.26, 0.2, -9.014], label)
  }
  for (const [x, label] of [
    [-0.8, '배치 준비'],
    [1.3, '콜드 브루'],
    [3.83, '건조대'],
    [7.86, '회수대'],
  ] as const) {
    panel(scene, 0.65, 0.13, [x, 2.48, -9.74], (ctx, w, h) => {
      ctx.fillStyle = '#e9ede7'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3e5448'
      ctx.font = canvasFont(h * 0.48, 600)
      ctx.textAlign = 'center'
      ctx.fillText(label, w / 2, h * 0.7)
    })
  }
  box(scene, [BACKROOM_DOOR.width, 0.008, 0.22], [BACKROOM_DOOR.x, 0.034, BACKROOM_FRONT_Z], steel)
  return { obstacles, occluders, dishwasher, iceMachine }
}
