import type {
  Audience,
  CashbackReversal,
  Locale,
  NotificationType,
  Platform,
  ReceiptStatus,
  TransactionStatus,
  TransactionType,
  UserStatus,
} from '../api/types'

export const LOCALES: { key: Locale; label: string; short: string }[] = [
  { key: 'ru', label: 'Русский', short: 'RU' },
  { key: 'uz', label: "O'zbekcha (lotin)", short: 'UZ' },
  { key: 'uzCyrl', label: 'Ўзбекча (кирилл)', short: 'ЎЗ' },
]

/** Names come from the backend's dto.NotificationType constants: Reward, Status, Reminder, Promo, System. */
export const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 100, label: 'Начисление' },
  { value: 200, label: 'Статус' },
  { value: 300, label: 'Напоминание' },
  { value: 400, label: 'Промо' },
  { value: 500, label: 'Системное' },
]

export function notificationTypeLabel(t: number | undefined): string {
  return NOTIFICATION_TYPES.find((x) => x.value === t)?.label ?? (t === undefined ? '—' : `Тип ${t}`)
}

/** App screens a push may open. The list is enforced by the backend (devices.url_invalid otherwise). */
export const APP_ROUTES: { value: string; label: string }[] = [
  { value: '/history', label: 'История операций' },
  { value: '/transaction', label: 'Транзакция' },
  { value: '/wallet', label: 'Кошелёк' },
  { value: '/polls', label: 'Опросы' },
  { value: '/survey', label: 'Анкета' },
  { value: '/promo', label: 'Промо-товары' },
  { value: '/promo-details', label: 'Карточка промо' },
  { value: '/courses', label: 'Курсы' },
  { value: '/course-details', label: 'Карточка курса' },
  { value: '/referrals', label: 'Рефералы' },
  { value: '/kyc', label: 'Верификация (MyID)' },
  { value: '/notifications', label: 'Уведомления' },
  { value: '/profile', label: 'Профиль' },
]

export function appRouteLabel(url?: string): string {
  if (!url) return 'Без перехода'
  return APP_ROUTES.find((r) => r.value === url)?.label ?? url
}

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
]

export function platformLabel(p?: string): string {
  return PLATFORMS.find((x) => x.value === p)?.label ?? (p || '—')
}

export const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'broadcast', label: 'Всем' },
  { value: 'platform', label: 'Платформа' },
  { value: 'targeted', label: 'Выбранные' },
]

export const TTL_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Не ограничивать' },
  { value: '3600', label: '1 час' },
  { value: '21600', label: '6 часов' },
  { value: '86400', label: '24 часа' },
  { value: '259200', label: '3 дня' },
]

/** Phrase an operator must type to confirm a broadcast. */
export const BROADCAST_CONFIRM_PHRASE = 'ВСЕМ'

export const USER_STATUSES: { value: UserStatus; label: string; theme: 'success' | 'danger' | 'unknown' }[] = [
  { value: 'active', label: 'Активен', theme: 'success' },
  { value: 'blocked', label: 'Заблокирован', theme: 'danger' },
  { value: 'deleted', label: 'Удалён', theme: 'unknown' },
]

export function userStatusMeta(s: UserStatus) {
  return USER_STATUSES.find((x) => x.value === s) ?? { value: s, label: s, theme: 'unknown' as const }
}

export type Theme = 'success' | 'danger' | 'warning' | 'info' | 'unknown'

export const RECEIPT_STATUSES: { value: ReceiptStatus; label: string; theme: Theme }[] = [
  { value: 'pending', label: 'В обработке', theme: 'info' },
  { value: 'approved', label: 'Одобрен', theme: 'success' },
  { value: 'canceled', label: 'Отклонён', theme: 'danger' },
]

export function receiptStatusMeta(s: ReceiptStatus) {
  return RECEIPT_STATUSES.find((x) => x.value === s) ?? { value: s, label: s, theme: 'unknown' as const }
}

export const TRANSACTION_STATUSES: { value: TransactionStatus; label: string; theme: Theme }[] = [
  { value: 'pending', label: 'В обработке', theme: 'info' },
  { value: 'posted', label: 'Проведён', theme: 'success' },
  { value: 'rejected', label: 'Отклонён', theme: 'warning' },
  { value: 'reversed', label: 'Сторно', theme: 'danger' },
]

export function transactionStatusMeta(s: TransactionStatus) {
  return TRANSACTION_STATUSES.find((x) => x.value === s) ?? { value: s, label: s, theme: 'unknown' as const }
}

/** Names come from the backend's dto.TransactionType constants. */
export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'welcome_bonus', label: 'Приветственный бонус' },
  { value: 'friend_invitation', label: 'За приглашение друга' },
  { value: 'receipt_scan', label: 'Кешбэк за чек' },
  { value: 'survey_completion', label: 'Опрос' },
  { value: 'card_withdrawal', label: 'Вывод на карту' },
]

export function transactionTypeLabel(t?: string): string {
  if (!t || t === 'unspecified') return '—'
  return TRANSACTION_TYPES.find((x) => x.value === t)?.label ?? t
}

/** What a rejection did to the money, in words an operator can act on. */
export const REVERSAL_META: Record<CashbackReversal, { label: string; description: string; theme: Theme }> = {
  none: {
    label: 'Деньги не трогали',
    description: 'У чека не было начисления, которое можно отозвать.',
    theme: 'unknown',
  },
  rejected: {
    label: 'Снято до начисления',
    description: 'Кешбэк ещё не попадал в баланс — движение отменено, баланс не менялся.',
    theme: 'warning',
  },
  clawed_back: {
    label: 'Возвращено с баланса',
    description: 'Кешбэк уже был доступен и сейчас вычтен из баланса пользователя.',
    theme: 'danger',
  },
}

const REVERSAL_FALLBACK = {
  label: 'Неизвестный результат',
  description: 'Сервер вернул непредусмотренный тип возврата. Проверьте чек вручную.',
  theme: 'unknown' as Theme,
}

/**
 * A new backend value must not throw inside the success handler: that
 * would skip the cache invalidation and leave the screen showing a
 * rejected receipt as still active, with no error to explain it.
 */
export function reversalMeta(value: string) {
  return REVERSAL_META[value as CashbackReversal] ?? REVERSAL_FALLBACK
}

export const REJECTION_REASONS: { value: string; label: string }[] = [
  { value: 'Чек поддельный или дублирующий', label: 'Чек поддельный или дублирующий' },
  { value: 'Товары не относятся к перечню', label: 'Товары не относятся к перечню' },
  { value: 'Чек не соответствует сумме покупки', label: 'Чек не соответствует сумме покупки' },
  { value: 'Злоупотребление кешбэком', label: 'Злоупотребление кешбэком' },
]
