import * as THREE from 'three'
import { canvasFont, paintTexture } from './canvas-text'

export function addVesselLabel(
  parent: THREE.Object3D,
  text: string,
  color: string,
  width: number,
  height: number,
  y: number,
  depth: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')!
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace

  paintTexture(map, () => {
    context.fillStyle = '#faf3df'
    context.beginPath()
    context.roundRect(0, 0, 256, 128, 10)
    context.fill()
    context.fillStyle = color
    context.fillRect(0, 0, 256, 14)
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const lines = text.split('\n')
    context.font = canvasFont(lines.length > 1 ? 32 : 44, 700)

    lines.forEach((line, index) => {
      context.fillText(line, 128, 16 + ((index + 0.5) * 104) / lines.length, 232)
    })
  })

  const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false })
  const geometry = new THREE.PlaneGeometry(width, height)
  const label = new THREE.Group()
  parent.add(label)

  for (const side of [1, -1]) {
    const face = new THREE.Mesh(geometry, material)
    face.position.set(0, y, side * depth)
    if (side < 0) {
      face.rotation.y = Math.PI
    }
    label.add(face)
  }

  return label
}
