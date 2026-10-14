import type { Locale } from '../../api/types'
import type { RespondentStrings } from '../i18n'
import type { AnswerValue, SurveyField } from '../schema'
import { ChoiceInput } from './inputs/ChoiceInput'
import { DateAnswer } from './inputs/DateAnswer'
import { ImageUploadAnswer } from './inputs/ImageUploadAnswer'
import { NpsAnswer } from './inputs/NpsAnswer'
import { NumberAnswer } from './inputs/NumberAnswer'
import { RatingAnswer } from './inputs/RatingAnswer'
import { SlideView } from './inputs/SlideView'
import { TextAnswer } from './inputs/TextAnswer'
import { YesNoAnswer } from './inputs/YesNoAnswer'

export interface InputProps<F extends SurveyField = SurveyField> {
  field: F
  value: AnswerValue | undefined
  locale: Locale
  t: RespondentStrings
  onChange: (v: AnswerValue | undefined) => void
  onEnter: () => void
  disabled?: boolean
  onUpload?: (file: File) => Promise<string>
  onOpenUrl?: (url: string) => void
}

export function QuestionInput(props: InputProps) {
  const { field } = props
  switch (field.type) {
    case 'single_choice':
    case 'multi_choice':
      return <ChoiceInput {...props} field={field} />
    case 'text':
    case 'textarea':
      return <TextAnswer {...props} field={field} />
    case 'number':
      return <NumberAnswer {...props} field={field} />
    case 'rating':
      return <RatingAnswer {...props} field={field} />
    case 'nps':
      return <NpsAnswer {...props} field={field} />
    case 'yes_no':
      return <YesNoAnswer {...props} field={field} />
    case 'date':
      return <DateAnswer {...props} field={field} />
    case 'image_upload':
      return <ImageUploadAnswer {...props} field={field} />
    case 'slide':
      return <SlideView {...props} field={field} />
  }
}
