import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { eventsApi } from '@/services/api'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Props { onClose: () => void }

export default function CreateEventModal({ onClose }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'conference',
    start_date: '', end_date: '', venue: '', capacity: 0, retention_years: 5,
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const mutation = useMutation({
    mutationFn: () => eventsApi.create({ ...form, start_date: new Date(form.start_date).toISOString(), end_date: new Date(form.end_date).toISOString() }),
    onSuccess: () => { toast.success('Evento creado'); onClose() },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear evento'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-serif text-lg font-bold text-primary-700">Nuevo evento</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="p-5 space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.event_type} onChange={set('event_type')}>
                {['conference', 'workshop', 'course', 'seminar', 'webinar'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cupo</label>
              <input type="number" className="input" value={form.capacity} onChange={set('capacity')} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Inicio</label>
              <input type="datetime-local" className="input" value={form.start_date} onChange={set('start_date')} required />
            </div>
            <div>
              <label className="label">Fin</label>
              <input type="datetime-local" className="input" value={form.end_date} onChange={set('end_date')} required />
            </div>
          </div>
          <div>
            <label className="label">Sede / Lugar</label>
            <input className="input" value={form.venue} onChange={set('venue')} placeholder="Nombre del lugar o enlace" />
          </div>
          <div>
            <label className="label">Retención de documentos (años)</label>
            <input type="number" className="input" value={form.retention_years} onChange={set('retention_years')} min={1} max={10} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Creando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}