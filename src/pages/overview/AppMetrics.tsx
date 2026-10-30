import { Alert, Button, Flex, Label, SegmentedRadioGroup, Text, Tooltip } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { metricsApi } from '../../api/metrics'
import { isApiError } from '../../api/client'
import type { AppMetrics as AppMetricsData } from '../../api/types'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber, plural } from '../../lib/format'

type Range = 7 | 30

/**
 * What is happening in the mobile app, read from PostHog. Every number is a
 * count of real events; when the source is missing the block says so instead
 * of showing zeros.
 */
export function AppMetrics() {
  const [range, setRange] = useState<Range>(7)
  const query = useQuery({
    queryKey: ['metrics', 'app', range],
    queryFn: ({ signal }) => metricsApi.app(range, signal),
    staleTime: 60_000,
    retry: (count, e) => !(isApiError(e) && (e.status === 503 || e.status === 502)) && count < 1,
  })

  const notConfigured = query.isError && isApiError(query.error) && query.error.alias === 'metrics.not_configured'
  const rangeLabel = range === 7 ? 'за 7 дней' : 'за 30 дней'

  return (
    <section className="section">
      <Flex justifyContent="space-between" alignItems="center" gap={3} wrap>
        <Text variant="subheader-2">Приложение {rangeLabel}</Text>
        <SegmentedRadioGroup size="s" value={String(range)} onUpdate={(v) => setRange(Number(v) as Range)}>
          <SegmentedRadioGroup.Option value="7">7 дней</SegmentedRadioGroup.Option>
          <SegmentedRadioGroup.Option value="30">30 дней</SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
      </Flex>

      {query.isError ? (
        <Alert
          theme={notConfigured ? 'info' : 'warning'}
          title={notConfigured ? 'Аналитика приложения не подключена' : 'Аналитика недоступна'}
          message={
            notConfigured
              ? 'Цифры появятся, когда на сервере будет ключ PostHog. Пока здесь ничего не показываем, чтобы не выдумывать.'
              : errorText(query.error)
          }
          actions={
            notConfigured ? undefined : (
              <Button size="m" onClick={() => void query.refetch()}>
                Повторить
              </Button>
            )
          }
          layout="horizontal"
        />
      ) : (
        <Body data={query.data} pending={query.isPending} range={range} />
      )}
    </section>
  )
}

function Body({ data, pending, range }: { data?: AppMetricsData; pending: boolean; range: Range }) {
  const v = (n?: number) => (pending || n === undefined ? '…' : formatNumber(n))
  const active = range === 7 ? data?.active.week : data?.active.month
  const signedShare =
    data && data.people.total > 0 ? Math.round((data.people.identified / data.people.total) * 100) : null

  return (
    <>
      <div className="tiles">
        <Tile
          label="Активные пользователи"
          value={v(active)}
          note={data ? `сегодня ${formatNumber(data.active.day)} · за 30 дней ${formatNumber(data.active.month)}` : ''}
        >
          {data ? <Spark points={data.daily_active.map((d) => d.people)} /> : null}
        </Tile>
        <Tile
          label="Новые устройства"
          value={v(data?.people.new_in_range)}
          note={
            data
              ? `всего ${formatNumber(data.people.total)}, вошли в аккаунт ${formatNumber(data.people.identified)}${signedShare !== null ? ` (${signedShare}%)` : ''}`
              : ''
          }
        />
        <Tile
          label="Открытий приложения"
          value={v(data?.in_range.opens)}
          note={data ? `${plural(data.in_range.screen_views, ['экран', 'экрана', 'экранов'])} просмотрено` : ''}
        />
        <Tile
          label="Ошибки в приложении"
          value={v(data?.in_range.errors)}
          tone={data && data.in_range.errors > 0 ? 'danger' : undefined}
          note={
            data
              ? data.in_range.errors > 0
                ? `у ${plural(data.in_range.people_with_errors, ['пользователя', 'пользователей', 'пользователей'])}`
                : 'падений не было'
              : ''
          }
        />
      </div>

      {data ? (
        <div className="metrics-lists">
          <Breakdown title="Экраны, куда заходят" empty="Просмотров экранов пока нет.">
            {data.top_screens.map((s) => (
              <Row key={s.name} name={s.name} value={formatNumber(s.views)} sub={`${formatNumber(s.people)} чел.`} />
            ))}
          </Breakdown>
          <Breakdown title="Версии приложения" empty="Данных о версиях пока нет.">
            {data.versions.map((x) => (
              <Row key={x.version} name={x.version} value={formatNumber(x.people)} sub="чел." />
            ))}
          </Breakdown>
          <Breakdown title="Платформы" empty="Данных о платформах пока нет.">
            {data.platforms.map((x) => (
              <Row key={x.os} name={x.os} value={formatNumber(x.people)} sub="чел." />
            ))}
          </Breakdown>
        </div>
      ) : null}

      {data ? (
        <Text variant="caption-2" color="hint">
          По событиям приложения в PostHog, обновлено {formatDateTime(data.generated_at)}. Активный — тот, кто открыл
          приложение или экран. Устройство становится пользователем после входа в аккаунт.
        </Text>
      ) : null}
    </>
  )
}

function Tile({
  label,
  value,
  note,
  tone,
  children,
}: {
  label: string
  value: string
  note: string
  tone?: 'danger'
  children?: React.ReactNode
}) {
  return (
    <div className="tile">
      <Text variant="body-1" color="secondary">
        {label}
      </Text>
      <Flex alignItems="flex-end" justifyContent="space-between" gap={3}>
        <Text variant="header-2" className="tile__value" color={tone}>
          {value}
        </Text>
        {children}
      </Flex>
      <Text variant="caption-2" color="hint">
        {note}
      </Text>
    </div>
  )
}

/** Fourteen bars, one per day, no axes: the shape of the last two weeks at a glance. */
function Spark({ points }: { points: number[] }) {
  if (points.length === 0) return null
  const max = Math.max(1, ...points)
  return (
    <Tooltip content={`Активные по дням, последние ${plural(points.length, ['день', 'дня', 'дней'])}`}>
      <div className="spark" aria-hidden>
        {points.map((p, i) => (
          <span key={i} className="spark__bar" style={{ height: `${Math.max(8, Math.round((p / max) * 100))}%` }} />
        ))}
      </div>
    </Tooltip>
  )
}

function Breakdown({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="panel panel_filled">
      <Text variant="subheader-1" className="panel__title" as="div">
        {title}
      </Text>
      <div className="panel__body metrics-rows">
        {children.length === 0 ? (
          <Text variant="body-1" color="hint">
            {empty}
          </Text>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Row({ name, value, sub }: { name: string; value: string; sub: string }) {
  return (
    <div className="metrics-row">
      <Text variant="body-1" ellipsis className="metrics-row__name">
        {name}
      </Text>
      <Text variant="body-1" className="num">
        {value}
      </Text>
      <Label size="xs" theme="unknown">
        {sub}
      </Label>
    </div>
  )
}
