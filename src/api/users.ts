import { api } from './client'
import type { AdminUser, AdminUsersListResponse, UsersListParams } from './types'

export const usersApi = {
  list: (params: UsersListParams, signal?: AbortSignal) =>
    api.get<AdminUsersListResponse>('/internal/users', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) => api.get<AdminUser>(`/internal/users/${id}`, undefined, signal),
}
