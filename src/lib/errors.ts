import { isApiError } from '../api/client'

const ALIAS_MESSAGES: Record<string, string> = {
  'admin.invalid_credentials': 'Неверный телефон или пароль',
  'devices.broadcast_too_large': 'Аудитория слишком большая для одной рассылки. Обратитесь к разработчикам.',
  'devices.url_invalid': 'Такой экран приложения открыть нельзя. Выберите экран из списка.',
  'version.stale_write': 'На сервере уже сохранена эта или более новая версия.',
  'version.not_found': 'Для этой платформы ещё нет настроек версии.',
}

/** Human-readable error text for toasts and inline alerts. */
export function errorText(e: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.'): string {
  if (isApiError(e)) {
    if (e.alias && ALIAS_MESSAGES[e.alias]) return ALIAS_MESSAGES[e.alias]
    if (e.status === 0) return 'Нет связи с сервером. Проверьте интернет и попробуйте снова.'
    if (e.status === 401) return 'Сессия истекла. Войдите заново.'
    if (e.status === 403) return 'Нет доступа. Возможно, аккаунт больше не является оператором.'
    if (e.status === 404) return 'Не найдено. Возможно, запись уже удалена.'
    if (e.status >= 500) return 'Ошибка на сервере. Попробуйте позже.'
    return e.message || fallback
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}
