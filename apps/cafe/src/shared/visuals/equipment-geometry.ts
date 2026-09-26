import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { paintTexture } from './canvas-text'

type Point = [number, number, number]

export function equipmentMaterial(parameters: THREE.MeshStandardMaterialParameters) {
  const material = new THREE.MeshStandardMaterial(parameters)

  if ((parameters.metalness ?? 0) > 0.7 && (parameters.roughness ?? 1) >= 0.2) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')!
    context.fillStyle = '#c8c8c8'
    context.fillRect(0, 0, 256, 256)
    let seed = 173

    for (let y = 0; y < 256; y++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const shade = 210 + ((seed >>> 24) % 15)
      context.fillStyle = `rgb(${shade} ${shade} ${shade})`
      context.fillRect(0, y, 256, 1)
    }

    const grain = new THREE.CanvasTexture(canvas)
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(1, 3)
    material.roughnessMap = grain
    material.bumpMap = grain
    material.bumpScale = 0.00003
  }

  material.userData.equipment = true
  return material
}

export function equipmentMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: Point = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.fromArray(position)
  mesh.castShadow = !material.transparent
  mesh.receiveShadow = !material.transparent
  parent.add(mesh)
  return mesh
}

export function equipmentBox(
  parent: THREE.Object3D,
  size: Point,
  position: Point,
  material: THREE.Material,
  radius = 0.012,
) {
  return equipmentMesh(
    parent,
    new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map((value) => value / 2))),
    material,
    position,
  )
}

export function equipmentLathe(
  parent: THREE.Object3D,
  profile: [number, number][],
  material: THREE.Material,
  position: Point = [0, 0, 0],
) {
  return equipmentMesh(
    parent,
    new THREE.LatheGeometry(
      profile.map(([x, y]) => new THREE.Vector2(x, y)),
      48,
    ),
    material,
    position,
  )
}

export function equipmentTube(parent: THREE.Object3D, points: Point[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    'centripetal',
  )
  return equipmentMesh(parent, new THREE.TubeGeometry(curve, 24, radius, 8, false), material)
}

/** A hollow, rounded stainless well with a floor and rolled lip. Origin is its base. */
export function equipmentBasin(
  parent: THREE.Object3D,
  width: number,
  depth: number,
  height: number,
  material: THREE.Material,
  cornerRadius = 0.045,
) {
  const root = new THREE.Group()
  parent.add(root)

  function outline(path: THREE.Path, w: number, d: number, radius: number) {
    const x = w / 2,
      z = d / 2
    path.moveTo(-x + radius, -z)
    path.lineTo(x - radius, -z)
    path.quadraticCurveTo(x, -z, x, -z + radius)
    path.lineTo(x, z - radius)
    path.quadraticCurveTo(x, z, x - radius, z)
    path.lineTo(-x + radius, z)
    path.quadraticCurveTo(-x, z, -x, z - radius)
    path.lineTo(-x, -z + radius)
    path.quadraticCurveTo(-x, -z, -x + radius, -z)
  }

  function walls(w: number, d: number, inset: number, rise: number, y: number) {
    const shape = new THREE.Shape()
    outline(shape, w, d, cornerRadius)
    const hole = new THREE.Path()
    outline(hole, w - inset * 2, d - inset * 2, Math.max(0.004, cornerRadius - 0.01))
    shape.holes.push(hole)
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: rise,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 5,
    })
    geometry.rotateX(-Math.PI / 2)
    equipmentMesh(root, geometry, material, [0, y, 0])
  }

  equipmentBox(root, [width - 0.01, 0.018, depth - 0.01], [0, 0.009, 0], material, 0.008)
  walls(width, depth, 0.018, height, 0)
  walls(width + 0.035, depth + 0.035, 0.035, 0.009, height)
  return root
}

export function equipmentInstances(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  positions: Point[],
) {
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length)
  const matrix = new THREE.Matrix4()

  positions.forEach((position, index) => {
    mesh.setMatrixAt(index, matrix.makeTranslation(...position))
  })

  mesh.computeBoundingSphere()
  mesh.castShadow = false
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

/** Small markings are drawn once, rather than rendered as dozens of separate meshes. */
export function equipmentPanel(
  parent: THREE.Object3D,
  width: number,
  height: number,
  position: Point,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
  illuminated = false,
) {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = Math.round((768 * height) / width)
  const map = new THREE.CanvasTexture(canvas)
  paintTexture(map, () => draw(canvas.getContext('2d')!, canvas.width, canvas.height))
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  const surface = {
    map,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }
  const material = illuminated
    ? new THREE.MeshBasicMaterial({ ...surface, toneMapped: false })
    : equipmentMaterial({ ...surface, roughness: 0.45, metalness: 0.05 })
  return equipmentMesh(parent, new THREE.PlaneGeometry(width, height), material, position)
}
