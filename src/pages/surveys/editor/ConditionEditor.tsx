import { Alert, Button, NumberInput, SegmentedRadioGroup, Select, Switch, Text, TextInput } from '@gravity-ui/uikit'
import { Field } from '../../../components/Field'
import {
  conditionSentence,
  pickText,
  type Condition,
  type SimpleConditionType,
  type SurveyField,
} from '../../../surveys/schema'

interface Props {
  field: SurveyField
  fields: SurveyField[]
  onChange: (cond: Condition | undefined) => void
  disabled?: boolean
}

const NUMERIC = new Set(['number', 'rating', 'nps'])

const OPS: { value: SimpleConditionType; label: string; numeric?: boolean }[] = [
  { value: 'answered', label: 'отвечен' },
  { value: 'equals', label: 'равно' },
  { value: 'not_equals', label: 'не равно' },
  { value: 'gte', label: '≥', numeric: true },
  { value: 'lte', label: '≤', numeric: true },
]

type SimpleCondition =
  | { type: 'answered'; fieldId: string }
  | { type: 'equals' | 'not_equals'; fieldId: string; value: string | number | boolean }
  | { type: 'gte' | 'lte'; fieldId: string; value: number }

function isSimple(c: Condition): c is SimpleCondition {
  return c.type === 'answered' || c.type === 'equals' || c.type === 'not_equals' || c.type === 'gte' || c.type === 'lte'
}

export function ConditionEditor({ field, fields, onChange, disabled }: Props) {
  const idx = fields.findIndex((f) => f.id === field.id)
  const sources = fields.slice(0, Math.max(0, idx)).filter((f) => f.type !== 'slide')
  const raw = field.visibleWhen

  if (raw && !isSimple(raw)) {
    return (
      <Alert
        theme="info"
        message={`Сложное условие: показывать, если ${conditionSentence(fields, raw)}. Здесь редактируется только простое условие.`}
        actions={
          <Button size="m" onClick={() => onChange(undefined)} disabled={disabled}>
            Сбросить
          </Button>
        }
      />
    )
  }

  const cond = raw && isSimple(raw) ? raw : undefined
  const src = cond ? sources.find((f) => f.id === cond.fieldId) : undefined
  const srcNumeric = src ? NUMERIC.has(src.type) : false

  function setSource(id: string) {
    const s = sources.find((f) => f.id === id)
    if (!s) return
    onChange({ type: 'answered', fieldId: id })
  }

  function setOp(op: SimpleConditionType) {
    if (!cond) return
    const fieldId = cond.fieldId
    if (op === 'answered') return onChange({ type: 'answered', fieldId })
    if (op === 'gte' || op === 'lte') return onChange({ type: op, fieldId, value: 0 })
    const first =
      src?.type === 'yes_no'
        ? true
        : src?.type === 'single_choice' || src?.type === 'multi_choice'
          ? (src.options[0]?.value ?? '')
          : ''
    onChange({ type: op, fieldId, value: first })
  }

  function setValue(value: string | number | boolean) {
    if (!cond || cond.type === 'answered') return
    if (cond.type === 'gte' || cond.type === 'lte') {
      onChange({ type: cond.type, fieldId: cond.fieldId, value: Number(value) })
      return
    }
    onChange({ type: cond.type, fieldId: cond.fieldId, value })
  }

  const valueControl = (() => {
    if (!cond || cond.type === 'answered' || !src) return null
    if (cond.type === 'gte' || cond.type === 'lte') {
      return <NumberInput size="l" value={cond.value} onUpdate={(v) => setValue(v ?? 0)} disabled={disabled} />
    }
    if (src.type === 'yes_no') {
      return (
        <SegmentedRadioGroup
          size="l"
          value={String(cond.value === true)}
          onUpdate={(v) => setValue(v === 'true')}
          disabled={disabled}
        >
          <SegmentedRadioGroup.Option value="true">Да</SegmentedRadioGroup.Option>
          <SegmentedRadioGroup.Option value="false">Нет</SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
      )
    }
    if (src.type === 'single_choice' || src.type === 'multi_choice') {
      return (
        <Select
          size="l"
          value={[String(cond.value)]}
          onUpdate={(v) => setValue(v[0] ?? '')}
          options={src.options.map((o) => ({ value: o.value, content: pickText(o.label, 'ru') || o.value }))}
          disabled={disabled}
        />
      )
    }
    if (NUMERIC.has(src.type)) {
      return (
        <NumberInput size="l" value={Number(cond.value) || 0} onUpdate={(v) => setValue(v ?? 0)} disabled={disabled} />
      )
    }
    return <TextInput size="l" value={String(cond.value)} onUpdate={(v) => setValue(v)} disabled={disabled} />
  })()

  return (
    <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
      <Switch
        size="l"
        checked={Boolean(cond)}
        onUpdate={(on) => (on && sources[0] ? setSource(sources[0].id) : onChange(undefined))}
        disabled={disabled || sources.length === 0}
      >
        Показывать при условии
      </Switch>
      {sources.length === 0 ? (
        <Text variant="caption-2" color="hint">
          Условие может ссылаться только на вопросы выше по списку.
        </Text>
      ) : null}
      {cond ? (
        <>
          <div className="form__row">
            <Field label="Вопрос">
              <Select
                size="l"
                value={[cond.fieldId]}
                onUpdate={(v) => v[0] && setSource(v[0])}
                options={sources.map((f) => ({ value: f.id, content: pickText(f.label, 'ru') || f.key }))}
                disabled={disabled}
              />
            </Field>
            <Field label="Условие">
              <Select
                size="l"
                value={[cond.type]}
                onUpdate={(v) => v[0] && setOp(v[0] as SimpleConditionType)}
                options={OPS.filter((o) => !o.numeric || srcNumeric).map((o) => ({ value: o.value, content: o.label }))}
                disabled={disabled}
              />
            </Field>
            {valueControl ? <Field label="Значение">{valueControl}</Field> : null}
          </div>
          <Text variant="caption-2" color="hint">
            Показывать, если {conditionSentence(fields, cond)}
          </Text>
        </>
      ) : null}
    </div>
  )
}
