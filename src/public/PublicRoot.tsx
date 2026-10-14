import { ThemeProvider, Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit'
import { useMemo } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RESPONDENT_STRINGS } from '../surveys/i18n'
import { BlockedScreen } from '../surveys/renderer/BlockedScreen'
import { readFragment } from './publicClient'
import { SurveyRunnerPage } from './SurveyRunnerPage'

const toaster = new Toaster()

function NotFound() {
  const t = RESPONDENT_STRINGS[readFragment().lang]
  return (
    <div className="runner">
      <BlockedScreen title={t.blocked.not_found.title} body={t.blocked.not_found.body} t={t} />
    </div>
  )
}

/** Respondent-facing tree: no admin session, no sidebar, theme from the fragment or the system. */
export function PublicRoot() {
  const theme = useMemo(() => {
    const frag = readFragment()
    if (frag.theme) return frag.theme
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])
  return (
    <ThemeProvider theme={theme}>
      <ToasterProvider toaster={toaster}>
        <BrowserRouter>
          <Routes>
            <Route path="/s/:id" element={<SurveyRunnerPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ToasterComponent />
      </ToasterProvider>
    </ThemeProvider>
  )
}
