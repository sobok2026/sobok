import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    ADSTERRA_API_KEY: z.string().optional(),
    GA_PROPERTY_ID: z.string().optional(),
    PAYMENTS_SERVICE_URL: z.url().optional(),
    PAYMENTS_SERVICE_TOKEN: z.string().min(32).optional(),
    PAYMENTS_EVENT_TOKEN: z.string().min(32).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
