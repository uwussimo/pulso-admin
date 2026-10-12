import { Button, Icon, Loader, Text, useToaster } from '@gravity-ui/uikit'
import { Picture } from '@gravity-ui/icons'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { uploadApi } from '../api/upload'
import type { UploadResponse } from '../api/types'
import { errorText } from '../lib/errors'
import { renderMarkdown } from '../lib/markdown'

interface Props {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  /** Accessible name for the editor, used as the label by the wrapping Field. */
  ariaLabel?: string
}

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

/**
 * The body editor for a notification: a Markdown source box plus a live
 * rendered preview, with an image button that uploads through
 * `POST /internal/upload` and inserts the returned URL as Markdown.
 *
 * The toolbar exists because an author writing an article needs to embed a
 * picture; typing `![](/path)` by hand is not a realistic path to a body
 * with images in it.
 */
export function MarkdownEditor({ value, onChange, placeholder, rows = 10, disabled, ariaLabel }: Props) {
  const toaster = useToaster()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  const upload = useMutation<UploadResponse, Error, File>({
    mutationFn: uploadApi.image,
    onSuccess: (res) => {
      onChange(insertImage(value, res.public_url))
      toaster.add({ name: 'image-uploaded', theme: 'success', title: 'Картинка загружена' })
    },
    onError: (e) => {
      toaster.add({
        name: 'image-upload-failed',
        theme: 'danger',
        title: 'Не удалось загрузить',
        content: errorText(e),
      })
    },
  })

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    upload.mutate(file)
  }

  return (
    <div className="md-editor">
      <div className="md-editor__toolbar">
        <Button size="s" view="flat" disabled={disabled || upload.isPending} onClick={() => fileRef.current?.click()}>
          {upload.isPending ? <Loader size="s" /> : <Icon data={Picture} size={16} />}
          Вставить картинку
        </Button>
        <Button
          size="s"
          view="flat"
          selected={showPreview}
          disabled={disabled}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? 'Скрыть превью' : 'Показать превью'}
        </Button>
        <Text variant="caption-2" color="hint">
          Markdown: <code>**жирный**</code>, <code>*курсив*</code>, <code>- список</code>, картинка — кнопкой выше
        </Text>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="md-editor__file"
          onChange={onPickFile}
          tabIndex={-1}
        />
      </div>

      <textarea
        className="md-editor__input"
        value={value}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      />

      {showPreview ? (
        <div className="md-editor__preview">
          <Text variant="caption-2" color="hint" as="div">
            Так это увидит пользователь в приложении
          </Text>
          {value.trim() ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
          ) : (
            <Text color="hint" variant="body-2">
              Пока пусто — напишите текст слева.
            </Text>
          )}
        </div>
      ) : null}
    </div>
  )
}

function insertImage(source: string, url: string): string {
  const alt = altFromUrl(url)
  const line = `![${alt}](${url})`
  if (!source.trim()) return line
  const trailingNewline = source.endsWith('\n') ? '' : '\n'
  return `${source}${trailingNewline}${line}`
}

function altFromUrl(url: string): string {
  const last = url.split('/').pop() ?? ''
  const ext = last.match(/\.([a-z0-9]+)$/i)?.[1]
  return ext ? `Картинка ${ext.toUpperCase()}` : 'Картинка'
}
