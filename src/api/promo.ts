import { api } from './client'
import type {
  CreatePromoRequest,
  NomenclatureGetResponse,
  NomenclatureSearchParams,
  NomenclatureSearchResponse,
  PromoGetResponse,
  PromoListParams,
  PromoListResponse,
  PromoProduct,
  UpdatePromoRequest,
} from './types'

/**
 * The wire nests the catalog fields under `nomenclature`; the table cell reads
 * them flat. Flattening happens here, at the boundary, so no page has to know
 * the catalogue can be absent.
 *
 * `full_name` and the maker's country are the identity the pharmacy catalogue
 * shows, so they travel with the row instead of each cell re-deriving them.
 */
function withDisplayFields(product: PromoProduct): PromoProduct {
  const n = product.nomenclature
  return {
    ...product,
    name: n?.name ?? '',
    full_name: n?.full_name ?? n?.name ?? '',
    maker_name: n?.maker?.name ?? '',
    maker_country: n?.maker?.country_name ?? '',
    image_url: n?.image_url ?? '',
    ikpu_count: n?.ikpu_count ?? product.packages.length,
  }
}

export const promoApi = {
  list: async (params: PromoListParams, signal?: AbortSignal) => {
    const res = await api.get<PromoListResponse>('/internal/promo', { ...params }, signal)
    return { ...res, items: res.items.map(withDisplayFields) }
  },
  get: async (id: number, signal?: AbortSignal) => {
    const res = await api.get<PromoGetResponse>(`/internal/promo/${id}`, undefined, signal)
    return withDisplayFields(res)
  },
  create: (body: CreatePromoRequest) => api.post<PromoGetResponse>('/internal/promo', body),
  update: (id: number, body: UpdatePromoRequest) => api.put<PromoGetResponse>(`/internal/promo/${id}`, body),
  setStatus: (id: number, status: number) => api.patch<PromoGetResponse>(`/internal/promo/${id}/status`, { status }),
  remove: (id: number) => api.delete<void>(`/internal/promo/${id}`),
}

export const nomenclatureApi = {
  search: (params: NomenclatureSearchParams, signal?: AbortSignal) =>
    api.get<NomenclatureSearchResponse>('/internal/nomenclatures', { ...params }, signal),
  get: (id: number, signal?: AbortSignal) =>
    api.get<NomenclatureGetResponse>(`/internal/nomenclatures/${id}`, undefined, signal),
}
