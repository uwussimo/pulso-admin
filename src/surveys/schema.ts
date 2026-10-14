// Survey form schema shared by the builder, the respondent renderer and the admin
// pages. Mirrors the Dorim Forms grammar byte-for-byte: the backend stores and
// validates the same JSON, so field names here are a contract, not a style choice.
import type { Locale, LocaleMap } from '../api/types'

export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'text'
  | 'textarea'
  | 'number'
  | 'rating'
  | 'nps'
  | 'yes_no'
  | 'date'
  | 'image_upload'
  | 'slide'

export const QUESTION_TYPES: QuestionType[] = [
  'single_choice',
  'multi_choice',
  'text',
  'textarea',
  'number',
  'rating',
  'nps',
  'yes_no',
  'date',
  'image_upload',
  'slide',
]

export type Condition =
  | { type: 'and'; rules: Condition[] }
  | { type: 'or'; rules: Condition[] }
  | { type: 'equals' | 'not_equals'; fieldId: string; value: string | number | boolean }
  | { type: 'in'; fieldId: string; values: (string | number)[] }
  | { type: 'gt' | 'gte' | 'lt' | 'lte'; fieldId: string; value: number }
  | { type: 'answered'; fieldId: string }

export type SimpleConditionType = 'answered' | 'equals' | 'not_equals' | 'gte' | 'lte'

export interface Choice {
  id: string
  value: string
  label: LocaleMap
}

export interface SlideAsset {
  id: string
  url: string
  name?: string
  mime: string
}

interface FieldBase {
  id: string
  key: string
  label: LocaleMap
  help?: LocaleMap
  required?: boolean
  visibleWhen?: Condition
}

export type SurveyField = FieldBase &
  (
    | { type: 'text' | 'textarea'; placeholder?: LocaleMap; maxLength?: number }
    | { type: 'number'; min?: number; max?: number; step?: number }
    | { type: 'rating'; max: number }
    | { type: 'nps' }
    | { type: 'single_choice'; options: Choice[] }
    | { type: 'multi_choice'; options: Choice[]; min?: number; max?: number }
    | { type: 'yes_no' }
    | { type: 'date'; minDate?: string; maxDate?: string }
    | { type: 'image_upload'; maxFiles: number }
    | { type: 'slide'; slides: SlideAsset[] }
  )

export interface SurveySchema {
  version: 1
  fields: SurveyField[]
}

export type AnswerValue = string | number | boolean | string[]
export type AnswerMap = Record<string, AnswerValue | undefined>

export const TEXT_MAX = 1000
export const TEXTAREA_MAX = 5000
export const RATING_MIN_MAX = 2
export const RATING_MAX_MAX = 10
export const IMAGE_MAX_FILES = 5
export const OPTIONS_MIN = 2
export const OPTIONS_MAX = 50
export const KEY_RE = /^[a-z][a-z0-9_]{0,63}$/

export function emptySchema(): SurveySchema {
  return { version: 1, fields: [] }
}

export function isEmptyAnswer(v: AnswerValue | undefined | null): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function asNumber(v: AnswerValue | undefined): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function scalarEquals(a: AnswerValue, b: string | number | boolean): boolean {
  if (typeof a === 'boolean' || typeof b === 'boolean') return a === b
  return String(a) === String(b)
}

/** Same semantics as the backend: array answers use "includes"/"any overlap"; numeric ops on non-numbers are false. */
export function evalCondition(cond: Condition, answers: AnswerMap): boolean {
  switch (cond.type) {
    case 'and':
      return cond.rules.length > 0 && cond.rules.every((r) => evalCondition(r, answers))
    case 'or':
      return cond.rules.some((r) => evalCondition(r, answers))
    case 'answered':
      return !isEmptyAnswer(answers[cond.fieldId])
    case 'equals':
    case 'not_equals': {
      const v = answers[cond.fieldId]
      if (isEmptyAnswer(v) || v === undefined) return false
      const hit = Array.isArray(v) ? v.some((x) => scalarEquals(x, cond.value)) : scalarEquals(v, cond.value)
      return cond.type === 'equals' ? hit : !hit
    }
    case 'in': {
      const v = answers[cond.fieldId]
      if (isEmptyAnswer(v) || v === undefined) return false
      const set = cond.values.map(String)
      return Array.isArray(v) ? v.some((x) => set.includes(String(x))) : set.includes(String(v))
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const n = asNumber(answers[cond.fieldId])
      if (n === null) return false
      if (cond.type === 'gt') return n > cond.value
      if (cond.type === 'gte') return n >= cond.value
      if (cond.type === 'lt') return n < cond.value
      return n <= cond.value
    }
  }
}

