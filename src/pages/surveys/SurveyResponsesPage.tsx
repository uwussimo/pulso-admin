import { Alert, Tab, TabList, TabProvider } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { surveysApi } from '../../api/surveys'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { formatNumber } from '../../lib/format'
import { pickLocale } from '../notifications/locale'
import { StatsTab } from './responses/StatsTab'
import { SubmissionsTab } from './responses/SubmissionsTab'

export function SurveyResponsesPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'list' ? 'list' : 'stats'

  const query = useQuery({
    queryKey: ['surveys', 'detail', id],
    queryFn: ({ signal }) => surveysApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="Ответы" eyebrow="Опросы" />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Ответы" eyebrow="Опросы" />
        <LoadingState />
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Ответы" eyebrow="Опросы" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }
  const s = query.data
  return (
    <>
      <PageHeader
        title="Ответы и статистика"
        eyebrow={`Опросы · ${pickLocale(s.title) || `#${s.id}`}`}
        description={`${formatNumber(s.submissions_count)} ответов`}
      />
      <TabProvider
        value={tab}
        onUpdate={(v) => {
          const next = new URLSearchParams(params)
          if (v === 'list') next.set('tab', 'list')
          else next.delete('tab')
          setParams(next, { replace: true })
        }}
      >
        <TabList size="l" style={{ marginBottom: 'var(--g-spacing-4)' }}>
          <Tab value="stats">Статистика</Tab>
          <Tab value="list" counter={s.submissions_count}>
            Ответы
          </Tab>
        </TabList>
      </TabProvider>
      {tab === 'stats' ? <StatsTab survey={s} /> : <SubmissionsTab surveyId={s.id} fields={s.schema.fields} />}
    </>
  )
}
