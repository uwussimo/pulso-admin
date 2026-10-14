import { Button, Icon, Text } from '@gravity-ui/uikit'
import { CircleCheckFill } from '@gravity-ui/icons'
import type { Locale } from '../../api/types'
import { formatSumLocale, type RespondentStrings } from '../i18n'
import type { RunnerResult } from './runnerReducer'

interface Props {
  result: RunnerResult | null
  rewardAmount: number
  locale: Locale
  t: RespondentStrings
  onReturn: () => void
}

export function DoneScreen({ result, rewardAmount, locale, t, onReturn }: Props) {
  const already = result?.already
  const amount = result?.reward_amount ?? rewardAmount
  return (
    <>
      <div className="runner__main runner__main_center">
        <span className="runner__done-mark">
          <Icon data={CircleCheckFill} size={40} />
        </span>
        <Text variant="header-2" as="h1" style={{ margin: 0, textAlign: 'center' }}>
          {already ? t.alreadyTitle : t.doneTitle}
        </Text>
        <Text variant="body-2" color="secondary" as="p" style={{ margin: 0, textAlign: 'center' }}>
          {already ? t.alreadyBody : t.doneBody}
        </Text>
        {!already && amount > 0 ? (
          <div className="runner__reward">
            <Text variant="header-1" className="num">
              +{formatSumLocale(amount, locale)}
            </Text>
            <Text variant="body-1" color="secondary">
              {result?.credited ? t.creditedNote : t.pendingNote}
            </Text>
          </div>
        ) : null}
      </div>
      <div className="runner__footer">
        <Button view="action" size="xl" width="max" onClick={onReturn}>
          {t.returnToApp}
        </Button>
      </div>
    </>
  )
}
