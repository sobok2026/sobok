import * as THREE from 'three'
import { canvasFont } from './canvas-text'
import {
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from './equipment-geometry'

export const iceScoopSizes = ['tall', 'grande', 'venti'] as const
export type IceScoopSize = (typeof iceScoopSizes)[number]
export const iceScoopScale = { tall: 0.82, grande: 1, venti: 1.18 } as const

/** Open polycarbonate scoop. The handle points along +Z; these proportions are visual, not dosing rules. */
export function createIceScoop(parent: THREE.Object3D, size: IceScoopSize) {
  const root = new THREE.Group()
  root.name = `${size} translucent ice scoop`
  root.scale.setScalar(iceScoopScale[size])
  parent.add(root)
  const plastic = material({
    color: '#d9e9ed',
    transparent: true,
    opacity: 0.32,
    roughness: 0.18,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const edge = material({ color: '#b6cfd9', transparent: true, opacity: 0.8, roughness: 0.2, depthWrite: false })
  const vertices: number[] = [],
    indices: number[] = []
  const rows = 14,
    columns = 20
  const left: [number, number, number][] = [],
    right: [number, number, number][] = []

  for (let row = 0; row <= rows; row++) {
    const t = row / rows,
      z = 0.025 - t * 0.19
    const radius = 0.052 * (0.92 + Math.sin(t * Math.PI) * 0.08)
    const bottom = -0.029 + t ** 4 * 0.01
    const sideHeight = 0.066 * (1 - t ** 3 * 0.76)
    left.push([-radius, bottom + sideHeight, z])
    right.push([radius, bottom + sideHeight, z])

    for (let column = 0; column <= columns; column++) {
      const across = (column / columns) * 2 - 1
      vertices.push(across * radius, bottom + sideHeight * Math.abs(across) ** 5, z)

      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + columns + 1
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }

  const bowl = new THREE.BufferGeometry()
  bowl.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  bowl.setIndex(indices)
  bowl.computeVertexNormals()
  mesh(root, bowl, plastic)
  tube(root, left, 0.0024, edge)
  tube(root, right, 0.0024, edge)
  const front = Array.from({ length: columns + 1 }, (_, i) => {
    const start = (rows * (columns + 1) + i) * 3
    return [vertices[start], vertices[start + 1], vertices[start + 2]] as [number, number, number]
  })
  tube(root, front, 0.002, edge)
  const rearShape = new THREE.Shape()
  rearShape.moveTo(vertices[0], vertices[1])
  for (let i = 1; i <= columns; i++) rearShape.lineTo(vertices[i * 3], vertices[i * 3 + 1])
  rearShape.closePath()
  mesh(root, new THREE.ShapeGeometry(rearShape), plastic, [0, 0, 0.025])
  tube(
    root,
    [
      [-0.0478, 0.037, 0.025],
      [0, 0.037, 0.025],
      [0.0478, 0.037, 0.025],
    ],
    0.0025,
    edge,
  )

  const handle = new THREE.Shape()
  handle.moveTo(-0.022, 0.018)
  handle.lineTo(0.022, 0.018)
  handle.quadraticCurveTo(0.014, 0.054, 0.014, 0.081)
  handle.lineTo(0.014, 0.187)
  handle.quadraticCurveTo(0.014, 0.202, 0, 0.202)
  handle.quadraticCurveTo(-0.014, 0.202, -0.014, 0.187)
  handle.lineTo(-0.014, 0.081)
  handle.quadraticCurveTo(-0.014, 0.054, -0.022, 0.018)
  const hangingHole = new THREE.Path()
  hangingHole.absellipse(0, 0.184, 0.0042, 0.007, 0, Math.PI * 2, false, 0)
  handle.holes.push(hangingHole)
  const gripGeometry = new THREE.ExtrudeGeometry(handle, {
    depth: 0.006,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 8,
  })
  gripGeometry.rotateX(Math.PI / 2)
  mesh(root, gripGeometry, plastic, [0, 0.037, 0])
  const label = panel(root, 0.015, 0.02, [0, 0.038, 0.135], (ctx, w, h) => {
    ctx.fillStyle = '#3c626c'
    ctx.textAlign = 'center'
    ctx.font = canvasFont(h * 0.68, 600)
    ctx.fillText(size[0].toUpperCase(), w / 2, h * 0.79)
  })
  label.rotation.x = -Math.PI / 2
  return root
}
