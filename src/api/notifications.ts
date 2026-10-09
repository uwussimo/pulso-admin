import { api } from './client'
import type {
  AdminDetailResponse,
  AdminListResponse,
  CreateNotificationRequest,
  CreateNotificationResponse,
  NotificationListParams,
  SendPushRequest,
  SendPushResponse,
  UpdateNotificationRequest,
} from './types'

export const notificationsApi = {
  list: (params: NotificationListParams, signal?: AbortSignal) =>
    api.get<AdminListResponse>('/internal/notifications', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) =>
    api.get<AdminDetailResponse>(`/internal/notifications/${id}`, undefined, signal),
  create: (body: CreateNotificationRequest) => api.post<CreateNotificationResponse>('/internal/notifications', body),
  update: (id: number, body: UpdateNotificationRequest) => api.patch<void>(`/internal/notifications/${id}`, body),
  retract: (id: number) => api.delete<void>(`/internal/notifications/${id}`),
  sendPush: (body: SendPushRequest) => api.post<SendPushResponse>('/internal/push/send', body),
}
