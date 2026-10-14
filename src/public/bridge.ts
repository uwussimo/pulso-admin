import { PULSO_DEEP_LINK } from '../lib/constants'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(data: string): void }
  }
}

/** Page → app messages. Every message carries `type` so the app can switch on it. */
export type SurveyBridgeMessage =
  | { type: 'survey_ready'; survey_id: number }
  | { type: 'survey_completed'; survey_id: number; submission_id: number; credited: boolean; reward_amount: number }
  | { type: 'survey_close'; survey_id: number; reason: 'done' | 'already_completed' | 'blocked' | 'cancel' }
  | { type: 'survey_open_url'; url: string }
  | { type: 'survey_token_expired'; survey_id: number }

export function postToApp(msg: SurveyBridgeMessage): boolean {
  const bridge = window.ReactNativeWebView
  if (!bridge) return false
  try {
    bridge.postMessage(JSON.stringify(msg))
    return true
  } catch {
    return false
  }
}

export function returnToApp(msg: Extract<SurveyBridgeMessage, { type: 'survey_close' }>) {
  if (!postToApp(msg)) window.location.href = PULSO_DEEP_LINK
}

/** PDFs and images must not navigate the WebView away: in-memory answers would be lost. */
export function openExternal(url: string) {
  if (!postToApp({ type: 'survey_open_url', url })) window.open(url, '_blank', 'noopener')
}
