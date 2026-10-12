import { api } from './client'
import type {
  AdminGetReceiptResponse,
  AdminRejectReceiptResponse,
  AdminReceiptsListResponse,
  PromoteResponse,
  ReceiptsListParams,
} from './types'

export const receiptsApi = {
  promotePending: (before?: string) =>
    api.post<PromoteResponse>('/internal/receipts/promote-pending', undefined, before ? { before } : undefined),
  list: (params: ReceiptsListParams, signal?: AbortSignal) =>
    api.get<AdminReceiptsListResponse>('/internal/receipts', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) =>
    api.get<AdminGetReceiptResponse>(`/internal/receipts/${id}`, undefined, signal),
  /**
   * Turns the receipt down and takes its cashback back out of the user's
   * balance. The response says which way the money moved — see
   * CashbackReversal — so the operator can tell a rejected pending row
   * from cashback that was already in the balance and has now been
   * clawed back.
   */
  reject: (id: number, reason?: string) =>
    api.post<AdminRejectReceiptResponse>(`/internal/receipts/${id}/reject`, { reason }),
}
