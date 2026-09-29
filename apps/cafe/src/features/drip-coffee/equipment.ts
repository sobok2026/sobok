import * as THREE from 'three'
import { STATIONS } from '../../content/stations'
import { canvasFont, paintTexture } from '../../shared/visuals/canvas-text'
import {
  equipmentBox as box,
  equipmentInstances as instances,
  equipmentLathe as lathe,
  equipmentMaterial as material,
  equipmentMesh as mesh,
  equipmentPanel as panel,
  equipmentTube as tube,
} from '../../shared/visuals/equipment-geometry'
import type { GameState } from '../../simulation/state'
import { DRIP, DRIP_BEANS, type DripTemperature, dripRemaining } from './rules'

// Starbucks' BUNN Digital Brewer reference: twin funnels, Soft Heat servers and a side hot-water tap.
// Dimensions fit the existing bar; the model is not a calibrated drawing of a particular installation.
// Cup models are enlarged for first-person work, so the docking stand leaves room for a Venti cup.
const STAND_LIFT = 0.23
export const URN_HOT_OUTLET: [number, number, number] = [
  STATIONS.urn.x - 0.148,
  1.319 + STAND_LIFT,
  STATIONS.urn.z + 0.087,
]

export function createDigitalUrn(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'URN Digital · BUNN twin Soft Heat inspired brewer'
  root.position.set(STATIONS.urn.x, 1.06, STATIONS.urn.z - 0.15)
  scene.add(root)
  const steel = material({ color: '#bac2c5', metalness: 0.92, roughness: 0.29 })
  const chrome = material({ color: '#e1e6e8', metalness: 1, roughness: 0.16 })
  const grey = material({ color: '#78827f', metalness: 0.08, roughness: 0.53 })
  const dark = material({ color: '#303a39', metalness: 0.15, roughness: 0.56 })
  const rubber = material({ color: '#18201e', roughness: 0.87 })
  const red = material({ color: '#bc3436', roughness: 0.36 })
  const sightGlass = material({
    color: '#c6d5d2',
    transparent: true,
    opacity: 0.48,
    roughness: 0.16,
    depthWrite: false,
  })

  for (const x of [-0.255, 0.255]) {
    for (const z of [-0.16, 0.18]) {
      box(root, [0.042, 0.16 + STAND_LIFT, 0.048], [x, 0.09 + STAND_LIFT / 2, z], steel, 0.008)
      box(root, [0.044, 0.016, 0.05], [x, 0.012, z], rubber, 0.005)
    }
  }

  const body = new THREE.Group()
  body.position.y = STAND_LIFT
  root.add(body)
  box(body, [0.58, 0.09, 0.44], [0, 0.205, 0.01], steel, 0.008)
  box(body, [0.59, 0.018, 0.45], [0, 0.255, 0.015], chrome, 0.004)
  box(body, [0.56, 0.6, 0.17], [0, 0.56, -0.15], steel, 0.008)
  box(body, [0.54, 0.035, 0.3], [0, 0.287, -0.01], dark, 0.005)
  box(body, [0.59, 0.205, 0.43], [0, 0.915, -0.035], steel, 0.008)
  box(body, [0.592, 0.018, 0.435], [0, 1.026, -0.035], chrome, 0.004)
  box(body, [0.582, 0.017, 0.436], [0, 0.806, -0.035], chrome, 0.004)

  panel(body, 0.565, 0.179, [0, 0.916, 0.181], (ctx, w, h) => {
    ctx.fillStyle = '#dadeda'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#51605b'
    ctx.fillRect(0, 0, w, h * 0.075)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = canvasFont(h * 0.067, 600)
    ctx.fillText('URN DIGITAL', w / 2, h * 0.9)

    for (const side of [0.23, 0.77]) {
      ctx.fillStyle = '#bb5449'
      ctx.beginPath()
      ctx.arc(w * (side - 0.055), h * 0.34, h * 0.053, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e8e8d9'
      ctx.font = canvasFont(h * 0.025, 600)
      ctx.fillText('BREW', w * (side - 0.055), h * 0.34)

      for (const [index, label] of ['FULL', '1/2', '1/4'].entries()) {
        const y = h * (0.42 + index * 0.092)
        ctx.fillStyle = '#3f4d48'
        ctx.beginPath()
        ctx.ellipse(w * side, y, w * 0.019, h * 0.038, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#f2f1e8'
        ctx.font = canvasFont(h * 0.031, 500)
        ctx.fillText(label, w * side, y)
      }

      ctx.fillStyle = '#c4aa50'
      ctx.beginPath()
      ctx.arc(w * (side - 0.055), h * 0.685, h * 0.053, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff7da'
      ctx.font = canvasFont(h * 0.025, 600)
      ctx.fillText('ON/OFF', w * (side - 0.055), h * 0.685)
    }

    for (const x of [0.454, 0.5, 0.546]) {
      ctx.fillStyle = '#9aa7a0'
      ctx.beginPath()
      ctx.roundRect(w * (x - 0.021), h * 0.485, w * 0.042, h * 0.034, h * 0.008)
      ctx.fill()
    }
  })

  box(body, [0.119, 0.039, 0.004], [0, 0.958, 0.184], dark, 0.003)
  const screen = panel(
    body,
    0.109,
    0.029,
    [0, 0.958, 0.187],
    (ctx, w, h) => {
      ctx.fillStyle = '#8d995c'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#263922'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = canvasFont(h * 0.36, 500)
      ctx.fillText('STANDBY', w / 2, h / 2)
    },
    true,
  )

  const indicators: Array<{
    temperature: DripTemperature
    level: THREE.Mesh
    stream: THREE.Mesh
    label: THREE.Mesh
    key: string
  }> = []
  const coffee = material({ color: '#533125', roughness: 0.8 })
  for (const x of [-0.148, 0.148]) {
    lathe(
      body,
      [
        [0.032, 0.658],
        [0.032, 0.679],
        [0.086, 0.686],
        [0.125, 0.773],
        [0.127, 0.794],
        [0.122, 0.8],
      ],
      steel,
      [x, 0, 0.016],
    )
    box(body, [0.238, 0.018, 0.265], [x, 0.798, 0.014], dark, 0.005)
    box(body, [0.052, 0.163, 0.04], [x, 0.747, 0.152], grey, 0.012).rotation.x = -0.16
    const screw = mesh(body, new THREE.CylinderGeometry(0.008, 0.008, 0.003, 12), chrome, [x, 0.795, 0.177])
    screw.rotation.x = Math.PI / 2

    box(body, [0.26, 0.344, 0.283], [x, 0.463, 0.018], steel, 0.018)
    box(body, [0.272, 0.023, 0.298], [x, 0.639, 0.02], grey, 0.008)
    box(body, [0.267, 0.022, 0.293], [x, 0.289, 0.02], grey, 0.006)

    for (const handleX of [x - 0.096, x + 0.096]) {
      box(body, [0.023, 0.046, 0.071], [handleX, 0.674, 0.0], grey, 0.004)
    }

    box(body, [0.016, 0.262, 0.019], [x, 0.501, 0.164], dark, 0.004)
    mesh(body, new THREE.CylinderGeometry(0.009, 0.009, 0.244, 16), sightGlass, [x, 0.503, 0.18])
    const level = mesh(body, new THREE.CylinderGeometry(0.005, 0.005, 1, 12), coffee, [x, 0.38, 0.181])
    const stream = mesh(body, new THREE.CylinderGeometry(0.005, 0.005, 0.035, 8), coffee, [x, 0.657, 0.016])
    const temperature = x < 0 ? 'hot' : 'iced'
    const label = panel(body, 0.099, 0.068, [x + 0.07, 0.54, 0.168], () => {}, true)
    indicators.push({ temperature, level, stream, label, key: '' })
    for (const y of [0.376, 0.632]) {
      mesh(body, new THREE.CylinderGeometry(0.013, 0.013, 0.018, 16), chrome, [x, y, 0.18])
    }

    tube(
      body,
      [
        [x - 0.108, 0.41, 0.161],
        [x - 0.068, 0.387, 0.21],
        [x, 0.389, 0.21],
        [x + 0.068, 0.387, 0.21],
        [x + 0.108, 0.41, 0.161],
      ],
      0.008,
      chrome,
    )
    tube(
      body,
      [
        [x, 0.355, 0.163],
        [x, 0.355, 0.218],
        [x, 0.32, 0.237],
      ],
      0.014,
      chrome,
    )
    lathe(
      body,
      [
        [0.013, 0.259],
        [0.019, 0.285],
        [0.027, 0.327],
        [0.029, 0.334],
      ],
      chrome,
      [x, 0, 0.237],
    )
    tube(
      body,
      [
        [x, 0.351, 0.225],
        [x - 0.021, 0.39, 0.231],
        [x - 0.023, 0.419, 0.228],
        [x + 0.023, 0.419, 0.228],
        [x + 0.021, 0.39, 0.231],
        [x, 0.351, 0.225],
      ],
      0.008,
      grey,
    )
  }

  box(body, [0.061, 0.338, 0.24], [-0.335, 0.443, 0.041], steel, 0.006)
  tube(
    body,
    [
      [-0.335, 0.426, 0.165],
      [-0.335, 0.426, 0.209],
      [-0.335, 0.385, 0.231],
    ],
    0.014,
    chrome,
  )
  lathe(
    body,
    [
      [0.012, 0.331],
      [0.018, 0.348],
      [0.027, 0.39],
      [0.028, 0.395],
    ],
    chrome,
    [-0.335, 0, 0.231],
  )
  tube(
    body,
    [
      [-0.335, 0.435, 0.221],
      [-0.36, 0.475, 0.228],
      [-0.36, 0.523, 0.224],
      [-0.31, 0.523, 0.224],
      [-0.31, 0.475, 0.228],
      [-0.335, 0.435, 0.221],
    ],
    0.009,
    red,
  )

  box(root, [0.57, 0.022, 0.32], [0, 0.018, 0.282], steel, 0.014)
  box(root, [0.535, 0.005, 0.291], [0, 0.031, 0.282], rubber, 0.004)
  instances(
    root,
    new THREE.BoxGeometry(0.527, 0.004, 0.003),
    chrome,
    Array.from({ length: 25 }, (_, i) => [0, 0.036, 0.147 + i * 0.011]),
  )
  instances(
    root,
    new THREE.BoxGeometry(0.003, 0.004, 0.286),
    chrome,
    [-0.23, -0.115, 0, 0.115, 0.23].map((x) => [x, 0.037, 0.282]),
  )

  const pitcher = new THREE.Group()
  pitcher.position.set(0.48, 0, 0.16)
  root.add(pitcher)
  lathe(
    pitcher,
    [
      [0, 0.005],
      [0.095, 0.005],
      [0.119, 0.3],
      [0.112, 0.305],
      [0.087, 0.015],
      [0, 0.015],
    ],
    sightGlass,
  )
  const pitcherLiquid = mesh(pitcher, new THREE.CylinderGeometry(0.106, 0.084, 1, 24), coffee)
  tube(
    pitcher,
    [
      [0.114, 0.27, 0],
      [0.16, 0.24, 0],
      [0.16, 0.08, 0],
      [0.1, 0.045, 0],
    ],
    0.01,
    grey,
  )
  let previousDisplay = ''

  function repaint(surface: THREE.Mesh, lines: string[], background: string, foreground: string) {
    const texture = (surface.material as THREE.MeshBasicMaterial).map!
    const canvas = texture.image as HTMLCanvasElement
    paintTexture(texture, () => {
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = foreground
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = canvasFont(canvas.height / (lines.length * 2.2), 500)
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, (canvas.height * (i + 0.5)) / lines.length, canvas.width * 0.92)
      })
    })
  }

  return {
    root,
    update(state: GameState) {
      const display: string[] = []
      for (const indicator of indicators) {
        const { temperature } = indicator
        const brew = state.drip[temperature]
        const batch = state.batches.find((batch) => batch.id === brew?.batchId)
        const seconds = dripRemaining(state, temperature)
        const brewing = brew?.stage === 'extracting' && !brew.fault
        indicator.stream.visible = brewing
        const fill = brewing ? 1 - seconds / DRIP.brewSeconds : Number(!!brew?.completedAt)
        const amount = temperature === 'hot' && batch ? batch.amount / DRIP.waterMilliliters : fill
        indicator.level.visible = amount > 0
        indicator.level.scale.y = Math.max(0.001, 0.244 * Math.min(1, amount))
        indicator.level.position.y = 0.381 + indicator.level.scale.y / 2
        const bean = brew?.bean ?? state.cow[temperature]
        let status = '준비 전'
        if (brew) status = '준비 중'
        if (brew?.completedAt !== null && brew?.completedAt !== undefined) status = '회수 · 혼합'
        if (batch) status = `${Math.round(batch.amount)} ml`
        if (brewing) status = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
        const expired = !!batch && batch.expiresAt !== null && batch.expiresAt <= state.time
        if (brew?.fault || expired) status = '폐기 필요'
        const lines = [temperature.toUpperCase(), DRIP_BEANS[bean], status]
        const key = lines.join('/')
        if (indicator.key !== key) {
          indicator.key = key
          repaint(indicator.label, lines, expired || brew?.fault ? '#672c21' : '#183b31', '#f5f0d9')
        }
        if (brewing) display.push(`${temperature.toUpperCase()} ${status}`)
      }
      const iced = state.drip.iced
      const icedBatch = state.batches.find((batch) => batch.id === iced?.batchId)
      pitcher.visible =
        !!iced && ['ice', 'mix', 'ready'].includes(iced.stage) && (!icedBatch || icedBatch.location === 'urn')
      pitcherLiquid.scale.y = 0.13 + Math.min(1, (iced?.ice ?? 0) / DRIP.icedIceGrams) * 0.14
      pitcherLiquid.position.y = 0.015 + pitcherLiquid.scale.y / 2
      const nextDisplay = display.join('/') || 'READY'
      if (previousDisplay !== nextDisplay) {
        previousDisplay = nextDisplay
        repaint(screen, display.length ? display : ['READY'], '#8d995c', '#263922')
      }
    },
  }
}
