import {
  Calendar,
  ChartColumn,
  CircleCheck,
  Font,
  Hashtag,
  Picture,
  SquareArticle,
  SquareCheck,
  Star,
  TextAlignLeft,
  ThumbsUp,
} from '@gravity-ui/icons'
import type { IconData } from '@gravity-ui/uikit'
import type { QuestionType } from './schema'

export interface FieldTypeMeta {
  type: QuestionType
  label: string
  description: string
  icon: IconData
}

/** Display order for the "Добавить вопрос" menu. */
export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: 'single_choice', label: 'Один вариант', description: 'Список вариантов, выбрать один', icon: CircleCheck },
  { type: 'multi_choice', label: 'Несколько вариантов', description: 'Можно отметить несколько', icon: SquareCheck },
  { type: 'text', label: 'Короткий текст', description: 'Одна строка', icon: Font },
  { type: 'textarea', label: 'Длинный текст', description: 'Свободный ответ в несколько строк', icon: TextAlignLeft },
  { type: 'number', label: 'Число', description: 'Числовой ответ с ограничениями', icon: Hashtag },
  { type: 'rating', label: 'Оценка (звёзды)', description: 'Шкала от 1 до N', icon: Star },
  { type: 'nps', label: 'NPS 0–10', description: 'Стандартная шкала лояльности', icon: ChartColumn },
  { type: 'yes_no', label: 'Да · Нет', description: 'Две большие кнопки', icon: ThumbsUp },
  { type: 'date', label: 'Дата', description: 'Выбор даты в календаре', icon: Calendar },
  { type: 'image_upload', label: 'Фото', description: 'Пользователь загружает фото', icon: Picture },
  { type: 'slide', label: 'Слайды', description: 'Показать картинки или PDF, без ответа', icon: SquareArticle },
]

export function fieldTypeMeta(type: QuestionType): FieldTypeMeta {
  return FIELD_TYPES.find((t) => t.type === type) ?? FIELD_TYPES[2]
}
