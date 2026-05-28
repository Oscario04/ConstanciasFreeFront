import ModulePageShell from '@/pages/modules/ModulePageShell'
import { ShieldCheck } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'

export default function AuditPage() {
  return (
    <ModulePageShell
      title="Auditoria y Trazabilidad"
      subtitle="Seguimiento de acciones criticas: emisiones, revocaciones, firmas y accesos."
    >
      <EmptyState
        icon={ShieldCheck}
        title="Sin datos de auditoria"
        description="No hay registros de auditoria disponibles en base de datos para mostrar en esta vista."
      />
    </ModulePageShell>
  )
}
