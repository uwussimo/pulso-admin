import { Icon, Label, Progress, Text } from '@gravity-ui/uikit'
import type { QuestionStats } from '../../../api/types'
import { formatNumber, plural } from '../../../lib/format'
import { fieldTypeMeta } from '../../../surveys/fieldTypes'
import { optionLabel, pickText, type SurveyField } from '../../../surveys/schema'

interface Props {
  index: number
  field: SurveyField
  stats: QuestionStats | undefined
  submissions: number
}

function Rows({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  return (
    <div className="stat-rows">
      {rows.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : 0
        return (
          <div key={r.label} className="stat-row">
            <Text variant="body-2" ellipsis>
              {r.label}
            </Text>
            <Progress size="s" value={pct} theme="info" />
            <Text variant="body-2" className="num" whiteSpace="nowrap">
              {formatNumber(r.count)} <Text color="hint">· {pct}%</Text>
            </Text>
          </div>
        )
      })}
    </div>
  )
}

export function QuestionStatsCard({ index, field, stats, submissions }: Props) {
  const meta = fieldTypeMeta(field.type)
  const answered = stats?.answered ?? 0
  let body: React.ReactNode
  switch (field.type) {
    case 'single_choice':
    case 'multi_choice': {
      const counts = new Map((stats?.options ?? []).map((o) => [o.value, o.count]))
      const rows = field.options.map((o) => ({
        label: pickText(o.label, 'ru') || o.value,
        count: counts.get(o.value) ?? 0,
      }))
      for (const o of stats?.options ?? []) {
        if (!field.options.some((x) => x.value === o.value))
          rows.push({ label: optionLabel(field, o.value, 'ru'), count: o.count })
      }
      body = <Rows rows={rows} total={answered} />
      break
    }
    case 'yes_no': {
      const counts = new Map((stats?.options ?? []).map((o) => [o.value, o.count]))
      body = (
        <Rows
          rows={[
            { label: 'Да', count: counts.get('true') ?? 0 },
            { label: 'Нет', count: counts.get('false') ?? 0 },
          ]}
          total={answered}
        />
      )
      break
    }
    case 'rating':
    case 'nps':
    case 'number': {
      const dist = (stats?.distribution ?? []).slice().sort((a, b) => Number(a.value) - Number(b.value))
      body = (
        <div className="form" style={{ gap: 'var(--g-spacing-3)' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
            <div>
              <Text variant="caption-2" color="hint" as="div">
                Средняя
              </Text>
              <Text variant="header-1" className="num">
                {stats?.avg !== undefined ? stats.avg.toFixed(1) : '—'}
              </Text>
            </div>
            {field.type === 'nps' ? (
              <div>
                <Text variant="caption-2" color="hint" as="div">
                  NPS
                </Text>
                <Text
                  variant="header-1"
                  className="num"
                  color={stats?.nps_score !== undefined && stats.nps_score < 0 ? 'danger' : undefined}
                >
                  {stats?.nps_score !== undefined ? Math.round(stats.nps_score) : '—'}
                </Text>
              </div>
            ) : null}
          </div>
          {dist.length ? <Rows rows={dist.map((d) => ({ label: d.value, count: d.count }))} total={answered} /> : null}
        </div>
      )
      break
    }
    case 'text':
    case 'textarea':
    case 'date':
      body = (
        <Text variant="body-2" color="secondary">
          {plural(answered, ['ответ', 'ответа', 'ответов'])} — смотрите во вкладке «Ответы».
        </Text>
      )
      break
    case 'image_upload':
      body = (
        <Text variant="body-2" color="secondary">
          Фото прикрепили {plural(answered, ['пользователь', 'пользователя', 'пользователей'])}.
        </Text>
      )
      break
    case 'slide':
      body = (
        <Text variant="body-2" color="secondary">
          Просмотрели {formatNumber(answered)} из {formatNumber(submissions)}.
        </Text>
      )
      break
  }

  return (
    <div className="panel">
      <div className="panel__title" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Text variant="body-1" color="hint" className="num" style={{ width: 24, textAlign: 'right', flexShrink: 0 }}>
          {index + 1}
        </Text>
        <div className="cell-title" style={{ flex: 1 }}>
          <Text variant="subheader-2">{pickText(field.label, 'ru') || field.key}</Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Label theme="unknown" size="xs" icon={<Icon data={meta.icon} size={12} />}>
              {meta.label}
            </Label>
            <Text variant="caption-2" color="hint" className="num">
              ответили {formatNumber(answered)}
              {submissions ? ` из ${formatNumber(submissions)}` : ''}
            </Text>
          </div>
        </div>
      </div>
      <div className="panel__body">{body}</div>
    </div>
  )
}
