import { isApiError } from '../api/client'

const ALIAS_MESSAGES: Record<string, string> = {
  'admin.invalid_credentials': 'Неверный телефон или пароль',
  'devices.broadcast_too_large': 'Аудитория слишком большая для одной рассылки. Обратитесь к разработчикам.',
  'devices.url_invalid': 'Такой экран приложения открыть нельзя. Выберите экран из списка.',
  'version.stale_write': 'На сервере уже сохранена эта или более новая версия.',
  'version.not_found': 'Для этой платформы ещё нет настроек версии.',
  'receipts.not_rejectable': 'Чек уже отклонён. Другой оператор успел сделать это раньше — обновите страницу.',
  'receipts.reason_too_long': 'Причина слишком длинная. Сократите до 256 символов.',
  'promo.admin.not_found': 'Промо-товар не найден',
  'promo.admin.invalid_bonus': 'Бонус должен быть целым числом от 0',
  'promo.admin.invalid_end_date': 'Дата окончания не может быть в прошлом',
  'promo.admin.invalid_price': 'Цена должна быть целым числом от 0',
  'promo.admin.duplicate_nomenclature': 'Этот товар уже есть в промо',
  'promo.admin.invalid_packages': 'Выберите хотя бы один ИКПУ-код',
  'promo.admin.invalid_status': 'Статус должен быть «Действует» или «Выключен»',
  'extra_benefit.admin.not_found': 'Предложение не найдено. Возможно, его удалили.',
  'extra_benefit.admin.invalid_id': 'Некорректный id предложения',
  'extra_benefit.admin.invalid_limit': 'Некорректный размер страницы',
  'extra_benefit.admin.invalid_body': 'Сервер не принял запрос. Проверьте заполненные поля.',
  'extra_benefit.offer.not_found': 'Предложение не найдено. Возможно, его удалили.',
  'extra_benefit.offer.invalid': 'Предложение заполнено неверно. Проверьте поля и попробуйте ещё раз.',
  'extra_benefit.offer.invalid_status': 'Статус должен быть «Действует» или «На паузе»',
  'extra_benefit.offer.invalid_id': 'Некорректный id предложения',
  'extra_benefit.offer.invalid_limit': 'Некорректный размер страницы',
  'nomin.invalid_id': 'Некорректный id препарата',
  'nomin.upstream_unavailable': 'Каталог препаратов недоступен, попробуйте позже',
  'surveys.not_found': 'Опрос не найден. Возможно, он удалён.',
  'surveys.submission_not_found': 'Ответ не найден.',
  'surveys.not_active': 'Опрос сейчас не принимает ответы.',
  'surveys.already_completed': 'Этот опрос уже пройден.',
  'surveys.invalid_answers': 'Часть ответов не прошла проверку. Проверьте отмеченные вопросы.',
  'surveys.invalid_schema': 'Сервер не принял структуру опроса. Проверьте вопросы: ключи, варианты и условия.',
  'surveys.invalid_status': 'Неизвестный статус.',
  'surveys.invalid_status_transition': 'Такой переход статуса невозможен. Обновите страницу — статус мог измениться.',
  'surveys.invalid_reward': 'Награда не может быть отрицательной.',
  'surveys.invalid_window': 'Проверьте даты: начало должно быть раньше окончания, а окончание — в будущем.',
  'surveys.title_required': 'Нужно название опроса на русском.',
  'surveys.locked': 'Вопросы и награду нельзя менять: по опросу уже есть ответы.',
  'upload.file_required': 'Файл не выбран.',
  'upload.empty': 'Файл пустой.',
  'upload.name_invalid': 'Недопустимое имя файла.',
}

/** Human-readable error text for toasts and inline alerts. */
export function errorText(e: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.'): string {
  if (isApiError(e)) {
    if (e.alias && ALIAS_MESSAGES[e.alias]) return ALIAS_MESSAGES[e.alias]
    if (e.status === 0) return 'Нет связи с сервером. Проверьте интернет и попробуйте снова.'
    if (e.status === 401) return 'Сессия истекла. Войдите заново.'
    if (e.status === 403) return 'Нет доступа. Возможно, аккаунт больше не является оператором.'
    if (e.status === 404) return 'Не найдено. Возможно, запись уже удалена.'
    if (e.status === 413) return 'Файл слишком большой (максимум 25 МБ).'
    if (e.status >= 500) return 'Ошибка на сервере. Попробуйте позже.'
    return e.message || fallback
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}

/** `surveys.invalid_answers` carries the field in the message as `answers.<field_id>: <reason>`. */
export function invalidAnswerField(e: unknown): string | null {
  if (!isApiError(e) || e.alias !== 'surveys.invalid_answers') return null
  const m = /^answers\.([^:\s]+)/.exec(e.message)
  return m ? m[1] : null
}
