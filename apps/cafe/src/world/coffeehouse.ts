import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { CUSTOMER_ENTRANCE, SHOP_BOUNDS, STATIONS, tableIds } from '../content/stations'
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
      obstacles.push({ x: position[0], z: position[2], width: size[0], depth: size[2] })
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
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
    )
    mesh.position.fromArray(position)
    mesh.rotation.y = yaw
    scene.add(mesh)
  }

  const width = SHOP_BOUNDS.maxX - SHOP_BOUNDS.minX
  const depth = SHOP_BOUNDS.maxZ - SHOP_BOUNDS.minZ
  const centerZ = (SHOP_BOUNDS.maxZ + SHOP_BOUNDS.minZ) / 2
  solid([width, 0.16, depth], [0, -0.09, centerZ], finishes.floor, false)
  solid([width, 0.18, depth], [0, 3.9, centerZ], finishes.ceiling, false)
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
    ctx.fillText('STARBUCKS', w / 2, h / 2)
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
  solid([5.9, 3.88, 0.26], [-6.8, 1.94, 8.55], finishes.brick)
  solid([0.26, 3.88, 4.75], [-3.72, 1.94, 6.3], finishes.brick)
  solid([3.25, 3.88, 0.24], [-8.22, 1.94, 3.95], finishes.charcoal)
  obstacles.push({ x: -5.05, z: 6.1, width: 2.3, depth: 4.4 })

  for (let step = 0; step < 13; step++) {
    const rise = 0.18 + step * 0.23
    box([2.15, rise, 0.31], [-5.05, rise / 2, 4.08 + step * 0.31], finishes.charcoal)
    box([2.18, 0.04, 0.33], [-5.05, rise + 0.02, 4.08 + step * 0.31], finishes.oak)
  }

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 4.82), finishes.brass)
  rail.position.set(-3.95, 2.5, 5.95)
  rail.rotation.x = -Math.atan2(2.76, 3.72)
  scene.add(rail)

  for (let i = 0; i < 5; i++) {
    box([0.035, 0.94, 0.035], [-3.95, 0.65 + i * 0.69, 4.08 + i * 0.93], finishes.charcoal)
  }
  panel(1.3, 0.42, [-3.57, 2.3, 7.15], Math.PI / 2, (ctx, w, h) => {
    ctx.fillStyle = '#e9e3d3'
    ctx.font = canvasFont(h * 0.33, 500)
    ctx.textAlign = 'center'
    ctx.fillText('2F  ↑', w / 2, h * 0.43)
    ctx.font = canvasFont(h * 0.2)
    ctx.fillText('SEATING', w / 2, h * 0.76)
  })

  function chair(x: number, z: number, yaw: number, lounge = false) {
    const local = (dx: number, y: number, dz: number): Point => [
      x + Math.cos(yaw) * dx + Math.sin(yaw) * dz,
      y,
      z - Math.sin(yaw) * dx + Math.cos(yaw) * dz,
    ]
    const spread = lounge ? 0.29 : 0.22

    for (const dx of [-spread, spread]) {
      for (const dz of [-spread, spread]) {
        box([0.045, 0.44, 0.045], local(dx, 0.24, dz), finishes.walnut, yaw)
      }
    }

    box([spread * 2 + 0.08, 0.09, spread * 2 + 0.07], local(0, 0.49, 0), finishes.leather, yaw)
    box([spread * 2 + 0.08, lounge ? 0.43 : 0.16, 0.065], local(0, 0.8, spread), finishes.walnut, yaw)

    for (const dx of [-spread, spread]) {
      box([0.035, 0.38, 0.045], local(dx, 0.67, spread), finishes.walnut, yaw)

      if (lounge) {
        box([0.05, 0.05, 0.65], local(dx + Math.sign(dx) * 0.06, 0.68, 0), finishes.walnut, yaw)
      }
    }

    if (lounge) box([0.57, 0.37, 0.065], local(0, 0.78, spread - 0.044), finishes.leather, yaw)
    obstacles.push({ x, z, width: lounge ? 0.8 : 0.58, depth: lounge ? 0.8 : 0.58 })
  }

  function roundTable(x: number, z: number, radius = 0.43) {
    cylinder([radius, 0.065, radius], [x, 0.8175, z], finishes.oak)
    cylinder([0.045, 0.73, 0.045], [x, 0.42, z], finishes.charcoal)
    cylinder([radius * 0.6, 0.045, radius * 0.6], [x, 0.043, z], finishes.charcoal)
    obstacles.push({ x, z, width: radius * 2, depth: radius * 2 })
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
    const z = 9.45 + i * 1.68
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
  solid([3.9, 2.8, 0.32], [-6.05, 1.4, 8.76], finishes.charcoal)

  for (const y of [0.38, 1.01, 1.64, 2.27]) {
    box([3.85, 0.045, 0.48], [-6.05, y, 8.99], finishes.oak)
    box([3.7, 0.014, 0.022], [-6.05, y + 0.045, 8.81], finishes.light)

    for (let i = 0; i < 11; i++) {
      const x = -7.68 + i * 0.32
      const color = [finishes.linen, finishes.foliage, finishes.leather][i % 3]
      cylinder([0.074, 0.24, 0.074], [x, y + 0.14, 8.99], color)
      cylinder([0.078, 0.025, 0.078], [x, y + 0.27, 8.99], finishes.charcoal)
    }
  }

  solid([2.7, 0.72, 1.04], [-4.85, 0.36, 11.45], finishes.walnut)
  box([2.78, 0.045, 1.1], [-4.85, 0.745, 11.45], finishes.counter)

  for (let i = 0; i < 8; i++) {
    box([0.22, 0.3, 0.12], [-5.95 + (i % 4) * 0.64, 0.92, 11.22 + Math.floor(i / 4) * 0.48], finishes.linen)
  }

  panel(2.8, 0.3, [-6.05, 2.62, 9.01], 0, (ctx, w, h) => {
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

  function plant(x: number, z: number, scale = 1) {
    cylinder([0.27 * scale, 0.46 * scale, 0.27 * scale], [x, 0.23 * scale, z], finishes.counter)

    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4
      part(
        'leaf',
        [0.24 * scale, (0.55 + (i % 3) * 0.12) * scale, 0.13 * scale],
        [x + Math.cos(angle) * 0.23 * scale, (0.77 + (i % 3) * 0.16) * scale, z + Math.sin(angle) * 0.23 * scale],
        finishes.foliage,
        angle,
      )
    }
  }

  plant(7.7, 11.8, 1.6)
  plant(-2.4, 12.4, 1.1)
  plant(7.65, 1.75, 1.2)

  // The garden is scenery beyond the first-floor glazing; the playable boundary stays indoors.
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

  const mountainMaterial = new THREE.MeshStandardMaterial({ color: '#768477', roughness: 1, flatShading: true })

  for (let i = 0; i < 7; i++) {
    const mountain = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mountainMaterial)
    mountain.scale.set(7 + (i % 2) * 2, 7 + (i % 3) * 2.6, 5.8)
    mountain.position.set(-22 + i * 8, 3.5, 40 + (i % 2) * 5)
    mountain.rotation.z = (i % 2) * 0.2
    scene.add(mountain)
  }

  for (let i = 0; i < 6; i++) {
    const mountain = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mountainMaterial)
    mountain.scale.set(6, 8 + (i % 3) * 3, 8)
    mountain.position.set(36 + (i % 2) * 4, 3.2, -14 + i * 10)
    mountain.rotation.z = -0.18
    scene.add(mountain)
  }

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
