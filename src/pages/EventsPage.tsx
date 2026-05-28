import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, requestsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { normalizeRole } from '@/constants/roles'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import type { Event } from '@/types'
import CreateEventModal from '@/components/shared/CreateEventModal'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', published: 'Publicado', ongoing: 'En curso',
  finished: 'Finalizado', archived: 'Archivado',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  ongoing: 'bg-blue-100 text-blue-700',
  finished: 'bg-purple-100 text-purple-700',
  archived: 'bg-red-100 text-red-600',
}

export default function EventsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = ['admin', 'organizer'].includes(normalizeRole(user?.role))
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['events', filter],
    queryFn: async () => {
      const { data } = await eventsApi.list(filter || undefined)
      return data
    },
  })

  const requestMut = useMutation({
    mutationFn: ({ eventId, role }: { eventId: string; role: string }) =>
      requestsApi.create({ event_id: eventId, requested_role: role }),
    onSuccess: () => { toast.success('Solicitud enviada'); qc.invalidateQueries({ queryKey: ['my-requests'] }) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al enviar solicitud'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-700">Eventos</h1>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo evento
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'published', 'ongoing', 'finished', 'draft'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'}`}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-400 text-sm">Cargando eventos...</p>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.events?.map((event: Event) => (
          <div key={event.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[event.status]}`}>
                {STATUS_LABELS[event.status]}
              </span>
              <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                {event.event_type}
              </span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{event.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{event.description}</p>

            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                {format(new Date(event.start_date), "d MMM yyyy", { locale: es })}
              </div>
              {event.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} /> {event.venue}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={13} /> {event.registered} / {event.capacity > 0 ? event.capacity : '∞'} inscritos
              </div>
            </div>

            <div className="flex gap-2">
              <a href={`/events/${event.id}`} className="btn-secondary text-xs py-1.5 flex-1 text-center">
                Ver detalle
              </a>
              {event.status === 'published' && !isAdmin && (
                <button
                  onClick={() => requestMut.mutate({ eventId: event.id, role: 'assistant' })}
                  disabled={requestMut.isPending}
                  className="btn-primary text-xs py-1.5 flex-1"
                >
                  Solicitar participar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateEventModal onClose={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['events'] }) }} />}
    </div>
  )
}