/** Fields the respondent should see, in order. A hidden field's answer is invisible to later conditions. */
export function visibleFields(fields: SurveyField[], answers: AnswerMap): SurveyField[] {
  const out: SurveyField[] = []
  const seen: AnswerMap = {}
  for (const f of fields) {
    const visible = !f.visibleWhen || evalCondition(f.visibleWhen, seen)
    if (!visible) continue
    out.push(f)
    if (answers[f.id] !== undefined) seen[f.id] = answers[f.id]
  }
  return out
}

/** Keep only answers of visible, non-empty fields — what gets sent to the backend. */
export function pruneAnswers(fields: SurveyField[], answers: AnswerMap): AnswerMap {
  const out: AnswerMap = {}
  for (const f of visibleFields(fields, answers)) {
    const v = answers[f.id]
    if (!isEmptyAnswer(v)) out[f.id] = v
  }
  return out
}

export interface AnswerStrings {
  required: string
  chooseOne: string
  chooseMany: (min?: number, max?: number) => string
  tooLong: (max: number) => string
  outOfRange: (min?: number, max?: number) => string
  invalidNumber: string
  invalidDate: string
  tooManyFiles: (max: number) => string
}

/** Client-side mirror of the backend's per-type answer checks. Returns a message or null. */
export function validateAnswer(field: SurveyField, value: AnswerValue | undefined, t: AnswerStrings): string | null {
  if (field.type === 'slide') return null
  if (isEmptyAnswer(value)) return field.required ? t.required : null
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const max = field.maxLength ?? (field.type === 'text' ? TEXT_MAX : TEXTAREA_MAX)
      if (typeof value !== 'string') return t.required
      if ([...value].length > max) return t.tooLong(max)
      return null
    }
    case 'number': {
      const n = asNumber(value)
      if (n === null) return t.invalidNumber
      if ((field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)) {
        return t.outOfRange(field.min, field.max)
      }
      return null
    }
    case 'rating': {
      const n = asNumber(value)
      if (n === null || !Number.isInteger(n) || n < 1 || n > field.max) return t.outOfRange(1, field.max)
      return null
    }
    case 'nps': {
      const n = asNumber(value)
      if (n === null || !Number.isInteger(n) || n < 0 || n > 10) return t.outOfRange(0, 10)
      return null
    }
    case 'single_choice': {
      if (typeof value !== 'string' || !field.options.some((o) => o.value === value)) return t.chooseOne
      return null
    }
    case 'multi_choice': {
      if (!Array.isArray(value) || value.some((v) => !field.options.some((o) => o.value === v))) return t.chooseOne
      const min = field.min ?? (field.required ? 1 : 0)
      if (value.length < min || (field.max !== undefined && value.length > field.max)) {
        return t.chooseMany(field.min, field.max)
      }
      return null
    }
    case 'yes_no':
      return typeof value === 'boolean' ? null : t.required
    case 'date': {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
        return t.invalidDate
      }
      if ((field.minDate && value < field.minDate) || (field.maxDate && value > field.maxDate)) return t.invalidDate
      return null
    }
    case 'image_upload': {
      if (!Array.isArray(value)) return t.required
      if (value.length > field.maxFiles) return t.tooManyFiles(field.maxFiles)
      return null
    }
  }
}

// ---- builder-side validation ----

export type SchemaIssuePath = 'key' | 'label' | 'options' | 'visibleWhen' | 'slides' | 'rating' | 'range' | 'fields'

export interface SchemaIssue {
  fieldId?: string
  path: SchemaIssuePath
  message: string
}

export function conditionRefs(cond: Condition | undefined): string[] {
  if (!cond) return []
  if (cond.type === 'and' || cond.type === 'or') return cond.rules.flatMap(conditionRefs)
  return [cond.fieldId]
}

function conditionDepth(cond: Condition): number {
  if (cond.type === 'and' || cond.type === 'or') return 1 + Math.max(0, ...cond.rules.map(conditionDepth))
  return 1
}

const NUMERIC_TYPES: QuestionType[] = ['number', 'rating', 'nps']

