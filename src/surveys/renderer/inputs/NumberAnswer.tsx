import { TextInput } from '@gravity-ui/uikit'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type NumberField = Extract<SurveyField, { type: 'number' }>

/** A plain text input with a numeric keyboard: NumberInput's spinner is awkward on phones. */
export function NumberAnswer({ field, value, onChange, onEnter, disabled }: InputProps<NumberField>) {
  const text = value === undefined || value === null ? '' : String(value)
  return (
    <TextInput
      size="xl"
      value={text}
      onUpdate={(v) => {
        const cleaned = v.replace(',', '.').replace(/[^\d.-]/g, '')
        if (cleaned === '' || cleaned === '-') {
          onChange(undefined)
          return
        }
        const n = Number(cleaned)
        onChange(Number.isFinite(n) ? n : cleaned)
      }}
      disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter()
      }}
      controlProps={{
        inputMode: 'decimal',
        enterKeyHint: 'next',
        min: field.min,
        max: field.max,
        step: field.step,
      }}
    />
  )
}
