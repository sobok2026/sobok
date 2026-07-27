import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_ORIGIN: z.url().default('http://localhost:3000'),
    API_INTERNAL_ORIGIN: z.url().default('http://localhost:3002'),
    // Opt-IN escape hatch for local tooling that sends no Origin header (curl, Postman). Default off, so
    // missing or malformed config means STRICT. A plain z.coerce.boolean() would be wrong here — it treats
    // the string 'false' as true, which is exactly the direction this must never fail in.
    ALLOW_ANY_REQUEST_ORIGIN: z.enum(['true', 'false']).default('false'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
