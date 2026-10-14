import { Button, Icon, Loader, Text } from '@gravity-ui/uikit'
import { ArrowDown, ArrowUp, File, Plus, TrashBin } from '@gravity-ui/icons'
import { useRef, useState } from 'react'
import { surveysApi } from '../../../api/surveys'
import { errorText } from '../../../lib/errors'
import { newId, type SlideAsset } from '../../../surveys/schema'

interface Props {
  slides: SlideAsset[]
  onChange: (next: SlideAsset[]) => void
  disabled?: boolean
}

export function SlidesEditor({ slides, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function pick(files: FileList | null) {
    if (!files) return
    setError(null)
    let next = slides
    for (const file of Array.from(files)) {
      setPending((p) => p + 1)
      try {
        const r = await surveysApi.upload(file)
        next = [...next, { id: newId(), url: r.public_url, name: r.original_name, mime: r.content_type }]
        onChange(next)
      } catch (e) {
        setError(errorText(e))
      } finally {
        setPending((p) => p - 1)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    const next = slides.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
      <Text variant="body-1" color="secondary">
        Слайды · {slides.length}
      </Text>
      {slides.map((s, i) => (
        <div key={s.id} className="question-row" style={{ cursor: 'default' }}>
          {s.mime === 'application/pdf' ? (
            <span
              style={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--g-color-text-secondary)',
              }}
            >
              <Icon data={File} size={24} />
            </span>
          ) : (
            <img src={s.url} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8 }} />
          )}
          <div className="question-row__text">
            <Text variant="body-2" ellipsis>
              {s.name || s.url}
            </Text>
            <Text variant="caption-2" color="hint">
              {s.mime}
            </Text>
          </div>
          <div className="question-row__actions">
            <Button view="flat" size="m" onClick={() => move(i, -1)} disabled={disabled || i === 0} aria-label="Выше">
              <Icon data={ArrowUp} size={16} />
            </Button>
            <Button
              view="flat"
              size="m"
              onClick={() => move(i, 1)}
              disabled={disabled || i === slides.length - 1}
              aria-label="Ниже"
            >
              <Icon data={ArrowDown} size={16} />
            </Button>
            <Button
              view="flat-danger"
              size="m"
              onClick={() => onChange(slides.filter((x) => x.id !== s.id))}
              disabled={disabled}
              aria-label="Удалить"
            >
              <Icon data={TrashBin} size={16} />
            </Button>
          </div>
        </div>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => void pick(e.target.files)}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button size="m" view="outlined" onClick={() => inputRef.current?.click()} disabled={disabled || pending > 0}>
          {pending ? <Loader size="s" /> : <Icon data={Plus} size={16} />}
          Загрузить изображение или PDF
        </Button>
        {error ? (
          <Text variant="caption-2" color="danger">
            {error}
          </Text>
        ) : null}
      </div>
    </div>
  )
}
