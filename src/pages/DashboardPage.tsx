import { useQuery } from '@tanstack/react-query'
import { statsApi, eventsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { normalizeRole } from '@/constants/roles'
import { Calendar, FileText, Users, ClipboardList, CheckCircle, Clock, Award } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardStats, Event } from '@/types'

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = ['admin', 'organizer'].includes(normalizeRole(user?.role))

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      if (!isAdmin) return null as any
      const { data } = await statsApi.dashboard()
      return data
    },
    enabled: isAdmin,
  })

  const { data: eventsData } = useQuery({
    queryKey: ['events-recent'],
    queryFn: async () => {
      const { data } = await eventsApi.list('published')
      return data
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-700">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard title="Eventos" value={stats.total_events} icon={Calendar} color="bg-primary-600" />
          <StatCard title="Usuarios" value={stats.total_users} icon={Users} color="bg-indigo-500" />
          <StatCard title="Constancias" value={stats.total_documents} icon={FileText} color="bg-accent-500" />
          <StatCard title="Solicitudes" value={stats.total_requests} icon={ClipboardList} color="bg-slate-500" />
          <StatCard title="Pendientes" value={stats.pending_requests} icon={Clock} color="bg-yellow-500" />
          <StatCard title="Aprobadas" value={stats.approved_requests} icon={CheckCircle} color="bg-green-500" />
        </div>
      )}

      {/* Eventos recientes */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-slate-700 mb-4">Eventos disponibles</h2>
        {eventsData?.events?.length === 0 && (
          <div className="card text-center py-12 text-slate-400">
            <Award size={48} className="mx-auto mb-3 opacity-30" />
            <p>No hay eventos publicados en este momento.</p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {eventsData?.events?.slice(0, 6).map((event: Event) => (
            <a key={event.id} href={`/events/${event.id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                  {event.event_type}
                </span>
                <span className="text-xs text-slate-400">
                  {event.registered}/{event.capacity} inscritos
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 mt-1 line-clamp-2">{event.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(event.start_date), "d MMM yyyy", { locale: es })}
                {event.venue && ` · ${event.venue}`}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}