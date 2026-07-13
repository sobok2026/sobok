export type Passkey = {
  id: string
  credentialId: string
  createdAt: Date | null
  deviceType: string
  name: string | null
  transports: string | null
}
