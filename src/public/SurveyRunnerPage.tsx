import { Flex, Loader } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isApiError } from '../api/client'
import { RESPONDENT_STRINGS, type BlockedReason } from '../surveys/i18n'
import { BlockedScreen } from '../surveys/renderer/BlockedScreen'
import { SurveyRunner } from '../surveys/renderer/SurveyRunner'
import { openExternal, postToApp, returnToApp } from './bridge'
import { publicApi, readFragment } from './publicClient'

function blockedReasonOf(e: unknown): BlockedReason {
  if (!isApiError(e)) return 'generic'
  if (e.status === 0) return 'network'
  if (e.status === 401 || e.status === 403) return 'session'
  if (e.alias === 'surveys.not_found' || e.status === 404) return 'not_found'
  if (e.alias === 'surveys.not_active') return 'not_active'
  return 'generic'
}

export function SurveyRunnerPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const frag = useMemo(() => readFragment(), [])
  const t = RESPONDENT_STRINGS[frag.lang]
  const token = frag.token

  useEffect(() => {
    document.documentElement.lang = frag.lang === 'ru' ? 'ru' : 'uz'
    document.body.classList.add('runner-body')
    return () => document.body.classList.remove('runner-body')
  }, [frag.lang])

  const query = useQuery({
    queryKey: ['public-survey', id],
    queryFn: ({ signal }) => publicApi.getSurvey(id, token ?? '', signal),
    enabled: Boolean(token) && Number.isInteger(id) && id > 0,
    retry: 1,
  })

  useEffect(() => {
    if (query.data) postToApp({ type: 'survey_ready', survey_id: id })
  }, [query.data, id])

  useEffect(() => {
    if (query.isError && isApiError(query.error) && query.error.status === 401) {
      postToApp({ type: 'survey_token_expired', survey_id: id })
    }
  }, [query.isError, query.error, id])

  const close = (reason: 'done' | 'already_completed' | 'blocked') =>
    returnToApp({ type: 'survey_close', survey_id: id, reason })

  if (!token || !Number.isInteger(id) || id <= 0) {
    const reason: BlockedReason = token ? 'not_found' : 'no_token'
    return (
      <div className="runner">
        <BlockedScreen
          title={t.blocked[reason].title}
          body={t.blocked[reason].body}
          t={t}
          onReturn={() => close('blocked')}
        />
      </div>
    )
  }
  if (query.isPending) {
    return (
      <Flex centerContent style={{ minHeight: '100dvh' }}>
        <Loader size="l" />
      </Flex>
    )
  }
  if (query.isError) {
    const reason = blockedReasonOf(query.error)
    return (
      <div className="runner">
        <BlockedScreen
          title={t.blocked[reason].title}
          body={t.blocked[reason].body}
          t={t}
          onRetry={reason === 'network' || reason === 'generic' ? () => void query.refetch() : undefined}
          onReturn={() => close('blocked')}
        />
      </div>
    )
  }

  const { survey, user_state } = query.data
  if (user_state.status !== 'completed' && !survey.is_active) {
    return (
      <div className="runner">
        <BlockedScreen
          title={t.blocked.not_active.title}
          body={t.blocked.not_active.body}
          t={t}
          onReturn={() => close('blocked')}
        />
      </div>
    )
  }

  return (
    <SurveyRunner
      survey={survey}
      locale={frag.lang}
      mode="live"
      already={
        user_state.status === 'completed'
          ? {
              submission_id: user_state.submission_id ?? 0,
              reward_amount: survey.reward_amount,
              credited: false,
              already_completed: true,
              completed_at: user_state.completed_at ?? '',
              already: true,
            }
          : null
      }
      onSubmit={(answers) => publicApi.submit(id, token, { answers })}
      onUpload={(file) => publicApi.upload(token, file).then((r) => r.public_url)}
      onReturn={close}
      onOpenUrl={openExternal}
      onCompleted={(r) =>
        postToApp({
          type: 'survey_completed',
          survey_id: id,
          submission_id: r.submission_id,
          credited: r.credited,
          reward_amount: r.reward_amount,
        })
      }
      onTokenExpired={() => postToApp({ type: 'survey_token_expired', survey_id: id })}
    />
  )
}
