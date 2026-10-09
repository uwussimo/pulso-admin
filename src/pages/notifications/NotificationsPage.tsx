import { Button, Checkbox, Icon, Select, Table, Text, TextInput, withTableActions, type TableColumnConfig } from '@gravity-ui/uikit'
import { Magnifier, Pencil, Plus, TrashBin } from '@gravity-ui/icons'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToaster } from '@gravity-ui/uikit'
import { notificationsApi } from '../../api/notifications'
import type { AdminNotification, Audience, NotificationType } from '../../api/types'
import { AudienceLabel } from '../../components/AudienceLabel'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { AUDIENCES, NOTIFICATION_TYPES, appRouteLabel, notificationTypeLabel } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber } from '../../lib/format'
import { pickLocale } from './locale'
import { EditNotificationDialog } from './EditNotificationDialog'

const ActionsTable = withTableActions<AdminNotification>(Table)
const PAGE = 25

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const audience = (params.get('audience') as Audience | null) ?? ''
  const typeParam = params.get('type')
  const type = typeParam ? (Number(typeParam) as NotificationType) : undefined
  const unreadOnly = params.get('unread') === '1'
  const debouncedSearch = useDebounced(search, 350)

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['notifications', 'list', { search: debouncedSearch, audience, type, unreadOnly }],
    queryFn: ({ pageParam, signal }) =>
      notificationsApi.list(
        {
          search: debouncedSearch || undefined,
          audience: audience || undefined,
          type,
          unread_only: unreadOnly || undefined,
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

  const [editing, setEditing] = useState<AdminNotification | null>(null)
  const [retracting, setRetracting] = useState<AdminNotification | null>(null)

  const retract = useMutation({
    mutationFn: (id: number) => notificationsApi.retract(id),
    onSuccess: () => {
      toaster.add({ name: 'retracted', theme: 'success', title: 'Уведомление отозвано' })
      setRetracting(null)
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => toaster.add({ name: 'retract-error', theme: 'danger', title: 'Не удалось отозвать', content: errorText(e) }),
  })

  const columns: TableColumnConfig<AdminNotification>[] = [
    {
      id: 'title',
      name: 'Текст',
      primary: true,
      template: (n) => {
        const title = pickLocale(n.title)
        const desc = pickLocale(n.description)
        return (
          <div className="cell-title" style={{ maxWidth: 380 }}>
            <Text variant="subheader-1" ellipsis>
              {title || <Text color="hint">без заголовка</Text>}
            </Text>
            {desc ? (
              <Text variant="body-1" color="secondary" ellipsis>
                {desc}
              </Text>
            ) : null}
          </div>
        )
      },
    },
    {
      id: 'audience',
      name: 'Аудитория',
      template: (n) => <AudienceLabel audience={n.audience} targetPlatform={n.target_platform} targetedCount={n.targeted_count} />,
    },
    {
      id: 'read',
      name: 'Прочитали',
      align: 'end',
      template: (n) =>
        n.audience === 'targeted' ? (
          <Text className="num">
            {formatNumber(n.read_count)}
            <Text color="hint"> / {formatNumber(n.targeted_count)}</Text>
          </Text>
        ) : (
          <Text className="num">{formatNumber(n.read_count)}</Text>
        ),
    },
    { id: 'type', name: 'Тип', template: (n) => <Text color="secondary">{notificationTypeLabel(n.type)}</Text> },
    { id: 'url', name: 'Экран', template: (n) => <Text color="secondary">{appRouteLabel(n.url)}</Text> },
    { id: 'created', name: 'Отправлено', template: (n) => <Text className="num" whiteSpace="nowrap">{formatDateTime(n.created_at)}</Text> },
  ]

  return (
    <>
      <PageHeader
        title="Уведомления"
        description="Рассылки и системные сообщения пользователям. Отправленное нельзя отправить повторно — только исправить или отозвать."
        actions={
          <Button view="action" size="l" onClick={() => navigate('/notifications/new')}>
            <Icon data={Plus} size={16} />
            Создать рассылку
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
            placeholder="Поиск по заголовку и тексту"
            startContent={<Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />}
            hasClear
          />
          <Select
            size="l"
            width={170}
            placeholder="Аудитория"
            value={audience ? [audience] : []}
            onUpdate={(v) => setParam('audience', v[0])}
            hasClear
            options={AUDIENCES.map((a) => ({ value: a.value, content: a.label }))}
          />
          <Select
            size="l"
            width={140}
            placeholder="Тип"
            value={type ? [String(type)] : []}
            onUpdate={(v) => setParam('type', v[0])}
            hasClear
            options={NOTIFICATION_TYPES.map((t) => ({ value: String(t.value), content: t.label }))}
          />
          <Checkbox size="l" checked={unreadOnly} onUpdate={(c) => setParam('unread', c ? '1' : undefined)}>
            Есть непрочитавшие
          </Checkbox>
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={debouncedSearch || audience || type || unreadOnly ? 'Ничего не найдено' : 'Рассылок ещё не было'}
            description={
              debouncedSearch || audience || type || unreadOnly
                ? 'Попробуйте изменить фильтры.'
                : 'Создайте первую рассылку: выберите аудиторию, напишите текст на трёх языках и проверьте превью.'
            }
            action={
              debouncedSearch || audience || type || unreadOnly ? undefined : (
                <Button view="action" size="l" onClick={() => navigate('/notifications/new')}>
                  Создать рассылку
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
                getRowId={(n) => String(n.id)}
                getRowDescriptor={() => ({ interactive: true })}
                onRowClick={(n) => navigate(`/notifications/${n.id}`)}
                rowActionsSize="m"
                getRowActions={(n) => [
                  { text: 'Открыть', handler: () => navigate(`/notifications/${n.id}`) },
                  { text: 'Исправить текст', icon: <Icon data={Pencil} size={16} />, handler: () => setEditing(n) },
                  { text: 'Отозвать', theme: 'danger', icon: <Icon data={TrashBin} size={16} />, handler: () => setRetracting(n) },
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

      <EditNotificationDialog
        open={editing !== null}
        notification={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          void queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }}
      />

      <ConfirmDialog
        open={retracting !== null}
        title="Отозвать уведомление?"
        confirmText="Отозвать"
        danger
        loading={retract.isPending}
        onClose={() => setRetracting(null)}
        onConfirm={() => retracting && retract.mutate(retracting.id)}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Уведомление пропадёт из ленты у всех получателей. Уже отправленные пуши отозвать нельзя. Вернуть обратно не
          получится.
        </Text>
        {retracting ? <ConfirmLine label="Текст:" value={pickLocale(retracting.title) || '—'} /> : null}
      </ConfirmDialog>
    </>
  )
}
