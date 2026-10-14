import { TextArea, TextInput } from '@gravity-ui/uikit'
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
  titleLabel?: string
  descriptionLabel?: string
  titlePlaceholder?: string
  hideDescription?: boolean
  /** Plain text body instead of the Markdown article editor — survey copy is rendered verbatim by the app. */
  plainDescription?: boolean
}

/**
 * Title + rich-text body for every locale the app supports. Russian title
 * is required by the UI; the rest is optional.
 *
 * The body is Markdown rather than plain text so an author can embed
 * images and structure the text as an article — the same body the app
 * renders on its notification screen.
 */
export function LocaleFields({
  title,
  description,
  onTitle,
  onDescription,
  disabled,
  titleLabel = 'Заголовок',
  descriptionLabel = 'Текст',
  titlePlaceholder = 'Например: Кешбэк начислен',
  hideDescription,
  plainDescription,
}: Props) {
  return (
    <div className="locale-grid">
      {LOCALES.map((loc) => (
        <div key={loc.key} className="form__row">
          <Field label={`${titleLabel} · ${loc.label}`} required={loc.key === 'ru'}>
            <TextInput
              size="l"
              value={title[loc.key] ?? ''}
              onUpdate={(v) => onTitle({ ...title, [loc.key]: v })}
              disabled={disabled}
              placeholder={loc.key === 'ru' ? titlePlaceholder : ''}
            />
          </Field>
          {hideDescription ? null : plainDescription ? (
            <Field label={`${descriptionLabel} · ${loc.label}`}>
              <TextArea
                size="l"
                minRows={2}
                value={description[loc.key] ?? ''}
                onUpdate={(v) => onDescription({ ...description, [loc.key]: v })}
                disabled={disabled}
              />
            </Field>
          ) : (
            <Field
              label={`${descriptionLabel} · ${loc.label}`}
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
          )}
        </div>
      ))}
    </div>
  )
}
