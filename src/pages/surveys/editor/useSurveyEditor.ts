import { useEffect, useMemo, useReducer } from 'react'
import type { Survey } from '../../../api/types'
import { validateSchema } from '../../../surveys/schema'
import { editorReducer, emptyEditorState, stateFromSurvey } from './editorReducer'

export function useSurveyEditor(initial: Survey | null) {
  const [state, dispatch] = useReducer(editorReducer, initial, (s) => (s ? stateFromSurvey(s) : emptyEditorState))
  const issues = useMemo(() => validateSchema({ version: 1, fields: state.fields }), [state.fields])
  const publishIssues = useMemo(() => validateSchema({ version: 1, fields: state.fields }, true), [state.fields])

  // The router is BrowserRouter (no useBlocker), so only the tab-close case can be guarded.
  useEffect(() => {
    if (!state.dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state.dirty])

  return { state, dispatch, issues, publishIssues }
}
