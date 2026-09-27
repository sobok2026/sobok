import * as THREE from 'three'
import { recipeCatalog } from '../../content/catalog'
import { vesselLineFill } from '../../content/stock-amounts'
import { type CupKind, cupBody, cupKinds, cupSize, cupStyle, isReusableCup } from '../../features/inventory/cups'
import { CUP_PROFILES, cupScale, profileHeight, profileRadius, profileRim } from './cup-profiles'

// Model proportions and fill fractions are game visuals, not real cup-volume conversions.
export const CUP_DIMENSIONS = Object.fromEntries(
  cupKinds.map((kind) => {
    const profile = CUP_PROFILES[kind]
    return [
      kind,
      { top: profileRim(profile), bottom: profile.outline[0][0], height: profileHeight(profile), floor: profile.floor },
    ]
  }),
) as Record<CupKind, { top: number; bottom: number; height: number; floor: number }>

/** Height of a fill fraction; a stemmed or double-wall glass holds the drink above its floor. */
export function cupFillY(kind: CupKind, fill: number) {
  const { floor, height } = CUP_DIMENSIONS[kind]
  return floor + 0.008 + fill * (height - floor - 0.02)
}

export function cupRadius(kind: CupKind, y: number) {
  return profileRadius(CUP_PROFILES[kind], y)
}

const CUP_SURFACES = {
  plastic: { color: '#d9eee8', roughness: 0.16, opacity: 0.18 },
  glass: { color: '#d9eee8', roughness: 0.16, opacity: 0.26 },
  ceramic: { color: '#dbe5d6', roughness: 0.24, opacity: 1 },
  paper: { color: '#f9efdc', roughness: 0.7, opacity: 1 },
} as const

export function createCupBody(parent: THREE.Object3D, kind: CupKind, detailed = false) {
  const root = new THREE.Group()
  parent.add(root)
  const profile = CUP_PROFILES[kind]
  const { top, bottom, height, floor } = CUP_DIMENSIONS[kind]
  const base = profile.outline[0][1]
  const body = cupBody(kind)
  const scale = cupScale(kind)
  const clear = body === 'plastic' || body === 'glass'
  const glass = body === 'glass'
  const segments = detailed ? 32 : 20
  const material = new THREE.MeshStandardMaterial({
    ...CUP_SURFACES[body],
    transparent: clear,
    depthWrite: !clear,
    side: THREE.DoubleSide,
  })

  const add = (mesh: THREE.Mesh, y: number) => {
    mesh.position.y = y
    mesh.castShadow = !clear
    root.add(mesh)
    return mesh
  }
  const cylinder = (r1: number, r2: number, h: number, y: number, mat: THREE.Material, open = false) =>
    add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments, 1, open), mat), y)
  const lathe = (points: readonly (readonly [number, number])[]) =>
    add(
      new THREE.Mesh(
        new THREE.LatheGeometry(
          points.map(([r, y]) => new THREE.Vector2(r, y)),
          segments,
        ),
        material,
      ),
      0,
    )

  lathe(profile.outline)
  // A tall gap to the floor is a stem or a double wall, which stand on a thin foot; otherwise the base is solid.
  const solid = floor - base <= 0.03
  const thickness = solid ? Math.max(floor - base, glass ? 0.022 : 0.007) : 0.004
  cylinder(bottom, bottom, thickness, base + thickness / 2, material)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(top, glass ? 0.005 : 0.0035, 6, 32), material)
  rim.rotation.x = Math.PI / 2
  rim.position.y = height
  root.add(rim)

  if (profile.saucer) {
    cylinder(profile.saucer, profile.saucer * 0.9, base, base / 2, material)
  }

  if (profile.innerWall) {
    const inner = profileRadius(profile, floor) - 0.014
    lathe([
      [inner, floor],
      [top - 0.01, height - 0.004],
    ])
    cylinder(inner, inner, 0.004, floor, material)
  }

  if (body === 'ceramic') {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.057 * scale, 0.014 * scale, 8, 24), material)
    handle.position.set(top + 0.035 * scale, base + (height - base) * 0.53, 0)
    root.add(handle)
  }

  if (body === 'paper') {
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

  const style = cupStyle(kind)
  const size = cupSize(kind)

  // Only the standard cold cups carry the printed fill lines the recipes measure against.
  if (detailed && clear && style && size) {
    const black = new THREE.MeshBasicMaterial({ color: '#263b32' })
    const white = new THREE.MeshBasicMaterial({ color: '#fff9e8' })

    for (const line of ['lower', 'middle', 'upper'] as const) {
      const fill = vesselLineFill(recipeCatalog, 'serving-cup', size, style, line)
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
