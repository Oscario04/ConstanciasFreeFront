import ModulePageShell from '@/pages/modules/ModulePageShell'
import { BadgeCheck } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/services/api'

export default function CertificatesPage() {
  const { data: documents } = useQuery({
    queryKey: ['certificates-documents'],
    queryFn: async () => {
      const { data } = await documentsApi.mine()
      return data
    },
  })

  const kpis = documents
    ? [
        { label: 'Total documentos', value: documents.length },
        { label: 'Activos', value: documents.filter((doc: any) => doc.status === 'active').length },
        { label: 'Revocados', value: documents.filter((doc: any) => doc.status === 'revoked').length },
        { label: 'Archivados', value: documents.filter((doc: any) => doc.status === 'archived').length },
      ]
    : []

  return (
    <ModulePageShell
      title="Constancias y Reconocimientos"
      subtitle="Operacion central de emision, revision, firma digital y revocacion."
      kpis={kpis}
    >
      {!documents?.length && (
        <EmptyState
          icon={BadgeCheck}
          title="Sin documentos"
          description="No hay constancias o reconocimientos en base de datos para mostrar en este modulo."
        />
      )}
    </ModulePageShell>
  )
}
