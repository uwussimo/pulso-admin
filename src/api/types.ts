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
  /** One box: matches phone digits, full name, or an exact id. */
  search?: string
  /** Narrower, phone-only filter kept for callers that already know it is a number. */
  phone?: string
  status?: UserStatus
  limit?: number
  before_id?: number
}

export interface SetUserStatusResponse {
  user: AdminUser
  /** Live sessions killed by the transition; non-zero only when the move took the account off the air. */
  sessions_revoked: number
}

export type ReceiptStatus = 'pending' | 'approved' | 'canceled'

/** Mirrors dto.CashbackReversal. */
export type CashbackReversal = 'none' | 'rejected' | 'clawed_back'

export type TransactionStatus = 'pending' | 'posted' | 'rejected' | 'reversed'

export type TransactionType =
  'welcome_bonus' | 'friend_invitation' | 'receipt_scan' | 'survey_completion' | 'card_withdrawal'

export interface AdminCashbackTransaction {
  id: number
  /** Tiyns. */
  amount: number
  status: TransactionStatus
}

export interface AdminReceipt {
  id: number
  user_id: number
  user_phone: string
  user_name: string
  status: ReceiptStatus
  url?: string
  fiscal_module?: string
  fiscal_sign?: string
  company_tin?: string
  company_name?: string
  /** Tiyns. */
  total: number
  /** Tiyns. */
  cashback: number
  cancel_reason?: string
  error_code?: string
  /** True when the cancellation came from an operator, not the daemon. */
  rejected_by_operator: boolean
  scanned_at: string
  created_at: string
  updated_at: string
  fiscalized_at?: string
  item_count: number
  medical_item_count: number
  /** The transactions row this receipt paid for; absent when there was none. */
  cashback_transaction?: AdminCashbackTransaction
}

export interface AdminReceiptItem {
  id: number
  name: string
  count_hundredths: number
  /** Tiyns. */
  price: number
  ikpu_code?: string
  mark_code?: string
  bar_code?: string
  /** 0 means the product is outside the medical catalogue and earns no cashback. */
  nomenclature_id: number
  /** Tiyns. */
  cashback: number
  status: 'non_medical' | 'cashbacked' | 'unspecified'
}

export interface ReceiptsSummary {
  totals: number
  pending: number
  approved: number
  canceled: number
  rejected_by_operator: number
  /** Tiyns, approved receipts only. */
  total_amount: number
  /** Tiyns, approved receipts only. */
  cashback_total: number
}

export interface AdminReceiptsListResponse {
  items: AdminReceipt[]
  totals: number
  has_more: boolean
  summary: ReceiptsSummary
}

export interface ReceiptsListParams {
  status?: ReceiptStatus
  user_id?: number
  company?: string
  limit?: number
  before_id?: number
}

export interface AdminGetReceiptResponse {
  receipt: AdminReceipt
  items: AdminReceiptItem[]
}

export interface AdminUserBalance {
  /** Tiyns. */
  available: number
  /** Tiyns. */
  pending: number
}

export interface AdminRejectReceiptResponse {
  receipt: AdminReceipt
  /**
   * What the rejection did to the money: `rejected` never counted,
   * `clawed_back` was already in the balance and has now been taken out.
   */
  cashback_reversal: CashbackReversal
  transaction?: AdminCashbackTransaction
  balance?: AdminUserBalance
}

export interface AdminTransaction {
  id: number
  user_id: number
  user_phone: string
  user_name: string
  type: TransactionType | 'unspecified'
  /** Tiyns. */
  amount: number
  reference?: string
  description?: string
  status: TransactionStatus
  /** True for the soft-deleted row a receipt rejection created. */
  reversed: boolean
  created_at: string
  posted_at?: string
}

export interface TransactionsSummary {
  totals: number
  pending: number
  posted: number
  rejected: number
  reversed: number
  /** Tiyns. */
  posted_credits: number
  /** Tiyns. */
  posted_debits: number
  /** Tiyns. */
  pending_total: number
}

export interface AdminTransactionsListResponse {
  items: AdminTransaction[]
  totals: number
  has_more: boolean
  summary: TransactionsSummary
}

export interface TransactionsListParams {
  status?: TransactionStatus
  type?: TransactionType
  user_id?: number
  limit?: number
  before_id?: number
}

export interface UploadResponse {
  /** Absolute CDN URL; this is what goes into the markdown body. */
  public_url: string
  size_bytes: number
  content_type: string
  original_name: string
}
