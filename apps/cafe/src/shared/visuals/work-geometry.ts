import * as THREE from 'three'

export const workMaterial = (color: string, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.3 : 0.65, metalness })

export function workCylinder(
  parent: THREE.Object3D,
  top: number,
  bottom: number,
  height: number,
  material: THREE.Material,
  y = 0,
  open = false,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 32, 1, open), material)
  mesh.position.y = y
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

export function workBox(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}
