import { api, request } from './client'
import type { ChangePasswordRequest, LoginRequest, LoginResponse, MeResponse } from './types'

export const authApi = {
  login: (body: LoginRequest) => request<LoginResponse>('POST', '/internal/auth/login', { body, auth: false }),
  me: () => api.get<MeResponse>('/internal/auth'),
  logout: () => api.post<void>('/internal/auth/logout'),
  changePassword: (body: ChangePasswordRequest) => api.post<void>('/internal/auth/password', body),
}
