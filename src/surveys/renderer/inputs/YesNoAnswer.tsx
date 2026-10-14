import { Text } from '@gravity-ui/uikit'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type YesNoField = Extract<SurveyField, { type: 'yes_no' }>

export function YesNoAnswer({ value, t, onChange, disabled }: InputProps<YesNoField>) {
  return (
    <div className="runner__yesno" role="radiogroup">
      {[
        { v: true, label: t.yes },
        { v: false, label: t.no },
      ].map((o) => (
        <button
          key={String(o.v)}
          type="button"
          className={['opt', 'opt_big', value === o.v ? 'opt_checked' : ''].join(' ')}
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          disabled={disabled}
        >
          <Text variant="subheader-2">{o.label}</Text>
        </button>
      ))}
    </div>
  )
}
