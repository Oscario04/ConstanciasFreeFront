import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Download, QrCode, ExternalLink, Eye } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import type { Document } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  constancia: 'Constancia', diploma: 'Diploma', reconocimiento: 'Reconocimiento',
}

function inferMimeFromUrl(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('.pdf')) return 'application/pdf'
  if (lower.includes('.png')) return 'image/png'
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg'
  if (lower.includes('.webp')) return 'image/webp'
  return ''
}

function isCrossOriginUrl(url: string) {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin !== window.location.origin
  } catch {
    return false
  }
}

export default function MyDocumentsPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: async () => {
      const { data } = await documentsApi.mine()
      return data
    },
  })

  const [qrDoc, setQrDoc] = useState<Document | null>(null)

  const closePreview = () => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  const openPreview = async (url: string) => {
    if (!url) return

    const previewCandidate = url
      .replace('/fl_attachment/', '/')
      .replace(/fl_attachment(?::[^,\/]+)?/g, '')
      .replace(/,,+/g, ',')
      .replace('/,', '/')
      .replace(',/', '/')

    if (isCrossOriginUrl(previewCandidate)) {
      setPreviewUrl(previewCandidate)
      return
    }

    setPreviewLoading(true)
    try {
      const res = await fetch(previewCandidate)
      if (!res.ok) throw new Error('No se pudo cargar el documento')

      const blob = await res.blob()
      const mime = blob.type || inferMimeFromUrl(previewCandidate) || 'application/pdf'
      const typedBlob = new Blob([blob], { type: mime })
      const localUrl = URL.createObjectURL(typedBlob)
      setPreviewUrl(localUrl)
    } catch {
      toast.error('No se pudo previsualizar este documento. Solicita endpoint inline en backend.')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (isLoading) return <p className="text-slate-400">Cargando...</p>

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-700 mb-6">Mis Constancias</h1>

      {data?.length === 0 && (
        <div className="card text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tienes documentos emitidos aún.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((doc: Document) => (
          <div key={doc.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium bg-accent-300/30 text-accent-600 px-2 py-0.5 rounded-full">
                {TYPE_LABEL[doc.document_type]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'active' ? 'badge-active' : 'badge-rejected'}`}>
                {doc.status === 'active' ? 'Activo' : 'Revocado'}
              </span>
            </div>

            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">
              {doc.metadata?.event_title || 'Evento'}
            </h3>
            <p className="text-sm text-slate-500 capitalize mb-1">
              Rol: {doc.metadata?.role}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Emitido: {format(new Date(doc.issued_at), "d 'de' MMMM yyyy", { locale: es })}
              {doc.expires_at && ` · Vigente hasta ${format(new Date(doc.expires_at), "d MMM yyyy", { locale: es })}`}
            </p>

            <div className="flex gap-2">
              {/** Prefer backend inline URL when available. */}
              <button
                type="button"
                className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                onClick={() => openPreview(doc.preview_url || `/api/documents/preview/${doc.verification_code}`)}
              >
                <Eye size={13} /> Ver
              </button>
              <a href={doc.download_url || doc.pdf_url} download
                className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1">
                <Download size={13} /> Descargar
              </a>
              <button onClick={() => setQrDoc(doc)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <QrCode size={13} /> QR
              </button>
              <a href={doc.public_url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 px-2.5">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {qrDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setQrDoc(null)}>
          <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary-700 mb-2">Código QR</h3>
            <p className="text-xs text-slate-400 mb-5">{TYPE_LABEL[qrDoc.document_type]} verificable</p>
            <div className="flex justify-center mb-5">
              <QRCodeSVG value={qrDoc.public_url} size={200} />
            </div>
            <p className="text-xs text-slate-400 break-all">{qrDoc.verification_code}</p>
            <button onClick={() => setQrDoc(null)} className="btn-secondary mt-4 w-full text-sm">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {previewLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-xl">
            <p className="text-sm text-slate-600">Cargando previsualizacion...</p>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div className="bg-white rounded-2xl p-4 md:p-8 max-w-4xl w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary-700 mb-2">Previsualizacion</h3>
            <iframe
              src={previewUrl}
              title="Previsualizacion documento"
              className="w-full h-[75vh] border rounded mb-4"
            />
            <button onClick={closePreview} className="btn-secondary w-full text-sm">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}