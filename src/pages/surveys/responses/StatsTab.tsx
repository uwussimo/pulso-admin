import { Text } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { surveysApi } from '../../../api/surveys'
import type { Survey } from '../../../api/types'
import { EmptyState, ErrorState, LoadingState } from '../../../components/States'
import { formatDateRange, formatNumber, formatSum } from '../../../lib/format'
import { QuestionStatsCard } from './QuestionStatsCard'

export function StatsTab({ survey }: { survey: Survey }) {
  const query = useQuery({
    queryKey: ['surveys', 'stats', survey.id],
    queryFn: ({ signal }) => surveysApi.stats(survey.id, signal),
  })
  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  const stats = query.data
  if (stats.submissions === 0) {
    return (
      <div className="panel">
        <EmptyState title="Статистики пока нет" description="Она появится после первого ответа." />
      </div>
    )
  }
  const byField = new Map(stats.questions.map((q) => [q.field_id, q]))
  const ratings = stats.questions.filter((q) => q.type === 'rating' && q.avg !== undefined)
  const avgRating = ratings.length ? ratings.reduce((a, q) => a + (q.avg ?? 0), 0) / ratings.length : null

  return (
    <div className="form">
      <div className="tiles">
        <div className="tile">
          <Text variant="body-1" color="secondary">
            Ответов
          </Text>
          <Text variant="header-1" className="tile__value">
            {formatNumber(stats.submissions)}
          </Text>
        </div>
        <div className="tile">
          <Text variant="body-1" color="secondary">
            Выплачено
          </Text>
          <Text variant="header-1" className="tile__value">
            {formatSum(stats.reward_total)}
          </Text>
        </div>
        {avgRating !== null ? (
          <div className="tile">
            <Text variant="body-1" color="secondary">
              Средняя оценка
            </Text>
            <Text variant="header-1" className="tile__value">
              {avgRating.toFixed(1)}
            </Text>
          </div>
        ) : null}
        <div className="tile">
          <Text variant="body-1" color="secondary">
            Период
          </Text>
          <Text variant="subheader-2" className="tile__value">
            {formatDateRange(survey.starts_at, survey.ends_at)}
          </Text>
        </div>
      </div>
      {survey.schema.fields.map((f, i) => (
        <QuestionStatsCard key={f.id} index={i} field={f} stats={byField.get(f.id)} submissions={stats.submissions} />
      ))}
    </div>
  )
}
