import type { Locale } from '../api/types'
import type { AnswerStrings } from './schema'

export type BlockedReason = 'not_found' | 'not_active' | 'no_token' | 'session' | 'network' | 'generic'

export interface RespondentStrings extends AnswerStrings {
  start: string
  next: string
  back: string
  submit: string
  submitting: string
  skip: string
  questions: (n: number) => string
  takesMinutes: (n: number) => string
  rewardPill: (sum: string) => string
  progress: (i: number, n: number) => string
  yes: string
  no: string
  npsLow: string
  npsHigh: string
  addPhoto: string
  removePhoto: string
  uploading: string
  uploadFailed: string
  openPdf: string
  openImage: string
  slideCounter: (i: number, n: number) => string
  doneTitle: string
  doneBody: string
  creditedNote: string
  pendingNote: string
  alreadyTitle: string
  alreadyBody: string
  failedTitle: string
  failedBody: string
  returnToApp: string
  retry: string
  blocked: Record<BlockedReason, { title: string; body: string }>
  previewBadge: string
}

const ru: RespondentStrings = {
  start: 'Начать',
  next: 'Далее',
  back: 'Назад',
  submit: 'Отправить',
  submitting: 'Отправляем…',
  skip: 'Пропустить',
  questions: (n) => plural(n, ['вопрос', 'вопроса', 'вопросов']),
  takesMinutes: (n) => `~${n} мин`,
  rewardPill: (sum) => `+${sum} за прохождение`,
  progress: (i, n) => `${i} из ${n}`,
  yes: 'Да',
  no: 'Нет',
  npsLow: 'Точно нет',
  npsHigh: 'Точно да',
  addPhoto: 'Добавить фото',
  removePhoto: 'Убрать',
  uploading: 'Загружаем…',
  uploadFailed: 'Не удалось загрузить фото',
  openPdf: 'Открыть PDF',
  openImage: 'Открыть',
  slideCounter: (i, n) => `${i} / ${n}`,
  doneTitle: 'Спасибо!',
  doneBody: 'Ваши ответы сохранены.',
  creditedNote: 'начислено на баланс',
  pendingNote: 'скоро появятся на балансе',
  alreadyTitle: 'Вы уже проходили этот опрос',
  alreadyBody: 'Повторно пройти его нельзя — награда начисляется один раз.',
  failedTitle: 'Не удалось отправить',
  failedBody: 'Проверьте интернет и попробуйте ещё раз. Ответы сохранены на экране.',
  returnToApp: 'Вернуться в приложение',
  retry: 'Повторить',
  required: 'Это обязательный вопрос',
  chooseOne: 'Выберите вариант из списка',
  chooseMany: (min, max) =>
    min && max
      ? `Выберите от ${min} до ${max}`
      : min
        ? `Выберите не меньше ${min}`
        : max
          ? `Не больше ${max}`
          : 'Выберите варианты',
  tooLong: (max) => `Не больше ${max} символов`,
  outOfRange: (min, max) =>
    min !== undefined && max !== undefined
      ? `Значение от ${min} до ${max}`
      : min !== undefined
        ? `Не меньше ${min}`
        : max !== undefined
          ? `Не больше ${max}`
          : 'Недопустимое значение',
  invalidNumber: 'Введите число',
  invalidDate: 'Укажите корректную дату',
  tooManyFiles: (max) => `Не больше ${max} фото`,
  blocked: {
    not_found: { title: 'Опрос не найден', body: 'Возможно, он был удалён. Вернитесь в приложение.' },
    not_active: { title: 'Опрос недоступен', body: 'Он ещё не начался или уже завершён.' },
    no_token: { title: 'Откройте опрос из приложения', body: 'Эта страница работает только внутри приложения Pulso.' },
    session: { title: 'Сессия истекла', body: 'Вернитесь в приложение и откройте опрос заново.' },
    network: { title: 'Нет связи', body: 'Проверьте интернет и попробуйте ещё раз.' },
    generic: { title: 'Что-то пошло не так', body: 'Попробуйте ещё раз чуть позже.' },
  },
  previewBadge: 'Превью — ответы не сохраняются',
}