/** The same rules the backend applies on save and publish; `publish` adds the completeness checks. */
export function validateSchema(schema: SurveySchema, publish = false): SchemaIssue[] {
  const issues: SchemaIssue[] = []
  const fields = schema.fields
  if (fields.length > 100) issues.push({ path: 'fields', message: 'Не больше 100 вопросов' })
  if (publish && !fields.some((f) => f.type !== 'slide')) {
    issues.push({ path: 'fields', message: 'Добавьте хотя бы один вопрос (не слайд)' })
  }
  const keys = new Set<string>()
  const ids = new Set<string>()
  fields.forEach((f, i) => {
    if (!f.id || ids.has(f.id))
      issues.push({ fieldId: f.id, path: 'fields', message: `Вопрос ${i + 1}: дублируется id` })
    ids.add(f.id)
    if (!KEY_RE.test(f.key)) {
      issues.push({ fieldId: f.id, path: 'key', message: 'Ключ: латиница, цифры и _, начинается с буквы' })
    } else if (keys.has(f.key)) {
      issues.push({ fieldId: f.id, path: 'key', message: `Ключ «${f.key}» уже используется` })
    }
    keys.add(f.key)
    if (publish && f.type !== 'slide' && !f.label.ru?.trim()) {
      issues.push({ fieldId: f.id, path: 'label', message: 'Нужен текст вопроса на русском' })
    }
    switch (f.type) {
      case 'single_choice':
      case 'multi_choice': {
        if (f.options.length < OPTIONS_MIN || f.options.length > OPTIONS_MAX) {
          issues.push({ fieldId: f.id, path: 'options', message: `От ${OPTIONS_MIN} до ${OPTIONS_MAX} вариантов` })
        }
        const values = new Set<string>()
        for (const o of f.options) {
          if (!o.value.trim()) issues.push({ fieldId: f.id, path: 'options', message: 'У варианта пустое значение' })
          else if (values.has(o.value)) {
            issues.push({ fieldId: f.id, path: 'options', message: `Значение «${o.value}» повторяется` })
          }
          values.add(o.value)
          if (publish && !o.label.ru?.trim()) {
            issues.push({ fieldId: f.id, path: 'options', message: 'У варианта нет текста на русском' })
          }
        }
        if (f.type === 'multi_choice') {
          const min = f.min ?? 0
          const max = f.max ?? f.options.length
          if (min < 0 || min > max || max > f.options.length) {
            issues.push({ fieldId: f.id, path: 'range', message: 'Минимум и максимум выборов не согласованы' })
          }
        }
        break
      }
      case 'rating':
        if (!Number.isInteger(f.max) || f.max < RATING_MIN_MAX || f.max > RATING_MAX_MAX) {
          issues.push({ fieldId: f.id, path: 'rating', message: `Шкала от ${RATING_MIN_MAX} до ${RATING_MAX_MAX}` })
        }
        break
      case 'number':
        if (f.min !== undefined && f.max !== undefined && f.min > f.max) {
          issues.push({ fieldId: f.id, path: 'range', message: 'Минимум больше максимума' })
        }
        break
      case 'text':
      case 'textarea': {
        const cap = f.type === 'text' ? TEXT_MAX : TEXTAREA_MAX
        if (f.maxLength !== undefined && (f.maxLength < 1 || f.maxLength > cap)) {
          issues.push({ fieldId: f.id, path: 'range', message: `Длина от 1 до ${cap} символов` })
        }
        break
      }
      case 'date':
        if (f.minDate && f.maxDate && f.minDate > f.maxDate) {
          issues.push({ fieldId: f.id, path: 'range', message: 'Дата «не раньше» позже даты «не позже»' })
        }
        break
      case 'image_upload':
        if (!Number.isInteger(f.maxFiles) || f.maxFiles < 1 || f.maxFiles > IMAGE_MAX_FILES) {
          issues.push({ fieldId: f.id, path: 'range', message: `От 1 до ${IMAGE_MAX_FILES} фото` })
        }
        break
      case 'slide':
        if (f.slides.length === 0)
          issues.push({ fieldId: f.id, path: 'slides', message: 'Загрузите хотя бы один слайд' })
        break
      default:
        break
    }
    if (f.visibleWhen) {
      if (conditionDepth(f.visibleWhen) > 5) {
        issues.push({ fieldId: f.id, path: 'visibleWhen', message: 'Слишком сложное условие' })
      }
      for (const ref of conditionRefs(f.visibleWhen)) {
        const idx = fields.findIndex((x) => x.id === ref)
        if (idx === -1 || idx >= i) {
          issues.push({ fieldId: f.id, path: 'visibleWhen', message: 'Условие ссылается на вопрос ниже или удалённый' })
        } else if (fields[idx].type === 'slide') {
          issues.push({ fieldId: f.id, path: 'visibleWhen', message: 'Условие не может ссылаться на слайд' })
        } else {
          const leaf = f.visibleWhen
          if (
            (leaf.type === 'gt' || leaf.type === 'gte' || leaf.type === 'lt' || leaf.type === 'lte') &&
            !NUMERIC_TYPES.includes(fields[idx].type)
          ) {
            issues.push({ fieldId: f.id, path: 'visibleWhen', message: 'Сравнение чисел только для числовых вопросов' })
          }
        }
      }
    }
  })
  return issues
}

