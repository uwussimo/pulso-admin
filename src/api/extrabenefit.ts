import { api } from './client'
import type {
  CreateExtraBenefitOfferRequest,
  ExtraBenefitListParams,
  ExtraBenefitListResponse,
  ExtraBenefitOffer,
  UpdateExtraBenefitOfferRequest,
} from './types'

/**
 * Goal offers — «экстра-выгода». The operator surface of service-pulso
 * (`/internal/extra-benefit/offers`): create, edit, pause and soft-delete
 * the offers the app shows as goal cards.
 */
export const extraBenefitApi = {
  list: (params: ExtraBenefitListParams, signal?: AbortSignal) =>
    api.get<ExtraBenefitListResponse>('/internal/extra-benefit/offers', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) =>
    api.get<ExtraBenefitOffer>(`/internal/extra-benefit/offers/${id}`, undefined, signal),
  create: (body: CreateExtraBenefitOfferRequest) => api.post<ExtraBenefitOffer>('/internal/extra-benefit/offers', body),
  update: (id: number, body: UpdateExtraBenefitOfferRequest) =>
    api.put<ExtraBenefitOffer>(`/internal/extra-benefit/offers/${id}`, body),
  /** 100 live, 200 paused. */
  setStatus: (id: number, status: number) =>
    api.patch<ExtraBenefitOffer>(`/internal/extra-benefit/offers/${id}/status`, { status }),
  remove: (id: number) => api.delete<void>(`/internal/extra-benefit/offers/${id}`),
}
