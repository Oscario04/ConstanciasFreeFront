import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  ClipboardList,
  QrCode,
  LogOut,
  Award,
  Menu,
  X,
  Bell,
  BarChart3,
  Layers,
  UploadCloud,
  UserCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { normalizeRole, type OfficialRole } from '@/constants/roles'
import { cn } from '@/lib/cn'
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  roles: OfficialRole[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'organizer', 'assistant'] },
  { to: '/events', icon: Calendar, label: 'Eventos', roles: ['admin', 'organizer', 'assistant'] },
  { to: '/requests', icon: ClipboardList, label: 'Solicitudes', roles: ['admin', 'organizer', 'assistant'] },
  { to: '/documents', icon: FileText, label: 'Mis Documentos', roles: ['admin', 'organizer', 'assistant'] },
  { to: '/attendance', icon: QrCode, label: 'Asistencia', roles: ['admin', 'organizer'] },
  { to: '/templates', icon: Layers, label: 'Plantillas', roles: ['admin', 'organizer'] },
  { to: '/evidence', icon: UploadCloud, label: 'Evidencias', roles: ['admin', 'organizer'] },
  { to: '/reports', icon: BarChart3, label: 'Reportes', roles: ['admin', 'organizer'] },
  { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin'] },
  { to: '/notifications', icon: Bell, label: 'Notificaciones', roles: ['admin', 'organizer', 'assistant'] },
  { to: '/profile', icon: UserCircle2, label: 'Perfil', roles: ['admin', 'organizer', 'assistant'] },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const role = normalizeRole(user?.role)
  const visibleItems = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_15%_10%,#f9fbff_0%,#eef3fa_48%,#eef2f7_100%)]">
      <aside
        className={cn(
          'sticky top-0 flex h-screen flex-col border-r border-primary-500/30 bg-primary-700 text-white transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between border-b border-primary-500/40 px-3 py-5">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-accent-500/20 p-2">
                <Award className="text-accent-400" size={20} />
              </div>
              <div>
                <p className="font-serif text-sm font-semibold">UDG Prepa</p>
                <p className="text-xs text-primary-200">Constancias y Reconocimientos</p>
              </div>
            </div>
          )}
          <button
            className="rounded-md p-1 hover:bg-primary-600"
            onClick={() => setSidebarOpen((v) => !v)}
            type="button"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                    : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                )
              }
            >
              <Icon size={17} className="shrink-0" />
              {sidebarOpen && <span className="truncate font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-primary-500/40 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="text-xs capitalize text-primary-200">{role}</p>
              </div>
              <button onClick={handleLogout} className="rounded-md p-1.5 hover:bg-primary-600" title="Cerrar sesion" type="button">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="w-full rounded-md p-2 hover:bg-primary-600" onClick={handleLogout} type="button">
              <LogOut size={16} className="mx-auto" />
            </button>
          )}
        </div>
      </aside>

      <main className="max-h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          <AppBreadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  )
}