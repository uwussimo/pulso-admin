import {
  Alert,
  Button,
  Flex,
  Icon,
  Label,
  Select,
  Table,
  Text,
  TextInput,
  useToaster,
  type TableColumnConfig,
} from '@gravity-ui/uikit'
import { Ban } from '@gravity-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { receiptsApi } from '../../api/receipts'
import type { AdminReceiptItem } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { REJECTION_REASONS, receiptStatusMeta, reversalMeta, transactionStatusMeta } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'

/** The backend column is varchar(256). */
const REASON_MAX_LENGTH = 256

export function ReceiptDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reason, setReason] = useState(REJECTION_REASONS[0].value)

  const query = useQuery({
    queryKey: ['receipts', 'detail', id],
    queryFn: ({ signal }) => receiptsApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  const reject = useMutation({
    mutationFn: () => receiptsApi.reject(id, reason),
    onSuccess: (res) => {
      setConfirmOpen(false)
      const meta = reversalMeta(res.cashback_reversal)
      toaster.add({
        name: 'receipt-rejected',
        theme: res.cashback_reversal === 'clawed_back' ? 'warning' : 'success',
        title: 'Чек отклонён',
        content: `${meta.label}. ${meta.description}`,
      })
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (e) =>
      toaster.add({
        name: 'receipt-reject-error',
        theme: 'danger',
        title: 'Не удалось отклонить чек',
        content: errorText(e),
      }),
  })

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="Чек" eyebrow="Чеки" />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Чек" eyebrow="Чеки" />
        <LoadingState />
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Чек" eyebrow="Чеки" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }

  const r = query.data.receipt
  const items = query.data.items
  const status = receiptStatusMeta(r.status)
  const tx = r.cashback_transaction
  const txMeta = tx ? transactionStatusMeta(tx.status) : null
  const rejectable = r.status !== 'canceled'
  // A posted cashback means rejecting will take money back out of the
  // balance — and may leave it negative. The dialog says so out loud
  // rather than leaving the operator to find out afterwards.
  const willClawBack = tx?.status === 'posted'

  const columns: TableColumnConfig<AdminReceiptItem>[] = [
    {
      id: 'name',
      name: 'Товар',
      primary: true,
      template: (it) => (
        <div className="cell-title" style={{ maxWidth: 380 }}>
          <Text variant="body-1" ellipsis>
            {it.name || '—'}
          </Text>
          {it.ikpu_code ? (
            <Text variant="caption-2" color="hint" className="num">
              ИКПУ {it.ikpu_code}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      id: 'count',
      name: 'Кол-во',
      align: 'end',
      template: (it) => <Text className="num">{formatNumber(it.count_hundredths / 100)}</Text>,
    },
    {
      id: 'price',
      name: 'Цена',
      align: 'end',
      template: (it) => <Text className="num">{formatSum(tiynsToSum(it.price))}</Text>,
    },
    {
      id: 'catalogue',
      name: 'Перечень',
      template: (it) =>
        it.nomenclature_id > 0 ? (
          <Flex gap={1} alignItems="center">
            <Label size="xs" theme="success">
              в перечне
            </Label>
            <Text variant="caption-2" color="hint" className="num">
              #{it.nomenclature_id}
            </Text>
          </Flex>
        ) : (
          <Text color="hint">не в перечне</Text>
        ),
    },
    {
      id: 'cashback',
      name: 'Кешбэк',
      align: 'end',
      template: (it) => <Text className="num">{formatSum(tiynsToSum(it.cashback))}</Text>,
    },
  ]

  return (
    <>
      <PageHeader
        title={r.company_name || `Чек #${r.id}`}
        eyebrow="Чеки"
        description={
          <>
            {formatPhone(r.user_phone)} · сканирован {formatDateTime(r.scanned_at)}
          </>
        }
        actions={
          rejectable ? (
            <Button size="l" view="outlined-danger" onClick={() => setConfirmOpen(true)} loading={reject.isPending}>
              <Icon data={Ban} size={16} />
              Отклонить
            </Button>
          ) : (
            <Label theme={status.theme}>{status.label}</Label>
          )
        }
      />

      {r.status === 'canceled' && r.rejected_by_operator ? (
        <Alert theme="warning" title="Чек отклонён оператором" message={r.cancel_reason || 'Причина не указана.'} />
      ) : null}
      {r.status === 'canceled' && !r.rejected_by_operator ? (
        <Alert theme="info" title="Чек отклонён автоматически" message={r.cancel_reason || 'Системная проверка.'} />
      ) : null}

      <Flex gap={4} wrap alignItems="flex-start">
        <div className="form" style={{ flex: '1 1 380px', minWidth: 0 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Чек
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Статус</Text>
              <Label theme={status.theme}>{status.label}</Label>
              <Text className="kv__key">Пользователь</Text>
              <Text className="num">
                <Link to={`/users/${r.user_id}`}>{r.user_name || formatPhone(r.user_phone)}</Link>
              </Text>
              <Text className="kv__key">Магазин</Text>
              <Text>{r.company_name || '—'}</Text>
              <Text className="kv__key">ИНН</Text>
              <Text className="num">{r.company_tin || '—'}</Text>
              <Text className="kv__key">Сумма чека</Text>
              <Text className="num">{formatSum(tiynsToSum(r.total))}</Text>
              <Text className="kv__key">Кешбэк</Text>
              <Text variant="subheader-3" className="num">
                {formatSum(tiynsToSum(r.cashback))}
              </Text>
              <Text className="kv__key">Позиции</Text>
              <Text className="num">
                {formatNumber(r.medical_item_count)}
                <Text color="hint"> в перечне из {formatNumber(r.item_count)}</Text>
              </Text>
              <Text className="kv__key">Фискализация</Text>
              <Text className="num">{r.fiscalized_at ? formatDateTime(r.fiscalized_at) : '—'}</Text>
              {r.url ? (
                <>
                  <Text className="kv__key">Ссылка</Text>
                  <Text className="num" style={{ wordBreak: 'break-all' }}>
                    {r.url}
                  </Text>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="form" style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Начисление
            </Text>
            <div className="panel__body kv">
              {tx && txMeta ? (
                <>
                  <Text className="kv__key">Транзакция</Text>
                  <Text className="num">
                    <Link to={`/transactions?user_id=${r.user_id}`}>#{tx.id}</Link>
                  </Text>
                  <Text className="kv__key">Сумма</Text>
                  <Text className="num">{formatSum(tiynsToSum(tx.amount))}</Text>
                  <Text className="kv__key">Статус</Text>
                  <Label theme={txMeta.theme}>{txMeta.label}</Label>
                </>
              ) : (
                <Text color="hint">У чека нет начисления: кешбэк был нулевой или чек ещё не одобрен.</Text>
              )}
            </div>
          </div>
        </div>
      </Flex>

      <div className="panel" style={{ marginTop: 'var(--g-spacing-4)' }}>
        <Text variant="subheader-2" className="panel__title" as="div">
          Позиции чека
        </Text>
        {items.length === 0 ? (
          <div className="panel__body">
            <Text color="hint">Позиции ещё не разобраны — чек не проходил проверку.</Text>
          </div>
        ) : (
          <div className="table-wrap">
            <Table data={items} columns={columns} getRowId={(it) => String(it.id)} edgePadding />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Отклонить чек?"
        confirmText="Отклонить"
        danger
        confirmDisabled={reason.trim().length === 0}
        loading={reject.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => reject.mutate()}
      >
        <Flex direction="column" gap={3}>
          <Text as="p">
            Чек будет помечен как отклонённый оператором и больше не попадёт в одобренные. Это действие нельзя отменить.
          </Text>

          <Select
            size="l"
            value={[reason]}
            onUpdate={(v) => setReason(v[0] ?? REJECTION_REASONS[0].value)}
            options={REJECTION_REASONS.map((x) => ({ value: x.value, content: x.label }))}
          />
          {/* The backend caps cancel_reason at varchar(256). Sending a
              blank or over-long value either gets silently replaced by a
              generic reason or comes back as a 500, so the field is
              bounded here where the operator can see it. */}
          <TextInput
            size="l"
            value={reason}
            onUpdate={setReason}
            placeholder="Причина отклонения"
            errorMessage={reason.length === 0 ? 'Укажите причину' : undefined}
            validationState={reason.length === 0 ? 'invalid' : undefined}
            controlProps={{ autoComplete: 'off', maxLength: REASON_MAX_LENGTH }}
          />
          <Text variant="caption-2" color="hint">
            {reason.length} / {REASON_MAX_LENGTH}
          </Text>

          {willClawBack ? (
            <Alert
              theme="warning"
              title="Кешбэк уже в балансе"
              message={`${formatSum(tiynsToSum(tx?.amount))} будут вычтены из баланса ${formatPhone(r.user_phone)}. Если пользователь уже вывел эти деньги, баланс уйдёт в минус.`}
            />
          ) : tx?.status === 'pending' ? (
            <Alert
              theme="info"
              title="Кешбэк ещё не начислен"
              message="Начисление в статусе «в обработке», баланс пользователя не изменится — движение просто отменится."
            />
          ) : (
            <Alert theme="info" message="Начисления не было, баланс пользователя не изменится." />
          )}

          <ConfirmLine label="Чек:" value={`#${r.id} · ${r.company_name || 'без магазина'}`} />
        </Flex>
      </ConfirmDialog>
    </>
  )
}
