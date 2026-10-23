import { Button, Icon, Label, Switch, Table, Text, useToaster, withTableActions } from '@gravity-ui/uikit'
import type { TableColumnConfig } from '@gravity-ui/uikit'
import { Pencil, Plus, TrashBin } from '@gravity-ui/icons'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { extraBenefitApi } from '../../api/extrabenefit'
import type { ExtraBenefitListResponse, ExtraBenefitOffer } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { errorText } from '../../lib/errors'
import { formatNumber, formatSum, plural } from '../../lib/format'
import { ExtraBenefitDialog } from './ExtraBenefitDialog'
import {
  EXTRA_BENEFIT_STATUS_LIVE,
  EXTRA_BENEFIT_STATUS_PAUSED,
  filledLocales,
  isExpired,
  offerSubtitle,
  offerTitle,
  statusLabel,
  windowLabel,
} from './extraBenefit.utils'

const ActionsTable = withTableActions<ExtraBenefitOffer>(Table)
const PAGE = 25

/**
 * The four numbers an operator reads first: how many offers the catalogue
 * holds, and how many of them are running right now.
 *
 * The totals come from the server over the whole set; the other three come
 * from the loaded page, so their caption says so. A tile that claimed the
 * whole catalogue while counting one page would be a number nobody could act
 * on. The three states partition the page exactly: an expired offer is
 * «Завершён» whether it is live or paused, because that is what the app does
 * with it.
 */
function SummaryTiles({ totals, items }: { totals?: number; items: ExtraBenefitOffer[] }) {
  const live = items.filter((o) => o.status === EXTRA_BENEFIT_STATUS_LIVE && !isExpired(o.ends_at)).length
  const paused = items.filter((o) => o.status === EXTRA_BENEFIT_STATUS_PAUSED && !isExpired(o.ends_at)).length
  const finished = items.filter((o) => isExpired(o.ends_at)).length

  return (
    <div className="tiles">
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Всего
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(totals ?? 0)}
        </Text>
        <Text variant="caption-2" color="hint">
          предложений в каталоге
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Действует
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(live)}
        </Text>
        <Text variant="caption-2" color="hint">
          на текущей странице
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          На паузе
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(paused)}
        </Text>
        <Text variant="caption-2" color="hint">
          на текущей странице
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Завершено
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(finished)}
        </Text>
        <Text variant="caption-2" color="hint">
          на текущей странице
        </Text>
      </div>
    </div>
  )
}

