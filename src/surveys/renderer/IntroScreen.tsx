import { Button, Label, Text } from '@gravity-ui/uikit'
import type { Locale } from '../../api/types'
import { formatSumLocale, type RespondentStrings } from '../i18n'
import { estimateMinutes, pickText } from '../schema'
import type { RunnerSurvey } from './SurveyRunner'

interface Props {
  survey: RunnerSurvey
  locale: Locale
  t: RespondentStrings
  onStart: () => void
}

export function IntroScreen({ survey, locale, t, onStart }: Props) {
  const questions = survey.schema.fields.filter((f) => f.type !== 'slide').length
  return (
    <>
      <div className="runner__main runner__main_intro">
        {survey.cover_image_url ? <img className="runner__cover" src={survey.cover_image_url} alt="" /> : null}
        <Text variant="header-2" as="h1" style={{ margin: 0 }}>
          {pickText(survey.title, locale)}
        </Text>
        {pickText(survey.description, locale) ? (
          <Text variant="body-2" color="secondary" as="p" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {pickText(survey.description, locale)}
          </Text>
        ) : null}
        <Text variant="body-1" color="secondary">
          {t.questions(questions)} · {t.takesMinutes(estimateMinutes(survey.schema.fields))}
        </Text>
        {survey.reward_amount > 0 ? (
          <Label theme="success" size="m">
            {t.rewardPill(formatSumLocale(survey.reward_amount, locale))}
          </Label>
        ) : null}
      </div>
      <div className="runner__footer">
        <Button view="action" size="xl" width="max" onClick={onStart}>
          {t.start}
        </Button>
      </div>
    </>
  )
}
