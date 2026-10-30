import {
  Button,
  Icon,
  Label,
  Switch,
  Table,
  Text,
  TextInput,
  useToaster,
  withTableActions,
  type TableColumnConfig,
} from '@gravity-ui/uikit'
import { Magnifier, Pencil, Plus, TrashBin } from '@gravity-ui/icons'
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { promoApi } from '../../api/promo'
import type { CatalogDrug, PromoListResponse, PromoProduct, PromoSummary } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { errorText } from '../../lib/errors'
import { formatNumber } from '../../lib/format'
import { useDebounced } from '../../lib/useDebounced'
import { CatalogPickerDialog } from './CatalogPickerDialog'
import { NomenclatureCell } from './NomenclatureCell'
import { PromoProductDialog } from './PromoProductDialog'
import {
  EFFECT_CAVEAT,
  PROMO_STATUS_LIVE,
  PROMO_STATUS_PAUSED,
  compactCount,
  endsAtLabel,
  statusLabel,
  sums,
} from './promo.utils'

const ActionsTable = withTableActions<PromoProduct>(Table)
const PAGE = 25

function SummaryTiles({ summary }: { summary?: PromoSummary }) {
  if (!summary) return null

  return (
    <div className="tiles">
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Действует
        </Text>
        <Text variant="header-2" className="tile__value">
          {formatNumber(summary.live_count)}
        </Text>
        <Text variant="caption-2" color="hint">
          сейчас в приложении
        </Text>
      </div>
      <div className="tile tile_outlined">
        <Text variant="body-1" color="secondary">
          Всего
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
          Выплачено бонусов
        </Text>
        <Text variant="header-2" className="tile__value">
          {sums(summary.bonus_paid)}
        </Text>
        <Text variant="caption-2" color="hint">
          по {formatNumber(summary.purchases_count)} покупкам
        </Text>
      </div>
    </div>
  )
}

