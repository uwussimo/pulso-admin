import { api } from './client'
import type { PromoteResponse } from './types'

export const receiptsApi = {
  promotePending: (before?: string) =>
    api.post<PromoteResponse>('/internal/receipts/promote-pending', undefined, before ? { before } : undefined),
}
