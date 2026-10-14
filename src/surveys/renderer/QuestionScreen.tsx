import { Button, Progress, Text } from '@gravity-ui/uikit'
import type { Locale } from '../../api/types'
import type { RespondentStrings } from '../i18n'
import { pickText, type AnswerValue, type SurveyField } from '../schema'
import { QuestionInput } from './QuestionInput'

interface Props {
  field: SurveyField
  index: number
  total: number
  draft: AnswerValue | undefined
  error: string | null
  locale: Locale
  t: RespondentStrings
  busy: boolean
  isLast: boolean
  onDraft: (v: AnswerValue | undefined) => void
  onNext: (draft: AnswerValue | undefined) => void
  onBack: () => void
  onUpload?: (file: File) => Promise<string>
  onOpenUrl?: (url: string) => void
}

export function QuestionScreen({
  field,
  index,
  total,
  draft,
  error,
  locale,
  t,
  busy,
  isLast,
  onDraft,
  onNext,
  onBack,
  onUpload,
  onOpenUrl,
}: Props) {
  const label = pickText(field.label, locale)
  const help = pickText(field.help, locale)
  return (
    <>
      <div className="runner__progress">
        <Progress size="xs" value={(index / Math.max(1, total)) * 100} />
      </div>
      <div className="runner__main">
        <Text variant="caption-2" color="hint" as="div">
          {t.progress(index + 1, total)}
        </Text>
        <Text variant="header-2" as="h2" style={{ margin: 0 }}>
          {label}
          {field.required && field.type !== 'slide' ? <Text color="danger"> *</Text> : null}
        </Text>
        {help ? (
          <Text variant="body-2" color="secondary" as="p" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {help}
          </Text>
        ) : null}
        <QuestionInput
          field={field}
          value={draft}
          locale={locale}
          t={t}
          onChange={onDraft}
          onEnter={() => onNext(draft)}
          onUpload={onUpload}
          onOpenUrl={onOpenUrl}
          disabled={busy}
        />
        {error ? (
          <Text variant="body-2" color="danger" role="alert">
            {error}
          </Text>
        ) : null}
      </div>
      <div className="runner__footer">
        <Button view="flat" size="xl" onClick={onBack} disabled={busy}>
          {t.back}
        </Button>
        <Button
          view="action"
          size="xl"
          className="runner__next"
          onClick={() => onNext(draft)}
          loading={busy}
          disabled={busy}
        >
          {busy ? t.submitting : isLast ? t.submit : t.next}
        </Button>
      </div>
    </>
  )
}
