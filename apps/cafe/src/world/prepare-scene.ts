import * as THREE from 'three'

const UPLOAD_BUDGET_MS = 4
const DRAW_BATCH_SIZE = 64

function nextFrame(signal: AbortSignal) {
  if (signal.aborted) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const done = () => {
      cancelAnimationFrame(frame)
      signal.removeEventListener('abort', done)
      resolve()
    }

    const frame = requestAnimationFrame(done)
    signal.addEventListener('abort', done, { once: true })
  })
}

/** Prepare the existing scene, including objects outside the initial view and hidden work props. */
export async function prepareScene(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  signal: AbortSignal,
) {
  // Canvas labels repaint when their font slices finish loading. Upload the final pixels once.
  await document.fonts.ready
  if (signal.aborted) return
  await renderer.compileAsync(scene, camera)
  if (signal.aborted) return

  const textures = new Set<THREE.Texture>()
  const objects: { object: THREE.Object3D; visible: boolean; layers: number; culled: boolean }[] = []
  const meshes: THREE.Mesh[] = []

  scene.traverse((object) => {
    objects.push({ object, visible: object.visible, layers: object.layers.mask, culled: object.frustumCulled })
    if (!(object instanceof THREE.Mesh)) return
    meshes.push(object)

    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && !value.isRenderTargetTexture) textures.add(value)
      }
    }
  })

  let deadline = performance.now() + UPLOAD_BUDGET_MS

  for (const texture of textures) {
    renderer.initTexture(texture)
    if (performance.now() < deadline) continue
    await nextFrame(signal)
    if (signal.aborted) return
    deadline = performance.now() + UPLOAD_BUDGET_MS
  }

  try {
    for (const { object } of objects) {
      object.visible = true
      object.frustumCulled = false
    }

    // Layers exclude a mesh without hiding its children. Keep the real camera, lights,
    // framebuffer and shadow settings so these draws warm the actual rendering variants.
    for (const mesh of meshes) mesh.layers.disableAll()

    for (let offset = 0; offset < meshes.length; offset += DRAW_BATCH_SIZE) {
      const batch = meshes.slice(offset, offset + DRAW_BATCH_SIZE)
      for (const mesh of batch) mesh.layers.mask = camera.layers.mask
      renderer.render(scene, camera)
      for (const mesh of batch) mesh.layers.disableAll()
      await nextFrame(signal)
      if (signal.aborted) return
    }
  } finally {
    for (const { object, visible, layers, culled } of objects) {
      object.visible = visible
      object.layers.mask = layers
      object.frustumCulled = culled
    }
  }

  // Restore the real shadow map and welcome view before revealing the canvas.
  renderer.render(scene, camera)
  const gl = renderer.getContext() as WebGL2RenderingContext
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!fence) throw new Error('Could not prepare the cafe graphics')
  gl.flush()

  try {
    while (!signal.aborted) {
      const status = gl.clientWaitSync(fence, 0, 0)
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return
      if (status === gl.WAIT_FAILED) throw new Error('Cafe graphics preparation failed')
      await nextFrame(signal)
    }
  } finally {
    gl.deleteSync(fence)
  }
}
