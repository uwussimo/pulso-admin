import type { LocaleMap, Survey, SurveyWriteRequest } from '../../../api/types'
import { rfc3339ToTashkentLocalInput, tashkentLocalToRfc3339 } from '../../../lib/format'
import { compactLocaleMap } from '../../notifications/locale'
import {
  duplicateField,
  makeField,
  slugifyKey,
  stripConditionsReferencing,
  uniqueKey,
  type QuestionType,
  type SurveyField,
} from '../../../surveys/schema'

export interface EditorMeta {
  title: LocaleMap
  description: LocaleMap
  coverImageUrl: string
  rewardAmount: number | null
  scheduled: boolean
  /** datetime-local strings in Tashkent time */
  startsAt: string
  autoClose: boolean
  endsAt: string
}

export interface EditorState {
  meta: EditorMeta
  fields: SurveyField[]
  selectedId: string | null
  dirty: boolean
  /** Keys the operator edited by hand stop following the Russian label. */
  keyTouched: Record<string, boolean>
}

export type EditorAction =
  | { type: 'load'; survey: Survey }
  | { type: 'setMeta'; patch: Partial<EditorMeta> }
  | { type: 'addField'; fieldType: QuestionType }
  | { type: 'updateField'; id: string; patch: Partial<SurveyField> }
  | { type: 'removeField'; id: string }
  | { type: 'moveField'; id: string; dir: -1 | 1 }
  | { type: 'duplicateField'; id: string }
  | { type: 'select'; id: string | null }
  | { type: 'markKeyTouched'; id: string }
  | { type: 'saved'; survey: Survey }

export const emptyEditorState: EditorState = {
  meta: {
    title: {},
    description: {},
    coverImageUrl: '',
    rewardAmount: 5000,
    scheduled: false,
    startsAt: '',
    autoClose: false,
    endsAt: '',
  },
  fields: [],
  selectedId: null,
  dirty: false,
  keyTouched: {},
}

export function stateFromSurvey(survey: Survey): EditorState {
  const keyTouched: Record<string, boolean> = {}
  for (const f of survey.schema.fields) {
    // A stored key that no longer matches its label was edited by hand (or the label changed later).
    if (f.key !== slugifyKey(f.label.ru ?? '')) keyTouched[f.id] = true
  }
  return {
    meta: {
      title: { ...survey.title },
      description: { ...(survey.description ?? {}) },
      coverImageUrl: survey.cover_image_url ?? '',
      rewardAmount: survey.reward_amount,
      scheduled: Boolean(survey.starts_at),
      startsAt: rfc3339ToTashkentLocalInput(survey.starts_at),
      autoClose: Boolean(survey.ends_at),
      endsAt: rfc3339ToTashkentLocalInput(survey.ends_at),
    },
    fields: structuredClone(survey.schema.fields),
    selectedId: null,
    dirty: false,
    keyTouched,
  }
}

function keysOf(fields: SurveyField[], except?: string): string[] {
  return fields.filter((f) => f.id !== except).map((f) => f.key)
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'load':
    case 'saved':
      return stateFromSurvey(action.survey)
    case 'setMeta':
      return { ...state, meta: { ...state.meta, ...action.patch }, dirty: true }
    case 'addField': {
      const field = makeField(action.fieldType, keysOf(state.fields))
      return { ...state, fields: [...state.fields, field], selectedId: field.id, dirty: true }
    }
    case 'updateField': {
      const fields = state.fields.map((f) => {
        if (f.id !== action.id) return f
        const next = { ...f, ...action.patch } as SurveyField
        const labelChanged = action.patch.label && action.patch.label.ru !== f.label.ru
        if (labelChanged && !state.keyTouched[f.id]) {
          next.key = uniqueKey(slugifyKey(next.label.ru ?? ''), keysOf(state.fields, f.id))
        }
        return next
      })
      return { ...state, fields, dirty: true }
    }
    case 'removeField': {
      const fields = stripConditionsReferencing(
        state.fields.filter((f) => f.id !== action.id),
        action.id,
      )
      return { ...state, fields, selectedId: state.selectedId === action.id ? null : state.selectedId, dirty: true }
    }
    case 'moveField': {
      const i = state.fields.findIndex((f) => f.id === action.id)
      const j = i + action.dir
      if (i === -1 || j < 0 || j >= state.fields.length) return state
      const fields = state.fields.slice()
      ;[fields[i], fields[j]] = [fields[j], fields[i]]
      return { ...state, fields, dirty: true }
    }
    case 'duplicateField': {
      const i = state.fields.findIndex((f) => f.id === action.id)
      if (i === -1) return state
      const copy = duplicateField(state.fields[i], keysOf(state.fields))
      const fields = [...state.fields.slice(0, i + 1), copy, ...state.fields.slice(i + 1)]
      return {
        ...state,
        fields,
        selectedId: copy.id,
        dirty: true,
        keyTouched: { ...state.keyTouched, [copy.id]: true },
      }
    }
    case 'select':
      return { ...state, selectedId: action.id }
    case 'markKeyTouched':
      return { ...state, keyTouched: { ...state.keyTouched, [action.id]: true } }
  }
}

export function toWriteRequest(state: EditorState): SurveyWriteRequest {
  const { meta } = state
  return {
    title: compactLocaleMap(meta.title),
    description: compactLocaleMap(meta.description),
    cover_image_url: meta.coverImageUrl || undefined,
    reward_amount: meta.rewardAmount ?? 0,
    starts_at: meta.scheduled && meta.startsAt ? tashkentLocalToRfc3339(meta.startsAt) : null,
    ends_at: meta.autoClose && meta.endsAt ? tashkentLocalToRfc3339(meta.endsAt) : null,
    schema: { version: 1, fields: state.fields },
  }
}

/** Form-level checks the schema validator does not cover. */
export function validateMeta(meta: EditorMeta): string | null {
  if (!meta.title.ru?.trim()) return 'Нужно название опроса на русском.'
  if (meta.rewardAmount !== null && (meta.rewardAmount < 0 || !Number.isInteger(meta.rewardAmount))) {
    return 'Награда — целое число сум, не меньше 0.'
  }
  const start = meta.scheduled && meta.startsAt ? tashkentLocalToRfc3339(meta.startsAt) : null
  const end = meta.autoClose && meta.endsAt ? tashkentLocalToRfc3339(meta.endsAt) : null
  if (meta.scheduled && !start) return 'Укажите дату и время начала.'
  if (meta.autoClose && !end) return 'Укажите дату и время окончания.'
  if (start && end && new Date(start) >= new Date(end)) return 'Окончание должно быть позже начала.'
  if (end && new Date(end).getTime() <= Date.now()) return 'Окончание уже в прошлом.'
  return null
}
