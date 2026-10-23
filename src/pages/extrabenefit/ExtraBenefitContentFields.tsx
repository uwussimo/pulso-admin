import { Tab, TabList, TabPanel, TabProvider, Text, TextArea, TextInput } from '@gravity-ui/uikit'
import { useState } from 'react'
import type { ExtraBenefitContent, ExtraBenefitContentMap, Locale } from '../../api/types'
import { Field } from '../../components/Field'
import { LOCALES } from '../../lib/constants'
import { emptyContent } from './extraBenefit.utils'

interface Props {
  content: ExtraBenefitContentMap
  onChange: (next: ExtraBenefitContentMap) => void
  disabled?: boolean
}

/**
 * The copy of a goal offer, in every language the app speaks.
 *
 * The three locales are tabs rather than one long column: six fields × three
 * languages is eighteen controls, and a form that long hides the language the
 * operator is not editing. The tabs keep one language on screen at a time.
 *
 * Russian is required; the other two are optional — the app falls back ru →
 * uz → uzCyrl → any, so an offer with only Russian still shows everywhere.
 */
export function ExtraBenefitContentFields({ content, onChange, disabled }: Props) {
  const [locale, setLocale] = useState<string>('ru')

  function patch(key: Locale, field: keyof ExtraBenefitContent, value: string) {
    const current = content[key] ?? emptyContent()
    onChange({ ...content, [key]: { ...current, [field]: value } })
  }

  return (
    <TabProvider value={locale} onUpdate={setLocale}>
      <TabList style={{ marginBottom: 'var(--g-spacing-3)' }}>
        {LOCALES.map((loc) => (
          <Tab key={loc.key} value={loc.key} title={loc.label}>
            {loc.short}
          </Tab>
        ))}
      </TabList>

      {LOCALES.map((loc) => {
        const doc = content[loc.key] ?? emptyContent()
        return (
          <TabPanel key={loc.key} value={loc.key}>
            <div className="form">
              <Field label="Заголовок" required={loc.key === 'ru'} hint="Крупно на карточке в приложении.">
                <TextInput
                  size="l"
                  value={doc.title}
                  onUpdate={(v) => patch(loc.key, 'title', v)}
                  disabled={disabled}
                  placeholder={loc.key === 'ru' ? 'Например: Запас на сезон простуды' : ''}
                />
              </Field>

              <Field label="Подзаголовок" hint="Строка под заголовком: зачем эта акция.">
                <TextInput
                  size="l"
                  value={doc.subtitle}
                  onUpdate={(v) => patch(loc.key, 'subtitle', v)}
                  disabled={disabled}
                />
              </Field>

              <Field label="Почему это выгодно" hint="Показывается, когда пользователь открыл карточку.">
                <TextArea
                  size="l"
                  minRows={2}
                  maxRows={5}
                  value={doc.rationale}
                  onUpdate={(v) => patch(loc.key, 'rationale', v)}
                  disabled={disabled}
                />
              </Field>

              <Field
                label="Правила"
                hint="Один блок текста — так приложение и показывает его. Например: «Цель действует на чеки из любых аптек Узбекистана.»"
              >
                <TextArea
                  size="l"
                  minRows={2}
                  maxRows={6}
                  value={doc.rules}
                  onUpdate={(v) => patch(loc.key, 'rules', v)}
                  disabled={disabled}
                />
              </Field>

              {loc.key !== 'ru' && !doc.title.trim() ? (
                <Text variant="caption-2" color="hint">
                  Этот язык не заполнен — приложение покажет русский текст.
                </Text>
              ) : null}
            </div>
          </TabPanel>
        )
      })}
    </TabProvider>
  )
}
