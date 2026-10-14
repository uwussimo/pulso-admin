import { Button, Icon, SegmentedRadioGroup, Text, TextInput } from '@gravity-ui/uikit'
import { ArrowDown, ArrowUp, Plus, TrashBin } from '@gravity-ui/icons'
import { useState } from 'react'
import type { Locale } from '../../../api/types'
import { LOCALES } from '../../../lib/constants'
import { OPTIONS_MAX, OPTIONS_MIN, newId, slugifyKey, type Choice } from '../../../surveys/schema'

interface Props {
  options: Choice[]
  onChange: (next: Choice[]) => void
  disabled?: boolean
}

export function ChoicesEditor({ options, onChange, disabled }: Props) {
  const [locale, setLocale] = useState<Locale>('ru')
  const [valueTouched, setValueTouched] = useState<Record<string, boolean>>({})

  const missing = LOCALES.filter((l) => l.key !== 'ru' && options.some((o) => !o.label[l.key]?.trim())).map(
    (l) => l.short,
  )

  function update(id: string, patch: Partial<Choice>) {
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= options.length) return
    const next = options.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  function add() {
    const n = options.length + 1
    onChange([...options, { id: newId(), value: `option_${n}`, label: { ru: `Вариант ${n}` } }])
  }

  const values = options.map((o) => o.value)

  return (
    <div className="choices">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Text variant="body-1" color="secondary">
          Варианты
        </Text>
        <SegmentedRadioGroup size="s" value={locale} onUpdate={(v) => setLocale(v as Locale)}>
          {LOCALES.map((l) => (
            <SegmentedRadioGroup.Option key={l.key} value={l.key}>
              {l.short}
            </SegmentedRadioGroup.Option>
          ))}
        </SegmentedRadioGroup>
        {missing.length ? (
          <Text variant="caption-2" color="hint">
            не заполнено: {missing.join(', ')}
          </Text>
        ) : null}
      </div>
      {options.map((o, i) => {
        const dup = values.filter((v) => v === o.value).length > 1
        return (
          <div key={o.id} className="choices__row">
            <TextInput
              size="l"
              value={o.label[locale] ?? ''}
              placeholder={locale === 'ru' ? `Вариант ${i + 1}` : (o.label.ru ?? '')}
              onUpdate={(v) => {
                const patch: Partial<Choice> = { label: { ...o.label, [locale]: v } }
                if (locale === 'ru' && !valueTouched[o.id]) patch.value = slugifyKey(v) || `option_${i + 1}`
                update(o.id, patch)
              }}
              disabled={disabled}
            />
            <TextInput
              size="l"
              value={o.value}
              onUpdate={(v) => {
                setValueTouched((t) => ({ ...t, [o.id]: true }))
                update(o.id, { value: v })
              }}
              placeholder="значение"
              validationState={dup || !o.value.trim() ? 'invalid' : undefined}
              errorMessage={dup ? 'Повторяется' : !o.value.trim() ? 'Пусто' : undefined}
              controlProps={{ style: { fontFamily: 'var(--g-font-family-monospace)' } }}
              disabled={disabled}
            />
            <div style={{ display: 'flex', gap: 2 }}>
              <Button view="flat" size="l" onClick={() => move(i, -1)} disabled={disabled || i === 0} aria-label="Выше">
                <Icon data={ArrowUp} size={16} />
              </Button>
              <Button
                view="flat"
                size="l"
                onClick={() => move(i, 1)}
                disabled={disabled || i === options.length - 1}
                aria-label="Ниже"
              >
                <Icon data={ArrowDown} size={16} />
              </Button>
              <Button
                view="flat-danger"
                size="l"
                onClick={() => onChange(options.filter((x) => x.id !== o.id))}
                disabled={disabled || options.length <= OPTIONS_MIN}
                aria-label="Удалить вариант"
              >
                <Icon data={TrashBin} size={16} />
              </Button>
            </div>
          </div>
        )
      })}
      <div>
        <Button size="m" view="outlined" onClick={add} disabled={disabled || options.length >= OPTIONS_MAX}>
          <Icon data={Plus} size={16} />
          Добавить вариант
        </Button>
      </div>
    </div>
  )
}
