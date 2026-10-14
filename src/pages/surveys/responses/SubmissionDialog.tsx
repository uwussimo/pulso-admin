import { Dialog, Text } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Link } from 'react-router-dom'
import { surveysApi } from '../../../api/surveys'
import type { SurveyField } from '../../../surveys/schema'
import { ErrorState, LoadingState } from '../../../components/States'
import { formatDateTime, formatPhone, formatSum } from '../../../lib/format'
import { formatAnswer, pickText } from '../../../surveys/schema'

interface Props {
  surveyId: number
  submissionId: number | null
  fields: SurveyField[]
  onClose: () => void
}

export function SubmissionDialog({ surveyId, submissionId, fields, onClose }: Props) {
  const titleId = useId()
  const query = useQuery({
    queryKey: ['surveys', 'response', surveyId, submissionId],
    queryFn: ({ signal }) => surveysApi.response(surveyId, submissionId ?? 0, signal),
    enabled: submissionId !== null,
  })
  const d = query.data
  return (
    <Dialog open={submissionId !== null} onClose={onClose} aria-labelledby={titleId} maxWidth="m" fullWidth>
      <Dialog.Header caption={`Ответ #${submissionId ?? ''}`} id={titleId} />
      <Dialog.Body>
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : d ? (
          <div className="form">
            <div className="kv">
              <Text className="kv__key">Пользователь</Text>
              <Link to={`/users/${d.user_id}`}>
                {d.user_name || (d.user_phone ? formatPhone(d.user_phone) : `#${d.user_id}`)}
              </Link>
              <Text className="kv__key">Отправлен</Text>
              <Text className="num">{formatDateTime(d.created_at)}</Text>
              <Text className="kv__key">Награда</Text>
              <Text className="num">
                {d.reward_amount > 0 ? formatSum(d.reward_amount) : '—'}
                {d.reward_amount > 0 ? (
                  <Text color={d.credited ? 'positive' : 'warning'}>
                    {' '}
                    · {d.credited ? 'начислено' : 'не начислено'}
                  </Text>
                ) : null}
              </Text>
            </div>
            <div className="panel panel_filled">
              <div className="panel__body form" style={{ gap: 'var(--g-spacing-3)' }}>
                {fields
                  .filter((f) => f.type !== 'slide')
                  .map((f) => {
                    const a = formatAnswer(f, d.answers[f.id])
                    return (
                      <div key={f.id} className="cell-title">
                        <Text variant="caption-2" color="hint">
                          {pickText(f.label, 'ru') || f.key}
                        </Text>
                        {a.kind === 'images' ? (
                          <div className="runner__thumbs">
                            {a.urls.map((u) => (
                              <a
                                key={u}
                                href={u}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="thumb"
                                style={{ width: 72, height: 72 }}
                              >
                                <img src={u} alt="" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <Text variant="body-2" style={{ whiteSpace: 'pre-wrap' }}>
                            {a.text}
                          </Text>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        ) : null}
      </Dialog.Body>
    </Dialog>
  )
}
