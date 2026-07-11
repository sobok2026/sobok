import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_NAME: z.string().default('sobok'),
    AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:3000'),
    BBATON_CLIENT_ID: z.string().optional(),
    BBATON_CLIENT_SECRET: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).default('local-dev-insecure-secret-change-me-0001'),
    BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    KAKAO_CLIENT_ID: z.string().optional(),
    KAKAO_CLIENT_SECRET: z.string().optional(),
    PASSKEY_ORIGIN: z.url().default('http://localhost:3000'),
    PASSKEY_RP_ID: z.string().default('localhost'),
    TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
