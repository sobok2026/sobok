import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { CUSTOMER_ENTRANCE, FLOOR_HEIGHT, SHOP_BOUNDS, STAIRCASE, STATIONS, tableIds } from '../content/stations'
import { canvasFont, paintTexture } from '../shared/visuals/canvas-text'
import type { Obstacle } from './interior'
import { createInteriorFinishes } from './interior-finishes'

type Point = [number, number, number]
type Part = { size: Point; position: Point; yaw: number }

export function createCoffeehouse(scene: THREE.Scene) {
  const finishes = createInteriorFinishes()
  const obstacles: Obstacle[] = []
  const occluders: THREE.Object3D[] = []
  const batches = new Map<THREE.Material, Map<'box' | 'cylinder' | 'leaf', Part[]>>()

  function part(shape: 'box' | 'cylinder' | 'leaf', size: Point, position: Point, material: THREE.Material, yaw = 0) {
    let shapes = batches.get(material)

    if (!shapes) {
      shapes = new Map()
      batches.set(material, shapes)
    }

    let parts = shapes.get(shape)

    if (!parts) {
      parts = []
      shapes.set(shape, parts)
    }

    parts.push({ size, position, yaw })
  }

  const box = (size: Point, position: Point, material: THREE.Material, yaw = 0) =>
    part('box', size, position, material, yaw)
  const cylinder = (size: Point, position: Point, material: THREE.Material) =>
    part('cylinder', size, position, material)

  function solid(size: Point, position: Point, material: THREE.Material, collision = true) {
    const geometry = new THREE.BoxGeometry(...size)
    const vertices = geometry.attributes.position
    const normals = geometry.attributes.normal
    const uv = geometry.attributes.uv

    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i)
      const y = vertices.getY(i)
      const z = vertices.getZ(i)

      if (Math.abs(normals.getY(i)) > 0.5) {
        uv.setXY(i, x, z)
      } else {
        uv.setXY(i, Math.abs(normals.getX(i)) > 0.5 ? z : x, y)
      }
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.fromArray(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)

    if (collision) {
      obstacles.push({
        x: position[0],
        z: position[2],
        width: size[0],
        depth: size[2],
        minY: position[1] - size[1] / 2,
        maxY: position[1] + size[1] / 2,
      })
      occluders.push(mesh)
    }

    return mesh
  }

  function panel(
    width: number,
    height: number,
    position: Point,
    yaw: number,
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
    transparent = false,
  ) {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round((1024 * height) / width)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    paintTexture(texture, () => draw(canvas.getContext('2d')!, canvas.width, canvas.height))
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, transparent }),
    )
    mesh.position.fromArray(position)
    mesh.rotation.y = yaw
    scene.add(mesh)
  }

  const width = SHOP_BOUNDS.maxX - SHOP_BOUNDS.minX
  const depth = SHOP_BOUNDS.maxZ - SHOP_BOUNDS.minZ
  const centerZ = (SHOP_BOUNDS.maxZ + SHOP_BOUNDS.minZ) / 2
  solid([width, 0.16, depth], [0, -0.09, centerZ], finishes.floor, false)

  function floorSlab(y: number, finish: THREE.Material) {
    const left = STAIRCASE.leftX - STAIRCASE.width / 2
    const right = STAIRCASE.rightX + STAIRCASE.width / 2
    const rectangles = [
      [SHOP_BOUNDS.minX, left, SHOP_BOUNDS.minZ, SHOP_BOUNDS.maxZ],
      [right, SHOP_BOUNDS.maxX, SHOP_BOUNDS.minZ, SHOP_BOUNDS.maxZ],
      [left, right, SHOP_BOUNDS.minZ, STAIRCASE.startZ],
      [left, right, STAIRCASE.landingEndZ, SHOP_BOUNDS.maxZ],
    ]

    for (const [x0, x1, z0, z1] of rectangles) {
      const top = solid([x1 - x0, 0.16, z1 - z0], [(x0 + x1) / 2, y - 0.08, (z0 + z1) / 2], finish, false)
      occluders.push(top)
      solid([x1 - x0, 0.025, z1 - z0], [(x0 + x1) / 2, y - 0.1725, (z0 + z1) / 2], finishes.ceiling, false)
    }
  }

  floorSlab(FLOOR_HEIGHT, finishes.floor)
  floorSlab(FLOOR_HEIGHT * 2, finishes.oak)
  solid([width, 3.9, 0.2], [0, 1.95, -9.9], finishes.ceiling)
  solid([0.2, 3.9, depth], [-9.9, 1.95, centerZ], finishes.plaster)
  solid([0.2, 3.9, 10], [9.9, 1.95, -4.9], finishes.brick)
  solid([13.8, 0.09, 5.5], [0, 3.74, -3.1], finishes.oak, false)
  solid([13.8, 0.28, 0.3], [0, 3.63, -0.38], finishes.charcoal, false)
  solid([2.9, 3.9, 0.18], [-8.45, 1.95, -5.85], finishes.brick)
  solid([2.9, 3.9, 0.18], [8.45, 1.95, -5.85], finishes.brick)
  solid([0.2, 3.9, 5.45], [6.88, 1.95, -3.08], finishes.brick)
  box([width, 0.12, 0.08], [0, 0.1, -9.75], finishes.charcoal)
  box([0.08, 0.12, depth], [-9.75, 0.1, centerZ], finishes.charcoal)

  for (const x of [-6.85, 6.85]) {
    box([0.4, 3.8, 0.5], [x, 1.9, -0.44], finishes.charcoal)

    for (let offset = -0.16; offset <= 0.16; offset += 0.055) {
      box([0.027, 3.74, 0.035], [x + offset, 1.9, -0.17], finishes.walnut)
    }
  }

  for (let x = -9.7; x < 10; x += 2.45) {
    if (Math.abs(x - CUSTOMER_ENTRANCE.x) < 1.1) continue
    box([0.065, 3.78, 0.14], [x, 1.9, 13.86], finishes.charcoal)
  }

  for (const y of [0.07, 3.76]) {
    box([19.6, 0.1, 0.15], [0, y, 13.86], finishes.charcoal)
    box([0.15, 0.1, 13.8], [9.86, y, 6.88], finishes.charcoal)
  }

  for (const z of [0, 2.76, 5.52, 8.28, 11.04, 13.8]) {
    box([0.14, 3.78, 0.065], [9.86, 1.9, z], finishes.charcoal)
  }

  box([19.55, 3.65, 0.016], [0, 1.9, 13.9], finishes.glass)
  box([0.016, 3.65, 13.7], [9.9, 1.9, 6.9], finishes.glass)

  for (const x of [CUSTOMER_ENTRANCE.x - 0.95, CUSTOMER_ENTRANCE.x, CUSTOMER_ENTRANCE.x + 0.95]) {
    box([0.045, 2.7, 0.12], [x, 1.38, 13.81], finishes.charcoal)
  }

  for (const x of [CUSTOMER_ENTRANCE.x - 0.15, CUSTOMER_ENTRANCE.x + 0.15]) {
    cylinder([0.016, 0.6, 0.016], [x, 1.18, 13.72], finishes.brass)
  }

  box([1.95, 0.045, 0.12], [CUSTOMER_ENTRANCE.x, 2.74, 13.81], finishes.charcoal)
  box([2.3, 0.012, 1.2], [CUSTOMER_ENTRANCE.x, 0.012, 13.13], finishes.charcoal)
  panel(2.7, 0.45, [CUSTOMER_ENTRANCE.x, 3.13, 13.75], Math.PI, (ctx, w, h) => {
    ctx.fillStyle = '#efece0'
    ctx.font = canvasFont(h * 0.37, 600)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('소복다방', w / 2, h / 2)
  })

  for (const z of [-7.5, -3.6, 0.5, 4.5, 8.4, 12.1]) {
    for (const x of [-8.2, -4.2, -0.2, 3.8, 7.8]) {
      const y = z < -1 && z > -5.85 ? 3.68 : 3.79
      cylinder([0.12, 0.025, 0.12], [x, y, z], finishes.charcoal)
      cylinder([0.085, 0.026, 0.085], [x, y - 0.015, z], finishes.light)
    }
  }

  for (const z of [-3, 5.2, 10.8]) {
    for (const x of [-2, 5.5]) {
      cylinder([0.2, 0.028, 0.2], [x, 3.79, z], finishes.charcoal)
      cylinder([0.17, 0.033, 0.17], [x, 3.77, z], finishes.ceiling)
    }
  }

  box([0.04, 0.02, 18.8], [1.05, 3.78, 4.0], finishes.light)
  box([0.18, 0.25, 18.8], [1.15, 3.66, 4.0], finishes.walnut)

  for (const [x, z, intensity] of [
    [0, -3.3, 15],
    [-5.5, 5, 12],
    [4.5, 8.5, 10],
  ]) {
    const light = new THREE.SpotLight('#ffe1b4', intensity * 3, 18, 1.15, 0.8, 2)
    light.position.set(x, 3.6, z)
    light.target.position.set(x, 0, z)
    scene.add(light, light.target)
  }

  // The brick stair volume separates the entry merchandise gallery from the rear counter.
  solid([5.9, 3.88, 0.26], [-6.8, 1.94, 9.6], finishes.brick)
  solid([0.26, 3.88, 4.75], [-3.72, 1.94, 6.3], finishes.brick)
  const stairRun = STAIRCASE.endZ - STAIRCASE.startZ

  for (const base of [0, FLOOR_HEIGHT]) {
    const landingY = base + FLOOR_HEIGHT / 2
    solid(
      [3, 0.14, STAIRCASE.landingEndZ - STAIRCASE.endZ],
      [-5.2, landingY - 0.07, (STAIRCASE.endZ + STAIRCASE.landingEndZ) / 2],
      finishes.oak,
      false,
    )

    for (const [x, descending] of [
      [STAIRCASE.leftX, false],
      [STAIRCASE.rightX, true],
    ] as const) {
      for (let step = 0; step < 12; step++) {
        const progress = (step + 0.5) / 12
        const y = base + (descending ? 4 - progress * 2 : progress * 2)
        box(
          [STAIRCASE.width, 0.17, stairRun / 12 + 0.01],
          [x, y - 0.1, STAIRCASE.startZ + progress * stairRun],
          finishes.oak,
        )
        for (const side of [-1, 1]) {
          box(
            [0.025, 0.92, 0.025],
            [x + side * (STAIRCASE.width / 2 - 0.025), y + 0.45, STAIRCASE.startZ + progress * stairRun],
            finishes.charcoal,
          )
        }
      }

      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, Math.hypot(stairRun, 2)), finishes.walnut)
        rail.position.set(
          x + side * (STAIRCASE.width / 2 - 0.025),
          base + (descending ? 3 : 1) + 0.92,
          (STAIRCASE.startZ + STAIRCASE.endZ) / 2,
        )
        rail.rotation.x = (descending ? 1 : -1) * Math.atan2(2, stairRun)
        scene.add(rail)
      }
    }
  }

  for (const level of [0, FLOOR_HEIGHT]) {
    solid([0.15, 3.8, 4.4], [-5.2, level + 1.9, 6], finishes.charcoal)
    solid([0.09, 3.8, 5.55], [-6.79, level + 1.9, 6.575], finishes.charcoal)
    solid([0.09, 3.8, 5.55], [-3.61, level + 1.9, 6.575], finishes.charcoal)
    solid([3.25, 1.1, 0.07], [-5.2, level + 2.55, 9.41], finishes.charcoal)
  }

  // A low relief of the mountain sits beside the foot of the stairs.
  solid([2.55, 0.82, 1.3], [-8.1, 0.41, 4.7], finishes.oak)
  for (let i = 0; i < 7; i++)
    part('leaf', [0.4, 0.18 + (i % 3) * 0.12, 0.43], [-9.1 + i * 0.32, 0.96, 4.7], finishes.brass, i)
  panel(1.3, 0.42, [-3.57, 2.3, 7.15], Math.PI / 2, (ctx, w, h) => {
    ctx.fillStyle = '#e9e3d3'
    ctx.font = canvasFont(h * 0.33, 500)
    ctx.textAlign = 'center'
    ctx.fillText('2F  ↑', w / 2, h * 0.43)
    ctx.font = canvasFont(h * 0.2)
    ctx.fillText('SEATING', w / 2, h * 0.76)
  })

  function chair(x: number, z: number, yaw: number, lounge = false, baseY = 0, outdoor = false) {
    const local = (dx: number, y: number, dz: number): Point => [
      x + Math.cos(yaw) * dx + Math.sin(yaw) * dz,
      y + baseY,
      z - Math.sin(yaw) * dx + Math.cos(yaw) * dz,
    ]
    const spread = lounge ? 0.29 : 0.22

    for (const dx of [-spread, spread]) {
      for (const dz of [-spread, spread]) {
        box([0.045, 0.44, 0.045], local(dx, 0.24, dz), outdoor ? finishes.charcoal : finishes.walnut, yaw)
      }
    }

    box(
      [spread * 2 + 0.08, 0.09, spread * 2 + 0.07],
      local(0, 0.49, 0),
      outdoor ? finishes.counter : finishes.leather,
      yaw,
    )
    box([spread * 2 + 0.08, lounge ? 0.43 : 0.16, 0.065], local(0, 0.8, spread), finishes.walnut, yaw)

    for (const dx of [-spread, spread]) {
      box([0.035, 0.38, 0.045], local(dx, 0.67, spread), finishes.walnut, yaw)

      if (lounge) {
        box([0.05, 0.05, 0.65], local(dx + Math.sign(dx) * 0.06, 0.68, 0), finishes.walnut, yaw)
      }
    }

    if (lounge) box([0.57, 0.37, 0.065], local(0, 0.78, spread - 0.044), finishes.leather, yaw)
    obstacles.push({ x, z, width: lounge ? 0.8 : 0.58, depth: lounge ? 0.8 : 0.58, minY: baseY, maxY: baseY + 1 })
  }

  function roundTable(x: number, z: number, radius = 0.43, baseY = 0, outdoor = false) {
    cylinder([radius, 0.065, radius], [x, baseY + 0.8175, z], outdoor ? finishes.counter : finishes.oak)
    cylinder([0.045, 0.73, 0.045], [x, baseY + 0.42, z], finishes.charcoal)
    cylinder([radius * 0.6, 0.045, radius * 0.6], [x, baseY + 0.043, z], finishes.charcoal)
    obstacles.push({ x, z, width: radius * 2, depth: radius * 2, minY: baseY, maxY: baseY + 0.86 })
  }

  for (const id of tableIds) {
    const { x, z } = STATIONS[id]
    roundTable(x, z, 0.65)
    chair(x, z - 0.95, Math.PI)
    chair(x, z + 0.95, 0)
    chair(x - 0.95, z, -Math.PI / 2)
    chair(x + 0.95, z, Math.PI / 2)
  }

  box([1.12, 0.075, 6.85], [3.65, 0.84, 9.47], finishes.oak)

  for (const z of [6.55, 12.4]) {
    box([0.84, 0.8, 0.065], [3.65, 0.42, z], finishes.charcoal)
  }

  obstacles.push({ x: 3.65, z: 9.47, width: 1.12, depth: 6.85 })

  for (let i = 0; i < 7; i++) {
    chair(2.52, 6.65 + i * 0.94, -Math.PI / 2)
    chair(4.78, 6.65 + i * 0.94, Math.PI / 2)
  }

  // Six leather armchairs look out over the garden along the east glazing.
  for (let i = 0; i < 6; i++) {
    const z = 3.3 + i * 1.7
    chair(8.95, z, -Math.PI / 2, true)
    if (i % 2 === 0) roundTable(8.75, z + 0.85, 0.29)
  }

  // Cream banquettes, round oak tables and timber chairs follow the photographed wall seating.
  for (let i = 0; i < 3; i++) {
    const z = 10.05 + i * 1.42
    box([0.73, 0.4, 1.64], [-9.28, 0.28, z], finishes.oak)
    box([0.68, 0.13, 1.58], [-9.24, 0.52, z], finishes.linen)
    box([0.16, 0.5, 1.59], [-9.52, 0.8, z], finishes.linen)
    obstacles.push({ x: -9.25, z, width: 0.9, depth: 1.64 })

    for (const dz of [-0.4, 0.4]) {
      roundTable(-8.4, z + dz, 0.32)
      chair(-7.62, z + dz, Math.PI / 2)
    }
  }

  for (const z of [-4.1, -1.8, 0.5]) {
    roundTable(8.35, z, 0.38)
    chair(8.35, z - 0.72, Math.PI)
    chair(8.35, z + 0.72, 0)
  }

  box([2.9, 0.07, 0.42], [7.25, 1.02, 13.4], finishes.oak)

  for (const x of [6.3, 7.25, 8.2]) {
    cylinder([0.22, 0.07, 0.22], [x, 0.65, 12.9], finishes.oak)
    cylinder([0.035, 0.61, 0.035], [x, 0.32, 12.9], finishes.charcoal)
    obstacles.push({ x, z: 12.9, width: 0.48, depth: 0.48 })
  }

  obstacles.push({ x: 7.25, z: 13.4, width: 2.9, depth: 0.42 })

  // Merchandise occupies the left side of the arrival gallery.
  solid([3.9, 2.8, 0.32], [-6.05, 1.4, 9.79], finishes.charcoal)

  for (const y of [0.38, 1.01, 1.64, 2.27]) {
    box([3.85, 0.045, 0.48], [-6.05, y, 10.02], finishes.oak)
    box([3.7, 0.014, 0.022], [-6.05, y + 0.045, 9.84], finishes.light)

    for (let i = 0; i < 11; i++) {
      const x = -7.68 + i * 0.32
      const color = [finishes.linen, finishes.foliage, finishes.leather][i % 3]
      cylinder([0.074, 0.24, 0.074], [x, y + 0.14, 10.02], color)
      cylinder([0.078, 0.025, 0.078], [x, y + 0.27, 10.02], finishes.charcoal)
    }
  }

  solid([2.7, 0.72, 1.04], [-4.85, 0.36, 11.45], finishes.walnut)
  box([2.78, 0.045, 1.1], [-4.85, 0.745, 11.45], finishes.counter)

  for (let i = 0; i < 8; i++) {
    box([0.22, 0.3, 0.12], [-5.95 + (i % 4) * 0.64, 0.92, 11.22 + Math.floor(i / 4) * 0.48], finishes.linen)
  }

  panel(2.8, 0.3, [-6.05, 2.62, 10.04], 0, (ctx, w, h) => {
    ctx.fillStyle = '#ece3d2'
    ctx.font = canvasFont(h * 0.45, 500)
    ctx.textAlign = 'center'
    ctx.fillText('COFFEE  &  EVERYDAY', w / 2, h * 0.69)
  })

  for (const z of [10.1, 12.35]) {
    box([0.08, 1.44, 1.44], [-9.74, 2.25, z], finishes.charcoal)
    panel(1.33, 1.33, [-9.68, 2.25, z], Math.PI / 2, (ctx, w, h) => {
      ctx.fillStyle = '#c1a37c'
      ctx.fillRect(0, 0, w, h)

      for (let layer = 0; layer < 4; layer++) {
        ctx.fillStyle = ['#aea58a', '#757d65', '#586853', '#344e3d'][layer]
        ctx.beginPath()
        ctx.moveTo(0, h)

        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, h * (0.28 + layer * 0.15) + Math.sin(x / 110 + layer * 2) * h * 0.13)
        }

        ctx.lineTo(w, h)
        ctx.fill()
      }

      ctx.fillStyle = '#eee5cd'
      ctx.font = canvasFont(34, 500)
      ctx.textAlign = 'center'
      ctx.fillText('COFFEE · NATURE · CONNECTION', w / 2, h * 0.91)
    })
  }

  // Small bakery case beside the ordering end of the bar.
  solid([2.25, 0.85, 1.12], [-8.3, 0.425, -0.65], finishes.oak)
  box([2.3, 0.07, 1.15], [-8.3, 0.88, -0.65], finishes.counter)
  box([2.27, 0.65, 0.035], [-8.3, 1.24, -0.06], finishes.glass)

  for (const x of [-9.43, -7.17]) {
    box([0.035, 0.66, 1.15], [x, 1.23, -0.65], finishes.charcoal)
  }

  for (const y of [0.96, 1.25, 1.57]) {
    box([2.27, 0.025, 1.13], [-8.3, y, -0.65], finishes.glass)
    box([2.27, 0.014, 0.03], [-8.3, y, -0.06], finishes.brass)

    if (y < 1.5) {
      for (let i = 0; i < 6; i++) {
        box([0.28, 0.085, 0.22], [-9.2 + i * 0.35, y + 0.075, -0.5], finishes.linen)
        cylinder([0.1, 0.065, 0.1], [-9.2 + i * 0.35, y + 0.075, -0.82], finishes.leather)
      }
    }
  }

  function plant(x: number, z: number, scale = 1, baseY = 0) {
    cylinder([0.27 * scale, 0.46 * scale, 0.27 * scale], [x, baseY + 0.23 * scale, z], finishes.counter)

    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4
      part(
        'leaf',
        [0.24 * scale, (0.55 + (i % 3) * 0.12) * scale, 0.13 * scale],
        [
          x + Math.cos(angle) * 0.23 * scale,
          baseY + (0.77 + (i % 3) * 0.16) * scale,
          z + Math.sin(angle) * 0.23 * scale,
        ],
        finishes.foliage,
        angle,
      )
    }
  }

  plant(7.7, 11.8, 1.6)
  plant(-2.4, 12.4, 1.1)
  plant(7.65, 1.75, 1.2)

  const upper = FLOOR_HEIGHT
  const roof = FLOOR_HEIGHT * 2
  solid([19.8, 3.8, 0.18], [0, upper + 1.9, -9.85], finishes.plaster)
  solid([0.18, 3.8, 23.8], [-9.85, upper + 1.9, 2], finishes.brick)

  for (const y of [upper + 0.08, upper + 3.73]) {
    box([19.6, 0.09, 0.14], [0, y, 13.85], finishes.charcoal)
    box([0.14, 0.09, 23.6], [9.85, y, 2], finishes.charcoal)
  }

  for (let z = -9.8; z <= 13.8; z += 2.36) {
    box([0.13, 3.7, 0.06], [9.85, upper + 1.9, z], finishes.charcoal)
  }

  for (let x = -9.8; x < 10; x += 2.45) {
    box([0.06, 3.7, 0.13], [x, upper + 1.9, 13.85], finishes.charcoal)
  }

  box([19.6, 3.65, 0.014], [0, upper + 1.9, 13.9], finishes.glass)
  box([0.014, 3.65, 23.6], [9.9, upper + 1.9, 2], finishes.glass)

  for (const z of [-5.8, 1.7, 9.7]) {
    solid([0.48, 3.8, 0.48], [7.7, upper + 1.9, z], finishes.charcoal)
    for (let row = 0; row < 9; row++) {
      for (let column = 0; column < 2; column++) {
        cylinder([0.038, 0.016, 0.038], [7.45, upper + 0.5 + row * 0.33, z - 0.12 + column * 0.24], finishes.brass)
      }
    }
  }

  // Upper floor: the photographed window lounges, small table groups and wall banquettes.
  for (const x of [-0.7, 2.6, 5.8]) {
    for (let row = 0; row < 7; row++) {
      const z = -6.4 + row * 2.86
      if (x === 2.6) {
        box([1.25, 0.065, 0.85], [x, upper + 0.82, z], finishes.oak)
        for (const dx of [-0.52, 0.52])
          for (const dz of [-0.32, 0.32]) {
            box([0.055, 0.78, 0.055], [x + dx, upper + 0.4, z + dz], finishes.charcoal)
          }
        obstacles.push({ x, z, width: 1.25, depth: 0.85, minY: upper, maxY: upper + 0.86 })
        for (const dx of [-0.37, 0.37]) {
          chair(x + dx, z - 0.8, Math.PI, false, upper)
          chair(x + dx, z + 0.8, 0, false, upper)
        }
      } else {
        roundTable(x, z, 0.53, upper)
        chair(x, z - 0.83, Math.PI, row % 2 === 0, upper)
        chair(x, z + 0.83, 0, row % 2 === 0, upper)
        chair(x - 0.83, z, -Math.PI / 2, false, upper)
        chair(x + 0.83, z, Math.PI / 2, false, upper)
      }
    }
  }

  for (const z of [-6.7, -4.3, -1.9, 0.5, 2.9]) {
    roundTable(-8.3, z, 0.4, upper)
    chair(-8.3, z - 0.72, Math.PI, true, upper)
    chair(-8.3, z + 0.72, 0, true, upper)
  }

  for (const x of [-8.3, -5.5]) {
    for (const z of [10.9, 12.9]) {
      roundTable(x, z, 0.38, upper)
      chair(x - 0.73, z, -Math.PI / 2, false, upper)
      chair(x + 0.73, z, Math.PI / 2, false, upper)
    }
  }

  for (let i = 0; i < 14; i++) {
    const z = -7.4 + i * 1.55
    chair(8.85, z, -Math.PI / 2, true, upper)
    if (i % 2 === 0) roundTable(8.7, z + 0.77, 0.25, upper)
  }

  for (let i = 0; i < 11; i++) {
    const x = -6.45 + i * 1.26
    box([1.22, 0.4, 0.62], [x, upper + 0.28, -9.24], finishes.oak)
    box([1.18, 0.12, 0.6], [x, upper + 0.53, -9.2], finishes.linen)
    box([1.18, 0.48, 0.12], [x, upper + 0.82, -9.48], finishes.linen)
    obstacles.push({ x, z: -9.2, width: 1.22, depth: 0.76, minY: upper, maxY: upper + 1.1 })
    roundTable(x, -8.55, 0.33, upper)
    chair(x, -7.83, 0, false, upper)
  }

  for (const [x, z] of [
    [-2.6, -3.5],
    [7.9, 12.3],
    [-8.75, 7.4],
  ])
    plant(x, z, 1.3, upper)

  for (const x of [-7.5, -0.5, 6.5]) {
    for (const z of [-6.5, -0.5, 5.5, 11.5]) {
      cylinder([0.11, 0.025, 0.11], [x, upper + 3.79, z], finishes.charcoal)
      cylinder([0.075, 0.03, 0.075], [x, upper + 3.77, z], finishes.light)
    }
  }

  for (const x of [-7.8, 7.8]) {
    cylinder([0.035, 1.48, 0.035], [x, upper + 0.76, 9.7], finishes.brass)
    cylinder([0.25, 0.03, 0.25], [x, upper + 0.03, 9.7], finishes.charcoal)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.31, 0.45, 24, 1, true), finishes.linen)
    shade.position.set(x, upper + 1.53, 9.7)
    scene.add(shade)
  }

  const upstairsLight = new THREE.DirectionalLight('#f5e8cf', 0.65)
  upstairsLight.position.set(2, 7.3, 5)
  upstairsLight.target.position.set(2, upper, 5)
  scene.add(upstairsLight, upstairsLight.target)

  // Roof: timber deck, black perimeter rail, outdoor tables and grey two-seat sofas.
  for (let z = -9.75; z < 13.9; z += 0.16) {
    const inStairs = z > STAIRCASE.startZ && z < STAIRCASE.landingEndZ
    if (inStairs) {
      box([3.25, 0.005, 0.009], [-8.35, roof + 0.003, z], finishes.walnut)
      box([13.7, 0.005, 0.009], [3.15, roof + 0.003, z], finishes.walnut)
    } else {
      box([19.7, 0.005, 0.009], [0, roof + 0.003, z], finishes.walnut)
    }
  }

  for (const x of [-9.8, 9.8]) {
    solid([0.08, 1.15, 23.7], [x, roof + 0.575, 2], finishes.glass)
    box([0.055, 0.045, 23.7], [x, roof + 1.15, 2], finishes.charcoal)
    for (let z = -9.7; z < 14; z += 1.18) box([0.026, 1.15, 0.026], [x, roof + 0.575, z], finishes.charcoal)
  }

  for (const z of [-9.8, 13.8]) {
    solid([19.7, 1.15, 0.08], [0, roof + 0.575, z], finishes.glass)
    box([19.7, 0.045, 0.055], [0, roof + 1.15, z], finishes.charcoal)
    for (let x = -9.7; x < 10; x += 1.18) box([0.026, 1.15, 0.026], [x, roof + 0.575, z], finishes.charcoal)
  }

  for (const x of [STAIRCASE.leftX - 0.74, STAIRCASE.rightX + 0.74]) {
    solid([0.06, 1.1, 5.65], [x, roof + 0.55, 6.575], finishes.charcoal)
  }

  solid([3.15, 1.1, 0.06], [-5.2, roof + 0.55, 9.42], finishes.charcoal)
  solid([1.4, 1.1, 0.06], [STAIRCASE.leftX, roof + 0.55, 3.72], finishes.charcoal)

  for (const x of [-7.8, -4.35, -0.9, 2.55, 6]) {
    for (const z of [-6.3, -2]) {
      roundTable(x, z, 0.58, roof, true)
      chair(x, z - 0.9, Math.PI, false, roof, true)
      chair(x, z + 0.9, 0, false, roof, true)
      chair(x - 0.9, z, -Math.PI / 2, false, roof, true)
      chair(x + 0.9, z, Math.PI / 2, false, roof, true)

      if (z < -3 || x === -0.9) {
        cylinder([0.027, 2.7, 0.027], [x, roof + 1.35, z], finishes.charcoal)
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.48, 8, 1, true), finishes.linen)
        canopy.material.side = THREE.DoubleSide
        canopy.position.set(x, roof + 2.75, z)
        canopy.castShadow = true
        scene.add(canopy)
      }
    }
  }

  const outdoorFabric = new THREE.MeshStandardMaterial({ color: '#8e9390', roughness: 0.98 })

  function sofa(x: number, z: number, yaw: number) {
    const local = (dx: number, y: number, dz: number): Point => [
      x + Math.cos(yaw) * dx + Math.sin(yaw) * dz,
      roof + y,
      z - Math.sin(yaw) * dx + Math.cos(yaw) * dz,
    ]
    box([1.65, 0.11, 0.7], local(0, 0.37, 0), finishes.charcoal, yaw)
    box([1.65, 0.5, 0.07], local(0, 0.72, 0.34), finishes.charcoal, yaw)

    for (const side of [-1, 1]) {
      box([0.76, 0.16, 0.64], local(side * 0.405, 0.5, -0.02), outdoorFabric, yaw)
      box([0.75, 0.4, 0.16], local(side * 0.405, 0.79, 0.24), outdoorFabric, yaw)
      box([0.04, 0.04, 0.72], local(side * 0.85, 0.68, 0), finishes.charcoal, yaw)
      for (const dz of [-0.29, 0.29]) box([0.04, 0.38, 0.04], local(side * 0.77, 0.19, dz), finishes.charcoal, yaw)
    }

    const sideways = Math.abs(Math.sin(yaw)) > 0.5
    obstacles.push({ x, z, width: sideways ? 0.85 : 1.78, depth: sideways ? 1.78 : 0.85, minY: roof, maxY: roof + 1 })
  }

  for (const z of [1.4, 3.9, 6.4, 8.9, 11.4]) sofa(8.65, z, -Math.PI / 2)
  for (const x of [-8, -5.85, 5.85, 8]) sofa(x, 12.7, Math.PI)
  for (const z of [1.7, 4.2, 6.7, 9.2]) sofa(-8.65, z, Math.PI / 2)

  solid([4.6, 0.42, 0.65], [0.5, roof + 0.21, 12.2], finishes.oak)
  solid([4.6, 0.92, 0.14], [0.5, roof + 0.88, 12.43], finishes.oak)
  panel(
    4.1,
    0.58,
    [0.5, roof + 0.91, 12.34],
    Math.PI,
    (ctx, w, h) => {
      ctx.fillStyle = '#263830'
      ctx.font = canvasFont(h * 0.44, 600)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('소복다방', w / 2, h / 2)
    },
    true,
  )
  for (const x of [-3.7, 3.7]) plant(x, 12.8, 1.15, roof)

  for (const level of [0, upper, roof]) {
    const text = ['1F · COFFEE BAR', '2F · LOUNGE', '3F · ROOFTOP'][level / FLOOR_HEIGHT]
    panel(1.35, 0.35, [-5.2, level + 1.9, 3.68], Math.PI, (ctx, w, h) => {
      ctx.fillStyle = '#efe5d2'
      ctx.font = canvasFont(h * 0.32, 500)
      ctx.textAlign = 'center'
      ctx.fillText(text, w / 2, h * 0.55)
    })

    for (const [x, label] of [
      [STAIRCASE.leftX, '위층 ↑'],
      [STAIRCASE.rightX, '↓ 아래층'],
    ] as const) {
      if ((level === 0 && x === STAIRCASE.rightX) || (level === roof && x === STAIRCASE.leftX)) continue
      panel(0.9, 0.23, [x, level + 2.2, 3.72], Math.PI, (ctx, w, h) => {
        ctx.fillStyle = '#efe5d2'
        ctx.font = canvasFont(h * 0.5, 500)
        ctx.textAlign = 'center'
        ctx.fillText(label, w / 2, h * 0.7)
      })
    }
  }

  // The garden and mountain backdrop can be viewed from each level; the playable boundary stays on the building.
  solid([65, 0.15, 44], [4, -0.2, 24], finishes.foliage, false)
  solid([26, 0.045, 3.1], [1, -0.08, 15.6], finishes.floor, false)
  solid([3.4, 0.045, 22], [11.6, -0.08, 4], finishes.floor, false)

  for (let i = 0; i < 10; i++) {
    const x = -16 + i * 4.8
    const z = 20 + (i % 3) * 2.4
    cylinder([0.11, 2.7, 0.11], [x, 1.25, z], finishes.walnut)
    part('leaf', [1.75, 1.9, 1.65], [x, 3.2, z], finishes.foliage, i)
  }

  for (let i = 0; i < 7; i++) {
    const x = 16.5 + (i % 2) * 2.4
    const z = -6 + i * 3.8
    cylinder([0.1, 2.8, 0.1], [x, 1.3, z], finishes.walnut)
    part('leaf', [1.55, 1.7, 1.6], [x, 3.2, z], finishes.foliage, i)
    part('leaf', [0.9, 1.1, 1.05], [x + 0.8, 3.9, z - 0.3], finishes.foliage, i)
    part('leaf', [0.95, 0.4, 0.7], [13.9, 0.3, z], finishes.foliage, i)
  }

  const terrain = new THREE.PlaneGeometry(176, 160, 112, 100)
  terrain.rotateX(-Math.PI / 2)
  terrain.translate(0, 0, 40)
  const terrainPoints = terrain.attributes.position
  const terrainColors = new Float32Array(terrainPoints.count * 3)
  const forest = new THREE.Color('#516b4b')
  const ridge = new THREE.Color('#7d8b70')
  const granite = new THREE.Color('#bcc0b1')
  const tint = new THREE.Color()

  for (let i = 0; i < terrainPoints.count; i++) {
    const x = terrainPoints.getX(i)
    const z = terrainPoints.getZ(i)
    const peak = (px: number, pz: number, width: number, height: number) =>
      Math.exp(-(((x - px) / width) ** 2) - ((z - pz) / (width * 0.8)) ** 2) * height
    const mountain = Math.max(peak(-14, 72, 21, 35), peak(10, 79, 15, 41), peak(28, 70, 13, 31), peak(66, 6, 25, 25))
    const clearance = THREE.MathUtils.clamp((Math.max(Math.abs(x) - 15, z - 18) - 4) / 18, 0, 1)
    const folds = Math.sin(x * 0.27 + z * 0.1) * 1.5 + Math.sin(z * 0.44 - x * 0.17) * 0.8
    const y = clearance * (3 + mountain + folds) - 0.3
    terrainPoints.setY(i, y)
    tint.copy(forest).lerp(ridge, THREE.MathUtils.clamp(y / 35, 0, 0.75))
    if (mountain > 24 && Math.sin(x * 0.8 + z * 0.2) > -0.3) tint.lerp(granite, 0.65)
    tint.multiplyScalar(0.95 + Math.sin(x * 1.7 + z * 2.3) * 0.06)
    terrainColors.set([tint.r, tint.g, tint.b], i * 3)
  }

  terrain.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3))
  terrain.computeVertexNormals()
  const landscape = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }))
  scene.add(landscape)
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 4
  skyCanvas.height = 256
  const skyContext = skyCanvas.getContext('2d')!
  const skyGradient = skyContext.createLinearGradient(0, 0, 0, 256)
  skyGradient.addColorStop(0, '#7e9eae')
  skyGradient.addColorStop(0.5, '#c9d7d8')
  skyGradient.addColorStop(1, '#e1e5d9')
  skyContext.fillStyle = skyGradient
  skyContext.fillRect(0, 0, 4, 256)
  const skyMap = new THREE.CanvasTexture(skyCanvas)
  skyMap.colorSpace = THREE.SRGBColorSpace
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(145, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, fog: false, toneMapped: false }),
  )
  sky.position.y = 10
  scene.add(sky)

  const transform = new THREE.Object3D()
  const geometries = {
    box: new RoundedBoxGeometry(1, 1, 1, 2, 0.025),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 20),
    leaf: new THREE.IcosahedronGeometry(1, 1),
  }

  for (const [material, shapes] of batches) {
    for (const [shape, parts] of shapes) {
      const mesh = new THREE.InstancedMesh(geometries[shape], material, parts.length)

      parts.forEach(({ size, position, yaw }, index) => {
        transform.position.fromArray(position)
        transform.scale.fromArray(size)
        transform.rotation.set(0, yaw, 0)
        transform.updateMatrix()
        mesh.setMatrixAt(index, transform.matrix)
      })

      mesh.castShadow = material !== finishes.glass && material !== finishes.light
      mesh.receiveShadow = mesh.castShadow
      mesh.computeBoundingSphere()
      scene.add(mesh)
    }
  }

  return { finishes, obstacles, occluders }
}
