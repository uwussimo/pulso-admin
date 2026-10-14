import type { SubmitSurveyResponse } from '../../api/types'
import type { AnswerMap, AnswerValue, SurveyField } from '../schema'
import { visibleFields } from '../schema'
import type { BlockedReason } from '../i18n'

export type RunnerStep = 'intro' | 'ask' | 'submitting' | 'done' | 'failed' | 'blocked'

export interface RunnerResult extends SubmitSurveyResponse {
  already?: boolean
}

export interface RunnerState {
  step: RunnerStep
  cursor: number
  /** Committed answers (Next was pressed). */
  answers: AnswerMap
  /** Value of the question on screen, not yet committed. */
  draft: AnswerValue | undefined
  error: string | null
  result: RunnerResult | null
  blockedReason: BlockedReason | null
}

export type RunnerAction =
  | { type: 'start'; fields: SurveyField[] }
  | { type: 'setDraft'; value: AnswerValue | undefined }
  | { type: 'commitNext'; fields: SurveyField[]; value: AnswerValue | undefined }
  | { type: 'back'; fields: SurveyField[] }
  | { type: 'jumpTo'; fields: SurveyField[]; fieldId: string; error: string }
  | { type: 'setError'; error: string | null }
  | { type: 'submitStart' }
  | { type: 'submitOk'; result: RunnerResult }
  | { type: 'submitFail' }
  | { type: 'backToQuestions'; fields: SurveyField[] }
  | { type: 'blocked'; reason: BlockedReason }
  | { type: 'reset' }

export const initialRunnerState: RunnerState = {
  step: 'intro',
  cursor: 0,
  answers: {},
  draft: undefined,
  error: null,
  result: null,
  blockedReason: null,
}

export function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'start': {
      const visible = visibleFields(action.fields, state.answers)
      if (visible.length === 0) return { ...state, step: 'submitting', error: null }
      return { ...state, step: 'ask', cursor: 0, draft: state.answers[visible[0].id], error: null }
    }
    case 'setDraft':
      return { ...state, draft: action.value, error: null }
    case 'commitNext': {
      const visibleBefore = visibleFields(action.fields, state.answers)
      const current = visibleBefore[state.cursor]
      if (!current) return state
      const answers: AnswerMap = { ...state.answers, [current.id]: action.value }
      // Recompute with the new answer: it may reveal or hide the questions after it.
      const visibleAfter = visibleFields(action.fields, answers)
      const idx = visibleAfter.findIndex((f) => f.id === current.id)
      const nextIdx = idx + 1
      if (nextIdx >= visibleAfter.length) return { ...state, answers, step: 'submitting', error: null }
      return { ...state, answers, cursor: nextIdx, draft: answers[visibleAfter[nextIdx].id], error: null }
    }
    case 'back': {
      if (state.cursor === 0) return { ...state, step: 'intro', error: null }
      const visible = visibleFields(action.fields, state.answers)
      const prev = Math.min(state.cursor - 1, visible.length - 1)
      return { ...state, cursor: prev, draft: state.answers[visible[prev]?.id ?? ''], error: null }
    }
    case 'jumpTo': {
      const visible = visibleFields(action.fields, state.answers)
      const idx = visible.findIndex((f) => f.id === action.fieldId)
      if (idx === -1) return { ...state, step: 'failed', error: action.error }
      return { ...state, step: 'ask', cursor: idx, draft: state.answers[action.fieldId], error: action.error }
    }
    case 'setError':
      return { ...state, error: action.error }
    case 'submitStart':
      return { ...state, step: 'submitting', error: null }
    case 'submitOk':
      return { ...state, step: 'done', result: action.result, error: null }
    case 'submitFail':
      return { ...state, step: 'failed' }
    case 'backToQuestions': {
      const visible = visibleFields(action.fields, state.answers)
      const last = Math.max(0, visible.length - 1)
      return { ...state, step: 'ask', cursor: last, draft: state.answers[visible[last]?.id ?? ''], error: null }
    }
    case 'blocked':
      return { ...state, step: 'blocked', blockedReason: action.reason }
    case 'reset':
      return initialRunnerState
  }
}
