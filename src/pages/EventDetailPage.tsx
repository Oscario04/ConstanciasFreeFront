import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, requestsApi, documentsApi, statsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { normalizeRole } from '@/constants/roles'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, MapPin, Users, Clock, Award, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ParticipationRequest } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const isAdmin = ['admin', 'organizer'].includes(normalizeRole(user?.role))
  const qc = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => { const { data } = await eventsApi.get(id!); return data },
  })

  const { data: requests } = useQuery({
    queryKey: ['event-requests', id],
    queryFn: async () => { const { data } = await requestsApi.byEvent(id!); return data },
    enabled: isAdmin,
  })

  const { data: eventStats } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: async () => { const { data } = await statsApi.byEvent(id!); return data },
    enabled: isAdmin,
  })

  const requestMut = useMutation({
    mutationFn: (role: string) => requestsApi.create({ event_id: id, requested_role: role }),
    onSuccess: () => { toast.success('Solicitud enviada'); qc.invalidateQueries({ queryKey: ['my-requests'] }) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ reqId, status, msg }: { reqId: string; status: string; msg?: string }) =>
      requestsApi.update(reqId, { status, admin_message: msg }),
    onSuccess: () => { toast.success('Solicitud actualizada'); qc.invalidateQueries({ queryKey: ['event-requests', id] }) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
  })

  const issueMut = useMutation({
    mutationFn: ({ userId, docType }: { userId: string; docType: string }) =>
      documentsApi.issue(id!, userId, docType),
    onSuccess: () => { toast.success('Constancia emitida y enviada por correo'); qc.invalidateQueries({ queryKey: ['event-requests', id] }) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al emitir'),
  })

  const publishMut = useMutation({
    mutationFn: () => eventsApi.update(id!, { status: 'published' }),
    onSuccess: () => { toast.success('Evento publicado'); qc.invalidateQueries({ queryKey: ['event', id] }) },
  })

  if (isLoading) return <p className="text-slate-400">Cargando evento...</p>
  if (!event) return <p className="text-red-500">Evento no encontrado</p>

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full capitalize">{event.event_type}</span>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{event.status}</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-primary-700 mb-2">{event.title}</h1>
        <p className="text-slate-600">{event.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold text-slate-700">Información del evento</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Calendar size={15} />{format(new Date(event.start_date), "d MMM yyyy HH:mm", { locale: es })}</div>
              <div className="flex items-center gap-2 text-slate-600"><Clock size={15} />{format(new Date(event.end_date), "d MMM yyyy HH:mm", { locale: es })}</div>
              {event.venue && <div className="flex items-center gap-2 text-slate-600 col-span-2"><MapPin size={15} />{event.venue}</div>}
              <div className="flex items-center gap-2 text-slate-600"><Users size={15} />{event.registered} / {event.capacity > 0 ? event.capacity : '∞'} inscritos</div>
              <div className="flex items-center gap-2 text-slate-600"><Award size={15} />Retención: {event.retention_years} años</div>
            </div>
          </div>

          {/* Stats admin */}
          {isAdmin && eventStats && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-3">Estadísticas</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Solicitudes', val: eventStats.total_requests },
                  { label: 'Aprobadas', val: eventStats.approved },
                  { label: 'Rechazadas', val: eventStats.rejected },
                  { label: 'Pendientes', val: eventStats.pending },
                  { label: 'Asistentes', val: eventStats.total_attendance },
                  { label: 'Documentos', val: eventStats.total_documents },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xl font-bold text-primary-600">{val}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solicitudes admin */}
          {isAdmin && requests && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Solicitudes ({requests.length})</h2>
              <div className="space-y-3">
                {requests.length === 0 && <p className="text-slate-400 text-sm">Sin solicitudes aún.</p>}
                {requests.map((req: ParticipationRequest) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</span>
                      <p className="text-sm font-medium text-slate-700 mt-1">User: {req.user_id.slice(-6)}</p>
                      <p className="text-xs text-slate-400 capitalize">{req.requested_role}</p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => updateMut.mutate({ reqId: req.id, status: 'approved' })}
                            className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors" title="Aprobar">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => {
                            const msg = prompt('Motivo del rechazo:') || ''
                            updateMut.mutate({ reqId: req.id, status: 'rejected', msg })
                          }}
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors" title="Rechazar">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => issueMut.mutate({ userId: req.user_id, docType: 'constancia' })}
                          disabled={issueMut.isPending}
                          className="text-xs btn-accent py-1 px-3"
                        >
                          Emitir constancia
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-4">
          {event.status === 'published' && !isAdmin && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Participar</h3>
              <div className="space-y-2">
                {['assistant', 'speaker', 'staff'].map((role) => (
                  <button key={role} onClick={() => requestMut.mutate(role)}
                    disabled={requestMut.isPending}
                    className="btn-primary w-full text-sm capitalize">
                    Solicitar como {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAdmin && event.status === 'draft' && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Acciones del evento</h3>
              <button onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="btn-primary w-full text-sm">
                Publicar evento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}