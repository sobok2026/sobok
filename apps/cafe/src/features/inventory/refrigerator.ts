import * as THREE from 'three'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
} from '../../shared/visuals/equipment-geometry'

export function createRefrigerator(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'Commercial reach-in refrigerator'
  root.position.set(5.5, 0, -5.2)
  scene.add(root)
  const steel = material({ color: '#c1c3c4', metalness: 0.88, roughness: 0.49 })
  const doorSteel = material({ color: '#d0d1d2', metalness: 0.86, roughness: 0.48 })
  steel.roughnessMap = null
  steel.bumpScale = 0.000005
  doorSteel.roughnessMap = null
  doorSteel.bumpScale = 0.000005
  const black = material({ color: '#141819', roughness: 0.72 })
  const trim = material({ color: '#afb2b4', metalness: 0.9, roughness: 0.38 })
  for (const x of [-0.54, 0.54])
    for (const z of [-0.35, 0.35]) {
      box(root, [0.06, 0.072, 0.053], [x, 0.125, z], trim, 0.004)
      const wheel = mesh(root, new THREE.CylinderGeometry(0.053, 0.053, 0.039, 24), black, [x, 0.055, z])
      wheel.rotation.z = Math.PI / 2
      const hub = mesh(root, new THREE.CylinderGeometry(0.017, 0.017, 0.041, 20), trim, [x, 0.055, z])
      hub.rotation.z = Math.PI / 2
    }
  box(root, [1.36, 2.045, 0.96], [0, 1.1775, 0], steel, 0.004)
  box(root, [1.315, 0.283, 0.008], [0, 0.332, 0.483], black, 0.001)
  const louverGeometry = new THREE.BoxGeometry(1.296, 0.02, 0.02)
  louverGeometry.rotateX(-0.32)
  instances(
    root,
    louverGeometry,
    trim,
    Array.from({ length: 8 }, (_, i) => [0, 0.205 + i * 0.035, 0.497]),
  )
  box(root, [1.322, 0.026, 0.014], [0, 0.492, 0.494], trim, 0.003)
  box(root, [1.322, 0.016, 0.014], [0, 0.172, 0.494], trim, 0.002)
  for (const x of [-0.33, 0.33]) {
    box(root, [0.656, 1.542, 0.015], [x, 1.275, 0.486], black, 0.002)
    box(root, [0.65, 1.534, 0.034], [x, 1.275, 0.503], doorSteel, 0.003)
    // The reference uses angular black pull handles, not curved chrome rails.
    const handleX = Math.sign(x) * 0.096
    box(root, [0.021, 0.337, 0.025], [handleX, 1.298, 0.574], black, 0.003)
    for (const y of [1.13, 1.466]) {
      box(root, [0.071, 0.017, 0.025], [handleX + Math.sign(x) * 0.025, y, 0.574], black, 0.002)
      box(root, [0.018, 0.02, 0.06], [handleX + Math.sign(x) * 0.052, y, 0.551], black, 0.002)
    }
    for (const y of [0.59, 1.966]) box(root, [0.02, 0.075, 0.03], [Math.sign(x) * 0.644, y, 0.5], trim, 0.002)
  }
  box(root, [1.321, 0.143, 0.011], [0, 2.12, 0.484], steel, 0.003)
  box(root, [1.267, 0.013, 0.004], [0, 2.128, 0.491], black, 0.001)
  box(root, [1.282, 0.011, 0.018], [0, 2.138, 0.493], trim, 0.002)
  box(root, [1.321, 0.005, 0.012], [0, 2.042, 0.486], black, 0.001)
  const display = new THREE.Group()
  display.position.set(0.48, 2.085, 0.492)
  root.add(display)
  box(display, [0.073, 0.023, 0.003], [0, 0, 0], black, 0.002)
  panel(
    display,
    0.06,
    0.016,
    [0, 0, 0.002],
    (ctx, w, h) => {
      ctx.fillStyle = '#16201d'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#9fcbc2'
      ctx.font = `600 ${h * 0.55}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('— —', w * 0.43, h * 0.69)
      ctx.fillStyle = '#78ac83'
      ctx.beginPath()
      ctx.arc(w * 0.84, h / 2, h * 0.1, 0, Math.PI * 2)
      ctx.fill()
    },
    true,
  )
  panel(root, 0.158, 0.039, [-0.532, 2.158, 0.491], (ctx, w, h) => {
    ctx.fillStyle = '#424e49'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#d4d9d5'
    ctx.textAlign = 'left'
    ctx.font = `italic 700 ${h * 0.59}px serif`
    ctx.fillText('TRUE', w * 0.08, h * 0.73)
  })
}
