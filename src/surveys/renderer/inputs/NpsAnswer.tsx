import { Text } from '@gravity-ui/uikit'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type NpsField = Extract<SurveyField, { type: 'nps' }>

export function NpsAnswer({ value, t, onChange, disabled }: InputProps<NpsField>) {
  const current = typeof value === 'number' ? value : -1
  return (
    <div className="runner__field">
      <div className="runner__nps" role="radiogroup">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            className={['nps', n === current ? 'nps_on' : ''].join(' ')}
            aria-pressed={n === current}
            onClick={() => onChange(n)}
            disabled={disabled}
          >
            <Text variant="subheader-2" className="num">
              {n}
            </Text>
          </button>
        ))}
      </div>
      <div className="runner__nps-captions">
        <Text variant="caption-2" color="hint">
          {t.npsLow}
        </Text>
        <Text variant="caption-2" color="hint">
          {t.npsHigh}
        </Text>
      </div>
    </div>
  )
}
