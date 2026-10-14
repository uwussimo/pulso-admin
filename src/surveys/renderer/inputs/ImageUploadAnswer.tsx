import { Button, Icon, Loader, Text } from '@gravity-ui/uikit'
import { Picture, Xmark } from '@gravity-ui/icons'
import { useRef, useState } from 'react'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type ImageField = Extract<SurveyField, { type: 'image_upload' }>

export function ImageUploadAnswer({ field, value, t, onChange, onUpload, disabled }: InputProps<ImageField>) {
  const urls = Array.isArray(value) ? value : []
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const room = field.maxFiles - urls.length - pending

  async function pick(files: FileList | null) {
    if (!files) return
    const list = Array.from(files).slice(0, Math.max(0, room))
    setError(null)
    let next = urls
    for (const file of list) {
      setPending((p) => p + 1)
      try {
        // Preview mode has no uploader: show the picked file locally so the flow can be rehearsed.
        const url = onUpload ? await onUpload(file) : URL.createObjectURL(file)
        next = [...next, url]
        onChange(next)
      } catch {
        setError(t.uploadFailed)
      } finally {
        setPending((p) => p - 1)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="runner__field">
      <div className="runner__thumbs">
        {urls.map((u) => (
          <div key={u} className="thumb">
            <img src={u} alt="" />
            <button
              type="button"
              className="thumb__remove"
              aria-label={t.removePhoto}
              onClick={() => onChange(urls.filter((x) => x !== u))}
              disabled={disabled}
            >
              <Icon data={Xmark} size={14} />
            </button>
          </div>
        ))}
        {Array.from({ length: pending }, (_, i) => (
          <div key={`p${i}`} className="thumb thumb_loading">
            <Loader size="s" />
          </div>
        ))}
      </div>
      {room > 0 ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={field.maxFiles > 1}
            hidden
            onChange={(e) => void pick(e.target.files)}
            disabled={disabled}
          />
          <Button size="xl" view="outlined" onClick={() => inputRef.current?.click()} disabled={disabled}>
            <Icon data={Picture} size={18} />
            {pending ? t.uploading : t.addPhoto}
          </Button>
        </>
      ) : null}
      <Text variant="caption-2" color={error ? 'danger' : 'hint'}>
        {error ?? `${urls.length} / ${field.maxFiles}`}
      </Text>
    </div>
  )
}
