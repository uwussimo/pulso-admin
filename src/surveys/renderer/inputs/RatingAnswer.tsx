import { Icon, Text } from '@gravity-ui/uikit'
import { Star, StarFill } from '@gravity-ui/icons'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type RatingField = Extract<SurveyField, { type: 'rating' }>

export function RatingAnswer({ field, value, onChange, disabled }: InputProps<RatingField>) {
  const current = typeof value === 'number' ? value : 0
  const stars = Array.from({ length: field.max }, (_, i) => i + 1)
  return (
    <div className="runner__field">
      <div className="runner__stars" role="radiogroup">
        {stars.map((n) => (
          <button
            key={n}
            type="button"
            className={['star', n <= current ? 'star_on' : ''].join(' ')}
            aria-label={`${n} / ${field.max}`}
            aria-pressed={n === current}
            onClick={() => onChange(n)}
            disabled={disabled}
          >
            <Icon data={n <= current ? StarFill : Star} size={field.max > 7 ? 28 : 36} />
          </button>
        ))}
      </div>
      <Text variant="body-1" color="secondary" className="num">
        {current ? `${current} / ${field.max}` : ' '}
      </Text>
    </div>
  )
}
