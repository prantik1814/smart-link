import { useEffect, useState, createContext, useContext } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Ticket,
  ScanLine,
  Users,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { authService } from '../../services/authService'
import { adminService } from '../../services/adminService'

const ACCENT = '#b45309'

const AdminContext = createContext({ role: null })
export const useAdminRole = () => useContext(AdminContext)

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/scan', label: 'Scanner', icon: ScanLine },
  { to: '/admin/users', label: 'Users', icon: Users, managerOnly: true },
  { to: '/admin/event', label: 'Event', icon: Settings, managerOnly: true },
]

/**
 * /admin shell — verifies session + admin role, renders nav + outlet.
 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, role: null })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const session = await authService.getSession().catch(() => null)
      if (!session) {
        if (!cancelled) setState({ loading: false, role: null })
        return
      }
      const role = await adminService.getMyRole().catch(() => null)
      if (!cancelled) setState({ loading: false, role })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    )
  }

  if (!state.role) return <Navigate to="/admin/login" replace />

  const signOut = async () => {
    await authService.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminContext.Provider value={{ role: state.role }}>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <header className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl" style={{ color: ACCENT }}>
            Concert Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {state.role}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </header>

        <nav className="border-b border-white/10 px-5 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.filter((item) => !item.managerOnly || state.role === 'manager').map(
            ({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-current text-white'
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`
                }
                style={({ isActive }) => (isActive ? { color: ACCENT } : undefined)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            )
          )}
        </nav>

        <main className="flex-1 px-5 py-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </AdminContext.Provider>
  )
}
// TODO: Add unit tests for this component
