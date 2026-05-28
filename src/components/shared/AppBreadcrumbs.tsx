import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Eventos',
  requests: 'Solicitudes',
  documents: 'Documentos',
  attendance: 'Asistencia',
  users: 'Usuarios',
  reports: 'Reportes',
  audit: 'Auditoria',
  templates: 'Plantillas',
  certificates: 'Constancias',
  evidence: 'Evidencias',
  notifications: 'Notificaciones',
  profile: 'Perfil',
  settings: 'Configuracion',
}

export default function AppBreadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (!segments.length) return null

  return (
    <nav className="mb-4 flex items-center gap-1 overflow-x-auto text-xs text-slate-500 md:text-sm">
      <Link to="/dashboard" className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
        <Home size={13} />
        Inicio
      </Link>
      {segments.map((segment, idx) => {
        const to = `/${segments.slice(0, idx + 1).join('/')}`
        const isLast = idx === segments.length - 1
        const label = LABELS[segment] || segment

        return (
          <div className="inline-flex items-center" key={to}>
            <ChevronRight size={12} className="mx-1" />
            {isLast ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{label}</span>
            ) : (
              <Link to={to} className="rounded-md px-2 py-1 hover:bg-slate-100">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
