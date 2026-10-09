import { api } from './client'
import type { ListVersionsResponse, VersionConfig } from './types'

export const versionsApi = {
  list: (signal?: AbortSignal) => api.get<ListVersionsResponse>('/internal/versions', undefined, signal),
  upsert: (body: VersionConfig) => api.post<VersionConfig>('/internal/versions', body),
  remove: (platform: string) => api.delete<void>(`/internal/versions/${encodeURIComponent(platform)}`),
}
