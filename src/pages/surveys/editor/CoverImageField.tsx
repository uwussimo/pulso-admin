import { Button, Icon, Loader, Text } from '@gravity-ui/uikit'
import { Picture, TrashBin } from '@gravity-ui/icons'
import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { surveysApi } from '../../../api/surveys'
import { Field } from '../../../components/Field'
import { errorText } from '../../../lib/errors'

interface Props {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function CoverImageField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useMutation({
    mutationFn: (file: File) => surveysApi.upload(file),
    onSuccess: (r) => onChange(r.public_url),
  })
  return (
    <Field
      label="Обложка"
      hint={
        upload.isError
          ? errorText(upload.error)
          : 'Покажем на экране приветствия и в списке опросов. JPG, PNG или WebP до 25 МБ.'
      }
    >
      <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
        {value ? (
          <img
            src={value}
            alt=""
            style={{
              width: '100%',
              maxWidth: 420,
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              borderRadius: 'var(--g-border-radius-l)',
              background: 'var(--g-color-base-generic)',
            }}
          />
        ) : null}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload.mutate(f)
              e.target.value = ''
            }}
          />
          <Button
            size="l"
            view="outlined"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || upload.isPending}
          >
            {upload.isPending ? <Loader size="s" /> : <Icon data={Picture} size={16} />}
            {value ? 'Заменить обложку' : 'Загрузить обложку'}
          </Button>
          {value ? (
            <Button size="l" view="flat" onClick={() => onChange('')} disabled={disabled}>
              <Icon data={TrashBin} size={16} />
              Убрать
            </Button>
          ) : null}
        </div>
        {upload.isError ? (
          <Text variant="caption-2" color="danger">
            {errorText(upload.error)}
          </Text>
        ) : null}
      </div>
    </Field>
  )
}
