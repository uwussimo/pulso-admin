import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Flex, Loader } from '@gravity-ui/uikit'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from './AppShell'
import { LoginPage } from '../pages/login/LoginPage'
import { OverviewPage } from '../pages/overview/OverviewPage'
import { NotificationsPage } from '../pages/notifications/NotificationsPage'
import { NotificationDetailPage } from '../pages/notifications/NotificationDetailPage'
import { NotificationCreatePage } from '../pages/notifications/NotificationCreatePage'
import { VersionsPage } from '../pages/versions/VersionsPage'
import { CashbackPage } from '../pages/cashback/CashbackPage'
import { ReceiptsPage } from '../pages/receipts/ReceiptsPage'
import { ReceiptDetailPage } from '../pages/receipts/ReceiptDetailPage'
import { TransactionsPage } from '../pages/transactions/TransactionsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { UsersPage } from '../pages/users/UsersPage'
import { UserDetailPage } from '../pages/users/UserDetailPage'
import { SurveysPage } from '../pages/surveys/SurveysPage'
import { SurveyDetailPage } from '../pages/surveys/SurveyDetailPage'
import { SurveyEditorPage } from '../pages/surveys/editor/SurveyEditorPage'
import { SurveyResponsesPage } from '../pages/surveys/SurveyResponsesPage'
import { PromoPage } from '../pages/promo/PromoPage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { ExtraBenefitPage } from '../pages/extrabenefit/ExtraBenefitPage'

function FullscreenLoader() {
  return (
    <Flex centerContent style={{ height: '100vh' }}>
      <Loader size="l" />
    </Flex>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullscreenLoader />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function App() {
  const { status } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={status === 'authenticated' ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notifications/new" element={<NotificationCreatePage />} />
        <Route path="notifications/:id" element={<NotificationDetailPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/new" element={<SurveyEditorPage />} />
        <Route path="surveys/:id" element={<SurveyDetailPage />} />
        <Route path="surveys/:id/edit" element={<SurveyEditorPage />} />
        <Route path="surveys/:id/responses" element={<SurveyResponsesPage />} />
        <Route path="promo" element={<PromoPage />} />
        <Route path="extra-benefit" element={<ExtraBenefitPage />} />
        <Route path="versions" element={<VersionsPage />} />
        <Route path="cashback" element={<CashbackPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
