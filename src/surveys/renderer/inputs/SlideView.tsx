import { Button, Icon, Modal, Text } from '@gravity-ui/uikit'
import { ChevronLeft, ChevronRight, File, Xmark } from '@gravity-ui/icons'
import { useState } from 'react'
import type { SurveyField } from '../../schema'
import type { InputProps } from '../QuestionInput'

type SlideField = Extract<SurveyField, { type: 'slide' }>

export function SlideView({ field, t, onOpenUrl }: InputProps<SlideField>) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const slides = field.slides
  const cur = slides[index]
  if (!cur) return null
  const isPdf = cur.mime === 'application/pdf' || /\.pdf($|\?)/i.test(cur.url)

  function open(url: string) {
    if (onOpenUrl) onOpenUrl(url)
    else window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="runner__field">
      <div className="slide">
        {isPdf ? (
          <button type="button" className="slide__pdf" onClick={() => open(cur.url)}>
            <Icon data={File} size={32} />
            <Text variant="subheader-1">{cur.name || 'PDF'}</Text>
            <Text variant="body-1" color="link">
              {t.openPdf}
            </Text>
          </button>
        ) : (
          <button type="button" className="slide__img" onClick={() => setLightbox(cur.url)} aria-label={t.openImage}>
            <img src={cur.url} alt={cur.name ?? ''} />
          </button>
        )}
      </div>
      {slides.length > 1 ? (
        <div className="slide__nav">
          <Button view="flat" size="l" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            <Icon data={ChevronLeft} size={18} />
          </Button>
          <Text variant="body-1" color="secondary" className="num">
            {t.slideCounter(index + 1, slides.length)}
          </Text>
          <Button
            view="flat"
            size="l"
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={index === slides.length - 1}
          >
            <Icon data={ChevronRight} size={18} />
          </Button>
        </div>
      ) : null}
      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} contentClassName="lightbox">
        {lightbox ? <img src={lightbox} alt="" /> : null}
        <Button view="flat-contrast" size="l" className="lightbox__close" onClick={() => setLightbox(null)}>
          <Icon data={Xmark} size={20} />
        </Button>
      </Modal>
    </div>
  )
}
