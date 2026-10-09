// Types mirror the operator API Swagger (service-pulso internal API v1).

export interface ErrorEnvelope {
  alias?: string
  code?: number | string
  message?: string
  type?: string
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface LoginResponse {
  access_token: string
  access_expires_at: string
  refresh_token: string
  refresh_expires_at: string
  admin_id: number
  phone: string
}

export interface MeResponse {
  id: number
  phone: string
  full_name?: string
  is_admin: boolean
}

export interface ChangePasswordRequest {
  current_password?: string | null
  new_password: string
}

export type Locale = 'ru' | 'uz' | 'uzCyrl'
export type LocaleMap = Partial<Record<Locale, string>>

export type Platform = 'ios' | 'android'
export type Audience = 'broadcast' | 'platform' | 'targeted'
export type TargetKind = 'all' | 'user' | 'users' | 'platform' | 'tokens'

export interface Target {
  kind: TargetKind
  platform?: Platform
  user_id?: number
  user_ids?: number[]
  push_tokens?: string[]
}

export type NotificationType = 100 | 200 | 300 | 400 | 500

export interface NotificationJSON {
  id: number
  title: LocaleMap
  description?: LocaleMap
  type: NotificationType
  url?: string
  created_at: string
  is_read?: boolean
  read_at?: string
}

export interface AdminNotification extends NotificationJSON {
  audience: Audience
  target_platform?: string
  targeted_count: number
  read_count: number
  unread_count: number
  updated_at?: string
}

export interface AdminListResponse {
  items: AdminNotification[]
  has_more: boolean
  totals: number
}

export interface AdminDetailResponse {
  notification: NotificationJSON
  audience: Audience
  target_platform?: string
  targeted_count: number
  read_count: number
  unread_count: number
  updated_at?: string
}

export interface NotificationListParams {
  type?: NotificationType
  audience?: Audience
  unread_only?: boolean
  search?: string
  limit?: number
  before_id?: number
}

export interface CreateNotificationRequest {
  title: LocaleMap
  description?: LocaleMap
  type: NotificationType
  url?: string
  ttl?: number
  target: Target
}

export interface SendSummary {
  batch_ids?: string[]
  resolved: number
  sent: number
  failed: number
  skipped_revoked: number
}

export interface CreateNotificationResponse {
  notification: NotificationJSON
  push?: SendSummary
  push_error?: string
  targets_created: number
}

export interface UpdateNotificationRequest {
  title?: LocaleMap
  description?: LocaleMap
  type?: NotificationType
  url?: string
}

export interface SendPushRequest {
  title: string
  body: string
  title_i18n?: LocaleMap
  body_i18n?: LocaleMap
  url?: string
  ttl?: number
  target: Target
}

export type SendPushResponse = SendSummary

export interface PromoteResponse {
  before: string
  promoted: number
}

export interface VersionConfig {
  platform: string
  version: string
  min_supported_version?: string
  minimum_os_version?: string
  force_update?: boolean
  rollout_percent?: number
  update_url?: string
  release_notes?: string
}

export interface ListVersionsResponse {
  items: VersionConfig[]
  totals: number
}

export interface StaleWriteErrorBody extends ErrorEnvelope {
  stored_platform?: string
  stored_version?: string
}

export type UserStatus = 'active' | 'blocked' | 'deleted'

export interface AdminUser {
  id: number
  phone: string
  full_name: string
  avatar_url?: string
  is_verified: boolean
  is_admin: boolean
  status: UserStatus
  /** Tiyns, like every transaction amount. */
  balance_available: number
  balance_pending: number
  receipts_total: number
  receipts_approved: number
  last_receipt_at?: string
  referrals_count: number
  invited_by?: number
  created_at: string
  updated_at: string
}

export interface AdminUsersListResponse {
  items: AdminUser[]
  totals: number
  has_more: boolean
}

export interface UsersListParams {
  phone?: string
  status?: UserStatus
  limit?: number
  before_id?: number
}