const uz: RespondentStrings = {
  ...ru,
  start: 'Boshlash',
  next: 'Keyingi',
  back: 'Orqaga',
  submit: 'Yuborish',
  submitting: 'Yuborilmoqda…',
  skip: 'Oʻtkazib yuborish',
  questions: (n) => `${n} savol`,
  takesMinutes: (n) => `~${n} daqiqa`,
  rewardPill: (sum) => `+${sum} oʻtish uchun`,
  progress: (i, n) => `${i} / ${n}`,
  yes: 'Ha',
  no: 'Yoʻq',
  npsLow: 'Aniq yoʻq',
  npsHigh: 'Aniq ha',
  addPhoto: 'Rasm qoʻshish',
  removePhoto: 'Olib tashlash',
  uploading: 'Yuklanmoqda…',
  uploadFailed: 'Rasm yuklanmadi',
  openPdf: 'PDF ni ochish',
  openImage: 'Ochish',
  doneTitle: 'Rahmat!',
  doneBody: 'Javoblaringiz saqlandi.',
  creditedNote: 'balansga oʻtkazildi',
  pendingNote: 'tez orada balansda paydo boʻladi',
  alreadyTitle: 'Siz bu soʻrovnomani allaqachon toʻldirgansiz',
  alreadyBody: 'Qayta toʻldirish mumkin emas — mukofot bir marta beriladi.',
  failedTitle: 'Yuborib boʻlmadi',
  failedBody: 'Internetni tekshirib, qayta urinib koʻring. Javoblar ekranda saqlangan.',
  returnToApp: 'Ilovaga qaytish',
  retry: 'Qayta urinish',
  required: 'Bu savol majburiy',
  chooseOne: 'Roʻyxatdan variantni tanlang',
  chooseMany: (min, max) =>
    min && max
      ? `${min} dan ${max} gacha tanlang`
      : min
        ? `Kamida ${min} ta tanlang`
        : max
          ? `Koʻpi bilan ${max} ta`
          : 'Variantlarni tanlang',
  tooLong: (max) => `Koʻpi bilan ${max} belgi`,
  outOfRange: (min, max) =>
    min !== undefined && max !== undefined
      ? `${min} dan ${max} gacha`
      : min !== undefined
        ? `Kamida ${min}`
        : max !== undefined
          ? `Koʻpi bilan ${max}`
          : 'Notoʻgʻri qiymat',
  invalidNumber: 'Raqam kiriting',
  invalidDate: 'Toʻgʻri sanani kiriting',
  tooManyFiles: (max) => `Koʻpi bilan ${max} rasm`,
  blocked: {
    not_found: { title: 'Soʻrovnoma topilmadi', body: 'Ehtimol, u oʻchirilgan. Ilovaga qayting.' },
    not_active: { title: 'Soʻrovnoma mavjud emas', body: 'U hali boshlanmagan yoki tugagan.' },
    no_token: { title: 'Soʻrovnomani ilovadan oching', body: 'Bu sahifa faqat Pulso ilovasi ichida ishlaydi.' },
    session: { title: 'Sessiya tugadi', body: 'Ilovaga qaytib, soʻrovnomani qayta oching.' },
    network: { title: 'Aloqa yoʻq', body: 'Internetni tekshirib, qayta urinib koʻring.' },
    generic: { title: 'Xatolik yuz berdi', body: 'Birozdan keyin qayta urinib koʻring.' },
  },
  previewBadge: 'Koʻrib chiqish — javoblar saqlanmaydi',
}

