/** Internal RPC surface implemented by apps that own retention-sensitive data. */
export interface RetentionMaintenanceService {
  purgeRetention(): Promise<void>
}

/** Internal RPC surface implemented by apps that own pending payment state. */
export interface PendingPaymentMaintenanceService {
  reconcilePendingPayments(): Promise<void>
}

export interface VibeMaintenanceService extends RetentionMaintenanceService, PendingPaymentMaintenanceService {}

export type StellaMaintenanceService = RetentionMaintenanceService
