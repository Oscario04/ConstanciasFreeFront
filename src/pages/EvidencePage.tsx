import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import ModulePageShell from '@/pages/modules/ModulePageShell'
import EmptyState from '@/components/shared/EmptyState'
import { evidenceApi, eventsApi } from '@/services/api'
import { FilePlus2, FileText, Image, Sheet, Trash2, UploadCloud } from 'lucide-react'

type EventItem = { id: string; title: string }

type EvidenceItem = {
  id: string
  filename?: string
  original_name?: string
  file_name?: string
  mime_type?: string
  size_bytes?: number
  size?: number
  url?: string
  file_url?: string
  created_at?: string
  uploaded_at?: string
}

const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.txt,.zip'

function getDisplayName(item: EvidenceItem) {
  return item.original_name || item.filename || item.file_name || 'archivo'
}

function getFileUrl(item: EvidenceItem) {
  return item.url || item.file_url || '#'
}

function toSizeLabel(bytes?: number) {
  if (!bytes || bytes <= 0) return '-'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function getFileIcon(mime?: string) {
  const lower = (mime || '').toLowerCase()
  if (lower.includes('image')) return <Image size={16} className="text-emerald-600" />
  if (lower.includes('sheet') || lower.includes('excel') || lower.includes('csv')) return <Sheet size={16} className="text-green-700" />
  return <FileText size={16} className="text-slate-600" />
}

export default function EvidencePage() {
  const qc = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [label, setLabel] = useState('')
  const [session, setSession] = useState('')
  const [notes, setNotes] = useState('')

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['evidence-events'],
    queryFn: async () => {
      const { data } = await eventsApi.list()
      return data
    },
  })

  const events: EventItem[] = Array.isArray(eventsData?.events)
    ? eventsData.events.map((e: any) => ({ id: e.id, title: e.title }))
    : []

  const { data: evidencesData, isLoading: evidencesLoading } = useQuery<EvidenceItem[]>({
    queryKey: ['evidences-by-event', selectedEvent],
    enabled: !!selectedEvent,
    queryFn: async () => {
      const { data } = await evidenceApi.listByEvent(selectedEvent)
      return Array.isArray(data) ? data : data?.items || []
    },
  })

  const evidences = evidencesData || []

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error('Selecciona un evento')
      if (files.length === 0) throw new Error('Selecciona al menos un archivo')

      for (const file of files) {
        await evidenceApi.upload(
          selectedEvent,
          file,
          { label: label || undefined, notes: notes || undefined, session: session || undefined },
          (percent) => setUploadProgress((prev) => ({ ...prev, [file.name]: percent }))
        )
      }
    },
    onSuccess: async () => {
      toast.success('Evidencias cargadas correctamente')
      setFiles([])
      setUploadProgress({})
      setLabel('')
      setSession('')
      setNotes('')
      await qc.invalidateQueries({ queryKey: ['evidences-by-event', selectedEvent] })
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : err.message || 'Error al subir evidencias')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.remove(id),
    onSuccess: async () => {
      toast.success('Evidencia eliminada')
      await qc.invalidateQueries({ queryKey: ['evidences-by-event', selectedEvent] })
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : err.message || 'Error al eliminar evidencia')
    },
  })

  const kpis = useMemo(
    () => [
      { label: 'Eventos disponibles', value: events.length },
      { label: 'Evidencias del evento', value: evidences.length },
      { label: 'Archivos por subir', value: files.length },
      {
        label: 'Carga promedio',
        value:
          files.length > 0
            ? `${Math.round(
                files.reduce((acc, f) => acc + (uploadProgress[f.name] || 0), 0) / files.length
              )}%`
            : '0%',
      },
    ],
    [events.length, evidences.length, files, uploadProgress]
  )

  return (
    <ModulePageShell
      title="Evidencias"
      subtitle="Carga de fotos, documentos y pruebas por evento o sesion con progreso de subida."
      kpis={kpis}
    >
      <div className="card mb-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Evento</label>
            <select
              className="input"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Selecciona un evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            {eventsLoading && <p className="mt-1 text-xs text-slate-500">Cargando eventos...</p>}
          </div>
          <div>
            <label className="label">Etiqueta (opcional)</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. evidencia final" />
          </div>
          <div>
            <label className="label">Sesion (opcional)</label>
            <input className="input" value={session} onChange={(e) => setSession(e.target.value)} placeholder="Ej. sesion 2" />
          </div>
          <div>
            <label className="label">Notas (opcional)</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Comentario breve" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FilePlus2 size={16} />
            Seleccionar archivos de evidencia
          </div>
          <input
            type="file"
            className="input"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <p className="mt-1 text-xs text-slate-500">Soporta PDF, imágenes, Excel, Word, PowerPoint, CSV, TXT y ZIP.</p>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file) => (
                <div key={file.name} className="rounded-lg bg-white p-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{file.name}</span>
                    <span>{uploadProgress[file.name] || 0}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-200">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{ width: `${uploadProgress[file.name] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={uploadMutation.isPending || !selectedEvent || files.length === 0}
              onClick={() => uploadMutation.mutate()}
            >
              <UploadCloud size={16} />
              {uploadMutation.isPending ? 'Subiendo...' : 'Subir evidencias'}
            </button>
          </div>
        </div>
      </div>

      {!selectedEvent && (
        <EmptyState
          icon={UploadCloud}
          title="Selecciona un evento"
          description="Elige un evento para ver y gestionar sus evidencias."
        />
      )}

      {selectedEvent && !evidencesLoading && evidences.length === 0 && (
        <EmptyState
          icon={UploadCloud}
          title="Sin evidencias"
          description="Este evento aun no tiene archivos de evidencia cargados."
        />
      )}

      {selectedEvent && evidencesLoading && (
        <p className="text-sm text-slate-500">Cargando evidencias del evento...</p>
      )}

      {selectedEvent && evidences.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Archivo</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Tamano</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidences.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item.mime_type)}
                        <span className="max-w-[320px] truncate text-slate-700">{getDisplayName(item)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.mime_type || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{toSizeLabel(item.size_bytes || item.size)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.created_at || item.uploaded_at || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          className="btn-secondary px-3 py-1.5 text-xs"
                          href={getFileUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver
                        </a>
                        <button
                          type="button"
                          className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ModulePageShell>
  )
}
