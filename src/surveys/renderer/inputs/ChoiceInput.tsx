import { Checkbox, Radio, Text } from '@gravity-ui/uikit'
import { pickText, type SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type ChoiceField = Extract<SurveyField, { type: 'single_choice' | 'multi_choice' }>

export function ChoiceInput({ field, value, locale, t, onChange, disabled }: InputProps<ChoiceField>) {
  const multi = field.type === 'multi_choice'
  const selected = multi ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? value : ''

  function toggle(v: string) {
    if (disabled) return
    if (!multi) {
      onChange(v)
      return
    }
    const arr = selected as string[]
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  return (
    <div className="runner__options" role={multi ? 'group' : 'radiogroup'}>
      {field.options.map((o) => {
        const checked = multi ? (selected as string[]).includes(o.value) : selected === o.value
        return (
          <button
            key={o.id}
            type="button"
            className={['opt', checked ? 'opt_checked' : ''].join(' ')}
            aria-pressed={checked}
            onClick={() => toggle(o.value)}
            disabled={disabled}
          >
            {multi ? (
              <Checkbox size="l" checked={checked} controlProps={{ 'aria-hidden': true, tabIndex: -1 }} />
            ) : (
              <Radio size="l" value={o.value} checked={checked} controlProps={{ 'aria-hidden': true, tabIndex: -1 }} />
            )}
            <Text variant="body-2">{pickText(o.label, locale) || o.value}</Text>
          </button>
        )
      })}
      {multi ? (
        <Text variant="caption-2" color="hint">
          {t.chooseMany(field.min, field.max)}
        </Text>
      ) : null}
    </div>
  )
}
