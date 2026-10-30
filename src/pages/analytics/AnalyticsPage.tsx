import { PageHeader } from '../../components/PageHeader'
import { AppMetrics } from './AppMetrics'

export function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Аналитика"
        description="Что происходит в приложении: кто заходит, куда, на каких устройствах и где падает. Считается по событиям приложения в PostHog."
      />
      <AppMetrics />
    </>
  )
}
