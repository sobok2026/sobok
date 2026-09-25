import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

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
    for (let y = 0; y < 256; y++) {
      const shade = 160 + ((y * 73 + 19) % 83)
      context.fillStyle = `rgb(${shade} ${shade} ${shade})`
      context.fillRect(0, y, 256, 1)
    }
    const grain = new THREE.CanvasTexture(canvas)
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(1, 3)
    material.roughnessMap = grain
    material.bumpMap = grain
    material.bumpScale = 0.00025
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
  draw(canvas.getContext('2d')!, canvas.width, canvas.height)
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  const material = equipmentMaterial({
    map,
    transparent: true,
    roughness: 0.45,
    metalness: 0.05,
    ...(illuminated ? { emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.28 } : {}),
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
  return equipmentMesh(parent, new THREE.PlaneGeometry(width, height), material, position)
}
