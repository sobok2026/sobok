import { calculateEarthworkAverageEndArea, parseEarthworkCalculationWork } from '../../src/domain/earthwork'

const port = Number(process.env.PORT ?? 8080)

Bun.serve({
  hostname: '0.0.0.0',
  port,
  async fetch(request) {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true })
    }
    if (request.method !== 'POST' || url.pathname !== '/calculate') {
      return Response.json({ error: 'not-found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const parsed = parseEarthworkCalculationWork(body)
    if (!parsed) {
      return Response.json({ error: 'invalid-calculation-input' }, { status: 422 })
    }

    return Response.json(calculateEarthworkAverageEndArea(parsed.input))
  },
})