// ---- factory helpers ----

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().slice(0, 8)
  return Math.random().toString(36).slice(2, 10)
}

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
}

export function slugifyKey(text: string): string {
  const lower = text.toLowerCase().trim()
  let out = ''
  for (const ch of lower) out += TRANSLIT[ch] ?? ch
  out = out
    .replace(/['’ʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
    .replace(/_+$/g, '')
  if (!out || /^[0-9]/.test(out)) out = `q_${out}`
  return out.replace(/_+$/g, '') || 'q'
}

export function uniqueKey(base: string, existing: Iterable<string>): string {
  const taken = new Set(existing)
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const k = `${base.slice(0, 60)}_${i}`
    if (!taken.has(k)) return k
  }
  return `${base}_${newId()}`
}

const DEFAULT_LABEL: Record<QuestionType, LocaleMap> = {
  single_choice: { ru: 'Выберите один вариант', uz: 'Bitta variantni tanlang', uzCyrl: 'Битта вариантни танланг' },
  multi_choice: {
    ru: 'Выберите подходящие варианты',
    uz: 'Mos variantlarni tanlang',
    uzCyrl: 'Мос вариантларни танланг',
  },
  text: { ru: 'Короткий ответ', uz: 'Qisqa javob', uzCyrl: 'Қисқа жавоб' },
  textarea: { ru: 'Расскажите подробнее', uz: 'Batafsil yozing', uzCyrl: 'Батафсил ёзинг' },
  number: { ru: 'Укажите число', uz: 'Raqamni kiriting', uzCyrl: 'Рақамни киритинг' },
  rating: { ru: 'Оцените', uz: 'Baholang', uzCyrl: 'Баҳоланг' },
  nps: {
    ru: 'Насколько вероятно, что вы порекомендуете нас?',
    uz: 'Bizni tavsiya qilish ehtimoli qanchalik?',
    uzCyrl: 'Бизни тавсия қилиш эҳтимоли қанчалик?',
  },
  yes_no: { ru: 'Да или нет?', uz: 'Ha yoki yoʻq?', uzCyrl: 'Ҳа ёки йўқ?' },
  date: { ru: 'Укажите дату', uz: 'Sanani kiriting', uzCyrl: 'Санани киритинг' },
  image_upload: { ru: 'Прикрепите фото', uz: 'Rasm biriktiring', uzCyrl: 'Расм бириктиринг' },
  slide: { ru: 'Посмотрите материалы', uz: 'Materiallarni koʻring', uzCyrl: 'Материалларни кўринг' },
}

function defaultOptions(): Choice[] {
  return [
    { id: newId(), value: 'option_1', label: { ru: 'Вариант 1', uz: 'Variant 1', uzCyrl: 'Вариант 1' } },
    { id: newId(), value: 'option_2', label: { ru: 'Вариант 2', uz: 'Variant 2', uzCyrl: 'Вариант 2' } },
  ]
}

export function makeField(type: QuestionType, existingKeys: Iterable<string>): SurveyField {
  const label = { ...DEFAULT_LABEL[type] }
  const base: FieldBase = {
    id: newId(),
    key: uniqueKey(slugifyKey(label.ru ?? type), existingKeys),
    label,
    required: type !== 'slide',
  }
  switch (type) {
    case 'single_choice':
      return { ...base, type, options: defaultOptions() }
    case 'multi_choice':
      return { ...base, type, options: defaultOptions() }
    case 'text':
    case 'textarea':
      return { ...base, type }
    case 'number':
      return { ...base, type }
    case 'rating':
      return { ...base, type, max: 5 }
    case 'nps':
      return { ...base, type }
    case 'yes_no':
      return { ...base, type }
    case 'date':
      return { ...base, type }
    case 'image_upload':
      return { ...base, type, maxFiles: 1 }
    case 'slide':
      return { ...base, type, required: false, slides: [] }
  }
}

export function duplicateField(field: SurveyField, existingKeys: Iterable<string>): SurveyField {
  const copy = structuredClone(field)
  copy.id = newId()
  copy.key = uniqueKey(field.key, existingKeys)
  delete copy.visibleWhen
  if (copy.type === 'single_choice' || copy.type === 'multi_choice') {
    copy.options = copy.options.map((o) => ({ ...o, id: newId() }))
  }
  if (copy.type === 'slide') copy.slides = copy.slides.map((s) => ({ ...s, id: newId() }))
  return copy
}

/** Drop conditions that point at a removed field so the schema stays valid after a delete. */
export function stripConditionsReferencing(fields: SurveyField[], removedId: string): SurveyField[] {
  return fields.map((f) => {
    if (!f.visibleWhen || !conditionRefs(f.visibleWhen).includes(removedId)) return f
    const { visibleWhen: _dropped, ...rest } = f
    return rest as SurveyField
  })
}

export function pickText(map: LocaleMap | undefined, locale: Locale): string {
  if (!map) return ''
  return map[locale]?.trim() || map.ru?.trim() || map.uz?.trim() || map.uzCyrl?.trim() || ''
}

export function optionLabel(field: SurveyField, value: string, locale: Locale): string {
  if (field.type !== 'single_choice' && field.type !== 'multi_choice') return value
  const o = field.options.find((x) => x.value === value)
  return o ? pickText(o.label, locale) || value : value
}

export type FormattedAnswer = { kind: 'text'; text: string } | { kind: 'images'; urls: string[] }

/** Human form of a stored answer for the responses table and dialog. */
export function formatAnswer(
  field: SurveyField | undefined,
  value: AnswerValue | undefined,
  locale: Locale = 'ru',
): FormattedAnswer {
  if (isEmptyAnswer(value) || value === undefined) return { kind: 'text', text: '—' }
  if (!field) return { kind: 'text', text: Array.isArray(value) ? value.join(', ') : String(value) }
  switch (field.type) {
    case 'single_choice':
      return { kind: 'text', text: optionLabel(field, String(value), locale) }
    case 'multi_choice':
      return {
        kind: 'text',
        text: (Array.isArray(value) ? value : [String(value)]).map((v) => optionLabel(field, v, locale)).join(', '),
      }
    case 'yes_no':
      return { kind: 'text', text: value === true ? 'Да' : value === false ? 'Нет' : String(value) }
    case 'image_upload':
      return { kind: 'images', urls: Array.isArray(value) ? value : [String(value)] }
    case 'slide':
      return { kind: 'text', text: 'Просмотрено' }
    case 'rating':
      return { kind: 'text', text: `${value} из ${field.max}` }
    case 'date': {
      const d = new Date(String(value))
      return { kind: 'text', text: Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('ru-RU') }
    }
    default:
      return { kind: 'text', text: Array.isArray(value) ? value.join(', ') : String(value) }
  }
}

export function estimateMinutes(fields: SurveyField[]): number {
  return Math.max(1, Math.round((fields.filter((f) => f.type !== 'slide').length * 20) / 60))
}

export function conditionSentence(fields: SurveyField[], cond: Condition | undefined, locale: Locale = 'ru'): string {
  if (!cond) return ''
  if (cond.type === 'and' || cond.type === 'or') {
    return cond.rules.map((r) => conditionSentence(fields, r, locale)).join(cond.type === 'and' ? ' и ' : ' или ')
  }
  const src = fields.find((f) => f.id === cond.fieldId)
  const name = src ? pickText(src.label, locale) || src.key : cond.fieldId
  const fmt = (v: string | number | boolean) =>
    typeof v === 'boolean' ? (v ? 'Да' : 'Нет') : src ? optionLabel(src, String(v), locale) : String(v)
  switch (cond.type) {
    case 'answered':
      return `«${name}» отвечен`
    case 'equals':
      return `«${name}» = ${fmt(cond.value)}`
    case 'not_equals':
      return `«${name}» ≠ ${fmt(cond.value)}`
    case 'in':
      return `«${name}» ∈ {${cond.values.map(fmt).join(', ')}}`
    case 'gt':
      return `«${name}» > ${cond.value}`
    case 'gte':
      return `«${name}» ≥ ${cond.value}`
    case 'lt':
      return `«${name}» < ${cond.value}`
    case 'lte':
      return `«${name}» ≤ ${cond.value}`
  }
}
