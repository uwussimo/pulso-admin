import { TextArea, TextInput } from '@gravity-ui/uikit'
import type { LocaleMap } from '../../api/types'
import { Field } from '../../components/Field'
import { LOCALES } from '../../lib/constants'

interface Props {
  title: LocaleMap
  description: LocaleMap
  onTitle: (next: LocaleMap) => void
  onDescription: (next: LocaleMap) => void
  disabled?: boolean
}

/** Title + body for every locale the app supports. Russian title is required by the UI; the rest is optional. */
export function LocaleFields({ title, description, onTitle, onDescription, disabled }: Props) {
  return (
    <div className="locale-grid">
      {LOCALES.map((loc) => (
        <div key={loc.key} className="form__row">
          <Field label={`Заголовок · ${loc.label}`} required={loc.key === 'ru'}>
            <TextInput
              size="l"
              value={title[loc.key] ?? ''}
              onUpdate={(v) => onTitle({ ...title, [loc.key]: v })}
              disabled={disabled}
              placeholder={loc.key === 'ru' ? 'Например: Кешбэк начислен' : ''}
            />
          </Field>
          <Field label={`Текст · ${loc.label}`}>
            <TextArea
              size="l"
              minRows={2}
              maxRows={5}
              value={description[loc.key] ?? ''}
              onUpdate={(v) => onDescription({ ...description, [loc.key]: v })}
              disabled={disabled}
            />
          </Field>
        </div>
      ))}
    </div>
  )
}
