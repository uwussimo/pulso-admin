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
import { SettingsPage } from '../pages/settings/SettingsPage'
import {
  Promo51SoonPage,
  PromoSoonPage,
  SwitchSoonPage,
  TransactionsSoonPage,
  UpsellSoonPage,
  UsersSoonPage,
} from '../pages/soon/SoonPages'

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
        <Route path="transactions" element={<TransactionsSoonPage />} />
        <Route path="users" element={<UsersSoonPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notifications/new" element={<NotificationCreatePage />} />
        <Route path="notifications/:id" element={<NotificationDetailPage />} />
        <Route path="promo" element={<PromoSoonPage />} />
        <Route path="upsell" element={<UpsellSoonPage />} />
        <Route path="switch" element={<SwitchSoonPage />} />
        <Route path="promo-5-1" element={<Promo51SoonPage />} />
        <Route path="versions" element={<VersionsPage />} />
        <Route path="cashback" element={<CashbackPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
