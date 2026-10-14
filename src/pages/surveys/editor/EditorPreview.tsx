import { Button, Icon, SegmentedRadioGroup, Text } from '@gravity-ui/uikit'
import { Check } from '@gravity-ui/icons'
import { useMemo, useState } from 'react'
import type { Locale } from '../../../api/types'
import { LOCALES } from '../../../lib/constants'
import { formatSum, plural } from '../../../lib/format'
import { SurveyRunner } from '../../../surveys/renderer/SurveyRunner'
import type { SchemaIssue } from '../../../surveys/schema'
import { compactLocaleMap } from '../../notifications/locale'
import type { EditorState } from './editorReducer'

interface Props {
  state: EditorState
  publishIssues: SchemaIssue[]
}

export function EditorPreview({ state, publishIssues }: Props) {
  const [locale, setLocale] = useState<Locale>('ru')
  const [epoch, setEpoch] = useState(0)
  const { meta, fields } = state

  const survey = useMemo(
    () => ({
      title: compactLocaleMap(meta.title),
      description: compactLocaleMap(meta.description),
      cover_image_url: meta.coverImageUrl || undefined,
      reward_amount: meta.rewardAmount ?? 0,
      schema: { version: 1 as const, fields },
    }),
    [meta.title, meta.description, meta.coverImageUrl, meta.rewardAmount, fields],
  )

  const questions = fields.filter((f) => f.type !== 'slide').length
  const required = fields.filter((f) => f.required && f.type !== 'slide').length
  const uzMissing =
    !meta.title.uz?.trim() ||
    !meta.title.uzCyrl?.trim() ||
    fields.some((f) => !f.label.uz?.trim() || !f.label.uzCyrl?.trim())

  const checks = [
    { label: 'Название на русском', ok: Boolean(meta.title.ru?.trim()) },
    { label: 'Хотя бы один вопрос', ok: questions > 0 },
    { label: 'У вопросов нет ошибок', ok: publishIssues.filter((i) => i.path !== 'fields').length === 0 },
    { label: 'Узбекские версии заполнены', ok: !uzMissing },
    { label: 'Награда указана', ok: meta.rewardAmount !== null },
  ]

  return (
    <aside className="form" style={{ flex: '0 1 380px', minWidth: 300, position: 'sticky', top: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="subheader-2">Превью</Text>
        <SegmentedRadioGroup size="s" value={locale} onUpdate={(v) => setLocale(v as Locale)}>
          {LOCALES.map((l) => (
            <SegmentedRadioGroup.Option key={l.key} value={l.key}>
              {l.short}
            </SegmentedRadioGroup.Option>
          ))}
        </SegmentedRadioGroup>
      </div>
      <div className="phone-preview phone-preview_frame">
        <SurveyRunner
          key={`${epoch}-${locale}`}
          survey={survey}
          locale={locale}
          mode="preview"
          onSubmit={() =>
            new Promise((r) =>
              setTimeout(
                () =>
                  r({
                    submission_id: 0,
                    reward_amount: survey.reward_amount,
                    credited: survey.reward_amount > 0,
                    already_completed: false,
                    completed_at: new Date().toISOString(),
                  }),
                600,
              ),
            )
          }
          onReturn={() => setEpoch((e) => e + 1)}
        />
      </div>
      <div>
        <Button size="s" view="flat-secondary" onClick={() => setEpoch((e) => e + 1)}>
          Сбросить превью
        </Button>
      </div>

      <div className="panel panel_filled">
        <Text variant="subheader-2" className="panel__title" as="div">
          Готовность к запуску
        </Text>
        <div className="panel__body">
          <ul className="checklist">
            {checks.map((c) => (
              <li key={c.label} className="checklist__item">
                <span className={['checklist__mark', c.ok ? 'checklist__mark_done' : ''].join(' ')}>
                  {c.ok ? <Icon data={Check} size={12} /> : null}
                </span>
                <Text variant="body-2" color={c.ok ? undefined : 'secondary'}>
                  {c.label}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel panel_filled">
        <div className="panel__body kv">
          <Text className="kv__key">Вопросов</Text>
          <Text className="num">
            {questions}
            <Text color="hint"> · обязательных {required}</Text>
          </Text>
          <Text className="kv__key">Награда</Text>
          <Text className="num">{meta.rewardAmount ? formatSum(meta.rewardAmount) : 'без начисления'}</Text>
          <Text className="kv__key">Период</Text>
          <Text>
            {meta.scheduled || meta.autoClose
              ? `${meta.scheduled ? `с ${meta.startsAt.replace('T', ' ')}` : ''} ${meta.autoClose ? `до ${meta.endsAt.replace('T', ' ')}` : ''}`.trim()
              : 'сразу и бессрочно'}
          </Text>
          <Text className="kv__key">Слайдов</Text>
          <Text className="num">
            {plural(fields.filter((f) => f.type === 'slide').length, ['слайд', 'слайда', 'слайдов'])}
          </Text>
        </div>
      </div>
    </aside>
  )
}
