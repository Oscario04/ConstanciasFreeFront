import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, eventsApi } from '@/services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QrCode, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [userId, setUserId] = useState('')
  const qc = useQueryClient()

  const { data: eventsData } = useQuery({
    queryKey: ['events-all'],
    queryFn: async () => { const { data } = await eventsApi.list(); return data },
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return []
      const { data } = await attendanceApi.byEvent(selectedEvent)
      return data
    },
    enabled: !!selectedEvent,
  })

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn({ user_id: userId, event_id: selectedEvent, method: 'manual' }),
    onSuccess: () => { toast.success('Check-in registrado'); qc.invalidateQueries({ queryKey: ['attendance', selectedEvent] }); setUserId('') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
  })

  const checkOutMut = useMutation({
    mutationFn: (id: string) => attendanceApi.checkOut(id),
    onSuccess: () => { toast.success('Check-out registrado'); qc.invalidateQueries({ queryKey: ['attendance', selectedEvent] }) },
  })

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-700 mb-6">Control de Asistencia</h1>

      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="label">Evento</label>
            <select className="input" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">Selecciona un evento</option>
              {eventsData?.events?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ID de Usuario</label>
            <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ID del participante" />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => checkInMut.mutate()}
              disabled={!selectedEvent || !userId || checkInMut.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <UserCheck size={16} /> Registrar Check-in
            </button>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Registro de Asistencia ({attendance?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                  <th className="text-left py-2 font-medium">Usuario ID</th>
                  <th className="text-left py-2 font-medium">Método</th>
                  <th className="text-left py-2 font-medium">Check-in</th>
                  <th className="text-left py-2 font-medium">Check-out</th>
                  <th className="text-left py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">Sin registros</td></tr>
                )}
                {attendance?.map((rec: any) => (
                  <tr key={rec.id}>
                    <td className="py-2 font-mono text-xs text-slate-600">{rec.user_id.slice(-8)}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <QrCode size={12} className="text-slate-400" />
                        <span className="capitalize">{rec.method}</span>
                      </span>
                    </td>
                    <td className="py-2 text-slate-600">
                      {format(new Date(rec.check_in), "HH:mm - d MMM", { locale: es })}
                    </td>
                    <td className="py-2 text-slate-600">
                      {rec.check_out ? format(new Date(rec.check_out), "HH:mm - d MMM", { locale: es }) : (
                        <span className="badge-active">Activo</span>
                      )}
                    </td>
                    <td className="py-2">
                      {!rec.check_out && (
                        <button
                          onClick={() => checkOutMut.mutate(rec.id)}
                          disabled={checkOutMut.isPending}
                          className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <UserX size={13} /> Check-out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}