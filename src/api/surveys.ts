import { api } from './client'
import type {
  Survey,
  SurveyListParams,
  SurveyListResponse,
  SurveyResponsesParams,
  SurveyResponsesResponse,
  SurveyStats,
  SurveyStatus,
  SurveySubmissionDetail,
  SurveyWriteRequest,
  UploadResponse,
} from './types'

export const surveysApi = {
  list: (params: SurveyListParams, signal?: AbortSignal) =>
    api.get<SurveyListResponse>('/internal/surveys', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) => api.get<Survey>(`/internal/surveys/${id}`, undefined, signal),
  create: (body: SurveyWriteRequest) => api.post<Survey>('/internal/surveys', body),
  update: (id: number, body: SurveyWriteRequest) => api.put<Survey>(`/internal/surveys/${id}`, body),
  setStatus: (id: number, status: SurveyStatus) => api.patch<Survey>(`/internal/surveys/${id}/status`, { status }),
  remove: (id: number) => api.delete<void>(`/internal/surveys/${id}`),
  responses: (id: number, params: SurveyResponsesParams, signal?: AbortSignal) =>
    api.get<SurveyResponsesResponse>(`/internal/surveys/${id}/responses`, { ...params }, signal),
  response: (id: number, submissionId: number, signal?: AbortSignal) =>
    api.get<SurveySubmissionDetail>(`/internal/surveys/${id}/responses/${submissionId}`, undefined, signal),
  stats: (id: number, signal?: AbortSignal) => api.get<SurveyStats>(`/internal/surveys/${id}/stats`, undefined, signal),
  upload: (file: File) => {
    const form = new FormData()
    form.set('file', file, file.name)
    return api.upload<UploadResponse>('/internal/upload', form)
  },
}
