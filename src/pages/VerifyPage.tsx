import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { documentsApi } from '@/services/api'
import { CheckCircle, XCircle, Award, Loader } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function VerifyPage() {
  const { code } = useParams()
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!code) return
    documentsApi.verify(code)
      .then(({ data }) => { setData(data); setStatus('valid') })
      .catch(() => setStatus('invalid'))
  }, [code])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8 text-center">
        <Award size={48} className="text-primary-600 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-primary-700 mb-2">
          Verificación de Documento
        </h1>
        <p className="text-slate-400 text-sm mb-8">Sistema de constancias y reconocimientos</p>

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader size={20} className="animate-spin" />
            <span>Verificando...</span>
          </div>
        )}

        {status === 'valid' && data && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <p className="text-green-700 font-semibold text-lg mb-6">Documento válido y auténtico</p>

            <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Tipo de documento</span>
                <p className="font-medium capitalize">{data.document_type}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Destinatario</span>
                <p className="font-medium">{data.metadata?.user_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Evento</span>
                <p className="font-medium">{data.metadata?.event_title}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Fecha de emisión</span>
                <p className="font-medium">
                  {format(new Date(data.issued_at), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              {data.expires_at && (
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Válido hasta</span>
                  <p className="font-medium">
                    {format(new Date(data.expires_at), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-red-500" />
            </div>
            <p className="text-red-700 font-semibold text-lg">Documento no encontrado</p>
            <p className="text-slate-400 text-sm mt-2">
              El código de verificación es inválido o el documento fue revocado.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}