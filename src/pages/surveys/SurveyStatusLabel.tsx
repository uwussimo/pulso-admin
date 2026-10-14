import { Label } from '@gravity-ui/uikit'
import type { SurveyStatus } from '../../api/types'
import { surveyStatusMeta } from '../../lib/constants'

export function SurveyStatusLabel({ status, isLive }: { status: SurveyStatus; isLive?: boolean }) {
  const meta = surveyStatusMeta(status)
  // A scheduled survey whose start has passed is already shown in the app: say so instead of "Запланирован".
  if (status === 'pending' && isLive) return <Label theme="success">Идёт по расписанию</Label>
  return <Label theme={meta.theme}>{meta.label}</Label>
}
