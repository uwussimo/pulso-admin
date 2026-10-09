import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">
        <div className="sheet">
          <div className="sheet__content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
