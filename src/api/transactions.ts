import { api } from './client'
import type { AdminTransactionsListResponse, TransactionsListParams } from './types'

export const transactionsApi = {
  list: (params: TransactionsListParams, signal?: AbortSignal) =>
    api.get<AdminTransactionsListResponse>('/internal/transactions', { ...params }, signal),
}
