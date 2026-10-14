import { Text, TextArea, TextInput } from '@gravity-ui/uikit'
import { TEXTAREA_MAX, TEXT_MAX, pickText, type SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type TextField = Extract<SurveyField, { type: 'text' | 'textarea' }>

export function TextAnswer({ field, value, locale, onChange, onEnter, disabled }: InputProps<TextField>) {
  const text = typeof value === 'string' ? value : ''
  const max = field.maxLength ?? (field.type === 'text' ? TEXT_MAX : TEXTAREA_MAX)
  const placeholder = pickText(field.placeholder, locale)
  return (
    <div className="runner__field">
      {field.type === 'text' ? (
        <TextInput
          size="xl"
          value={text}
          onUpdate={(v) => onChange(v)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter()
          }}
          controlProps={{ maxLength: max, enterKeyHint: 'next' }}
        />
      ) : (
        <TextArea
          size="xl"
          minRows={4}
          maxRows={10}
          value={text}
          onUpdate={(v) => onChange(v)}
          placeholder={placeholder}
          disabled={disabled}
          controlProps={{ maxLength: max }}
        />
      )}
      <Text variant="caption-2" color="hint" className="num" style={{ alignSelf: 'flex-end' }}>
        {[...text].length} / {max}
      </Text>
    </div>
  )
}
