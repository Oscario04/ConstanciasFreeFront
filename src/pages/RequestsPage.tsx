import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import type { ParticipationRequest } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

export default function RequestsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = ['admin', 'organizer'].includes(user?.role || '')
  const qc = useQueryClient()

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const { data } = await requestsApi.mine()
      return data
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, status, msg }: { id: string; status: string; msg?: string }) =>
      requestsApi.update(id, { status, admin_message: msg }),
    onSuccess: () => { toast.success('Solicitud actualizada'); qc.invalidateQueries({ queryKey: ['my-requests'] }) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
  })

  if (isLoading) return <p className="text-slate-400">Cargando...</p>

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-700 mb-6">Mis Solicitudes</h1>

      {myRequests?.length === 0 && (
        <div className="card text-center py-12 text-slate-400">
          <p>No tienes solicitudes registradas.</p>
        </div>
      )}

      <div className="space-y-3">
        {myRequests?.map((req: ParticipationRequest) => (
          <div key={req.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <span className={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</span>
                <p className="font-medium text-slate-800 mt-2">
                  Rol: <span className="capitalize text-primary-600">{req.requested_role}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(req.created_at), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                {req.message && (
                  <p className="text-sm text-slate-600 mt-1 italic">"{req.message}"</p>
                )}
                {req.admin_message && (
                  <p className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded mt-2">
                    <strong>Admin:</strong> {req.admin_message}
                  </p>
                )}
              </div>

              {isAdmin && req.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMut.mutate({ id: req.id, status: 'approved' })}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      const msg = prompt('Motivo del rechazo (opcional):') || ''
                      updateMut.mutate({ id: req.id, status: 'rejected', msg })
                    }}
                    className="text-xs py-1.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}