const uzCyrl: RespondentStrings = {
  ...uz,
  start: 'Бошлаш',
  next: 'Кейинги',
  back: 'Орқага',
  submit: 'Юбориш',
  submitting: 'Юборилмоқда…',
  skip: 'Ўтказиб юбориш',
  questions: (n) => `${n} савол`,
  takesMinutes: (n) => `~${n} дақиқа`,
  rewardPill: (sum) => `+${sum} ўтиш учун`,
  yes: 'Ҳа',
  no: 'Йўқ',
  npsLow: 'Аниқ йўқ',
  npsHigh: 'Аниқ ҳа',
  addPhoto: 'Расм қўшиш',
  removePhoto: 'Олиб ташлаш',
  uploading: 'Юкланмоқда…',
  uploadFailed: 'Расм юкланмади',
  openPdf: 'PDF ни очиш',
  openImage: 'Очиш',
  doneTitle: 'Раҳмат!',
  doneBody: 'Жавобларингиз сақланди.',
  creditedNote: 'балансга ўтказилди',
  pendingNote: 'тез орада балансда пайдо бўлади',
  alreadyTitle: 'Сиз бу сўровномани аллақачон тўлдиргансиз',
  alreadyBody: 'Қайта тўлдириш мумкин эмас — мукофот бир марта берилади.',
  failedTitle: 'Юбориб бўлмади',
  failedBody: 'Интернетни текшириб, қайта уриниб кўринг. Жавоблар экранда сақланган.',
  returnToApp: 'Иловага қайтиш',
  retry: 'Қайта уриниш',
  required: 'Бу савол мажбурий',
  chooseOne: 'Рўйхатдан вариантни танланг',
  chooseMany: (min, max) =>
    min && max
      ? `${min} дан ${max} гача танланг`
      : min
        ? `Камида ${min} та танланг`
        : max
          ? `Кўпи билан ${max} та`
          : 'Вариантларни танланг',
  tooLong: (max) => `Кўпи билан ${max} белги`,
  outOfRange: (min, max) =>
    min !== undefined && max !== undefined
      ? `${min} дан ${max} гача`
      : min !== undefined
        ? `Камида ${min}`
        : max !== undefined
          ? `Кўпи билан ${max}`
          : 'Нотўғри қиймат',
  invalidNumber: 'Рақам киритинг',
  invalidDate: 'Тўғри санани киритинг',
  tooManyFiles: (max) => `Кўпи билан ${max} расм`,
  blocked: {
    not_found: { title: 'Сўровнома топилмади', body: 'Эҳтимол, у ўчирилган. Иловага қайтинг.' },
    not_active: { title: 'Сўровнома мавжуд эмас', body: 'У ҳали бошланмаган ёки тугаган.' },
    no_token: { title: 'Сўровномани иловадан очинг', body: 'Бу саҳифа фақат Pulso иловаси ичида ишлайди.' },
    session: { title: 'Сессия тугади', body: 'Иловага қайтиб, сўровномани қайта очинг.' },
    network: { title: 'Алоқа йўқ', body: 'Интернетни текшириб, қайта уриниб кўринг.' },
    generic: { title: 'Хатолик юз берди', body: 'Бироздан кейин қайта уриниб кўринг.' },
  },
  previewBadge: 'Кўриб чиқиш — жавоблар сақланмайди',
}

export const RESPONDENT_STRINGS: Record<Locale, RespondentStrings> = { ru, uz, uzCyrl }

function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  const form = abs > 10 && abs < 20 ? forms[2] : last > 1 && last < 5 ? forms[1] : last === 1 ? forms[0] : forms[2]
  return `${n} ${form}`
}

export function normalizeLocale(raw: string | null | undefined): Locale {
  const v = (raw ?? '').toLowerCase().replace(/[-_]/g, '')
  if (v === 'uzcyrl' || v === 'uzcyr' || v === 'uzcyrillic') return 'uzCyrl'
  if (v === 'uz' || v === 'uzlatn' || v === 'uzlatin') return 'uz'
  return 'ru'
}

const SUM_WORD: Record<Locale, string> = { ru: 'сум', uz: "so'm", uzCyrl: 'сўм' }

export function formatSumLocale(n: number, locale: Locale): string {
  return `${n.toLocaleString('ru-RU').replace(/[  ]/g, ' ')} ${SUM_WORD[locale]}`
}