export function PromoPage() {
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; product: PromoProduct | null }>({
    open: false,
    product: null,
  })
  const [pickedDrug, setPickedDrug] = useState<CatalogDrug | null>(null)
  const [removing, setRemoving] = useState<PromoProduct | null>(null)

  const search = params.get('query') ?? ''
  const debouncedSearch = useDebounced(search, 350)

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['promo', 'list', { query: debouncedSearch }],
    queryFn: ({ pageParam, signal }) =>
      promoApi.list(
        {
          query: debouncedSearch || undefined,
          limit: PAGE,
          before_id: pageParam || undefined,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more && last.items.length ? last.items[last.items.length - 1].id : undefined),
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  // The summary covers the whole filtered set, not the loaded page — a tile
  // derived from `items` would read wrong the moment the operator filters.
  const summary = query.data?.pages[0]?.summary
  const filtered = Boolean(debouncedSearch)

  const remove = useMutation({
    mutationFn: (id: number) => promoApi.remove(id),
    onSuccess: () => {
      toaster.add({ name: 'promo-removed', theme: 'success', title: 'Промо-товар удалён' })
      setRemoving(null)
      void queryClient.invalidateQueries({ queryKey: ['promo'] })
    },
    onError: (e) =>
      toaster.add({
        name: 'promo-remove-error',
        theme: 'danger',
        title: 'Не удалось удалить',
        content: errorText(e),
      }),
  })

  /**
   * The Switch moves before the request settles — a control that waits a round
   * trip reads as broken to an operator who was just told it is. The rollback
   * is not optional: a failed toggle that leaves the Switch on while the server
   * has it off is the panel lying about the state of the app.
   *
   * The write walks every cached page, not just page 0: each cached query is a
   * `useInfiniteQuery`, and a partial write fixes the toggle on a page the
   * operator has already scrolled past.
   */
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => promoApi.setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['promo'] })
      const snapshot = queryClient.getQueriesData<InfiniteData<PromoListResponse>>({ queryKey: ['promo'] })
      queryClient.setQueriesData<InfiniteData<PromoListResponse>>({ queryKey: ['promo'] }, (old) =>
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
        name: 'promo-status',
        theme: 'success',
        title: status === PROMO_STATUS_LIVE ? 'Промо-товар включён' : 'Промо-товар выключен',
      })
    },
    onError: (e, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toaster.add({
        name: 'promo-status-error',
        theme: 'danger',
        title: 'Не удалось переключить промо-товар',
        content: errorText(e),
      })
    },
    // Runs on error too: without it a failed toggle leaves the row showing the
    // rolled-back value until someone refreshes by hand.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['promo'] })
    },
  })

  const columns: TableColumnConfig<PromoProduct>[] = [
    {
      id: 'product',
      name: 'Название / Производитель',
      primary: true,
      template: (p) => (
        <NomenclatureCell
          imageUrl={p.image_url}
          fullName={p.full_name}
          makerName={p.maker_name}
          makerCountry={p.maker_country}
        />
      ),
    },
    {
      id: 'ikpu',
      name: 'ИКПУ',
      align: 'end',
      template: (p) => <Text className="num">{compactCount(p.ikpu_count)}</Text>,
    },
    {
      id: 'bonus',
      name: 'Бонус',
      align: 'end',
      template: (p) => <Text className="num">{sums(p.bonus_amount)}</Text>,
    },
    {
      id: 'price',
      name: 'Цена',
      align: 'end',
      template: (p) => <Text className="num">{p.max_price > 0 ? `Не более ${sums(p.max_price)}` : '—'}</Text>,
    },
    {
      id: 'ends',
      name: 'Действует до',
      template: (p) => <Text className="num">{endsAtLabel(p.ends_at)}</Text>,
    },
    {
      id: 'status',
      name: 'Статус',
      // Two facts, not one: the Switch is the operator's decision (status),
      // the badge is what the app does about it (is_live + ends_at).
      template: (p) => (
        <div className="cell-title">
          <Switch
            size="s"
            checked={p.status === PROMO_STATUS_LIVE}
            onUpdate={(checked) =>
              setStatus.mutate({ id: p.id, status: checked ? PROMO_STATUS_LIVE : PROMO_STATUS_PAUSED })
            }
            controlProps={{ 'aria-label': `Показать «${p.name}» в приложении` }}
          />
          <Label theme={p.is_live ? 'success' : 'unknown'}>{statusLabel(p.status, p.is_live, p.ends_at)}</Label>
        </div>
      ),
    },
    {
      id: 'effect',
      name: 'Эффект',
      template: (p) =>
        p.effect && p.effect.purchases_count > 0 ? (
          <div className="cell-title">
            <Text className="num">{formatNumber(p.effect.purchases_count)} покупок</Text>
            <Text variant="caption-2" color="secondary" className="num">
              {sums(p.effect.bonus_paid)}
            </Text>
          </div>
        ) : (
          <Text color="hint">—</Text>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Промо-товары"
        description="Товары, за продвижение которых платят производители. Берутся из каталога: здесь их создают, настраивают и удаляют."
        actions={
          <Button view="action" size="l" onClick={() => setPickerOpen(true)}>
            <Icon data={Plus} size={16} />
            Добавить товар
          </Button>
        }
      />

      <SummaryTiles summary={summary} />

      <Text variant="body-2" color="hint" as="p">
        {EFFECT_CAVEAT}
      </Text>

      <div className="panel">
        <div className="toolbar">
          <TextInput
            className="toolbar__search"
            size="l"
            value={search}
            onUpdate={(v) => setParam('query', v)}
            placeholder="Название товара или производитель"
            startContent={
              <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
            }
            hasClear
            controlProps={{ autoComplete: 'off' }}
          />
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Товаров не нашлось' : 'Промо-товаров пока нет'}
            description={
              filtered
                ? 'Проверьте запрос: ищется по названию товара и производителю.'
                : 'Добавьте товар из каталога — он сразу появится в приложении.'
            }
            action={
              <Button view="action" size="l" onClick={() => setPickerOpen(true)}>
                Добавить товар
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <ActionsTable
                data={items}
                columns={columns}
                getRowId={(p) => String(p.id)}
                rowActionsSize="m"
                getRowActions={(p) => [
                  {
                    text: 'Редактировать',
                    icon: <Icon data={Pencil} size={16} />,
                    handler: () => {
                      setPickedDrug(null)
                      setDialog({ open: true, product: p })
                    },
                  },
                  {
                    text: 'Удалить',
                    theme: 'danger',
                    icon: <Icon data={TrashBin} size={16} />,
                    handler: () => setRemoving(p),
                  },
                ]}
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

      <CatalogPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(drug) => {
          setPickerOpen(false)
          setPickedDrug(drug)
          setDialog({ open: true, product: null })
        }}
      />

      <PromoProductDialog
        open={dialog.open}
        product={dialog.product}
        drug={pickedDrug}
        onClose={() => setDialog({ open: false, product: null })}
        onSaved={(created) => {
          setDialog({ open: false, product: null })
          setPickedDrug(null)
          toaster.add({
            name: 'promo-saved',
            theme: 'success',
            title: created ? 'Промо-товар создан' : 'Промо-товар обновлён',
          })
          void queryClient.invalidateQueries({ queryKey: ['promo'] })
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Удалить промо-товар?"
        confirmText="Удалить"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Товар исчезнет из приложения сразу. Вернуть его из панели будет нельзя — только добавить заново из каталога.
        </Text>
        {removing ? (
          <>
            <ConfirmLine label="Товар:" value={removing.full_name || removing.name} />
            <ConfirmLine
              label="Бонус:"
              value={`${sums(removing.bonus_amount)} за штуку, ${formatNumber(removing.ikpu_count)} ИКПУ-кодов`}
            />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
