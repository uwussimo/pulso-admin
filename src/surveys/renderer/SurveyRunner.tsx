import { Label } from '@gravity-ui/uikit'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { isApiError } from '../../api/client'
import type { Locale, MobileSurvey, SubmitSurveyResponse } from '../../api/types'
import { invalidAnswerField } from '../../lib/errors'
import { RESPONDENT_STRINGS } from '../i18n'
import { pruneAnswers, validateAnswer, visibleFields, type AnswerMap, type AnswerValue } from '../schema'
import { BlockedScreen } from './BlockedScreen'
import { DoneScreen } from './DoneScreen'
import { IntroScreen } from './IntroScreen'
import { QuestionScreen } from './QuestionScreen'
import { initialRunnerState, runnerReducer, type RunnerResult } from './runnerReducer'
import './runner.css'

export type RunnerSurvey = Pick<
  MobileSurvey,
  'title' | 'description' | 'cover_image_url' | 'reward_amount' | 'schema'
> & { id?: number }

export interface SurveyRunnerProps {
  survey: RunnerSurvey
  locale: Locale
  mode: 'live' | 'preview'
  onSubmit: (answers: AnswerMap) => Promise<SubmitSurveyResponse>
  /** Uploads one image and returns its public URL. Omitted in preview: object URLs are used instead. */
  onUpload?: (file: File) => Promise<string>
  onReturn?: (reason: 'done' | 'already_completed' | 'blocked') => void
  onOpenUrl?: (url: string) => void
  onCompleted?: (result: SubmitSurveyResponse) => void
  onTokenExpired?: () => void
  /** Render the "already completed" screen right away. */
  already?: RunnerResult | null
}

export function SurveyRunner({
  survey,
  locale,
  mode,
  onSubmit,
  onUpload,
  onReturn,
  onOpenUrl,
  onCompleted,
  onTokenExpired,
  already,
}: SurveyRunnerProps) {
  const t = RESPONDENT_STRINGS[locale]
  const fields = survey.schema.fields
  const [state, dispatch] = useReducer(
    runnerReducer,
    already ? { ...initialRunnerState, step: 'done', result: already } : initialRunnerState,
  )
  const inFlight = useRef(false)

  const visible = useMemo(() => visibleFields(fields, state.answers), [fields, state.answers])
  const field = visible[state.cursor]

  const submit = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const res = await onSubmit(pruneAnswers(fields, state.answers))
      dispatch({ type: 'submitOk', result: { ...res, already: res.already_completed } })
      onCompleted?.(res)
    } catch (e) {
      if (isApiError(e)) {
        if (e.alias === 'surveys.already_completed') {
          dispatch({
            type: 'submitOk',
            result: {
              submission_id: 0,
              reward_amount: survey.reward_amount,
              credited: false,
              already_completed: true,
              completed_at: '',
              already: true,
            },
          })
          return
        }
        const fieldId = invalidAnswerField(e)
        if (fieldId) {
          dispatch({ type: 'jumpTo', fields, fieldId, error: t.required })
          return
        }
        if (e.alias === 'surveys.not_active') {
          dispatch({ type: 'blocked', reason: 'not_active' })
          return
        }
        if (e.alias === 'surveys.not_found' || e.status === 404) {
          dispatch({ type: 'blocked', reason: 'not_found' })
          return
        }
        if (e.status === 401) {
          onTokenExpired?.()
          dispatch({ type: 'blocked', reason: 'session' })
          return
        }
      }
      dispatch({ type: 'submitFail' })
    } finally {
      inFlight.current = false
    }
  }, [fields, onSubmit, onCompleted, onTokenExpired, state.answers, survey.reward_amount, t.required])

  // The reducer moves to `submitting` when the last visible question is committed; the effect does the I/O.
  const submitting = state.step === 'submitting'
  useEffect(() => {
    if (submitting) void submit()
  }, [submitting, submit])

  function next(draft: AnswerValue | undefined) {
    if (!field) return
    const value = field.type === 'slide' ? 'viewed' : draft
    const err = validateAnswer(field, value, t)
    if (err && !(field.type === 'image_upload' && mode === 'preview' && err === t.required)) {
      dispatch({ type: 'setError', error: err })
      return
    }
    dispatch({ type: 'commitNext', fields, value })
  }

  const returnReason = state.result?.already ? 'already_completed' : state.step === 'blocked' ? 'blocked' : 'done'

  let body: React.ReactNode
  switch (state.step) {
    case 'intro':
      body = <IntroScreen survey={survey} locale={locale} t={t} onStart={() => dispatch({ type: 'start', fields })} />
      break
    case 'ask':
    case 'submitting':
      body = field ? (
        <QuestionScreen
          key={field.id}
          field={field}
          index={state.cursor}
          total={visible.length}
          draft={state.draft}
          error={state.error}
          locale={locale}
          t={t}
          busy={submitting}
          isLast={state.cursor === visible.length - 1}
          onDraft={(v) => dispatch({ type: 'setDraft', value: v })}
          onNext={next}
          onBack={() => dispatch({ type: 'back', fields })}
          onUpload={onUpload}
          onOpenUrl={onOpenUrl}
        />
      ) : null
      break
    case 'done':
      body = (
        <DoneScreen
          result={state.result}
          rewardAmount={survey.reward_amount}
          locale={locale}
          t={t}
          onReturn={() => onReturn?.(returnReason)}
        />
      )
      break
    case 'failed':
      body = (
        <BlockedScreen
          title={t.failedTitle}
          body={t.failedBody}
          t={t}
          onRetry={() => dispatch({ type: 'submitStart' })}
          onSecondary={() => dispatch({ type: 'backToQuestions', fields })}
          secondaryLabel={t.back}
        />
      )
      break
    case 'blocked':
      body = (
        <BlockedScreen
          title={t.blocked[state.blockedReason ?? 'generic'].title}
          body={t.blocked[state.blockedReason ?? 'generic'].body}
          t={t}
          onReturn={() => onReturn?.('blocked')}
        />
      )
      break
  }

  return (
    <div className="runner">
      {body}
      {mode === 'preview' ? (
        <div className="runner__preview-badge">
          <Label theme="warning" size="s">
            {t.previewBadge}
          </Label>
        </div>
      ) : null}
    </div>
  )
}
