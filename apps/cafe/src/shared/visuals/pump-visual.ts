import * as THREE from 'three'
import { canvasFont } from './canvas-text'
import {
  equipmentBox as box,
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from './equipment-geometry'

export function createPumpVisual(parent: THREE.Object3D, kind: 'glaze' | 'classic') {
  const root = new THREE.Group()
  parent.add(root)
  const steel = material({ color: '#c4cbd0', metalness: 0.94, roughness: 0.23 })
  const black = material({ color: '#1f2729', roughness: 0.65 })
  const cream = material({ color: '#ece5d3', roughness: 0.45 })
  const syrup = kind === 'classic'
  const clear = material({
    color: '#e5d8b1',
    transparent: true,
    opacity: 0.22,
    roughness: 0.21,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  if (syrup) {
    lathe(
      root,
      [
        [0, 0],
        [0.074, 0],
        [0.084, 0.013],
        [0.084, 0.255],
        [0.078, 0.29],
        [0.035, 0.329],
        [0.032, 0.356],
      ],
      clear,
    )
    lathe(
      root,
      [
        [0, 0.011],
        [0.075, 0.011],
        [0.075, 0.248],
        [0, 0.248],
      ],
      material({ color: '#b8904b', roughness: 0.24 }),
    )
    mesh(root, new THREE.CylinderGeometry(0.005, 0.005, 0.3, 10), cream, [0, 0.165, 0])
  } else {
    lathe(
      root,
      [
        [0, 0],
        [0.086, 0],
        [0.097, 0.015],
        [0.099, 0.24],
        [0.087, 0.29],
        [0.045, 0.315],
        [0.04, 0.335],
      ],
      cream,
    )
  }

  const collarY = syrup ? 0.354 : 0.335
  mesh(root, new THREE.CylinderGeometry(0.046, 0.046, 0.028, 32), black, [0, collarY, 0])

  for (const y of [collarY - 0.006, collarY + 0.005]) {
    const ring = mesh(root, new THREE.TorusGeometry(0.046, 0.0025, 6, 32), steel, [0, y, 0])
    ring.rotation.x = Math.PI / 2
  }

  mesh(root, new THREE.CylinderGeometry(0.011, 0.011, 0.1, 20), steel, [0, 0.38, 0])
  const head = new THREE.Group()
  head.position.y = 0.445
  root.add(head)
  box(head, [0.085, 0.018, 0.07], [0, 0, 0], syrup ? black : cream, 0.009)
  tube(
    head,
    [
      [0, -0.023, 0.02],
      [0, -0.025, 0.16],
      [0, -0.025, 0.335],
      [0, -0.042, 0.36],
    ],
    0.009,
    syrup ? black : steel,
  )
  const outlet = mesh(
    head,
    new THREE.CylinderGeometry(0.012, 0.009, 0.02, 16),
    syrup ? black : steel,
    [0, -0.044, 0.36],
  )

  panel(root, 0.124, 0.125, [0, 0.168, syrup ? 0.0845 : 0.0995], (ctx, w, h) => {
    ctx.fillStyle = '#f1ead9'
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 18)
    ctx.fill()
    ctx.fillStyle = syrup ? '#9d773c' : '#38604d'
    ctx.fillRect(0, h * 0.06, w, h * 0.22)
    ctx.fillStyle = '#ffffff'
    ctx.font = canvasFont(h * 0.12, 600)
    ctx.textAlign = 'center'
    ctx.fillText(syrup ? 'CLASSIC' : 'GLAZED', w / 2, h * 0.215)
    ctx.fillStyle = '#354b42'
    ctx.font = canvasFont(h * 0.18, 600)
    ctx.fillText(syrup ? '클래식' : '글레이즈드', w / 2, h * 0.56)
    ctx.font = canvasFont(h * 0.08)
    ctx.fillText('소복다방  ·  BAR', w / 2, h * 0.8)
  })

  return { root, head, outlet }
}
