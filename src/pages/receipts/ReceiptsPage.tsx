import { Button, Flex, Icon, Label, Select, Table, Text, TextInput, type TableColumnConfig } from '@gravity-ui/uikit'
import { Magnifier } from '@gravity-ui/icons'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { receiptsApi } from '../../api/receipts'
import type { AdminReceipt, ReceiptStatus, ReceiptsSummary } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { RECEIPT_STATUSES, receiptStatusMeta, transactionStatusMeta } from '../../lib/constants'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'

const PAGE = 25

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function SummaryTiles({ summary }: { summary?: ReceiptsSummary }) {
  if (!summary) return null

  return (
    <div className="tiles">
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Всего чеков
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.totals)}
        </Text>
        <Text variant="caption-2" color="hint">
          под текущим фильтром
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          В обработке
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.pending)}
        </Text>
        <Text variant="caption-2" color="hint">
          ждут проверки
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Одобрено
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.approved)}
        </Text>
        <Text variant="caption-2" color="hint">
          {formatSum(tiynsToSum(summary.cashback_total))} кешбэка
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Отклонено
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.canceled)}
        </Text>
        <Text variant="caption-2" color="hint">
          {summary.rejected_by_operator > 0 ? `${formatNumber(summary.rejected_by_operator)} вручную` : 'автоматически'}
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Сумма чеков
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatSum(tiynsToSum(summary.total_amount))}
        </Text>
        <Text variant="caption-2" color="hint">
          по одобренным
        </Text>
      </div>
    </div>
  )
}

export function ReceiptsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as ReceiptStatus | null) ?? ''
  const company = params.get('company') ?? ''
  const debouncedCompany = useDebounced(company, 350)

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['receipts', 'list', { company: debouncedCompany, status }],
    queryFn: ({ pageParam, signal }) =>
      receiptsApi.list(
        {
          company: debouncedCompany || undefined,
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
  const summary = query.data?.pages[0]?.summary
  const filtered = Boolean(debouncedCompany || status)

  const columns: TableColumnConfig<AdminReceipt>[] = [
    {
      id: 'receipt',
      name: 'Чек',
      primary: true,
      template: (r) => (
        <div className="cell-title" style={{ maxWidth: 300 }}>
          <Text variant="subheader-1" ellipsis>
            {r.company_name || <Text color="hint">без магазина</Text>}
          </Text>
          <Text variant="body-1" color="secondary" className="num">
            #{r.id} · {formatPhone(r.user_phone)}
          </Text>
        </div>
      ),
    },
    {
      id: 'status',
      name: 'Статус',
      template: (r) => <Label theme={receiptStatusMeta(r.status).theme}>{receiptStatusMeta(r.status).label}</Label>,
    },
    {
      id: 'cashback',
      name: 'Кешбэк',
      align: 'end',
      template: (r) => <Text className="num">{formatSum(tiynsToSum(r.cashback))}</Text>,
    },
    {
      id: 'tx',
      name: 'Начисление',
      template: (r) => {
        if (!r.cashback_transaction) return <Text color="hint">—</Text>
        const meta = transactionStatusMeta(r.cashback_transaction.status)
        return (
          <Flex gap={1} alignItems="center">
            <Text variant="caption-1" color="secondary" className="num">
              #{r.cashback_transaction.id}
            </Text>
            <Label size="xs" theme={meta.theme}>
              {meta.label}
            </Label>
          </Flex>
        )
      },
    },
    {
      id: 'items',
      name: 'Позиции',
      align: 'end',
      template: (r) => (
        <Text className="num">
          {formatNumber(r.medical_item_count)}
          <Text color="hint"> / {formatNumber(r.item_count)}</Text>
        </Text>
      ),
    },
    {
      id: 'created',
      name: 'Сканирован',
      template: (r) => (
        <Text className="num" whiteSpace="nowrap">
          {formatDateTime(r.scanned_at)}
        </Text>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Чеки"
        description="Очередь модерации: что пришло, что одобрено, что отклонено. Нажмите на чек, чтобы открыть позиции и отклонить его."
      />

      <SummaryTiles summary={summary} />

      <div className="panel">
        <div className="toolbar">
          <TextInput
            className="toolbar__search"
            size="l"
            value={company}
            onUpdate={(v) => setParam('company', v)}
            placeholder="Магазин, можно часть названия"
            startContent={
              <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
            }
            hasClear
            controlProps={{ autoComplete: 'off' }}
          />
          <Select
            size="l"
            width={200}
            placeholder="Статус"
            value={status ? [status] : []}
            onUpdate={(v) => setParam('status', v[0])}
            hasClear
            options={RECEIPT_STATUSES.map((s) => ({ value: s.value, content: s.label }))}
          />
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Чеков не нашлось' : 'Чеков пока нет'}
            description={
              filtered
                ? 'Проверьте фильтры: магазин ищется по любой части названия.'
                : 'Как только пользователь отсканирует первый чек, он появится здесь.'
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                data={items}
                columns={columns}
                getRowId={(r) => String(r.id)}
                getRowDescriptor={() => ({ interactive: true })}
                onRowClick={(r) => navigate(`/receipts/${r.id}`)}
                edgePadding
              />
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
