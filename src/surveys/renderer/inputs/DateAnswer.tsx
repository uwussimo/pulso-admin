import { TextInput } from '@gravity-ui/uikit'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type DateField = Extract<SurveyField, { type: 'date' }>

/** Native date input: WebViews on both platforms show the system picker and return YYYY-MM-DD. */
export function DateAnswer({ field, value, onChange, onEnter, disabled }: InputProps<DateField>) {
  return (
    <TextInput
      size="xl"
      value={typeof value === 'string' ? value : ''}
      onUpdate={(v) => onChange(v || undefined)}
      disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter()
      }}
      controlProps={{ type: 'date', min: field.minDate, max: field.maxDate }}
    />
  )
}
