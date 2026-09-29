import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { CUSTOMER_ENTRANCE, FLOOR_HEIGHT, SHOP_BOUNDS, STAIRCASE } from '../content/stations'
import { type Seat, TABLES } from '../content/tables'
import { canvasFont, paintTexture } from '../shared/visuals/canvas-text'
import type { Obstacle } from './collision'
import { createInteriorMaterials } from './interior-materials'

type Point = [number, number, number]
type Part = { size: Point; position: Point; yaw: number }

export function createCoffeehouse(scene: THREE.Scene) {
  const materials = createInteriorMaterials()
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
  const leftWall = SHOP_BOUNDS.minX + 0.1
  const rightWall = SHOP_BOUNDS.maxX - 0.1
  const frontWall = SHOP_BOUNDS.maxZ - 0.14
  const stairLeft = STAIRCASE.leftX - STAIRCASE.width / 2
  const stairRight = STAIRCASE.rightX + STAIRCASE.width / 2
  const stairCenter = (stairLeft + stairRight) / 2
  const stairDepth = STAIRCASE.landingEndZ - STAIRCASE.startZ
  const stairCenterZ = (STAIRCASE.startZ + STAIRCASE.landingEndZ) / 2
  solid([width, 0.16, depth], [0, -0.09, centerZ], materials.floor, false)

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
      solid([x1 - x0, 0.025, z1 - z0], [(x0 + x1) / 2, y - 0.1725, (z0 + z1) / 2], materials.ceiling, false)
    }
  }

  floorSlab(FLOOR_HEIGHT, materials.floor)
  floorSlab(FLOOR_HEIGHT * 2, materials.oak)
  solid([width, FLOOR_HEIGHT, 0.2], [0, FLOOR_HEIGHT / 2, -9.9], materials.ceiling)
  solid([0.2, FLOOR_HEIGHT, depth], [leftWall, FLOOR_HEIGHT / 2, centerZ], materials.plaster)
  solid([0.2, FLOOR_HEIGHT, 10], [rightWall, FLOOR_HEIGHT / 2, -4.9], materials.brick)
  solid([14.9, 0.09, 5.5], [2.05, 3.74, -3.1], materials.oak, false)
  solid([14.9, 0.28, 0.3], [2.05, 3.63, -0.38], materials.charcoal, false)
  solid([0.24, FLOOR_HEIGHT, 5.45], [9.4, FLOOR_HEIGHT / 2, -3.08], materials.brick)
  box([width, 0.12, 0.08], [0, 0.1, -9.75], materials.charcoal)
  box([0.08, 0.12, depth], [leftWall + 0.15, 0.1, centerZ], materials.charcoal)

  for (const x of [-5.3, 9.4]) {
    solid([0.3, FLOOR_HEIGHT, 0.38], [x, FLOOR_HEIGHT / 2, -0.44], materials.charcoal)
    for (let offset = -0.12; offset <= 0.12; offset += 0.055)
      box([0.027, 3.9, 0.035], [x + offset, 1.95, -0.23], materials.walnut)
  }

  for (const baseY of [0, FLOOR_HEIGHT]) {
    const windowStart = baseY ? SHOP_BOUNDS.minZ : 0
    const windowDepth = SHOP_BOUNDS.maxZ - windowStart
    for (let x = leftWall + 0.1; x < rightWall; x += 2.8) {
      if (baseY === 0 && Math.abs(x - CUSTOMER_ENTRANCE.x) < 1.1) continue
      box([0.065, 3.78, 0.14], [x, baseY + 1.9, frontWall], materials.charcoal)
    }
    for (let z = windowStart; z <= SHOP_BOUNDS.maxZ; z += 2.8)
      box([0.14, 3.78, 0.065], [rightWall, baseY + 1.9, z], materials.charcoal)
    for (const y of [0.07, 3.76]) {
      box([width - 0.4, 0.1, 0.15], [0, baseY + y, frontWall], materials.charcoal)
      box([0.15, 0.1, windowDepth], [rightWall, baseY + y, windowStart + windowDepth / 2], materials.charcoal)
    }
    box([width - 0.4, 3.65, 0.016], [0, baseY + 1.9, frontWall + 0.04], materials.glass)
    box(
      [0.016, 3.65, windowDepth - 0.2],
      [rightWall + 0.04, baseY + 1.9, windowStart + windowDepth / 2],
      materials.glass,
    )
  }

  for (const x of [CUSTOMER_ENTRANCE.x - 0.95, CUSTOMER_ENTRANCE.x, CUSTOMER_ENTRANCE.x + 0.95])
    box([0.045, 2.7, 0.12], [x, 1.38, frontWall - 0.05], materials.charcoal)
  for (const x of [CUSTOMER_ENTRANCE.x - 0.15, CUSTOMER_ENTRANCE.x + 0.15])
    cylinder([0.016, 0.6, 0.016], [x, 1.18, frontWall - 0.14], materials.brass)
  box([1.95, 0.045, 0.12], [CUSTOMER_ENTRANCE.x, 2.74, frontWall - 0.05], materials.charcoal)
  box([2.3, 0.012, 1.2], [CUSTOMER_ENTRANCE.x, 0.012, frontWall - 0.7], materials.charcoal)
  panel(2.7, 0.45, [CUSTOMER_ENTRANCE.x, 3.13, frontWall - 0.1], Math.PI, (ctx, w, h) => {
    ctx.fillStyle = '#efece0'
    ctx.font = canvasFont(h * 0.37, 600)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('소복다방', w / 2, h / 2)
  })

  for (const z of [-7.5, -3.6, 0.5, 4.5, 8.4, 12.1, 17.2]) {
    for (const x of [-10, -6.3, -2.6, 1.1, 4.8, 8.5]) {
      const y = z < -1 && z > -5.85 ? 3.68 : 3.79
      cylinder([0.12, 0.025, 0.12], [x, y, z], materials.charcoal)
      cylinder([0.085, 0.026, 0.085], [x, y - 0.015, z], materials.light)
    }
  }

  for (const z of [-3, 5.2, 10.8]) {
    for (const x of [-2, 5.5]) {
      cylinder([0.2, 0.028, 0.2], [x, 3.79, z], materials.charcoal)
      cylinder([0.17, 0.033, 0.17], [x, 3.77, z], materials.ceiling)
    }
  }

  box([0.04, 0.02, 24], [0.3, 3.78, 7], materials.light)
  box([0.18, 0.25, 24], [0.4, 3.66, 7], materials.walnut)

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
  const stairRun = STAIRCASE.endZ - STAIRCASE.startZ

  for (const base of [0, FLOOR_HEIGHT]) {
    const landingY = base + FLOOR_HEIGHT / 2
    solid(
      [stairRight - stairLeft, 0.18, STAIRCASE.landingEndZ - STAIRCASE.endZ],
      [stairCenter, landingY - 0.09, (STAIRCASE.endZ + STAIRCASE.landingEndZ) / 2],
      materials.oak,
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
          materials.oak,
        )
        for (const side of [-1, 1]) {
          box(
            [0.025, 0.92, 0.025],
            [x + side * (STAIRCASE.width / 2 - 0.025), y + 0.45, STAIRCASE.startZ + progress * stairRun],
            materials.charcoal,
          )
        }
      }

      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, Math.hypot(stairRun, 2)), materials.walnut)
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

  const stairWallHeight = FLOOR_HEIGHT * 2 + 1.1
  solid(
    [0.24, stairWallHeight, STAIRCASE.endZ - STAIRCASE.startZ],
    [stairCenter, stairWallHeight / 2, (STAIRCASE.startZ + STAIRCASE.endZ) / 2],
    materials.charcoal,
  )
  solid(
    [0.24, stairWallHeight, stairDepth + 0.2],
    [stairLeft - 0.13, stairWallHeight / 2, stairCenterZ],
    materials.brick,
  )
  solid(
    [0.24, stairWallHeight, stairDepth + 0.2],
    [stairRight + 0.13, stairWallHeight / 2, stairCenterZ],
    materials.brick,
  )
  solid(
    [stairRight - stairLeft + 0.5, stairWallHeight, 0.24],
    [stairCenter, stairWallHeight / 2, STAIRCASE.landingEndZ + 0.13],
    materials.brick,
  )

  solid([1.9, 0.82, 1.25], [-10.6, 0.41, 4.1], materials.oak)
  for (let i = 0; i < 6; i++)
    part('leaf', [0.3, 0.18 + (i % 3) * 0.12, 0.43], [-11.3 + i * 0.28, 0.96, 4.1], materials.brass, i)
  panel(1.3, 0.42, [stairRight + 0.26, 2.3, 7.3], Math.PI / 2, (ctx, w, h) => {
    ctx.fillStyle = '#e9e3d3'
    ctx.font = canvasFont(h * 0.33, 500)
    ctx.textAlign = 'center'
    ctx.fillText('2F  ↑', w / 2, h * 0.43)
    ctx.font = canvasFont(h * 0.2)
    ctx.fillText('SEATING', w / 2, h * 0.76)
  })

  const outdoorFabric = new THREE.MeshStandardMaterial({ color: '#8e9390', roughness: 0.98 })

  function seating(item: Seat, baseY: number, outdoor: boolean) {
    const { x, z, yaw, kind } = item
    const local = (dx: number, y: number, dz: number): Point => [
      x + Math.cos(yaw) * dx + Math.sin(yaw) * dz,
      baseY + y,
      z - Math.sin(yaw) * dx + Math.cos(yaw) * dz,
    ]
    const frame = outdoor ? materials.charcoal : materials.walnut
    const fabric = outdoor ? outdoorFabric : materials.leather
    const width = kind === 'sofa' ? 1.8 : 0.64
    const depth = kind === 'lounge' || kind === 'sofa' ? 0.78 : 0.57
    const seatHeight = kind === 'stool' ? 0.65 : 0.5

    if (kind === 'bench') {
      box([0.92, 0.4, 0.7], local(0, 0.25, 0), materials.oak, yaw)
      box([0.9, 0.12, 0.68], local(0, 0.51, -0.01), materials.linen, yaw)
      box([0.9, 0.48, 0.12], local(0, 0.82, 0.3), materials.linen, yaw)
    } else {
      for (const dx of [-width / 2 + 0.06, width / 2 - 0.06]) {
        for (const dz of [-depth / 2 + 0.06, depth / 2 - 0.06]) {
          box([0.045, seatHeight - 0.05, 0.045], local(dx, seatHeight / 2 - 0.025, dz), frame, yaw)
        }
      }
      box([width, 0.09, depth], local(0, seatHeight, 0), fabric, yaw)
      if (kind !== 'stool') {
        for (const dx of [-width / 2 + 0.035, width / 2 - 0.035]) {
          box([0.035, 0.4, 0.045], local(dx, seatHeight + 0.18, depth / 2 - 0.025), frame, yaw)
        }
        box(
          [width, kind === 'chair' ? 0.16 : 0.43, 0.065],
          local(0, seatHeight + 0.31, depth / 2),
          kind === 'chair' ? frame : fabric,
          yaw,
        )
        if (kind === 'lounge' || kind === 'sofa') {
          for (const dx of [-width / 2 - 0.025, width / 2 + 0.025])
            box([0.04, 0.055, depth], local(dx, seatHeight + 0.19, 0), frame, yaw)
        }
      }
    }
    obstacles.push({
      x,
      z,
      width: kind === 'bench' ? 0.92 : width + 0.07,
      depth: kind === 'bench' ? 0.76 : depth + 0.07,
      yaw,
      minY: baseY,
      maxY: baseY + (kind === 'stool' ? 0.72 : 1.06),
      blocksSight: true,
    })
  }

  for (const table of Object.values(TABLES)) {
    const baseY = table.floor * FLOOR_HEIGHT
    const outdoor = table.floor === 2
    const top = outdoor ? materials.counter : materials.oak
    if (table.shape === 'round') {
      cylinder([table.width / 2, 0.065, table.width / 2], [table.x, baseY + table.height - 0.0325, table.z], top)
      cylinder([0.045, table.height - 0.1, 0.045], [table.x, baseY + table.height / 2, table.z], materials.charcoal)
      cylinder([table.width * 0.28, 0.045, table.width * 0.28], [table.x, baseY + 0.035, table.z], materials.charcoal)
    } else {
      box([table.width, 0.065, table.depth], [table.x, baseY + table.height - 0.0325, table.z], top)
      if (table.legs) {
        for (const dx of [-table.width * 0.37, table.width * 0.37]) {
          for (const dz of [-table.depth * 0.35, table.depth * 0.35])
            box(
              [0.045, table.height - 0.07, 0.045],
              [table.x + dx, baseY + table.height / 2 - 0.035, table.z + dz],
              materials.charcoal,
            )
        }
      }
    }
    obstacles.push({
      x: table.x,
      z: table.z,
      width: table.width,
      depth: table.depth,
      minY: baseY,
      maxY: baseY + table.height,
      ...(table.shape === 'round' ? { radius: table.width / 2 } : {}),
    })
    for (const item of table.seats) seating(item, baseY, outdoor)
  }

  // Merchandise occupies the left side of the arrival gallery.
  solid([3.9, 2.8, 0.6], [-5.9, 1.4, 11.52], materials.charcoal)

  for (const y of [0.38, 1.01, 1.64, 2.27]) {
    box([3.85, 0.045, 0.48], [-5.9, y, 11.82], materials.oak)
    box([3.7, 0.014, 0.022], [-5.9, y + 0.045, 11.53], materials.light)

    for (let i = 0; i < 11; i++) {
      const x = -7.53 + i * 0.32
      const color = [materials.linen, materials.foliage, materials.leather][i % 3]
      cylinder([0.074, 0.24, 0.074], [x, y + 0.14, 11.82], color)
      cylinder([0.078, 0.025, 0.078], [x, y + 0.27, 11.82], materials.charcoal)
    }
  }

  solid([2.7, 0.72, 1.04], [-5.25, 0.36, 15], materials.walnut)
  box([2.78, 0.045, 1.1], [-5.25, 0.745, 15], materials.counter)

  for (let i = 0; i < 8; i++) {
    box([0.22, 0.3, 0.12], [-6.35 + (i % 4) * 0.64, 0.92, 14.77 + Math.floor(i / 4) * 0.48], materials.linen)
  }

  panel(2.8, 0.3, [-5.9, 2.62, 11.84], 0, (ctx, w, h) => {
    ctx.fillStyle = '#ece3d2'
    ctx.font = canvasFont(h * 0.45, 500)
    ctx.textAlign = 'center'
    ctx.fillText('COFFEE  &  EVERYDAY', w / 2, h * 0.69)
  })

  for (const z of [13.4, 17.4]) {
    box([0.08, 1.44, 1.44], [leftWall + 0.16, 2.25, z], materials.charcoal)
    panel(1.33, 1.33, [leftWall + 0.22, 2.25, z], Math.PI / 2, (ctx, w, h) => {
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

  function plant(x: number, z: number, scale = 1, baseY = 0) {
    cylinder([0.27 * scale, 0.46 * scale, 0.27 * scale], [x, baseY + 0.23 * scale, z], materials.counter)
    obstacles.push({
      x,
      z,
      width: 0.6 * scale,
      depth: 0.6 * scale,
      radius: 0.3 * scale,
      minY: baseY,
      maxY: baseY + 1.2 * scale,
      blocksSight: true,
    })

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
        materials.foliage,
        angle,
      )
    }
  }

  plant(7.9, 9, 1.15)
  plant(-3.3, 18.8, 1.1)
  plant(10.9, 7.0, 1.05)

  const upper = FLOOR_HEIGHT
  const roof = FLOOR_HEIGHT * 2
  solid([width - 0.2, FLOOR_HEIGHT, 0.18], [0, upper + FLOOR_HEIGHT / 2, -9.85], materials.plaster)
  solid([0.18, FLOOR_HEIGHT, depth - 0.2], [leftWall, upper + FLOOR_HEIGHT / 2, centerZ], materials.brick)
  for (const z of [-6.3, 5.5, 16.1])
    solid([0.36, FLOOR_HEIGHT, 0.36], [rightWall - 0.1, upper + FLOOR_HEIGHT / 2, z], materials.charcoal)

  for (const [x, z] of [
    [-6.0, -6.0],
    [11.0, 18.5],
    [-11.1, 8.3],
  ])
    plant(x, z, 1.3, upper)

  for (const x of [-7.5, -0.5, 6.5]) {
    for (const z of [-6.5, -0.5, 5.5, 11.5]) {
      cylinder([0.11, 0.025, 0.11], [x, upper + 3.79, z], materials.charcoal)
      cylinder([0.075, 0.03, 0.075], [x, upper + 3.77, z], materials.light)
    }
  }

  for (const x of [-11.0, 11.0]) {
    cylinder([0.035, 1.48, 0.035], [x, upper + 0.76, 9.7], materials.brass)
    cylinder([0.25, 0.03, 0.25], [x, upper + 0.03, 9.7], materials.charcoal)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.31, 0.45, 24, 1, true), materials.linen)
    shade.position.set(x, upper + 1.53, 9.7)
    scene.add(shade)
    obstacles.push({
      x,
      z: 9.7,
      width: 0.5,
      depth: 0.5,
      radius: 0.25,
      minY: upper,
      maxY: upper + 1.8,
      blocksSight: true,
    })
  }

  const upstairsLight = new THREE.DirectionalLight('#f5e8cf', 0.65)
  upstairsLight.position.set(2, 7.3, 5)
  upstairsLight.target.position.set(2, upper, 5)
  scene.add(upstairsLight, upstairsLight.target)

  for (let z = SHOP_BOUNDS.minZ + 0.25; z < frontWall; z += 0.16) {
    if (z > STAIRCASE.startZ && z < STAIRCASE.landingEndZ) {
      box([stairLeft - leftWall, 0.005, 0.009], [(leftWall + stairLeft) / 2, roof + 0.003, z], materials.walnut)
      box([rightWall - stairRight, 0.005, 0.009], [(rightWall + stairRight) / 2, roof + 0.003, z], materials.walnut)
    } else box([width - 0.3, 0.005, 0.009], [0, roof + 0.003, z], materials.walnut)
  }
  for (const x of [leftWall, rightWall]) {
    solid([0.09, 1.15, depth - 0.3], [x, roof + 0.575, centerZ], materials.glass)
    box([0.055, 0.045, depth - 0.3], [x, roof + 1.15, centerZ], materials.charcoal)
    for (let z = SHOP_BOUNDS.minZ + 0.3; z < frontWall; z += 1.18)
      box([0.026, 1.15, 0.026], [x, roof + 0.575, z], materials.charcoal)
  }
  for (const z of [SHOP_BOUNDS.minZ + 0.2, frontWall]) {
    solid([width - 0.3, 1.15, 0.09], [0, roof + 0.575, z], materials.glass)
    box([width - 0.3, 0.045, 0.055], [0, roof + 1.15, z], materials.charcoal)
    for (let x = leftWall + 0.1; x < rightWall; x += 1.18)
      box([0.026, 1.15, 0.026], [x, roof + 0.575, z], materials.charcoal)
  }
  solid([STAIRCASE.width, 1.1, 0.15], [STAIRCASE.leftX, roof + 0.55, STAIRCASE.startZ - 0.09], materials.charcoal)

  const canopyMaterial = new THREE.MeshStandardMaterial({ color: '#ddd5c3', roughness: 0.9, side: THREE.DoubleSide })
  for (const table of Object.values(TABLES)) {
    if (table.floor !== 2 || !table.name.startsWith('루프탑 테이블') || table.z > -3) continue
    cylinder([0.027, 2.7, 0.027], [table.x, roof + 1.35, table.z], materials.charcoal)
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.48, 8, 1, true), canopyMaterial)
    canopy.position.set(table.x, roof + 2.75, table.z)
    canopy.castShadow = true
    scene.add(canopy)
  }

  solid([4.6, 0.42, 0.65], [0.5, roof + 0.21, 18.35], materials.oak)
  solid([4.6, 0.92, 0.14], [0.5, roof + 0.88, 18.58], materials.oak)
  panel(
    4.1,
    0.58,
    [0.5, roof + 0.91, 18.49],
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
  for (const x of [-3.7, 3.7]) plant(x, 18.85, 1.15, roof)

  for (const level of [0, upper, roof]) {
    const text = ['1F · COFFEE BAR', '2F · LOUNGE', '3F · ROOFTOP'][level / FLOOR_HEIGHT]
    panel(0.8, 0.23, [stairCenter, level + 1.9, STAIRCASE.startZ - 0.13], Math.PI, (ctx, w, h) => {
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
      panel(0.72, 0.18, [x, level + 2.45, STAIRCASE.startZ - 0.13], Math.PI, (ctx, w, h) => {
        ctx.fillStyle = '#efe5d2'
        ctx.font = canvasFont(h * 0.5, 500)
        ctx.textAlign = 'center'
        ctx.fillText(label, w / 2, h * 0.7)
      })
    }
  }

  // The garden and mountain backdrop can be viewed from each level; the playable boundary stays on the building.
  solid([65, 0.15, 44], [4, -0.2, 24], materials.foliage, false)
  solid([26, 0.045, 3.1], [1, -0.08, frontWall + 1.8], materials.floor, false)
  solid([3.4, 0.045, 22], [rightWall + 1.8, -0.08, 5], materials.floor, false)

  for (let i = 0; i < 10; i++) {
    const x = -16 + i * 4.8
    const z = 26 + (i % 3) * 2.4
    cylinder([0.11, 2.7, 0.11], [x, 1.25, z], materials.walnut)
    part('leaf', [1.75, 1.9, 1.65], [x, 3.2, z], materials.foliage, i)
  }

  for (let i = 0; i < 7; i++) {
    const x = 16.5 + (i % 2) * 2.4
    const z = -6 + i * 3.8
    cylinder([0.1, 2.8, 0.1], [x, 1.3, z], materials.walnut)
    part('leaf', [1.55, 1.7, 1.6], [x, 3.2, z], materials.foliage, i)
    part('leaf', [0.9, 1.1, 1.05], [x + 0.8, 3.9, z - 0.3], materials.foliage, i)
    part('leaf', [0.95, 0.4, 0.7], [13.9, 0.3, z], materials.foliage, i)
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

      mesh.castShadow = material !== materials.glass && material !== materials.light
      mesh.receiveShadow = mesh.castShadow
      mesh.computeBoundingSphere()
      scene.add(mesh)
    }
  }

  return { materials, obstacles, occluders }
}