export function ExtraBenefitPage() {
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<{ open: boolean; offer: ExtraBenefitOffer | null }>({
    open: false,
    offer: null,
  })
  const [removing, setRemoving] = useState<ExtraBenefitOffer | null>(null)

  const query = useInfiniteQuery({
    queryKey: ['extra-benefit', 'list'],
    queryFn: ({ pageParam, signal }) => extraBenefitApi.list({ limit: PAGE, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const loaded = last.offset + last.items.length
      return loaded < last.totals ? loaded : undefined
    },
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  // The totals describe the whole catalogue; the page counts describe the page.
  const totals = query.data?.pages[0]?.totals

  const remove = useMutation({
    mutationFn: (id: number) => extraBenefitApi.remove(id),
    onSuccess: () => {
      toaster.add({ name: 'extra-benefit-removed', theme: 'success', title: 'Предложение удалено' })
      setRemoving(null)
      void queryClient.invalidateQueries({ queryKey: ['extra-benefit'] })
    },
    onError: (e) =>
      toaster.add({
        name: 'extra-benefit-remove-error',
        theme: 'danger',
        title: 'Не удалось удалить',
        content: errorText(e),
      }),
  })

  /**
   * The Switch moves before the request settles — a control that waits a round
   * trip reads as broken to an operator who was just told it is. The rollback
   * is not optional: a failed toggle that leaves the Switch on while the
   * server has it off is the panel lying about the state of the app.
   *
   * The write walks every cached page: each cached query is a
   * `useInfiniteQuery`, and a partial write fixes the toggle on a page the
   * operator has already scrolled past.
   */
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => extraBenefitApi.setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['extra-benefit'] })
      const snapshot = queryClient.getQueriesData<InfiniteData<ExtraBenefitListResponse>>({
        queryKey: ['extra-benefit'],
      })
      queryClient.setQueriesData<InfiniteData<ExtraBenefitListResponse>>({ queryKey: ['extra-benefit'] }, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (item.id === id ? { ...item, status } : item)),
              })),
            }
          : old,
      )
      return { snapshot }
    },
    onSuccess: (_data, { status }) => {
      toaster.add({
        name: 'extra-benefit-status',
        theme: 'success',
        title: status === EXTRA_BENEFIT_STATUS_LIVE ? 'Предложение включено' : 'Предложение на паузе',
      })
    },
    onError: (e, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toaster.add({
        name: 'extra-benefit-status-error',
        theme: 'danger',
        title: 'Не удалось переключить предложение',
        content: errorText(e),
      })
    },
    // Runs on error too: without it a failed toggle leaves the row showing the
    // rolled-back value until someone refreshes by hand.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['extra-benefit'] })
    },
  })

  const columns: TableColumnConfig<ExtraBenefitOffer>[] = [
    {
      id: 'offer',
      name: 'Предложение',
      primary: true,
      template: (o) => {
        const title = offerTitle(o.content)
        const subtitle = offerSubtitle(o.content)
        return (
          <div className="cell-title offer-cell">
            <Text variant="subheader-1" ellipsis title={title || undefined}>
              {title || 'Без заголовка'}
            </Text>
            {subtitle ? (
              <Text variant="caption-2" color="secondary" ellipsis>
                {subtitle}
              </Text>
            ) : null}
          </div>
        )
      },
    },
    {
      // The status sits next to the title on purpose: pausing an offer is
      // the control an operator reaches for most, and the table scrolls
      // sideways on a narrow screen — a control parked in the last column is
      // a control nobody finds.
      id: 'status',
      name: 'Статус',
      // Two facts, not one: the Switch is the operator's decision (status),
      // the badge is what the app does about it (status plus the deadline).
      template: (o) => (
        <div className="cell-title">
          <Switch
            size="s"
            checked={o.status === EXTRA_BENEFIT_STATUS_LIVE}
            onUpdate={(checked) =>
              setStatus.mutate({ id: o.id, status: checked ? EXTRA_BENEFIT_STATUS_LIVE : EXTRA_BENEFIT_STATUS_PAUSED })
            }
            controlProps={{ 'aria-label': `Показывать «${offerTitle(o.content)}» в приложении` }}
          />
          <Label theme={o.status === EXTRA_BENEFIT_STATUS_LIVE ? 'success' : 'unknown'}>
            {statusLabel(o.status, o.ends_at)}
          </Label>
        </div>
      ),
    },
    {
      id: 'locales',
      name: 'Языки',
      template: (o) => {
        const locales = filledLocales(o.content)
        return locales.length ? (
          <Text variant="caption-2" color="secondary" className="num">
            {locales.join(' · ')}
          </Text>
        ) : (
          <Text color="hint">—</Text>
        )
      },
    },
    {
      // The rule as one line — «5 упаковок → 15 000 сум» — the way the app
      // states it. Two columns for it pushed the status switch off the panel.
      id: 'rule',
      name: 'Правило',
      template: (o) => (
        <Text variant="body-2">
          {plural(o.goal_target, ['упаковка', 'упаковки', 'упаковок'])}{' '}
          <Text as="span" color="secondary">
            →
          </Text>{' '}
          <span className="num">{formatSum(o.bonus_amount)}</span>
        </Text>
      ),
    },
    {
      id: 'ikpu',
      name: 'ИКПУ',
      align: 'end',
      template: (o) => <Text className="num">{formatNumber(o.ikpu_codes.length)}</Text>,
    },
    {
      id: 'period',
      name: 'Период',
      template: (o) => <Text className="num">{windowLabel(o)}</Text>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Экстра-выгода"
        description="Покупает N упаковок — получает фиксированный бонус сверх обычного кешбэка 1%. Считается по чекам, отсканированным в приложении."
        actions={
          <Button view="action" size="l" onClick={() => setDialog({ open: true, offer: null })}>
            <Icon data={Plus} size={16} />
            Добавить предложение
          </Button>
        }
      />

      <SummaryTiles totals={totals} items={items} />

      <div className="panel">
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Предложений пока нет"
            description="Добавьте первое — оно появится в приложении и начнёт считать покупки по своим ИКПУ-кодам."
            action={
              <Button view="action" size="l" onClick={() => setDialog({ open: true, offer: null })}>
                Добавить предложение
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <ActionsTable
                data={items}
                columns={columns}
                getRowId={(o) => String(o.id)}
                rowActionsSize="m"
                getRowActions={(o) => [
                  {
                    text: 'Редактировать',
                    icon: <Icon data={Pencil} size={16} />,
                    handler: () => setDialog({ open: true, offer: o }),
                  },
                  {
                    text: 'Удалить',
                    theme: 'danger',
                    icon: <Icon data={TrashBin} size={16} />,
                    handler: () => setRemoving(o),
                  },
                ]}
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
      </div>

      <ExtraBenefitDialog
        open={dialog.open}
        offer={dialog.offer}
        onClose={() => setDialog({ open: false, offer: null })}
        onSaved={(created) => {
          setDialog({ open: false, offer: null })
          toaster.add({
            name: 'extra-benefit-saved',
            theme: 'success',
            title: created ? 'Предложение создано' : 'Предложение обновлено',
          })
          void queryClient.invalidateQueries({ queryKey: ['extra-benefit'] })
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Удалить предложение?"
        confirmText="Удалить"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Предложение исчезнет из приложения сразу. Вернуть его из панели будет нельзя — только создать заново.
        </Text>
        {removing ? (
          <>
            <ConfirmLine label="Предложение:" value={offerTitle(removing.content) || '—'} />
            <ConfirmLine
              label="Бонус:"
              value={`${formatSum(removing.bonus_amount)} за ${plural(removing.goal_target, ['упаковку', 'упаковки', 'упаковок'])}`}
            />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
