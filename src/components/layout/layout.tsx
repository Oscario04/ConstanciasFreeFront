import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Calendar, FileText, Users, ClipboardList,
  QrCode, LogOut, Award, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'organizer', 'speaker', 'attendee', 'staff'] },
  { to: '/events', icon: Calendar, label: 'Eventos', roles: ['admin', 'organizer', 'speaker', 'attendee', 'staff'] },
  { to: '/requests', icon: ClipboardList, label: 'Mis Solicitudes', roles: ['speaker', 'attendee', 'staff'] },
  { to: '/documents', icon: FileText, label: 'Mis Constancias', roles: ['admin', 'organizer', 'speaker', 'attendee', 'staff'] },
  { to: '/attendance', icon: QrCode, label: 'Asistencia', roles: ['admin', 'organizer', 'staff'] },
  { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin'] },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-primary-600 text-white flex flex-col transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-primary-500">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Award className="text-accent-400" size={22} />
              <span className="font-serif text-sm font-semibold leading-tight">
                Constancias<br />
                <span className="text-accent-400">y Reconocimientos</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-primary-500 rounded transition-colors ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-accent-500 text-white shadow-md'
                    : 'text-primary-100 hover:bg-primary-500 hover:text-white'
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-primary-500 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-primary-200 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 hover:bg-primary-500 rounded transition-colors" title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 hover:bg-primary-500 rounded transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}