import {
  Button,
  Icon,
  Select,
  Table,
  Text,
  TextInput,
  withTableActions,
  type TableColumnConfig,
} from '@gravity-ui/uikit'
import { ChartColumn, Magnifier, Pencil, Plus, TrashBin } from '@gravity-ui/icons'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToaster } from '@gravity-ui/uikit'
import { surveysApi } from '../../api/surveys'
import type { SurveyListItem, SurveyStatus } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { SURVEY_STATUSES } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateRange, formatDateTime, formatNumber, formatSum, plural } from '../../lib/format'
import { useDebounced } from '../../lib/useDebounced'
import { pickLocale } from '../notifications/locale'
import { SurveyStatusLabel } from './SurveyStatusLabel'

const ActionsTable = withTableActions<SurveyListItem>(Table)
const PAGE = 25

export function SurveysPage() {
  const navigate = useNavigate()
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const status = (params.get('status') as SurveyStatus | null) ?? ''
  const debouncedSearch = useDebounced(search, 350)

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['surveys', 'list', { search: debouncedSearch, status }],
    queryFn: ({ pageParam, signal }) =>
      surveysApi.list(
        {
          search: debouncedSearch || undefined,
          status: status || undefined,
          limit: PAGE,
          before_id: pageParam || undefined,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more && last.items.length ? last.items[last.items.length - 1].id : undefined),
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  const totals = query.data?.pages[0]?.totals
  const filtered = Boolean(debouncedSearch || status)

  const [deleting, setDeleting] = useState<SurveyListItem | null>(null)
  const remove = useMutation({
    mutationFn: (id: number) => surveysApi.remove(id),
    onSuccess: () => {
      toaster.add({ name: 'survey-deleted', theme: 'success', title: 'Опрос удалён' })
      setDeleting(null)
      void queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
    onError: (e) =>
      toaster.add({ name: 'survey-delete-error', theme: 'danger', title: 'Не удалось удалить', content: errorText(e) }),
  })

  const columns: TableColumnConfig<SurveyListItem>[] = [
    {
      id: 'title',
      name: 'Название',
      primary: true,
      template: (s) => (
        <div className="cell-title" style={{ maxWidth: 360 }}>
          <Text variant="subheader-1" ellipsis>
            {pickLocale(s.title) || <Text color="hint">без названия</Text>}
          </Text>
          <Text variant="body-1" color="secondary">
            {plural(s.questions_count, ['вопрос', 'вопроса', 'вопросов'])}
          </Text>
        </div>
      ),
    },
    { id: 'status', name: 'Статус', template: (s) => <SurveyStatusLabel status={s.status} isLive={s.is_live} /> },
    {
      id: 'reward',
      name: 'Награда',
      align: 'end',
      template: (s) => <Text className="num">{s.reward_amount > 0 ? formatSum(s.reward_amount) : '—'}</Text>,
    },
    {
      id: 'responses',
      name: 'Ответов',
      align: 'end',
      template: (s) => <Text className="num">{formatNumber(s.submissions_count)}</Text>,
    },
    {
      id: 'period',
      name: 'Период',
      template: (s) => (
        <Text color="secondary" whiteSpace="nowrap" className="num">
          {formatDateRange(s.starts_at, s.ends_at)}
        </Text>
      ),
    },
    {
      id: 'updated',
      name: 'Изменён',
      template: (s) => (
        <Text className="num" whiteSpace="nowrap">
          {formatDateTime(s.updated_at)}
        </Text>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Опросы"
        description="Анкеты, которые пользователи проходят в приложении и получают награду на баланс. Черновик → запуск (сразу или по расписанию) → завершение."
        actions={
          <Button view="action" size="l" onClick={() => navigate('/surveys/new')}>
            <Icon data={Plus} size={16} />
            Создать опрос
          </Button>
        }
      />

      <div className="panel">
        <div className="toolbar">
          <TextInput
            className="toolbar__search"
            size="l"
            value={search}
            onUpdate={(v) => setParam('q', v)}
            placeholder="Поиск по названию"
            startContent={
              <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
            }
            hasClear
          />
          <Select
            size="l"
            width={180}
            placeholder="Статус"
            value={status ? [status] : []}
            onUpdate={(v) => setParam('status', v[0])}
            hasClear
            options={SURVEY_STATUSES.map((s) => ({ value: s.value, content: s.label }))}
          />
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Ничего не найдено' : 'Опросов ещё нет'}
            description={
              filtered
                ? 'Попробуйте изменить фильтры.'
                : 'Создайте первый опрос: добавьте вопросы, укажите награду и запустите — пользователи увидят его в приложении.'
            }
            action={
              filtered ? undefined : (
                <Button view="action" size="l" onClick={() => navigate('/surveys/new')}>
                  Создать опрос
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <ActionsTable
                data={items}
                columns={columns}
                getRowId={(s) => String(s.id)}
                getRowDescriptor={() => ({ interactive: true })}
                onRowClick={(s) => navigate(`/surveys/${s.id}`)}
                rowActionsSize="m"
                getRowActions={(s) => [
                  { text: 'Открыть', handler: () => navigate(`/surveys/${s.id}`) },
                  ...(s.status !== 'closed'
                    ? [
                        {
                          text: 'Редактировать',
                          icon: <Icon data={Pencil} size={16} />,
                          handler: () => navigate(`/surveys/${s.id}/edit`),
                        },
                      ]
                    : []),
                  {
                    text: 'Ответы',
                    icon: <Icon data={ChartColumn} size={16} />,
                    handler: () => navigate(`/surveys/${s.id}/responses`),
                  },
                  ...(s.status !== 'active'
                    ? [
                        {
                          text: 'Удалить',
                          theme: 'danger' as const,
                          icon: <Icon data={TrashBin} size={16} />,
                          handler: () => setDeleting(s),
                        },
                      ]
                    : []),
                ]}
                edgePadding
                verticalAlign="top"
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
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить опрос?"
        confirmText="Удалить"
        danger
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Опрос пропадёт из панели и приложения. Полученные ответы и начисления остаются в базе.
        </Text>
        {deleting ? <ConfirmLine label="Опрос:" value={pickLocale(deleting.title) || `#${deleting.id}`} /> : null}
      </ConfirmDialog>
    </>
  )
}
