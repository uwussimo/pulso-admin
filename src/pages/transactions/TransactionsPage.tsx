import { Button, Label, Select, Table, Text, type TableColumnConfig } from '@gravity-ui/uikit'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { transactionsApi } from '../../api/transactions'
import type { AdminTransaction, TransactionStatus, TransactionType, TransactionsSummary } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  transactionStatusMeta,
  transactionTypeLabel,
} from '../../lib/constants'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'

const PAGE = 25

function SummaryTiles({ summary }: { summary?: TransactionsSummary }) {
  if (!summary) return null

  const net = summary.posted_credits - summary.posted_debits

  return (
    <div className="tiles">
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Начислено
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatSum(tiynsToSum(summary.posted_credits))}
        </Text>
        <Text variant="caption-2" color="hint">
          {formatNumber(summary.posted)} проведённых
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Списано
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatSum(tiynsToSum(summary.posted_debits))}
        </Text>
        <Text variant="caption-2" color="hint">
          выводы на карты
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Итог по фильтру
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatSum(tiynsToSum(net))}
        </Text>
        <Text variant="caption-2" color="hint">
          начислено минус списано
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          В обработке
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatSum(tiynsToSum(summary.pending_total))}
        </Text>
        <Text variant="caption-2" color="hint">
          {formatNumber(summary.pending)} записей
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Сторно
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.reversed)}
        </Text>
        <Text variant="caption-2" color="hint">
          возвращено при отказе
        </Text>
      </div>
    </div>
  )
}

export function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as TransactionStatus | null) ?? ''
  const type = (params.get('type') as TransactionType | null) ?? ''
  // The receipt page deep-links here with ?user_id= to show one person's
  // movements. The backend has always accepted it and the type declares
  // it; the page used to drop it, so the link silently showed the whole
  // ledger instead of the user it was about.
  const userId = Number(params.get('user_id')) || undefined

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['transactions', 'list', { status, type, userId }],
    queryFn: ({ pageParam, signal }) =>
      transactionsApi.list(
        {
          status: status || undefined,
          type: type || undefined,
          user_id: userId,
          limit: PAGE,
          before_id: pageParam || undefined,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more && last.items.length ? last.items[last.items.length - 1].id : undefined),
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  const summary = query.data?.pages[0]?.summary
  const filtered = Boolean(status || type || userId)

  const columns: TableColumnConfig<AdminTransaction>[] = [
    {
      id: 'tx',
      name: 'Операция',
      primary: true,
      template: (t) => (
        <div className="cell-title" style={{ maxWidth: 320 }}>
          <Text variant="subheader-1" ellipsis>
            {transactionTypeLabel(t.type)}
          </Text>
          <Text variant="body-1" color="secondary" className="num">
            #{t.id} · {formatPhone(t.user_phone)}
          </Text>
        </div>
      ),
    },
    {
      id: 'status',
      name: 'Статус',
      template: (t) => {
        const meta = transactionStatusMeta(t.status)
        return <Label theme={meta.theme}>{meta.label}</Label>
      },
    },
    {
      id: 'amount',
      name: 'Сумма',
      align: 'end',
      template: (t) => (
        <Text className="num" color={t.status === 'posted' || t.status === 'pending' ? undefined : 'hint'}>
          {formatSum(tiynsToSum(t.amount))}
        </Text>
      ),
    },
    {
      id: 'user',
      name: 'Пользователь',
      template: (t) => (
        <Text className="num">
          <Link to={`/users/${t.user_id}`}>{t.user_name || formatPhone(t.user_phone)}</Link>
        </Text>
      ),
    },
    {
      id: 'reference',
      name: 'Связь',
      template: (t) => {
        // A receipt_scan reference points back at the receipt that earned
        // the cashback, which is the one way to get from a money movement
        // to the decision that caused it.
        const m = /^receipt:(\d+)$/.exec(t.reference ?? '')
        if (!m) return <Text color="hint">—</Text>
        return (
          <Text className="num">
            <Link to={`/receipts/${m[1]}`}>чек #{m[1]}</Link>
          </Text>
        )
      },
    },
    {
      id: 'created',
      name: 'Создана',
      template: (t) => (
        <Text className="num" whiteSpace="nowrap">
          {formatDateTime(t.created_at)}
        </Text>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Транзакции"
        description="Каждое движение баланса: начисления за чеки, бонусы и выводы на карты. Здесь же видны сторно — возвраты кешбэка после отклонения чека."
      />

      <SummaryTiles summary={summary} />

      <div className="panel">
        <div className="toolbar">
          {userId ? (
            <Label theme="info" size="m">
              Только пользователь #{userId}{' '}
              <Link to={`/users/${userId}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                профиль
              </Link>
            </Label>
          ) : null}
          <Select
            size="l"
            width={200}
            placeholder="Статус"
            value={status ? [status] : []}
            onUpdate={(v) => setParam('status', v[0])}
            hasClear
            options={TRANSACTION_STATUSES.map((s) => ({ value: s.value, content: s.label }))}
          />
          <Select
            size="l"
            width={240}
            placeholder="Тип операции"
            value={type ? [type] : []}
            onUpdate={(v) => setParam('type', v[0])}
            hasClear
            options={TRANSACTION_TYPES.map((s) => ({ value: s.value, content: s.label }))}
          />
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Ничего не нашлось' : 'Транзакций пока нет'}
            description={
              filtered
                ? 'Под выбранные фильтры транзакций не попадает.'
                : 'Как только появится первое начисление, оно будет здесь.'
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <Table data={items} columns={columns} getRowId={(t) => String(t.id)} edgePadding />
            </div>
            <div className="table-footer">
              <Text variant="body-1" color="secondary">
                Показано {formatNumber(items.length)}
                {summary ? ` из ${formatNumber(summary.totals)}` : ''}
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
    </>
  )
}
