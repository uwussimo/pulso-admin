import { TextInput } from '@gravity-ui/uikit'
import type { LocaleMap } from '../../api/types'
import { Field } from '../../components/Field'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { LOCALES } from '../../lib/constants'

interface Props {
  title: LocaleMap
  description: LocaleMap
  onTitle: (next: LocaleMap) => void
  onDescription: (next: LocaleMap) => void
  disabled?: boolean
}

/**
 * Title + rich-text body for every locale the app supports. Russian title
 * is required by the UI; the rest is optional.
 *
 * The body is Markdown rather than plain text so an author can embed
 * images and structure the text as an article — the same body the app
 * renders on its notification screen.
 */
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
          <Field
            label={`Текст · ${loc.label}`}
            help="Markdown с картинками. В приложении это статья на экране уведомлений."
          >
            <MarkdownEditor
              value={description[loc.key] ?? ''}
              onChange={(v) => onDescription({ ...description, [loc.key]: v })}
              disabled={disabled}
              ariaLabel={`Текст уведомления, ${loc.label}`}
              rows={8}
              placeholder={loc.key === 'ru' ? 'Расскажите о новости. Можно вставить картинку.' : ''}
            />
          </Field>
        </div>
      ))}
    </div>
  )
}
