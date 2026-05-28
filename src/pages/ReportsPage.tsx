import ModulePageShell from '@/pages/modules/ModulePageShell'
import { BarChart3 } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/services/api'

export default function ReportsPage() {
  const { data: stats } = useQuery({
    queryKey: ['reports-stats'],
    queryFn: async () => {
      const { data } = await statsApi.dashboard()
      return data
    },
  })

  const kpis = stats
    ? [
        { label: 'Eventos', value: stats.total_events },
        { label: 'Usuarios', value: stats.total_users },
        { label: 'Documentos', value: stats.total_documents },
        { label: 'Solicitudes', value: stats.total_requests },
      ]
    : []

  return (
    <ModulePageShell
      title="Reportes y Analitica"
      subtitle="Metricas institucionales, tendencias y exportaciones para direccion y organizadores."
      kpis={kpis}
    >
      {!stats && (
        <EmptyState
          icon={BarChart3}
          title="Sin datos para mostrar"
          description="No hay metricas disponibles en base de datos para este modulo."
        />
      )}
    </ModulePageShell>
  )
}
