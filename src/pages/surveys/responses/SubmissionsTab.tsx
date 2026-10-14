import { Button, Label, Table, Text, type TableColumnConfig } from '@gravity-ui/uikit'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { surveysApi } from '../../../api/surveys'
import type { SurveySubmission } from '../../../api/types'
import { EmptyState, ErrorState, LoadingState } from '../../../components/States'
import { formatDateTime, formatNumber, formatPhone, formatSum } from '../../../lib/format'
import type { SurveyField } from '../../../surveys/schema'
import { SubmissionDialog } from './SubmissionDialog'

const PAGE = 25

export function SubmissionsTab({ surveyId, fields }: { surveyId: number; fields: SurveyField[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const query = useInfiniteQuery({
    queryKey: ['surveys', 'responses', surveyId],
    queryFn: ({ pageParam, signal }) =>
      surveysApi.responses(surveyId, { limit: PAGE, before_id: pageParam || undefined }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more && last.items.length ? last.items[last.items.length - 1].id : undefined),
  })
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  const totals = query.data?.pages[0]?.totals

  const columns: TableColumnConfig<SurveySubmission>[] = [
    { id: 'id', name: 'ID', template: (s) => <Text className="num">{s.id}</Text> },
    {
      id: 'user',
      name: 'Пользователь',
      primary: true,
      template: (s) => (
        <div className="cell-title">
          <Text variant="subheader-1">
            {s.user_name || (s.user_phone ? formatPhone(s.user_phone) : `#${s.user_id}`)}
          </Text>
          {s.user_name && s.user_phone ? (
            <Text variant="body-1" color="secondary" className="num">
              {formatPhone(s.user_phone)}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      id: 'reward',
      name: 'Награда',
      template: (s) =>
        s.reward_amount > 0 ? (
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <Text className="num">{formatSum(s.reward_amount)}</Text>
            <Label theme={s.credited ? 'success' : 'warning'} size="xs">
              {s.credited ? 'начислено' : 'не начислено'}
            </Label>
          </span>
        ) : (
          <Text color="hint">—</Text>
        ),
    },
    {
      id: 'created',
      name: 'Дата',
      template: (s) => (
        <Text className="num" whiteSpace="nowrap">
          {formatDateTime(s.created_at)}
        </Text>
      ),
    },
  ]

  return (
    <div className="panel">
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Ответов пока нет"
          description="Как только пользователь пройдёт опрос в приложении, его ответ появится здесь."
        />
      ) : (
        <>
          <div className="table-wrap">
            <Table
              data={items}
              columns={columns}
              getRowId={(s) => String(s.id)}
              getRowDescriptor={() => ({ interactive: true })}
              onRowClick={(s) => setOpen(s.id)}
              edgePadding
            />
          </div>
          <div className="table-footer">
            <Text variant="body-1" color="secondary">
              Показано {formatNumber(items.length)}
              {totals !== undefined ? ` из ${formatNumber(totals)}` : ''}
            </Text>
            {query.hasNextPage ? (
              <Button size="m" onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage}>
                Показать ещё
              </Button>
            ) : null}
          </div>
        </>
      )}
      <SubmissionDialog surveyId={surveyId} submissionId={open} fields={fields} onClose={() => setOpen(null)} />
    </div>
  )
}
