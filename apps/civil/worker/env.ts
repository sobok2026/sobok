export interface Bindings {
  HYPERDRIVE_FRESH: Hyperdrive
  CIVIL_CALCULATION_QUEUE: Queue<{ jobId: string }>
  CIVIL_ARTIFACT_QUEUE: Queue<{ artifactId: string }>
  CIVIL_DELIVERY_QUEUE: Queue<{ packageId: string }>
  CIVIL_FILES: R2Bucket

  CIVIL_PUBLIC_ORIGIN: string
  CIVIL_ACCOUNTS_ISSUER: string
  CIVIL_OIDC_CLIENT_ID: string
  CIVIL_STORAGE_CAP_BYTES: string

  CIVIL_AUTH_SECRET: SecretsStoreSecret
  CIVIL_OIDC_CLIENT_SECRET: SecretsStoreSecret
  CIVIL_IP_HASH_SALT: SecretsStoreSecret
}

export type AppEnv = {
  Bindings: Bindings
  Variables: { requestId: string }
}
