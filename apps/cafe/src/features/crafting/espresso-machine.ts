import * as THREE from 'three'
import { canvasFont } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'

// Front is local +Z. The employee-facing machine is turned around on the main bar.
export const ESPRESSO_OUTLET: [number, number, number] = [-2.27, 1.48, -1.48]
export const STEAM_PITCHER_SPOT: [number, number, number] = [-2.94, 1.11, -1.46]

export function createEspressoMachine(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Mastrena II inspired espresso machine'
  root.position.set(-2.5, 1.06, -0.99)
  root.rotation.y = Math.PI
  scene.add(root)
  const steel = material({ color: '#c6cbcd', metalness: 0.94, roughness: 0.24 })
  const chrome = material({ color: '#e8ecef', metalness: 1, roughness: 0.13 })
  const copper = material({ color: '#b96735', metalness: 0.72, roughness: 0.29 })
  const black = material({ color: '#171c20', roughness: 0.48, metalness: 0.15 })
  const rubber = material({ color: '#0b0e10', roughness: 0.88 })
  const hopperGlass = material({
    color: '#9b783c',
    transparent: true,
    opacity: 0.28,
    roughness: 0.18,
    metalness: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const beans = material({ color: '#382218', roughness: 0.84 })

  box(root, [1.12, 0.032, 0.71], [0, 0.017, 0.19], black, 0.015)
  box(root, [1.08, 0.015, 0.69], [0, 0.033, 0.2], steel, 0.006)
  box(root, [0.98, 0.006, 0.54], [0, 0.04, 0.22], rubber, 0.001)
  instances(
    root,
    new THREE.BoxGeometry(0.98, 0.005, 0.006),
    chrome,
    Array.from({ length: 36 }, (_, i) => [0, 0.045, -0.035 + i * 0.0145]),
  )
  instances(
    root,
    new THREE.BoxGeometry(0.006, 0.006, 0.52),
    steel,
    [-0.4, -0.2, 0, 0.2, 0.4].map((x) => [x, 0.044, 0.22]),
  )
  for (const x of [-0.46, 0.46]) {
    box(root, [0.12, 0.045, 0.12], [x, 0.017, -0.08], rubber)
    box(root, [0.12, 0.045, 0.12], [x, 0.017, 0.43], rubber)
  }
  // Recessed stainless back, separate copper shoulders, and a projecting brew group.
  box(root, [0.99, 0.52, 0.3], [0, 0.32, -0.065], black, 0.035)
  box(root, [0.79, 0.29, 0.02], [0, 0.275, 0.095], steel)
  box(root, [1.04, 0.052, 0.38], [0, 0.588, -0.045], black, 0.025)
  for (const x of [-0.46, 0.46]) {
    box(root, [0.16, 0.48, 0.35], [x, 0.31, 0.045], copper, 0.048)
    box(root, [0.022, 0.49, 0.37], [x + Math.sign(x) * 0.08, 0.31, 0.035], black, 0.009)
  }
  box(root, [0.32, 0.105, 0.35], [-0.23, 0.53, 0.23], copper, 0.035)
  const brewControl = new THREE.Group()
  brewControl.position.set(-0.23, 0.585, 0.31)
  brewControl.rotation.x = -0.7
  root.add(brewControl)
  const face = mesh(brewControl, new THREE.CylinderGeometry(0.13, 0.13, 0.027, 48), black)
  face.rotation.x = Math.PI / 2
  panel(
    brewControl,
    0.23,
    0.23,
    [0, 0, 0.015],
    (ctx, w, h) => {
      ctx.fillStyle = '#343c41'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111d21'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.27, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = canvasFont(w * 0.074, 500)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2
        const x = w / 2 + Math.cos(a) * w * 0.37,
          y = h / 2 + Math.sin(a) * h * 0.37
        ctx.fillStyle = i < 3 ? '#c8a776' : '#b9c6ca'
        ctx.beginPath()
        ctx.roundRect(x - w * 0.072, y - h * 0.06, w * 0.144, h * 0.12, 8)
        ctx.fill()
        ctx.fillStyle = '#263034'
        ctx.fillText(String((i % 3) + 1), x, y)
      }
      ctx.fillStyle = '#dfece5'
      ctx.font = canvasFont(w * 0.055)
      ctx.fillText('ESPRESSO', w / 2, h * 0.44)
      ctx.fillText('READY', w / 2, h * 0.55)
    },
    true,
  )
  box(root, [0.17, 0.052, 0.125], [-0.23, 0.442, 0.44], black)
  const outlet = mesh(root, new THREE.CylinderGeometry(0.019, 0.014, 0.043, 24), chrome, [-0.23, 0.438, 0.49])
  outlet.castShadow = false

  const console = new THREE.Group()
  console.position.set(0.055, 0.535, 0.205)
  console.rotation.x = -0.48
  root.add(console)
  box(console, [0.29, 0.15, 0.045], [0, 0, 0], black, 0.018)
  panel(
    console,
    0.26,
    0.12,
    [0, 0, 0.024],
    (ctx, w, h) => {
      ctx.fillStyle = '#293135'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#9db5b5'
      ctx.fillRect(w * 0.2, h * 0.16, w * 0.63, h * 0.6)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#263f40'
      ctx.font = canvasFont(h * 0.17, 600)
      ctx.fillText('소복다방', w * 0.51, h * 0.4)
      ctx.font = canvasFont(h * 0.11)
      ctx.fillText('READY TO BREW', w * 0.51, h * 0.62)
      ctx.fillStyle = '#9aa5aa'
      for (const x of [0.04, 0.9])
        for (let i = 0; i < 3; i++) ctx.fillRect(w * x, h * (0.12 + i * 0.26), w * 0.06, h * 0.17)
    },
    true,
  )
  const dial = mesh(console, new THREE.CylinderGeometry(0.021, 0.023, 0.025, 24), rubber, [-0.1, -0.053, 0.035])
  dial.rotation.x = Math.PI / 2

  // Three tinted bean hoppers; the center hopper is wider in the reference machine.
  for (const [x, width] of [
    [-0.35, 0.24],
    [-0.01, 0.37],
    [0.34, 0.24],
  ]) {
    box(root, [width * 0.8, 0.038, 0.21], [x, 0.64, -0.07], black)
    const shell = mesh(root, new THREE.CylinderGeometry(1, 0.75, 1, 4, 1, true), hopperGlass, [x, 0.8, -0.07])
    shell.rotation.y = Math.PI / 4
    shell.scale.set(width / Math.SQRT2, 0.31, 0.24 / Math.SQRT2)
    box(root, [width + 0.013, 0.025, 0.255], [x, 0.965, -0.07], black, 0.01)
    box(root, [width - 0.023, 0.007, 0.225], [x, 0.98, -0.07], steel, 0.005)
    const coffee = mesh(root, new THREE.CylinderGeometry(1, 0.8, 1, 4), beans, [x, 0.748, -0.07])
    coffee.rotation.y = Math.PI / 4
    coffee.scale.set((width - 0.02) / Math.SQRT2, 0.18, 0.213 / Math.SQRT2)
    const beanGeometry = new THREE.SphereGeometry(0.013, 6, 4)
    beanGeometry.scale(1, 0.65, 0.72)
    instances(
      root,
      beanGeometry,
      beans,
      Array.from({ length: 48 }, (_, i) => [
        x + (((i * 0.61803398875) % 1) - 0.5) * (width - 0.045),
        0.837 + Math.sin(i * 2.4) * 0.006,
        -0.07 + (((i * 0.75487766) % 1) - 0.5) * 0.18,
      ]),
    )
  }
  // Chrome steam assembly with insulated grip, gauge, and curved wand.
  const steamHead = mesh(root, new THREE.CylinderGeometry(0.073, 0.073, 0.21, 32), chrome, [0.4, 0.51, 0.24])
  steamHead.rotation.z = Math.PI / 2
  box(root, [0.11, 0.09, 0.08], [0.42, 0.615, 0.23], chrome)
  tube(
    root,
    [
      [0.4, 0.49, 0.3],
      [0.44, 0.43, 0.37],
      [0.44, 0.26, 0.46],
      [0.44, 0.17, 0.47],
    ],
    0.012,
    chrome,
  )
  tube(
    root,
    [
      [0.415, 0.46, 0.34],
      [0.44, 0.405, 0.39],
      [0.44, 0.345, 0.418],
    ],
    0.023,
    black,
  )
  panel(root, 0.078, 0.078, [0.465, 0.29, 0.227], (ctx, w, h) => {
    ctx.fillStyle = '#11171a'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#b9c1c2'
    ctx.lineWidth = 9
    ctx.stroke()
    for (let i = 0; i < 10; i++) {
      const a = 0.7 + (i / 9) * 4.9
      ctx.beginPath()
      ctx.moveTo(w / 2 + Math.sin(a) * w * 0.32, h / 2 + Math.cos(a) * h * 0.32)
      ctx.lineTo(w / 2 + Math.sin(a) * w * 0.4, h / 2 + Math.cos(a) * h * 0.4)
      ctx.stroke()
    }
    ctx.strokeStyle = '#f0e7d3'
    ctx.beginPath()
    ctx.moveTo(w / 2, h / 2)
    ctx.lineTo(w * 0.29, h * 0.28)
    ctx.stroke()
  })
  instances(
    root,
    new THREE.BoxGeometry(0.005, 0.12, 0.002),
    rubber,
    Array.from({ length: 15 }, (_, i) => [-0.2 + i * 0.029, 0.35, -0.217]),
  )
  return root
}
