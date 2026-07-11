import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

// 컬럼 암호화 키는 별도 파일로 분리한다 — secret-crypto를 쓰지 않는 앱의 prod 파드에
// SECRET_ENCRYPTION_KEY 주입을 강제하지 않기 위함.
export const env = createEnv({
  server: {
    SECRET_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/i)
      .default('1111111111111111111111111111111111111111111111111111111111111111'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
