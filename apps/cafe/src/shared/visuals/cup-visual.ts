import * as THREE from 'three'
import { type CupKind, isReusableCup } from '../../features/inventory/cups'

// Model proportions and fill fractions are game visuals, not real cup-volume conversions.
export const CUP_DIMENSIONS = {
  'hot-paper': { top: 0.112, bottom: 0.078, height: 0.285 },
  'iced-plastic': { top: 0.112, bottom: 0.078, height: 0.285 },
  'hot-mug': { top: 0.132, bottom: 0.12, height: 0.215 },
  'iced-glass': { top: 0.108, bottom: 0.092, height: 0.3 },
} as const
export function cupFillY(kind: CupKind, fill: number) {
  return 0.008 + fill * (CUP_DIMENSIONS[kind].height - 0.02)
}
export function cupRadius(kind: CupKind, y: number) {
  const { top, bottom, height } = CUP_DIMENSIONS[kind]
  return bottom + (top - bottom) * Math.min(1, y / height)
}
export function createCupBody(parent: THREE.Object3D, kind: CupKind, detailed = false) {
  const root = new THREE.Group()
  parent.add(root)
  const { top, bottom, height } = CUP_DIMENSIONS[kind]
  const clear = kind === 'iced-plastic' || kind === 'iced-glass'
  const glass = kind === 'iced-glass'
  const material = new THREE.MeshStandardMaterial({
    color: clear ? '#d9eee8' : kind === 'hot-mug' ? '#dbe5d6' : '#f9efdc',
    roughness: clear ? 0.16 : kind === 'hot-mug' ? 0.24 : 0.7,
    transparent: clear,
    opacity: clear ? (glass ? 0.26 : 0.18) : 1,
    depthWrite: !clear,
    side: THREE.DoubleSide,
  })
  const cylinder = (r1: number, r2: number, h: number, y: number, mat: THREE.Material, open = false) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, detailed ? 32 : 20, 1, open), mat)
    mesh.position.y = y
    mesh.castShadow = !clear
    root.add(mesh)
    return mesh
  }
  cylinder(top, bottom, height, height / 2, material, true)
  cylinder(bottom, bottom, glass ? 0.022 : 0.007, glass ? 0.011 : 0.004, material)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(top, glass ? 0.005 : 0.0035, 6, 32), material)
  rim.rotation.x = Math.PI / 2
  rim.position.y = height
  root.add(rim)
  if (kind === 'hot-mug') {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.014, 8, 24), material)
    handle.position.set(top + 0.035, height * 0.53, 0)
    root.add(handle)
  }
  if (kind === 'hot-paper') {
    const y = height * 0.47
    cylinder(
      cupRadius(kind, y + 0.035) + 0.002,
      cupRadius(kind, y - 0.035) + 0.002,
      0.07,
      y,
      new THREE.MeshStandardMaterial({ color: '#42634e', roughness: 0.95 }),
      true,
    )
  }
  const lid = cylinder(
    top + 0.007,
    top + 0.005,
    clear ? 0.012 : 0.023,
    height + 0.013,
    new THREE.MeshStandardMaterial({
      color: clear ? '#e9f1e9' : '#f1e7cf',
      transparent: clear,
      opacity: clear ? 0.6 : 1,
      roughness: 0.4,
    }),
  )
  lid.visible = false
  const hole = new THREE.Mesh(
    new THREE.BoxGeometry(clear ? 0.014 : 0.035, 0.004, 0.012),
    new THREE.MeshStandardMaterial({ color: '#493729' }),
  )
  hole.position.set(0, clear ? 0.008 : 0.014, clear ? 0 : top * 0.72)
  lid.add(hole)
  if (detailed && clear) {
    const black = new THREE.MeshBasicMaterial({ color: '#263b32' })
    const white = new THREE.MeshBasicMaterial({ color: '#fff9e8' })
    for (const fill of [0.4, 0.6, 0.8]) {
      const y = cupFillY(kind, fill)
      for (const rotation of [0, Math.PI]) {
        for (const [offset, mat] of [
          [0, white],
          [0.004, black],
        ] as const) {
          const mark = new THREE.Mesh(
            new THREE.TorusGeometry(cupRadius(kind, y) + 0.002, 0.0016, 4, 18, Math.PI * 0.58),
            mat,
          )
          mark.rotation.set(Math.PI / 2, 0, rotation + Math.PI * 0.21)
          mark.position.y = y + offset
          root.add(mark)
        }
      }
    }
  }
  return { root, lid, reusable: isReusableCup(kind) }
}
