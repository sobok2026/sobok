import { createPaymentsClient } from '@sobok/payments'

const baseUrl = process.env.PAYMENTS_SERVICE_URL
const token = process.env.PAYMENTS_SERVICE_TOKEN

export const payments = baseUrl && token ? createPaymentsClient({ baseUrl, token }) : null
