import { api } from './client'
import type { AdminUser, AdminUsersListResponse, SetUserStatusResponse, UserStatus, UsersListParams } from './types'

export const usersApi = {
  list: (params: UsersListParams, signal?: AbortSignal) =>
    api.get<AdminUsersListResponse>('/internal/users', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) => api.get<AdminUser>(`/internal/users/${id}`, undefined, signal),
  /**
   * Blocking revokes every live session on the backend, so an app that
   * was open logs out on its next request rather than at token expiry.
   */
  setStatus: (id: number, status: UserStatus) =>
    api.patch<SetUserStatusResponse>(`/internal/users/${id}/status`, { status }),
}
