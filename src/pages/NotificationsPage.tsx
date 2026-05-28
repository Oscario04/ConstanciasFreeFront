import ModulePageShell from '@/pages/modules/ModulePageShell'
import { BellRing } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'

export default function NotificationsPage() {
  return (
    <ModulePageShell
      title="Notificaciones"
      subtitle="Centro de alertas para solicitudes, firmas, revocaciones y cambios de estado."
    >
      <EmptyState
        icon={BellRing}
        title="Sin notificaciones"
        description="No hay notificaciones disponibles en base de datos para mostrar en esta vista."
      />
    </ModulePageShell>
  )
}
