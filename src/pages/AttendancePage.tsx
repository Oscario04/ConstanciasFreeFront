import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, eventsApi } from '@/services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QrCode, RefreshCw, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { QRCodeSVG } from 'qrcode.react'

const QR_ROTATION_MS = 60 * 60 * 1000

function extractQrValue(data: any): string | null {
  return (
    data?.qr_value ||
    data?.qr_url ||
    data?.qr_token ||
    data?.token ||
    data?.value ||
    (typeof data === 'string' ? data : null)
  )
}

function extractExpiration(data: any, fallbackIssuedAt: number): number {
  const raw = data?.expires_at || data?.expiresAt
  const parsed = raw ? new Date(raw).getTime() : NaN
  if (!Number.isNaN(parsed)) return parsed
  return fallbackIssuedAt + QR_ROTATION_MS
}

function getAttendanceUserLabel(rec: any) {
  const firstNonEmpty = (...values: Array<unknown>) =>
    values.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined

  return (
    firstNonEmpty(
      rec.user_name,
      rec.userName,
      rec.user?.name,
      rec.name,
      rec.user_email,
      rec.userEmail,
      rec.user?.email,
    ) || 'Usuario'
  )
}

export default function AttendancePage() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [userId, setUserId] = useState('')
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null)
  const [nowTs, setNowTs] = useState<number>(() => Date.now())
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

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

  const generateQrMut = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error('Selecciona un evento')
      if (!user?.id) throw new Error('No hay usuario autenticado')
      const { data } = await attendanceApi.generateQR(selectedEvent, user.id)
      return data
    },
    onSuccess: (data: any) => {
      const issuedAt = Date.now()
      const nextValue = extractQrValue(data)
      if (!nextValue) {
        toast.error('El backend no devolvio un valor QR valido')
        return
      }

      setQrValue(nextValue)
      setQrExpiresAt(extractExpiration(data, issuedAt))
      toast.success('QR generado')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || err?.message || 'No se pudo generar QR')
    },
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setQrValue(null)
    setQrExpiresAt(null)
  }, [selectedEvent])

  useEffect(() => {
    if (!qrValue || !qrExpiresAt || !selectedEvent || !user?.id) return
    if (nowTs < qrExpiresAt) return
    if (generateQrMut.isPending) return

    generateQrMut.mutate()
  }, [nowTs, qrValue, qrExpiresAt, selectedEvent, user?.id, generateQrMut])

  const secondsLeft = useMemo(() => {
    if (!qrExpiresAt) return 0
    return Math.max(0, Math.floor((qrExpiresAt - nowTs) / 1000))
  }, [qrExpiresAt, nowTs])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

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
        <div className="card mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-700">QR de asistencia del evento</h2>
              <p className="text-sm text-slate-500">
                El QR rota cada hora; al vencer, el codigo anterior deja de ser valido.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => generateQrMut.mutate()}
              disabled={generateQrMut.isPending}
            >
              <RefreshCw size={15} className={generateQrMut.isPending ? 'animate-spin' : ''} />
              {generateQrMut.isPending ? 'Generando...' : 'Generar QR'}
            </button>
          </div>

          {qrValue ? (
            <div className="mt-4 grid gap-4 md:grid-cols-[240px,1fr] md:items-center">
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
                <QRCodeSVG value={qrValue} size={200} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vigencia restante</p>
                <p className="font-mono text-3xl font-bold text-primary-700">{mm}:{ss}</p>
                {qrExpiresAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    Expira: {format(new Date(qrExpiresAt), "HH:mm:ss", { locale: es })}
                  </p>
                )}
                <p className="mt-3 break-all text-xs text-slate-500">Valor QR: {qrValue}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Genera el QR para iniciar el control por escaneo.</p>
          )}
        </div>
      )}

      {selectedEvent && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Registro de Asistencia ({attendance?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                  <th className="text-left py-2 font-medium">Usuario</th>
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
                    <td className="py-2 text-slate-700">{getAttendanceUserLabel(rec)}</td>
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