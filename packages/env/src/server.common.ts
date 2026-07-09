import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_ORIGIN: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
